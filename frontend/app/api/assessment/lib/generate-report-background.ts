import Anthropic from '@anthropic-ai/sdk'
import { PDFDocument } from 'pdf-lib'

import type { AssessmentFormData } from '~/features/assessment/components/assessment.interface'
import { buildReportPromptData } from '~/features/assessment/helpers/build-report-data'

import { STAGE_PROMPTS } from './report-prompts'

const MODEL = 'claude-sonnet-4-20250514'
const BETA_1M = 'context-1m-2025-08-07'
const RATE_LIMIT_RETRIES = 3
const TOKENS_PER_MINUTE = 30_000
const ANTHROPIC_MAX_DOC_BYTES = 32 * 1024 * 1024
const ANTHROPIC_MAX_IMAGE_BYTES = 20 * 1024 * 1024
const PAGES_PER_CHUNK = 90

type SupportedImageMime =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'
const SUPPORTED_IMAGES: SupportedImageMime[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

type ContentBlock =
  | { type: 'text'; text: string }
  | {
      type: 'document'
      source: {
        type: 'base64'
        media_type: 'application/pdf'
        data: string
      }
    }
  | {
      type: 'image'
      source: {
        type: 'base64'
        media_type: SupportedImageMime
        data: string
      }
    }

type Upload = { name: string; url: string; type?: string }

export interface ReportResult {
  reportMarkdown: string
  stages: { stage: number; content: string }[]
}

interface StageResult {
  content: string
  inputTokens: number
}

/* ------------------------------------------------------------------ */
/* File fetching & MIME                                                */
/* ------------------------------------------------------------------ */

async function fetchBuf(
  url: string
): Promise<{ buffer: Buffer; mime: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const raw = res.headers.get('content-type') ?? 'application/octet-stream'
    return { buffer: buf, mime: raw.split(';')[0].trim() }
  } catch {
    return null
  }
}

function inferMime(u: Upload): string {
  if (u.type) return u.type
  const ext = u.name.split('.').pop()?.toLowerCase()
  const MAP: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
  }
  return (ext && MAP[ext]) || 'application/octet-stream'
}

/* ------------------------------------------------------------------ */
/* PDF splitting (>32 MB or >90 pages → chunks)                       */
/* ------------------------------------------------------------------ */

async function splitPdf(
  buf: Buffer,
  name: string,
  rid?: string
): Promise<Buffer[]> {
  const src = await PDFDocument.load(buf, { ignoreEncryption: true })
  const pages = src.getPageCount()

  if (pages <= PAGES_PER_CHUNK && buf.byteLength <= ANTHROPIC_MAX_DOC_BYTES) {
    return [buf]
  }

  const chunks: Buffer[] = []
  for (let s = 0; s < pages; s += PAGES_PER_CHUNK) {
    const e = Math.min(s + PAGES_PER_CHUNK, pages)
    const doc = await PDFDocument.create()
    const copied = await doc.copyPages(
      src,
      Array.from({ length: e - s }, (_, i) => s + i)
    )
    for (const p of copied) doc.addPage(p)
    chunks.push(Buffer.from(await doc.save()))
  }

  const mb = (buf.byteLength / 1024 / 1024).toFixed(1)
  console.warn(
    `[bg-report:${rid}] Split ${name} (${pages}p, ${mb}MB) → ${chunks.length} chunks`
  )
  return chunks
}

/* ------------------------------------------------------------------ */
/* Build Anthropic content blocks                                     */
/* ------------------------------------------------------------------ */

async function buildBlocks(
  uploads?: Upload[],
  rid?: string
): Promise<ContentBlock[]> {
  if (!uploads?.length) return []
  const blocks: ContentBlock[] = []

  for (const file of uploads) {
    const f = await fetchBuf(file.url)
    if (!f) {
      console.warn(`[bg-report:${rid}] Fetch failed: ${file.name}`)
      continue
    }
    const mime =
      f.mime === 'application/octet-stream' ? inferMime(file) : f.mime

    if (mime === 'application/pdf') {
      for (const chunk of await splitPdf(f.buffer, file.name, rid)) {
        if (chunk.byteLength > ANTHROPIC_MAX_DOC_BYTES) continue
        blocks.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: chunk.toString('base64'),
          },
        })
      }
    } else if (SUPPORTED_IMAGES.includes(mime as SupportedImageMime)) {
      if (f.buffer.byteLength > ANTHROPIC_MAX_IMAGE_BYTES) continue
      blocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mime as SupportedImageMime,
          data: f.buffer.toString('base64'),
        },
      })
    }
  }

  console.warn(
    `[bg-report:${rid}] ${blocks.length} blocks from ${uploads.length} files`
  )
  return blocks
}

