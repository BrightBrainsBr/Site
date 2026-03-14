/* eslint-disable max-lines */
import Anthropic from '@anthropic-ai/sdk'
import { PDFDocument } from 'pdf-lib'

import type { AssessmentFormData } from '~/features/assessment/components/assessment.interface'
import { buildReportPromptData } from '~/features/assessment/helpers/build-report-data'

import {
  DOCUMENT_EXTRACTION_SYSTEM,
  DOCUMENT_EXTRACTION_USER,
  REPORT_SYSTEM,
  REPORT_USER_PREFIX,
} from './report-prompts'

const ANTHROPIC_MODEL = 'claude-sonnet-4-6'
const OPENROUTER_MODEL = 'anthropic/claude-sonnet-4-6'
const MAX_RETRIES = 3
const ANTHROPIC_MAX_DOC_BYTES = 32 * 1024 * 1024
const ANTHROPIC_MAX_IMAGE_BYTES = 20 * 1024 * 1024
const MAX_PAGES_PER_CALL = 90
const PARALLEL_CONCURRENCY = 10

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
interface LLMResult {
  content: string
  inputTokens: number
  outputTokens: number
  provider: 'anthropic' | 'openrouter'
  durationMs: number
}

function log(rid: string, msg: string) {
  console.warn(`[report:${rid}] ${msg}`)
}

function estimateCost(r: LLMResult): number {
  return (r.inputTokens * 3 + r.outputTokens * 15) / 1_000_000
}

function logLLMCall(rid: string, label: string, r: LLMResult, a: number) {
  const s = (r.durationMs / 1000).toFixed(1)
  log(
    rid,
    `${label} ✓ ${r.provider}#${a} in=${r.inputTokens} out=${r.outputTokens} $${estimateCost(r).toFixed(4)} ${s}s`
  )
}

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

const MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
}
function inferMime(u: Upload): string {
  if (u.type) return u.type
  const ext = u.name.split('.').pop()?.toLowerCase()
  return (ext && MIME_MAP[ext]) || 'application/octet-stream'
}

async function splitPdf(
  buf: Buffer,
  name: string,
  rid: string
): Promise<Buffer[]> {
  const src = await PDFDocument.load(buf, { ignoreEncryption: true })
  const pages = src.getPageCount()
  if (pages <= MAX_PAGES_PER_CALL && buf.byteLength <= ANTHROPIC_MAX_DOC_BYTES)
    return [buf]

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
  log(
    rid,
    `Split ${name} (${pages}p, ${(buf.byteLength / 1024 / 1024).toFixed(1)}MB) → ${chunks.length} chunks`
  )
  return chunks
}

function isRetryable(e: unknown): boolean {
  const m = e instanceof Error ? e.message : String(e)
  return /429|rate_limit|overloaded|500|529/.test(m)
}
function isCreditsExhausted(e: unknown): boolean {
  const m = e instanceof Error ? e.message : String(e)
  return /credit balance|billing|payment/.test(m)
}

async function callAnthropic(
  client: Anthropic,
  system: string,
  content: ContentBlock[],
  _label: string,
  _rid: string,
  maxTokens = 8192
): Promise<LLMResult> {
  const t0 = Date.now()
  const msg = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content }],
  })
  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
  return {
    content: text,
    inputTokens: msg.usage.input_tokens,
    outputTokens: msg.usage.output_tokens,
    provider: 'anthropic',
    durationMs: Date.now() - t0,
  }
}

function toOpenRouterContent(blocks: ContentBlock[]) {
  return blocks.map((b) => {
    if (b.type === 'text') return { type: 'text' as const, text: b.text }
    const url = `data:${b.source.media_type};base64,${b.source.data}`
    return { type: 'image_url' as const, image_url: { url } }
  })
}

interface OpenRouterResponse {
  choices?: { message?: { content?: string } }[]
  usage?: { prompt_tokens?: number; completion_tokens?: number }
}

async function callOpenRouter(
  system: string,
  content: ContentBlock[],
  _label: string,
  _rid: string,
  maxTokens = 8192
): Promise<LLMResult> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured')
  const t0 = Date.now()
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: toOpenRouterContent(content) },
      ],
    }),
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  const data = (await res.json()) as OpenRouterResponse
  return {
    content: data.choices?.[0]?.message?.content ?? '',
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
    provider: 'openrouter',
    durationMs: Date.now() - t0,
  }
}

