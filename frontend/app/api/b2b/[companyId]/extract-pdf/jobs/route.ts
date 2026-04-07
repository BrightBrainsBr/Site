// frontend/app/api/b2b/[companyId]/extract-pdf/jobs/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { after, NextResponse } from 'next/server'

import { getB2BUser } from '../../../lib/getB2BUser'

export const runtime = 'nodejs'

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? 'pdf-jobs-internal'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST — Upload multiple PDFs, create job rows, trigger async processing.
 * Returns immediately with job IDs so the client can poll.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const auth = await getB2BUser(request, companyId)
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status })
  }

  const formData = await request.formData()
  const files = formData.getAll('files') as File[]
  const extractionType =
    (formData.get('extractionType') as string) ?? 'events-bulk'

  if (!files.length) {
    return NextResponse.json(
      { error: 'Nenhum arquivo enviado' },
      { status: 400 }
    )
  }

  const sb = getSupabase()
  const jobs: Array<{ id: string; fileName: string; status: string }> = []

  for (const file of files) {
    const jobId = crypto.randomUUID()
    const storagePath = `${companyId}/${jobId}/${file.name}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await sb.storage
      .from('events-pdfs')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('[extract-pdf/jobs] upload failed', uploadError)
      continue
    }

    const { error: insertError } = await sb
      .from('pdf_extraction_jobs')
      .insert({
        id: jobId,
        company_id: companyId,
        file_name: file.name,
        storage_path: storagePath,
        extraction_type: extractionType,
        status: 'pending',
        created_by:
          auth.ok && !auth.isPortalAdmin ? auth.userId : null,
      })

    if (insertError) {
      console.error('[extract-pdf/jobs] insert failed', insertError)
      continue
    }

    jobs.push({ id: jobId, fileName: file.name, status: 'pending' })
  }

  if (jobs.length === 0) {
    return NextResponse.json(
      { error: 'Falha ao processar todos os arquivos' },
      { status: 500 }
    )
  }

  // Use request origin so async `after()` callbacks hit this dev server on whatever port is in use.
  const origin = new URL(request.url).origin

  after(async () => {
    for (const job of jobs) {
      try {
        await fetch(
          `${origin}/api/b2b/${companyId}/extract-pdf/jobs/${job.id}/process`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': INTERNAL_SECRET,
            },
          }
        )
      } catch (err) {
        console.error(`[extract-pdf/jobs] trigger process failed ${job.id}`, err)
      }
    }
  })

  return NextResponse.json({ jobs }, { status: 201 })
}

/**
 * GET — Poll job statuses. Query param: ids=uuid1,uuid2,...
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const auth = await getB2BUser(request, companyId)
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status })
  }

  const { searchParams } = new URL(request.url)
  const idsParam = searchParams.get('ids')
  if (!idsParam) {
    return NextResponse.json({ error: 'ids é obrigatório' }, { status: 400 })
  }

  const ids = idsParam.split(',').filter(Boolean)
  const sb = getSupabase()

  const { data: jobs, error } = await sb
    .from('pdf_extraction_jobs')
    .select('id, file_name, status, result, error_message, warnings, confidence, updated_at')
    .eq('company_id', companyId)
    .in('id', ids)

  if (error) {
    console.error('[extract-pdf/jobs] GET error', error)
    return NextResponse.json(
      { error: 'Erro ao buscar status dos jobs' },
      { status: 500 }
    )
  }

  return NextResponse.json({ jobs: jobs ?? [] })
}
