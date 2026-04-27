// frontend/features/assessment/components/assessment.interface.ts

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

  // B2B legacy fields
  srq20_answers?: number[]
  aep_answers?: number[]
  aep_percepcao_livre?: string
  canal_percepcao?: {
    urgencia: string
    tipo: string
    frequencia: string
    setor: string
    impacto: string
    descricao: string
    sugestao: string
  } | null
  b2b_anonymized_consent?: boolean
  b2c_consent?: boolean
  b2c_contact_consent?: boolean

  // NR-1 Perfil
  department?: string
  nr1_role?: string
  nr1_work_time?: string

  // NR-1 Riscos Físicos
  noise_level?: number | null
  temperature_level?: number | null
  lighting_level?: number | null
  vibration_level?: number | null
  humidity_level?: number | null

  // NR-1 Riscos Químicos
  chemical_exposures?: string[]
  chemical_details?: string

  // NR-1 Riscos Biológicos
  biological_exposures?: string[]
  biological_details?: string

  // NR-1 Riscos Ergonômicos
  posture_level?: number | null
  repetition_level?: number | null
  manual_force_level?: number | null
  breaks_level?: number | null
  screen_level?: number | null
  mobility_level?: number | null
  cognitive_effort_level?: number | null

  // NR-1 Fatores Psicossociais
  workload_level?: number | null
  pace_level?: number | null
  autonomy_level?: number | null
  leadership_level?: number | null
  relationships_level?: number | null
  recognition_level?: number | null
  clarity_level?: number | null
  balance_level?: number | null
  violence_level?: number | null
  harassment_level?: number | null

  // NR-1 Acidentes e Doenças
  had_accident?: boolean
  accident_description?: string
  had_near_miss?: boolean
  near_miss_description?: string
  had_work_disease?: boolean
  work_disease_description?: string
  report_harassment?: boolean
  harassment_report_description?: string

  // NR-1 Percepção Geral
  satisfaction_level?: number | null
  biggest_risk?: string
  suggestion?: string

  // NR-1 LGPD consent
  lgpd_consent?: boolean

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

export interface CompanyContext {
  company_id?: string
  department?: string
  departments?: string[]
  cycle_id?: string
  code_id?: string
  prefilled_email?: boolean
  bright_insights_enabled?: boolean
}

export interface StepComponentProps {
  data: AssessmentFormData
  setData: (data: AssessmentFormData) => void
  onPrev: (() => void) | null
  onNext: (() => void) | null
  companyContext?: CompanyContext
  setCompanyContext?: (ctx: CompanyContext) => void
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
