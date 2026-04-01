// frontend/agents/pdf-extraction/services/pdf-extraction.nodes.ts

// pdf-parse ships as CommonJS with module.exports; use require() to avoid
// TS1192 "has no default export" when targeting ESM.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
import { z } from 'zod'

import { AgentError } from '~/agents/shared/errors'
import {
  getAnthropicConfigForTask,
  llmService,
} from '~/shared/utils/llm/services/llmService'

import type {
  EventsBulkOutput,
  NR1FieldsOutput,
} from '../models/pdf-extraction.interface'
import type { PdfExtractionStateType } from '../models/pdf-extraction.state'
import {
  EVENTS_BULK_EXTRACTION_SYSTEM,
  NR1_FIELDS_EXTRACTION_SYSTEM,
} from '../prompts/pdf-extraction.prompts'
import { downloadPdf } from './pdf-extraction.storage'

const nr1FieldsSchema = z.object({
  perigos: z.array(z.string()),
  agravos: z.array(z.string()),
  grupos_exposicao: z.array(z.string()),
  fontes_exposicao: z.array(z.string()),
  analise_preliminar: z.string(),
  classificacao_risco: z.string(),
  descricao_processos: z.string(),
  atividades: z.string(),
  medidas_preventivas: z.string(),
})

const eventsBulkSchema = z.object({
  events: z.array(
    z.object({
      event_date: z.string(),
      event_type: z.string(),
      cid_code: z.string().optional(),
      description: z.string(),
      department: z.string().optional(),
      days_lost: z.number().optional(),
      source: z.string().optional(),
    })
  ),
})

export async function parsePdf(
  state: PdfExtractionStateType
): Promise<Partial<PdfExtractionStateType>> {
  try {
    const buffer = await downloadPdf(state.fileUrl)
    const parsed = await pdf(buffer)

    if (!parsed.text || parsed.text.trim().length < 50) {
      return {
        rawText: parsed.text ?? '',
        warnings: [
          ...state.warnings,
          'PDF text is very short — may be scanned/image-based',
        ],
      }
    }

    return { rawText: parsed.text }
  } catch (err) {
    throw new AgentError(
      `Failed to parse PDF: ${err instanceof Error ? err.message : String(err)}`,
      'parsePdf',
      err
    )
  }
}

export async function extractData(
  state: PdfExtractionStateType
): Promise<Partial<PdfExtractionStateType>> {
  if (!state.rawText || state.rawText.trim().length === 0) {
    return {
      status: 'error',
      errors: [...state.errors, 'No text extracted from PDF'],
    }
  }

  const systemPrompt =
    state.extractionType === 'nr1-fields'
      ? NR1_FIELDS_EXTRACTION_SYSTEM
      : EVENTS_BULK_EXTRACTION_SYSTEM

  const schema =
    state.extractionType === 'nr1-fields' ? nr1FieldsSchema : eventsBulkSchema

  const config = getAnthropicConfigForTask('general_response', {
    max_tokens: 4096,
  })

  try {
    const { result } = await llmService.invokeStructuredOutput({
      promptMessages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'human',
          content: `Analise o seguinte texto extraído de um PDF:\n\n${state.rawText.slice(0, 30000)}`,
        },
      ],
      outputSchema: schema,
      primaryConfigDict: config,
      fixerConfigDict: getAnthropicConfigForTask('general_response'),
      stepName: `pdf_extraction_${state.extractionType}`,
    })

    return { extracted: result as NR1FieldsOutput | EventsBulkOutput }
  } catch (err) {
    throw new AgentError(
      `LLM extraction failed: ${err instanceof Error ? err.message : String(err)}`,
      'extractData',
      err
    )
  }
}

export async function validateOutput(
  state: PdfExtractionStateType
): Promise<Partial<PdfExtractionStateType>> {
  if (!state.extracted) {
    return {
      status: 'error',
      errors: [...state.errors, 'No extraction result to validate'],
      confidence: 0,
    }
  }

  const warnings: string[] = [...state.warnings]
  let confidence = 1.0

  if (state.extractionType === 'nr1-fields') {
    const nr1 = state.extracted as NR1FieldsOutput
    const fields = [
      nr1.perigos,
      nr1.agravos,
      nr1.grupos_exposicao,
      nr1.fontes_exposicao,
    ]
    const emptyArrays = fields.filter((f) => f.length === 0).length

    if (emptyArrays > 0) {
      confidence -= emptyArrays * 0.1
      warnings.push(`${emptyArrays} array field(s) returned empty`)
    }

    const textFields = [
      nr1.analise_preliminar,
      nr1.classificacao_risco,
      nr1.descricao_processos,
      nr1.atividades,
      nr1.medidas_preventivas,
    ]
    const emptyTexts = textFields.filter((f) => !f || f.trim() === '').length
    if (emptyTexts > 0) {
      confidence -= emptyTexts * 0.08
      warnings.push(`${emptyTexts} text field(s) returned empty`)
    }
  } else {
    const bulk = state.extracted as EventsBulkOutput
    if (bulk.events.length === 0) {
      confidence -= 0.3
      warnings.push('No events extracted from document')
    }

    const invalidDates = bulk.events.filter(
      (e) => !/^\d{4}-\d{2}-\d{2}$/.test(e.event_date)
    )
    if (invalidDates.length > 0) {
      confidence -= invalidDates.length * 0.05
      warnings.push(`${invalidDates.length} event(s) have invalid date format`)
    }
  }

  if (state.rawText.length < 200) {
    confidence -= 0.2
    warnings.push('Source text was very short')
  }

  confidence = Math.max(0, Math.min(1, confidence))

  return {
    confidence: Math.round(confidence * 100) / 100,
    warnings,
    status: 'completed',
  }
}
