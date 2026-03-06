// frontend/components/assessment/constants/scales/snapiv.ts

import type { ScaleOption, ScaleQuestion } from '../../assessment.interface'

export const SNAPIV_QUESTIONS: ScaleQuestion[] = [
  { q: 'Não presta atenção a detalhes', d: 'DA' },
  { q: 'Dificuldade de manter atenção', d: 'DA' },
  { q: 'Parece não ouvir', d: 'DA' },
  { q: 'Não segue instruções até o fim', d: 'DA' },
  { q: 'Dificuldade para organizar', d: 'DA' },
  { q: 'Evita esforço mental prolongado', d: 'DA' },
  { q: 'Perde coisas necessárias', d: 'DA' },
  { q: 'Distrai-se com estímulos externos', d: 'DA' },
  { q: 'Esquecido em atividades diárias', d: 'DA' },
  { q: 'Mexe mãos/pés, remexe na cadeira', d: 'HI' },
  { q: 'Sai do lugar', d: 'HI' },
  { q: 'Corre/sobe em situações inapropriadas', d: 'HI' },
  { q: 'Dificuldade em brincar calmamente', d: 'HI' },
  { q: 'Não para, "a todo vapor"', d: 'HI' },
  { q: 'Fala demais', d: 'HI' },
  { q: 'Responde precipitadamente', d: 'HI' },
  { q: 'Dificuldade de esperar vez', d: 'HI' },
  { q: 'Interrompe ou se intromete', d: 'HI' },
]

export const SNAPIV_OPTIONS: ScaleOption[] = [
  { label: 'Nem um pouco', value: 0 },
  { label: 'Só um pouco', value: 1 },
  { label: 'Bastante', value: 2 },
  { label: 'Demais', value: 3 },
]
