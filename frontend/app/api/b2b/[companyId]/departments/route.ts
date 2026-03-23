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

  const byDept = new Map<string, { scores: number[]; risks: RiskLevel[] }>()

  for (const row of rows ?? []) {
    const dept = row.employee_department ?? 'Sem departamento'
    if (!byDept.has(dept)) {
      byDept.set(dept, { scores: [], risks: [] })
    }
    const entry = byDept.get(dept)!
    const norm = computeNormalizedScore(
      row.scores as Record<string, number> | null
    )
    if (norm != null) {
      entry.scores.push(norm)
      entry.risks.push(getRiskLevel(norm))
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
    }
  })

  return NextResponse.json({
    departments,
    cycleId: cycleRes.cycleId,
  })
}
