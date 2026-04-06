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
    const historyData = await fetchHistory(eval_.patientEmail, eval_.companyId)

    return { formData: eval_.formData, scores: eval_.scores, companyData, historyData, status: 'context_loaded' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown loadContext error'
    console.error(`[b2b-laudo] loadContext failed: ${message}`)
    return { errors: [message], status: 'error' }
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

    if (!content?.trim()) throw new Error('LLM returned empty content')

    return { laudoMarkdown: content, status: 'text_generated' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown generateText error'
    console.error(`[b2b-laudo] generateText failed: ${message}`)
    throw new RetryableError(`Text generation failed: ${message}`, 'generateText', err)
  }
}

// ---------------------------------------------------------------------------
// Node 3: Build PDF
// ---------------------------------------------------------------------------

type RGB = [number, number, number]
type RiskLevel = 'baixo' | 'moderado' | 'elevado' | 'critico'

// Page dimensions
const PW = 210, PH = 297, MX = 15, CW = PW - MX * 2
const HDR_H = 25, FTR_H = 12
const BODY_Y = HDR_H + 6
const SAFE_BOT = PH - FTR_H - 5

// Colours
const NAVY: RGB   = [10, 25, 47]
const LIME: RGB   = [197, 225, 85]
const WHITE: RGB  = [255, 255, 255]
const ROW1: RGB   = [242, 246, 252]
const TXT_H: RGB  = [10, 25, 47]
const TXT_B: RGB  = [40, 55, 75]
const TXT_L: RGB  = [100, 120, 145]
const TXT_M: RGB  = [148, 163, 184]
const RULE: RGB   = [205, 215, 228]

// Risk colours
const C_LOW: RGB  = [22, 163, 74];   const B_LOW: RGB  = [220, 252, 231]
const C_MOD: RGB  = [161, 107, 10];  const B_MOD: RGB  = [255, 237, 195]
const C_HI: RGB   = [194, 65, 12];   const B_HI: RGB   = [255, 218, 190]
const C_CR: RGB   = [185, 28, 28];   const B_CR: RGB   = [255, 210, 210]

// Primitives
const sf = (d: jsPDF, c: RGB) => d.setFillColor(c[0], c[1], c[2])
const st = (d: jsPDF, c: RGB) => d.setTextColor(c[0], c[1], c[2])
const sd = (d: jsPDF, c: RGB) => d.setDrawColor(c[0], c[1], c[2])
function fr(d: jsPDF, x: number, y: number, w: number, h: number, c: RGB) { sf(d, c); d.rect(x, y, w, h, 'F') }
function sr(d: jsPDF, x: number, y: number, w: number, h: number, c: RGB, lw = 0.25) { sd(d, c); d.setLineWidth(lw); d.rect(x, y, w, h, 'S') }
function vl(d: jsPDF, x: number, y: number, h: number, c: RGB, lw = 0.25) { sd(d, c); d.setLineWidth(lw); d.line(x, y, x, y + h) }

// Risk helpers
function riskFg(l: RiskLevel): RGB  { return l === 'baixo' ? C_LOW : l === 'moderado' ? C_MOD : l === 'elevado' ? C_HI : C_CR }
function riskBg(l: RiskLevel): RGB  { return l === 'baixo' ? B_LOW : l === 'moderado' ? B_MOD : l === 'elevado' ? B_HI : B_CR }
function riskPT(l: RiskLevel): string { return l === 'baixo' ? 'Baixo' : l === 'moderado' ? 'Moderado' : l === 'elevado' ? 'Elevado' : 'Cr\u00EDtico' }

function srq20Risk(s: number): RiskLevel {
  if (s <= 7)  return 'baixo'
  if (s <= 11) return 'moderado'
  if (s <= 16) return 'elevado'
  return 'critico'
}
function srq20Label(s: number): string {
  if (s <= 7)  return 'Negativo \u2014 Baixo Risco'
  if (s <= 11) return 'Rastreamento Positivo \u2014 Risco Moderado'
  if (s <= 16) return 'Rastreamento Positivo \u2014 Risco Elevado'
  return 'Rastreamento Positivo \u2014 Risco Cr\u00EDtico'
}
function dimRisk(score: number, max: number): { label: string; level: RiskLevel } {
  const p = score / max
  if (p <= 0.25) return { label: 'Baixo',    level: 'baixo' }
  if (p <= 0.50) return { label: 'Moderado', level: 'moderado' }
  if (p <= 0.75) return { label: 'Elevado',  level: 'elevado' }
  return            { label: 'Cr\u00EDtico',  level: 'critico' }
}
function aepGlobalRisk(s: number): RiskLevel {
  if (s <= 14) return 'baixo'
  if (s <= 28) return 'moderado'
  if (s <= 42) return 'elevado'
  return 'critico'
}

