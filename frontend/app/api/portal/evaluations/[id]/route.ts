// frontend/app/api/portal/evaluations/[id]/route.ts

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { after, NextResponse } from 'next/server'

import { triggerProcessReportJob } from '~/app/api/assessment/lib/trigger-process-report'
import type { AssessmentFormData } from '~/features/assessment/components/assessment.interface'
import type { EvaluationDetail } from '~/features/portal/portal.interface'

export const runtime = 'nodejs'
const DISPATCHING_STATUS_PREFIX = 'processing_dispatching_'
const CLAIMED_STATUS_PREFIX = 'processing_claimed_'
const REPORT_STATUS_PREFIX = 'processing_report_'
const WATCHDOG_STALE_MS = 2 * 60 * 1000

function createSb() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function parseStatusTimestamp(status: string, prefix: string): number | null {
  if (!status.startsWith(prefix)) return null
  const raw = status.slice(prefix.length).split('_')[0]
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

async function maybeRedispatchStalledJob(args: {
  sb: ReturnType<typeof createSb>
  id: string
  row: EvaluationDetail
  requestId: string
}) {
  const { sb, id, row, requestId } = args
  const status = typeof row.status === 'string' ? row.status : null
  if (!status || !status.startsWith('processing')) return
  if (row.report_pdf_url || row.report_markdown || row.processing_error) return

  const now = Date.now()

  let isStale = false
  if (status.startsWith(DISPATCHING_STATUS_PREFIX)) {
    const ts = parseStatusTimestamp(status, DISPATCHING_STATUS_PREFIX)
    isStale = ts != null && now - ts > WATCHDOG_STALE_MS
  } else if (status.startsWith(CLAIMED_STATUS_PREFIX)) {
    const ts = parseStatusTimestamp(status, CLAIMED_STATUS_PREFIX)
    isStale = ts != null && now - ts > WATCHDOG_STALE_MS
  } else if (status.startsWith(REPORT_STATUS_PREFIX)) {
    const ts = parseStatusTimestamp(status, REPORT_STATUS_PREFIX)
    isStale = ts != null && now - ts > WATCHDOG_STALE_MS
  } else if (status === 'processing' || status === 'processing_report') {
    // Legacy statuses from older deployments that did not encode timestamps.
    isStale = true
  }

  if (!isStale) return

  const dispatchingStatus = `${DISPATCHING_STATUS_PREFIX}${Date.now()}`
  const { data: claimed, error: claimError } = await sb
    .from('mental_health_evaluations')
    .update({ status: dispatchingStatus })
    .eq('id', id)
    .eq('status', status)
    .is('report_pdf_url', null)
    .is('processing_error', null)
    .select('id')
    .maybeSingle()

  if (claimError) {
    console.error(
      `[portal:${requestId}] Watchdog claim failed for ${id}:`,
      claimError.message
    )
    return
  }

  if (!claimed) return

  const hasHistory =
    Array.isArray(row.report_history) && row.report_history.length > 0
  const mode = hasHistory ? 'regenerate' : 'submit'

  console.warn(
    `[portal:${requestId}] Re-dispatching stalled report | id=${id} | from=${status} | mode=${mode}`
  )

  after(async () => {
    await triggerProcessReportJob({
      evaluationId: id,
      mode,
      requestId,
      source: 'portal-watchdog',
    })
  })
}

async function requirePortalSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('portal_session')
  if (!session?.value) {
    return null
  }
  return session.value
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const session = await requirePortalSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const sb = createSb()

    const { data, error } = await sb
      .from('mental_health_evaluations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'Not found' }, { status: 404 })
      }
      console.error('[portal/evaluations/[id]] Supabase error:', error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    await maybeRedispatchStalledJob({
      sb,
      id,
      row: data as EvaluationDetail,
      requestId,
    })

    return NextResponse.json(data as EvaluationDetail)
  } catch (err) {
    console.error('[portal/evaluations/[id]] Error:', err)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePortalSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const sb = createSb()

    const { data: row, error: fetchError } = await sb
      .from('mental_health_evaluations')
      .select('doctor_uploads')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ message: 'Not found' }, { status: 404 })
      }
      return NextResponse.json({ message: fetchError.message }, { status: 500 })
    }

    const uploads = (row?.doctor_uploads ?? []) as Array<{ path: string }>
    if (uploads.length > 0) {
      const paths = uploads.map((u) => u.path).filter(Boolean)
      if (paths.length > 0) {
        await sb.storage.from('assessment-pdfs').remove(paths)
      }
    }

    const storagePrefix = `uploads/${id}/`
    const { data: storedFiles } = await sb.storage
      .from('assessment-pdfs')
      .list(storagePrefix.replace(/\/$/, ''), { limit: 200 })
    if (storedFiles && storedFiles.length > 0) {
      await sb.storage
        .from('assessment-pdfs')
        .remove(storedFiles.map((f) => `${storagePrefix}${f.name}`))
    }

    const { error: deleteError } = await sb
      .from('mental_health_evaluations')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[portal/evaluations/[id]] Delete error:', deleteError)
      return NextResponse.json(
        { message: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[portal/evaluations/[id]] Delete error:', err)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePortalSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = (await request.json()) as {
      form_data?: Partial<AssessmentFormData>
      scores?: Record<string, number>
      changed_by?: string
    }

    if (!body.form_data || typeof body.form_data !== 'object') {
      return NextResponse.json(
        { message: 'form_data is required' },
        { status: 400 }
      )
    }

    const sb = createSb()

    const { data: currentRow, error: fetchError } = await sb
      .from('mental_health_evaluations')
      .select('form_data, scores, form_data_history')
      .eq('id', id)
      .single()

    if (fetchError || !currentRow) {
      if (fetchError?.code === 'PGRST116') {
        return NextResponse.json({ message: 'Not found' }, { status: 404 })
      }
      console.error('[portal/evaluations/[id]] Fetch error:', fetchError)
      return NextResponse.json(
        { message: fetchError?.message ?? 'Not found' },
        { status: 500 }
      )
    }

    const currentFormData = (currentRow.form_data ?? {}) as AssessmentFormData
    const mergedFormData = {
      ...currentFormData,
      ...body.form_data,
    } as AssessmentFormData

    const currentHistory = (currentRow.form_data_history ?? []) as Array<{
      timestamp: string
      changed_by: string
      changed_fields: string[]
    }>
    const newEntry = {
      timestamp: new Date().toISOString(),
      changed_by: body.changed_by ?? 'unknown',
      changed_fields: Object.keys(body.form_data),
    }
    const updatedHistory = [...currentHistory, newEntry]

    const updatePayload: Record<string, unknown> = {
      form_data: mergedFormData,
      form_data_history: updatedHistory,
    }

    if (body.scores != null) {
      updatePayload.scores = body.scores
    }

    const { error: updateError } = await sb
      .from('mental_health_evaluations')
      .update(updatePayload)
      .eq('id', id)

    if (updateError) {
      console.error('[portal/evaluations/[id]] Update error:', updateError)
      return NextResponse.json(
        { message: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[portal/evaluations/[id]] Error:', err)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
