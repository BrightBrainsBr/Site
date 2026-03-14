/**
 * Second-phase endpoint: runs report stages + PDF + upload.
 *
 * Called by submit/regenerate after extraction is saved to DB.
 * Responds immediately, runs work in after() with its own maxDuration=300.
 */
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { after, NextResponse } from 'next/server'

import { buildPdf } from '~/app/api/assessment/generate-pdf/pdf-helpers'
import { generateStagesFromExtraction } from '~/app/api/assessment/lib/generate-report-background'
import {
  sendErrorEmail,
  sendReportEmail,
} from '~/app/api/assessment/lib/send-email'
import type { AssessmentFormData } from '~/features/assessment/components/assessment.interface'

export const runtime = 'nodejs'
export const maxDuration = 300

function createSb() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/* eslint-disable complexity */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  let body: {
    evaluationId: string
    mode: 'submit' | 'regenerate'
    callerRequestId?: string
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { evaluationId, mode, callerRequestId } = body
  const rid = callerRequestId ?? requestId
  if (!evaluationId || !['submit', 'regenerate'].includes(mode)) {
    return NextResponse.json(
      { error: 'Missing evaluationId or invalid mode' },
      { status: 400 }
    )
  }

  const sb = createSb()
  const { data: row, error: fetchErr } = await sb
    .from('mental_health_evaluations')
    .select(
      'status, form_data, scores, extracted_documents_text, patient_name, patient_email, patient_phone, patient_profile'
    )
    .eq('id', evaluationId)
    .single()

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const currentStatus = typeof row.status === 'string' ? row.status : ''
  if (!currentStatus.startsWith('processing')) {
    return NextResponse.json(
      { error: 'Not in processing state' },
      { status: 409 }
    )
  }

  if (!row.extracted_documents_text && row.extracted_documents_text !== '') {
    return NextResponse.json(
      { error: 'No cached extraction found' },
      { status: 400 }
    )
  }

  console.warn(
    `[generate-stages:${rid}] Claimed | id=${evaluationId} | mode=${mode} | extraction=${(row.extracted_documents_text as string).length}ch — responding now, stages run in after()`
  )

  after(async () => {
    const p = (msg: string) => console.warn(`[generate-stages:${rid}] ${msg}`)
    const bgStart = Date.now()
    const formData = (row.form_data ?? {}) as AssessmentFormData
    const scores = (row.scores ?? {}) as Record<string, number>
    const extractedText = (row.extracted_documents_text as string) ?? ''
    const nome = (row.patient_name as string) || formData?.nome || ''

    p(
      `▶ START STAGES ${mode.toUpperCase()} | patient="${nome}" | id=${evaluationId} | extractedText=${extractedText.length}ch`
    )

    const setStatus = async (
      status: string,
      patch: Record<string, unknown> = {}
    ) => {
      const { error: upErr } = await sb
        .from('mental_health_evaluations')
        .update({ status, ...patch })
        .eq('id', evaluationId)
      if (upErr) p(`Failed to set status=${status}: ${upErr.message}`)
    }

    try {
      await setStatus(`processing_report_${Date.now()}`, {
        processing_error: null,
      })

      p(`[1/5] Generating report from cached extraction...`)
      const report = await generateStagesFromExtraction(
        formData,
        scores,
        extractedText,
        rid,
        (status) => setStatus(status)
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

        p(`[5/5] Sending notification email...`)
        const t5 = Date.now()
        const sent = await sendReportEmail({
          patientName: nome,
          pdfUrl: publicUrl,
          evaluationId,
          patientEmail: (row.patient_email as string) || formData?.email,
          patientPhone: (row.patient_phone as string) || formData?.telefone,
          patientProfile:
            (row.patient_profile as string) || (formData?.publico as string),
        })
        if (!sent) throw new Error('Falha ao notificar webhook de relatório')
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
      p(
        `✅ DONE STAGES ${mode.toUpperCase()} | patient="${nome}" | ${elapsed}s total`
      )
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido'
      const elapsed = ((Date.now() - bgStart) / 1000).toFixed(1)
      console.error(
        `[generate-stages:${rid}] ❌ FAIL STAGES ${mode.toUpperCase()} | patient="${nome}" | ${elapsed}s | error: ${errorMsg}`
      )
      await setStatus('error', { processing_error: errorMsg })

      if (mode === 'submit') {
        await sendErrorEmail({
          patientName: nome,
          evaluationId,
          errorMessage: errorMsg,
          patientEmail: (row.patient_email as string) || formData?.email,
          patientPhone: (row.patient_phone as string) || formData?.telefone,
          patientProfile:
            (row.patient_profile as string) || (formData?.publico as string),
        })
      }
    }
  })

  return NextResponse.json({ success: true, claimed: true })
}
