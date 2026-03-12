// frontend/features/assessment/components/constants/scales/pss10.ts

import type { ScaleOption, ScaleQuestion } from '../../assessment.interface'

export const PSS10_QUESTIONS: ScaleQuestion[] = [
  { q: 'Chateado(a) por algo inesperado', r: false },
  { q: 'Incapaz de controlar coisas importantes', r: false },
  { q: 'Nervoso(a) ou estressado(a)', r: false },
  { q: 'Confiante em lidar com problemas pessoais', r: true },
  { q: 'Coisas indo do seu jeito', r: true },
  { q: 'Não conseguia lidar com tudo que tinha que fazer', r: false },
  { q: 'Controlou irritações da vida', r: true },
  { q: 'Tudo sob controle', r: true },
  { q: 'Raiva por coisas fora do controle', r: false },
  { q: 'Dificuldades acumularam demais', r: false },
]

export const PSS10_OPTIONS: ScaleOption[] = [
  { label: 'Nunca', value: 0 },
  { label: 'Quase nunca', value: 1 },
  { label: 'Às vezes', value: 2 },
  { label: 'Frequentemente', value: 3 },
  { label: 'Muito frequentemente', value: 4 },
]
