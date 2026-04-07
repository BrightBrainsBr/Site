// frontend/features/assessment/components/constants/scales/srq20.ts

export interface SRQ20Question {
  q: string
  hint: string
  category: string
  icon: string
}

export const SRQ20_QUESTIONS: SRQ20Question[] = [
  // Sintomas Somáticos (0-5)
  {
    q: 'Você tem dores de cabeça frequentes?',
    hint: 'Considere dores de cabeça que acontecem pelo menos 2-3 vezes por semana, sem causa médica conhecida.',
    category: 'Sintomas Somáticos',
    icon: '🤕',
  },
  {
    q: 'Tem falta de apetite?',
    hint: 'Avalie se você perdeu vontade de comer ou se pula refeições com frequência, sem estar fazendo dieta intencional.',
    category: 'Sintomas Somáticos',
    icon: '🤕',
  },
  {
    q: 'Dorme mal?',
    hint: 'Inclui dificuldade para pegar no sono, acordar no meio da noite, acordar muito cedo ou sentir que o sono não foi reparador.',
    category: 'Sintomas Somáticos',
    icon: '🤕',
  },
  {
    q: 'Tem sensações desagradáveis no estômago?',
    hint: 'Pense em enjoo, queimação, embrulho, dor ou desconforto estomacal sem causa médica identificada.',
    category: 'Sintomas Somáticos',
    icon: '🤕',
  },
  {
    q: 'Tem tremores nas mãos?',
    hint: 'Observe se suas mãos tremem ao segurar objetos leves, escrever ou em repouso — mesmo que discretamente.',
    category: 'Sintomas Somáticos',
    icon: '🤕',
  },
  {
    q: 'Você se cansa com facilidade?',
    hint: 'Avalie se atividades que antes eram leves agora parecem exaustivas, ou se você sente cansaço desproporcional ao esforço.',
    category: 'Sintomas Somáticos',
    icon: '🤕',
  },

  // Humor, Energia e Motivação (6-11)
  {
    q: 'Sente-se cansado(a) o tempo todo?',
    hint: "Diferente de 'cansar com facilidade': aqui é sobre um cansaço constante, que já está presente ao acordar, mesmo após descanso.",
    category: 'Humor, Energia e Motivação',
    icon: '😔',
  },
  {
    q: 'Tem se sentido triste ultimamente?',
    hint: 'Pense em um sentimento persistente de tristeza ou vazio que dura a maior parte do dia, na maioria dos dias.',
    category: 'Humor, Energia e Motivação',
    icon: '😔',
  },
  {
    q: 'Tem chorado mais do que de costume?',
    hint: 'Inclui chorar por motivos que antes não provocariam choro, ou sentir vontade de chorar sem razão aparente.',
    category: 'Humor, Energia e Motivação',
    icon: '😔',
  },
  {
    q: 'Tem perdido o interesse pelas coisas?',
    hint: 'Avalie se atividades que antes davam prazer (hobbies, encontros sociais, trabalho) agora parecem indiferentes.',
    category: 'Humor, Energia e Motivação',
    icon: '😔',
  },
  {
    q: 'Você se sente uma pessoa inútil, sem préstimo?',
    hint: 'Pense se você sente que não contribui, que não faz diferença ou que os outros seriam melhores sem você.',
    category: 'Humor, Energia e Motivação',
    icon: '😔',
  },
  {
    q: 'Tem tido ideia de acabar com a vida?',
    hint: 'Responda com sinceridade. Se sim, saiba que a empresa oferece canal de apoio confidencial. CVV: 188 (24h).',
    category: 'Humor, Energia e Motivação',
    icon: '😔',
  },

  // Cognição e Funcionamento (12-16)
  {
    q: 'Tem dificuldade de pensar com clareza?',
    hint: "Inclui 'nevoeiro mental', sensação de lentidão do pensamento, confusão ou dificuldade de organizar ideias.",
    category: 'Cognição e Funcionamento',
    icon: '🧠',
  },
  {
    q: 'Tem dificuldade para tomar decisões?',
    hint: 'Avalie se decisões simples do dia a dia (o que comer, o que priorizar) estão levando tempo ou esforço excessivo.',
    category: 'Cognição e Funcionamento',
    icon: '🧠',
  },
  {
    q: 'Encontra dificuldade para realizar com satisfação suas atividades diárias?',
    hint: 'Pense se tarefas rotineiras (trabalho, casa, autocuidado) estão exigindo mais esforço ou gerando menos satisfação.',
    category: 'Cognição e Funcionamento',
    icon: '🧠',
  },
  {
    q: 'É incapaz de desempenhar um papel útil em sua vida?',
    hint: 'Avalie se você sente que não consegue cumprir suas responsabilidades em casa, no trabalho ou em relações sociais.',
    category: 'Cognição e Funcionamento',
    icon: '🧠',
  },
  {
    q: 'Tem dificuldade no serviço — seu trabalho é penoso, causa sofrimento?',
    hint: 'Pense se o trabalho se tornou fonte constante de angústia, além do estresse normal. Não é sobre não gostar — é sobre sofrer.',
    category: 'Cognição e Funcionamento',
    icon: '🧠',
  },

  // Ansiedade e Tensão (17-19)
  {
    q: 'Sente-se nervoso(a), tenso(a) ou preocupado(a)?',
    hint: 'Avalie se a tensão ou preocupação é constante e desproporcional às situações reais que você enfrenta.',
    category: 'Ansiedade e Tensão',
    icon: '⚡',
  },
  {
    q: 'Assusta-se com facilidade?',
    hint: 'Inclui reações exageradas a barulhos, toques inesperados ou estímulos que antes não incomodavam.',
    category: 'Ansiedade e Tensão',
    icon: '⚡',
  },
  {
    q: 'Tem má digestão?',
    hint: 'Pense em problemas digestivos recorrentes que pioram em momentos de estresse ou ansiedade.',
    category: 'Ansiedade e Tensão',
    icon: '⚡',
  },
]

export const SRQ20_RANGES = [
  { min: 0, max: 7, label: 'Sem indicação de transtorno', color: 'green', level: 'baixo' },
  { min: 8, max: 11, label: 'Risco moderado', color: 'yellow', level: 'moderado' },
  { min: 12, max: 16, label: 'Risco elevado', color: 'orange', level: 'elevado' },
  { min: 17, max: 20, label: 'Risco crítico', color: 'red', level: 'critico' },
] as const

export const SRQ20_CATEGORY_MAP = {
  'Sintomas Somáticos': { indices: [0, 1, 2, 3, 4, 5], max: 6 },
  'Humor, Energia e Motivação': { indices: [6, 7, 8, 9, 10, 11], max: 6 },
  'Cognição e Funcionamento': { indices: [12, 13, 14, 15, 16], max: 5 },
  'Ansiedade e Tensão': { indices: [17, 18, 19], max: 3 },
} as const

// Only question 11 (0-indexed) is the suicidal ideation item
export const SRQ20_SUICIDAL_INDICES = [11] as const
