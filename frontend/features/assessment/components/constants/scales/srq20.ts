// frontend/features/assessment/components/constants/scales/srq20.ts

export interface SRQ20Question {
  q: string
  hint: string
  category: string
  icon: string
}

export const SRQ20_QUESTIONS: SRQ20Question[] = [
  // Sintomas Somáticos (0-5)
  { q: 'Você tem dores de cabeça frequentes?', hint: 'Cefaleia recorrente, tensão crônica', category: 'Sintomas Somáticos', icon: '🔴' },
  { q: 'Tem falta de apetite?', hint: 'Perda de interesse por alimentos, mudança de peso', category: 'Sintomas Somáticos', icon: '🔴' },
  { q: 'Dorme mal?', hint: 'Insônia, sono não reparador, despertar precoce', category: 'Sintomas Somáticos', icon: '🔴' },
  { q: 'Assusta-se com facilidade?', hint: 'Reação exagerada a estímulos, sobressalto', category: 'Sintomas Somáticos', icon: '🔴' },
  { q: 'Tem tremores nas mãos?', hint: 'Tremor involuntário, tensão motora', category: 'Sintomas Somáticos', icon: '🔴' },
  { q: 'Tem má digestão?', hint: 'Desconforto gástrico, náusea, azia', category: 'Sintomas Somáticos', icon: '🔴' },

  // Humor, Energia e Motivação (6-11)
  { q: 'Sente-se cansado(a) o tempo todo?', hint: 'Fadiga crônica, esgotamento, falta de energia', category: 'Humor, Energia e Motivação', icon: '💜' },
  { q: 'Tem dificuldade em sentir prazer nas atividades?', hint: 'Anedonia, perda de interesse', category: 'Humor, Energia e Motivação', icon: '💜' },
  { q: 'Sente-se triste frequentemente?', hint: 'Humor deprimido, desesperança', category: 'Humor, Energia e Motivação', icon: '💜' },
  { q: 'Tem chorado mais do que de costume?', hint: 'Labilidade emocional, choro fácil', category: 'Humor, Energia e Motivação', icon: '💜' },
  { q: 'Tem dificuldade no trabalho?', hint: 'Queda de rendimento, dificuldade de concentração laboral', category: 'Humor, Energia e Motivação', icon: '💜' },
  { q: 'Tem pensamentos de acabar com a própria vida?', hint: 'Ideação suicida — resposta ativa o protocolo CVV', category: 'Humor, Energia e Motivação', icon: '💜' },

  // Cognição e Funcionamento (12-16)
  { q: 'Tem dificuldade para pensar com clareza?', hint: 'Névoa mental, confusão cognitiva', category: 'Cognição e Funcionamento', icon: '🧠' },
  { q: 'Sente-se incapaz de desempenhar um papel útil?', hint: 'Sentimento de inutilidade, baixa autoeficácia', category: 'Cognição e Funcionamento', icon: '🧠' },
  { q: 'Tem perdido o interesse pelas coisas?', hint: 'Apatia, retraimento social', category: 'Cognição e Funcionamento', icon: '🧠' },
  { q: 'Sente-se uma pessoa inútil?', hint: 'Baixa autoestima, autodepreciação', category: 'Cognição e Funcionamento', icon: '🧠' },
  { q: 'Tem tido a ideia de acabar com a própria vida?', hint: 'Ideação suicida recorrente', category: 'Cognição e Funcionamento', icon: '🧠' },

  // Ansiedade e Tensão (17-19)
  { q: 'Sente-se nervoso(a), tenso(a) ou preocupado(a)?', hint: 'Ansiedade generalizada, hipervigilância', category: 'Ansiedade e Tensão', icon: '⚡' },
  { q: 'Tem sensações desagradáveis no estômago?', hint: 'Somatização ansiosa, desconforto abdominal', category: 'Ansiedade e Tensão', icon: '⚡' },
  { q: 'Cansa-se com facilidade?', hint: 'Fadiga rápida, baixa tolerância ao esforço', category: 'Ansiedade e Tensão', icon: '⚡' },
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

export const SRQ20_SUICIDAL_INDICES = [11, 16] as const
