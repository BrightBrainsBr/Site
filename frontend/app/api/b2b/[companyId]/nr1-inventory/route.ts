// frontend/app/api/b2b/[companyId]/nr1-inventory/route.ts

import { createClient } from '@supabase/supabase-js'
import { jsPDF } from 'jspdf'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser, resolveCycle } from '../../lib/getB2BUser'
import { computeNormalizedScore, getRiskLevel } from '../../lib/riskUtils'

export const runtime = 'nodejs'

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
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = margin

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('INVENTÁRIO DE RISCOS PSICOSSOCIAIS – NR-1', pageWidth / 2, y, {
    align: 'center',
  })
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Empresa: ${companyName}`, margin, y)
  y += 5
  doc.text(
    `Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`,
    margin,
    y
  )
  y += 10

  doc.setDrawColor(0)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  const allFields = [...automated, ...companyFields]

  for (const field of allFields) {
    if (y > 260) {
      doc.addPage()
      y = margin
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(field.label, margin, y)
    y += 5

    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(field.value, contentWidth)
    doc.text(lines, margin, y)
    y += lines.length * 4.5 + 6
  }

  y += 5
  if (y > 260) {
    doc.addPage()
    y = margin
  }
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(
    'Documento gerado automaticamente pelo sistema BrightMonitor conforme NR-1 (Portaria MTP nº 4.219/2022).',
    margin,
    y
  )

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

  const [evalResult, companyResult] = await Promise.all([
    sb
      .from('mental_health_evaluations')
      .select('scores, employee_department')
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
  const evaluations = (evalResult.data ?? []).map((r) => ({
    scores: r.scores as Record<string, number> | null,
    employee_department: r.employee_department as string | null,
  }))

  const automated = computeAutomatedFields(evaluations)

  const companyFields: InventoryField[] = [
    {
      label: '7. Descrição dos Processos de Trabalho',
      value: company.nr1_process_descriptions ?? 'Não informado',
    },
    {
      label: '8. Atividades da Empresa',
      value:
        company.nr1_activities ??
        `CNAE: ${company.cnae ?? 'N/I'} | Grau de Risco: ${company.risk_grade ?? 'N/I'}`,
    },
    {
      label: '9. Medidas Preventivas Implementadas',
      value: company.nr1_preventive_measures ?? 'Não informado',
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
