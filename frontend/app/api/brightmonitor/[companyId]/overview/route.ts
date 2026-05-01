// frontend/app/api/brightmonitor/[companyId]/overview/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser, resolveCycle } from '../../lib/getB2BUser'
import {
  computeDomainMean,
  getNR1RiskBand,
  type NR1RiskBand,
  NR1_PSYCHOSOCIAL_COLUMNS,
} from '../../lib/riskUtils'

export const runtime = 'nodejs'

const PSYCHO_KEY_MAP: Record<string, string> = {
  workload_level: 'workload',
  pace_level: 'pace',
  autonomy_level: 'autonomy',
  leadership_level: 'leadership',
  relationships_level: 'relationships',
  recognition_level: 'recognition',
  clarity_level: 'clarity',
  balance_level: 'balance',
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

  const selectCols = [
    'id',
    'created_at',
    'score_physical',
    'score_ergonomic',
    'score_psychosocial',
    'score_violence',
    'score_overall',
    ...NR1_PSYCHOSOCIAL_COLUMNS,
  ].join(', ')

  const { data: rows, error } = await sb
    .from('mental_health_evaluations')
    .select(selectCols)
    .eq('company_id', companyId)
    .eq('cycle_id', cycleRes.cycleId)
    .eq('assessment_kind', 'nr1')

  if (error) {
    console.error('[brightmonitor/overview]', error)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }

  const evaluations = (rows ?? []) as unknown as Array<Record<string, unknown>>
  const total = evaluations.length

  const scorePhysical = computeDomainMean(evaluations, 'score_physical')
  const scoreErgonomic = computeDomainMean(evaluations, 'score_ergonomic')
  const scorePsychosocial = computeDomainMean(evaluations, 'score_psychosocial')
  const scoreViolence = computeDomainMean(evaluations, 'score_violence')
  const scoreOverall = computeDomainMean(evaluations, 'score_overall')

  const riskDistribution: Record<NR1RiskBand, number> = {
    baixo: 0,
    moderado: 0,
    alto: 0,
    critico: 0,
  }

  let alertCount = 0
  const monthlyScores = new Map<string, number[]>()

  for (const row of evaluations) {
    const overall = row.score_overall
    if (typeof overall === 'number') {
      const band = getNR1RiskBand(overall)
      riskDistribution[band]++
      if (overall >= 4) alertCount++

      const month = (row.created_at as string)?.slice(0, 7) ?? 'unknown'
      if (!monthlyScores.has(month)) monthlyScores.set(month, [])
      monthlyScores.get(month)!.push(overall)
    }
  }

  const psychosocialAxes: Record<string, number | null> = {}
  for (const col of NR1_PSYCHOSOCIAL_COLUMNS) {
    const key = PSYCHO_KEY_MAP[col] ?? col
    psychosocialAxes[key] = computeDomainMean(evaluations, col)
  }

  const [actionPlansRes, incidentsRes, harassmentRes] = await Promise.all([
    sb
      .from('b2b_action_plans')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .neq('status', 'concluido'),
    sb
      .from('b2b_events')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('cycle_id', cycleRes.cycleId),
    sb
      .from('harassment_reports')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('cycle_id', cycleRes.cycleId),
  ])

  const timeline = Array.from(monthlyScores.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, scores]) => ({
      month,
      scoreOverall:
        scores.length > 0
          ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
          : null,
    }))

  return NextResponse.json({
    total,
    cycleId: cycleRes.cycleId,
    scorePhysical,
    scoreErgonomic,
    scorePsychosocial,
    scoreViolence,
    scoreOverall,
    riskDistribution,
    psychosocialAxes,
    pendingActions: actionPlansRes.count ?? 0,
    incidentsThisCycle: incidentsRes.count ?? 0,
    harassmentCount: harassmentRes.count ?? 0,
    alertCount,
    timeline,
  })
}
