// frontend/features/llm/services/providers/openaiCompatibleProvider.ts

import type OpenAI from 'openai'
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions'

import { toOpenAIMessages } from '../../helpers/messageConverters'
import type { LLMConfig, LLMMessage } from '../../llm.interface'

function toSdkMessages(messages: LLMMessage[]): ChatCompletionMessageParam[] {
  return toOpenAIMessages(messages) as unknown as ChatCompletionMessageParam[]
}

const log = {
  info: (...args: unknown[]) => console.warn('[LLM:openai-compat]', ...args),
  warn: (...args: unknown[]) =>
    console.warn('[LLM:openai-compat:warn]', ...args),
}

// -------------------------------------------------------
// Perplexity Native
// -------------------------------------------------------

export async function invokePerplexityNativeStructured(
  config: LLMConfig,
  messages: LLMMessage[]
): Promise<string> {
  const stepName = `Perplexity Native (${config.modelName})`
  log.info(`Invoking ${stepName}`)

  if (!config.apiKey) {
    throw new Error('Perplexity API Key is missing for native SDK call.')
  }

  const { default: OpenAI } = await import('openai')
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: 'https://api.perplexity.ai',
  })

  const msgs = toSdkMessages(messages)

  const response = (await client.chat.completions.create({
    model: config.modelName,
    messages: msgs,
    ...(config.temperature != null ? { temperature: config.temperature } : {}),
    ...(config.maxTokens != null ? { max_tokens: config.maxTokens } : {}),
    ...(config.topP != null ? { top_p: config.topP } : {}),
    ...(config.jsonMode
      ? { response_format: { type: 'json_object' as const } }
      : {}),
  })) as ChatCompletion

  const content = response.choices?.[0]?.message?.content
  if (!content?.trim()) {
    const reason = response.choices?.[0]?.finish_reason ?? 'UNKNOWN'
    throw new Error(`Perplexity returned no content. Finish reason: ${reason}`)
  }

  if (response.choices?.[0]?.finish_reason === 'length') {
    log.warn(`[${stepName}] POTENTIAL TRUNCATION: finished due to length`)
  }

  log.info(`[${stepName}] Success. ${content.length} chars`)
  return content
}

// -------------------------------------------------------
// Grok Live Search
// -------------------------------------------------------

export async function invokeGrokWithLiveSearch(
  config: LLMConfig,
  messages: LLMMessage[],
  enableXSearch = true
): Promise<string> {
  const stepName = `Grok Live Search (${config.modelName})`
  log.info(`Invoking ${stepName} with X search: ${String(enableXSearch)}`)

  if (!config.apiKey) throw new Error('Grok API Key is missing')

  const { default: OpenAI } = await import('openai')
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: 'https://api.x.ai/v1',
  })

  const msgs = toSdkMessages(messages)

  const extra: Record<string, unknown> = {}
  if (enableXSearch) {
    extra.search_parameters = {
      mode: 'on',
      sources: [{ type: 'x' }, { type: 'web' }],
      max_search_results: 10,
      return_citations: true,
    }
  }

  // Grok extends OpenAI API with search_parameters - cast needed

  const response = (await client.chat.completions.create({
    model: config.modelName,
    messages: msgs,
    ...(config.temperature != null ? { temperature: config.temperature } : {}),
    ...(config.maxTokens != null ? { max_tokens: config.maxTokens } : {}),
    ...(config.topP != null ? { top_p: config.topP } : {}),
    ...extra,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)) as ChatCompletion

  const content = response.choices?.[0]?.message?.content
  if (!content) throw new Error('Grok Live Search returned no content')

  log.info(`[${stepName}] Got response: ${content.length} chars`)
  return content
}

// -------------------------------------------------------
// Grok Native with Tool Calling
// -------------------------------------------------------

const X_KEYWORD_SEARCH_TOOL = {
  type: 'function' as const,
  function: {
    name: 'x_keyword_search',
    description:
      'Search X (Twitter) for posts using specific keywords and filters.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query with keywords.' },
        limit: {
          type: 'integer',
          description: 'Max posts (1-20)',
          default: 10,
        },
        mode: {
          type: 'string',
          enum: ['Latest', 'Top'],
          description: 'Sort mode',
          default: 'Latest',
        },
      },
      required: ['query'],
    },
  },
}

