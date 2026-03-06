// frontend/components/assessment/constants/scales/nms.ts

import type { ScaleOption, ScaleQuestion } from '../../assessment.interface'

export const NMS_QUESTIONS: ScaleQuestion[] = [
  { q: 'Perda/alteração do olfato', c: 'Sensorial' },
  { q: 'Constipação intestinal persistente', c: 'GI' },
  { q: 'Dificuldade para engolir', c: 'GI' },
  { q: 'Urgência urinária', c: 'Urinário' },
  { q: 'Tontura ao levantar', c: 'Cardiovascular' },
  { q: 'Sonolência diurna excessiva', c: 'Sono' },
  { q: 'Movimentos involuntários durante o sono', c: 'Sono' },
  { q: 'Insônia ou sono fragmentado', c: 'Sono' },
  { q: 'Dificuldade de concentração', c: 'Cognitivo' },
  { q: 'Esquecimento recente', c: 'Cognitivo' },
  { q: 'Perda de interesse/motivação', c: 'Psiquiátrico' },
  { q: 'Ansiedade ou pânico', c: 'Psiquiátrico' },
  { q: 'Humor deprimido', c: 'Psiquiátrico' },
  { q: 'Dores inexplicáveis', c: 'Dor' },
  { q: 'Letra ficando menor', c: 'Motor' },
]

export const NMS_OPTIONS: ScaleOption[] = [
  { label: 'Não', value: 0 },
  { label: 'Sim', value: 1 },
]
