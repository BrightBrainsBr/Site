// frontend/components/assessment/steps/scaleStepConfigs.ts

import * as scales from '../constants/scales'

export interface ScaleStepConfig {
  scaleKey: string
  questions: unknown[]
  options: unknown[] | null
  icon: string
  title: string
  subtitle: string
  badge: string
  info: string
}

export const SCALE_STEP_CONFIGS: Record<string, ScaleStepConfig> = {
  phq9: {
    scaleKey: 'phq9',
    questions: scales.PHQ9_QUESTIONS,
    options: scales.FREQ_OPTIONS,
    icon: '😔',
    title: 'PHQ-9 — Depressão',
    subtitle:
      'Nas últimas 2 semanas, com que frequência você foi incomodado(a) por:',
    badge: 'Depressão',
    info: 'O PHQ-9 é uma escala validada para rastreamento de depressão. Responda com base nas últimas 2 semanas.',
  },
  gad7: {
    scaleKey: 'gad7',
    questions: scales.GAD7_QUESTIONS,
    options: scales.FREQ_OPTIONS,
    icon: '😰',
    title: 'GAD-7 — Ansiedade',
    subtitle:
      'Nas últimas 2 semanas, com que frequência você foi incomodado(a) por:',
    badge: 'Ansiedade',
    info: 'O GAD-7 avalia a gravidade de sintomas de ansiedade generalizada.',
  },
  isi: {
    scaleKey: 'isi',
    questions: scales.ISI_QUESTIONS,
    options: null,
    icon: '🌙',
    title: 'ISI — Índice de Insônia',
    subtitle:
      'Avalie a gravidade dos seus problemas de sono nas últimas 2 semanas:',
    badge: 'Insônia',
    info: 'O ISI avalia a percepção subjetiva da gravidade da insônia.',
  },
  asrs: {
    scaleKey: 'asrs',
    questions: scales.ASRS_QUESTIONS,
    options: scales.ASRS_OPTIONS,
    icon: '⚡',
    title: 'ASRS — TDAH Adulto',
    subtitle: 'Com que frequência nos últimos 6 meses:',
    badge: 'TDAH',
    info: 'O ASRS é um rastreamento inicial para TDAH em adultos.',
  },
  aq10: {
    scaleKey: 'aq10',
    questions: scales.AQ10_QUESTIONS,
    options: scales.AQ10_OPTIONS,
    icon: '🧩',
    title: 'AQ-10 — Espectro Autista',
    subtitle: 'Indique o quanto você concorda com cada afirmação:',
    badge: 'TEA',
    info: 'O AQ-10 é um rastreamento para traços do espectro autista. Itens com pontuação reversa são calculados automaticamente.',
  },
  ocir: {
    scaleKey: 'ocir',
    questions: scales.OCIR_QUESTIONS,
    options: scales.OCIR_OPTIONS,
    icon: '🔁',
    title: 'OCI-R — Obsessões e Compulsões',
    subtitle: 'O quanto as experiências abaixo o(a) incomodaram no último mês:',
    badge: 'TOC',
    info: 'O OCI-R avalia sintomas obsessivo-compulsivos.',
  },
  pcl5: {
    scaleKey: 'pcl5',
    questions: scales.PCL5_QUESTIONS,
    options: scales.PCL5_OPTIONS,
    icon: '🛡️',
    title: 'PCL-5 — Estresse Pós-Traumático',
    subtitle: 'No último mês, o quanto você foi incomodado(a) por:',
    badge: 'TEPT',
    info: 'O PCL-5 avalia sintomas de estresse pós-traumático (versão abreviada).',
  },
  mbi: {
    scaleKey: 'mbi',
    questions: scales.MBI_QUESTIONS,
    options: scales.MBI_OPTIONS,
    icon: '🔥',
    title: 'MBI — Inventário de Burnout',
    subtitle:
      'Avalie a frequência com que sente cada situação em relação ao trabalho:',
    badge: 'Burnout',
    info: 'O MBI avalia 3 dimensões: Exaustão Emocional (EE), Despersonalização (DP) e Realização Profissional (RP).',
  },
  pss10: {
    scaleKey: 'pss10',
    questions: scales.PSS10_QUESTIONS,
    options: scales.PSS10_OPTIONS,
    icon: '😤',
    title: 'PSS-10 — Estresse Percebido',
    subtitle: 'No último mês, com que frequência você:',
    badge: 'Estresse',
    info: 'O PSS-10 mede a percepção de estresse. Itens positivos têm pontuação reversa.',
  },
  spin: {
    scaleKey: 'spin',
    questions: scales.SPIN_QUESTIONS,
    options: scales.SPIN_OPTIONS,
    icon: '🫣',
    title: 'Mini-SPIN — Fobia Social',
    subtitle: 'O quanto as situações abaixo o(a) incomodam:',
    badge: 'Fobia Social',
    info: 'O Mini-SPIN é um rastreamento rápido para fobia social.',
  },
  auditc: {
    scaleKey: 'auditc',
    questions: scales.AUDITC_QUESTIONS,
    options: null,
    icon: '🍷',
    title: 'AUDIT-C — Uso de Álcool',
    subtitle: 'Sobre seu consumo de álcool:',
    badge: 'Álcool',
    info: 'O AUDIT-C é um rastreamento breve para uso problemático de álcool.',
  },
  ad8: {
    scaleKey: 'ad8',
    questions: scales.AD8_QUESTIONS,
    options: scales.AD8_OPTIONS,
    icon: '🧓',
    title: 'AD8 — Rastreamento de Demência',
    subtitle: 'Houve mudança nos últimos anos em relação a:',
    badge: 'Demência',
    info: 'O AD8 é um rastreamento para comprometimento cognitivo/demência.',
  },
  nms: {
    scaleKey: 'nms',
    questions: scales.NMS_QUESTIONS,
    options: scales.NMS_OPTIONS,
    icon: '🔬',
    title: 'NMS-Quest — Sintomas Não-Motores',
    subtitle: 'Você apresenta algum dos seguintes sintomas?',
    badge: 'Parkinson',
    info: 'O NMS-Quest avalia sintomas não-motores de Parkinson, agrupados por categoria.',
  },
  alsfrs: {
    scaleKey: 'alsfrs',
    questions: scales.ALSFRS_QUESTIONS,
    options: null,
    icon: '💪',
    title: 'ALSFRS-R — Escala Funcional',
    subtitle:
      'Avalie seu nível de função em cada atividade (4=normal, 0=incapaz):',
    badge: 'ELA',
    info: 'A ALSFRS-R avalia a capacidade funcional em pacientes com ELA. Pontuação mais alta = melhor função.',
  },
  snapiv: {
    scaleKey: 'snapiv',
    questions: scales.SNAPIV_QUESTIONS,
    options: scales.SNAPIV_OPTIONS,
    icon: '🧒',
    title: 'SNAP-IV — TDAH Infantil',
    subtitle:
      'Com que frequência a criança apresenta os seguintes comportamentos:',
    badge: 'TDAH Infantil',
    info: 'O SNAP-IV avalia sintomas de TDAH em crianças, com subescalas de Desatenção (DA) e Hiperatividade/Impulsividade (HI).',
  },
}
