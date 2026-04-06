// frontend/app/api/b2b/[companyId]/overview/route.ts

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

  const { data: rows, error } = await sb
    .from('mental_health_evaluations')
    .select('id, scores, created_at')
    .eq('company_id', companyId)
    .eq('cycle_id', cycleRes.cycleId)

  if (error) {
    console.error('[b2b/overview]', error)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }

  const evaluations = rows ?? []
  const total = evaluations.length

  const riskDistribution: Record<RiskLevel, number> = {
    critical: 0,
    elevated: 0,
    moderate: 0,
    low: 0,
  }

  let sumScore = 0
  let countScore = 0
  let sumMbi = 0
  let countMbi = 0
  let sumSrq20 = 0
  let countSrq20 = 0
  let sumAep = 0
  let countAep = 0
  let alertCount = 0

  const monthlyBuckets = new Map<
    string,
    { baixo: number; moderado: number; elevado: number; critico: number }
  >()

  for (const row of evaluations) {
    const scores = row.scores as Record<string, number> | null
    const norm = computeNormalizedScore(scores)
    if (norm != null) {
      sumScore += norm
      countScore++
      const level = getRiskLevel(norm)
      riskDistribution[level]++
      if (norm < 60) alertCount++

      const month = (row.created_at as string)?.slice(0, 7) ?? 'unknown'
      if (!monthlyBuckets.has(month)) {
        monthlyBuckets.set(month, {
          baixo: 0,
          moderado: 0,
          elevado: 0,
          critico: 0,
        })
      }
      const bucket = monthlyBuckets.get(month)!
      if (level === 'low') bucket.baixo++
      else if (level === 'moderate') bucket.moderado++
      else if (level === 'elevated') bucket.elevado++
      else bucket.critico++
    }
    if (scores && typeof scores.mbi === 'number') {
      sumMbi += scores.mbi
      countMbi++
    }
    if (scores && typeof scores.srq20 === 'number') {
      sumSrq20 += scores.srq20
      countSrq20++
    }
    if (scores && typeof scores.aep_total === 'number') {
      sumAep += scores.aep_total
      countAep++
    }
  }

  const avgScore =
    countScore > 0 ? Math.round((sumScore / countScore) * 10) / 10 : null
  const burnoutIndex =
    countMbi > 0 ? Math.round((sumMbi / countMbi) * 10) / 10 : null
  const srq20Avg =
    countSrq20 > 0 ? Math.round((sumSrq20 / countSrq20) * 10) / 10 : null
  const aepAvg = countAep > 0 ? Math.round((sumAep / countAep) * 10) / 10 : null

  const timeline = Array.from(monthlyBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, counts]) => ({ month, ...counts }))

  return NextResponse.json({
    total,
    avgScore,
    riskDistribution,
    burnoutIndex,
    srq20Avg,
    aepAvg,
    alertCount,
    timeline,
    cycleId: cycleRes.cycleId,
  })
}
