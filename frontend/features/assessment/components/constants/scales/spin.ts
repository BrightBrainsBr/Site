// frontend/features/assessment/components/constants/scales/spin.ts

import type { ScaleOption } from '../../assessment.interface'

export const SPIN_QUESTIONS: string[] = [
  'Ser envergonhado(a) é meu pior medo',
  'Evito atividades em que sou centro das atenções',
  'Medo de ser constrangido(a) é grande preocupação',
]

export const SPIN_OPTIONS: ScaleOption[] = [
  { label: 'Nada', value: 0 },
  { label: 'Um pouco', value: 1 },
  { label: 'Moderadamente', value: 2 },
  { label: 'Bastante', value: 3 },
  { label: 'Extremamente', value: 4 },
]