/* ------------------------------------------------------------------ */
/* Error helpers                                                      */
/* ------------------------------------------------------------------ */

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}
function isPageLimit(e: unknown) {
  const m = errMsg(e)
  return m.includes('PDF pages') || (m.includes('maximum') && m.includes('100'))
}
function isRateLimit(e: unknown) {
  const m = errMsg(e)
  return m.includes('429') || m.includes('rate_limit')
}
function isHardRateLimit(e: unknown) {
  const m = errMsg(e).toLowerCase()
  return (
    m.includes('rate limit of 0 input tokens per minute') ||
    m.includes("organization's rate limit of 0") ||
    m.includes('contact-sales')
  )
}
function isCtxLimit(e: unknown) {
  const m = errMsg(e)
  return (
    m.includes('context window') ||
    m.includes('token limit') ||
    m.includes('too many tokens') ||
    m.includes('prompt is too long')
  )
}
function b64Size(b: ContentBlock) {
  return b.type === 'document' || b.type === 'image' ? b.source.data.length : 0
}

/* ------------------------------------------------------------------ */
/* Stage caller (retries + rate-limit wait + 1M beta support)         */
/* ------------------------------------------------------------------ */

async function callStage(
  client: Anthropic,
  system: string,
  content: ContentBlock[],
  stage: number,
  rid: string,
  use1m = false
): Promise<StageResult> {
  let last: Error | null = null
  for (let a = 1; a <= RATE_LIMIT_RETRIES; a++) {
    try {
      const tag = use1m ? '[1M]' : ''
      console.warn(
        `[bg-report:${rid}] Stage ${stage}${tag} ${a}/${RATE_LIMIT_RETRIES}`
      )

      if (use1m) {
        const msg = await client.beta.messages.create({
          model: MODEL,
          betas: [BETA_1M],
          max_tokens: 8192,
          system,
          messages: [
            {
              role: 'user',
              content: content as Anthropic.Beta.BetaContentBlockParam[],
            },
          ],
        })
        const text = msg.content
          .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('')
        console.warn(
          `[bg-report:${rid}] Stage ${stage}${tag} done | in=${msg.usage.input_tokens} out=${msg.usage.output_tokens}`
        )
        return { content: text, inputTokens: msg.usage.input_tokens }
      }

      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 8192,
        system,
        messages: [{ role: 'user', content }],
      })
      const text = msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('')
      console.warn(
        `[bg-report:${rid}] Stage ${stage} done | in=${msg.usage.input_tokens} out=${msg.usage.output_tokens}`
      )
      return { content: text, inputTokens: msg.usage.input_tokens }
    } catch (e) {
      last = e instanceof Error ? e : new Error(String(e))
      console.error(
        `[bg-report:${rid}] Stage ${stage} fail #${a}:`,
        last.message
      )
      if (isPageLimit(e) || isCtxLimit(e) || isHardRateLimit(e)) throw last
      if (a < RATE_LIMIT_RETRIES) {
        const ms = isRateLimit(e) ? Math.min(30_000, 10_000 * a) : 2000 * a
        console.warn(`[bg-report:${rid}] Retry in ${(ms / 1000).toFixed(0)}s`)
        await new Promise((r) => setTimeout(r, ms))
      }
    }
  }
  throw last!
}

async function cooldown(tokens: number, rid: string) {
  if (tokens <= TOKENS_PER_MINUTE) return
  const ms = Math.ceil((tokens / TOKENS_PER_MINUTE) * 60_000) + 5_000
  console.warn(
    `[bg-report:${rid}] Cooldown ${(ms / 1000).toFixed(0)}s (${tokens} tok)`
  )
  await new Promise((r) => setTimeout(r, ms))
}