// Matrix: rows = [Alta, Média, Baixa], cols = [Baixa, Moderada, Alta, Muito Alta]
const MATRIX: RiskLevel[][] = [
  ['moderado', 'elevado',  'critico',  'critico'],
  ['baixo',    'moderado', 'elevado',  'critico'],
  ['baixo',    'baixo',    'moderado', 'elevado'],
]
function matrixCell(srq20: number, aepTotal: number): { row: number; col: number; level: RiskLevel } {
  const row = srq20 >= 12 ? 0 : srq20 >= 8 ? 1 : 2
  const col = aepTotal >= 43 ? 3 : aepTotal >= 29 ? 2 : aepTotal >= 15 ? 1 : 0
  return { row, col, level: MATRIX[row]![col]! }
}
function probLabel(row: number): string { return ['Prob. Alta', 'Prob. M\u00E9dia', 'Prob. Baixa'][row]! }
function sevLabel(col: number): string { return ['Sev. Baixa', 'Sev. Moderada', 'Sev. Alta', 'Sev. Muito Alta'][col]! }

// Format helpers
function maskCpf(v: unknown): string {
  const s = String(v || '')
  return s ? s.replace(/(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/, '***.***.***-$4') : '\u2014'
}
function fmtBirth(v: unknown): string {
  try {
    const d = new Date(String(v || ''))
    if (isNaN(d.getTime())) return String(v || '\u2014')
    const age = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 36e5))
    return `${d.toLocaleDateString('pt-BR')} (${age} anos)`
  } catch { return '\u2014' }
}
function laudoId(evalId: string): string {
  const yr = new Date().getFullYear()
  const h  = evalId.replace(/-/g, '').substring(0, 8).toUpperCase()
  return `BM-${yr}-${h}`
}
function nextYear(): string {
  const d = new Date(); d.setFullYear(d.getFullYear() + 1)
  return d.toLocaleDateString('pt-BR')
}
function s(v: unknown, fb = '\u2014'): string { return String(v ?? '').trim() || fb }

// Reliable section extraction (no regex multiline edge-cases)
function aiSection(md: string, key: string): string {
  const marker = `## ${key}`
  const idx = md.indexOf(marker)
  if (idx === -1) return ''
  const lineEnd = md.indexOf('\n', idx)
  if (lineEnd === -1) return ''
  const start = lineEnd + 1
  const next = md.indexOf('\n## SECTION_', start)
  return md.substring(start, next === -1 ? md.length : next).trim()
}

// Parse pipe-delimited PDCA rows from SECTION_7
interface PdcaRow { prior: string; acao: string; resp: string; prazo: string; status: string }
function parsePdca(section7: string): PdcaRow[] {
  const rows: PdcaRow[] = []
  for (const line of section7.split('\n')) {
    const parts = line.split('|').map((p) => p.trim())
    if (parts.length >= 5 && /^(Alta|M[eé]dia|Baixa)/i.test(parts[0]!)) {
      rows.push({ prior: parts[0]!, acao: parts[1]!, resp: parts[2]!, prazo: parts[3]!, status: parts[4]! })
    }
  }
  return rows
}

// ── Page layout ──────────────────────────────────────────────────────────────

function drawHeader(doc: jsPDF, evalId: string, today: string) {
  fr(doc, 0, 0, PW, HDR_H - 2, NAVY)

  // Logo
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); st(doc, LIME)
  doc.text('BRIGHTMONITOR', MX, 11)
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); st(doc, TXT_M)
  doc.text('Laudo Individual do Colaborador', MX, 17)

  // Right side: ID + Emissão
  doc.setFontSize(5.5); doc.setFont('helvetica', 'normal'); st(doc, TXT_M)
  doc.text('ID DO LAUDO', PW - MX, 7, { align: 'right' })
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); st(doc, WHITE)
  doc.text(laudoId(evalId), PW - MX, 12, { align: 'right' })
  doc.setFontSize(5.5); doc.setFont('helvetica', 'normal'); st(doc, TXT_M)
  doc.text(`Emiss\u00E3o: ${today}`, PW - MX, 17, { align: 'right' })

  // CONFIDENCIAL badge (red)
  doc.setFontSize(5.5); doc.setFont('helvetica', 'bold')
  const bt = 'CONFIDENCIAL \u2014 LGPD'
  const bw = doc.getTextWidth(bt) + 6; const bx = PW - MX - bw
  sf(doc, [140, 28, 28]); doc.roundedRect(bx, 18.5, bw, 5, 1, 1, 'F')
  st(doc, WHITE); doc.text(bt, bx + 3, 22)

  fr(doc, 0, HDR_H - 2, PW, 2, LIME)
}

function drawFooter(doc: jsPDF, today: string, pageNum: number) {
  fr(doc, 0, PH - FTR_H, PW, 0.8, LIME)
  doc.setFontSize(5.5); doc.setFont('helvetica', 'normal'); st(doc, TXT_L)
  doc.text(`\u00A9 ${new Date().getFullYear()} Bright Brains \u2014 Instituto da Mente \u00B7 BrightMonitor v3 \u00B7 Documento gerado eletronicamente`, MX, PH - 4.5)
  st(doc, TXT_B)
  doc.text(`P\u00E1gina ${pageNum}`, PW - MX, PH - 4.5, { align: 'right' })
}

// ── Section heading ──────────────────────────────────────────────────────────

function secHead(doc: jsPDF, title: string, ref: string | null, y: number): number {
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); st(doc, TXT_H)
  doc.text(title, MX, y); y += 2
  fr(doc, MX, y, CW, 0.5, LIME); y += 4
  if (ref) {
    doc.setFontSize(6); doc.setFont('helvetica', 'italic'); st(doc, TXT_L)
    doc.text(ref, MX, y); y += 4
  }
  return y
}

