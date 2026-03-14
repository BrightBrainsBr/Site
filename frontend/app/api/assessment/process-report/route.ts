/**
 * Internal background job endpoint for report generation.
 * Called from submit/regenerate routes.
 *
 * Architecture: Responds immediately after claiming the job (< 1s),
 * then runs the actual work inside after(). The after() callback runs
 * within THIS function's invocation (maxDuration=300s on Pro plan),
 * so it gets the full 5 minutes.
 *
 * Callers MUST await the trigger to ensure this endpoint receives the
 * request before their own function terminates.
 */
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { after, NextResponse } from 'next/server'

import { buildPdf } from '~/app/api/assessment/generate-pdf/pdf-helpers'
import { generateReportBackground } from '~/app/api/assessment/lib/generate-report-background'
import {
  sendErrorEmail,
  sendReportEmail,
} from '~/app/api/assessment/lib/send-email'
import type { AssessmentFormData } from '~/features/assessment/components/assessment.interface'

export const runtime = 'nodejs'
export const maxDuration = 300

const DISPATCHING_STATUS_PREFIX = 'processing_dispatching_'
const CLAIMED_STATUS_PREFIX = 'processing_claimed_'
const REPORT_STATUS_PREFIX = 'processing_report_'
const STALE_CLAIM_MS = 2 * 60 * 1000

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
  | 'processing_notify'
  | 'completed'
  | 'error'
  | (string & {})

async function updateStatus(
  sb: ReturnType<typeof createSb>,
  evaluationId: string,
  status: EvaluationProcessingStatus,
  requestId: string,
  patch: Record<string, unknown> = {}
) {
  const { error } = await sb
    .from('mental_health_evaluations')
    .update({ status, ...patch })
    .eq('id', evaluationId)
  if (error) {
    console.error(
      `[process:${requestId}] Failed status=${status}:`,
      error.message
    )
  }
}

