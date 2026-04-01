// frontend/app/api/b2b/[companyId]/alerts/route.ts

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser, resolveCycle } from '../../lib/getB2BUser'
import {
  computeNormalizedScore,
  getAEPRiskLevel,
  getRiskLevel,
  getSRQ20RiskLevel,
} from '../../lib/riskUtils'

export const runtime = 'nodejs'

function anonymizeId(id: string): string {
  const hash = createHash('sha256').update(id).digest('hex')
  return `COL-${hash.slice(-4).toUpperCase()}`
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

  const { data: rows, error } = await sb
    .from('mental_health_evaluations')
    .select('id, scores, employee_department')
    .eq('company_id', companyId)
    .eq('cycle_id', cycleRes.cycleId)

  if (error) {
    console.error('[b2b/alerts]', error)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }

  const alerts: Array<{
    id: string
    riskLevel: string
    department: string | null
    domainScores?: Record<string, number>
    srq20Score?: number
    srq20Risk?: string
    aepScore?: number
    aepRisk?: string
    reasons: string[]
  }> = []

  for (const row of rows ?? []) {
    const scores = row.scores as Record<string, number> | null
    const norm = computeNormalizedScore(scores)
    const srq20 = scores?.srq20
    const aepTotal = scores?.aep_total

    const normAlert = norm != null && norm < 60
    const srq20Alert = typeof srq20 === 'number' && srq20 >= 8
    const aepAlert = typeof aepTotal === 'number' && aepTotal >= 29

    if (!normAlert && !srq20Alert && !aepAlert) continue

    const riskLevel =
      norm != null ? getRiskLevel(norm) : srq20Alert ? getSRQ20RiskLevel(srq20!) : 'elevated'
    const domainScores: Record<string, number> = {}
    if (scores) {
      for (const [k, v] of Object.entries(scores)) {
        if (typeof v === 'number') domainScores[k] = v
      }
    }

    const reasons: string[] = []
    if (normAlert) reasons.push('score_geral_baixo')
    if (srq20Alert) reasons.push('srq20_elevado')
    if (aepAlert) reasons.push('aep_elevado')

    alerts.push({
      id: anonymizeId(row.id),
      riskLevel,
      department: row.employee_department ?? null,
      domainScores:
        Object.keys(domainScores).length > 0 ? domainScores : undefined,
      srq20Score: typeof srq20 === 'number' ? srq20 : undefined,
      srq20Risk: typeof srq20 === 'number' ? getSRQ20RiskLevel(srq20) : undefined,
      aepScore: typeof aepTotal === 'number' ? aepTotal : undefined,
      aepRisk: typeof aepTotal === 'number' ? getAEPRiskLevel(aepTotal) : undefined,
      reasons,
    })
  }

  return NextResponse.json({
    alerts,
    cycleId: cycleRes.cycleId,
  })
}
