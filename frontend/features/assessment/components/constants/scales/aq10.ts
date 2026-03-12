// frontend/features/assessment/components/constants/scales/aq10.ts

import type { ScaleOption, ScaleQuestion } from '../../assessment.interface'

export const AQ10_QUESTIONS: ScaleQuestion[] = [
  { q: 'Noto pequenos sons que outros não percebem', r: false },
  { q: 'Concentro-me mais nas partes do que no todo', r: false },
  { q: 'Acho fácil fazer mais de uma coisa ao mesmo tempo', r: true },
  { q: 'Consigo voltar rapidamente ao que fazia após interrupção', r: true },
  { q: 'Acho fácil "ler nas entrelinhas"', r: true },
  { q: 'Percebo se alguém está ficando entediado', r: true },
  { q: 'Acho difícil entender intenções de personagens', r: false },
  { q: 'Gosto de colecionar informações sobre categorias', r: false },
  { q: 'Percebo facilmente sentimentos pelo rosto', r: true },
  { q: 'Acho difícil descobrir intenções das pessoas', r: false },
]

export const AQ10_OPTIONS: ScaleOption[] = [
  { label: 'Discordo totalmente', value: 0 },
  { label: 'Discordo levemente', value: 1 },
  { label: 'Concordo levemente', value: 2 },
  { label: 'Concordo totalmente', value: 3 },
]
