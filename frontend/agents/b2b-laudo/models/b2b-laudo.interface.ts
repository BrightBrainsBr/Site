// frontend/agents/b2b-laudo/models/b2b-laudo.interface.ts

export interface CompanyLaudoData {
  name: string
  cnpj: string
  cnae: string
  risk_grade: string
  sst_responsible_name?: string
  sst_signature_url?: string
}

export interface PreviousEvaluationSummary {
  cycle_label: string
  created_at: string
  scores: Record<string, number>
  risk_level: string
}

export interface LaudoSections {
  section4_clinical: string
  section5_aep: string
  section6_risk: string
  section7_pdca: string
  section8_trends: string
}

export interface LaudoGenerationInput {
  evaluationId: string
}

export interface LaudoGenerationOutput {
  pdfUrl: string
  laudoMarkdown: string
}
