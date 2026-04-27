// frontend/app/api/brightmonitor/[companyId]/departments/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser, resolveCycle } from '../../lib/getB2BUser'
import { computeDomainMean } from '../../lib/riskUtils'

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

  const { data: rows, error } = await sb
    .from('mental_health_evaluations')
    .select(
      'id, employee_department, score_physical, score_ergonomic, score_psychosocial, score_violence, score_overall'
    )
    .eq('company_id', companyId)
    .eq('cycle_id', cycleRes.cycleId)
    .eq('assessment_kind', 'nr1')

  if (error) {
    console.error('[brightmonitor/departments]', error)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }

  const byDept = new Map<string, Array<Record<string, unknown>>>()

  for (const row of (rows ?? []) as Array<Record<string, unknown>>) {
    const dept = (row.employee_department as string) ?? 'Sem departamento'
    if (!byDept.has(dept)) byDept.set(dept, [])
    byDept.get(dept)!.push(row)
  }

  const { data: actionPlans } = await sb
    .from('b2b_action_plans')
    .select('department, status')
    .eq('company_id', companyId)
    .neq('status', 'concluido')

  const pendingByDept = new Map<string, number>()
  for (const ap of actionPlans ?? []) {
    const dept = (ap.department as string) ?? 'Sem departamento'
    pendingByDept.set(dept, (pendingByDept.get(dept) ?? 0) + 1)
  }

  const departments = Array.from(byDept.entries()).map(([name, deptRows]) => ({
    name,
    n: deptRows.length,
    scorePhysical: computeDomainMean(deptRows, 'score_physical'),
    scoreErgonomic: computeDomainMean(deptRows, 'score_ergonomic'),
    scorePsychosocial: computeDomainMean(deptRows, 'score_psychosocial'),
    scoreViolence: computeDomainMean(deptRows, 'score_violence'),
    scoreOverall: computeDomainMean(deptRows, 'score_overall'),
    pendingActions: pendingByDept.get(name) ?? 0,
  }))

  return NextResponse.json({
    departments,
    cycleId: cycleRes.cycleId,
  })
}
