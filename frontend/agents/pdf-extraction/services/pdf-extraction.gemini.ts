// frontend/agents/pdf-extraction/services/pdf-extraction.gemini.ts

import { traceable } from 'langsmith/traceable'

import { sanitizeSchemaForGemini } from '~/shared/utils/llm/helpers/sanitizeSchemaForGemini'

import type { EventsBulkOutput } from '../models/pdf-extraction.interface'
import {
  EVENTS_BULK_EXTRACTION_SYSTEM,
} from '../prompts/pdf-extraction.prompts'

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
] as const

const TAG = '[gemini-pdf]'

const RETRIES_PER_MODEL = 2
const RETRY_DELAY_MS = 5_000

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

function isRetryableError(msg: string): boolean {
  return /503|429|UNAVAILABLE|overloaded|high demand|rate.limit|RESOURCE_EXHAUSTED/i.test(msg)
}

/**
 * Sends the raw PDF bytes to Gemini as inline data — no text extraction
 * step required. Gemini reads the PDF natively (including graphics,
 * tables, and scanned pages).
 *
 * Tries models in order with retries: gemini-2.5-flash -> gemini-2.5-flash-lite -> gemini-2.5-pro.
 * Falls back to the next model when current one is unavailable (503/429).
 */
export const extractEventsFromPdfWithGemini = traceable(
  async function extractEventsFromPdfWithGemini(
    pdfBuffer: Buffer,
    fileName: string
  ): Promise<GeminiExtractionResult> {
    const t0 = Date.now()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error(`${TAG} GEMINI_API_KEY is NOT SET — cannot call Gemini`)
      throw new Error('GEMINI_API_KEY is not set')
    }

    console.log(`${TAG} INIT file="${fileName}" bufferSize=${pdfBuffer.length} models=[${GEMINI_MODELS.join(', ')}]`)

    const { GoogleGenAI } = await import('@google/genai')
    const client = new GoogleGenAI({ apiKey })

    const base64Pdf = pdfBuffer.toString('base64')
    const schema = sanitizeSchemaForGemini(eventsBulkJsonSchema)

    const makeRequest = (model: string) => client.models.generateContent({
      model,
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let response: any = null
    let usedModel: string = GEMINI_MODELS[0]
    let lastError: unknown = null

    for (const model of GEMINI_MODELS) {
      let succeeded = false

      for (let attempt = 0; attempt <= RETRIES_PER_MODEL; attempt++) {
        const tApi = Date.now()
        console.log(`${TAG} CALLING model=${model} file="${fileName}" attempt=${attempt + 1}/${RETRIES_PER_MODEL + 1}`)

        try {
          response = await makeRequest(model)
          usedModel = model
          console.log(`${TAG} OK model=${model} attempt=${attempt + 1} apiTime=${Date.now() - tApi}ms`)
          succeeded = true
          break
        } catch (apiErr) {
          lastError = apiErr
          const apiMsg = apiErr instanceof Error ? apiErr.message : String(apiErr)
          const retryable = isRetryableError(apiMsg)

          console.error(`${TAG} ERROR model=${model} attempt=${attempt + 1} retryable=${retryable} error="${apiMsg}" apiTime=${Date.now() - tApi}ms`)

          if (retryable && attempt < RETRIES_PER_MODEL) {
            console.log(`${TAG} RETRY same model in ${RETRY_DELAY_MS}ms`)
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
            continue
          }

          break
        }
      }

      if (succeeded) break

      const nextIdx = GEMINI_MODELS.indexOf(model) + 1
      if (nextIdx < GEMINI_MODELS.length) {
        console.log(`${TAG} FALLBACK from ${model} -> ${GEMINI_MODELS[nextIdx]} file="${fileName}"`)
      }
    }

    if (!response) {
      const msg = lastError instanceof Error ? lastError.message : String(lastError)
      const stack = lastError instanceof Error ? lastError.stack : undefined
      if (stack) console.error(`${TAG} FINAL STACK`, stack)
      throw new Error(`All Gemini models failed [${GEMINI_MODELS.join(', ')}]: ${msg}`)
    }

    const finishReason = response.candidates?.[0]?.finishReason ?? 'UNKNOWN'
    const usageMetadata = response.usageMetadata
    console.log(`${TAG} RESPONSE model=${usedModel} file="${fileName}" finishReason=${finishReason} totalTime=${Date.now() - t0}ms promptTokens=${usageMetadata?.promptTokenCount ?? '?'} outputTokens=${usageMetadata?.candidatesTokenCount ?? '?'}`)

    const text = response.text
    if (!text?.trim()) {
      console.error(`${TAG} EMPTY RESPONSE model=${usedModel} file="${fileName}" finishReason=${finishReason} candidates=${JSON.stringify(response.candidates?.map((c: { finishReason?: string; safetyRatings?: unknown }) => ({ finishReason: c.finishReason, safetyRatings: c.safetyRatings })))}`)
      throw new Error(`Gemini (${usedModel}) returned no text. Finish reason: ${finishReason}`)
    }

    console.log(`${TAG} PARSING JSON file="${fileName}" textLength=${text.length}`)

    let parsed: EventsBulkOutput
    try {
      parsed = JSON.parse(text)
    } catch {
      console.error(`${TAG} JSON PARSE FAILED file="${fileName}" text="${text.slice(0, 500)}"`)
      throw new Error(`Failed to parse Gemini response as JSON: ${text.slice(0, 200)}`)
    }

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

    console.log(`${TAG} DONE model=${usedModel} file="${fileName}" events=${parsed.events?.length ?? 0} confidence=${confidence} totalTime=${Date.now() - t0}ms`)

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
    metadata: { models: GEMINI_MODELS },
  }
)
