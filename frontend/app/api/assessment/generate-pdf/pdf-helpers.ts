import jsPDF from 'jspdf'

import { KMR_BOLD, KMR_REGULAR } from './fonts/font-data'
import { BRAND } from './pdf-constants'

const FONT_NAME = 'KMRApparat'

function registerFonts(doc: jsPDF) {
  doc.addFileToVFS('KMRApparat-Regular.ttf', KMR_REGULAR)
  doc.addFont('KMRApparat-Regular.ttf', FONT_NAME, 'normal')
  doc.addFileToVFS('KMRApparat-Bold.ttf', KMR_BOLD)
  doc.addFont('KMRApparat-Bold.ttf', FONT_NAME, 'bold')
  doc.setFont(FONT_NAME, 'normal')
}

const PAGE_W = 210
const PAGE_H = 297
const MARGIN_X = 25
const CONTENT_W = PAGE_W - MARGIN_X * 2
const FOOTER_H = 18
const BOTTOM_LIMIT = PAGE_H - FOOTER_H - 10

type RGB = readonly [number, number, number]

function setColor(doc: jsPDF, rgb: RGB) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2])
}

function drawRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  rgb: RGB
) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2])
  doc.rect(x, y, w, h, 'F')
}

function ensureSpace(
  doc: jsPDF,
  y: number,
  needed: number,
  drawFooter: () => void
): number {
  if (y + needed > BOTTOM_LIMIT) {
    drawFooter()
    doc.addPage()
    drawPageBackground(doc)
    return 20
  }
  return y
}

function drawPageBackground(doc: jsPDF) {
  drawRect(doc, 0, 0, PAGE_W, PAGE_H, BRAND.white)
}

function drawFooterOnPage(doc: jsPDF, today: string) {
  drawRect(doc, 0, PAGE_H - FOOTER_H, PAGE_W, 2, BRAND.lime)
  drawRect(doc, 0, PAGE_H - FOOTER_H + 2, PAGE_W, FOOTER_H - 2, BRAND.navy)
  doc.setFont(FONT_NAME, 'normal')
  doc.setFontSize(6)
  setColor(doc, [136, 153, 170])
  doc.text(
    'Bright Precision \u2022 IA de Apoio \u00E0 Decis\u00E3o Cl\u00EDnica \u2022 brightbrains.com.br',
    MARGIN_X,
    PAGE_H - 6
  )
  setColor(doc, BRAND.lime)
  doc.text(`Gerado em ${today}`, PAGE_W - MARGIN_X, PAGE_H - 6, {
    align: 'right',
  })
}