/* ------------------------------------------------------------------ */
/* Stage 1: try standard → 1M beta → progressive reduction            */
/* ------------------------------------------------------------------ */

function stage1Content(docs: ContentBlock[], text: string): ContentBlock[] {
  if (!docs.length) return [{ type: 'text' as const, text }]
  return [
    ...docs,
    {
      type: 'text' as const,
      text: `Os documentos acima foram enviados pelo paciente (transcrição da triagem, exames, laudos). Considere-os na análise.\n\n${text}`,
    },
  ]
}

async function stage1Fallback(
  client: Anthropic,
  system: string,
  docs: ContentBlock[],
  text: string,
  rid: string
): Promise<{ result: StageResult; used1m: boolean }> {
  const pool = [...docs]

  try {
    return {
      result: await callStage(
        client,
        system,
        stage1Content(pool, text),
        1,
        rid
      ),
      used1m: false,
    }
  } catch (e) {
    if (!isPageLimit(e) && !isCtxLimit(e)) throw e
    console.warn(`[bg-report:${rid}] Standard limit → escalating to 1M beta`)
  }

  try {
    return {
      result: await callStage(
        client,
        system,
        stage1Content(pool, text),
        1,
        rid,
        true
      ),
      used1m: true,
    }
  } catch (e) {
    if (!isPageLimit(e)) throw e
    console.warn(`[bg-report:${rid}] 1M also hit page limit → reducing`)
  }

  while (pool.length > 0) {
    pool.sort((a, b) => b64Size(b) - b64Size(a))
    pool.shift()
    console.warn(`[bg-report:${rid}] Docs remaining: ${pool.length}`)
    try {
      return {
        result: await callStage(
          client,
          system,
          stage1Content(pool, text),
          1,
          rid,
          true
        ),
        used1m: true,
      }
    } catch (e) {
      if (!isPageLimit(e)) throw e
    }
  }

  return {
    result: await callStage(
      client,
      system,
      stage1Content([], text),
      1,
      rid,
      true
    ),
    used1m: true,
  }
}

/* ------------------------------------------------------------------ */
/* Main                                                               */
/* ------------------------------------------------------------------ */

export async function generateReportBackground(
  formData: AssessmentFormData,
  scores: Record<string, number>,
  uploads?: Upload[],
  requestId: string = crypto.randomUUID().slice(0, 8)
): Promise<ReportResult> {
  const t0 = Date.now()
  const rid = requestId
  console.warn(
    `[bg-report:${rid}] Start | patient=${formData.nome || '?'} | files=${uploads?.length ?? 0}`
  )

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const patientData = buildReportPromptData(formData, scores)
  const docBlocks = await buildBlocks(uploads, rid)

  let prev = ''
  const stages: { stage: number; content: string }[] = []
  let use1m = false

  for (const cfg of STAGE_PROMPTS) {
    const st = Date.now()
    const txt =
      cfg.stage === 1
        ? `${cfg.userPrefix}${patientData}`
        : `${cfg.userPrefix}RELATÓRIO ANTERIOR:\n${prev}\n\nDADOS DO PACIENTE:\n${patientData}`

    let res: StageResult
    if (cfg.stage === 1) {
      const s1 = await stage1Fallback(client, cfg.system, docBlocks, txt, rid)
      res = s1.result
      use1m = s1.used1m
    } else {
      res = await callStage(
        client,
        cfg.system,
        [{ type: 'text' as const, text: txt }],
        cfg.stage,
        rid,
        use1m
      )
    }

    prev += `\n\n${res.content}`
    stages.push({ stage: cfg.stage, content: res.content })
    console.warn(`[bg-report:${rid}] Stage ${cfg.stage} ${Date.now() - st}ms`)

    if (cfg.stage < STAGE_PROMPTS.length) await cooldown(res.inputTokens, rid)
  }

  console.warn(`[bg-report:${rid}] All done | ${Date.now() - t0}ms`)
  return {
    reportMarkdown: stages.map((s) => s.content).join('\n\n---\n\n'),
    stages,
  }
}