async function callLLM(
  client: Anthropic,
  system: string,
  content: ContentBlock[],
  label: string,
  rid: string,
  maxTokens = 8192
): Promise<LLMResult> {
  let last: Error | null = null
  let useOpenRouter = false
  for (let a = 1; a <= MAX_RETRIES; a++) {
    try {
      const provider = useOpenRouter ? 'OpenRouter' : 'Anthropic'
      log(rid, `${label} [${provider}] attempt ${a}/${MAX_RETRIES}`)
      const result = useOpenRouter
        ? await callOpenRouter(system, content, label, rid, maxTokens)
        : await callAnthropic(client, system, content, label, rid, maxTokens)
      logLLMCall(rid, label, result, a)
      return result
    } catch (e) {
      last = e instanceof Error ? e : new Error(String(e))
      log(rid, `${label} FAIL #${a}: ${last.message.slice(0, 200)}`)
      if (!useOpenRouter && (isCreditsExhausted(e) || !isRetryable(e))) {
        const reason = isCreditsExhausted(e)
          ? 'credits exhausted'
          : 'non-retryable error'
        log(rid, `${label} → Anthropic ${reason}, switching to OpenRouter`)
        useOpenRouter = true
        continue
      }
      if (a < MAX_RETRIES) {
        const ms = isRetryable(e) ? Math.min(30_000, 5_000 * a) : 2_000 * a
        log(rid, `${label} → Retry in ${(ms / 1000).toFixed(0)}s`)
        await new Promise((r) => setTimeout(r, ms))
      }
    }
  }
  throw last!
}

interface ExtractionJob {
  label: string
  content: ContentBlock[]
}

async function prepareExtractionJobs(
  uploads: Upload[],
  rid: string
): Promise<ExtractionJob[]> {
  const jobs: ExtractionJob[] = []

  for (const file of uploads) {
    const t0 = Date.now()
    const f = await fetchBuf(file.url)
    if (!f) {
      log(rid, `FETCH FAIL: ${file.name} (skipping)`)
      continue
    }
    const mb = (f.buffer.byteLength / 1024 / 1024).toFixed(1)
    log(rid, `Fetched ${file.name} (${mb}MB) in ${Date.now() - t0}ms`)

    const mime =
      f.mime === 'application/octet-stream' ? inferMime(file) : f.mime

    if (mime === 'application/pdf') {
      const chunks = await splitPdf(f.buffer, file.name, rid)
      for (let i = 0; i < chunks.length; i++) {
        if (chunks[i].byteLength > ANTHROPIC_MAX_DOC_BYTES) {
          log(rid, `Skipping oversized chunk ${i + 1} of ${file.name}`)
          continue
        }
        const label =
          chunks.length > 1
            ? `${file.name} (part ${i + 1}/${chunks.length})`
            : file.name
        jobs.push({
          label,
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: chunks[i].toString('base64'),
              },
            },
            {
              type: 'text',
              text: DOCUMENT_EXTRACTION_USER(file.name),
            },
          ],
        })
      }
    } else if (SUPPORTED_IMAGES.includes(mime as SupportedImageMime)) {
      if (f.buffer.byteLength > ANTHROPIC_MAX_IMAGE_BYTES) {
        log(rid, `Skipping oversized image: ${file.name}`)
        continue
      }
      jobs.push({
        label: file.name,
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mime as SupportedImageMime,
              data: f.buffer.toString('base64'),
            },
          },
          {
            type: 'text',
            text: DOCUMENT_EXTRACTION_USER(file.name),
          },
        ],
      })
    } else {
      log(rid, `Unsupported type ${mime}: ${file.name} (skipping)`)
    }
  }

  return jobs
}