export function parseSections(markdown: string) {
  const parts = markdown.split(/(?=^##\s)/m).filter((p) => p.trim())
  return parts.map((part) => {
    const lines = part.trim().split('\n')
    const rawTitle = lines[0]?.replace(/^#+\s*/, '').replace(/\*\*/g, '') || ''
    const numMatch = rawTitle.match(/^(\d+)\.?\s*(.*)/)
    const num = numMatch ? numMatch[1] : null
    const title = numMatch ? numMatch[2] : rawTitle
    const body = lines.slice(1).join('\n').trim()
    return { num, title, body }
  })
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[]
}

function drawHeader(doc: jsPDF): number {
  drawRect(doc, 0, 0, PAGE_W, 26, BRAND.navy)
  try {
    doc.addImage(LOGO_PNG_RAW, 'PNG', MARGIN_X, 5, 16, 16)
  } catch {
    // logo optional
  }
  doc.setFontSize(13)
  doc.setFont(FONT_NAME, 'bold')
  setColor(doc, BRAND.lime)
  doc.text('BRIGHT PRECISION', MARGIN_X + 20, 13)
  doc.setFontSize(7)
  doc.setFont(FONT_NAME, 'normal')
  setColor(doc, BRAND.gray400)
  doc.text('Bright Brains \u00B7 Instituto da Mente', MARGIN_X + 20, 18)

  doc.setFontSize(5.5)
  doc.setFont(FONT_NAME, 'bold')
  setColor(doc, BRAND.lime)
  const badgeText = 'CFM n\u00BA 2.454/2026 \u2022 M\u00C9DIO RISCO'
  const badgeW = doc.getTextWidth(badgeText) + 8
  const badgeX = PAGE_W - MARGIN_X - badgeW
  doc.setDrawColor(BRAND.limeDark[0], BRAND.limeDark[1], BRAND.limeDark[2])
  doc.setFillColor(20, 40, 60)
  doc.roundedRect(badgeX, 9, badgeW, 8, 1, 1, 'FD')
  doc.text(badgeText, badgeX + 4, 14)

  drawRect(doc, 0, 26, PAGE_W, 2, BRAND.lime)
  return 34
}

function drawTitle(doc: jsPDF, y: number): number {
  doc.setFontSize(13)
  doc.setFont(FONT_NAME, 'bold')
  setColor(doc, BRAND.navy)
  doc.text(
    'Relat\u00F3rio de Apoio \u00E0 Decis\u00E3o Cl\u00EDnica',
    PAGE_W / 2,
    y,
    { align: 'center' }
  )
  y += 5
  doc.setFontSize(8)
  doc.setFont(FONT_NAME, 'normal')
  setColor(doc, BRAND.gray500)
  doc.text(
    'Sugest\u00F5es Preliminares ao Comit\u00EA M\u00E9dico Interdisciplinar',
    PAGE_W / 2,
    y,
    { align: 'center' }
  )
  return y + 9
}

function drawPatientBox(
  doc: jsPDF,
  y: number,
  formData: { nome?: string; nascimento?: string; publico?: string },
  today: string
): number {
  drawRect(doc, MARGIN_X, y, CONTENT_W, 24, BRAND.gray50)
  drawRect(doc, MARGIN_X, y, 2.5, 24, BRAND.lime)

  const col1 = MARGIN_X + 8
  const col2 = PAGE_W / 2 + 5
  let py = y + 6

  doc.setFontSize(6)
  doc.setFont(FONT_NAME, 'normal')
  setColor(doc, BRAND.gray400)
  doc.text('PACIENTE', col1, py)
  doc.text('NASCIMENTO', col2, py)
  py += 4.5
  doc.setFontSize(8.5)
  doc.setFont(FONT_NAME, 'bold')
  setColor(doc, BRAND.gray900)
  doc.text(formData.nome || '\u2014', col1, py)
  doc.text(formData.nascimento || '\u2014', col2, py)
  py += 6
  doc.setFontSize(6)
  doc.setFont(FONT_NAME, 'normal')
  setColor(doc, BRAND.gray400)
  doc.text('PERFIL', col1, py)
  doc.text('DATA DO RELAT\u00D3RIO', col2, py)
  py += 4.5
  doc.setFontSize(8.5)
  doc.setFont(FONT_NAME, 'bold')
  setColor(doc, BRAND.gray900)
  doc.text((formData.publico || '\u2014').toUpperCase(), col1, py)
  doc.text(today, col2, py)

  return y + 30
}

function renderBodyLine(
  doc: jsPDF,
  trimmed: string,
  y: number,
  drawFooter: () => void
): number {
  if (trimmed.startsWith('---')) {
    y = ensureSpace(doc, y, 8, drawFooter)
    doc.setDrawColor(BRAND.gray200[0], BRAND.gray200[1], BRAND.gray200[2])
    doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y)
    return y + 6
  }

  if (trimmed.startsWith('### ')) {
    y = ensureSpace(doc, y, 12, drawFooter)
    y += 2
    const h3 = trimmed.replace(/^###\s*/, '').replace(/\*\*/g, '')
    doc.setFontSize(9)
    doc.setFont(FONT_NAME, 'bold')
    setColor(doc, BRAND.navy)
    doc.text(h3, MARGIN_X, y)
    return y + 6
  }

  const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ')
  const content = isBullet ? trimmed.replace(/^[-*]\s*/, '') : trimmed
  const plain = content.replace(/\*\*/g, '')

  const isFullBold =
    content.startsWith('**') &&
    content.endsWith('**') &&
    content.indexOf('**', 2) === content.length - 2

  doc.setFontSize(8)
  if (isFullBold) {
    doc.setFont(FONT_NAME, 'bold')
    setColor(doc, BRAND.gray900)
  } else {
    doc.setFont(FONT_NAME, 'normal')
    setColor(doc, BRAND.gray700)
  }

  const prefix = isBullet ? '  \u2022  ' : ''
  const wrapped = wrapText(doc, prefix + plain, CONTENT_W - (isBullet ? 4 : 0))
  for (const wl of wrapped) {
    y = ensureSpace(doc, y, 5, drawFooter)
    doc.text(wl, MARGIN_X + (isBullet ? 2 : 0), y)
    y += 4
  }
  return y + 1
}

function drawDisclaimer(doc: jsPDF, y: number, drawFooter: () => void): number {
  y = ensureSpace(doc, y, 30, drawFooter)
  const disclaimerH = 24
  doc.setFillColor(BRAND.navy[0], BRAND.navy[1], BRAND.navy[2])
  doc.setDrawColor(BRAND.limeDark[0], BRAND.limeDark[1], BRAND.limeDark[2])
  doc.roundedRect(MARGIN_X, y, CONTENT_W, disclaimerH, 2, 2, 'FD')
  y += 5
  doc.setFontSize(7)
  doc.setFont(FONT_NAME, 'bold')
  setColor(doc, BRAND.lime)
  doc.text('Conformidade CFM n\u00BA 2.454/2026', MARGIN_X + 4, y)
  y += 4
  doc.setFont(FONT_NAME, 'normal')
  setColor(doc, BRAND.gray400)
  doc.setFontSize(6)
  const disclaimerText =
    'Este relat\u00F3rio cont\u00E9m sugest\u00F5es preliminares de IA classificada como M\u00E9dio Risco ' +
    '(Art. 13, Anexo II). Opera como ferramenta de apoio \u00E0 decis\u00E3o cl\u00EDnica ' +
    '(Art. 4\u00BA, I) sob supervis\u00E3o m\u00E9dica ativa (Art. 18). Todas as recomenda\u00E7\u00F5es ' +
    's\u00E3o n\u00E3o vinculantes e sujeitas \u00E0 an\u00E1lise, valida\u00E7\u00E3o e decis\u00E3o final ' +
    'do comit\u00EA m\u00E9dico interdisciplinar respons\u00E1vel.'
  const dLines = wrapText(doc, disclaimerText, CONTENT_W - 8)
  for (const dl of dLines) {
    doc.text(dl, MARGIN_X + 4, y)
    y += 3
  }
  return y
}

export function buildPdf(
  formData: { nome?: string; nascimento?: string; publico?: string },
  reportMarkdown: string
): Buffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  registerFonts(doc)
  const today = new Date().toLocaleDateString('pt-BR')
  const sections = parseSections(reportMarkdown)
  const drawFooter = () => drawFooterOnPage(doc, today)

  drawPageBackground(doc)
  let y = drawHeader(doc)
  y = drawTitle(doc, y)
  y = drawPatientBox(doc, y, formData, today)

  for (const sec of sections) {
    y = ensureSpace(doc, y, 20, drawFooter)

    if (sec.num) {
      doc.setFillColor(BRAND.navy[0], BRAND.navy[1], BRAND.navy[2])
      doc.circle(MARGIN_X + 4, y + 1, 4, 'F')
      doc.setFontSize(8)
      doc.setFont(FONT_NAME, 'bold')
      setColor(doc, BRAND.lime)
      doc.text(sec.num, MARGIN_X + 4, y + 2.2, { align: 'center' })
    }
    doc.setFontSize(11)
    doc.setFont(FONT_NAME, 'bold')
    setColor(doc, BRAND.navy)
    doc.text(sec.title, MARGIN_X + (sec.num ? 12 : 0), y + 2)
    y += 6
    drawRect(doc, MARGIN_X, y, CONTENT_W, 0.8, BRAND.lime)
    y += 6

    for (const line of sec.body.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) {
        y += 3
        continue
      }
      y = renderBodyLine(doc, trimmed, y, drawFooter)
    }
    y += 5
  }

  drawDisclaimer(doc, y, drawFooter)

  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    drawFooterOnPage(doc, today)
  }

  return Buffer.from(doc.output('arraybuffer'))
}

