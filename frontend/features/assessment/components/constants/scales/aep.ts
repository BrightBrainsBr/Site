// frontend/features/assessment/components/constants/scales/aep.ts

export interface AEPQuestion {
  q: string
  hint: string
  category: string
  icon: string
  reverse: boolean
}

export const AEP_QUESTIONS: AEPQuestion[] = [
  // Pressão por Metas (0-2)
  { q: 'Sinto pressão excessiva para atingir metas no trabalho.', hint: 'Metas irrealistas, cobranças constantes', category: 'Pressão por Metas', icon: '🎯', reverse: false },
  { q: 'Consigo planejar minhas tarefas com tempo adequado.', hint: 'Organização do tempo, planejamento viável', category: 'Pressão por Metas', icon: '🎯', reverse: true },
  { q: 'O ritmo de trabalho me causa esgotamento físico ou mental.', hint: 'Fadiga laboral, sobrecarga de ritmo', category: 'Pressão por Metas', icon: '🎯', reverse: false },

  // Autonomia e Controle (3-4)
  { q: 'Tenho liberdade para decidir como realizar minhas tarefas.', hint: 'Microgerenciamento vs. autonomia', category: 'Autonomia e Controle', icon: '🔓', reverse: true },
  { q: 'Participo das decisões que afetam meu trabalho.', hint: 'Inclusão nas decisões, voz ativa', category: 'Autonomia e Controle', icon: '🔓', reverse: true },

  // Pausas e Jornada (5-6)
  { q: 'Consigo fazer pausas regulares durante o expediente.', hint: 'Intervalos, recuperação durante jornada', category: 'Pausas e Jornada', icon: '⏸️', reverse: true },
  { q: 'Minha jornada de trabalho é respeitada (sem horas extras constantes).', hint: 'Limites de jornada, equilíbrio', category: 'Pausas e Jornada', icon: '⏸️', reverse: true },

  // Relações Interpessoais (7-9)
  { q: 'Tenho bom relacionamento com colegas e chefia.', hint: 'Clima organizacional, suporte social', category: 'Relações Interpessoais', icon: '🤝', reverse: true },
  { q: 'Me sinto respeitado(a) no ambiente de trabalho.', hint: 'Dignidade, reconhecimento', category: 'Relações Interpessoais', icon: '🤝', reverse: true },
  { q: 'Existe cooperação entre os membros da equipe.', hint: 'Trabalho em equipe, solidariedade', category: 'Relações Interpessoais', icon: '🤝', reverse: true },

  // Demandas Cognitivas (10-11)
  { q: 'As demandas mentais do trabalho são excessivas.', hint: 'Sobrecarga cognitiva, complexidade', category: 'Demandas Cognitivas', icon: '🧠', reverse: false },
  { q: 'Preciso tomar decisões difíceis com frequência sem suporte.', hint: 'Decisões sob pressão, responsabilidade isolada', category: 'Demandas Cognitivas', icon: '🧠', reverse: false },

  // Ambiente e Organização (12-13)
  { q: 'As condições físicas do meu local de trabalho são adequadas.', hint: 'Ergonomia, iluminação, ruído, temperatura', category: 'Ambiente e Organização', icon: '🏢', reverse: true },
  { q: 'Os recursos e ferramentas para o trabalho são suficientes.', hint: 'Equipamentos, materiais, infraestrutura', category: 'Ambiente e Organização', icon: '🏢', reverse: true },
]

export const AEP_REVERSE_INDICES = [1, 3, 4, 5, 6, 7, 8, 9, 12, 13] as const

export const AEP_LIKERT_OPTIONS = [
  { label: 'Nunca', value: 0 },
  { label: 'Raramente', value: 1 },
  { label: 'Às vezes', value: 2 },
  { label: 'Frequentemente', value: 3 },
  { label: 'Sempre', value: 4 },
] as const

export const AEP_RANGES = [
  { min: 0, max: 14, label: 'Baixo risco ergonômico', color: 'green', level: 'baixo' },
  { min: 15, max: 28, label: 'Risco moderado', color: 'yellow', level: 'moderado' },
  { min: 29, max: 42, label: 'Risco elevado', color: 'orange', level: 'elevado' },
  { min: 43, max: 56, label: 'Risco crítico', color: 'red', level: 'critico' },
] as const

export interface AEPCategoryDefinition {
  name: string
  indices: readonly number[]
  maxScore: number
}

export const AEP_CATEGORY_DEFINITIONS: AEPCategoryDefinition[] = [
  { name: 'Pressão por Metas', indices: [0, 1, 2], maxScore: 12 },
  { name: 'Autonomia e Controle', indices: [3, 4], maxScore: 8 },
  { name: 'Pausas e Jornada', indices: [5, 6], maxScore: 8 },
  { name: 'Relações Interpessoais', indices: [7, 8, 9], maxScore: 12 },
  { name: 'Demandas Cognitivas', indices: [10, 11], maxScore: 8 },
  { name: 'Ambiente e Organização', indices: [12, 13], maxScore: 8 },
]
