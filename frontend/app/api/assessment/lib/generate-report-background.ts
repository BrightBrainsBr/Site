// frontend/app/api/assessment/lib/generate-report-background.ts

import Anthropic from '@anthropic-ai/sdk'
import { PDFDocument } from 'pdf-lib'

import type { AssessmentFormData } from '~/features/assessment/components/assessment.interface'
import { buildReportPromptData } from '~/features/assessment/helpers/build-report-data'

import {
  DOCUMENT_EXTRACTION_SYSTEM,
  DOCUMENT_EXTRACTION_USER,
  STAGE_PROMPTS,
} from './report-prompts'

const MODEL = 'claude-sonnet-4-6'
const RATE_LIMIT_RETRIES = 3
const TOKENS_PER_MINUTE = 30_000
const ANTHROPIC_MAX_DOC_BYTES = 32 * 1024 * 1024
const ANTHROPIC_MAX_IMAGE_BYTES = 20 * 1024 * 1024
const MAX_PAGES_PER_CALL = 90

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

export type ProgressCallback = (status: string) => Promise<void>

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
/* PDF splitting (>32 MB or >90 pages per chunk)                       */
/* ------------------------------------------------------------------ */

async function splitPdf(
  buf: Buffer,
  name: string,
  rid?: string
): Promise<Buffer[]> {
  const src = await PDFDocument.load(buf, { ignoreEncryption: true })
  const pages = src.getPageCount()

  if (
    pages <= MAX_PAGES_PER_CALL &&
    buf.byteLength <= ANTHROPIC_MAX_DOC_BYTES
  ) {
    return [buf]
  }

  const chunks: Buffer[] = []
  for (let s = 0; s < pages; s += MAX_PAGES_PER_CALL) {
    const e = Math.min(s + MAX_PAGES_PER_CALL, pages)
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
/* Error helpers                                                      */
/* ------------------------------------------------------------------ */

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}
function isRateLimit(e: unknown) {
  const m = errMsg(e)
  return m.includes('429') || m.includes('rate_limit')
}

/* ------------------------------------------------------------------ */
/* Call Claude with retries                                            */
/* ------------------------------------------------------------------ */

async function callClaude(
  client: Anthropic,
  system: string,
  content: ContentBlock[],
  label: string,
  rid: string,
  maxTokens = 8192
): Promise<StageResult> {
  let last: Error | null = null
  for (let a = 1; a <= RATE_LIMIT_RETRIES; a++) {
    try {
      console.warn(`[bg-report:${rid}] ${label} ${a}/${RATE_LIMIT_RETRIES}`)

      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content }],
      })
      const text = msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('')
      console.warn(
        `[bg-report:${rid}] ${label} done | in=${msg.usage.input_tokens} out=${msg.usage.output_tokens}`
      )
      return { content: text, inputTokens: msg.usage.input_tokens }
    } catch (e) {
      last = e instanceof Error ? e : new Error(String(e))
      console.error(`[bg-report:${rid}] ${label} fail #${a}:`, last.message)
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
  const ms = 5_000
  console.warn(
    `[bg-report:${rid}] Cooldown 5s (${tokens} tok > ${TOKENS_PER_MINUTE} limit)`
  )
  await new Promise((r) => setTimeout(r, ms))
}

/* ------------------------------------------------------------------ */
/* Document extraction — process each file individually                */
/* ------------------------------------------------------------------ */