const X_SEMANTIC_SEARCH_TOOL = {
  type: 'function' as const,
  function: {
    name: 'x_semantic_search',
    description:
      'Search X for conceptually related posts using semantic understanding.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Semantic search query' },
        usernames: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by usernames',
        },
        limit: {
          type: 'integer',
          description: 'Max posts (1-20)',
          default: 10,
        },
      },
      required: ['query'],
    },
  },
}

export async function invokeGrokNativeWithTools(
  config: LLMConfig,
  messages: LLMMessage[],
  availableTools: string[] = []
): Promise<string> {
  const stepName = `Grok Native Tools (${config.modelName})`
  log.info(`Invoking ${stepName} with tools: ${availableTools.join(', ')}`)

  if (!config.apiKey) throw new Error('Grok API Key is missing')

  const { default: OpenAI } = await import('openai')
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: 'https://api.x.ai/v1',
  })

  const msgs = toSdkMessages(messages)
  const tools = buildGrokToolDefinitions(availableTools)

  const response = (await client.chat.completions.create({
    model: config.modelName,
    messages: msgs,
    ...(config.temperature != null ? { temperature: config.temperature } : {}),
    ...(config.maxTokens != null ? { max_tokens: config.maxTokens } : {}),
    ...(config.topP != null ? { top_p: config.topP } : {}),
    ...(tools.length > 0
      ? {
          tools:
            tools as unknown as OpenAI.Chat.Completions.ChatCompletionTool[],
          tool_choice: 'auto' as const,
        }
      : {}),
    ...(config.jsonMode
      ? { response_format: { type: 'json_object' as const } }
      : {}),
  })) as ChatCompletion

  if (!response.choices?.length) throw new Error('Grok returned no choices.')

  const first = response.choices[0]

  if (first.message.tool_calls?.length) {
    return handleGrokToolCalls(client, config, msgs, first, stepName)
  }

  if (first.message?.content) {
    log.info(
      `[${stepName}] Direct response: ${first.message.content.length} chars`
    )
    return first.message.content
  }

  throw new Error('Grok API returned no content')
}

type GrokToolDef = typeof X_KEYWORD_SEARCH_TOOL | typeof X_SEMANTIC_SEARCH_TOOL

function buildGrokToolDefinitions(available: string[]): GrokToolDef[] {
  const tools: GrokToolDef[] = []
  if (available.includes('x_keyword_search')) tools.push(X_KEYWORD_SEARCH_TOOL)
  if (available.includes('x_semantic_search'))
    tools.push(X_SEMANTIC_SEARCH_TOOL)
  return tools
}

async function handleGrokToolCalls(
  client: OpenAI,
  config: LLMConfig,
  originalMessages: ChatCompletionMessageParam[],
  firstChoice: ChatCompletion.Choice,
  stepName: string
): Promise<string> {
  const toolCalls = firstChoice.message.tool_calls ?? []
  log.info(`[${stepName}] Grok made ${String(toolCalls.length)} tool calls`)

  const updatedMessages: ChatCompletionMessageParam[] = [
    ...originalMessages,
    {
      role: 'assistant' as const,
      content: firstChoice.message.content ?? '',
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        type: 'function' as const,
        function: {
          name: (
            tc as unknown as { function: { name: string; arguments: string } }
          ).function.name,
          arguments: (
            tc as unknown as { function: { name: string; arguments: string } }
          ).function.arguments,
        },
      })),
    },
  ]

  const finalResponse = (await client.chat.completions.create({
    model: config.modelName,
    messages: updatedMessages,
    ...(config.temperature != null ? { temperature: config.temperature } : {}),
    ...(config.maxTokens != null ? { max_tokens: config.maxTokens } : {}),
  })) as ChatCompletion

  const content = finalResponse.choices?.[0]?.message?.content
  if (content) {
    log.info(
      `[${stepName}] Final response after tools: ${content.length} chars`
    )
    return content
  }

  throw new Error('No final content after tool calling')
}
