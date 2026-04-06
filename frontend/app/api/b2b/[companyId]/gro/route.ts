// frontend/app/api/b2b/[companyId]/gro/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser, resolveCycle } from '../../lib/getB2BUser'

export const runtime = 'nodejs'

const SCALE_MAX: Record<string, number> = {
  phq9: 27,
  gad7: 21,
  srq20: 20,
  pss10: 40,
  mbi: 80,
  isi: 28,
}

const AEP_DIMENSIONS = [
  'pressure',
  'autonomy',
  'breaks',
  'relationships',
  'cognitive',
  'environment',
] as const

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

// eslint-disable-next-line complexity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const { searchParams } = new URL(request.url)
  const cycleParam = searchParams.get('cycle')
  const departmentFilter = searchParams.get('department')

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

  let query = sb
    .from('mental_health_evaluations')
    .select('id, scores, employee_department')
    .eq('company_id', companyId)
    .eq('cycle_id', cycleRes.cycleId)

  if (departmentFilter) {
    query = query.eq('employee_department', departmentFilter)
  }

  const { data: rows, error } = await query

  if (error) {
    console.error('[b2b/gro]', error)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }

  const evaluations = rows ?? []

  const scaleSums: Record<string, number> = {}
  const scaleCounts: Record<string, number> = {}
  const aepSums: Record<string, number> = {}
  const aepCounts: Record<string, number> = {}
  const srq20Dist = { negative: 0, moderate: 0, elevated: 0, critical: 0 }

  const probabilities: number[] = []
  const severities: number[] = []

  for (const row of evaluations) {
    const scores = row.scores as Record<string, number> | null
    if (!scores || typeof scores !== 'object') continue

    for (const scale of Object.keys(SCALE_MAX)) {
      if (typeof scores[scale] === 'number') {
        scaleSums[scale] = (scaleSums[scale] ?? 0) + scores[scale]
        scaleCounts[scale] = (scaleCounts[scale] ?? 0) + 1
      }
    }

    for (const dim of AEP_DIMENSIONS) {
      const key = `aep_${dim}`
      if (typeof scores[key] === 'number') {
        aepSums[dim] = (aepSums[dim] ?? 0) + scores[key]
        aepCounts[dim] = (aepCounts[dim] ?? 0) + 1
      }
    }

    if (typeof scores.srq20 === 'number') {
      const v = scores.srq20
      if (v <= 7) srq20Dist.negative++
      else if (v <= 11) srq20Dist.moderate++
      else if (v <= 16) srq20Dist.elevated++
      else srq20Dist.critical++
    }

    const clinicalKeys = ['phq9', 'gad7', 'srq20', 'pss10', 'mbi', 'isi']
    let clinSum = 0
    let clinCount = 0
    for (const k of clinicalKeys) {
      if (typeof scores[k] === 'number' && SCALE_MAX[k]) {
        clinSum += scores[k] / SCALE_MAX[k]
        clinCount++
      }
    }
    if (clinCount > 0) {
      probabilities.push(clinSum / clinCount)
    }

    if (typeof scores.aep_total === 'number') {
      severities.push(scores.aep_total / 56)
    }
  }

  const scaleAverages: Record<string, number> = {}
  for (const scale of Object.keys(SCALE_MAX)) {
    scaleAverages[scale] =
      scaleCounts[scale] > 0
        ? Math.round((scaleSums[scale] / scaleCounts[scale]) * 10) / 10
        : 0
  }

  const aepDimensions: Record<string, number> = {}
  for (const dim of AEP_DIMENSIONS) {
    aepDimensions[dim] =
      aepCounts[dim] > 0
        ? Math.round((aepSums[dim] / aepCounts[dim]) * 10) / 10
        : 0
  }

  // Risk matrix: 3 rows (alta/media/baixa probability) × 4 cols (baixa/moderada/alta/muito_alta severity)
  const riskMatrix: number[][] = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]

  const minLen = Math.min(probabilities.length, severities.length)
  for (let i = 0; i < minLen; i++) {
    const p = clamp(probabilities[i], 0, 1)
    const s = clamp(severities[i], 0, 1)

    const pRow = p >= 0.66 ? 0 : p >= 0.33 ? 1 : 2
    const sCol = s >= 0.75 ? 3 : s >= 0.5 ? 2 : s >= 0.25 ? 1 : 0

    riskMatrix[pRow][sCol]++
  }

  return NextResponse.json({
    scaleAverages,
    aepDimensions,
    srq20Distribution: srq20Dist,
    riskMatrix,
    cycleId: cycleRes.cycleId,
  })
}
