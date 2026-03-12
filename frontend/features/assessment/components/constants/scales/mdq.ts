// frontend/features/assessment/components/constants/scales/mdq.ts

import type { ScaleOption } from '../../assessment.interface'

export const MDQ_QUESTIONS: string[] = [
  'Sentiu-se tão bem que pessoas acharam anormal?',
  'Ficou tão irritável que gritou ou iniciou brigas?',
  'Sentiu-se muito mais autoconfiante do que de costume?',
  'Dormiu muito menos sem fazer falta?',
  'Ficou mais falante ou pressão para falar sem parar?',
  'Pensamentos corriam rápido pela cabeça?',
  'Ficou muito distraído(a)?',
  'Muito mais energia que de costume?',
  'Muito mais ativo(a) ou fez mais coisas?',
  'Muito mais sociável?',
  'Muito mais interessado(a) em sexo?',
  'Fez coisas excessivas, tolas ou arriscadas?',
  'Gastar dinheiro causou problemas?',
]

export const MDQ_OPTIONS: ScaleOption[] = [
  { label: 'Não', value: 0 },
  { label: 'Sim', value: 1 },
]
