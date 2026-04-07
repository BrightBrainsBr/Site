// frontend/agents/pdf-extraction/models/pdf-extraction.state.ts

import { Annotation } from '@langchain/langgraph'

import type { ExtractionResult } from './pdf-extraction.interface'

export const PdfExtractionState = Annotation.Root({
  fileUrl: Annotation<string>,
  extractionType: Annotation<'nr1-fields' | 'events-bulk'>,
  rawText: Annotation<string>,
  extracted: Annotation<ExtractionResult | null>,
  confidence: Annotation<number>,
  warnings: Annotation<string[]>,
  status: Annotation<'pending' | 'completed' | 'error'>,
  errors: Annotation<string[]>,
})

export type PdfExtractionStateType = typeof PdfExtractionState.State
