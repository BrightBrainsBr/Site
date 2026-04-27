// frontend/features/assessment/components/initial-form-data.ts

import type { AssessmentFormData } from './assessment.interface'

export const INITIAL_FORM_DATA: AssessmentFormData = {
  nome: '',
  nascimento: '',
  cpf: '',
  telefone: '',
  email: '',
  sexo: '',
  profissao: '',
  escolaridade: '',
  peso: '',
  altura: '',

  publico: '',
  queixaPrincipal: '',
  tempoSintomas: '',
  eventoDesencadeador: '',

  diagAnterior: '',
  diagAnterioresDetalhe: '',
  psicoterapia: '',
  internacao: '',
  condicoesCronicas: [],
  examesNeuro: '',
  examesNeuroDetalhe: '',

  triagemProfissional: '',
  triagemData: '',
  triagemFormato: '',
  transcricaoTriagem: '',
  triagemResumo: '',
  triagemObservacoes: '',

  sintomasAtuais: [],
  outrosSintomas: '',

  phq9: Array(9).fill(null) as null[],
  gad7: Array(7).fill(null) as null[],
  isi: Array(7).fill(null) as null[],
  asrs: Array(6).fill(null) as null[],
  aq10: Array(10).fill(null) as null[],
  ocir: Array(18).fill(null) as null[],
  mbi: Array(16).fill(null) as null[],
  pcl5: Array(8).fill(null) as null[],
  mdq: Array(13).fill(null) as null[],
  pss10: Array(10).fill(null) as null[],
  ad8: Array(8).fill(null) as null[],
  nms: Array(15).fill(null) as null[],
  alsfrs: Array(12).fill(null) as null[],
  snapiv: Array(18).fill(null) as null[],
  spin: Array(3).fill(null) as null[],
  auditc: Array(3).fill(null) as null[],

  mdqSimultaneo: '',
  mdqImpacto: '',

  usaMedicamento: '',
  medPassado: '',
  medPassadoDetalhe: '',
  efeitosAdversos: '',
  alergias: '',
  medicamentos: [],

  suplementos: [],
  supObs: '',

  uploads: {},

  possuiLaudos: '',
  laudosAnteriores: [],

  usaWearable: '',
  wDispositivo: '',
  wFCRepouso: '',
  wHRV: '',
  wSonoDuracao: '',
  wPassos: '',
  wEstresse: '',
  wearableObs: '',

  estadoCivil: '',
  satisfacaoRelacionamento: '',
  situacaoProfissional: '',
  cargaHoraria: '',
  horaDormir: '',
  horaAcordar: '',
  qualidadeSono: '',
  atividadeFisica: '',
  cafeina: '',
  tabaco: '',
  cannabis: '',
  neuromod: '',
  neuromodDetalhes: '',
  estresse: '',
  redeApoio: '',
  fontesEstresse: [],
  estiloVidaObs: '',

  familiaCondicoes: [],
  familiaDetalhes: '',
  infoAdicional: '',

  // B2B legacy fields
  srq20_answers: [],
  aep_answers: [],
  aep_percepcao_livre: '',
  canal_percepcao: null,
  b2b_anonymized_consent: false,
  b2c_consent: false,
  b2c_contact_consent: false,

  // NR-1 Perfil
  department: '',
  nr1_role: '',
  nr1_work_time: '',

  // NR-1 Riscos Físicos
  noise_level: null,
  temperature_level: null,
  lighting_level: null,
  vibration_level: null,
  humidity_level: null,

  // NR-1 Riscos Químicos
  chemical_exposures: [],
  chemical_details: '',

  // NR-1 Riscos Biológicos
  biological_exposures: [],
  biological_details: '',

  // NR-1 Riscos Ergonômicos
  posture_level: null,
  repetition_level: null,
  manual_force_level: null,
  breaks_level: null,
  screen_level: null,
  mobility_level: null,
  cognitive_effort_level: null,

  // NR-1 Fatores Psicossociais
  workload_level: null,
  pace_level: null,
  autonomy_level: null,
  leadership_level: null,
  relationships_level: null,
  recognition_level: null,
  clarity_level: null,
  balance_level: null,
  violence_level: null,
  harassment_level: null,

  // NR-1 Acidentes e Doenças
  had_accident: false,
  accident_description: '',
  had_near_miss: false,
  near_miss_description: '',
  had_work_disease: false,
  work_disease_description: '',
  report_harassment: false,
  harassment_report_description: '',

  // NR-1 Percepção Geral
  satisfaction_level: null,
  biggest_risk: '',
  suggestion: '',

  // NR-1 LGPD consent
  lgpd_consent: false,
}
