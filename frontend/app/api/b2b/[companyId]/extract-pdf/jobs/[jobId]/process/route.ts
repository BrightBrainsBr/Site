// frontend/app/api/b2b/[companyId]/extract-pdf/jobs/[jobId]/process/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { extractEventsFromPdfWithGemini } from '~/agents/pdf-extraction/services/pdf-extraction.gemini'

export const runtime = 'nodejs'
export const maxDuration = 300

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? 'pdf-jobs-internal'

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
  const { companyId, jobId } = await params

  const secret = request.headers.get('x-internal-secret')
  if (secret !== INTERNAL_SECRET) {
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
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (job.status !== 'pending') {
    return NextResponse.json({ status: job.status })
  }

  await sb
    .from('pdf_extraction_jobs')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', jobId)

  try {
    const { data: fileData, error: downloadError } = await sb.storage
      .from('events-pdfs')
      .download(job.storage_path)

    if (downloadError || !fileData) {
      throw new Error(
        `Failed to download PDF: ${downloadError?.message ?? 'no data'}`
      )
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())

    const { extracted, confidence, warnings } =
      await extractEventsFromPdfWithGemini(buffer, job.file_name)

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

    return NextResponse.json({ status: 'completed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[extract-pdf/process] job=${jobId}`, message)

    await sb
      .from('pdf_extraction_jobs')
      .update({
        status: 'failed',
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    return NextResponse.json({ status: 'failed', error: message })
  }
}
