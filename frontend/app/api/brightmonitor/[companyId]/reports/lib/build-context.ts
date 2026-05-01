// frontend/app/api/brightmonitor/[companyId]/reports/lib/build-context.ts

import { createClient } from '@supabase/supabase-js'

import {
  computeDomainMean,
  NR1_PSYCHOSOCIAL_COLUMNS,
} from '../../../lib/riskUtils'

export interface PGRContext {
  company: {
    name: string
    cnpj: string
    cnae: string | null
    departments: string[]
    sst_responsible_name: string | null
    sst_responsible_role: string | null
  }
  cycle: {
    id: string
    label: string
    starts_at: string
    ends_at: string
  } | null
  assessmentCount: number
  domainScores: {
    physical: number | null
    ergonomic: number | null
    psychosocial: number | null
    violence: number | null
    overall: number | null
  }
  scoresByDepartment: Record<
    string,
    {
      physical: number
      ergonomic: number
      psychosocial: number
      violence: number
      n: number
    }
  >
  psychosocialAxes: Record<string, number>
  inventory: Array<{
    id: string
    description: string
    risk_type: string
    probability: string
    severity: string
  }>
  actions: Array<{
    description: string
    status: string
    responsible: string | null
    deadline: string | null
  }>
  incidents: {
    accidents: number
    nearMisses: number
    workDiseases: number
    total: number
  }
  harassmentCount: number
  chemicalExposures: Record<string, number>
  biologicalExposures: Record<string, number>
  perceptionSummary: {
    avgSatisfaction: number | null
    topRisks: string[]
    topSuggestions: string[]
  }
}

