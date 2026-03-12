// frontend/features/assessment/components/constants/scales/ad8.ts

import type { ScaleOption } from '../../assessment.interface'

export const AD8_QUESTIONS: string[] = [
  'Problemas de julgamento',
  'Menor interesse em hobbies',
  'Repete perguntas/histórias',
  'Dificuldade com aparelhos novos',
  'Esquece mês/ano correto',
  'Dificuldade com finanças complexas',
  'Dificuldade em lembrar compromissos',
  'Problemas de raciocínio/memória no dia a dia',
]

export const AD8_OPTIONS: ScaleOption[] = [
  { label: 'Não', value: 0 },
  { label: 'Sim', value: 1 },
]
