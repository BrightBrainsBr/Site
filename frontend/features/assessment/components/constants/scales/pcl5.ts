// frontend/features/assessment/components/constants/scales/pcl5.ts

import type { ScaleOption } from '../../assessment.interface'

export const PCL5_QUESTIONS: string[] = [
  'Memórias perturbadoras repetidas de experiência estressante',
  'Evitar pensar/falar sobre experiência estressante',
  'Constantemente alerta ou em guarda',
  'Irritabilidade ou explosões de raiva',
  'Dificuldade de concentração',
  'Dificuldade para dormir',
  'Sentir-se emocionalmente entorpecido(a)',
  'Distante de outras pessoas',
]

export const PCL5_OPTIONS: ScaleOption[] = [
  { label: 'Nada', value: 0 },
  { label: 'Um pouco', value: 1 },
  { label: 'Moderadamente', value: 2 },
  { label: 'Bastante', value: 3 },
  { label: 'Extremamente', value: 4 },
]
