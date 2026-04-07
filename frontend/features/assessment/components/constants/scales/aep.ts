// frontend/features/assessment/components/constants/scales/aep.ts

export interface AEPQuestion {
  q: string
  hint: string
  category: string
  icon: string
  reverse: boolean
}

export const AEP_QUESTIONS: AEPQuestion[] = [
  // Pressão por Metas e Carga de Trabalho (0-2)
  {
    q: 'Sinto que o volume de tarefas ultrapassa o tempo disponível para realizá-las.',
    hint: 'Considere a última semana típica de trabalho. Não pense em semanas excepcionais ou de pico.',
    category: 'Pressão por Metas e Carga de Trabalho',
    icon: '📊',
    reverse: false,
  },
  {
    q: 'As metas estabelecidas para minha função são realistas e alcançáveis.',
    hint: 'Avalie se os prazos e entregas esperados são compatíveis com os recursos disponíveis.',
    category: 'Pressão por Metas e Carga de Trabalho',
    icon: '📊',
    reverse: true,
  },
  {
    q: 'Preciso trabalhar além do horário regular para cumprir minhas entregas.',
    hint: 'Inclua horas extras, responder mensagens/e-mails fora do expediente e levar trabalho para casa.',
    category: 'Pressão por Metas e Carga de Trabalho',
    icon: '📊',
    reverse: false,
  },

  // Autonomia e Controle (3-4)
  {
    q: 'Tenho liberdade para organizar a ordem e o ritmo das minhas atividades.',
    hint: 'Pense em quanto controle você tem sobre quando e como realizar suas tarefas do dia a dia.',
    category: 'Autonomia e Controle',
    icon: '🎯',
    reverse: true,
  },
  {
    q: 'Posso tomar decisões sobre como executar meu trabalho sem aprovação constante.',
    hint: 'Avalie se você precisa pedir autorização para cada decisão, mesmo as rotineiras.',
    category: 'Autonomia e Controle',
    icon: '🎯',
    reverse: true,
  },

  // Pausas e Jornada (5-6)
  {
    q: 'Consigo fazer pausas regulares durante minha jornada de trabalho.',
    hint: 'Inclua pausas para café, ir ao banheiro, se levantar da mesa. Não considere apenas o almoço.',
    category: 'Pausas e Jornada',
    icon: '⏰',
    reverse: true,
  },
  {
    q: 'Meu horário de trabalho permite que eu tenha tempo adequado para descanso e vida pessoal.',
    hint: 'Pense se ao final do expediente você consegue se desconectar e ter tempo de qualidade fora do trabalho.',
    category: 'Pausas e Jornada',
    icon: '⏰',
    reverse: true,
  },

  // Relações Interpessoais e Suporte (7-9)
  {
    q: 'Recebo apoio da minha chefia imediata quando enfrento dificuldades no trabalho.',
    hint: 'Considere tanto apoio técnico (ajuda para resolver problemas) quanto emocional (compreensão).',
    category: 'Relações Interpessoais e Suporte',
    icon: '🤝',
    reverse: true,
  },
  {
    q: 'O relacionamento entre colegas no meu setor é respeitoso e colaborativo.',
    hint: 'Avalie o ambiente geral — não um evento isolado. Pense na dinâmica do dia a dia.',
    category: 'Relações Interpessoais e Suporte',
    icon: '🤝',
    reverse: true,
  },
  {
    q: 'Sinto-me seguro(a) para reportar problemas sem medo de represálias.',
    hint: 'Inclua reportar erros, discordar de decisões ou comunicar situações de assédio/conflito.',
    category: 'Relações Interpessoais e Suporte',
    icon: '🤝',
    reverse: true,
  },

  // Demandas Cognitivas e Emocionais (10-11)
  {
    q: 'Meu trabalho exige atenção intensa e contínua por longos períodos.',
    hint: "Pense em quanto tempo você passa sem poder 'desligar' a atenção — tarefas que não permitem distrações.",
    category: 'Demandas Cognitivas e Emocionais',
    icon: '🧠',
    reverse: false,
  },
  {
    q: 'Preciso lidar com situações emocionalmente desgastantes na minha função.',
    hint: 'Inclui lidar com clientes difíceis, conflitos, cobranças agressivas, notícias ruins ou pressão emocional constante.',
    category: 'Demandas Cognitivas e Emocionais',
    icon: '🧠',
    reverse: false,
  },

  // Ambiente e Organização (12-13)
  {
    q: 'As condições do meu posto de trabalho (ruído, iluminação, temperatura) permitem concentração adequada.',
    hint: 'Avalie seu ambiente físico real — escritório, home office ou ambiente operacional. Inclua distrações sonoras.',
    category: 'Ambiente e Organização',
    icon: '🏢',
    reverse: true,
  },
  {
    q: 'Recebo informações claras sobre o que é esperado de mim.',
    hint: 'Pense se as expectativas, prioridades e critérios de avaliação do seu trabalho são comunicados com clareza.',
    category: 'Ambiente e Organização',
    icon: '🏢',
    reverse: true,
  },
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
  { name: 'Pressão por Metas e Carga de Trabalho', indices: [0, 1, 2], maxScore: 12 },
  { name: 'Autonomia e Controle', indices: [3, 4], maxScore: 8 },
  { name: 'Pausas e Jornada', indices: [5, 6], maxScore: 8 },
  { name: 'Relações Interpessoais e Suporte', indices: [7, 8, 9], maxScore: 12 },
  { name: 'Demandas Cognitivas e Emocionais', indices: [10, 11], maxScore: 8 },
  { name: 'Ambiente e Organização', indices: [12, 13], maxScore: 8 },
]