// ── Info grid (2-column identification tables) ───────────────────────────────

function infoGrid(
  doc: jsPDF,
  pairs: { l1: string; v1: string; l2: string; v2: string }[],
  y: number
): number {
  const RH = 8.5; const HALF = CW / 2
  for (const p of pairs) {
    fr(doc, MX, y, CW, RH, ROW1); sr(doc, MX, y, CW, RH, RULE)
    vl(doc, MX + HALF, y, RH, RULE)
    // col 1
    doc.setFontSize(5); doc.setFont('helvetica', 'normal'); st(doc, TXT_L); doc.text(p.l1, MX + 2.5, y + 3)
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); st(doc, TXT_B)
    doc.text(doc.splitTextToSize(p.v1 || '\u2014', HALF - 5)[0] ?? '\u2014', MX + 2.5, y + 7)
    // col 2
    doc.setFontSize(5); doc.setFont('helvetica', 'normal'); st(doc, TXT_L); doc.text(p.l2, MX + HALF + 2.5, y + 3)
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); st(doc, TXT_B)
    doc.text(doc.splitTextToSize(p.v2 || '\u2014', HALF - 5)[0] ?? '\u2014', MX + HALF + 2.5, y + 7)
    y += RH
  }
  return y + 3
}

// ── Coloured dot helper ──────────────────────────────────────────────────────
function dot(doc: jsPDF, level: RiskLevel, x: number, y: number) {
  const fg = riskFg(level)
  sf(doc, fg); doc.circle(x, y, 1.8, 'F')
}

// ── Scale table (Section 4) ──────────────────────────────────────────────────

interface ScaleRow { escala: string; dominio: string; score: string; range: string; classificacao: string; nivel: RiskLevel }

function scaleTable(doc: jsPDF, rows: ScaleRow[], y: number): number {
  const HH = 7; const RH = 7
  // col widths sum to CW = 180
  const cols = [
    { w: 22, lbl: 'ESCALA',         align: 'left'   as const },
    { w: 63, lbl: 'DOM\u00CDNIO',   align: 'left'   as const },
    { w: 16, lbl: 'SCORE',          align: 'center' as const },
    { w: 17, lbl: 'RANGE',          align: 'center' as const },
    { w: 44, lbl: 'CLASSIFICA\u00C7\u00C3O', align: 'left' as const },
    { w: 18, lbl: 'N\u00CDVEL',     align: 'center' as const },
  ]

  fr(doc, MX, y, CW, HH, NAVY)
  let cx = MX + 3
  doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); st(doc, LIME)
  for (const c of cols) {
    doc.text(c.lbl, c.align === 'center' ? cx + c.w / 2 : cx, y + 4.7,
      { align: c.align === 'center' ? 'center' : 'left', maxWidth: c.w - 3 })
    cx += c.w
  }
  y += HH

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!
    fr(doc, MX, y, CW, RH, i % 2 === 0 ? ROW1 : WHITE)
    sr(doc, MX, y, CW, RH, RULE)
    cx = MX + 3
    const cells = [row.escala, row.dominio, row.score, row.range, row.classificacao] as const
    for (let j = 0; j < 5; j++) {
      const c = cols[j]!
      doc.setFontSize(7); doc.setFont('helvetica', j === 0 ? 'bold' : 'normal'); st(doc, TXT_B)
      if (c.align === 'center') doc.text(cells[j] ?? '', cx + c.w / 2, y + 4.7, { align: 'center' })
      else doc.text((doc.splitTextToSize(cells[j] ?? '', c.w - 4) as string[])[0] ?? '', cx, y + 4.7)
      cx += c.w
    }
    // Coloured dot for nível
    dot(doc, row.nivel, cx + 9, y + 3.5)
    y += RH
  }

  // Legend
  y += 2
  doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); st(doc, TXT_L)
  let lx = MX
  for (const [lvl, label] of [['baixo', 'Baixo'], ['moderado', 'Moderado'], ['elevado', 'Elevado'], ['critico', 'Cr\u00EDtico']] as const) {
    dot(doc, lvl, lx + 2, y + 1); lx += 5
    doc.text(label, lx, y + 2); lx += doc.getTextWidth(label) + 7
  }
  return y + 6
}

// ── AEP table (Section 5) ────────────────────────────────────────────────────

interface AepRow { dim: string; score: number; max: number }

