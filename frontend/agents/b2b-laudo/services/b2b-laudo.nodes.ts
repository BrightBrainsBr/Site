// frontend/agents/b2b-laudo/services/b2b-laudo.nodes.ts

import jsPDF from 'jspdf'

import { RetryableError } from '~/agents/shared/errors'
import {
  getAnthropicConfigForTask,
  llmService,
  toLangChainMessages,
} from '~/shared/utils/llm'

import type { B2BLaudoState } from '../models/b2b-laudo.state'
import {
  B2B_LAUDO_SYSTEM,
  buildLaudoUserMessage,
} from '../prompts/b2b-laudo.prompts'
import {
  fetchCompany,
  fetchEvaluation,
  fetchHistory,
} from './b2b-laudo.storage'

// ---------------------------------------------------------------------------
// Node 1: Load Context
// ---------------------------------------------------------------------------

export async function loadContext(
  state: B2BLaudoState
): Promise<Partial<B2BLaudoState>> {
  try {
    const eval_ = await fetchEvaluation(state.evaluationId)
    const companyData = await fetchCompany(eval_.companyId)
    const historyData = await fetchHistory(
      eval_.patientEmail,
      eval_.companyId
    )

    return {
      formData: eval_.formData,
      scores: eval_.scores,
      companyData,
      historyData,
      status: 'context_loaded',
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown loadContext error'
    console.error(`[b2b-laudo] loadContext failed: ${message}`)
    return {
      errors: [message],
      status: 'error',
    }
  }
}

// ---------------------------------------------------------------------------
// Node 2: Generate Text
// ---------------------------------------------------------------------------

export async function generateText(
  state: B2BLaudoState
): Promise<Partial<B2BLaudoState>> {
  try {
    const configDict = getAnthropicConfigForTask('b2b_laudo_generation')
    const llm = llmService.getLlmInstance(configDict)

    const messages = toLangChainMessages([
      { role: 'system', content: B2B_LAUDO_SYSTEM },
      { role: 'human', content: buildLaudoUserMessage(state) },
    ])

    const response = await llm.invoke(messages)
    const content =
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content)

    if (!content?.trim()) {
      throw new Error('LLM returned empty content')
    }

    return {
      laudoMarkdown: content,
      status: 'text_generated',
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown generateText error'
    console.error(`[b2b-laudo] generateText failed: ${message}`)
    throw new RetryableError(
      `Text generation failed: ${message}`,
      'generateText',
      err
    )
  }
}

// ---------------------------------------------------------------------------
// Node 3: Build PDF
// ---------------------------------------------------------------------------

const PAGE_W = 210
const PAGE_H = 297
const MARGIN_X = 20
const CONTENT_W = PAGE_W - MARGIN_X * 2
const FOOTER_H = 14
const BOTTOM_LIMIT = PAGE_H - FOOTER_H - 10

const NAVY: [number, number, number] = [10, 25, 47]
const LIME: [number, number, number] = [197, 225, 85]
const WHITE: [number, number, number] = [255, 255, 255]
const GRAY_50: [number, number, number] = [249, 250, 251]
const GRAY_400: [number, number, number] = [156, 163, 175]
const GRAY_700: [number, number, number] = [55, 65, 81]
const GRAY_900: [number, number, number] = [17, 24, 39]

function setColor(doc: jsPDF, rgb: [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2])
}

function drawRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  rgb: [number, number, number]
) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2])
  doc.rect(x, y, w, h, 'F')
}

function ensurePdfSpace(
  doc: jsPDF,
  y: number,
  needed: number,
  footer: () => void
): number {
  if (y + needed > BOTTOM_LIMIT) {
    footer()
    doc.addPage()
    drawRect(doc, 0, 0, PAGE_W, PAGE_H, WHITE)
    return 20
  }
  return y
}

