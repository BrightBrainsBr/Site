/* eslint-disable max-lines */
import Anthropic from '@anthropic-ai/sdk'
import { PDFDocument } from 'pdf-lib'

import type { AssessmentFormData } from '~/features/assessment/components/assessment.interface'
import { buildReportPromptData } from '~/features/assessment/helpers/build-report-data'

import {
  DOCUMENT_EXTRACTION_SYSTEM,
  DOCUMENT_EXTRACTION_USER,
  STAGE_1_SYSTEM,
  STAGE_1_USER_PREFIX,
  STAGE_2_SYSTEM,
  STAGE_2_USER_PREFIX,
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
export type LogCallback = (message: string) => Promise<void>

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
  label: string,
  rid: string,
  maxTokens = 8192,
  onLog?: LogCallback
): Promise<LLMResult> {
  const t0 = Date.now()
  const startMsg = `[Anthropic] Streaming… model=${ANTHROPIC_MODEL}`
  log(rid, `${label} ${startMsg}`)
  await onLog?.(startMsg)

  const stream = client.messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content }],
  })

  let outputTokens = 0
  let lastLog = Date.now()
  const LOG_INTERVAL = 15_000

  stream.on('text', () => {
    outputTokens++
    const now = Date.now()
    if (now - lastLog > LOG_INTERVAL) {
      const elapsed = ((now - t0) / 1000).toFixed(0)
      const msg = `[Anthropic] ${outputTokens} tokens recebidos (${elapsed}s)`
      log(rid, `${label} ${msg}`)
      void onLog?.(msg)
      lastLog = now
    }
  })

  const finalMsg = await stream.finalMessage()

  const text = finalMsg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
  const doneMsg = `[Anthropic] ✓ ${finalMsg.usage.output_tokens} tokens em ${elapsed}s (stop=${finalMsg.stop_reason})`
  log(rid, `${label} ${doneMsg}`)
  await onLog?.(doneMsg)

  return {
    content: text,
    inputTokens: finalMsg.usage.input_tokens,
    outputTokens: finalMsg.usage.output_tokens,
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

interface SSEAccumulator {
  chunks: string[]
  tokenCount: number
  inputTokens: number
  outputTokens: number
}

function parseSSELine(line: string, acc: SSEAccumulator) {
  const trimmed = line.trim()
  if (!trimmed || !trimmed.startsWith('data: ')) return
  const payload = trimmed.slice(6)
  if (payload === '[DONE]') return
  try {
    const evt = JSON.parse(payload) as {
      choices?: { delta?: { content?: string } }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }
    const delta = evt.choices?.[0]?.delta?.content
    if (delta) {
      acc.chunks.push(delta)
      acc.tokenCount++
    }
    if (evt.usage) {
      acc.inputTokens = evt.usage.prompt_tokens ?? 0
      acc.outputTokens = evt.usage.completion_tokens ?? 0
    }
  } catch {
    // skip malformed SSE lines
  }
}

async function callOpenRouter(
  system: string,
  content: ContentBlock[],
  label: string,
  rid: string,
  maxTokens = 8192,
  onLog?: LogCallback
): Promise<LLMResult> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured')
  const t0 = Date.now()
  const startMsg = `[OpenRouter] Streaming… model=${OPENROUTER_MODEL}`
  log(rid, `${label} ${startMsg}`)
  await onLog?.(startMsg)

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      max_tokens: maxTokens,
      stream: true,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: toOpenRouterContent(content) },
      ],
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`OpenRouter ${res.status}: ${errBody.slice(0, 300)}`)
  }

  if (!res.body) throw new Error('OpenRouter returned no stream body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  const acc: SSEAccumulator = {
    chunks: [],
    tokenCount: 0,
    inputTokens: 0,
    outputTokens: 0,
  }
  let lastLog = Date.now()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) parseSSELine(line, acc)

    const now = Date.now()
    if (now - lastLog > 15_000) {
      const msg = `[OpenRouter] ${acc.tokenCount} chunks recebidos (${((now - t0) / 1000).toFixed(0)}s)`
      log(rid, `${label} ${msg}`)
      void onLog?.(msg)
      lastLog = now
    }
  }

  const text = acc.chunks.join('')
  if (!acc.outputTokens) acc.outputTokens = acc.tokenCount
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
  const doneMsg = `[OpenRouter] ✓ ${acc.outputTokens} tokens em ${elapsed}s`
  log(rid, `${label} ${doneMsg}`)
  await onLog?.(doneMsg)

  return {
    content: text,
    inputTokens: acc.inputTokens,
    outputTokens: acc.outputTokens,
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
  maxTokens = 8192,
  onLog?: LogCallback
): Promise<LLMResult> {
  const callStart = Date.now()
  const inputSize = content.reduce(
    (acc, b) => acc + ('text' in b ? b.text.length : 0),
    0
  )
  log(rid, `${label} START | inputChars=${inputSize} maxTokens=${maxTokens}`)

  let last: Error | null = null
  let useOpenRouter = false

  for (let a = 1; a <= MAX_RETRIES; a++) {
    const provider = useOpenRouter ? 'OpenRouter' : 'Anthropic'
    try {
      log(rid, `${label} attempt ${a}/${MAX_RETRIES} [${provider}]`)
      const result = useOpenRouter
        ? await callOpenRouter(system, content, label, rid, maxTokens, onLog)
        : await callAnthropic(
            client,
            system,
            content,
            label,
            rid,
            maxTokens,
            onLog
          )
      logLLMCall(rid, label, result, a)

      if (!result.content || result.content.length < 50) {
        log(rid, `${label} ⚠ short response (${result.content.length}ch)`)
      }

      return result
    } catch (e) {
      last = e instanceof Error ? e : new Error(String(e))
      const elapsed = ((Date.now() - callStart) / 1000).toFixed(1)
      const errMsg = `❌ ${provider} falhou (#${a}): ${last.message.slice(0, 150)}`
      log(rid, `${label} ${errMsg} (${elapsed}s)`)
      await onLog?.(errMsg)

      if (!useOpenRouter && (isCreditsExhausted(e) || !isRetryable(e))) {
        const reason = isCreditsExhausted(e)
          ? 'credits exhausted'
          : 'non-retryable'
        log(rid, `${label} → switching to OpenRouter (${reason})`)
        await onLog?.(`Alternando para OpenRouter (${reason})`)
        useOpenRouter = true
        continue
      }
      if (a < MAX_RETRIES) {
        const ms = isRetryable(e) ? Math.min(30_000, 5_000 * a) : 2_000 * a
        log(rid, `${label} → retry in ${(ms / 1000).toFixed(0)}s...`)
        await new Promise((r) => setTimeout(r, ms))
      }
    }
  }

  const totalElapsed = ((Date.now() - callStart) / 1000).toFixed(1)
  log(rid, `${label} ALL ATTEMPTS FAILED after ${totalElapsed}s`)
  await onLog?.(`☠ Todas tentativas falharam após ${totalElapsed}s`)
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
  onProgress?: ProgressCallback,
  onLog?: LogCallback
): Promise<string> {
  if (!uploads?.length) return ''

  log(rid, `=== EXTRACTION PHASE: ${uploads.length} files ===`)
  await onLog?.(`Iniciando extração de ${uploads.length} documentos`)
  const t0 = Date.now()

  const jobs = await prepareExtractionJobs(uploads, rid)
  log(rid, `Prepared ${jobs.length} jobs from ${uploads.length} files`)

  if (!jobs.length) return ''

  let completed = 0
  const total = jobs.length

  await onLog?.(`${total} documentos preparados para extração (paralelo)`)
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
        rid,
        8192,
        onLog
      )
      results[idx] = `### DOCUMENTO: ${job.label}\n\n${result.content}`
      completed++
      await onProgress?.(`processing_extract_${completed}_of_${total}`)
      const secs = ((Date.now() - jobT0) / 1000).toFixed(1)
      log(rid, `✓ [${completed}/${total}] ${job.label} in ${secs}s`)
      await onLog?.(`✓ Doc ${completed}/${total}: ${job.label} (${secs}s)`)
    } catch (e) {
      completed++
      const msg = e instanceof Error ? e.message : String(e)
      log(rid, `✗ [${completed}/${total}] ${job.label}: ${msg.slice(0, 150)}`)
      await onLog?.(
        `✗ Doc ${completed}/${total}: ${job.label} FALHOU: ${msg.slice(0, 80)}`
      )
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
  const secs = ((Date.now() - t0) / 1000).toFixed(1)
  log(
    rid,
    `=== EXTRACTION DONE: ${extracted.length}/${total} docs in ${secs}s ===`
  )
  await onLog?.(
    `✅ Extração completa: ${extracted.length}/${total} docs em ${secs}s`
  )

  if (!extracted.length) return ''
  return `\n\n---\nDADOS EXTRAÍDOS DOS DOCUMENTOS DO PACIENTE (exames, laudos, relatórios):\n\n${extracted.join('\n\n---\n\n')}`
}

