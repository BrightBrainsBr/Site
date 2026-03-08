// frontend/components/assessment/assessment.interface.ts

import type { ReactNode } from 'react'

export type PatientProfile =
  | 'adulto'
  | 'infantil'
  | 'neuro'
  | 'executivo'
  | 'longevidade'

export interface MedicationEntry {
  nome: string
  dose: string
  tempo: string
}

export interface SupplementEntry {
  nome: string
  dose: string
}

export interface UploadedFile {
  name: string
  size: number
  type?: string
  url?: string
  data?: string
}

export interface PriorReport {
  tipo: string
  data: string
  cid: string
  resumo: string
}

/** Full form state for the clinical assessment. */
export interface AssessmentFormData {
  // Personal data
  nome: string
  nascimento: string
  cpf: string
  telefone: string
  email: string
  sexo: string
  profissao: string
  escolaridade: string
  peso: string
  altura: string

  // Clinical profile
  publico: PatientProfile | ''
  queixaPrincipal: string
  tempoSintomas: string
  eventoDesencadeador: string

  // History
  diagAnterior: string
  diagAnterioresDetalhe: string
  psicoterapia: string
  internacao: string
  condicoesCronicas: string[]
  examesNeuro: string
  examesNeuroDetalhe: string

  // Triage / interview transcript
  triagemProfissional: string
  triagemData: string
  triagemFormato: string
  transcricaoTriagem: string
  triagemResumo: string
  triagemObservacoes: string

  // Symptoms
  sintomasAtuais: string[]
  outrosSintomas: string

  // Clinical scales
  phq9: (number | null)[]
  gad7: (number | null)[]
  isi: (number | null)[]
  asrs: (number | null)[]
  aq10: (number | null)[]
  ocir: (number | null)[]
  mbi: (number | null)[]
  pcl5: (number | null)[]
  mdq: (number | null)[]
  pss10: (number | null)[]
  ad8: (number | null)[]
  nms: (number | null)[]
  alsfrs: (number | null)[]
  snapiv: (number | null)[]
  spin: (number | null)[]
  auditc: (number | null)[]

  // MDQ follow-ups
  mdqSimultaneo: string
  mdqImpacto: string

  // Medications
  usaMedicamento: string
  medPassado: string
  medPassadoDetalhe: string
  efeitosAdversos: string
  alergias: string
  medicamentos: MedicationEntry[]

  // Supplements
  suplementos: SupplementEntry[]
  supObs: string

  // Uploads (generic)
  uploads: Record<string, UploadedFile[]>

  // Prior reports
  possuiLaudos: string
  laudosAnteriores: PriorReport[]

  // Wearables (simplified)
  usaWearable: string
  wDispositivo: string
  wFCRepouso: string
  wHRV: string
  wSonoDuracao: string
  wPassos: string
  wEstresse: string
  wearableObs: string

  // Lifestyle (simplified)
  estadoCivil: string
  satisfacaoRelacionamento: string
  situacaoProfissional: string
  cargaHoraria: string
  horaDormir: string
  horaAcordar: string
  qualidadeSono: string
  atividadeFisica: string
  cafeina: string
  tabaco: string
  cannabis: string
  neuromod: string
  neuromodDetalhes: string
  estresse: string
  redeApoio: string
  fontesEstresse: string[]
  estiloVidaObs: string

  // Family history
  familiaCondicoes: string[]
  familiaDetalhes: string
  infoAdicional: string

  [key: string]: unknown
}

export interface StepDefinition {
  id: string
  label: string
  show: (data: AssessmentFormData) => boolean
}

export interface ScaleOption {
  label: string
  value: number
}

/** Clinical scale question. */
export interface ScaleQuestion {
  q: string
  /** Custom answer options per question */
  o?: string[]
  /** Reverse-scored item (AQ-10, PSS-10) */
  r?: boolean
  /** Dimension grouping (MBI: EE/DP/RP, SNAP-IV: DA/HI) */
  d?: string
  /** Category grouping (NMS-Quest) */
  c?: string
}

export interface ScaleRange {
  min: number
  max: number
  label: string
  color: string
}

export interface ScaleConfig {
  label: string
  ranges: ScaleRange[]
}

export interface StepComponentProps {
  data: AssessmentFormData
  setData: (data: AssessmentFormData) => void
  onPrev: (() => void) | null
  onNext: (() => void) | null
}

export interface ScaleStepProps extends StepComponentProps {
  scaleKey: string
  questions: ScaleQuestion[] | string[]
  options: ScaleOption[] | null
  icon: string
  title: string
  subtitle: string
  badge?: string
  info?: string
  customScore?: (scores: (number | null)[]) => number
}

export interface FieldProps {
  label: string
  children: ReactNode
  hint?: string
  required?: boolean
}

// API types

export interface SubmitAssessmentRequest {
  formData: AssessmentFormData
  scores: Record<string, number>
}

export interface SubmitAssessmentResponse {
  evaluationId: string
}

export interface GenerateReportRequest {
  evaluationId: string
  formData: AssessmentFormData
  scores: Record<string, number>
}

export interface ReportProgressEvent {
  stage: number
  progress: number
  message: string
}

export interface ReportStageCompleteEvent {
  stage: number
  content: string
}

// Default form data is in ./initial-form-data.ts
export { INITIAL_FORM_DATA } from './initial-form-data'
