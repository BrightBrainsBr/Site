// frontend/agents/pdf-extraction/services/pdf-extraction.gemini.ts

import { traceable } from 'langsmith/traceable'

import { sanitizeSchemaForGemini } from '~/shared/utils/llm/helpers/sanitizeSchemaForGemini'

import type { EventsBulkOutput } from '../models/pdf-extraction.interface'
import {
  EVENTS_BULK_EXTRACTION_SYSTEM,
} from '../prompts/pdf-extraction.prompts'

const GEMINI_MODEL = 'gemini-2.0-flash'

const eventsBulkJsonSchema = {
  type: 'object',
  properties: {
    events: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          event_date: { type: 'string', description: 'YYYY-MM-DD' },
          event_type: { type: 'string' },
          cid_code: { type: 'string' },
          description: { type: 'string' },
          department: { type: 'string' },
          days_lost: { type: 'number' },
          source: { type: 'string' },
        },
        required: ['event_date', 'event_type', 'description'],
      },
    },
  },
  required: ['events'],
}

export interface GeminiExtractionResult {
  extracted: EventsBulkOutput
  confidence: number
  warnings: string[]
}

/**
 * Sends the raw PDF bytes to Gemini 2.0 Flash as inline data — no text
 * extraction step required. Gemini reads the PDF natively (including
 * graphics, tables, and scanned pages).
 */
export const extractEventsFromPdfWithGemini = traceable(
  async function extractEventsFromPdfWithGemini(
    pdfBuffer: Buffer,
    fileName: string
  ): Promise<GeminiExtractionResult> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

    const { GoogleGenAI } = await import('@google/genai')
    const client = new GoogleGenAI({ apiKey })

    const base64Pdf = pdfBuffer.toString('base64')
    const schema = sanitizeSchemaForGemini(eventsBulkJsonSchema)

    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'application/pdf', data: base64Pdf } },
            {
              text: `Analise este documento PDF ("${fileName}") e extraia todos os eventos de saúde/segurança ocupacional encontrados. Siga rigorosamente o schema JSON fornecido.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: {
          parts: [{ text: EVENTS_BULK_EXTRACTION_SYSTEM }],
          role: 'system',
        },
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    })

    const text = response.text
    if (!text?.trim()) {
      const reason = response.candidates?.[0]?.finishReason ?? 'UNKNOWN'
      throw new Error(`Gemini returned no text. Finish reason: ${reason}`)
    }

    const parsed: EventsBulkOutput = JSON.parse(text)

    const warnings: string[] = []
    let confidence = 1.0

    if (!parsed.events || parsed.events.length === 0) {
      confidence -= 0.3
      warnings.push('Nenhum evento extraído do documento')
    } else {
      const invalidDates = parsed.events.filter(
        (e) => !/^\d{4}-\d{2}-\d{2}$/.test(e.event_date)
      )
      if (invalidDates.length > 0) {
        confidence -= invalidDates.length * 0.05
        warnings.push(
          `${invalidDates.length} evento(s) com formato de data inválido`
        )
      }
    }

    confidence = Math.max(0, Math.min(1, confidence))

    return {
      extracted: parsed,
      confidence: Math.round(confidence * 100) / 100,
      warnings,
    }
  },
  {
    name: 'extract_events_from_pdf_gemini',
    run_type: 'llm' as const,
    tags: ['gemini', 'pdf-extraction', 'google'],
    metadata: { model: GEMINI_MODEL },
  }
)
