import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import type { PdfInput } from './pdf-constants'
import { buildPdf } from './pdf-helpers'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const start = Date.now()

  try {
    const body = (await request.json()) as PdfInput
    const { evaluationId } = body
    const today = new Date().toLocaleDateString('pt-BR')
    const reportMarkdown = (body.reportMarkdown ?? '').replace(
      /\[Data (?:do relatório|atual)\]/gi,
      today
    )

    console.warn(
      `[pdf:${requestId}] Starting PDF generation | evaluation=${evaluationId} | markdown_length=${reportMarkdown?.length ?? 0}`
    )

    if (!evaluationId || !reportMarkdown) {
      return NextResponse.json(
        { error: 'Dados insuficientes' },
        { status: 400 }
      )
    }

    const buffer = buildPdf(body.formData, reportMarkdown)
    console.warn(
      `[pdf:${requestId}] PDF rendered | ${Date.now() - start}ms | size=${buffer.length} bytes`
    )

    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const fileName = `report_${evaluationId}_${Date.now()}.pdf`
    const { error: uploadError } = await sb.storage
      .from('assessment-pdfs')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error(`[pdf:${requestId}] Upload error:`, uploadError)
      throw new Error('Erro ao fazer upload do PDF')
    }

    const {
      data: { publicUrl },
    } = sb.storage.from('assessment-pdfs').getPublicUrl(fileName)

    await sb
      .from('mental_health_evaluations')
      .update({
        report_markdown: reportMarkdown,
        report_pdf_url: publicUrl,
      })
      .eq('id', evaluationId)

    console.warn(
      `[pdf:${requestId}] Complete | ${Date.now() - start}ms | url=${publicUrl}`
    )

    return NextResponse.json({ pdfUrl: publicUrl })
  } catch (err) {
    console.error(
      `[pdf:${requestId}] Failed after ${Date.now() - start}ms:`,
      err
    )
    const msg = err instanceof Error ? err.message : 'Erro ao gerar PDF'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