function aepTable(doc: jsPDF, rows: AepRow[], total: number, y: number): number {
  const HH = 7; const RH = 7
  const cols = [
    { w: 81, lbl: 'DIMENS\u00C3O',         align: 'left'   as const },
    { w: 18, lbl: 'SCORE',                  align: 'center' as const },
    { w: 18, lbl: 'M\u00C1X.',             align: 'center' as const },
    { w: 45, lbl: 'CLASSIFICA\u00C7\u00C3O', align: 'left' as const },
    { w: 18, lbl: 'N\u00CDVEL',            align: 'center' as const },
  ]

  fr(doc, MX, y, CW, HH, NAVY)
  let cx = MX + 3
  doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); st(doc, LIME)
  for (const c of cols) {
    doc.text(c.lbl, c.align === 'center' ? cx + c.w / 2 : cx, y + 4.7,
      { align: c.align === 'center' ? 'center' : 'left', maxWidth: c.w - 3 })
    cx += c.w
  }
  y += HH

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!
    const { label, level } = dimRisk(row.score, row.max)
    fr(doc, MX, y, CW, RH, i % 2 === 0 ? ROW1 : WHITE); sr(doc, MX, y, CW, RH, RULE)
    cx = MX + 3
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); st(doc, TXT_B); doc.text(row.dim, cx, y + 4.7); cx += cols[0]!.w
    doc.setFont('helvetica', 'bold'); doc.text(String(row.score), cx + cols[1]!.w / 2, y + 4.7, { align: 'center' }); cx += cols[1]!.w
    doc.setFont('helvetica', 'normal'); st(doc, TXT_M); doc.text(String(row.max), cx + cols[2]!.w / 2, y + 4.7, { align: 'center' }); cx += cols[2]!.w
    st(doc, TXT_B); doc.text(label, cx + 2, y + 4.7); cx += cols[3]!.w
    dot(doc, level, cx + 9, y + 3.5)
    y += RH
  }

  // Total row
  const totLevel = aepGlobalRisk(total)
  const { label: totLbl } = dimRisk(total, 56)
  fr(doc, MX, y, CW, RH + 1, [228, 235, 248]); sr(doc, MX, y, CW, RH + 1, NAVY, 0.5)
  cx = MX + 3
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); st(doc, TXT_H); doc.text('SCORE GLOBAL AEP', cx, y + 5.5); cx += cols[0]!.w
  doc.setFontSize(9); doc.text(String(total), cx + cols[1]!.w / 2, y + 5.5, { align: 'center' }); cx += cols[1]!.w
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); st(doc, TXT_M); doc.text('56', cx + cols[2]!.w / 2, y + 5.5, { align: 'center' }); cx += cols[2]!.w
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); st(doc, TXT_H); doc.text(totLbl, cx + 2, y + 5.5); cx += cols[3]!.w
  dot(doc, totLevel, cx + 9, y + 4)
  return y + RH + 4
}

// ── Risk matrix (Section 6) ──────────────────────────────────────────────────

function riskMatrixGrid(doc: jsPDF, srq20Score: number, aepTotal: number, y: number): number {
  const { row: activeRow, col: activeCol, level: finalLevel } = matrixCell(srq20Score, aepTotal)

  const CH = 9; const labH = 8  // cell height, label height
  const cols = 4; const rows = 3
  const totalW = CW; const labelColW = 30
  const colW = (totalW - labelColW) / cols

  // Column headers
  fr(doc, MX + labelColW, y, totalW - labelColW, labH, NAVY)
  doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); st(doc, LIME)
  for (let c = 0; c < cols; c++) {
    const cx = MX + labelColW + c * colW + colW / 2
    doc.text(sevLabel(c), cx, y + 5, { align: 'center', maxWidth: colW - 2 })
  }
  y += labH

  // Rows
  for (let r = 0; r < rows; r++) {
    // Row label
    fr(doc, MX, y, labelColW, CH, NAVY)
    doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); st(doc, LIME)
    doc.text(probLabel(r), MX + labelColW / 2, y + CH / 2 + 2, { align: 'center', maxWidth: labelColW - 4 })

    for (let c = 0; c < cols; c++) {
      const cellLevel = MATRIX[r]![c]!
      const isActive = r === activeRow && c === activeCol
      const cellX = MX + labelColW + c * colW
      fr(doc, cellX, y, colW, CH, riskBg(cellLevel))
      if (isActive) {
        sd(doc, riskFg(cellLevel)); doc.setLineWidth(1.2); doc.rect(cellX, y, colW, CH, 'S')
      } else {
        sr(doc, cellX, y, colW, CH, RULE)
      }
      doc.setFontSize(7); doc.setFont('helvetica', isActive ? 'bold' : 'normal')
      st(doc, riskFg(cellLevel))
      doc.text(riskPT(cellLevel), cellX + colW / 2, y + CH / 2 + 2, { align: 'center' })
    }
    y += CH
  }

  // Classification result banner
  y += 4
  const { level: fl } = { level: finalLevel }
  fr(doc, MX, y, CW, 12, riskBg(fl))
  sd(doc, riskFg(fl)); doc.setLineWidth(0.6); doc.rect(MX, y, CW, 12, 'S')
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); st(doc, TXT_L)
  doc.text('CLASSIFICA\u00C7\u00C3O FINAL', MX + 4, y + 4.5)
  doc.setFontSize(12); st(doc, riskFg(fl))
  doc.text(`RISCO ${riskPT(fl).toUpperCase()}`, MX + 50, y + 9)
  return y + 16
}

// ── PDCA table (Section 7) ───────────────────────────────────────────────────

