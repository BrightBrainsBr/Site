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
    .select('id, scores')
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

  for (const row of evaluations) {
    const scores = row.scores as Record<string, number> | null
    const norm = computeNormalizedScore(scores)
    if (norm != null) {
      sumScore += norm
      countScore++
      riskDistribution[getRiskLevel(norm)]++
    }
    if (scores && typeof scores.mbi === 'number') {
      sumMbi += scores.mbi
      countMbi++
    }
  }

  const avgScore =
    countScore > 0 ? Math.round((sumScore / countScore) * 10) / 10 : null
  const burnoutIndex =
    countMbi > 0 ? Math.round((sumMbi / countMbi) * 10) / 10 : null

  return NextResponse.json({
    total,
    avgScore,
    riskDistribution,
    burnoutIndex,
    cycleId: cycleRes.cycleId,
  })
}
