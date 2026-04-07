// frontend/app/api/b2b/[companyId]/reports/route.ts

/* eslint-disable max-lines, complexity */
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import { jsPDF } from 'jspdf'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser, resolveCycle } from '../../lib/getB2BUser'
import { computeNormalizedScore, getRiskLevel } from '../../lib/riskUtils'

export const runtime = 'nodejs'

import { LOGO_PNG_RAW } from '../../../assessment/generate-pdf/pdf-helpers'

// ─── Dashboard Dark Theme Palette (RGB) ───────────────────────────────────────
const C = {
  // Backgrounds
  pageBg: [12, 20, 37] as RGB, // #0c1425
  cardBg: [17, 27, 46] as RGB, // #111b2e
  cardAlt: [25, 35, 55] as RGB, // Slightly lighter for alternating rows
  trackBg: [30, 41, 59] as RGB, // #1e293b

  // Text
  textPrimary: [226, 232, 240] as RGB, // #e2e8f0
  textSecondary: [148, 163, 184] as RGB, // #94a3b8
  textMuted: [100, 116, 139] as RGB, // #64748b

  // Brand
  lime: [197, 225, 85] as RGB, // #c5e155

  // Risk
  critical: [239, 68, 68] as RGB, // #ef4444
  elevated: [249, 115, 22] as RGB, // #f97316
  moderate: [234, 179, 8] as RGB, // #eab308
  low: [34, 197, 94] as RGB, // #22c55e

  // Borders
  border: [40, 50, 70] as RGB, // rgba(255,255,255,0.06) approx
}

type RGB = [number, number, number]

const RISK_EN_KEYS = ['critical', 'elevated', 'moderate', 'low'] as const
type RiskKey = (typeof RISK_EN_KEYS)[number]

const RISK_LABEL: Record<RiskKey, string> = {
  critical: 'Crítico',
  elevated: 'Elevado',
  moderate: 'Moderado',
  low: 'Baixo',
}

const RISK_COLOR: Record<RiskKey, RGB> = {
  critical: C.critical,
  elevated: C.elevated,
  moderate: C.moderate,
  low: C.low,
}

const RISK_PT_CSV: Record<string, string> = {
  critical: 'critico',
  elevated: 'elevado',
  moderate: 'moderado',
  low: 'baixo',
}

const SCALE_META: { key: string; label: string; max: number; color: RGB }[] = [
  { key: 'phq9', label: 'PHQ-9', max: 27, color: [96, 165, 250] },
  { key: 'gad7', label: 'GAD-7', max: 21, color: [167, 139, 250] },
  { key: 'srq20', label: 'SRQ-20', max: 20, color: [249, 115, 22] },
  { key: 'pss10', label: 'PSS-10', max: 40, color: [234, 179, 8] },
  { key: 'mbi', label: 'MBI-EE', max: 80, color: [239, 68, 68] },
  { key: 'isi', label: 'ISI', max: 28, color: [34, 211, 238] },
]

interface ReportFilters {
  department?: string
  riskLevel?: string
  dateFrom?: string
  dateTo?: string
}

type EvalRow = {
  id: string
  scores: Record<string, number> | null
  employee_department: string | null
  created_at: string
}

