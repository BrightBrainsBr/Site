// frontend/features/assessment/components/constants/scoring-ranges.ts

import type { ScaleConfig } from '../assessment.interface'

export const SCALE_RANGES: Record<string, ScaleConfig> = {
  phq9: {
    label: 'PHQ-9 — Depressão',
    ranges: [
      { min: 0, max: 4, label: 'Mínima', color: '#22c55e' },
      { min: 5, max: 9, label: 'Leve', color: '#eab308' },
      { min: 10, max: 14, label: 'Moderada', color: '#f97316' },
      { min: 15, max: 19, label: 'Moderadamente severa', color: '#ef4444' },
      { min: 20, max: 27, label: 'Severa', color: '#dc2626' },
    ],
  },
  gad7: {
    label: 'GAD-7 — Ansiedade',
    ranges: [
      { min: 0, max: 4, label: 'Mínima', color: '#22c55e' },
      { min: 5, max: 9, label: 'Leve', color: '#eab308' },
      { min: 10, max: 14, label: 'Moderada', color: '#f97316' },
      { min: 15, max: 21, label: 'Severa', color: '#ef4444' },
    ],
  },
  isi: {
    label: 'ISI — Insônia',
    ranges: [
      { min: 0, max: 7, label: 'Sem insônia', color: '#22c55e' },
      { min: 8, max: 14, label: 'Sublimiar', color: '#eab308' },
      { min: 15, max: 21, label: 'Moderada', color: '#f97316' },
      { min: 22, max: 28, label: 'Grave', color: '#ef4444' },
    ],
  },
  asrs: {
    label: 'ASRS — TDAH Adulto',
    ranges: [
      { min: 0, max: 9, label: 'Baixa probabilidade', color: '#22c55e' },
      { min: 10, max: 13, label: 'Moderada', color: '#eab308' },
      { min: 14, max: 24, label: 'Alta probabilidade', color: '#ef4444' },
    ],
  },
  aq10: {
    label: 'AQ-10 — TEA',
    ranges: [
      { min: 0, max: 5, label: 'Baixo risco', color: '#22c55e' },
      { min: 6, max: 10, label: 'Risco elevado', color: '#ef4444' },
    ],
  },
  ocir: {
    label: 'OCI-R — TOC',
    ranges: [
      { min: 0, max: 20, label: 'Sem indicação', color: '#22c55e' },
      { min: 21, max: 35, label: 'Moderado', color: '#eab308' },
      { min: 36, max: 72, label: 'Significativo', color: '#ef4444' },
    ],
  },
  pcl5: {
    label: 'PCL-5 — TEPT',
    ranges: [
      { min: 0, max: 10, label: 'Baixa probabilidade', color: '#22c55e' },
      { min: 11, max: 19, label: 'Moderada', color: '#eab308' },
      { min: 20, max: 32, label: 'Alta', color: '#ef4444' },
    ],
  },
  pss10: {
    label: 'PSS-10 — Estresse',
    ranges: [
      { min: 0, max: 13, label: 'Baixo', color: '#22c55e' },
      { min: 14, max: 26, label: 'Moderado', color: '#eab308' },
      { min: 27, max: 40, label: 'Alto', color: '#ef4444' },
    ],
  },
  ad8: {
    label: 'AD8 — Demência',
    ranges: [
      { min: 0, max: 1, label: 'Normal', color: '#22c55e' },
      { min: 2, max: 8, label: 'Comprometimento sugerido', color: '#ef4444' },
    ],
  },
  spin: {
    label: 'Mini-SPIN — Fobia Social',
    ranges: [
      { min: 0, max: 5, label: 'Baixa probabilidade', color: '#22c55e' },
      { min: 6, max: 12, label: 'Fobia social provável', color: '#ef4444' },
    ],
  },
  auditc: {
    label: 'AUDIT-C — Álcool',
    ranges: [
      { min: 0, max: 2, label: 'Baixo risco', color: '#22c55e' },
      { min: 3, max: 5, label: 'Risco', color: '#eab308' },
      { min: 6, max: 12, label: 'Uso nocivo', color: '#ef4444' },
    ],
  },
  srq20: {
    label: 'SRQ-20 — Saúde Mental',
    ranges: [
      { min: 0, max: 7, label: 'Sem indicação de transtorno', color: '#22c55e' },
      { min: 8, max: 11, label: 'Risco moderado', color: '#eab308' },
      { min: 12, max: 16, label: 'Risco elevado', color: '#f97316' },
      { min: 17, max: 20, label: 'Risco crítico', color: '#ef4444' },
    ],
  },
  aep: {
    label: 'AEP — Avaliação Ergonômica Preliminar',
    ranges: [
      { min: 0, max: 14, label: 'Baixo risco ergonômico', color: '#22c55e' },
      { min: 15, max: 28, label: 'Risco moderado', color: '#eab308' },
      { min: 29, max: 42, label: 'Risco elevado', color: '#f97316' },
      { min: 43, max: 56, label: 'Risco crítico', color: '#ef4444' },
    ],
  },
}
