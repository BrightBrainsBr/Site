// frontend/components/assessment/constants/lifestyle-options.ts

export const CIVIL_STATUS_OPTIONS = [
  'Solteiro(a)',
  'Casado(a)',
  'União estável',
  'Divorciado(a)',
  'Viúvo(a)',
  'Namorando',
] as const

export const PROFESSIONAL_SITUATION_OPTIONS = [
  { label: 'CLT', value: 'clt' },
  { label: 'Autônomo/PJ', value: 'autonomo' },
  { label: 'Empresário', value: 'empresario' },
  { label: 'Servidor', value: 'servidor' },
  { label: 'Estudante', value: 'estudante' },
  { label: 'Aposentado', value: 'aposentado' },
  { label: 'Desempregado', value: 'desempregado' },
  { label: 'Afastado', value: 'afastado' },
] as const

export const WORK_HOURS_OPTIONS = [
  '< 20h',
  '20-30h',
  '30-40h',
  '40-50h',
  '50-60h',
  '> 60h',
] as const

export const SLEEP_QUALITY_OPTIONS = [
  'Muito boa',
  'Boa',
  'Regular',
  'Ruim',
  'Muito ruim',
] as const

export const EXERCISE_FREQ_OPTIONS = [
  'Não pratico',
  '1-2x/sem',
  '3-4x/sem',
  '5+/sem',
] as const

export const CAFFEINE_OPTIONS = ['Não', '1-2/dia', '3-4/dia', '5+'] as const

export const TOBACCO_OPTIONS = ['Nunca', 'Ex-fumante', 'Fumante'] as const

export const CANNABIS_OPTIONS = [
  'Nunca',
  'Já usei',
  'Ocasional',
  'Regular',
] as const

export const STRESS_LEVEL_OPTIONS = [
  'Baixo',
  'Moderado',
  'Alto',
  'Muito alto',
] as const

export const SUPPORT_NETWORK_OPTIONS = [
  'Forte',
  'Moderada',
  'Fraca',
  'Isolamento',
] as const

export const STRESS_SOURCES: string[] = [
  'Trabalho',
  'Financeiro',
  'Relacionamento',
  'Família',
  'Saúde',
  'Solidão',
  'Luto',
  'Mudança de vida',
  'Estudos',
  'Outro',
]

export const NEUROMOD_OPTIONS = ['Nunca', 'Já fiz', 'Faço atualmente'] as const

export const RELATIONSHIP_SATISFACTION_OPTIONS = [
  'Muito satisfeito',
  'Satisfeito',
  'Neutro',
  'Insatisfeito',
  'Muito insatisfeito',
] as const