type RiskDist = Record<RiskKey, number>

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const { searchParams } = new URL(request.url)
  const cycleParam = searchParams.get('cycle')

  const auth = await getB2BUser(request, companyId)
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status })

  const cycleRes = await resolveCycle(companyId, cycleParam)
  if ('error' in cycleRes)
    return NextResponse.json(
      { error: cycleRes.error },
      { status: cycleRes.status }
    )

  const body = await request.json()
  const rawType = (body.type ?? body.reportType) as string | undefined
  const department = body.department as string | undefined
  const filters: ReportFilters = {
    ...(body.filters ?? {}),
    department: department ?? (body.filters?.department as string | undefined),
  }

  const typeMap: Record<string, string> = {
    'gro-consolidado': 'gro-consolidado',
    'por-departamento': 'departamento',
    'csv-export': 'csv',
    departamento: 'departamento',
    csv: 'csv',
  }
  const reportType = rawType ? (typeMap[rawType] ?? rawType) : undefined
  if (!reportType)
    return NextResponse.json({ error: 'type é obrigatório' }, { status: 400 })

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = sb
    .from('mental_health_evaluations')
    .select('id, scores, employee_department, created_at')
    .eq('company_id', companyId)
    .eq('cycle_id', cycleRes.cycleId)

  if (filters.department)
    query = query.eq('employee_department', filters.department)
  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters.dateTo) query = query.lte('created_at', filters.dateTo)

  const { data: rows, error } = await query
  if (error) {
    console.error('[b2b/reports]', error)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }

  const evaluations: EvalRow[] = (rows ?? []).map((r) => ({
    ...r,
    scores: r.scores as Record<string, number> | null,
  }))

  const filtered = filters.riskLevel
    ? evaluations.filter((e) => {
        const norm = computeNormalizedScore(e.scores)
        return norm != null && getRiskLevel(norm) === filters.riskLevel
      })
    : evaluations

  if (reportType === 'csv') return buildCsvResponse(filtered, companyId)
  if (reportType === 'departamento')
    return buildDepartmentPdf(filtered, companyId, sb)
  return buildGroConsolidadoPdf(filtered, companyId, sb)
}

// ─── CSV ──────────────────────────────────────────────────────────────────────
function buildCsvResponse(evaluations: EvalRow[], companyId: string) {
  const scaleKeys = ['phq9', 'gad7', 'srq20', 'pss10', 'mbi', 'isi']
  const header = [
    'id',
    'departamento',
    'data_avaliacao',
    'nivel_risco',
    ...scaleKeys,
  ]
  const csvRows = [header.join(',')]

  for (const ev of evaluations) {
    const norm = computeNormalizedScore(ev.scores)
    const riskEn = norm != null ? getRiskLevel(norm) : ''
    const risk = riskEn ? (RISK_PT_CSV[riskEn] ?? riskEn) : ''
    const scaleVals = scaleKeys.map((k) =>
      ev.scores && typeof ev.scores[k] === 'number' ? String(ev.scores[k]) : ''
    )
    csvRows.push(
      [
        ev.id,
        ev.employee_department ?? '',
        ev.created_at,
        risk,
        ...scaleVals,
      ].join(',')
    )
  }

  const csvContent = '\uFEFF' + csvRows.join('\n')
  const csvBuffer = new TextEncoder().encode(csvContent)
  const filename = `relatorio-csv-${companyId}-${Date.now()}.csv`

  return new NextResponse(csvBuffer, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Generated-At': new Date().toISOString(),
    },
  })
}

// ─── Data helpers ─────────────────────────────────────────────────────────────
function computeRiskDist(evaluations: EvalRow[]): RiskDist {
  const dist: RiskDist = { critical: 0, elevated: 0, moderate: 0, low: 0 }
  for (const ev of evaluations) {
    const norm = computeNormalizedScore(ev.scores)
    if (norm != null) dist[getRiskLevel(norm)]++
  }
  return dist
}

function computeScaleAverages(evaluations: EvalRow[]) {
  const sums: Record<string, number> = {}
  const counts: Record<string, number> = {}
  for (const ev of evaluations) {
    if (!ev.scores) continue
    for (const s of SCALE_META) {
      const v = ev.scores[s.key]
      if (typeof v === 'number') {
        sums[s.key] = (sums[s.key] ?? 0) + v
        counts[s.key] = (counts[s.key] ?? 0) + 1
      }
    }
  }
  return SCALE_META.map((s) => ({
    ...s,
    avg: counts[s.key] ? sums[s.key] / counts[s.key] : null,
    pct: counts[s.key] ? (sums[s.key] / counts[s.key] / s.max) * 100 : 0,
  }))
}

// ─── PDF drawing primitives ───────────────────────────────────────────────────