/**
 * Stage 1: Sections 1–5 (Clinical Analysis).
 * Receives FULL data (patient + extracted documents).
 */
export async function runReportStage1(
  formData: AssessmentFormData,
  scores: Record<string, number>,
  extractedDocsText: string,
  requestId?: string,
  onProgress?: ProgressCallback,
  onLog?: LogCallback
): Promise<string> {
  const rid = requestId ?? crypto.randomUUID().slice(0, 8)
  const t0 = Date.now()
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const patientData = buildReportPromptData(formData, scores)
  const fullData = patientData + extractedDocsText
  const userPrompt = `${STAGE_1_USER_PREFIX}${fullData}`

  log(rid, `=== STAGE 1 (sections 1-5) === input=${userPrompt.length}ch`)
  await onLog?.(
    `Stage 1 (seções 1-5): ${(userPrompt.length / 1000).toFixed(0)}k chars`
  )
  await onProgress?.('processing_stage_1_of_2')

  const res = await callLLM(
    client,
    STAGE_1_SYSTEM,
    [{ type: 'text', text: userPrompt }],
    'Stage1',
    rid,
    12288,
    onLog
  )

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
  const cost = estimateCost(res).toFixed(4)
  log(rid, `✅ STAGE 1 DONE | ${elapsed}s | out=${res.outputTokens} | $${cost}`)
  await onLog?.(`✅ Seções 1-5 prontas em ${elapsed}s ($${cost})`)
  return res.content
}

