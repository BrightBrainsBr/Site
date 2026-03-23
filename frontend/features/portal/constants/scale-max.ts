// frontend/features/portal/constants/scale-max.ts

import { SCALE_RANGES } from '~/features/assessment/components/constants/scoring-ranges'

/** Max score per scale for progress bar display. */
export const SCALE_MAX: Record<string, number> = {
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
}

export function getScaleMax(key: string): number {
  return SCALE_MAX[key] ?? 100
}

export function getScaleColor(key: string, score: number): string {
  const config = SCALE_RANGES[key]
  if (!config?.ranges?.length) return '#00c9b1'
  const range = config.ranges.find((r) => score >= r.min && score <= r.max)
  return range?.color ?? '#00c9b1'
}