const PAGE_W = 210
const MARGIN = 16
const CONTENT_W = PAGE_W - MARGIN * 2

/** Fills the entire page with the dark background */
function initPage(doc: jsPDF) {
  doc.setFillColor(...C.pageBg)
  doc.rect(0, 0, PAGE_W, 297, 'F')
}

/** Minimalist dashboard header */
function drawPageHeader(
  doc: jsPDF,
  companyName: string,
  reportTitle: string,
  subtitle?: string
) {
  // Navy header background
  doc.setFillColor(...C.cardBg)
  doc.rect(0, 0, PAGE_W, 26, 'F')

  // Lime bottom stripe
  doc.setFillColor(...C.lime)
  doc.rect(0, 26, PAGE_W, 2, 'F')

  // Logo
  try {
    doc.addImage(LOGO_PNG_RAW, 'PNG', MARGIN, 5, 16, 16)
  } catch {
    // logo optional
  }

  // Brand text
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.lime)
  doc.text('BRIGHT PRECISION', MARGIN + 20, 13)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textSecondary)
  doc.text('Bright Brains · Instituto da Mente', MARGIN + 20, 18)

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...C.textPrimary)
  doc.text(reportTitle, MARGIN, 40)

  // Subtitle row
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C.textSecondary)
  doc.text(`Empresa: ${companyName}`, MARGIN, 48)
  if (subtitle) doc.text(subtitle, MARGIN, 54)

  doc.setTextColor(...C.textMuted)
  doc.text(
    `Data: ${new Date().toLocaleDateString('pt-BR')}`,
    PAGE_W - MARGIN,
    48,
    {
      align: 'right',
    }
  )

  // Subtle separator line
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.2)
  doc.line(MARGIN, 58, PAGE_W - MARGIN, 58)
}

function drawFooter(doc: jsPDF, pageNum?: number) {
  const ph = doc.internal.pageSize.getHeight()
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.2)
  doc.line(MARGIN, ph - 12, PAGE_W - MARGIN, ph - 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...C.textMuted)
  doc.text('BrightMonitor · Saúde Mental Corporativa', MARGIN, ph - 6)

  if (pageNum !== undefined) {
    doc.text(`Página ${pageNum}`, PAGE_W - MARGIN, ph - 6, { align: 'right' })
  }
}

/** Simple section title */
function drawSectionLabel(doc: jsPDF, text: string, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...C.textPrimary)
  doc.text(text, MARGIN, y + 4)
  return y + 10
}

/** Dashboard-style KPI cards */
function drawRiskKpiRow(
  doc: jsPDF,
  dist: RiskDist,
  total: number,
  y: number
): number {
  const cardW = (CONTENT_W - 3 * 4) / 4
  RISK_EN_KEYS.forEach((key, i) => {
    const x = MARGIN + i * (cardW + 4)
    const color = RISK_COLOR[key]
    const count = dist[key]
    const pct = total > 0 ? Math.round((count / total) * 100) : 0

    // Card background
    doc.setFillColor(...C.cardBg)
    doc.setDrawColor(color[0], color[1], color[2]) // Colored border
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, cardW, 26, 2, 2, 'FD')

    // Count (big)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(...color)
    doc.text(String(count), x + cardW / 2, y + 12, { align: 'center' })

    // Label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...C.textSecondary)
    doc.text(RISK_LABEL[key], x + cardW / 2, y + 18, { align: 'center' })

    // Percentage
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.textMuted)
    doc.text(`${pct}%`, x + cardW / 2, y + 23, { align: 'center' })
  })
  return y + 32
}

