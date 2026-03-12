// frontend/features/assessment/components/constants/scales/mbi.ts

import type { ScaleOption, ScaleQuestion } from '../../assessment.interface'

export const MBI_QUESTIONS: ScaleQuestion[] = [
  { q: 'Sinto-me emocionalmente esgotado(a) pelo trabalho', d: 'EE' },
  { q: 'Sinto-me consumido(a) ao final do dia', d: 'EE' },
  { q: 'Cansado(a) ao levantar para mais um dia de trabalho', d: 'EE' },
  { q: 'Trabalhar o dia inteiro é esforço para mim', d: 'EE' },
  { q: 'Sinto que estou trabalhando demais', d: 'EE' },
  { q: 'Sinto-me frustrado(a) pelo trabalho', d: 'EE' },
  { q: 'Trato pessoas como objetos impessoais', d: 'DP' },
  { q: 'Tornei-me mais insensível com as pessoas', d: 'DP' },
  { q: 'Preocupação com endurecimento emocional', d: 'DP' },
  { q: 'Não me importo com o que acontece com alguns', d: 'DP' },
  { q: 'Lido com eficácia com problemas do trabalho', d: 'RP' },
  { q: 'Influencio positivamente a vida de outros', d: 'RP' },
  { q: 'Sinto-me com muita energia', d: 'RP' },
  { q: 'Crio ambiente descontraído facilmente', d: 'RP' },
  { q: 'Estimulado(a) após contato próximo com pessoas', d: 'RP' },
  { q: 'Realizei coisas que valem a pena', d: 'RP' },
]

export const MBI_OPTIONS: ScaleOption[] = [
  { label: 'Nunca', value: 0 },
  { label: 'Algumas/ano', value: 1 },
  { label: '1x/mês', value: 2 },
  { label: 'Algumas/mês', value: 3 },
  { label: '1x/semana', value: 4 },
  { label: 'Algumas/semana', value: 5 },
  { label: 'Todo dia', value: 6 },
]
