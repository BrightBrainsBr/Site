// frontend/app/api/brightmonitor/[companyId]/gro/route.ts

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getB2BUser, resolveCycle } from '../../lib/getB2BUser'
import {
  computeDomainMean,
  getNR1RiskBand,
  type NR1RiskBand,
} from '../../lib/riskUtils'

export const runtime = 'nodejs'

const DOMAIN_CONFIG = [
  { column: 'score_physical', label: 'Riscos Físicos' },
  { column: 'score_ergonomic', label: 'Riscos Ergonômicos' },
  { column: 'score_psychosocial', label: 'Riscos Psicossociais' },
  { column: 'score_violence', label: 'Violência e Assédio' },
  { column: 'score_overall', label: 'Risco Geral' },
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
    .select(
      'id, score_physical, score_ergonomic, score_psychosocial, score_violence, score_overall, chemical_exposures, biological_exposures'
    )
    .eq('company_id', companyId)
    .eq('cycle_id', cycleRes.cycleId)
    .eq('assessment_kind', 'nr1')

  if (departmentFilter) {
    query = query.eq('employee_department', departmentFilter)
  }

  const { data: rows, error } = await query

  if (error) {
    console.error('[brightmonitor/gro]', error)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }

  const evaluations = (rows ?? []) as Array<Record<string, unknown>>

  const domainSummary = DOMAIN_CONFIG.map(({ column, label }) => {
    const score = computeDomainMean(evaluations, column)
    return {
      label,
      score,
      band: score != null ? getNR1RiskBand(score) : null,
    }
  })

  const chemicalExposures: Record<string, number> = {}
  const biologicalExposures: Record<string, number> = {}

  for (const row of evaluations) {
    const chems = row.chemical_exposures
    if (Array.isArray(chems)) {
      for (const c of chems) {
        if (typeof c === 'string') {
          chemicalExposures[c] = (chemicalExposures[c] ?? 0) + 1
        }
      }
    }
    const bios = row.biological_exposures
    if (Array.isArray(bios)) {
      for (const b of bios) {
        if (typeof b === 'string') {
          biologicalExposures[b] = (biologicalExposures[b] ?? 0) + 1
        }
      }
    }
  }

  const { data: incidents } = await sb
    .from('b2b_events')
    .select('event_type')
    .eq('company_id', companyId)
    .eq('cycle_id', cycleRes.cycleId)

  const incidentsByType: Record<string, number> = {}
  for (const ev of incidents ?? []) {
    const t = ev.event_type ?? 'outro'
    incidentsByType[t] = (incidentsByType[t] ?? 0) + 1
  }

  // Risk matrix: 3 rows (alto/medio/baixo score) × 4 cols (domain severity)
  const riskMatrix: number[][] = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]

  const bandToCol: Record<NR1RiskBand, number> = {
    baixo: 0,
    moderado: 1,
    alto: 2,
    critico: 3,
  }

  for (const row of evaluations) {
    const overall = row.score_overall
    if (typeof overall !== 'number') continue

    const pRow = overall >= 4 ? 0 : overall >= 3 ? 1 : 2

    const domainScores = [
      row.score_physical,
      row.score_ergonomic,
      row.score_psychosocial,
      row.score_violence,
    ].filter((v): v is number => typeof v === 'number')

    if (domainScores.length === 0) continue
    const maxDomain = Math.max(...domainScores)
    const sCol = bandToCol[getNR1RiskBand(clamp(maxDomain, 1, 5))]

    riskMatrix[pRow][sCol]++
  }

  return NextResponse.json({
    domainSummary,
    chemicalExposures,
    biologicalExposures,
    incidentsByType,
    riskMatrix,
    cycleId: cycleRes.cycleId,
  })
}
