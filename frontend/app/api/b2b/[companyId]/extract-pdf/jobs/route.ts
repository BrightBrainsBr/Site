// frontend/app/api/b2b/[companyId]/extract-pdf/jobs/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { after, NextResponse } from 'next/server'

import { getB2BUser } from '../../../lib/getB2BUser'
import { processExtractionJob } from './[jobId]/process/processJob'

export const runtime = 'nodejs'
export const maxDuration = 300

const TAG = '[extract-pdf/jobs]'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST — Upload multiple PDFs, create job rows, trigger async processing.
 * Returns immediately with job IDs so the client can poll.
 *
 * Processing runs directly in after() — no self-referencing HTTP calls
 * that would be blocked by Vercel preview auth.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const t0 = Date.now()
  const { companyId } = await params

  console.warn(`${TAG} POST START company=${companyId}`)

  const auth = await getB2BUser(request, companyId)
  if (!auth.ok) {
    console.warn(
      `${TAG} AUTH FAILED company=${companyId} status=${auth.status}`
    )
    return NextResponse.json(auth.body, { status: auth.status })
  }

  console.warn(
    `${TAG} AUTH OK user=${auth.userId} isPortal=${auth.isPortalAdmin ?? false}`
  )

  const formData = await request.formData()
  const files = formData.getAll('files') as File[]
  const extractionType =
    (formData.get('extractionType') as string) ?? 'events-bulk'

  if (!files.length) {
    console.warn(`${TAG} NO FILES company=${companyId}`)
    return NextResponse.json(
      { error: 'Nenhum arquivo enviado' },
      { status: 400 }
    )
  }

  console.warn(
    `${TAG} UPLOADING ${files.length} file(s): ${files.map((f) => `"${f.name}" (${f.size} bytes)`).join(', ')}`
  )

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
      console.error(
        `${TAG} STORAGE UPLOAD FAILED job=${jobId} file="${file.name}" error="${uploadError.message}"`
      )
      continue
    }

    const { error: insertError } = await sb.from('pdf_extraction_jobs').insert({
      id: jobId,
      company_id: companyId,
      file_name: file.name,
      storage_path: storagePath,
      extraction_type: extractionType,
      status: 'pending',
      created_by: auth.ok && !auth.isPortalAdmin ? auth.userId : null,
    })

    if (insertError) {
      console.error(
        `${TAG} DB INSERT FAILED job=${jobId} file="${file.name}" error="${insertError.message}"`
      )
      continue
    }

    console.warn(`${TAG} JOB CREATED job=${jobId} file="${file.name}"`)
    jobs.push({ id: jobId, fileName: file.name, status: 'pending' })
  }

  if (jobs.length === 0) {
    console.error(
      `${TAG} ALL UPLOADS FAILED company=${companyId} total=${Date.now() - t0}ms`
    )
    return NextResponse.json(
      { error: 'Falha ao processar todos os arquivos' },
      { status: 500 }
    )
  }

  console.warn(
    `${TAG} SCHEDULING ${jobs.length} job(s) via after() total=${Date.now() - t0}ms`
  )

  after(async () => {
    console.warn(
      `${TAG} after() TRIGGERED — processing ${jobs.length} job(s) directly`
    )

    for (const job of jobs) {
      console.warn(`${TAG} after() PROCESSING job=${job.id}`)
      try {
        await processExtractionJob(companyId, job.id)
        console.warn(`${TAG} after() DONE job=${job.id}`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`${TAG} after() FAILED job=${job.id} error="${msg}"`)
      }
    }

    console.warn(`${TAG} after() ALL DONE`)
  })

  console.warn(
    `${TAG} RESPONSE 201 jobs=${jobs.map((j) => j.id).join(',')} total=${Date.now() - t0}ms`
  )
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
    .select(
      'id, file_name, status, result, error_message, warnings, confidence, updated_at'
    )
    .eq('company_id', companyId)
    .in('id', ids)

  if (error) {
    console.error(`${TAG} GET error ids=${idsParam}`, error)
    return NextResponse.json(
      { error: 'Erro ao buscar status dos jobs' },
      { status: 500 }
    )
  }

  return NextResponse.json({ jobs: jobs ?? [] })
}
