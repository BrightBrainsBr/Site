import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { after, NextResponse } from 'next/server'

import type { AssessmentFormData } from '~/features/assessment/components/assessment.interface'

import { buildPdf } from '../generate-pdf/pdf-helpers'
import { generateReportBackground } from '../lib/generate-report-background'
import { sendErrorEmail, sendReportEmail } from '../lib/send-email'

export const runtime = 'nodejs'
export const maxDuration = 300

function createSupabaseClient() {
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

async function updateEvaluationStatus(
  sb: ReturnType<typeof createSupabaseClient>,
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
      `[bg:${requestId}] Failed to set status=${status}:`,
      error.message
    )
  }
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

    const sb = createSupabaseClient()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { uploads: _stripUploads, ...cleanFormData } = formData

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
        status: 'processing_report',
      })
      .select('id')
      .single()

    if (error) {
      console.error(`[submit:${requestId}] Supabase insert error:`, error)
      throw new Error('Erro ao salvar avaliação')
    }

    const evaluationId = row.id
    console.warn(
      `[submit:${requestId}] Evaluation saved | id=${evaluationId} — starting background processing`
    )

    after(async () => {
      const bgStart = Date.now()
      const bgSb = createSupabaseClient()

      const setStatus = async (
        status: EvaluationProcessingStatus,
        patch: Record<string, unknown> = {}
      ) => {
        await updateEvaluationStatus(
          bgSb,
          evaluationId,
          status,
          requestId,
          patch
        )
      }

      console.warn(
        `[bg:${requestId}] Background processing started for ${evaluationId}`
      )

      try {
        await setStatus('processing_report')

        const report = await generateReportBackground(
          formData,
          scores,
          uploads,
          requestId
        )

        console.warn(
          `[bg:${requestId}] Report generated | ${Date.now() - bgStart}ms — generating PDF`
        )

        const today = new Date().toLocaleDateString('pt-BR')
        const reportMarkdown = report.reportMarkdown.replace(
          /\[Data (?:do relatório|atual)\]/gi,
          today
        )

        await setStatus('processing_pdf')
        const pdfBuffer = buildPdf(formData, reportMarkdown)

        const fileName = `report_${evaluationId}_${Date.now()}.pdf`
        await setStatus('processing_upload')

        const { error: uploadError } = await bgSb.storage
          .from('assessment-pdfs')
          .upload(fileName, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: false,
          })

        if (uploadError) {
          console.error(`[bg:${requestId}] PDF upload error:`, uploadError)
          throw new Error('Erro ao fazer upload do PDF')
        }

        const {
          data: { publicUrl },
        } = bgSb.storage.from('assessment-pdfs').getPublicUrl(fileName)

        await setStatus('processing_notify', {
          report_markdown: reportMarkdown,
          report_pdf_url: publicUrl,
        })

        console.warn(
          `[bg:${requestId}] PDF ready | pdf=${publicUrl} | elapsed=${Date.now() - bgStart}ms`
        )

        const reportWebhookSent = await sendReportEmail({
          patientName: nome,
          pdfUrl: publicUrl,
          evaluationId,
          patientEmail: formData.email || undefined,
          patientPhone: formData.telefone || undefined,
          patientProfile: (formData.publico as string) || undefined,
        })

        if (!reportWebhookSent) {
          throw new Error('Falha ao notificar webhook de relatório')
        }

        await setStatus('completed')
        console.warn(
          `[bg:${requestId}] Evaluation completed | total=${Date.now() - bgStart}ms`
        )
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Erro desconhecido'
        console.error(
          `[bg:${requestId}] Background processing FAILED after ${Date.now() - bgStart}ms:`,
          errorMsg
        )

        await setStatus('error')

        await sendErrorEmail({
          patientName: nome,
          evaluationId,
          errorMessage: errorMsg,
          patientEmail: formData.email || undefined,
          patientPhone: formData.telefone || undefined,
          patientProfile: (formData.publico as string) || undefined,
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
