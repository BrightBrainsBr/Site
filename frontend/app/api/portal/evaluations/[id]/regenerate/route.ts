import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { after, NextResponse } from 'next/server'

import { buildPdf } from '~/app/api/assessment/generate-pdf/pdf-helpers'
import { generateReportBackground } from '~/app/api/assessment/lib/generate-report-background'
import type { AssessmentFormData } from '~/features/assessment/components/assessment.interface'

export const runtime = 'nodejs'
export const maxDuration = 300

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

    await updateEvaluationStatus(sb, id, 'processing_report', requestId, {
      report_history: existingHistory,
      processing_error: null,
    })

    const formData = (row.form_data ?? {}) as AssessmentFormData
    const scores = (row.scores ?? {}) as Record<string, number>
    const doctorUploads = (row.doctor_uploads ?? []) as {
      name: string
      url: string
      type: string
    }[]

    console.warn(
      `[regenerate:${requestId}] Starting regeneration for ${id} | uploads=${doctorUploads.length} | history=${existingHistory.length}`
    )

    after(async () => {
      const bgStart = Date.now()
      const bgSb = createSb()

      const setStatus = async (
        status: EvaluationProcessingStatus,
        patch: Record<string, unknown> = {}
      ) => updateEvaluationStatus(bgSb, id, status, requestId, patch)

      try {
        await setStatus('processing_report')

        const uploads =
          doctorUploads.length > 0
            ? doctorUploads.map((d) => ({
                name: d.name,
                url: d.url,
                type: d.type,
              }))
            : undefined

        const report = await generateReportBackground(
          formData,
          scores,
          uploads,
          requestId,
          (status) => setStatus(status as EvaluationProcessingStatus)
        )

        const today = new Date().toLocaleDateString('pt-BR')
        const reportMarkdown = report.reportMarkdown.replace(
          /\[Data (?:do relatório|atual)\]/gi,
          today
        )

        await setStatus('processing_pdf')
        const pdfBuffer = buildPdf(formData, reportMarkdown)

        const fileName = `report_${id}_${Date.now()}.pdf`
        await setStatus('processing_upload')

        const { error: uploadError } = await bgSb.storage
          .from('assessment-pdfs')
          .upload(fileName, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: false,
          })

        if (uploadError) {
          console.error(
            `[regenerate:${requestId}] PDF upload error:`,
            uploadError
          )
          throw new Error('Erro ao fazer upload do PDF')
        }

        const {
          data: { publicUrl },
        } = bgSb.storage.from('assessment-pdfs').getPublicUrl(fileName)

        await setStatus('completed', {
          report_markdown: reportMarkdown,
          report_pdf_url: publicUrl,
        })

        console.warn(
          `[regenerate:${requestId}] Done | total=${Date.now() - bgStart}ms`
        )
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Erro desconhecido'
        console.error(
          `[regenerate:${requestId}] Failed after ${Date.now() - bgStart}ms:`,
          errorMsg
        )

        await setStatus('error', { processing_error: errorMsg })
      }
    })

    return NextResponse.json({ status: 'processing_report', requestId })
  } catch (err) {
    console.error(`[regenerate:${requestId}] Error:`, err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
