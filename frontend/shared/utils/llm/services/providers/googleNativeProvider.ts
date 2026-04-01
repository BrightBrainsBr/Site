// frontend/features/llm/services/providers/googleNativeProvider.ts

import { sanitizeSchemaForGemini } from '../../helpers/sanitizeSchemaForGemini'
import type { LLMConfig, LLMMessage } from '../../llm.interface'
import { LLMProvider } from '../../llm.interface'

const log = {
  info: (...args: unknown[]) => console.warn('[LLM:google]', ...args),
  debug: (...args: unknown[]) => console.warn('[LLM:google:debug]', ...args),
  warn: (...args: unknown[]) => console.warn('[LLM:google:warn]', ...args),
}

function resolvePlatform(provider: LLMProvider): string {
  const envVar = provider === LLMProvider.GOOGLE ? 'GOOGLE_PLATFORM' : ''
  return envVar ? (process.env[envVar] ?? 'direct') : 'direct'
}

type GeminiMsg = { role: string; parts: Array<{ text: string }> }
type GeminiPart = { text: string }

function extractTextContent(msg: LLMMessage): string {
  if (typeof msg.content === 'string') return msg.content
  return msg.content
    .filter((p) => p.type === 'text')
    .map((p) => p.text ?? '')
    .join('\n')
}

function convertToGeminiFormat(messages: LLMMessage[]): {
  googleMessages: GeminiMsg[]
  systemParts: GeminiPart[]
} {
  const googleMessages: GeminiMsg[] = []
  const systemParts: GeminiPart[] = []

  for (const msg of messages) {
    const text = extractTextContent(msg)
    if (!text.trim()) continue

    if (msg.role === 'system') {
      systemParts.push({ text })
      continue
    }

    const role =
      msg.role === 'ai' || msg.role === 'assistant' ? 'model' : 'user'
    googleMessages.push({ role, parts: [{ text }] })
  }

  return { googleMessages, systemParts }
}

/**
 * Invoke Google Gemini using the native @google/genai SDK.
 * Provides JSON-mode structured output with schema enforcement.
 */
export async function invokeGoogleNativeStructured(
  config: LLMConfig,
  messages: LLMMessage[],
  outputSchemaJson: Record<string, unknown>
): Promise<string> {
  const stepName = `Google Native (${config.modelName})`
  log.info(`Invoking ${stepName}`)

  const platform = config.platform ?? resolvePlatform(LLMProvider.GOOGLE)

  if (platform !== 'vertex' && !config.apiKey) {
    throw new Error('Google API Key is missing for native SDK call.')
  }

  const { GoogleGenAI } = await import('@google/genai')
  const clientOpts: Record<string, unknown> =
    platform === 'vertex'
      ? {
          vertexai: true,
          project: process.env.GCP_PROJECT_ID,
          location: process.env.GCP_LOCATION ?? 'us-central1',
        }
      : { apiKey: config.apiKey }

  const client = new GoogleGenAI(clientOpts)
  const { googleMessages, systemParts } = convertToGeminiFormat(messages)

  const genConfig: Record<string, unknown> = {
    responseMimeType: 'application/json',
    responseSchema: sanitizeSchemaForGemini(outputSchemaJson),
  }
  if (config.temperature != null) genConfig.temperature = config.temperature
  if (config.maxTokens != null) genConfig.maxOutputTokens = config.maxTokens
  if (config.topP != null) genConfig.topP = config.topP
  if (systemParts.length > 0) {
    genConfig.systemInstruction = { parts: systemParts, role: 'system' }
  }

  const response = await client.models.generateContent({
    model: config.modelName,
    contents: googleMessages,
    config: genConfig,
  })

  const text = response.text
  if (!text?.trim()) {
    const reason = response.candidates?.[0]?.finishReason ?? 'UNKNOWN'
    throw new Error(`Gemini returned no text. Finish reason: ${reason}`)
  }

  log.info(`[${stepName}] Success. ${text.length} chars`)
  return text
}
