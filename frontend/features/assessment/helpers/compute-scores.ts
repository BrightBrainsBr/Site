// frontend/features/assessment/helpers/compute-scores.ts

import type {
  AssessmentFormData,
  ScaleQuestion,
} from '../components/assessment.interface'
import { AQ10_QUESTIONS } from '../components/constants/scales/aq10'
import {
  AEP_CATEGORY_DEFINITIONS,
  AEP_REVERSE_INDICES,
} from '../components/constants/scales/aep'
import { PSS10_QUESTIONS } from '../components/constants/scales/pss10'

function sumNonNull(arr: (number | null)[]): number {
  return arr.reduce<number>((sum, v) => sum + (v ?? 0), 0)
}

/** AQ-10: reverse-scored items contribute 1 if respondent answered >= 2 (agree) for non-reverse,
 *  or <= 1 (disagree) for reverse. */
function scoreAQ10(
  values: (number | null)[],
  questions: ScaleQuestion[]
): number {
  return values.reduce<number>((total, v, i) => {
    if (v === null) return total
    const isReverse = questions[i]?.r === true
    if (isReverse) return total + (v <= 1 ? 1 : 0)
    return total + (v >= 2 ? 1 : 0)
  }, 0)
}

/** PSS-10: items marked r=true are reverse-scored (4 - value). */
function scorePSS10(
  values: (number | null)[],
  questions: ScaleQuestion[]
): number {
  return values.reduce<number>((total, v, i) => {
    if (v === null) return total
    const isReverse = questions[i]?.r === true
    return total + (isReverse ? 4 - v : v)
  }, 0)
}

/** ALSFRS-R: 4 - value per item (4=normal function, 0=worst). */
function scoreALSFRS(values: (number | null)[]): number {
  return values.reduce<number>(
    (total, v) => total + (v !== null ? 4 - v : 0),
    0
  )
}

export function scoreSRQ20(answers: number[]): number {
  return answers.reduce((sum, a) => sum + a, 0)
}

export interface AEPScoreResult {
  total: number
  pressure: number
  autonomy: number
  breaks: number
  relationships: number
  cognitive: number
  environment: number
}

export function scoreAEP(answers: number[]): AEPScoreResult {
  const adjusted = answers.map((val, i) =>
    (AEP_REVERSE_INDICES as readonly number[]).includes(i) ? 4 - val : val
  )

  const dimensionScore = (indices: readonly number[]) =>
    indices.reduce((sum, i) => sum + (adjusted[i] ?? 0), 0)

  const [pressure, autonomy, breaks, relationships, cognitive, environment] =
    AEP_CATEGORY_DEFINITIONS.map((cat) => dimensionScore(cat.indices))

  return {
    total: adjusted.reduce((sum, v) => sum + v, 0),
    pressure,
    autonomy,
    breaks,
    relationships,
    cognitive,
    environment,
  }
}

function avgNonNull(values: (number | null | undefined)[]): number | null {
  const valid = values.filter((v): v is number => v != null)
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null
}

export function scorePhysical(data: AssessmentFormData): number | null {
  return avgNonNull([
    data.noise_level as number | null | undefined,
    data.temperature_level as number | null | undefined,
    data.lighting_level as number | null | undefined,
    data.vibration_level as number | null | undefined,
    data.humidity_level as number | null | undefined,
  ])
}

export function scoreErgonomic(data: AssessmentFormData): number | null {
  return avgNonNull([
    data.posture_level as number | null | undefined,
    data.repetition_level as number | null | undefined,
    data.manual_force_level as number | null | undefined,
    data.breaks_level as number | null | undefined,
    data.screen_level as number | null | undefined,
    data.mobility_level as number | null | undefined,
    data.cognitive_effort_level as number | null | undefined,
  ])
}

export function scorePsychosocial(data: AssessmentFormData): number | null {
  return avgNonNull([
    data.workload_level as number | null | undefined,
    data.pace_level as number | null | undefined,
    data.autonomy_level as number | null | undefined,
    data.leadership_level as number | null | undefined,
    data.relationships_level as number | null | undefined,
    data.recognition_level as number | null | undefined,
    data.clarity_level as number | null | undefined,
    data.balance_level as number | null | undefined,
  ])
}

export function scoreViolence(data: AssessmentFormData): number | null {
  return avgNonNull([
    data.violence_level as number | null | undefined,
    data.harassment_level as number | null | undefined,
  ])
}

export function scoreOverall(domains: {
  physical: number | null
  ergonomic: number | null
  psychosocial: number | null
  violence: number | null
}): number | null {
  const values = Object.values(domains).filter((v): v is number => v != null)
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
}

export function getNR1RiskBand(
  score: number
): 'baixo' | 'moderado' | 'alto' | 'critico' {
  if (score < 2) return 'baixo'
  if (score < 3) return 'moderado'
  if (score < 4) return 'alto'
  return 'critico'
}

export function computeAllScores(
  data: AssessmentFormData
): Record<string, number> {
  const result: Record<string, number> = {}

  const simpleScales = [
    'phq9',
    'gad7',
    'isi',
    'asrs',
    'ocir',
    'pcl5',
    'mdq',
    'mbi',
    'spin',
    'auditc',
    'ad8',
    'nms',
    'snapiv',
  ] as const

  for (const key of simpleScales) {
    const values = data[key]
    if (values.some((v) => v !== null)) {
      result[key] = sumNonNull(values)
    }
  }

  if (data.aq10.some((v) => v !== null)) {
    result.aq10 = scoreAQ10(data.aq10, AQ10_QUESTIONS)
  }

  if (data.pss10.some((v) => v !== null)) {
    result.pss10 = scorePSS10(data.pss10, PSS10_QUESTIONS)
  }

  if (data.alsfrs.some((v) => v !== null)) {
    result.alsfrs = scoreALSFRS(data.alsfrs)
  }

  if (data.srq20_answers && data.srq20_answers.length > 0) {
    result.srq20 = scoreSRQ20(data.srq20_answers)
  }

  if (data.aep_answers && data.aep_answers.length > 0) {
    const aepResult = scoreAEP(data.aep_answers)
    result.aep_total = aepResult.total
    result.aep_pressure = aepResult.pressure
    result.aep_autonomy = aepResult.autonomy
    result.aep_breaks = aepResult.breaks
    result.aep_relationships = aepResult.relationships
    result.aep_cognitive = aepResult.cognitive
    result.aep_environment = aepResult.environment
  }

  const physical = scorePhysical(data)
  const ergonomic = scoreErgonomic(data)
  const psychosocial = scorePsychosocial(data)
  const violence = scoreViolence(data)

  if (physical != null) result.nr1_physical = physical
  if (ergonomic != null) result.nr1_ergonomic = ergonomic
  if (psychosocial != null) result.nr1_psychosocial = psychosocial
  if (violence != null) result.nr1_violence = violence

  const overall = scoreOverall({ physical, ergonomic, psychosocial, violence })
  if (overall != null) result.nr1_overall = overall

  return result
}
