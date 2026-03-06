// frontend/helpers/assessment/compute-scores.ts

import type {
  AssessmentFormData,
  ScaleQuestion,
} from '../../components/assessment/assessment.interface'
import { AQ10_QUESTIONS } from '../../components/assessment/constants/scales/aq10'
import { PSS10_QUESTIONS } from '../../components/assessment/constants/scales/pss10'

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

  return result
}