async function extractFromPdfChunk(
  client: Anthropic,
  chunk: Buffer,
  fileName: string,
  chunkLabel: string,
  rid: string
): Promise<string> {
  const content: ContentBlock[] = [
    {
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: chunk.toString('base64'),
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    { type: 'text', text: DOCUMENT_EXTRACTION_USER(fileName) as string },
  ]

  const result = await callClaude(
    client,
    DOCUMENT_EXTRACTION_SYSTEM,
    content,
    `Extract ${chunkLabel}`,
    rid
  )
  await cooldown(result.inputTokens, rid)
  return result.content
}

async function extractFromImage(
  client: Anthropic,
  buffer: Buffer,
  mime: SupportedImageMime,
  fileName: string,
  rid: string
): Promise<string> {
  const content: ContentBlock[] = [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: mime,
        data: buffer.toString('base64'),
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    { type: 'text', text: DOCUMENT_EXTRACTION_USER(fileName) as string },
  ]

  const result = await callClaude(
    client,
    DOCUMENT_EXTRACTION_SYSTEM,
    content,
    `Extract image ${fileName}`,
    rid
  )
  await cooldown(result.inputTokens, rid)
  return result.content
}

async function extractAllDocuments(
  client: Anthropic,
  uploads: Upload[] | undefined,
  rid: string,
  onProgress?: ProgressCallback
): Promise<string> {
  if (!uploads?.length) return ''

  const extractions: string[] = []
  const total = uploads.length

  for (let fileIdx = 0; fileIdx < uploads.length; fileIdx++) {
    const file = uploads[fileIdx]
    await onProgress?.(`processing_extract_${fileIdx + 1}_of_${total}`)

    const f = await fetchBuf(file.url)
    if (!f) {
      console.warn(`[bg-report:${rid}] Fetch failed: ${file.name}`)
      continue
    }
    const mime =
      f.mime === 'application/octet-stream' ? inferMime(file) : f.mime

    if (mime === 'application/pdf') {
      const chunks = await splitPdf(f.buffer, file.name, rid)
      for (let i = 0; i < chunks.length; i++) {
        if (chunks[i].byteLength > ANTHROPIC_MAX_DOC_BYTES) {
          console.warn(
            `[bg-report:${rid}] Skipping oversized chunk ${i + 1} of ${file.name}`
          )
          continue
        }
        const label =
          chunks.length > 1
            ? `${file.name} (parte ${i + 1}/${chunks.length})`
            : file.name
        const text = await extractFromPdfChunk(
          client,
          chunks[i],
          file.name,
          label,
          rid
        )
        extractions.push(`### DOCUMENTO: ${label}\n\n${text}`)
      }
    } else if (SUPPORTED_IMAGES.includes(mime as SupportedImageMime)) {
      if (f.buffer.byteLength > ANTHROPIC_MAX_IMAGE_BYTES) {
        console.warn(
          `[bg-report:${rid}] Skipping oversized image: ${file.name}`
        )
        continue
      }
      const text = await extractFromImage(
        client,
        f.buffer,
        mime as SupportedImageMime,
        file.name,
        rid
      )
      extractions.push(`### DOCUMENTO (imagem): ${file.name}\n\n${text}`)
    } else {
      console.warn(
        `[bg-report:${rid}] Unsupported file type ${mime}: ${file.name}`
      )
    }
  }

  if (!extractions.length) return ''

  console.warn(
    `[bg-report:${rid}] Extracted content from ${extractions.length} document(s)`
  )
  return `\n\n---\nDADOS EXTRAÍDOS DOS DOCUMENTOS DO PACIENTE (exames, laudos, relatórios):\n\n${extractions.join('\n\n---\n\n')}`
}

/* ------------------------------------------------------------------ */
/* Main                                                               */
/* ------------------------------------------------------------------ */

export async function generateReportBackground(
  formData: AssessmentFormData,
  scores: Record<string, number>,
  uploads?: Upload[],
  requestId: string = crypto.randomUUID().slice(0, 8),
  onProgress?: ProgressCallback
): Promise<ReportResult> {
  const t0 = Date.now()
  const rid = requestId
  console.warn(
    `[bg-report:${rid}] Start | patient=${formData.nome || '?'} | files=${uploads?.length ?? 0}`
  )

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const patientData = buildReportPromptData(formData, scores)

  const extractedDocs = await extractAllDocuments(
    client,
    uploads,
    rid,
    onProgress
  )
  console.warn(
    `[bg-report:${rid}] Extraction done | ${Date.now() - t0}ms | ${extractedDocs.length} chars`
  )

  const fullPatientData = patientData + extractedDocs

  let prev = ''
  const stages: { stage: number; content: string }[] = []

  for (const cfg of STAGE_PROMPTS) {
    const st = Date.now()
    await onProgress?.(
      `processing_stage_${cfg.stage}_of_${STAGE_PROMPTS.length}`
    )

    const txt =
      cfg.stage === 1
        ? `${cfg.userPrefix}${fullPatientData}`
        : `${cfg.userPrefix}RELATÓRIO ANTERIOR:\n${prev}\n\nDADOS DO PACIENTE:\n${fullPatientData}`

    const res = await callClaude(
      client,
      cfg.system,
      [{ type: 'text' as const, text: txt }],
      `Stage ${cfg.stage}`,
      rid
    )

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