function pdcaTable(doc: jsPDF, rows: PdcaRow[], y: number, ens: (y: number, n: number) => number): number {
  const HH = 7; const RH = 8
  const priorCol = 18; const respCol = 38; const prazoCol = 25; const statusCol = 25
  const acoesCol = CW - priorCol - respCol - prazoCol - statusCol

  y = ens(y, HH + 3)
  fr(doc, MX, y, CW, HH, NAVY)
  doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); st(doc, LIME)
  let cx = MX + 2
  for (const [lbl, w] of [['PRIOR.', priorCol], ['A\u00C7\u00C3O', acoesCol], ['RESPONS\u00C1VEL', respCol], ['PRAZO', prazoCol], ['STATUS', statusCol]] as [string, number][]) {
    doc.text(lbl, cx, y + 4.7); cx += w
  }
  y += HH

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!
    const priorLvl: RiskLevel = /^alt/i.test(row.prior) ? 'critico' : /^m[eé]/i.test(row.prior) ? 'moderado' : 'baixo'
    const acoLines = doc.splitTextToSize(row.acao, acoesCol - 4) as string[]
    const rowH = Math.max(RH, acoLines.length * 3.8 + 3)

    y = ens(y, rowH)
    fr(doc, MX, y, CW, rowH, i % 2 === 0 ? ROW1 : WHITE); sr(doc, MX, y, CW, rowH, RULE)

    cx = MX + 2
    // Prioridade badge
    fr(doc, cx, y + 1.5, priorCol - 3, rowH - 3, riskBg(priorLvl))
    doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); st(doc, riskFg(priorLvl))
    doc.text(row.prior, cx + (priorCol - 3) / 2, y + rowH / 2 + 1.5, { align: 'center' })
    cx += priorCol

    // Ação (multiline)
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); st(doc, TXT_B)
    let ay = y + 3.5
    for (const al of acoLines) { doc.text(al, cx, ay); ay += 3.8 }
    cx += acoesCol

    // Responsável, Prazo, Status
    for (const [val, w] of [[row.resp, respCol], [row.prazo, prazoCol], [row.status, statusCol]] as [string, number][]) {
      doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); st(doc, TXT_B)
      const vl2 = doc.splitTextToSize(val, w - 4) as string[]
      doc.text(vl2[0] ?? '', cx, y + rowH / 2 + 1.5)
      cx += w
    }
    y += rowH
  }
  return y + 2
}

// ── Body text renderer ───────────────────────────────────────────────────────

function bodyText(doc: jsPDF, content: string, y: number, ens: (y: number, n: number) => number): number {
  for (const raw of content.split('\n')) {
    const line = raw.trim()
    if (!line) { y += 1.5; continue }
    if (/^#{1,2}\s/.test(line)) continue

    if (line.startsWith('### ')) {
      y = ens(y, 9); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); st(doc, TXT_H)
      doc.text(line.replace(/^###\s+/, '').replace(/\*\*/g, ''), MX, y); y += 5; continue
    }

    const isBullet = /^[-•*]\s/.test(line)
    const plain = line.replace(/^[-•*]\s+/, '').replace(/\*\*/g, '').replace(/^#+\s*/, '')
    const prefix = isBullet ? '\u2022 ' : ''
    const indent = isBullet ? 4 : 0
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); st(doc, TXT_B)
    for (const wl of doc.splitTextToSize(prefix + plain, CW - indent - 2) as string[]) {
      y = ens(y, 5); doc.text(wl, MX + indent, y); y += 3.8
    }
  }
  return y + 2
}

// ── History table ────────────────────────────────────────────────────────────

function historyTable(
  doc: jsPDF,
  history: B2BLaudoState['historyData'],
  y: number,
  ens: (y: number, n: number) => number
): number {
  if (history.length === 0) return y
  const HH = 7; const RH = 6
  const cols = [35, 22, 22, 22, 22, 33, 24]
  const labels = ['DATA', 'PHQ-9', 'GAD-7', 'SRQ-20', 'AEP', 'RISCO GLOBAL', 'TEND\u00CANCIA']

  y = ens(y, HH + history.length * RH + 5)
  fr(doc, MX, y, CW, HH, NAVY)
  let cx = MX + 3
  doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); st(doc, LIME)
  for (let i = 0; i < labels.length; i++) { doc.text(labels[i]!, cx, y + 4.7); cx += cols[i]! }
  y += HH

  for (let i = 0; i < history.length; i++) {
    const h = history[i]!
    fr(doc, MX, y, CW, RH, i % 2 === 0 ? ROW1 : WHITE); sr(doc, MX, y, CW, RH, RULE)
    cx = MX + 3
    const vals = [
      h.created_at ? new Date(h.created_at).toLocaleDateString('pt-BR') : '\u2014',
      s(h.scores.phq9), s(h.scores.gad7), s(h.scores.srq20), `${s(h.scores.aep_total)}/56`,
      h.risk_level || '\u2014', '\u2014',
    ]
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); st(doc, TXT_B)
    for (let j = 0; j < vals.length; j++) { doc.text(vals[j]!, cx, y + 4.2); cx += cols[j]! }
    y += RH
  }
  return y + 3
}

// ── Confidentiality stamp ─────────────────────────────────────────────────────