/** Segmented distribution bar */
function drawDistributionBar(
  doc: jsPDF,
  dist: RiskDist,
  total: number,
  y: number
): number {
  if (total === 0) return y + 8

  const BAR_H = 6
  let x = MARGIN

  for (const key of RISK_EN_KEYS) {
    const pct = dist[key] / total
    const w = pct * CONTENT_W
    if (w < 0.5) continue
    doc.setFillColor(...RISK_COLOR[key])
    const isFirst = x === MARGIN
    const isLast =
      key === 'low' ||
      (dist[key] > 0 &&
        key ===
          RISK_EN_KEYS.find(
            (k) =>
              RISK_EN_KEYS.indexOf(k) > RISK_EN_KEYS.indexOf(key) && dist[k] > 0
          ))
    doc.roundedRect(x, y, w, BAR_H, isFirst ? 1.5 : 0, isLast ? 1.5 : 0, 'F')
    x += w
  }

  // Legend row
  let lx = MARGIN
  y += BAR_H + 4
  for (const key of RISK_EN_KEYS) {
    if (dist[key] === 0) continue
    const pct = Math.round((dist[key] / total) * 100)
    doc.setFillColor(...RISK_COLOR[key])
    doc.roundedRect(lx, y, 4, 4, 0.5, 0.5, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...C.textSecondary)
    doc.text(`${RISK_LABEL[key]} ${dist[key]} (${pct}%)`, lx + 6, y + 3.5)
    lx += 42
  }

  return y + 10
}

/** Horizontal bar row for a single metric */
function drawMetricBar(
  doc: jsPDF,
  x: number,
  y: number,
  barW: number,
  label: string,
  value: string,
  pct: number,
  color: RGB
): number {
  const BAR_H = 5
  const labelW = 40

  // Label
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...C.textSecondary)
  doc.text(label, x, y + BAR_H - 0.5)

  // Track
  doc.setFillColor(...C.trackBg)
  doc.roundedRect(x + labelW, y, barW, BAR_H, 1, 1, 'F')

  // Fill
  const filled = Math.max(1, (pct / 100) * barW)
  doc.setFillColor(...color)
  doc.roundedRect(x + labelW, y, filled, BAR_H, 1, 1, 'F')

  // Value
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C.textPrimary)
  doc.text(value, x + labelW + barW + 4, y + BAR_H - 0.5)

  return y + BAR_H + 4
}

/** Department section header card */
function drawDeptHeader(
  doc: jsPDF,
  name: string,
  count: number,
  y: number
): number {
  doc.setFillColor(...C.cardBg)
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.roundedRect(MARGIN, y, CONTENT_W, 12, 2, 2, 'FD')

  // Dept name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...C.textPrimary)
  doc.text(name, MARGIN + 4, y + 8)

  // Count
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C.textSecondary)
  doc.text(`${count} avaliações`, PAGE_W - MARGIN - 4, y + 8, {
    align: 'right',
  })

  return y + 16
}

