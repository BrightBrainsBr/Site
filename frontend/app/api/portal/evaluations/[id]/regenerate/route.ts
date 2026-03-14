import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { triggerProcessReportJob } from '~/app/api/assessment/lib/trigger-process-report'

export const runtime = 'nodejs'
export const maxDuration = 60

function createSb() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type EvaluationProcessingStatus =
  | 'processing'
  | 'processing_report'
  | 'processing_pdf'
  | 'processing_upload'
  | 'completed'
  | 'error'
  | (string & {})

async function updateEvaluationStatus(
  sb: ReturnType<typeof createSb>,
  evaluationId: string,
  status: EvaluationProcessingStatus,
  requestId: string,
  patch: Record<string, unknown> = {}
) {
  const { error } = await sb
    .from('mental_health_evaluations')
    .update({
      status,
      ...patch,
    })
    .eq('id', evaluationId)

  if (error) {
    console.error(
      `[regenerate:${requestId}] Failed to set status=${status}:`,
      error.message
    )
  }
}

async function requirePortalSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('portal_session')
  return session?.value ?? null
}

export async function POST(
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

    const { data: row, error: fetchErr } = await sb
      .from('mental_health_evaluations')
      .select(
        'form_data, scores, doctor_uploads, status, report_markdown, report_pdf_url, report_history'
      )
      .eq('id', id)
      .single()

    if (fetchErr || !row) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const body = (await _request.json().catch(() => ({}))) as {
      force?: boolean
    }

    if (
      typeof row.status === 'string' &&
      row.status.startsWith('processing') &&
      !body.force
    ) {
      return NextResponse.json(
        {
          error: 'Relatório já está sendo gerado. Use "force" para reiniciar.',
        },
        { status: 409 }
      )
    }

    // Archive current report before regenerating
    const existingHistory = (row.report_history ?? []) as {
      report_markdown: string
      report_pdf_url: string | null
      generated_at: string
    }[]

    if (row.report_markdown) {
      existingHistory.push({
        report_markdown: row.report_markdown as string,
        report_pdf_url: (row.report_pdf_url as string) ?? null,
        generated_at: new Date().toISOString(),
      })
    }

    const dispatchingStatus = `processing_dispatching_${Date.now()}`

    await updateEvaluationStatus(sb, id, dispatchingStatus, requestId, {
      report_history: existingHistory,
      processing_error: null,
    })

    const doctorUploads = (row.doctor_uploads ?? []) as {
      name: string
      url: string
      type: string
    }[]

    console.warn(
      `[regenerate:${requestId}] Starting regeneration for ${id} | uploads=${doctorUploads.length} | history=${existingHistory.length} — triggering background job`
    )

    const trigger = await triggerProcessReportJob({
      evaluationId: id,
      mode: 'regenerate',
      requestId,
      source: 'regenerate',
    })

    if (!trigger.ok) {
      console.error(
        `[regenerate:${requestId}] Trigger failed | id=${id} | ${trigger.detail}`
      )
    }

    return NextResponse.json({
      status: 'processing_report',
      requestId,
      triggered: trigger.ok,
    })
  } catch (err) {
    console.error(`[regenerate:${requestId}] Error:`, err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
