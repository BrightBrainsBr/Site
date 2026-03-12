import { CHRONIC_CONDITIONS, FAMILY_CONDITIONS } from '~/features/assessment/components/constants/medical-options'
import {
  CAFFEINE_OPTIONS,
  CANNABIS_OPTIONS,
  CIVIL_STATUS_OPTIONS,
  EXERCISE_FREQ_OPTIONS,
  NEUROMOD_OPTIONS,
  RELATIONSHIP_SATISFACTION_OPTIONS,
  SLEEP_QUALITY_OPTIONS,
  STRESS_LEVEL_OPTIONS,
  STRESS_SOURCES,
  SUPPORT_NETWORK_OPTIONS,
  TOBACCO_OPTIONS,
  PROFESSIONAL_SITUATION_OPTIONS,
} from '~/features/assessment/components/constants/lifestyle-options'
import { SYMPTOM_CATEGORIES } from '~/features/assessment/components/constants/symptom-categories'

export interface SelectOption {
  label: string
  value: string
}

export type FieldType = 'text' | 'textarea' | 'select' | 'pills'

export interface FieldConfig {
  type: FieldType
  options?: SelectOption[]
  availableItems?: string[]
}

function stringsToOptions(items: readonly string[]): SelectOption[] {
  return items.map((s) => ({ label: s, value: s }))
}

const YES_NO: SelectOption[] = [
  { label: 'Sim', value: 'sim' },
  { label: 'Não', value: 'nao' },
]

const YES_NO_MAYBE: SelectOption[] = [
  { label: 'Sim', value: 'sim' },
  { label: 'Não', value: 'nao' },
  { label: 'Não sei', value: 'nao_sei' },
]

const SEXO_OPTIONS: SelectOption[] = [
  { label: 'Masculino', value: 'masculino' },
  { label: 'Feminino', value: 'feminino' },
  { label: 'Outro', value: 'outro' },
  { label: 'Prefiro não informar', value: 'nao_informar' },
]

const ESCOLARIDADE_OPTIONS: SelectOption[] = [
  { label: 'Fundamental incompleto', value: 'fund_inc' },
  { label: 'Fundamental completo', value: 'fund_comp' },
  { label: 'Médio incompleto', value: 'med_inc' },
  { label: 'Médio completo', value: 'med_comp' },
  { label: 'Superior incompleto', value: 'sup_inc' },
  { label: 'Superior completo', value: 'sup_comp' },
  { label: 'Pós-graduação', value: 'pos' },
  { label: 'Mestrado', value: 'mestrado' },
  { label: 'Doutorado', value: 'doutorado' },
]

const PUBLICO_OPTIONS: SelectOption[] = [
  { label: 'Adulto', value: 'adulto' },
  { label: 'Infantil', value: 'infantil' },
  { label: 'Neurológico', value: 'neuro' },
  { label: 'Executivo', value: 'executivo' },
  { label: 'Longevidade', value: 'longevidade' },
]

const PSICOTERAPIA_OPTIONS: SelectOption[] = [
  { label: 'Sim', value: 'sim' },
  { label: 'Não', value: 'nao' },
  { label: 'Já fiz', value: 'ja_fiz' },
]

const TRIAGE_FORMAT_OPTIONS: SelectOption[] = [
  { label: 'Presencial', value: 'presencial' },
  { label: 'Teleconsulta', value: 'teleconsulta' },
  { label: 'Telefone', value: 'telefone' },
  { label: 'Misto', value: 'misto' },
]

const ALL_SYMPTOMS = SYMPTOM_CATEGORIES.flatMap((c) => c.items)

export const FIELD_CONFIG: Record<string, FieldConfig> = {
  sexo: { type: 'select', options: SEXO_OPTIONS },
  escolaridade: { type: 'select', options: ESCOLARIDADE_OPTIONS },
  publico: { type: 'select', options: PUBLICO_OPTIONS },
  diagAnterior: { type: 'select', options: YES_NO },
  psicoterapia: { type: 'select', options: PSICOTERAPIA_OPTIONS },
  internacao: { type: 'select', options: YES_NO },
  examesNeuro: { type: 'select', options: YES_NO_MAYBE },
  triagemFormato: { type: 'select', options: TRIAGE_FORMAT_OPTIONS },
  usaMedicamento: { type: 'select', options: YES_NO },
  medPassado: { type: 'select', options: YES_NO },
  estadoCivil: { type: 'select', options: stringsToOptions(CIVIL_STATUS_OPTIONS) },
  satisfacaoRelacionamento: { type: 'select', options: stringsToOptions(RELATIONSHIP_SATISFACTION_OPTIONS) },
  situacaoProfissional: {
    type: 'select',
    options: PROFESSIONAL_SITUATION_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
  },
  cargaHoraria: { type: 'select', options: stringsToOptions(['< 20h', '20-30h', '30-40h', '40-50h', '50-60h', '> 60h']) },
  qualidadeSono: { type: 'select', options: stringsToOptions(SLEEP_QUALITY_OPTIONS) },
  atividadeFisica: { type: 'select', options: stringsToOptions(EXERCISE_FREQ_OPTIONS) },
  cafeina: { type: 'select', options: stringsToOptions(CAFFEINE_OPTIONS) },
  tabaco: { type: 'select', options: stringsToOptions(TOBACCO_OPTIONS) },
  cannabis: { type: 'select', options: stringsToOptions(CANNABIS_OPTIONS) },
  neuromod: { type: 'select', options: stringsToOptions(NEUROMOD_OPTIONS) },
  estresse: { type: 'select', options: stringsToOptions(STRESS_LEVEL_OPTIONS) },
  redeApoio: { type: 'select', options: stringsToOptions(SUPPORT_NETWORK_OPTIONS) },
  usaWearable: { type: 'select', options: YES_NO },

  sintomasAtuais: { type: 'pills', availableItems: ALL_SYMPTOMS },
  condicoesCronicas: { type: 'pills', availableItems: CHRONIC_CONDITIONS },
  fontesEstresse: { type: 'pills', availableItems: STRESS_SOURCES },
  familiaCondicoes: { type: 'pills', availableItems: FAMILY_CONDITIONS },
}
