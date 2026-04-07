// frontend/features/assessment/components/constants/steps.ts

import type { StepDefinition } from '../assessment.interface'

export const B2B_STEPS: StepDefinition[] = [
  { id: 'welcome', label: 'Início', show: () => true },
  { id: 'dados', label: 'Dados Pessoais', show: () => true },
  { id: 'srq20', label: 'SRQ-20', show: () => true },
  { id: 'phq9', label: 'PHQ-9 — Depressão', show: () => true },
  { id: 'gad7', label: 'GAD-7 — Ansiedade', show: () => true },
  { id: 'pss10', label: 'PSS-10 — Estresse', show: () => true },
  { id: 'mbi', label: 'MBI — Burnout', show: () => true },
  { id: 'isi', label: 'ISI — Sono', show: () => true },
  { id: 'aep', label: 'AEP', show: () => true },
  { id: 'canal_percepcao', label: 'Canal de Percepção', show: () => true },
  { id: 'b2b_consents', label: 'Consentimentos', show: () => true },
  { id: 'resumo', label: 'Resumo & Envio', show: () => true },
]

export const ALL_STEPS: StepDefinition[] = [
  { id: 'welcome', label: 'Início', show: () => true },
  { id: 'dados', label: 'Dados Pessoais', show: () => true },
  { id: 'perfil', label: 'Perfil Clínico', show: () => true },
  { id: 'historia', label: 'Histórico', show: () => true },
  { id: 'sintomas', label: 'Sintomas', show: () => true },
  { id: 'phq9', label: 'PHQ-9', show: () => true },
  { id: 'gad7', label: 'GAD-7', show: () => true },
  { id: 'isi', label: 'ISI', show: () => true },
  {
    id: 'asrs',
    label: 'ASRS',
    show: (d) => ['adulto', 'executivo'].includes(d.publico),
  },
  { id: 'snapiv', label: 'SNAP-IV', show: (d) => d.publico === 'infantil' },
  {
    id: 'aq10',
    label: 'AQ-10',
    show: (d) => ['adulto', 'infantil'].includes(d.publico),
  },
  {
    id: 'ocir',
    label: 'OCI-R',
    show: (d) => ['adulto', 'infantil'].includes(d.publico),
  },
  {
    id: 'pcl5',
    label: 'PCL-5',
    show: (d) => ['adulto', 'executivo'].includes(d.publico),
  },
  { id: 'mdq', label: 'MDQ', show: (d) => d.publico === 'adulto' },
  {
    id: 'mbi',
    label: 'MBI',
    show: (d) => ['executivo', 'adulto'].includes(d.publico),
  },
  {
    id: 'pss10',
    label: 'PSS-10',
    show: (d) => ['executivo', 'adulto', 'longevidade'].includes(d.publico),
  },
  { id: 'spin', label: 'Mini-SPIN', show: (d) => d.publico === 'adulto' },
  {
    id: 'auditc',
    label: 'AUDIT-C',
    show: (d) => ['adulto', 'executivo'].includes(d.publico),
  },
  {
    id: 'ad8',
    label: 'AD8',
    show: (d) => ['neuro', 'longevidade'].includes(d.publico),
  },
  { id: 'nms', label: 'NMS-Quest', show: (d) => d.publico === 'neuro' },
  { id: 'alsfrs', label: 'ALSFRS-R', show: (d) => d.publico === 'neuro' },
  { id: 'medicamentos', label: 'Medicamentos', show: () => true },
  { id: 'suplementos', label: 'Suplementos', show: () => true },
  { id: 'estilo', label: 'Estilo de Vida', show: () => true },
  { id: 'familia', label: 'Histórico Familiar', show: () => true },
  { id: 'uploads', label: 'Documentos & Exames', show: () => true },
  { id: 'laudos', label: 'Laudos Anteriores', show: () => true },
  { id: 'wearables', label: 'Wearables & Monitoramento', show: () => true },
  { id: 'resumo', label: 'Resumo & Laudo', show: () => true },
]
