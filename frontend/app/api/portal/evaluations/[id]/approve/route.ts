// frontend/app/api/portal/evaluations/[id]/approve/route.ts

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { buildPdf } from '~/app/api/assessment/generate-pdf/pdf-helpers'
import { generateReportBackground } from '~/app/api/assessment/lib/generate-report-background'
import type { AssessmentFormData } from '~/features/assessment/components/assessment.interface'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('portal_session')

    if (!session?.value) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = (await request.json()) as { approved_by?: string }
    const approvedBy = body.approved_by ?? 'unknown'

    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: row, error: fetchError } = await sb
      .from('mental_health_evaluations')
      .select('form_data, scores')
      .eq('id', id)
      .single()

    if (fetchError || !row) {
      if (fetchError?.code === 'PGRST116') {
        return NextResponse.json({ message: 'Not found' }, { status: 404 })
      }
      console.error('[portal/approve] Fetch error:', fetchError)
      return NextResponse.json(
        { message: fetchError?.message ?? 'Not found' },
        { status: 500 }
      )
    }

    const formData = row.form_data as AssessmentFormData
    const scores = (row.scores ?? {}) as Record<string, number>

    const requestId = crypto.randomUUID().slice(0, 8)
    const { reportMarkdown } = await generateReportBackground(
      formData,
      scores,
      undefined,
      requestId
    )

    const today = new Date().toLocaleDateString('pt-BR')
    const reportMarkdownWithDate = reportMarkdown.replace(
      /\[Data (?:do relatório|atual)\]/gi,
      today
    )

    const pdfBuffer = buildPdf(formData, reportMarkdownWithDate)

    const fileName = `report_${id}_approved_${Date.now()}.pdf`

    const { error: uploadError } = await sb.storage
      .from('assessment-pdfs')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('[portal/approve] PDF upload error:', uploadError)
      return NextResponse.json(
        { message: 'Erro ao fazer upload do PDF' },
        { status: 500 }
      )
    }

    const {
      data: { publicUrl },
    } = sb.storage.from('assessment-pdfs').getPublicUrl(fileName)

    const { error: updateError } = await sb
      .from('mental_health_evaluations')
      .update({
        report_markdown: reportMarkdownWithDate,
        report_pdf_url: publicUrl,
        reviewer_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: approvedBy,
      })
      .eq('id', id)

    if (updateError) {
      console.error('[portal/approve] Update error:', updateError)
      return NextResponse.json(
        { message: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, report_pdf_url: publicUrl })
  } catch (err) {
    console.error('[portal/approve] Error:', err)
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
