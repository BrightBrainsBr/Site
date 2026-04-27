// frontend/features/assessment/components/constants/nr1-options.ts

export const WORK_TIME_OPTIONS = [
  '< 1 ano',
  '1-3 anos',
  '3-5 anos',
  '5-10 anos',
  '> 10 anos',
] as const

export const CHEMICAL_AGENTS = [
  'Solventes',
  'Tintas/Vernizes',
  'Ácidos',
  'Bases',
  'Combustíveis',
  'Pesticidas',
  'Pó/Particulados',
  'Gases tóxicos',
  'Metais pesados',
  'Outros',
] as const

export const BIOLOGICAL_AGENTS = [
  'Bactérias',
  'Vírus',
  'Fungos',
  'Sangue/fluidos',
  'Animais',
  'Vegetais',
  'Resíduos orgânicos',
  'Outros',
] as const

export const NR1_RISK_BANDS = {
  baixo: { min: 0, max: 1.99, label: 'Baixo', color: '#22c55e' },
  moderado: { min: 2, max: 2.99, label: 'Moderado', color: '#eab308' },
  alto: { min: 3, max: 3.99, label: 'Alto', color: '#f97316' },
  critico: { min: 4, max: 5.0, label: 'Crítico', color: '#ef4444' },
} as const

export const PGR_SLUGS = [
  'inventario',
  'plano',
  'psicossocial',
  'pgr-completo',
  'anti-assedio',
  'os-sst',
] as const

export const ANALISE_IA_SLUGS = [
  'geral',
  'psicossocial',
  'criticos',
  'priorizar',
] as const

export const LIKERT_5_LABELS = [
  { value: 1, label: 'Nenhum / Muito Baixo' },
  { value: 2, label: 'Baixo' },
  { value: 3, label: 'Moderado' },
  { value: 4, label: 'Alto' },
  { value: 5, label: 'Muito Alto' },
] as const