// ─── GRO Consolidado PDF ──────────────────────────────────────────────────────
async function buildGroConsolidadoPdf(
  evaluations: EvalRow[],
  companyId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: SupabaseClient<any, any, any>
) {
  const { data: company } = await sb
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()

  const companyName = company?.name ?? companyId
  const total = evaluations.length
  const dist = computeRiskDist(evaluations)
  const scaleAvgs = computeScaleAverages(evaluations)

  const byDept = new Map<string, EvalRow[]>()
  for (const ev of evaluations) {
    const dept = ev.employee_department ?? 'Sem departamento'
    if (!byDept.has(dept)) byDept.set(dept, [])
    byDept.get(dept)!.push(ev)
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let pageNum = 1

  // ── PAGE 1: Company-wide overview ──────────────────────────────────────────
  initPage(doc)
  drawPageHeader(doc, companyName, 'GRO Consolidado — Riscos Psicossociais')

  let y = 68

  // Total callout
  doc.setFillColor(...C.cardBg)
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.roundedRect(MARGIN, y, CONTENT_W, 16, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...C.lime)
  doc.text(String(total), MARGIN + 6, y + 11.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...C.textSecondary)
  doc.text(
    'avaliações neste ciclo',
    MARGIN + 6 + doc.getTextWidth(String(total)) + 3,
    y + 11
  )

  y += 22

  // Risk KPI row
  y = drawSectionLabel(doc, 'Distribuição de Risco', y)
  y = drawRiskKpiRow(doc, dist, total, y)

  // Distribution bar
  y = drawSectionLabel(doc, 'Proporção por Nível de Risco', y)
  y = drawDistributionBar(doc, dist, total, y)
  y += 6

  // Scale averages
  y = drawSectionLabel(doc, 'Médias por Escala Clínica', y)
  const barW = CONTENT_W - 40 - 12
  for (const s of scaleAvgs) {
    if (s.avg === null) continue
    y = drawMetricBar(
      doc,
      MARGIN,
      y,
      barW,
      s.label,
      `${s.avg.toFixed(1)} / ${s.max}`,
      s.pct,
      s.color
    )
  }

  drawFooter(doc, pageNum)

  // ── REMAINING PAGES: One page per department ───────────────────────────────
  for (const [dept, deptEvals] of Array.from(byDept)) {
    doc.addPage()
    pageNum++

    initPage(doc)
    drawPageHeader(doc, companyName, 'GRO Consolidado — Por Departamento')

    y = 68

    const dDist = computeRiskDist(deptEvals)
    const dTotal = deptEvals.length

    y = drawDeptHeader(doc, dept, dTotal, y)
    y = drawRiskKpiRow(doc, dDist, dTotal, y)
    y = drawDistributionBar(doc, dDist, dTotal, y)
    y += 6

    // Scale averages for this dept
    const dScales = computeScaleAverages(deptEvals)
    const hasScales = dScales.some((s) => s.avg !== null)
    if (hasScales) {
      y = drawSectionLabel(doc, 'Médias por Escala Clínica', y)
      for (const s of dScales) {
        if (s.avg === null) continue
        y = drawMetricBar(
          doc,
          MARGIN,
          y,
          barW,
          s.label,
          `${s.avg.toFixed(1)} / ${s.max}`,
          s.pct,
          s.color
        )
      }
    }

    drawFooter(doc, pageNum)
  }

  const pdfBuffer = doc.output('arraybuffer')
  const filename = `relatorio-gro-${companyId}-${Date.now()}.pdf`

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Generated-At': new Date().toISOString(),
    },
  })
}