export async function extractAllDocuments(
  client: Anthropic,
  uploads: Upload[] | undefined,
  rid: string,
  onProgress?: ProgressCallback
): Promise<string> {
  if (!uploads?.length) return ''

  log(rid, `=== EXTRACTION PHASE: ${uploads.length} files ===`)
  const t0 = Date.now()

  const jobs = await prepareExtractionJobs(uploads, rid)
  log(rid, `Prepared ${jobs.length} jobs from ${uploads.length} files`)

  if (!jobs.length) return ''

  let completed = 0
  const total = jobs.length
  const results: (string | null)[] = new Array(jobs.length).fill(null)

  const runJob = async (idx: number) => {
    const job = jobs[idx]
    const jobT0 = Date.now()
    log(rid, `→ Extracting [${idx + 1}/${total}]: ${job.label}`)

    try {
      const result = await callLLM(
        client,
        DOCUMENT_EXTRACTION_SYSTEM,
        job.content,
        `Extract:${job.label}`,
        rid
      )
      results[idx] = `### DOCUMENTO: ${job.label}\n\n${result.content}`
      completed++
      await onProgress?.(`processing_extract_${completed}_of_${total}`)
      const secs = ((Date.now() - jobT0) / 1000).toFixed(1)
      log(rid, `✓ [${completed}/${total}] ${job.label} in ${secs}s`)
    } catch (e) {
      completed++
      const msg = e instanceof Error ? e.message : String(e)
      log(rid, `✗ [${completed}/${total}] ${job.label}: ${msg.slice(0, 150)}`)
    }
  }

  const queue = jobs.map((_, i) => i)
  const workers = Array.from(
    { length: Math.min(PARALLEL_CONCURRENCY, jobs.length) },
    async () => {
      while (queue.length > 0) {
        const idx = queue.shift()!
        await runJob(idx)
      }
    }
  )
  await Promise.all(workers)

  const extracted = results.filter(Boolean) as string[]
  log(
    rid,
    `=== EXTRACTION DONE: ${extracted.length}/${total} docs in ${((Date.now() - t0) / 1000).toFixed(1)}s ===`
  )

  if (!extracted.length) return ''
  return `\n\n---\nDADOS EXTRAÍDOS DOS DOCUMENTOS DO PACIENTE (exames, laudos, relatórios):\n\n${extracted.join('\n\n---\n\n')}`
}

async function runStages(
  patientData: string,
  extractedDocs: string,
  rid: string,
  onProgress?: ProgressCallback
): Promise<ReportResult> {
  const t0 = Date.now()
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const fullData = patientData + extractedDocs

  log(
    rid,
    `=== SINGLE REPORT CALL === patient=${patientData.length}ch docs=${extractedDocs.length}ch`
  )
  await onProgress?.('processing_stage_1_of_1')

  const res = await callLLM(
    client,
    REPORT_SYSTEM,
    [{ type: 'text', text: `${REPORT_USER_PREFIX}${fullData}` }],
    'Report (all sections)',
    rid,
    24576
  )

  log(
    rid,
    `REPORT DONE | ${((Date.now() - t0) / 1000).toFixed(1)}s | tok=${res.inputTokens}+${res.outputTokens} | $${estimateCost(res).toFixed(4)}`
  )
  return {
    reportMarkdown: res.content,
    stages: [{ stage: 1, content: res.content }],
  }
}

export async function generateReportBackground(
  formData: AssessmentFormData,
  scores: Record<string, number>,
  uploads?: Upload[],
  requestId?: string,
  onProgress?: ProgressCallback
): Promise<ReportResult> {
  const rid = requestId ?? crypto.randomUUID().slice(0, 8)
  const t0 = Date.now()
  log(
    rid,
    `START | patient=${formData.nome || '?'} | files=${uploads?.length ?? 0}`
  )

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const patientData = buildReportPromptData(formData, scores)
  const extractedDocs = await extractAllDocuments(
    client,
    uploads,
    rid,
    onProgress
  )
  log(
    rid,
    `Extraction done | ${extractedDocs.length} chars | ${((Date.now() - t0) / 1000).toFixed(1)}s`
  )

  return runStages(patientData, extractedDocs, rid, onProgress)
}

/** Runs only the report stages using pre-extracted document text (cached in DB). */
export async function generateStagesFromExtraction(
  formData: AssessmentFormData,
  scores: Record<string, number>,
  extractedDocsText: string,
  requestId?: string,
  onProgress?: ProgressCallback
): Promise<ReportResult> {
  const rid = requestId ?? crypto.randomUUID().slice(0, 8)
  return runStages(
    buildReportPromptData(formData, scores),
    extractedDocsText,
    rid,
    onProgress
  )
}
