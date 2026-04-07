// frontend/app/api/b2b/[companyId]/extract-pdf/jobs/[jobId]/process/processJob.ts

import { createClient } from '@supabase/supabase-js'

import { extractEventsFromPdfWithGemini } from '~/agents/pdf-extraction/services/pdf-extraction.gemini'
import { ensureTracingFlushed } from '~/agents/shared/tracing'

const TAG = '[extract-pdf/process]'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Core processing logic for a single PDF extraction job.
 * Called directly from after() in the jobs route — no HTTP round-trip.
 */
export async function processExtractionJob(
  companyId: string,
  jobId: string
): Promise<void> {
  const t0 = Date.now()
  console.warn(`${TAG} START job=${jobId} company=${companyId}`)

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
    return
  }

  if (job.status !== 'pending') {
    console.warn(`${TAG} SKIP job=${jobId} already status=${job.status}`)
    return
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
  }
}