const LOGO_PNG_RAW =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEcAAABGCAYAAACe7Im6AAAACXBIWXMAAAsSAAALEgHS3X78AAAEM0lEQVR4nO2cwXWjOhSGv+G8vbNmE3dApgCO3UH8KgipIH4VDKlgMh3gDjwVPPvQQKhgnA3r5wryFrr2YAxYSJpAMN852RB0kX/ElXSvpC/v7++4JM38O2AB3ABT4BXYAeswyP9zYH8B3IltxPZrGORrW9tlvrgSRyr9Atw23LYClm1FSjP/BljK36Tmtj3wEgZ53MZ2E07ESTM/AR40b98D8zDIXzVt3wEJEGja3wILF63UszWQZv4L+sKAevMb+dGXbN8AG/SFAZgBTj4xK3HSzJ8DTwZFJ8BafnwTa+o/oyZmaebHBuVOsG05iUXZW5QPqUSEn1nYX2qI34ixOFL5JeerQ9Twv1rhNJlcsH8Rm5azsHmwcNvge+4d2I9sCnctDqgxywk6zlqTIM38qWlhI3EcfVIHphXXrHxFici0oGnLiU0f2AHGjrm1ONJF2vQiH80Ew161lThp5kfAN5MHdcy9jOJb8ZfOTdIsY8wGfH3hQZxzFAb5TqdAozjieBcop2YyUu0bM+BXmvkrVJSgcZpxJo6oG6NEGYIgVTygWhLAT9RsflO+6cTnpJm/BH5J4aEKU+Ye+DfN/Jdyr3YURxzW9w+uWJ94QkUAjnhwDFS1CTsMlUBCMAB40pSS7urTO54OUw6PYTteU2L4Lc7IKQtQ4sy7rUcvmaSZP/UYP6k6ptYB9iHjoVIlI+fsPEoDnxEA3sIg33moLOXIKQmAJxOubZc16Rl7pMEcHHLE6HsORIdUsgcgwZ85o0CPxRjPsSuXxP41j5b/CYM8KV44GeeI//nxcfXpDdswyM86pqpB4DX2XknVxTNxdIPPA2NTdXGcPigqk35n4kjG4dqYV12sajnxH61GP4mrUsbl7EPC50r1umJCxVK5YvYh5rqD7LNyyriYffiMOXDXPBTXEh5azjWOber4dsw+yMoJVwuRhkIMY/ahjjH70MCYfbjAmH1owgPeOq6D9QaOP8TOQ+2H6pKun1/FMfuQdF2THpKAyj6sGbMPRc6yD0vG4PqBs+zDK2P2AS5kH+64zk8sA76Wsw8nS20P+SuJBkYMe9XXHhU7TurWI1cu0pYUzQaO4YwlwwmCvaEmlhe3cl9c3i+qrmWNcsznbknPbbZWa08fJOk15/M67ce2e85bza3EaUdtyvSE57Kz1aH1xFM+s1Xbch3yZnpKwTXs1ItNCxqJI11+ZvpQDfsbh7YS07I28RxXp47saq67CKX8tCnctThZw8KFjQP7VnU0Fkd6LtupRlNKKLa0vacrcQSbIxW2Tf5AWpTNQqro0gj4ElbiSOt5NCiaoZESCoN8idmwYeXiJCbrALu8/b/RHzlvUYcLab3VMMgj2gn0LGWscXks1WF7dUT1/CtDbTRNDO3PUZ9x3QEgKyB2uTLNmThF5KCO4nqXnatKy0s4OQjE5bioyP+lymHR/S+uawAAAABJRU5ErkJggg=='
