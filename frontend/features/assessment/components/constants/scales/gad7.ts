// frontend/features/assessment/components/constants/scales/gad7.ts

import type { ScaleOption } from '../../assessment.interface'

/** Shared frequency options for PHQ-9, GAD-7 */
export const FREQ_OPTIONS: ScaleOption[] = [
  { label: 'Nenhuma vez', value: 0 },
  { label: 'Vários dias', value: 1 },
  { label: 'Mais da metade dos dias', value: 2 },
  { label: 'Quase todos os dias', value: 3 },
]

export const GAD7_QUESTIONS: string[] = [
  'Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)',
  'Não ser capaz de impedir ou controlar as preocupações',
  'Preocupar-se muito com diversas coisas',
  'Dificuldade para relaxar',
  'Ficar tão agitado(a) que se torna difícil permanecer sentado(a)',
  'Ficar facilmente aborrecido(a) ou irritado(a)',
  'Sentir medo como se algo horrível pudesse acontecer',
]
