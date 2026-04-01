// frontend/features/llm/helpers/validateAndFixJson.ts

import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import type { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

const logger = {
  info: (...args: unknown[]) => console.warn('[LLM:validate]', ...args),
  debug: (...args: unknown[]) => console.warn('[LLM:validate]', ...args),
  warn: (...args: unknown[]) => console.warn('[LLM:validate]', ...args),
  error: (...args: unknown[]) => console.error('[LLM:validate]', ...args),
}

/**
 * Extract JSON from a raw LLM response string.
 * Handles markdown code blocks, leading/trailing text, etc.
 */
export function extractJsonString(raw: string): string {
  let cleaned = raw.trim()

  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3)
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3)
  }

  cleaned = cleaned.trim()

  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    const braceIdx = cleaned.indexOf('{')
    const bracketIdx = cleaned.indexOf('[')
    let startIdx = -1

    if (braceIdx !== -1 && bracketIdx !== -1) {
      startIdx = Math.min(braceIdx, bracketIdx)
    } else if (braceIdx !== -1) {
      startIdx = braceIdx
    } else if (bracketIdx !== -1) {
      startIdx = bracketIdx
    }

    if (startIdx !== -1) {
      const openChar = cleaned[startIdx]
      const closeChar = openChar === '{' ? '}' : ']'
      const endIdx = cleaned.lastIndexOf(closeChar)

      if (endIdx > startIdx) {
        cleaned = cleaned.slice(startIdx, endIdx + 1)
      }
    }
  }

  return cleaned
}

/**
 * Attempt to parse and validate JSON against a Zod schema.
 * Returns the parsed result or null with an error message.
 */
export function tryParseAndValidate<T extends z.ZodTypeAny>(
  raw: string,
  schema: T
): { result: z.infer<T> | null; error: string | null } {
  try {
    const jsonStr = extractJsonString(raw)
    const parsed = JSON.parse(jsonStr)
    const validated = schema.parse(parsed)
    return { result: validated, error: null }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { result: null, error: errorMsg }
  }
}

/**
 * Validate and optionally fix JSON output from an LLM.
 *
 * 1. Fast path: try to parse + validate directly
 * 2. If that fails and a fixer LLM is provided, ask it to fix the JSON
 * 3. Re-validate the fixed output
 *
 * Returns [validatedResult, errorString | null]
 */
export async function validateAndFixJson<T extends z.ZodTypeAny>(params: {
  llmOutput: string
  schema: T
  fixerLlm?: BaseChatModel | null
  maxRetries?: number
}): Promise<{ result: z.infer<T> | null; error: string | null }> {
  const { llmOutput, schema, fixerLlm, maxRetries = 1 } = params

  // Fast path
  const fastResult = tryParseAndValidate(llmOutput, schema)
  if (fastResult.result !== null) {
    logger.debug('Validation successful (fast path)')
    return fastResult
  }

  logger.debug(`Fast-path failed: ${fastResult.error}`)

  if (!fixerLlm) {
    return {
      result: null,
      error: `Validation failed and no fixer LLM provided. Error: ${fastResult.error}`,
    }
  }

  // Fixer pipeline
  let lastError = fastResult.error
  let currentOutput = llmOutput

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    logger.info(`Fixer attempt ${attempt + 1}/${maxRetries}`)

    try {
      const schemaDescription = JSON.stringify(
        getSchemaDescription(schema),
        null,
        2
      )

      const fixerMessages = [
        new SystemMessage(
          `You are a JSON repair assistant. Your ONLY job is to fix malformed JSON so it validates against the provided schema.

Rules:
1. Output ONLY valid JSON - no explanations, no markdown, no code blocks
2. Fix syntax errors (missing commas, brackets, quotes)
3. Ensure all required fields are present
4. Ensure field types match the schema
5. If data is missing, infer reasonable defaults from context
6. Do NOT add extra fields not in the schema`
        ),
        new HumanMessage(
          `The following JSON output failed validation.

SCHEMA:
${schemaDescription}

VALIDATION ERROR:
${lastError}

MALFORMED OUTPUT:
${currentOutput}

Return ONLY the corrected JSON:`
        ),
      ]

      const fixerResponse = await fixerLlm.invoke(fixerMessages)
      const fixedContent =
        typeof fixerResponse.content === 'string'
          ? fixerResponse.content
          : JSON.stringify(fixerResponse.content)

      logger.debug(`Fixer response (${fixedContent.length} chars)`)

      const fixedResult = tryParseAndValidate(fixedContent, schema)
      if (fixedResult.result !== null) {
        logger.info(`Fixer succeeded on attempt ${attempt + 1}`)
        return fixedResult
      }

      lastError = fixedResult.error
      currentOutput = fixedContent
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      logger.error(`Fixer attempt ${attempt + 1} threw: ${errMsg}`)
      lastError = errMsg
    }
  }

  return {
    result: null,
    error: `Validation failed after ${maxRetries} fix attempt(s). Last error: ${lastError}`,
  }
}

/**
 * Convert a Zod schema to a JSON Schema description for the fixer LLM.
 */
function getSchemaDescription(schema: z.ZodTypeAny): unknown {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return zodToJsonSchema(schema as any)
  } catch {
    return { type: 'unknown' }
  }
}
