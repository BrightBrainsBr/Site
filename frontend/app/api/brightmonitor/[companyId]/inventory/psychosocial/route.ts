// frontend/app/api/brightmonitor/[companyId]/inventory/psychosocial/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser, resolveCycle } from '../../../lib/getB2BUser'
import type { CopsoqRisk } from '../../../lib/copsoqRisks'
import { COPSOQ_RISKS } from '../../../lib/copsoqRisks'
import {
  computeDomainMean,
  getCopsoqClassification,
  type CopsoqClassification,
} from '../../../lib/riskUtils'

export const runtime = 'nodejs'

interface RiskOutput {
  id: string
  name: string
  description: string
  family: CopsoqRisk['family']
  axis: CopsoqRisk['axis']
  /** Mean Likert score (1–5) across the cycle, null if no data. */
  score: number | null
  /** Frequency of "negative" responses (level >= 4) — used as probability. */
  probability: number | null
  /** Mean intensity (1–5) — used as severity. */
  severity: number | null
  classification: CopsoqClassification | null
  responses: number
}

interface DepartmentBreakdown {
  department: string
  baixo: number
  medio: number
  alto: number
  total: number
}

function classifyRows(
  rows: Array<Record<string, unknown>>,
  risk: CopsoqRisk
): {
  score: number | null
  probability: number | null
  severity: number | null
  responses: number
  classification: CopsoqClassification | null
} {
  const values = rows
    .map((r) => r[risk.axis])
    .filter((v): v is number => typeof v === 'number')

  if (values.length === 0) {
    return {
      score: null,
      probability: null,
      severity: null,
      responses: 0,
      classification: null,
    }
  }

  const score = values.reduce((a, b) => a + b, 0) / values.length
  const negativeCount = values.filter((v) => v >= 4).length
  const probability = negativeCount / values.length
  const severity = score
  const classification = getCopsoqClassification(score)

  return {
    score: +score.toFixed(2),
    probability: +probability.toFixed(2),
    severity: +severity.toFixed(2),
    responses: values.length,
    classification,
  }
}

export async function GET(
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

  const axisColumns = Array.from(new Set(COPSOQ_RISKS.map((r) => r.axis)))
  const selectCols = ['id', 'employee_department', ...axisColumns].join(', ')

  const { data: rows, error } = await sb
    .from('mental_health_evaluations')
    .select(selectCols)
    .eq('company_id', companyId)
    .eq('cycle_id', cycleRes.cycleId)
    .eq('assessment_kind', 'nr1')

  if (error) {
    console.error('[brightmonitor/inventory/psychosocial]', error)
    return NextResponse.json(
      { error: 'Erro ao gerar inventário' },
      { status: 500 }
    )
  }

  const evaluations = (rows ?? []) as unknown as Array<Record<string, unknown>>

  // Per-risk classification (across all employees)
  const risks: RiskOutput[] = COPSOQ_RISKS.map((risk) => {
    const r = classifyRows(evaluations, risk)
    return {
      id: risk.id,
      name: risk.name,
      description: risk.description,
      family: risk.family,
      axis: risk.axis,
      score: r.score,
      probability: r.probability,
      severity: r.severity,
      classification: r.classification,
      responses: r.responses,
    }
  })

  // Pie chart totals: how many of the predefined risks fall into each band.
  const byClassification = { baixo: 0, medio: 0, alto: 0, sem_dados: 0 }
  for (const r of risks) {
    if (r.classification) byClassification[r.classification] += 1
    else byClassification.sem_dados += 1
  }

  // Per-department breakdown: classify each risk per department,
  // then count how many risks fall into each band.
  const deptMap = new Map<string, Array<Record<string, unknown>>>()
  for (const row of evaluations) {
    const dept =
      ((row.employee_department as string) ?? '').trim() || 'Sem departamento'
    if (!deptMap.has(dept)) deptMap.set(dept, [])
    deptMap.get(dept)!.push(row)
  }

  const byDepartment: DepartmentBreakdown[] = Array.from(deptMap.entries())
    .map(([department, deptRows]) => {
      const counts = { baixo: 0, medio: 0, alto: 0 }
      for (const risk of COPSOQ_RISKS) {
        const mean = computeDomainMean(deptRows, risk.axis)
        const cls = getCopsoqClassification(mean)
        if (cls) counts[cls] += 1
      }
      return {
        department,
        baixo: counts.baixo,
        medio: counts.medio,
        alto: counts.alto,
        total: counts.baixo + counts.medio + counts.alto,
      }
    })
    .sort((a, b) => b.alto - a.alto || b.medio - a.medio)

  return NextResponse.json({
    risks,
    byClassification,
    byDepartment,
    totalEvaluations: evaluations.length,
    cycleId: cycleRes.cycleId,
  })
}