function parsePrefixedTimestamp(status: string, prefix: string): number | null {
  if (!status.startsWith(prefix)) return null
  const raw = status.slice(prefix.length).split('_')[0]
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

function isRunningStatus(status: string | null): boolean {
  if (!status || !status.startsWith('processing')) return false
  if (status.startsWith('processing_extract_')) return true
  if (status.startsWith('processing_stage_')) return true
  if (
    status === 'processing_pdf' ||
    status === 'processing_upload' ||
    status === 'processing_notify'
  ) {
    return true
  }
  if (status.startsWith(REPORT_STATUS_PREFIX)) {
    const ts = parsePrefixedTimestamp(status, REPORT_STATUS_PREFIX)
    if (!ts) return true
    return Date.now() - ts <= STALE_CLAIM_MS
  }
  if (status.startsWith(CLAIMED_STATUS_PREFIX)) {
    const ts = parsePrefixedTimestamp(status, CLAIMED_STATUS_PREFIX)
    if (!ts) return true
    return Date.now() - ts <= STALE_CLAIM_MS
  }
  return false
}

function isClaimableStatus(status: string | null): boolean {
  if (!status || !status.startsWith('processing')) return false
  if (status === 'processing' || status === 'processing_report') return true
  if (status.startsWith(DISPATCHING_STATUS_PREFIX)) return true
  if (status.startsWith(REPORT_STATUS_PREFIX)) {
    const ts = parsePrefixedTimestamp(status, REPORT_STATUS_PREFIX)
    if (!ts) return false
    return Date.now() - ts > STALE_CLAIM_MS
  }
  if (status.startsWith(CLAIMED_STATUS_PREFIX)) {
    const ts = parsePrefixedTimestamp(status, CLAIMED_STATUS_PREFIX)
    if (!ts) return false
    return Date.now() - ts > STALE_CLAIM_MS
  }
  return false
}

/* eslint-disable complexity -- report job has many steps */
async function runReportJob(
  sb: ReturnType<typeof createSb>,
  evaluationId: string,
  mode: 'submit' | 'regenerate',
  row: {
    form_data: unknown
    scores: unknown
    doctor_uploads: unknown
    patient_name: unknown
    patient_email: unknown
    patient_phone: unknown
    patient_profile: unknown
  },
  requestId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const formData = (row.form_data ?? {}) as AssessmentFormData
  const scores = (row.scores ?? {}) as Record<string, number>
  const doctorUploads = (row.doctor_uploads ?? []) as {
    name: string
    url: string
    type?: string
  }[]
  const nome = (row.patient_name as string) || formData?.nome || ''

  const uploads =
    doctorUploads.length > 0
      ? doctorUploads.map((d) => ({ name: d.name, url: d.url, type: d.type }))
      : undefined

  const setStatus = (
    status: EvaluationProcessingStatus,
    patch: Record<string, unknown> = {}
  ) => updateStatus(sb, evaluationId, status, requestId, patch)

  const p = (msg: string) => console.warn(`[process:${requestId}] ${msg}`)

  const bgStart = Date.now()
  p(
    `▶ START ${mode.toUpperCase()} | patient="${nome}" | id=${evaluationId} | uploads=${uploads?.length ?? 0}`
  )

  try {
    await setStatus(`processing_report_${Date.now()}`, {
      processing_error: null,
    })

    p(`[1/5] Generating report via AI...`)
    const report = await generateReportBackground(
      formData,
      scores,
      uploads,
      requestId,
      (status) => setStatus(status as EvaluationProcessingStatus)
    )
    p(
      `[1/5] AI generation done (${((Date.now() - bgStart) / 1000).toFixed(1)}s)`
    )

    const today = new Date().toLocaleDateString('pt-BR')
    const reportMarkdown = report.reportMarkdown.replace(
      /\[Data (?:do relatório|atual)\]/gi,
      today
    )

    p(`[2/5] Building PDF...`)
    await setStatus('processing_pdf')
    const t2 = Date.now()
    const pdfBuffer = buildPdf(formData, reportMarkdown)
    p(
      `[2/5] PDF built — ${(pdfBuffer.byteLength / 1024).toFixed(0)}KB in ${Date.now() - t2}ms`
    )

    const fileName = `report_${evaluationId}_${Date.now()}.pdf`
    p(`[3/5] Uploading PDF to storage — ${fileName}`)
    await setStatus('processing_upload')
    const t3 = Date.now()

    const { error: uploadError } = await sb.storage
      .from('assessment-pdfs')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Erro ao fazer upload do PDF: ${uploadError.message}`)
    }
    p(`[3/5] Upload done in ${Date.now() - t3}ms`)

    const {
      data: { publicUrl },
    } = sb.storage.from('assessment-pdfs').getPublicUrl(fileName)

    if (mode === 'submit') {
      p(`[4/5] Saving report to DB...`)
      await setStatus('processing_notify', {
        report_markdown: reportMarkdown,
        report_pdf_url: publicUrl,
      })

      p(`[5/5] Sending notification email to patient/team...`)
      const t5 = Date.now()
      const reportWebhookSent = await sendReportEmail({
        patientName: nome,
        pdfUrl: publicUrl,
        evaluationId,
        patientEmail: (row.patient_email as string) || formData?.email,
        patientPhone: (row.patient_phone as string) || formData?.telefone,
        patientProfile: (row.patient_profile as string) || formData?.publico,
      })

      if (!reportWebhookSent) {
        throw new Error('Falha ao notificar webhook de relatório')
      }
      p(`[5/5] Email sent in ${Date.now() - t5}ms`)

      await setStatus('completed', {
        report_markdown: reportMarkdown,
        report_pdf_url: publicUrl,
      })
    } else {
      p(`[4/5] Saving regenerated report to DB...`)
      await setStatus('completed', {
        report_markdown: reportMarkdown,
        report_pdf_url: publicUrl,
      })
      p(`[5/5] Regenerate complete — no email sent`)
    }

    const elapsed = ((Date.now() - bgStart) / 1000).toFixed(1)
    p(`✅ DONE ${mode.toUpperCase()} | patient="${nome}" | ${elapsed}s total`)
    return { success: true }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido'
    const elapsed = ((Date.now() - bgStart) / 1000).toFixed(1)
    console.error(
      `[process:${requestId}] ❌ FAIL ${mode.toUpperCase()} | patient="${nome}" | ${elapsed}s | error: ${errorMsg}`
    )

    await setStatus('error', { processing_error: errorMsg })

    if (mode === 'submit') {
      await sendErrorEmail({
        patientName: nome,
        evaluationId,
        errorMessage: errorMsg,
        patientEmail: (row.patient_email as string) || formData?.email,
        patientPhone: (row.patient_phone as string) || formData?.telefone,
        patientProfile: (row.patient_profile as string) || formData?.publico,
      })
    }

    return { success: false, error: errorMsg }
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  const authHeader = request.headers.get('x-report-job-secret')
  const secret = process.env.REPORT_JOBS_SECRET
  if (!secret) {
    console.warn(`[process:${requestId}] REPORT_JOBS_SECRET is not configured`)
  }
  if (secret && authHeader !== secret) {
    console.warn(
      `[process:${requestId}] Unauthorized: missing or invalid secret`
    )
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { evaluationId: string; mode: 'submit' | 'regenerate' }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { evaluationId, mode } = body
  if (!evaluationId || !mode || !['submit', 'regenerate'].includes(mode)) {
    return NextResponse.json(
      { error: 'Missing evaluationId or invalid mode' },
      { status: 400 }
    )
  }

  const sb = createSb()
  const { data: row, error: fetchErr } = await sb
    .from('mental_health_evaluations')
    .select(
      'status, report_markdown, report_pdf_url, form_data, scores, doctor_uploads, patient_name, patient_email, patient_phone, patient_profile, report_history'
    )
    .eq('id', evaluationId)
    .single()

  if (fetchErr || !row) {
    console.error(`[process:${requestId}] Not found:`, evaluationId)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const currentStatus = typeof row.status === 'string' ? row.status : null

  if (
    row.report_pdf_url &&
    row.report_markdown &&
    currentStatus === 'completed'
  ) {
    return NextResponse.json({ success: true, skipped: 'already_completed' })
  }

  if (isRunningStatus(currentStatus)) {
    return NextResponse.json(
      { success: true, skipped: 'already_running', status: currentStatus },
      { status: 202 }
    )
  }

  if (!isClaimableStatus(currentStatus)) {
    console.warn(
      `[process:${requestId}] Skip non-claimable status=${String(currentStatus)} | id=${evaluationId}`
    )
    return NextResponse.json(
      { success: true, skipped: 'non_claimable_status', status: currentStatus },
      { status: 202 }
    )
  }

  const claimStatus = `${CLAIMED_STATUS_PREFIX}${Date.now()}_${requestId}`
  const { data: claimRow, error: claimError } = await sb
    .from('mental_health_evaluations')
    .update({ status: claimStatus, processing_error: null })
    .eq('id', evaluationId)
    .eq('status', currentStatus)
    .select('id')
    .maybeSingle()

  if (claimError) {
    console.error(`[process:${requestId}] Failed to claim job:`, claimError)
    return NextResponse.json({ error: 'Failed to claim job' }, { status: 500 })
  }

  if (!claimRow) {
    console.warn(
      `[process:${requestId}] Skipped — job already claimed | id=${evaluationId} | status=${currentStatus}`
    )
    return NextResponse.json(
      { success: true, skipped: 'already_claimed' },
      { status: 202 }
    )
  }

  console.warn(
    `[process:${requestId}] Job claimed | id=${evaluationId} | mode=${mode} | prev_status=${currentStatus} — responding now, work runs in after()`
  )

  after(async () => {
    await runReportJob(sb, evaluationId, mode, row, requestId)
  })

  return NextResponse.json({ success: true, claimed: true })
}
