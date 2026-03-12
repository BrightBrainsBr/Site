// frontend/features/assessment/components/constants/scales/asrs.ts

import type { ScaleOption } from '../../assessment.interface'

export const ASRS_QUESTIONS: string[] = [
  'Dificuldade para finalizar detalhes finais de um projeto',
  'Dificuldade para colocar as coisas em ordem em tarefas que exigem organização',
  'Dificuldade para lembrar de compromissos ou obrigações',
  'Quando uma tarefa exige reflexão, frequência com que evita ou adia',
  'Inquietação ou contorção na cadeira quando sentado por muito tempo',
  'Sentir-se excessivamente ativo(a) como se movido por um motor',
]

export const ASRS_OPTIONS: ScaleOption[] = [
  { label: 'Nunca', value: 0 },
  { label: 'Raramente', value: 1 },
  { label: 'Às vezes', value: 2 },
  { label: 'Frequentemente', value: 3 },
  { label: 'Muito frequentemente', value: 4 },
]