function drawLaudoHeader(doc: jsPDF): number {
  drawRect(doc, 0, 0, PAGE_W, 22, NAVY)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  setColor(doc, LIME)
  doc.text('BRIGHT MONITOR', MARGIN_X, 12)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  setColor(doc, GRAY_400)
  doc.text('Laudo Individual de Sa\u00FAde Mental \u2022 NR-1', MARGIN_X, 17)

  doc.setFontSize(5.5)
  doc.setFont('helvetica', 'bold')
  setColor(doc, LIME)
  const badgeText = 'NR-1 \u2022 CFM n\u00BA 2.454/2026'
  const badgeW = doc.getTextWidth(badgeText) + 8
  const badgeX = PAGE_W - MARGIN_X - badgeW
  doc.setFillColor(20, 40, 60)
  doc.roundedRect(badgeX, 7, badgeW, 8, 1, 1, 'F')
  doc.text(badgeText, badgeX + 4, 12)

  drawRect(doc, 0, 22, PAGE_W, 2, LIME)
  return 30
}

function drawLaudoFooter(doc: jsPDF, today: string) {
  drawRect(doc, 0, PAGE_H - FOOTER_H, PAGE_W, 1.5, LIME)
  drawRect(doc, 0, PAGE_H - FOOTER_H + 1.5, PAGE_W, FOOTER_H - 1.5, NAVY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.5)
  setColor(doc, GRAY_400)
  doc.text(
    'Bright Monitor \u2022 NR-1 Compliance \u2022 brightbrains.com.br',
    MARGIN_X,
    PAGE_H - 4
  )
  setColor(doc, LIME)
  doc.text(`Gerado em ${today}`, PAGE_W - MARGIN_X, PAGE_H - 4, {
    align: 'right',
  })
}

function drawIdentificationPage(
  doc: jsPDF,
  state: B2BLaudoState,
  y: number,
  today: string
): number {
  const fd = state.formData
  const company = state.companyData

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  setColor(doc, NAVY)
  doc.text('Laudo Individual de Sa\u00FAde Mental', PAGE_W / 2, y, {
    align: 'center',
  })
  y += 8

  drawRect(doc, MARGIN_X, y, CONTENT_W, 28, GRAY_50)
  drawRect(doc, MARGIN_X, y, 2, 28, LIME)

  const col1 = MARGIN_X + 6
  const col2 = PAGE_W / 2 + 5
  let py = y + 6

  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  setColor(doc, GRAY_400)
  doc.text('COLABORADOR', col1, py)
  doc.text('NASCIMENTO', col2, py)
  py += 4
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  setColor(doc, GRAY_900)
  doc.text((fd.nome as string) || '\u2014', col1, py)
  doc.text((fd.nascimento as string) || '\u2014', col2, py)

  py += 7
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  setColor(doc, GRAY_400)
  doc.text('EMPRESA', col1, py)
  doc.text('DATA DO LAUDO', col2, py)
  py += 4
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  setColor(doc, GRAY_900)
  doc.text(company.name || '\u2014', col1, py)
  doc.text(today, col2, py)

  return y + 36
}

function renderLaudoSection(
  doc: jsPDF,
  title: string,
  body: string,
  y: number,
  footer: () => void
): number {
  y = ensurePdfSpace(doc, y, 20, footer)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  setColor(doc, NAVY)
  doc.text(title, MARGIN_X, y)
  y += 3
  drawRect(doc, MARGIN_X, y, CONTENT_W, 0.6, LIME)
  y += 5

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  setColor(doc, GRAY_700)

  for (const line of body.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) {
      y += 2
      continue
    }

    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ')
    const plain = (isBullet ? trimmed.replace(/^[-*]\s*/, '') : trimmed).replace(
      /\*\*/g,
      ''
    )
    const prefix = isBullet ? '  \u2022  ' : ''
    const wrapped = doc.splitTextToSize(
      prefix + plain,
      CONTENT_W - (isBullet ? 4 : 0)
    ) as string[]

    for (const wl of wrapped) {
      y = ensurePdfSpace(doc, y, 5, footer)
      doc.text(wl, MARGIN_X + (isBullet ? 2 : 0), y)
      y += 3.8
    }
  }

  return y + 4
}

