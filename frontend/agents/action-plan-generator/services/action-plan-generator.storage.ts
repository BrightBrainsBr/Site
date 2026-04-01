// frontend/agents/action-plan-generator/services/action-plan-generator.storage.ts

import { createClient } from '@supabase/supabase-js'

import type { GROContext } from '../models/action-plan-generator.interface'

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

export async function fetchGroAggregation(
  companyId: string,
  cycleId: string,
  department?: string
): Promise<GROContext> {
  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = sb
    .from('mental_health_evaluations')
    .select('scores, employee_department')
    .eq('company_id', companyId)
    .eq('cycle_id', cycleId)

  if (department) {
    query = query.eq('employee_department', department)
  }

  const { data: rows, error } = await query

  if (error) throw new Error(`Failed to fetch evaluations: ${error.message}`)

  const evaluations = rows ?? []

  const scaleSums: Record<string, number> = {}
  const scaleCounts: Record<string, number> = {}
  const aepSums: Record<string, number> = {}
  const aepCounts: Record<string, number> = {}
  const srq20Dist = { negative: 0, moderate: 0, elevated: 0, critical: 0 }
  const departments = new Set<string>()

  for (const row of evaluations) {
    const scores = row.scores as Record<string, number> | null
    if (!scores) continue

    if (row.employee_department) departments.add(row.employee_department)

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

  return {
    scaleAverages,
    aepDimensions,
    srq20Distribution: srq20Dist,
    totalEvaluations: evaluations.length,
    departments: Array.from(departments),
  }
}