// ─── Department PDF ───────────────────────────────────────────────────────────
async function buildDepartmentPdf(
  evaluations: EvalRow[],
  companyId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: SupabaseClient<any, any, any>
) {
  const { data: company } = await sb
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()

  const companyName = company?.name ?? companyId

  const byDept = new Map<string, EvalRow[]>()
  for (const ev of evaluations) {
    const dept = ev.employee_department ?? 'Sem departamento'
    if (!byDept.has(dept)) byDept.set(dept, [])
    byDept.get(dept)!.push(ev)
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const total = evaluations.length
  const dist = computeRiskDist(evaluations)
  let pageNum = 1

  // ── PAGE 1: Company summary ────────────────────────────────────────────────
  initPage(doc)
  drawPageHeader(
    doc,
    companyName,
    'Relatório por Departamento',
    `Total: ${total} avaliações · ${byDept.size} departamento${byDept.size !== 1 ? 's' : ''}`
  )

  let y = 68

  y = drawSectionLabel(doc, 'Visão Geral da Empresa', y)
  y = drawRiskKpiRow(doc, dist, total, y)
  y = drawDistributionBar(doc, dist, total, y)
  y += 8

  // Department summary table
  y = drawSectionLabel(doc, 'Resumo por Departamento', y)

  // Table header
  doc.setFillColor(...C.cardBg)
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.rect(MARGIN, y, CONTENT_W, 8, 'FD')
  const TH_COLS = [
    { label: 'Departamento', x: MARGIN + 4, w: 52, align: 'left' as const },
    { label: 'Avaliações', x: MARGIN + 56, w: 20, align: 'center' as const },
    { label: 'Risco', x: MARGIN + 76, w: 24, align: 'center' as const },
    { label: 'Crítico', x: MARGIN + 100, w: 18, align: 'center' as const },
    { label: 'Elevado', x: MARGIN + 118, w: 18, align: 'center' as const },
    { label: 'Moderado', x: MARGIN + 136, w: 22, align: 'center' as const },
    { label: 'Baixo', x: MARGIN + 158, w: 18, align: 'center' as const },
  ]

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C.textSecondary)
  for (const col of TH_COLS) {
    doc.text(
      col.label,
      col.align === 'left' ? col.x : col.x + col.w / 2,
      y + 5.5,
      {
        align: col.align,
      }
    )
  }
  y += 8

  let alt = false
  for (const [dept, deptEvals] of Array.from(byDept)) {
    if (y > 265) {
      drawFooter(doc, pageNum)
      doc.addPage()
      pageNum++
      initPage(doc)
      drawPageHeader(doc, companyName, 'Relatório por Departamento (cont.)')
      y = 68
    }

    const dDist = computeRiskDist(deptEvals)
    const dominant =
      dDist.critical > 0
        ? 'critical'
        : dDist.elevated > 0
          ? 'elevated'
          : dDist.moderate > 0
            ? 'moderate'
            : 'low'

    doc.setFillColor(...(alt ? C.cardAlt : C.cardBg))
    doc.rect(MARGIN, y, CONTENT_W, 8, 'F')
    alt = !alt

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...C.textPrimary)
    doc.text(
      dept.length > 26 ? dept.slice(0, 24) + '…' : dept,
      TH_COLS[0].x,
      y + 5.5
    )

    doc.setTextColor(...C.textSecondary)
    doc.text(
      String(deptEvals.length),
      TH_COLS[1].x + TH_COLS[1].w / 2,
      y + 5.5,
      { align: 'center' }
    )

    // Risk text
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...RISK_COLOR[dominant])
    doc.text(RISK_LABEL[dominant], TH_COLS[2].x + TH_COLS[2].w / 2, y + 5.5, {
      align: 'center',
    })

    // Risk counts
    const counts = [
      { col: TH_COLS[3], val: dDist.critical, color: C.critical },
      { col: TH_COLS[4], val: dDist.elevated, color: C.elevated },
      { col: TH_COLS[5], val: dDist.moderate, color: C.moderate },
      { col: TH_COLS[6], val: dDist.low, color: C.low },
    ]
    for (const cc of counts) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(...cc.color)
      doc.text(String(cc.val), cc.col.x + cc.col.w / 2, y + 5.5, {
        align: 'center',
      })
    }

    y += 8
  }

  // Draw final border around table
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.rect(MARGIN, y, CONTENT_W, 0)

  drawFooter(doc, pageNum)

  // ── ONE PAGE PER DEPARTMENT (detailed) ────────────────────────────────────
  for (const [dept, deptEvals] of Array.from(byDept)) {
    doc.addPage()
    pageNum++

    initPage(doc)
    drawPageHeader(doc, companyName, 'Análise Detalhada por Departamento')

    y = 68

    const dDist = computeRiskDist(deptEvals)
    const dTotal = deptEvals.length

    y = drawDeptHeader(doc, dept, dTotal, y)
    y = drawRiskKpiRow(doc, dDist, dTotal, y)
    y = drawDistributionBar(doc, dDist, dTotal, y)
    y += 6

    const dScales = computeScaleAverages(deptEvals)
    const hasScales = dScales.some((s) => s.avg !== null)
    if (hasScales) {
      y = drawSectionLabel(doc, 'Médias por Escala Clínica', y)
      const barW = CONTENT_W - 40 - 12
      for (const s of dScales) {
        if (s.avg === null) continue
        y = drawMetricBar(
          doc,
          MARGIN,
          y,
          barW,
          s.label,
          `${s.avg.toFixed(1)} / ${s.max}`,
          s.pct,
          s.color
        )
      }
    }

    drawFooter(doc, pageNum)
  }

  const pdfBuffer = doc.output('arraybuffer')
  const filename = `relatorio-dept-${companyId}-${Date.now()}.pdf`

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Generated-At': new Date().toISOString(),
    },
  })
}
