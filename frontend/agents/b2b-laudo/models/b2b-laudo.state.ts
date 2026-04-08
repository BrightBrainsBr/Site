// frontend/agents/b2b-laudo/models/b2b-laudo.state.ts

import { Annotation } from '@langchain/langgraph'

import type {
  CompanyLaudoData,
  PreviousEvaluationSummary,
} from './b2b-laudo.interface'

export const B2BLaudoAnnotation = Annotation.Root({
  evaluationId: Annotation<string>,

  formData: Annotation<Record<string, unknown>>({
    reducer: (_, b) => b,
    default: () => ({}),
  }),

  scores: Annotation<Record<string, number>>({
    reducer: (_, b) => b,
    default: () => ({}),
  }),

  companyData: Annotation<CompanyLaudoData>({
    reducer: (_, b) => b,
    default: () => ({
      name: '',
      cnpj: '',
      cnae: '',
      risk_grade: '',
    }),
  }),

  historyData: Annotation<PreviousEvaluationSummary[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),

  laudoMarkdown: Annotation<string>({
    reducer: (_, b) => b,
    default: () => '',
  }),

  pdfBuffer: Annotation<Buffer | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),

  pdfUrl: Annotation<string>({
    reducer: (_, b) => b,
    default: () => '',
  }),

  status: Annotation<
    'init' | 'context_loaded' | 'text_generated' | 'pdf_built' | 'stored' | 'error'
  >({
    reducer: (_, b) => b,
    default: () => 'init',
  }),

  riskLevel: Annotation<string>({
    reducer: (_, b) => b,
    default: () => '',
  }),

  errors: Annotation<string[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
})

export type B2BLaudoState = typeof B2BLaudoAnnotation.State
