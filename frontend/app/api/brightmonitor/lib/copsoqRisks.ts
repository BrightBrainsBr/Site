// frontend/app/api/brightmonitor/lib/copsoqRisks.ts
//
// Predefined COPSOQ-II-style psychosocial risks. Each risk is mapped to one of
// the 8 NR-1 psychosocial axes captured by PsicossocialStep, plus the two
// violence/harassment axes. Single source of truth used by:
//   - /api/brightmonitor/[companyId]/inventory/psychosocial (classification API)
//   - B2BPsychosocialInventoryTab (UI)
//   - inventory PDF generator
//
// Probability × severity classification logic lives in ./riskUtils.ts
// (getCopsoqClassification).

/** NR-1 psychosocial column names available on mental_health_evaluations. */
export type PsychosocialAxis =
  | 'workload_level'
  | 'pace_level'
  | 'autonomy_level'
  | 'leadership_level'
  | 'relationships_level'
  | 'recognition_level'
  | 'clarity_level'
  | 'balance_level'
  | 'violence_level'
  | 'harassment_level'

export type CopsoqFamily =
  | 'demandas'
  | 'organizacao'
  | 'relacoes_lideranca'
  | 'reconhecimento'
  | 'conflito_papeis'
  | 'trabalho_vida'
  | 'violencia'

export interface CopsoqRisk {
  /** Stable id used as keys / refIds in API + URLs. */
  id: string
  /** Display name (Brazilian Portuguese). */
  name: string
  /** Short description shown in tooltip / detail. */
  description: string
  /** Source NR-1 column on mental_health_evaluations. */
  axis: PsychosocialAxis
  /** COPSOQ-II family (used for grouping in UI). */
  family: CopsoqFamily
}

export const COPSOQ_RISKS: CopsoqRisk[] = [
  {
    id: 'demanda_quantitativa',
    name: 'Demandas quantitativas',
    description:
      'Volume e quantidade de tarefas que excedem a capacidade de execução.',
    axis: 'workload_level',
    family: 'demandas',
  },
  {
    id: 'ritmo_trabalho',
    name: 'Ritmo de trabalho',
    description:
      'Velocidade exigida e pressão por resultados ao longo da jornada.',
    axis: 'pace_level',
    family: 'demandas',
  },
  {
    id: 'controle_autonomia',
    name: 'Falta de controle/autonomia',
    description:
      'Pouca liberdade para decidir como, quando e em que sequência executar o trabalho.',
    axis: 'autonomy_level',
    family: 'organizacao',
  },
  {
    id: 'qualidade_lideranca',
    name: 'Qualidade da liderança',
    description:
      'Comunicação, suporte e clareza na relação com gestores diretos.',
    axis: 'leadership_level',
    family: 'relacoes_lideranca',
  },
  {
    id: 'apoio_social_colegas',
    name: 'Apoio social de colegas',
    description:
      'Conflitos interpessoais e ausência de apoio entre pares no time.',
    axis: 'relationships_level',
    family: 'relacoes_lideranca',
  },
  {
    id: 'recompensa_reconhecimento',
    name: 'Recompensa e reconhecimento',
    description:
      'Valorização (financeira e simbólica) proporcional ao esforço empregado.',
    axis: 'recognition_level',
    family: 'reconhecimento',
  },
  {
    id: 'clareza_papeis',
    name: 'Clareza de papéis',
    description:
      'Definição clara de responsabilidades, expectativas e objetivos.',
    axis: 'clarity_level',
    family: 'conflito_papeis',
  },
  {
    id: 'conflito_trabalho_familia',
    name: 'Conflito trabalho-família',
    description:
      'Dificuldade em conciliar exigências do trabalho com a vida pessoal e familiar.',
    axis: 'balance_level',
    family: 'trabalho_vida',
  },
  {
    id: 'violencia_trabalho',
    name: 'Violência no trabalho',
    description:
      'Exposição a agressões físicas, verbais ou psicológicas no ambiente laboral.',
    axis: 'violence_level',
    family: 'violencia',
  },
  {
    id: 'assedio_moral_sexual',
    name: 'Assédio moral ou sexual',
    description:
      'Exposição a comportamentos abusivos, humilhantes ou assédio sexual.',
    axis: 'harassment_level',
    family: 'violencia',
  },
]
