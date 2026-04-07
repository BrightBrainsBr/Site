// frontend/app/api/b2b/[companyId]/extract-pdf/jobs/[jobId]/process/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { extractEventsFromPdfWithGemini } from '~/agents/pdf-extraction/services/pdf-extraction.gemini'
import { ensureTracingFlushed } from '~/agents/shared/tracing'

export const runtime = 'nodejs'
export const maxDuration = 300

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? 'pdf-jobs-internal'

const TAG = '[extract-pdf/process]'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST — Triggered internally by the jobs route via after().
 * Downloads the PDF from storage, sends it to Gemini, and writes
 * the result back to pdf_extraction_jobs.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; jobId: string }> }
) {
  const t0 = Date.now()
  const { companyId, jobId } = await params

  console.warn(`${TAG} START job=${jobId} company=${companyId}`)

  const secret = request.headers.get('x-internal-secret')
  if (secret !== INTERNAL_SECRET) {
    console.error(
      `${TAG} AUTH FAILED job=${jobId} — x-internal-secret mismatch (received=${secret ? 'present-but-wrong' : 'missing'}, expected_env_set=${!!process.env.INTERNAL_API_SECRET})`
    )
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = getSupabase()

  const { data: job, error: fetchError } = await sb
    .from('pdf_extraction_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('company_id', companyId)
    .single()

  if (fetchError || !job) {
    console.error(
      `${TAG} JOB NOT FOUND job=${jobId} error=${fetchError?.message ?? 'null'}`
    )
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (job.status !== 'pending') {
    console.warn(`${TAG} SKIP job=${jobId} already status=${job.status}`)
    return NextResponse.json({ status: job.status })
  }

  console.warn(
    `${TAG} PROCESSING job=${jobId} file="${job.file_name}" path="${job.storage_path}"`
  )

  await sb
    .from('pdf_extraction_jobs')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', jobId)

  try {
    const tDownload = Date.now()
    const { data: fileData, error: downloadError } = await sb.storage
      .from('events-pdfs')
      .download(job.storage_path)

    if (downloadError || !fileData) {
      throw new Error(
        `Failed to download PDF: ${downloadError?.message ?? 'no data'}`
      )
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    console.warn(
      `${TAG} DOWNLOADED job=${jobId} size=${buffer.length} bytes in ${Date.now() - tDownload}ms`
    )

    const tGemini = Date.now()
    console.warn(
      `${TAG} GEMINI START job=${jobId} apiKey=${process.env.GEMINI_API_KEY ? 'set' : 'MISSING'}`
    )

    const { extracted, confidence, warnings } =
      await extractEventsFromPdfWithGemini(buffer, job.file_name)

    const eventsCount = extracted?.events?.length ?? 0
    console.warn(
      `${TAG} GEMINI DONE job=${jobId} events=${eventsCount} confidence=${confidence} warnings=${JSON.stringify(warnings)} in ${Date.now() - tGemini}ms`
    )

    await sb
      .from('pdf_extraction_jobs')
      .update({
        status: 'completed',
        result: extracted,
        confidence,
        warnings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    console.warn(`${TAG} COMPLETED job=${jobId} total=${Date.now() - t0}ms`)

    await ensureTracingFlushed()

    return NextResponse.json({ status: 'completed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error(
      `${TAG} FAILED job=${jobId} error="${message}" total=${Date.now() - t0}ms`
    )
    if (stack) console.error(`${TAG} STACK job=${jobId}`, stack)

    await sb
      .from('pdf_extraction_jobs')
      .update({
        status: 'failed',
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    await ensureTracingFlushed()

    return NextResponse.json({ status: 'failed', error: message })
  }
}
