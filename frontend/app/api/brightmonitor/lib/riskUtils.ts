// frontend/app/api/brightmonitor/lib/riskUtils.ts

// ── Legacy clinical scale helpers (kept for backwards compat) ──

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

// ── NR-1 domain score helpers (1–5 Likert scale) ──

export type NR1RiskBand = 'baixo' | 'moderado' | 'alto' | 'critico'

export function getNR1RiskBand(score: number): NR1RiskBand {
  if (score < 2) return 'baixo'
  if (score < 3) return 'moderado'
  if (score < 4) return 'alto'
  return 'critico'
}

export function computeDomainMean(
  rows: Array<Record<string, unknown>>,
  column: string
): number | null {
  const values = rows
    .map((r) => r[column])
    .filter((v): v is number => typeof v === 'number')
  return values.length
    ? +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
    : null
}

export const NR1_RISK_BAND_COLORS: Record<NR1RiskBand, string> = {
  baixo: '#22c55e',
  moderado: '#eab308',
  alto: '#f97316',
  critico: '#ef4444',
}

export const NR1_DOMAIN_COLUMNS = [
  'score_physical',
  'score_ergonomic',
  'score_psychosocial',
  'score_violence',
  'score_overall',
] as const

export const NR1_PSYCHOSOCIAL_COLUMNS = [
  'workload_level',
  'pace_level',
  'autonomy_level',
  'leadership_level',
  'relationships_level',
  'recognition_level',
  'clarity_level',
  'balance_level',
] as const
