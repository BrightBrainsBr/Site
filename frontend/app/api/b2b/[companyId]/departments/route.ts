// frontend/app/api/b2b/[companyId]/departments/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser, resolveCycle } from '../../lib/getB2BUser'
import {
  computeNormalizedScore,
  getRiskLevel,
  type RiskLevel,
} from '../../lib/riskUtils'

export const runtime = 'nodejs'

// eslint-disable-next-line complexity
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

  const { data: currentCycle } = await sb
    .from('assessment_cycles')
    .select('starts_at')
    .eq('id', cycleRes.cycleId)
    .single()

  let previousCycleId: string | null = null
  if (currentCycle?.starts_at) {
    const { data: prev } = await sb
      .from('assessment_cycles')
      .select('id')
      .eq('company_id', companyId)
      .lt('ends_at', currentCycle.starts_at)
      .order('ends_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    previousCycleId = prev?.id ?? null
  }

  const { data: rows, error } = await sb
    .from('mental_health_evaluations')
    .select('id, scores, employee_department')
    .eq('company_id', companyId)
    .eq('cycle_id', cycleRes.cycleId)

  if (error) {
    console.error('[b2b/departments]', error)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }

  interface DeptData {
    scores: number[]
    risks: RiskLevel[]
    phq9: number[]
    gad7: number[]
    srq20: number[]
    aep: number[]
  }

  const byDept = new Map<string, DeptData>()

  for (const row of rows ?? []) {
    const dept = row.employee_department ?? 'Sem departamento'
    if (!byDept.has(dept)) {
      byDept.set(dept, {
        scores: [],
        risks: [],
        phq9: [],
        gad7: [],
        srq20: [],
        aep: [],
      })
    }
    const entry = byDept.get(dept)!
    const rawScores = row.scores as Record<string, number> | null
    const norm = computeNormalizedScore(rawScores)
    if (norm != null) {
      entry.scores.push(norm)
      entry.risks.push(getRiskLevel(norm))
    }
    if (rawScores) {
      if (typeof rawScores.phq9 === 'number') entry.phq9.push(rawScores.phq9)
      if (typeof rawScores.gad7 === 'number') entry.gad7.push(rawScores.gad7)
      if (typeof rawScores.srq20 === 'number') entry.srq20.push(rawScores.srq20)
      if (typeof rawScores.aep_total === 'number')
        entry.aep.push(rawScores.aep_total)
    }
  }

  const prevByDept: Map<string, { n: number; avg: number }> = new Map()
  if (previousCycleId) {
    const { data: prevRows } = await sb
      .from('mental_health_evaluations')
      .select('scores, employee_department')
      .eq('company_id', companyId)
      .eq('cycle_id', previousCycleId)

    for (const row of prevRows ?? []) {
      const dept = row.employee_department ?? 'Sem departamento'
      const norm = computeNormalizedScore(
        row.scores as Record<string, number> | null
      )
      if (norm != null) {
        const cur = prevByDept.get(dept) ?? { n: 0, avg: 0 }
        cur.n++
        cur.avg += norm
        prevByDept.set(dept, cur)
      }
    }
    Array.from(prevByDept.entries()).forEach(([k, v]) => {
      prevByDept.set(k, { n: v.n, avg: v.n > 0 ? v.avg / v.n : 0 })
    })
  }

  const { data: actionPlans } = await sb
    .from('b2b_action_plans')
    .select('department, status')
    .eq('company_id', companyId)
    .neq('status', 'concluido')

  const pendingByDept = new Map<string, number>()
  for (const ap of actionPlans ?? []) {
    const dept = ap.department ?? 'Sem departamento'
    pendingByDept.set(dept, (pendingByDept.get(dept) ?? 0) + 1)
  }

  function avg(arr: number[]): number | null {
    if (arr.length === 0) return null
    return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
  }

  const departments = Array.from(byDept.entries()).map(([name, data]) => {
    const n = data.scores.length
    const avgScore =
      n > 0
        ? Math.round((data.scores.reduce((a, b) => a + b, 0) / n) * 10) / 10
        : 0
    const riskBreakdown: Record<RiskLevel, number> = {
      critical: 0,
      elevated: 0,
      moderate: 0,
      low: 0,
    }
    for (const r of data.risks) riskBreakdown[r]++

    const prev = prevByDept.get(name)
    const trend =
      prev && prev.avg > 0 && avgScore > 0
        ? avgScore > prev.avg
          ? 'up'
          : avgScore < prev.avg
            ? 'down'
            : 'stable'
        : null

    return {
      name,
      n,
      avgScore,
      riskBreakdown,
      trend,
      phq9Avg: avg(data.phq9),
      gad7Avg: avg(data.gad7),
      srq20Avg: avg(data.srq20),
      aepAvg: avg(data.aep),
      pendingActions: pendingByDept.get(name) ?? 0,
    }
  })

  return NextResponse.json({
    departments,
    cycleId: cycleRes.cycleId,
  })
}