function confStamp(doc: jsPDF, y: number): number {
  fr(doc, MX, y, CW, 18, NAVY)
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); st(doc, LIME)
  doc.text('DOCUMENTO CONFIDENCIAL \u2022 LGPD', MX + 4, y + 5)
  doc.setFontSize(5.5); doc.setFont('helvetica', 'normal'); st(doc, TXT_M)
  const txt = 'Este laudo cont\u00E9m dados sens\u00EDveis protegidos pela LGPD (Lei 13.709/2018). Uso restrito ao SST da empresa e ao colaborador avaliado. Proibida reprodu\u00E7\u00E3o ou compartilhamento sem autoriza\u00E7\u00E3o expressa.'
  let ly = y + 9
  for (const l of doc.splitTextToSize(txt, CW - 8) as string[]) { doc.text(l, MX + 4, ly); ly += 3 }
  return y + 21
}

// ---------------------------------------------------------------------------
// buildPdf
// ---------------------------------------------------------------------------

export async function buildPdf(
  state: B2BLaudoState
): Promise<Partial<B2BLaudoState>> {
  try {
    const doc   = new jsPDF({ unit: 'mm', format: 'a4' })
    const today = new Date().toLocaleDateString('pt-BR')
    const fd    = state.formData
    const co    = state.companyData
    const sc    = state.scores
    let pageNum = 1

    fr(doc, 0, 0, PW, PH, WHITE)
    drawHeader(doc, state.evaluationId, today)
    let y = BODY_Y

    // Page management
    const newPage = (): number => {
      drawFooter(doc, today, pageNum); pageNum++
      doc.addPage(); fr(doc, 0, 0, PW, PH, WHITE)
      drawHeader(doc, state.evaluationId, today)
      return BODY_Y
    }
    const ens = (cy: number, need: number): number => cy + need > SAFE_BOT ? newPage() : cy

    // ── Document title ─────────────────────────────────────────────────────
    y = ens(y, 16)
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); st(doc, TXT_H)
    doc.text('Laudo Individual de Sa\u00FAde Mental', PW / 2, y, { align: 'center' }); y += 5
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); st(doc, TXT_L)
    doc.text('Avalia\u00E7\u00E3o de Riscos Psicossociais e Ergonomia Cognitiva', PW / 2, y, { align: 'center' }); y += 4
    doc.setFontSize(5.5); st(doc, TXT_M)
    doc.text('Ref. NR-1: 1.5.7.2.1 \u00B7 Portaria MTE 1.419/2024 \u00B7 Programa de Gerenciamento de Riscos (PGR)', PW / 2, y, { align: 'center' })
    y += 5; fr(doc, MX, y, CW, 0.4, LIME); y += 5

    // ── Section 1: Employee ────────────────────────────────────────────────
    y = ens(y, 10); y = secHead(doc, '1. Identifica\u00E7\u00E3o do Colaborador', null, y)
    y = ens(y, 38)
    y = infoGrid(doc, [
      { l1: 'NOME COMPLETO',       v1: s(fd.nome),
        l2: 'CPF',                 v2: maskCpf(fd.cpf) },
      { l1: 'DATA DE NASCIMENTO',  v1: fmtBirth(fd.nascimento),
        l2: 'SEXO BIOL\u00D3GICO', v2: s(fd.sexo) },
      { l1: 'CARGO / FUN\u00C7\u00C3O', v1: s(fd.profissao),
        l2: 'SETOR',               v2: s((fd as Record<string, unknown>).employee_department ?? (fd.canal_percepcao as Record<string, unknown> | null)?.setor) },
      { l1: 'E-MAIL',              v1: s(fd.email),
        l2: 'ESCOLARIDADE',        v2: s(fd.escolaridade) },
    ], y); y += 2

    // ── Section 2: Company ─────────────────────────────────────────────────
    y = ens(y, 10); y = secHead(doc, '2. Identifica\u00E7\u00E3o da Empresa', null, y)
    y = ens(y, 22)
    y = infoGrid(doc, [
      { l1: 'RAZ\u00C3O SOCIAL', v1: s(co.name),       l2: 'CNPJ',         v2: s(co.cnpj) },
      { l1: 'GRAU DE RISCO',    v1: s(co.risk_grade),  l2: 'CNAE',         v2: s(co.cnae) },
    ], y); y += 2

    // ── Section 3: Assessment data ─────────────────────────────────────────
    y = ens(y, 10); y = secHead(doc, '3. Dados da Avalia\u00E7\u00E3o', null, y)
    y = ens(y, 30)
    y = infoGrid(doc, [
      { l1: 'ID DO LAUDO',          v1: laudoId(state.evaluationId), l2: 'DATA DA AVALIA\u00C7\u00C3O', v2: today },
      { l1: 'DATA DE EMISS\u00C3O', v1: today,                       l2: 'VALIDADE',                   v2: nextYear() },
      ...(co.sst_responsible_name ? [{ l1: 'RESPONS\u00C1VEL T\u00C9CNICO', v1: co.sst_responsible_name, l2: 'PLATAFORMA', v2: 'BrightMonitor v3' }] : [{ l1: 'PLATAFORMA', v1: 'BrightMonitor v3', l2: '', v2: '' }]),
    ], y); y += 2

    // ── Section 4: Scale scores ────────────────────────────────────────────
    y = ens(y, 10)
    y = secHead(doc, '4. Resultados das Escalas Cl\u00EDnicas',
      'As escalas abaixo foram aplicadas via plataforma BrightMonitor e comp\u00F5em a avalia\u00E7\u00E3o de sa\u00FAde mental para mapeamento de riscos psicossociais.',
      y)
    const srq = sc.srq20 ?? 0
    y = ens(y, 22)
    y = scaleTable(doc, [
      { escala: 'SRQ-20', dominio: 'Transtornos Mentais Comuns (OMS)', score: String(srq), range: '0\u201320', classificacao: srq20Label(srq), nivel: srq20Risk(srq) },
    ], y); y += 2

    const sec4 = aiSection(state.laudoMarkdown, 'SECTION_4')
    if (sec4) y = bodyText(doc, sec4, y, ens)
    y += 2

    // ── Section 5: AEP ────────────────────────────────────────────────────
    y = ens(y, 10)
    y = secHead(doc, '5. Avalia\u00E7\u00E3o Ergon\u00F4mica Preliminar (AEP)',
      'Ref. NR-1: 1.5.3.2.1 \u00B7 NR-17 \u2014 Fatores psicossociais e organizacionais do posto de trabalho.',
      y)

    const aepRows: AepRow[] = [
      { dim: 'Press\u00E3o por Metas e Carga',  score: sc.aep_pressure      ?? 0, max: 12 },
      { dim: 'Autonomia e Controle',             score: sc.aep_autonomy      ?? 0, max: 8  },
      { dim: 'Pausas e Jornada',                 score: sc.aep_breaks        ?? 0, max: 8  },
      { dim: 'Rela\u00E7\u00F5es Interpessoais e Suporte', score: sc.aep_relationships ?? 0, max: 12 },
      { dim: 'Demandas Cognitivas e Emocionais', score: sc.aep_cognitive     ?? 0, max: 8  },
      { dim: 'Ambiente e Organiza\u00E7\u00E3o', score: sc.aep_environment   ?? 0, max: 8  },
    ]
    const aepTotal = sc.aep_total ?? aepRows.reduce((acc, r) => acc + r.score, 0)
    y = ens(y, 65); y = aepTable(doc, aepRows, aepTotal, y)

    const percLivre = s(fd.aep_percepcao_livre, '')
    if (percLivre) {
      y = ens(y, 14)
      doc.setFontSize(7); doc.setFont('helvetica', 'italic'); st(doc, TXT_L)
      doc.text('Percep\u00E7\u00E3o livre do colaborador:', MX, y); y += 4
      doc.setFont('helvetica', 'italic'); st(doc, TXT_B)
      for (const l of doc.splitTextToSize(`\u201C${percLivre}\u201D`, CW - 6) as string[]) {
        y = ens(y, 5); doc.text(l, MX + 3, y); y += 3.8
      }
      y += 3
    }

    const sec5 = aiSection(state.laudoMarkdown, 'SECTION_5')
    if (sec5) y = bodyText(doc, sec5, y, ens)
    y += 2

    // ── Section 6: Risk classification ────────────────────────────────────
    y = ens(y, 10)
    y = secHead(doc, '6. Classifica\u00E7\u00E3o de Risco Psicossocial Integrado',
      'Resultado da matriz probabilidade \u00D7 severidade conforme metodologia BrightMonitor, integrando dados das escalas cl\u00EDnicas, AEP e SRQ-20.',
      y)
    y = ens(y, 60); y = riskMatrixGrid(doc, srq, aepTotal, y); y += 2

    const sec6 = aiSection(state.laudoMarkdown, 'SECTION_6')
    if (sec6) y = bodyText(doc, sec6, y, ens)
    y += 2

    // ── Section 7: PDCA ───────────────────────────────────────────────────
    y = ens(y, 10)
    y = secHead(doc, '7. Plano de A\u00E7\u00E3o Individual (PDCA)',
      'Ref. NR-1: 1.5.5.2 \u2014 Medidas de preven\u00E7\u00E3o com respons\u00E1veis e prazos.',
      y)

    const sec7raw = aiSection(state.laudoMarkdown, 'SECTION_7')
    const pdcaRows = parsePdca(sec7raw)
    if (pdcaRows.length > 0) {
      y = pdcaTable(doc, pdcaRows, y, ens)
    } else if (sec7raw) {
      // fallback: render as text if AI didn't follow pipe format
      y = bodyText(doc, sec7raw, y, ens)
    }
    y += 2

    // ── Section 8: History / Trends ────────────────────────────────────────
    y = ens(y, 10)
    y = secHead(doc, '8. Hist\u00F3rico de Avalia\u00E7\u00F5es (Linha do Tempo)',
      'Ref. NR-1: 1.5.7.3.3.1 \u2014 Registro com reten\u00E7\u00E3o garantida de 20 anos.',
      y)

    y = historyTable(doc, state.historyData, y, ens)
    const sec8 = aiSection(state.laudoMarkdown, 'SECTION_8')
    if (sec8) y = bodyText(doc, sec8, y, ens)
    y += 4

    // ── Section 9: Nota Metodológica ──────────────────────────────────────
    y = ens(y, 10)
    y = secHead(doc, '9. Nota Metodol\u00F3gica',
      'Ref. NR-1: 1.5.4.4.2.2 \u2014 Crit\u00E9rios de avalia\u00E7\u00E3o expl\u00EDcitos e documentados.',
      y)
    y = bodyText(doc,
      'A plataforma BrightMonitor utiliza instrumentos psicométricos validados internacionalmente e adaptados para uso no Brasil. A classificação de risco psicossocial integrado é calculada pela matriz probabilidade × severidade, conforme exigência do PGR (NR-1: 1.5.4.4.2). A probabilidade é estimada a partir dos scores das escalas clínicas; a severidade é determinada pela combinação dos fatores organizacionais (AEP).\n\nPonto de corte SRQ-20: score total maior ou igual a 8 indica rastreamento positivo para transtornos mentais comuns (OMS, 1994). Este instrumento é de rastreamento (screening), não de diagnóstico. AEP conforme NR-17 e Portaria MTE 1.419/2024.',
      y, ens)
    y += 2

    // ── Section 10: Validação e Assinaturas ───────────────────────────────
    y = ens(y, 45)
    y = secHead(doc, '10. Valida\u00E7\u00E3o e Assinaturas', null, y)
    y += 4

    // Two signature blocks
    const sigW = (CW - 10) / 2
    const sig1X = MX; const sig2X = MX + sigW + 10

    for (const sx of [sig1X, sig2X]) {
      sd(doc, TXT_L); doc.setLineWidth(0.3)
      doc.line(sx, y, sx + sigW, y)
    }
    y += 5

    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); st(doc, TXT_B)
    doc.text(co.sst_responsible_name || 'Dra. Soraya Aurani Jorge Cecilio', sig1X, y)
    doc.text('Respons\u00E1vel SST da Empresa', sig2X, y)
    y += 4
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); st(doc, TXT_L)
    doc.text('Diretora T\u00E9cnica BrightMonitor', sig1X, y)
    doc.text('Assinatura Digital ICP-Brasil', sig2X, y)
    y += 3.5
    doc.text('CRM/SP 60.246', sig1X, y)
    doc.text('Carimbo de data/hora', sig2X, y)
    y += 8

    // Legal notice
    doc.setFontSize(5.5); doc.setFont('helvetica', 'italic'); st(doc, TXT_M)
    const legal = 'AVISO LEGAL: Este laudo \u00E9 gerado eletronicamente pela plataforma BrightMonitor (Bright Brains \u2014 Instituto da Mente) e possui validade como documento t\u00E9cnico integrante do Programa de Gerenciamento de Riscos (PGR). Os resultados s\u00E3o de natureza probabil\u00EDstica e n\u00E3o constituem diagn\u00F3stico cl\u00EDnico definitivo. A interpreta\u00E7\u00E3o deve ser feita exclusivamente por profissional de sa\u00FAde habilitado. Dados protegidos conforme LGPD (Lei 13.709/2018). Reten\u00E7\u00E3o garantida por 20 anos conforme NR-1: 1.5.7.3.3.1.'
    for (const l of doc.splitTextToSize(legal, CW) as string[]) {
      y = ens(y, 4); doc.text(l, MX, y); y += 3
    }
    y += 4

    // ── Confidentiality stamp ─────────────────────────────────────────────
    y = ens(y, 22); y = confStamp(doc, y)

    // ── Footers on all pages ──────────────────────────────────────────────
    const total = doc.getNumberOfPages()
    for (let p = 1; p <= total; p++) { doc.setPage(p); drawFooter(doc, today, p) }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    return { pdfBuffer, status: 'pdf_built' }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown buildPdf error'
    console.error(`[b2b-laudo] buildPdf failed: ${message}`)
    return { errors: [message], status: 'error' }
  }
}