/**
 * Stage 2: Sections 6–10 (Treatment & Monitoring).
 * Receives patient data + stage 1 output. Does NOT receive raw extracted docs.
 */
export async function runReportStage2(
  formData: AssessmentFormData,
  scores: Record<string, number>,
  stage1Output: string,
  requestId?: string,
  onProgress?: ProgressCallback,
  onLog?: LogCallback
): Promise<string> {
  const rid = requestId ?? crypto.randomUUID().slice(0, 8)
  const t0 = Date.now()
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const patientData = buildReportPromptData(formData, scores)
  const userPrompt = `${STAGE_2_USER_PREFIX}DADOS DO PACIENTE:\n${patientData}\n\n---\nANÁLISE CLÍNICA (seções 1-5):\n${stage1Output}`

  log(rid, `=== STAGE 2 (sections 6-10) === input=${userPrompt.length}ch`)
  await onLog?.(
    `Stage 2 (seções 6-10): ${(userPrompt.length / 1000).toFixed(0)}k chars`
  )
  await onProgress?.('processing_stage_2_of_2')

  const res = await callLLM(
    client,
    STAGE_2_SYSTEM,
    [{ type: 'text', text: userPrompt }],
    'Stage2',
    rid,
    12288,
    onLog
  )

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
  const cost = estimateCost(res).toFixed(4)
  log(rid, `✅ STAGE 2 DONE | ${elapsed}s | out=${res.outputTokens} | $${cost}`)
  await onLog?.(`✅ Seções 6-10 prontas em ${elapsed}s ($${cost})`)
  return res.content
}
