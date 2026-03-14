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

const BUCKET = 'assessment-pdfs'

function extractStoragePath(publicUrl: string): string {
  const marker = `/object/public/${BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return ''
  return publicUrl.slice(idx + marker.length)
}

function createSb() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)

  try {
    const body = await request.json()
    const { formData, scores, uploads } = body as {
      formData: AssessmentFormData
      scores: Record<string, number>
      uploads?: { name: string; url: string; type?: string }[]
    }

    const nome = formData?.nome || ''
    if (!nome) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    console.warn(
      `[submit:${requestId}] Saving evaluation | patient=${nome} | uploads=${uploads?.length ?? 0}`
    )

    const sb = createSb()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { uploads: _stripUploads, ...cleanFormData } = formData

    const doctorUploads =
      uploads && uploads.length > 0
        ? uploads.map((u) => ({
            name: u.name,
            url: u.url,
            type: u.type || 'application/pdf',
            path: extractStoragePath(u.url),
            uploaded_at: new Date().toISOString(),
          }))
        : null

    const { data: row, error } = await sb
      .from('mental_health_evaluations')
      .insert({
        patient_name: nome,
        patient_email: formData.email || null,
        patient_cpf: formData.cpf?.replace(/\D/g, '') || null,
        patient_phone: formData.telefone || null,
        patient_birth_date: formData.nascimento || null,
        patient_sex: formData.sexo || null,
        patient_profile: (formData.publico as string) || null,
        form_data: cleanFormData,
        scores,
        status: `processing_dispatching_${Date.now()}`,
        doctor_uploads: doctorUploads,
      })
      .select('id')
      .single()

    if (error) {
      console.error(`[submit:${requestId}] Supabase insert error:`, error)
      throw new Error('Erro ao salvar avaliação')
    }

    const evaluationId = row.id
    console.warn(
      `[submit:${requestId}] ✅ Evaluation saved | patient="${nome}" | id=${evaluationId} — job will run in after()`
    )

    after(async () => {
      const p = (msg: string) => console.warn(`[submit:${requestId}] ${msg}`)
      const bgStart = Date.now()

      p(
        `▶ START SUBMIT | patient="${nome}" | id=${evaluationId} | uploads=${uploads?.length ?? 0}`
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

        p(`[1/5] Generating report via AI...`)
        const report = await generateReportBackground(
          cleanFormData as AssessmentFormData,
          scores,
          uploads,
          requestId,
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
        const pdfBuffer = buildPdf(
          cleanFormData as AssessmentFormData,
          reportMarkdown
        )
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
          patientEmail: formData.email,
          patientPhone: formData.telefone,
          patientProfile: formData.publico as string,
        })

        if (!reportWebhookSent) {
          throw new Error('Falha ao notificar webhook de relatório')
        }
        p(`[5/5] Email sent in ${Date.now() - t5}ms`)

        await setStatus('completed', {
          report_markdown: reportMarkdown,
          report_pdf_url: publicUrl,
        })

        const elapsed = ((Date.now() - bgStart) / 1000).toFixed(1)
        p(`✅ DONE SUBMIT | patient="${nome}" | ${elapsed}s total`)
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Erro desconhecido'
        const elapsed = ((Date.now() - bgStart) / 1000).toFixed(1)
        console.error(
          `[submit:${requestId}] ❌ FAIL SUBMIT | patient="${nome}" | ${elapsed}s | error: ${errorMsg}`
        )

        await setStatus('error', { processing_error: errorMsg })

        await sendErrorEmail({
          patientName: nome,
          evaluationId,
          errorMessage: errorMsg,
          patientEmail: formData.email,
          patientPhone: formData.telefone,
          patientProfile: formData.publico as string,
        })
      }
    })

    return NextResponse.json({
      evaluationId,
      status: 'processing_report',
    })
  } catch (err) {
    console.error(`[submit:${requestId}] Request failed:`, err)
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
