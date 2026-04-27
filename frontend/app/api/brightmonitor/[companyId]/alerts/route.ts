// frontend/app/api/brightmonitor/[companyId]/alerts/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser, resolveCycle } from '../../lib/getB2BUser'
import { computeDomainMean } from '../../lib/riskUtils'

export const runtime = 'nodejs'

interface AlertItem {
  type: 'critical_dept' | 'violence_dept' | 'incident' | 'harassment'
  severity: 'critico' | 'alto' | 'moderado'
  department: string | null
  message: string
  value?: number
}

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

  const [evalRes, accidentRes, harassmentRes] = await Promise.all([
    sb
      .from('mental_health_evaluations')
      .select(
        'id, employee_department, score_overall, score_violence, had_accident'
      )
      .eq('company_id', companyId)
      .eq('cycle_id', cycleRes.cycleId)
      .eq('assessment_kind', 'nr1'),
    sb
      .from('b2b_events')
      .select('id, department')
      .eq('company_id', companyId)
      .eq('cycle_id', cycleRes.cycleId)
      .in('event_type', ['acidente', 'incidente']),
    sb
      .from('harassment_reports')
      .select('id, department')
      .eq('company_id', companyId)
      .eq('cycle_id', cycleRes.cycleId),
  ])

  const evaluations = (evalRes.data ?? []) as Array<Record<string, unknown>>
  const alerts: AlertItem[] = []

  const byDept = new Map<string, Array<Record<string, unknown>>>()
  for (const row of evaluations) {
    const dept = (row.employee_department as string) ?? 'Sem departamento'
    if (!byDept.has(dept)) byDept.set(dept, [])
    byDept.get(dept)!.push(row)
  }

  for (const [dept, deptRows] of Array.from(byDept.entries())) {
    const overallMean = computeDomainMean(deptRows, 'score_overall')
    if (overallMean != null && overallMean >= 4.0) {
      alerts.push({
        type: 'critical_dept',
        severity: 'critico',
        department: dept,
        message: `Setor "${dept}" com risco geral crítico (${overallMean.toFixed(1)}/5)`,
        value: overallMean,
      })
    }

    const violenceMean = computeDomainMean(deptRows, 'score_violence')
    if (violenceMean != null && violenceMean >= 3.5) {
      alerts.push({
        type: 'violence_dept',
        severity: 'alto',
        department: dept,
        message: `Setor "${dept}" com score de violência elevado (${violenceMean.toFixed(1)}/5)`,
        value: violenceMean,
      })
    }
  }

  const hasAccidentInCycle = evaluations.some(
    (r) => r.had_accident === true
  )
  const accidentEventCount = accidentRes.data?.length ?? 0

  if (hasAccidentInCycle || accidentEventCount > 0) {
    const total =
      evaluations.filter((r) => r.had_accident === true).length +
      accidentEventCount
    alerts.push({
      type: 'incident',
      severity: 'alto',
      department: null,
      message: `${total} incidente(s)/acidente(s) registrado(s) neste ciclo`,
      value: total,
    })
  }

  const harassmentCount = harassmentRes.data?.length ?? 0
  if (harassmentCount > 0) {
    alerts.push({
      type: 'harassment',
      severity: 'critico',
      department: null,
      message: `${harassmentCount} relato(s) de assédio registrado(s) neste ciclo`,
      value: harassmentCount,
    })
  }

  return NextResponse.json({
    alerts,
    cycleId: cycleRes.cycleId,
  })
}
