// frontend/app/api/brightmonitor/[companyId]/inventory/route.ts

import { createClient } from '@supabase/supabase-js'
import { jsPDF } from 'jspdf'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { LOGO_PNG_RAW } from '../../../assessment/generate-pdf/pdf-helpers'
import { COPSOQ_RISKS } from '../../lib/copsoqRisks'
import { getB2BUser, resolveCycle } from '../../lib/getB2BUser'
import {
  computeDomainMean,
  computeNormalizedScore,
  COPSOQ_CLASSIFICATION_LABELS,
  getCopsoqClassification,
  getRiskLevel,
} from '../../lib/riskUtils'

export const runtime = 'nodejs'

// ─── Dashboard Dark Theme Palette (RGB) ───────────────────────────────────────
const C = {
  pageBg: [12, 20, 37] as [number, number, number],
  cardBg: [17, 27, 46] as [number, number, number],
  textPrimary: [226, 232, 240] as [number, number, number],
  textSecondary: [148, 163, 184] as [number, number, number],
  textMuted: [100, 116, 139] as [number, number, number],
  lime: [197, 225, 85] as [number, number, number],
  border: [40, 50, 70] as [number, number, number],
}

const PAGE_W = 210
const MARGIN = 16
const CONTENT_W = PAGE_W - MARGIN * 2

function initPage(doc: jsPDF) {
  doc.setFillColor(...C.pageBg)
  doc.rect(0, 0, PAGE_W, 297, 'F')
}

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

function safeString(val: unknown): string {
  if (typeof val === 'string') return val
  if (Array.isArray(val)) return val.join(', ')
  if (typeof val === 'object' && val !== null) {
    try {
      const text = (val as any).text || (val as any).value
      if (text && typeof text === 'string') return text
      return JSON.stringify(val)
    } catch {
      return 'Não informado'
    }
  }
  return val != null
    ? String(val as string | number | boolean)
    : 'Não informado'
}

const SCALE_MAX: Record<string, number> = {
  phq9: 27,
  gad7: 21,
  srq20: 20,
  pss10: 40,
  mbi: 80,
  isi: 28,
}

interface InventoryField {
  label: string
  value: string
}

function computeCopsoqInventoryField(
  evaluations: Array<Record<string, unknown>>
): InventoryField | null {
  if (evaluations.length === 0) return null
  const lines: string[] = []
  for (const risk of COPSOQ_RISKS) {
    const mean = computeDomainMean(evaluations, risk.axis)
    const cls = getCopsoqClassification(mean)
    const label = cls ? COPSOQ_CLASSIFICATION_LABELS[cls] : 'Sem dados'
    const score = mean != null ? mean.toFixed(1) : '—'
    lines.push(`• ${risk.name}: ${label} (média ${score}/5)`)
  }
  return {
    label: '0. Inventário de Riscos Psicossociais (COPSOQ II)',
    value: lines.join('\n'),
  }
}

// eslint-disable-next-line complexity
function computeAutomatedFields(
  evaluations: Array<{
    scores: Record<string, number> | null
    employee_department?: string | null
  }>
): InventoryField[] {
  const scaleLabels: Record<string, string> = {
    phq9: 'Depressão (PHQ-9)',
    gad7: 'Ansiedade (GAD-7)',
    srq20: 'Transtornos Mentais Comuns (SRQ-20)',
    pss10: 'Estresse Percebido (PSS-10)',
    mbi: 'Burnout (MBI)',
    isi: 'Insônia (ISI)',
  }

  const scaleSums: Record<string, number> = {}
  const scaleCounts: Record<string, number> = {}
  const departments = new Set<string>()
  const riskLevels: string[] = []

  for (const ev of evaluations) {
    if (!ev.scores) continue

    if (ev.employee_department) departments.add(ev.employee_department)

    for (const key of Object.keys(SCALE_MAX)) {
      if (typeof ev.scores[key] === 'number') {
        scaleSums[key] = (scaleSums[key] ?? 0) + ev.scores[key]
        scaleCounts[key] = (scaleCounts[key] ?? 0) + 1
      }
    }

    const norm = computeNormalizedScore(ev.scores)
    if (norm != null) riskLevels.push(getRiskLevel(norm))
  }

  const perigos: string[] = []
  const agravos: string[] = []
  for (const [key, max] of Object.entries(SCALE_MAX)) {
    if (!scaleCounts[key]) continue
    const avg = scaleSums[key] / scaleCounts[key]
    const pct = avg / max
    if (pct >= 0.5) {
      perigos.push(
        `${scaleLabels[key] ?? key} (média ${avg.toFixed(1)}/${max})`
      )
    }
    if (pct >= 0.6) {
      agravos.push(scaleLabels[key] ?? key)
    }
  }

  const criticalCount = riskLevels.filter((r) => r === 'critical').length
  const elevatedCount = riskLevels.filter((r) => r === 'elevated').length
  const totalEval = evaluations.length

  const classificacao =
    criticalCount > totalEval * 0.3
      ? 'ALTO'
      : elevatedCount + criticalCount > totalEval * 0.5
        ? 'SUBSTANCIAL'
        : 'MODERADO'

  return [
    {
      label: '1. Perigos Psicossociais Identificados',
      value:
        perigos.length > 0
          ? perigos.join('; ')
          : 'Nenhum perigo significativo identificado',
    },
    {
      label: '2. Possíveis Agravos à Saúde',
      value:
        agravos.length > 0
          ? agravos.join('; ')
          : 'Sem agravos significativos identificados',
    },
    {
      label: '3. Grupos de Exposição',
      value:
        departments.size > 0
          ? Array.from(departments).join(', ')
          : 'Todos os departamentos',
    },
    {
      label: '4. Fontes de Exposição',
      value:
        'Ambiente de trabalho, organização do trabalho, relações interpessoais, carga e ritmo de trabalho',
    },
    {
      label: '5. Análise Preliminar de Risco',
      value: `Total avaliados: ${totalEval}. Risco Crítico: ${criticalCount} (${totalEval > 0 ? Math.round((criticalCount / totalEval) * 100) : 0}%). Risco Elevado: ${elevatedCount} (${totalEval > 0 ? Math.round((elevatedCount / totalEval) * 100) : 0}%).`,
    },
    {
      label: '6. Classificação de Risco Psicossocial',
      value: classificacao,
    },
  ]
}

