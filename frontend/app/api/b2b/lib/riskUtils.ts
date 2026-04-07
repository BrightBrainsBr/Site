// frontend/app/api/b2b/lib/riskUtils.ts

const SCALE_MAX: Record<string, number> = {
  phq9: 27,
  gad7: 21,
  isi: 28,
  asrs: 24,
  aq10: 10,
  ocir: 72,
  mbi: 80,
  pcl5: 32,
  mdq: 52,
  pss10: 40,
  ad8: 8,
  nms: 60,
  alsfrs: 48,
  snapiv: 54,
  spin: 12,
  auditc: 12,
  srq20: 20,
  aep_total: 56,
  aep_pressure: 12,
  aep_autonomy: 8,
  aep_breaks: 8,
  aep_relationships: 12,
  aep_cognitive: 8,
  aep_environment: 8,
}

export type RiskLevel = 'critical' | 'elevated' | 'moderate' | 'low'

export function getRiskLevel(score0to100: number): RiskLevel {
  if (score0to100 < 45) return 'critical'
  if (score0to100 < 60) return 'elevated'
  if (score0to100 < 70) return 'moderate'
  return 'low'
}

export function getSRQ20RiskLevel(score: number): RiskLevel {
  if (score >= 17) return 'critical'
  if (score >= 12) return 'elevated'
  if (score >= 8) return 'moderate'
  return 'low'
}

export function getAEPRiskLevel(score: number): RiskLevel {
  if (score >= 43) return 'critical'
  if (score >= 29) return 'elevated'
  if (score >= 15) return 'moderate'
  return 'low'
}

export function computeNormalizedScore(
  scores: Record<string, number> | null
): number | null {
  if (!scores || typeof scores !== 'object') return null
  const values: number[] = []
  for (const [key, raw] of Object.entries(scores)) {
    if (typeof raw !== 'number') continue
    const max = SCALE_MAX[key] ?? 100
    if (max > 0) values.push((raw / max) * 100)
  }
  if (values.length === 0) return null
  const severityPct = values.reduce((a, b) => a + b, 0) / values.length
  return 100 - severityPct
}

export const DOMAIN_KEYS = [
  'phq9',
  'gad7',
  'isi',
  'asrs',
  'aq10',
  'ocir',
  'mbi',
  'pcl5',
  'mdq',
  'pss10',
  'ad8',
  'nms',
  'alsfrs',
  'snapiv',
  'spin',
  'auditc',
  'srq20',
  'aep_total',
] as const
