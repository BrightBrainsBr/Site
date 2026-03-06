import {
  Document,
  Image,
  Page,
  renderToBuffer,
  Text,
  View,
} from '@react-pdf/renderer'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import React from 'react'

import { LOGO_PNG, type PdfInput, s } from './pdf-constants'
import { formatBody, parseSections } from './pdf-helpers'

function ReportDocument({ input }: { input: PdfInput }) {
  const { formData, reportMarkdown } = input
  const sections = parseSections(reportMarkdown)
  const today = new Date().toLocaleDateString('pt-BR')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const h = React.createElement as any

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return h(
    Document,
    null,
    h(
      Page,
      { size: 'A4', style: s.page },
      h(
        View,
        { style: s.headerBar },
        h(
          View,
          { style: s.headerLeft },
          h(Image, { src: LOGO_PNG, style: s.logo }),
          h(
            View,
            { style: s.headerTitleGroup },
            h(Text, { style: s.headerTitle }, 'BRIGHT PRECISION'),
            h(
              Text,
              { style: s.headerSubtitle },
              'Bright Brains \u00B7 Instituto da Mente'
            )
          )
        ),
        h(
          View,
          { style: s.headerRight },
          h(
            View,
            { style: s.badge },
            h(
              Text,
              { style: s.badgeText },
              'CFM n\u00BA 2.454/2026 \u2022 M\u00C9DIO RISCO'
            )
          )
        )
      ),
      h(View, { style: s.accentLine }),

      h(
        View,
        { style: s.content },
        h(
          Text,
          { style: s.reportTitle },
          'Relat\u00F3rio de Apoio \u00E0 Decis\u00E3o Cl\u00EDnica'
        ),
        h(
          Text,
          { style: s.reportSubtitle },
          'Sugest\u00F5es Preliminares ao Comit\u00EA M\u00E9dico Interdisciplinar'
        ),

        h(
          View,
          { style: s.patientBox },
          h(
            View,
            { style: s.patientGrid },
            h(
              View,
              { style: s.patientCell },
              h(Text, { style: s.patientLabel }, 'PACIENTE'),
              h(Text, { style: s.patientValue }, formData.nome || '\u2014')
            ),
            h(
              View,
              { style: s.patientCell },
              h(Text, { style: s.patientLabel }, 'NASCIMENTO'),
              h(
                Text,
                { style: s.patientValue },
                formData.nascimento || '\u2014'
              )
            ),
            h(
              View,
              { style: s.patientCell },
              h(Text, { style: s.patientLabel }, 'PERFIL'),
              h(
                Text,
                { style: s.patientValue },
                (formData.publico || '\u2014').toUpperCase()
              )
            ),
            h(
              View,
              { style: s.patientCell },
              h(Text, { style: s.patientLabel }, 'DATA DO RELAT\u00D3RIO'),
              h(Text, { style: s.patientValue }, today)
            )
          )
        ),

        ...sections.map((sec, i) =>
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          h(
            View,
            { key: i, style: s.sectionBlock },
            h(
              View,
              { style: s.sectionTitleBar, wrap: false },
              sec.num ? h(Text, { style: s.sectionNumber }, sec.num) : null,
              h(
                Text,
                { style: s.sectionTitleText },
                sec.title.replace(/\*\*/g, '')
              )
            ),
            ...formatBody(sec.body)
          )
        ),

        h(
          View,
          { style: s.disclaimer },
          h(
            Text,
            { style: s.disclaimerTitle },
            '\u26A0\uFE0F Conformidade CFM n\u00BA 2.454/2026'
          ),
          h(
            Text,
            { style: s.disclaimerText },
            'Este relat\u00F3rio cont\u00E9m sugest\u00F5es preliminares de IA classificada como M\u00E9dio Risco ' +
              '(Art. 13, Anexo II). Opera como ferramenta de apoio \u00E0 decis\u00E3o cl\u00EDnica ' +
              '(Art. 4\u00BA, I) sob supervis\u00E3o m\u00E9dica ativa (Art. 18). Todas as recomenda\u00E7\u00F5es ' +
              's\u00E3o n\u00E3o vinculantes e sujeitas \u00E0 an\u00E1lise, valida\u00E7\u00E3o e decis\u00E3o final ' +
              'do comit\u00EA m\u00E9dico interdisciplinar respons\u00E1vel.'
          )
        )
      ),

      h(
        View,
        { style: s.footer, fixed: true },
        h(View, { style: s.footerAccent }),
        h(
          View,
          { style: s.footerContent },
          h(
            Text,
            { style: s.footerLeft },
            'Bright Precision \u2022 IA de Apoio \u00E0 Decis\u00E3o Cl\u00EDnica \u2022 brightbrains.com.br'
          ),
          h(Text, { style: s.footerRight }, `Gerado em ${today}`)
        )
      )
    )
  )
}

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

    const element = React.createElement(ReportDocument, {
      input: { ...body, reportMarkdown },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any)
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
