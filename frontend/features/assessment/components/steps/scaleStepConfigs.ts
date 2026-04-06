// frontend/features/assessment/components/steps/scaleStepConfigs.ts

import * as scales from '../constants/scales'

export interface ScaleStepConfig {
  scaleKey: string
  questions: unknown[]
  options: unknown[] | null
  icon: string
  title: string
  subtitle: string
  badge?: string
  info?: string
}

export const SCALE_STEP_CONFIGS: Record<string, ScaleStepConfig> = {
  phq9: {
    scaleKey: 'phq9',
    questions: scales.PHQ9_QUESTIONS,
    options: scales.FREQ_OPTIONS,
    icon: '😔',
    title: 'PHQ-9 — Rastreio de Depressão',
    subtitle:
      'Nas últimas 2 semanas, com que frequência você foi incomodado(a) por:',
    badge: 'NR-1 · OMS',
    info: 'O PHQ-9 é um instrumento validado internacionalmente para rastreio de depressão, recomendado pelo Ministério da Saúde e exigido pelo PGR-NR1 para avaliação de riscos psicossociais.',
  },
  gad7: {
    scaleKey: 'gad7',
    questions: scales.GAD7_QUESTIONS,
    options: scales.FREQ_OPTIONS,
    icon: '😰',
    title: 'GAD-7 — Rastreio de Ansiedade',
    subtitle:
      'Nas últimas 2 semanas, com que frequência você foi incomodado(a) por:',
    badge: 'NR-1 · OMS',
    info: 'O GAD-7 é um instrumento validado para rastreio de transtorno de ansiedade generalizada, integrante do protocolo de saúde ocupacional NR-1.',
  },
  isi: {
    scaleKey: 'isi',
    questions: scales.ISI_QUESTIONS,
    options: null,
    icon: '🌙',
    title: 'ISI — Qualidade do Sono',
    subtitle:
      'Avalie a gravidade dos seus problemas de sono nas últimas 2 semanas:',
    badge: 'Saúde Ocupacional',
    info: 'Distúrbios do sono estão diretamente ligados a riscos psicossociais ocupacionais. O ISI (Índice de Gravidade de Insônia) é uma medida validada internacionalmente.',
  },
  asrs: {
    scaleKey: 'asrs',
    questions: scales.ASRS_QUESTIONS,
    options: scales.ASRS_OPTIONS,
    icon: '⚡',
    title: 'ASRS',
    subtitle: 'Com que frequência nos últimos 6 meses:',
  },
  aq10: {
    scaleKey: 'aq10',
    questions: scales.AQ10_QUESTIONS,
    options: scales.AQ10_OPTIONS,
    icon: '🧩',
    title: 'AQ-10',
    subtitle: 'Indique o quanto você concorda com cada afirmação:',
  },
  ocir: {
    scaleKey: 'ocir',
    questions: scales.OCIR_QUESTIONS,
    options: scales.OCIR_OPTIONS,
    icon: '🔁',
    title: 'OCI-R',
    subtitle: 'O quanto as experiências abaixo o(a) incomodaram no último mês:',
  },
  pcl5: {
    scaleKey: 'pcl5',
    questions: scales.PCL5_QUESTIONS,
    options: scales.PCL5_OPTIONS,
    icon: '🛡️',
    title: 'PCL-5',
    subtitle: 'No último mês, o quanto você foi incomodado(a) por:',
  },
  mbi: {
    scaleKey: 'mbi',
    questions: scales.MBI_QUESTIONS,
    options: scales.MBI_OPTIONS,
    icon: '🔥',
    title: 'MBI — Inventário de Burnout',
    subtitle:
      'Avalie a frequência com que sente cada situação em relação ao trabalho:',
    badge: 'NR-1 · Saúde Ocupacional',
    info: 'O MBI (Maslach Burnout Inventory) é o padrão-ouro internacional para avaliação de burnout ocupacional, diretamente referenciado nas diretrizes do PGR-NR1 para riscos psicossociais.',
  },
  pss10: {
    scaleKey: 'pss10',
    questions: scales.PSS10_QUESTIONS,
    options: scales.PSS10_OPTIONS,
    icon: '😤',
    title: 'PSS-10 — Estresse Percebido',
    subtitle: 'No último mês, com que frequência você:',
    badge: 'NR-1 · Saúde Ocupacional',
    info: 'A Escala de Estresse Percebido (PSS-10) mede o grau em que situações de vida são percebidas como estressantes, sendo um indicador chave de risco psicossocial ocupacional.',
  },
  spin: {
    scaleKey: 'spin',
    questions: scales.SPIN_QUESTIONS,
    options: scales.SPIN_OPTIONS,
    icon: '🫣',
    title: 'Mini-SPIN',
    subtitle: 'O quanto as situações abaixo o(a) incomodam:',
  },
  auditc: {
    scaleKey: 'auditc',
    questions: scales.AUDITC_QUESTIONS,
    options: null,
    icon: '🍷',
    title: 'AUDIT-C',
    subtitle: 'Sobre seu consumo de álcool:',
  },
  ad8: {
    scaleKey: 'ad8',
    questions: scales.AD8_QUESTIONS,
    options: scales.AD8_OPTIONS,
    icon: '🧓',
    title: 'AD8',
    subtitle: 'Houve mudança nos últimos anos em relação a:',
  },
  nms: {
    scaleKey: 'nms',
    questions: scales.NMS_QUESTIONS,
    options: scales.NMS_OPTIONS,
    icon: '🔬',
    title: 'NMS-Quest',
    subtitle: 'Você apresenta algum dos seguintes sintomas?',
  },
  alsfrs: {
    scaleKey: 'alsfrs',
    questions: scales.ALSFRS_QUESTIONS,
    options: null,
    icon: '💪',
    title: 'ALSFRS-R',
    subtitle:
      'Avalie seu nível de função em cada atividade (4=normal, 0=incapaz):',
  },
  snapiv: {
    scaleKey: 'snapiv',
    questions: scales.SNAPIV_QUESTIONS,
    options: scales.SNAPIV_OPTIONS,
    icon: '🧒',
    title: 'SNAP-IV',
    subtitle:
      'Com que frequência a criança apresenta os seguintes comportamentos:',
  },
}