// ---------------------------------------------------------------------------
// Node 4: Store Result
// ---------------------------------------------------------------------------

export async function storeResult(
  state: B2BLaudoState
): Promise<Partial<B2BLaudoState>> {
  try {
    const { uploadPdf, updateEvaluation, fetchEvaluationConsents } = await import('./b2b-laudo.storage')
    const { sendB2BLaudoEmail, sendB2CConsentLead } = await import('~/app/api/assessment/lib/send-email')

    if (!state.pdfBuffer) throw new Error('No PDF buffer available')

    const pdfUrl = await uploadPdf(state.evaluationId, state.pdfBuffer)
    await updateEvaluation(state.evaluationId, {
      laudo_pdf_url: pdfUrl,
      laudo_markdown: state.laudoMarkdown,
      status: 'completed',
    })

    const patientName  = (state.formData.nome as string)     || 'Colaborador'
    const patientEmail = (state.formData.email as string)    || undefined
    const patientPhone = (state.formData.telefone as string) || undefined

    await sendB2BLaudoEmail({ patientName, pdfUrl, evaluationId: state.evaluationId, companyName: state.companyData.name })

    try {
      const consents = await fetchEvaluationConsents(state.evaluationId)
      if (consents.b2c_consent) {
        await sendB2CConsentLead({ patientName, patientEmail, patientPhone, evaluationId: state.evaluationId, companyName: state.companyData.name, contactConsent: !!consents.b2c_contact_consent })
      }
    } catch (e) { console.warn('[b2b-laudo] B2C consent notification skipped:', e) }

    return { pdfUrl, status: 'stored' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown storeResult error'
    console.error(`[b2b-laudo] storeResult failed: ${message}`)
    return { errors: [message], status: 'error' }
  }
}