function buildInventoryPdf(
  automated: InventoryField[],
  companyFields: InventoryField[],
  companyName: string
): ArrayBuffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let pageNum = 1

  initPage(doc)
  drawPageHeader(doc, companyName, 'INVENTÁRIO DE RISCOS PSICOSSOCIAIS – NR-1')

  let y = 68

  const allFields = [...automated, ...companyFields]

  for (const field of allFields) {
    if (y > 260) {
      drawFooter(doc, pageNum)
      doc.addPage()
      pageNum++
      initPage(doc)
      drawPageHeader(
        doc,
        companyName,
        'INVENTÁRIO DE RISCOS PSICOSSOCIAIS – NR-1 (cont.)'
      )
      y = 68
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.textPrimary)
    doc.text(field.label, MARGIN, y)
    y += 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...C.textSecondary)
    const lines = doc.splitTextToSize(safeString(field.value), CONTENT_W)
    doc.text(lines, MARGIN, y)
    y += lines.length * 5 + 8
  }

  y += 5
  if (y > 260) {
    drawFooter(doc, pageNum)
    doc.addPage()
    pageNum++
    initPage(doc)
    drawPageHeader(
      doc,
      companyName,
      'INVENTÁRIO DE RISCOS PSICOSSOCIAIS – NR-1 (cont.)'
    )
    y = 68
  }

  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...C.textMuted)
  doc.text(
    'Documento gerado automaticamente pelo sistema BrightMonitor conforme NR-1 (Portaria MTP nº 4.219/2022).',
    MARGIN,
    y
  )

  drawFooter(doc, pageNum)

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  return doc.output('arraybuffer') as ArrayBuffer
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const { searchParams } = new URL(request.url)
  const cycleParam = searchParams.get('cycle')

  const auth = await getB2BUser(request, companyId)
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status })
  }

  const cycleRes = await resolveCycle(companyId, cycleParam)
  if ('error' in cycleRes) {
    return NextResponse.json(
      { error: cycleRes.error },
      { status: cycleRes.status }
    )
  }

  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const psychosocialCols = Array.from(
    new Set(COPSOQ_RISKS.map((r) => r.axis))
  )
  const evalSelect = ['scores', 'employee_department', ...psychosocialCols].join(
    ', '
  )

  const [evalResult, companyResult] = await Promise.all([
    sb
      .from('mental_health_evaluations')
      .select(evalSelect)
      .eq('company_id', companyId)
      .eq('cycle_id', cycleRes.cycleId),
    sb.from('companies').select('*').eq('id', companyId).single(),
  ])

  if (evalResult.error) {
    console.error('[b2b/nr1-inventory] evals', evalResult.error)
    return NextResponse.json(
      { error: 'Erro ao buscar avaliações' },
      { status: 500 }
    )
  }

  if (companyResult.error || !companyResult.data) {
    console.error('[b2b/nr1-inventory] company', companyResult.error)
    return NextResponse.json(
      { error: 'Empresa não encontrada' },
      { status: 404 }
    )
  }

  const company = companyResult.data
  const rawEvals = (evalResult.data ?? []) as unknown as Array<
    Record<string, unknown>
  >
  const evaluations = rawEvals.map((r) => ({
    scores: r.scores as Record<string, number> | null,
    employee_department: r.employee_department as string | null,
  }))

  const automated = computeAutomatedFields(evaluations)
  const copsoqField = computeCopsoqInventoryField(rawEvals)
  if (copsoqField) automated.unshift(copsoqField)

  const companyFields: InventoryField[] = [
    {
      label: '7. Descrição dos Processos de Trabalho',
      value: safeString(company.nr1_process_descriptions),
    },
    {
      label: '8. Atividades da Empresa',
      value:
        safeString(company.nr1_activities) !== 'Não informado'
          ? safeString(company.nr1_activities)
          : `CNAE: ${company.cnae ?? 'N/I'} | Grau de Risco: ${company.risk_grade ?? 'N/I'}`,
    },
    {
      label: '9. Medidas Preventivas Implementadas',
      value: safeString(company.nr1_preventive_measures),
    },
  ]

  const pdfBuffer = buildInventoryPdf(
    automated,
    companyFields,
    company.name ?? 'Empresa'
  )

  const filename = `inventario-nr1-${companyId}-${Date.now()}.pdf`

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Generated-At': new Date().toISOString(),
    },
  })
}
