// frontend/agents/pdf-extraction/models/pdf-extraction.interface.ts

export interface NR1FieldsOutput {
  perigos: string[]
  agravos: string[]
  grupos_exposicao: string[]
  fontes_exposicao: string[]
  analise_preliminar: string
  classificacao_risco: string
  descricao_processos: string
  atividades: string
  medidas_preventivas: string
}

export interface EventsBulkOutput {
  events: Array<{
    event_date: string
    event_type: string
    cid_code?: string
    description: string
    department?: string
    days_lost?: number
    source?: string
  }>
}

export type ExtractionResult = NR1FieldsOutput | EventsBulkOutput