function getSb() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// eslint-disable-next-line complexity
export async function buildPGRContext(
  companyId: string,
  cycleId?: string
): Promise<PGRContext> {
  const sb = getSb()

  // ── Company metadata ────────────────────────────────────────────
  const { data: company } = await sb
    .from('companies')
    .select('name, cnpj, cnae, sst_responsible_name, sst_responsible_role')
    .eq('id', companyId)
    .single()

  // ── Cycle ───────────────────────────────────────────────────────
  let cycle: PGRContext['cycle'] = null
  let resolvedCycleId = cycleId

  if (cycleId) {
    const { data: c } = await sb
      .from('assessment_cycles')
      .select('id, label, starts_at, ends_at')
      .eq('id', cycleId)
      .eq('company_id', companyId)
      .maybeSingle()
    if (c) cycle = c
  } else {
    const { data: c } = await sb
      .from('assessment_cycles')
      .select('id, label, starts_at, ends_at')
      .eq('company_id', companyId)
      .eq('is_current', true)
      .maybeSingle()
    if (c) {
      cycle = c
      resolvedCycleId = c.id
    }
  }

  // ── NR-1 Evaluations ───────────────────────────────────────────
  const evalCols = [
    'id',
    'employee_department',
    'score_physical',
    'score_ergonomic',
    'score_psychosocial',
    'score_violence',
    'score_overall',
    'chemical_exposures',
    'biological_exposures',
    'satisfaction_level',
    'biggest_risk',
    'suggestion',
    ...NR1_PSYCHOSOCIAL_COLUMNS,
  ].join(', ')

  let evalQuery = sb
    .from('mental_health_evaluations')
    .select(evalCols)
    .eq('company_id', companyId)
    .eq('assessment_kind', 'nr1')
  if (resolvedCycleId) evalQuery = evalQuery.eq('cycle_id', resolvedCycleId)

  const { data: evalRows } = await evalQuery
  const evaluations = (evalRows ?? []) as unknown as Array<
    Record<string, unknown>
  >

  // Domain scores
  const domainScores: PGRContext['domainScores'] = {
    physical: computeDomainMean(evaluations, 'score_physical'),
    ergonomic: computeDomainMean(evaluations, 'score_ergonomic'),
    psychosocial: computeDomainMean(evaluations, 'score_psychosocial'),
    violence: computeDomainMean(evaluations, 'score_violence'),
    overall: computeDomainMean(evaluations, 'score_overall'),
  }

  // Scores by department
  const deptMap = new Map<
    string,
    {
      physical: number[]
      ergonomic: number[]
      psychosocial: number[]
      violence: number[]
    }
  >()
  const departments = new Set<string>()

  for (const row of evaluations) {
    const dept = (row.employee_department as string) ?? 'Sem departamento'
    departments.add(dept)
    if (!deptMap.has(dept)) {
      deptMap.set(dept, {
        physical: [],
        ergonomic: [],
        psychosocial: [],
        violence: [],
      })
    }
    const d = deptMap.get(dept)!
    if (typeof row.score_physical === 'number')
      d.physical.push(row.score_physical)
    if (typeof row.score_ergonomic === 'number')
      d.ergonomic.push(row.score_ergonomic)
    if (typeof row.score_psychosocial === 'number')
      d.psychosocial.push(row.score_psychosocial)
    if (typeof row.score_violence === 'number')
      d.violence.push(row.score_violence)
  }

  const scoresByDepartment: PGRContext['scoresByDepartment'] = {}
  for (const [dept, vals] of Array.from(deptMap)) {
    const avg = (arr: number[]) =>
      arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : 0
    scoresByDepartment[dept] = {
      physical: avg(vals.physical),
      ergonomic: avg(vals.ergonomic),
      psychosocial: avg(vals.psychosocial),
      violence: avg(vals.violence),
      n:
        vals.physical.length ||
        vals.ergonomic.length ||
        vals.psychosocial.length ||
        vals.violence.length,
    }
  }

  // Psychosocial axes
  const PSYCHO_KEY_MAP: Record<string, string> = {
    workload_level: 'Carga de Trabalho',
    pace_level: 'Ritmo',
    autonomy_level: 'Autonomia',
    leadership_level: 'Liderança',
    relationships_level: 'Relações Interpessoais',
    recognition_level: 'Reconhecimento',
    clarity_level: 'Clareza de Papel',
    balance_level: 'Equilíbrio Vida-Trabalho',
  }

  const psychosocialAxes: Record<string, number> = {}
  for (const col of NR1_PSYCHOSOCIAL_COLUMNS) {
    const mean = computeDomainMean(evaluations, col)
    if (mean != null) {
      psychosocialAxes[PSYCHO_KEY_MAP[col] ?? col] = mean
    }
  }

  // Chemical / biological exposures
  const chemicalExposures: Record<string, number> = {}
  const biologicalExposures: Record<string, number> = {}

  for (const row of evaluations) {
    const chems = row.chemical_exposures
    if (Array.isArray(chems)) {
      for (const c of chems) {
        if (typeof c === 'string')
          chemicalExposures[c] = (chemicalExposures[c] ?? 0) + 1
      }
    }
    const bios = row.biological_exposures
    if (Array.isArray(bios)) {
      for (const b of bios) {
        if (typeof b === 'string')
          biologicalExposures[b] = (biologicalExposures[b] ?? 0) + 1
      }
    }
  }

  // Perception summary
  const satisfactionValues: number[] = []
  const riskCounts: Record<string, number> = {}
  const suggestionCounts: Record<string, number> = {}

  for (const row of evaluations) {
    const sat = row.satisfaction_level
    if (typeof sat === 'number') satisfactionValues.push(sat)

    const risk = row.biggest_risk
    if (typeof risk === 'string' && risk.trim())
      riskCounts[risk.trim()] = (riskCounts[risk.trim()] ?? 0) + 1

    const sug = row.suggestion
    if (typeof sug === 'string' && sug.trim())
      suggestionCounts[sug.trim()] = (suggestionCounts[sug.trim()] ?? 0) + 1
  }

  const topRisks = Object.entries(riskCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k)

  const topSuggestions = Object.entries(suggestionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k)

  const avgSatisfaction = satisfactionValues.length
    ? +(
        satisfactionValues.reduce((a, b) => a + b, 0) /
        satisfactionValues.length
      ).toFixed(2)
    : null

  // ── Action plans (inventory items) ──────────────────────────────
  let actionsQuery = sb
    .from('b2b_action_plans')
    .select('id, description, priority, status, responsible, deadline')
    .eq('company_id', companyId)
  if (resolvedCycleId)
    actionsQuery = actionsQuery.eq('cycle_id', resolvedCycleId)

  const { data: actionRows } = await actionsQuery
  const actions = (actionRows ?? []).map((a) => ({
    description: a.description ?? '',
    status: a.status ?? 'pendente',
    responsible: a.responsible ?? null,
    deadline: a.deadline ?? null,
  }))

  const inventory = (actionRows ?? []).map((a) => ({
    id: a.id,
    description: a.description ?? '',
    risk_type: a.priority ?? 'media',
    probability:
      a.priority === 'critica' || a.priority === 'alta' ? 'alta' : 'media',
    severity:
      a.priority === 'critica'
        ? 'alta'
        : a.priority === 'alta'
          ? 'media'
          : 'baixa',
  }))

  // ── Events / Incidents ──────────────────────────────────────────
  let eventsQuery = sb
    .from('b2b_events')
    .select('event_type')
    .eq('company_id', companyId)
  if (resolvedCycleId) eventsQuery = eventsQuery.eq('cycle_id', resolvedCycleId)

  const { data: eventRows } = await eventsQuery
  let accidents = 0
  let nearMisses = 0
  let workDiseases = 0
  for (const e of eventRows ?? []) {
    const t = e.event_type as string
    if (t === 'acidente') accidents++
    else if (t === 'near_miss' || t === 'incidente') nearMisses++
    else if (t === 'work_disease' || t === 'afastamento' || t === 'atestado')
      workDiseases++
  }

  // ── Harassment reports ──────────────────────────────────────────
  let harassQuery = sb
    .from('harassment_reports')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
  if (resolvedCycleId) harassQuery = harassQuery.eq('cycle_id', resolvedCycleId)

  const { count: harassCount } = await harassQuery

  return {
    company: {
      name: company?.name ?? companyId,
      cnpj: company?.cnpj ?? '',
      cnae: company?.cnae ?? null,
      departments: Array.from(departments),
      sst_responsible_name: company?.sst_responsible_name ?? null,
      sst_responsible_role: company?.sst_responsible_role ?? null,
    },
    cycle,
    assessmentCount: evaluations.length,
    domainScores,
    scoresByDepartment,
    psychosocialAxes,
    inventory,
    actions,
    incidents: {
      accidents,
      nearMisses,
      workDiseases,
      total: (eventRows ?? []).length,
    },
    harassmentCount: harassCount ?? 0,
    chemicalExposures,
    biologicalExposures,
    perceptionSummary: {
      avgSatisfaction,
      topRisks,
      topSuggestions,
    },
  }
}