function drawConfidentialityStamp(
  doc: jsPDF,
  y: number,
  footer: () => void
): number {
  y = ensurePdfSpace(doc, y, 24, footer)

  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2])
  doc.roundedRect(MARGIN_X, y, CONTENT_W, 20, 2, 2, 'F')
  y += 5
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  setColor(doc, LIME)
  doc.text('DOCUMENTO CONFIDENCIAL \u2022 LGPD', MARGIN_X + 4, y)
  y += 4
  doc.setFont('helvetica', 'normal')
  setColor(doc, GRAY_400)
  doc.setFontSize(5.5)
  const lgpdText =
    'Este laudo cont\u00E9m dados sens\u00EDveis protegidos pela LGPD (Lei 13.709/2018). ' +
    'Uso restrito ao SST da empresa e ao colaborador avaliado. ' +
    'Proibida reprodu\u00E7\u00E3o ou compartilhamento sem autoriza\u00E7\u00E3o expressa.'
  const lines = doc.splitTextToSize(lgpdText, CONTENT_W - 8) as string[]
  for (const l of lines) {
    doc.text(l, MARGIN_X + 4, y)
    y += 3
  }

  return y + 4
}

function parseLaudoSections(
  markdown: string
): { title: string; body: string }[] {
  const sectionMap: Record<string, string> = {
    SECTION_4: '4. Interpreta\u00E7\u00E3o das Escalas Cl\u00EDnicas',
    SECTION_5: '5. An\u00E1lise das Dimens\u00F5es AEP',
    SECTION_6: '6. Classifica\u00E7\u00E3o de Risco Integrada',
    SECTION_7: '7. A\u00E7\u00F5es Individuais PDCA',
    SECTION_8: '8. An\u00E1lise de Tend\u00EAncias',
  }

  const parts = markdown.split(/(?=^##\s+SECTION_\d)/m).filter((p) => p.trim())

  return parts.map((part) => {
    const lines = part.trim().split('\n')
    const header = lines[0]?.replace(/^##\s*/, '').trim() || ''
    const sectionKey = header.replace(/\s.*/, '')
    const title = sectionMap[sectionKey] || header
    const body = lines.slice(1).join('\n').trim()
    return { title, body }
  })
}

export async function buildPdf(
  state: B2BLaudoState
): Promise<Partial<B2BLaudoState>> {
  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const today = new Date().toLocaleDateString('pt-BR')
    const drawFooter = () => drawLaudoFooter(doc, today)

    drawRect(doc, 0, 0, PAGE_W, PAGE_H, WHITE)
    let y = drawLaudoHeader(doc)
    y = drawIdentificationPage(doc, state, y, today)

    const sections = parseLaudoSections(state.laudoMarkdown)
    for (const sec of sections) {
      y = renderLaudoSection(doc, sec.title, sec.body, y, drawFooter)
    }

    y = drawConfidentialityStamp(doc, y, drawFooter)

    const totalPages = doc.getNumberOfPages()
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p)
      drawLaudoFooter(doc, today)
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return {
      pdfBuffer,
      status: 'pdf_built',
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown buildPdf error'
    console.error(`[b2b-laudo] buildPdf failed: ${message}`)
    return {
      errors: [message],
      status: 'error',
    }
  }
}

// ---------------------------------------------------------------------------
// Node 4: Store Result
// ---------------------------------------------------------------------------

export async function storeResult(
  state: B2BLaudoState
): Promise<Partial<B2BLaudoState>> {
  try {
    const { uploadPdf, updateEvaluation } = await import('./b2b-laudo.storage')
    const { sendB2BLaudoEmail } = await import(
      '~/app/api/assessment/lib/send-email'
    )

    if (!state.pdfBuffer) {
      throw new Error('No PDF buffer available')
    }

    const pdfUrl = await uploadPdf(state.evaluationId, state.pdfBuffer)

    await updateEvaluation(state.evaluationId, {
      laudo_pdf_url: pdfUrl,
      laudo_markdown: state.laudoMarkdown,
      status: 'completed',
    })

    const patientName = (state.formData.nome as string) || 'Colaborador'
    await sendB2BLaudoEmail({
      patientName,
      pdfUrl,
      evaluationId: state.evaluationId,
      companyName: state.companyData.name,
    })

    return {
      pdfUrl,
      status: 'stored',
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown storeResult error'
    console.error(`[b2b-laudo] storeResult failed: ${message}`)
    return {
      errors: [message],
      status: 'error',
    }
  }
}
