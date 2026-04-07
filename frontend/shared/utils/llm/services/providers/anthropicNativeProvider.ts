// frontend/features/llm/services/providers/anthropicNativeProvider.ts

import type Anthropic from '@anthropic-ai/sdk'
import type { MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/messages'
import { traceable } from 'langsmith/traceable'

import type { LLMConfig, LLMMessage } from '../../llm.interface'
import {
  BEDROCK_MODEL_MAP,
  LLMProvider,
  PLATFORM_ENV_VARS,
} from '../../llm.interface'

const log = {
  info: (...args: unknown[]) => console.warn('[LLM:anthropic]', ...args),
  warn: (...args: unknown[]) => console.warn('[LLM:anthropic:warn]', ...args),
}

function resolvePlatform(): string {
  const envVar = PLATFORM_ENV_VARS[LLMProvider.ANTHROPIC]
  return envVar ? (process.env[envVar] ?? 'direct') : 'direct'
}

function getBedrockModelId(name: string): string {
  return BEDROCK_MODEL_MAP[name] ?? `us.anthropic.${name}-v1:0`
}

// -------------------------------------------------------
// Message conversion
// -------------------------------------------------------

function extractText(msg: LLMMessage): string {
  if (typeof msg.content === 'string') return msg.content
  return msg.content
    .filter((p) => p.type === 'text')
    .map((p) => p.text ?? '')
    .join('\n')
}

function buildContentBlocks(msg: LLMMessage): Array<Record<string, unknown>> {
  const blocks: Array<Record<string, unknown>> = []

  if (typeof msg.content === 'string') {
    if (msg.content.trim()) blocks.push({ type: 'text', text: msg.content })
    return blocks
  }

  for (const part of msg.content) {
    if (part.type === 'text' && part.text?.trim()) {
      blocks.push({ type: 'text', text: part.text })
    } else if (
      part.type === 'image_url' &&
      part.image_url?.url?.startsWith('data:')
    ) {
      const [header, b64Data] = part.image_url.url.split(',', 2)
      const mime = header.split(':')[1].split(';')[0]
      blocks.push({
        type: 'image',
        source: { type: 'base64', media_type: mime, data: b64Data },
      })
    }
  }

  return blocks
}

interface BuildResult {
  systemParts: Array<Record<string, unknown>>
  messagesList: Array<Record<string, unknown>>
}

function buildAnthropicMessages(
  messages: LLMMessage[],
  enableCache: boolean,
  cacheTtl: '5m' | '1h'
): BuildResult {
  const systemParts: Array<Record<string, unknown>> = []
  const messagesList: Array<Record<string, unknown>> = []

  for (const msg of messages) {
    if (msg.role === 'system') {
      const text = extractText(msg)
      if (!text.trim()) continue
      const part: Record<string, unknown> = { type: 'text', text }
      if (enableCache && text.length > 2000) {
        part.cache_control =
          cacheTtl === '1h'
            ? { type: 'ephemeral', ttl: '1h' }
            : { type: 'ephemeral' }
      }
      systemParts.push(part)
      continue
    }

    const role =
      msg.role === 'ai' || msg.role === 'assistant' ? 'assistant' : 'user'
    const blocks = buildContentBlocks(msg)
    if (blocks.length > 0) messagesList.push({ role, content: blocks })
  }

  return { systemParts, messagesList }
}

// -------------------------------------------------------
// Request building helpers
// -------------------------------------------------------

function buildRequestArgs(
  model: string,
  msgs: BuildResult,
  maxTokens: number,
  config: LLMConfig,
  enableThinking: boolean,
  thinkingBudget: number
): MessageCreateParamsNonStreaming {
  const args: MessageCreateParamsNonStreaming = {
    model,
    messages:
      msgs.messagesList as unknown as MessageCreateParamsNonStreaming['messages'],
    max_tokens: maxTokens,
  }

  if (msgs.systemParts.length > 0) {
    args.system =
      msgs.systemParts as unknown as MessageCreateParamsNonStreaming['system']
  }
  if (config.temperature != null && !enableThinking) {
    args.temperature = config.temperature
  }
  if (config.topP != null && !enableThinking) {
    args.top_p = config.topP
  }
  if (enableThinking) {
    ;(args as unknown as Record<string, unknown>).thinking = {
      type: 'enabled',
      budget_tokens: thinkingBudget,
    }
  }

  return args
}

function buildHeaders(cacheTtl: string): Record<string, string> | undefined {
  const h: string[] = []
  if (cacheTtl === '1h') h.push('extended-cache-ttl-2025-04-11')
  h.push('token-efficient-tools-2025-02-19')
  if (h.length === 0) return undefined
  return { 'anthropic-beta': h.join(',') }
}

function extractAnthropicText(
  response: Anthropic.Message,
  label: string
): string {
  const textParts: string[] = []
  for (const block of response.content) {
    if (block.type === 'text' && 'text' in block && block.text) {
      textParts.push(block.text)
    }
  }

  const rawText = textParts.join('\n').trim()
  if (!rawText) {
    const reason = response.stop_reason ?? 'unknown'
    throw new Error(`Anthropic returned no text. Stop reason: ${reason}`)
  }

  const { input_tokens, output_tokens } = response.usage
  log.info(
    `[${label}] ${rawText.length} chars | in=${String(input_tokens)} out=${String(output_tokens)}`
  )
  return rawText
}

// -------------------------------------------------------
// Main: Anthropic Native Structured
// -------------------------------------------------------

export interface AnthropicNativeParams {
  config: LLMConfig
  messages: LLMMessage[]
  enableThinking?: boolean
  thinkingBudgetTokens?: number
  enableCache?: boolean
  cacheTtl?: '5m' | '1h'
  stepName?: string
}

export const invokeAnthropicNativeStructured = traceable(
  async function invokeAnthropicNativeStructured(
    params: AnthropicNativeParams
  ): Promise<string> {
    const {
      config,
      messages,
      enableThinking = false,
      enableCache = false,
      cacheTtl = '5m',
    } = params
    const label = `Anthropic Native (${config.modelName})`

    let budget = params.thinkingBudgetTokens ?? 8000
    if (enableThinking && budget < 1024) budget = 1024

    let maxTokens = config.maxTokens ?? 4096
    if (enableThinking && maxTokens <= budget) maxTokens = budget + 4096

    const { default: SDK } = await import('@anthropic-ai/sdk')
    const platform = config.platform ?? resolvePlatform()
    const client: Anthropic = new SDK({ apiKey: config.apiKey })

    const effectiveModel =
      platform === 'bedrock'
        ? getBedrockModelId(config.modelName)
        : config.modelName

    const msgs = buildAnthropicMessages(messages, enableCache, cacheTtl)
    const args = buildRequestArgs(
      effectiveModel,
      msgs,
      maxTokens,
      config,
      enableThinking,
      budget
    )
    const headers = buildHeaders(cacheTtl)
    const opts = headers ? { headers } : undefined
    const response = await client.messages.create(args, opts)

    return extractAnthropicText(response, label)
  },
  {
    name: 'anthropic_native_structured',
    run_type: 'llm' as const,
    tags: ['anthropic', 'claude'],
  }
)

// -------------------------------------------------------
// Anthropic Web Search
// -------------------------------------------------------

export interface AnthropicWebSearchParams {
  config: LLMConfig
  messages: LLMMessage[]
  maxUses?: number
  stepName?: string
}

export const invokeAnthropicWithWebSearch = traceable(
  async function invokeAnthropicWithWebSearch(
    params: AnthropicWebSearchParams
  ): Promise<string> {
    const {
      config,
      messages,
      maxUses = 3,
      stepName = 'anthropic_web_search',
    } = params

    const { default: SDK } = await import('@anthropic-ai/sdk')
    const client = new SDK({ apiKey: config.apiKey })

    const msgs = buildAnthropicMessages(messages, false, '5m')
    const systemText = msgs.systemParts.map((p) => p.text as string).join('\n')

    const tools = [
      { type: 'web_search_20250305', name: 'web_search', max_uses: maxUses },
    ] as unknown as MessageCreateParamsNonStreaming['tools']

    const args: MessageCreateParamsNonStreaming = {
      model: config.modelName,
      messages:
        msgs.messagesList as unknown as MessageCreateParamsNonStreaming['messages'],
      tools,
      max_tokens: config.maxTokens ?? 2048,
    }
    if (systemText) args.system = systemText

    const response = await client.messages.create(args)
    return extractAnthropicText(response, stepName)
  },
  {
    name: 'anthropic_web_search',
    run_type: 'llm' as const,
    tags: ['anthropic', 'claude', 'web-search'],
  }
)
