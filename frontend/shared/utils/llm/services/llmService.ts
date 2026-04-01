// frontend/features/llm/services/llmService.ts

import { ChatAnthropic } from '@langchain/anthropic'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatOpenAI } from '@langchain/openai'
import type { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

import { toLangChainMessages } from '../helpers/messageConverters'
import {
  tryParseAndValidate,
  validateAndFixJson,
} from '../helpers/validateAndFixJson'
import {
  API_KEY_ENV_VARS,
  BEDROCK_MODEL_MAP,
  type CostContext,
  type LLMConfig,
  type LLMConfigDict,
  type LLMMessage,
  LLMProvider,
  PLATFORM_ENV_VARS,
  RATE_LIMIT_BACKOFFS,
  RATE_LIMIT_MAX_RETRIES,
  RATE_LIMIT_PHRASES,
  StructuredOutputError,
} from '../llm.interface'
import { invokeWithToolsCore, invokeWithWebSearchCore } from './llmToolsWrapper'
import { invokeAnthropicNativeStructured } from './providers/anthropicNativeProvider'
import { invokeGoogleNativeStructured } from './providers/googleNativeProvider'
import { invokePerplexityNativeStructured } from './providers/openaiCompatibleProvider'

export { toLangChainMessages } from '../helpers/messageConverters'

function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

function resolvePlatform(
  provider: LLMProvider,
  dict?: LLMConfigDict | null
): string {
  if (dict?.platform) return dict.platform
  const envVar = PLATFORM_ENV_VARS[provider]
  return envVar ? (process.env[envVar] ?? 'direct') : 'direct'
}

function normalizeDict(dict: LLMConfigDict): LLMConfigDict {
  return {
    ...dict,
    model_name: dict.model_name ?? dict.modelName,
    api_key: dict.api_key ?? dict.apiKey,
    max_tokens: dict.max_tokens ?? dict.maxTokens,
    top_p: dict.top_p ?? dict.topP,
    json_mode: dict.json_mode ?? dict.jsonMode,
    api_base: dict.api_base ?? dict.apiBase,
    api_version: dict.api_version ?? dict.apiVersion,
    deployment_id: dict.deployment_id ?? dict.deploymentId,
    enable_thinking: dict.enable_thinking ?? dict.enableThinking,
    thinking_budget_tokens:
      dict.thinking_budget_tokens ?? dict.thinkingBudgetTokens,
    enable_cache: dict.enable_cache ?? dict.enableCache,
    cache_ttl: dict.cache_ttl ?? dict.cacheTtl,
  }
}

export class LLMService {
  private costContext: CostContext = {}

  setCostContext(ctx: Partial<CostContext>): void {
    this.costContext = { ...this.costContext, ...ctx }
  }

  clearCostContext(): void {
    this.costContext = {}
  }

  // ---- Config Preparation ----

  prepareLlmConfig(rawDict: LLMConfigDict): LLMConfig {
    const dict = normalizeDict(rawDict)
    const providerStr = dict.provider
    if (!providerStr) throw new Error('LLM provider must be specified.')

    const provider = providerStr as LLMProvider
    if (!Object.values(LLMProvider).includes(provider)) {
      throw new Error(`Invalid LLM provider: ${providerStr}`)
    }

    const platform = resolvePlatform(provider, dict) as LLMConfig['platform']
    const isCloud = platform === 'vertex' || platform === 'bedrock'

    let apiKey = dict.api_key
    const envVar = API_KEY_ENV_VARS[provider]
    if (!apiKey && envVar) apiKey = process.env[envVar]

    if (!isCloud && provider !== LLMProvider.CUSTOM && !apiKey) {
      throw new Error(`API key for ${provider} not found.`)
    }

    return {
      provider,
      modelName: dict.model_name ?? 'gpt-4o',
      apiKey,
      temperature: dict.temperature,
      maxTokens: dict.max_tokens,
      topP: dict.top_p,
      jsonMode: dict.json_mode,
      apiBase: dict.api_base,
      apiVersion: dict.api_version,
      deploymentId: dict.deployment_id,
      platform,
      enableThinking: dict.enable_thinking,
      thinkingBudgetTokens: dict.thinking_budget_tokens,
      enableCache: dict.enable_cache,
      cacheTtl: dict.cache_ttl,
    }
  }

  // ---- Provider Factory ----

  getLlmInstance(configDict: LLMConfigDict): BaseChatModel {
    const c = this.prepareLlmConfig(configDict)
    return createLangChainModel(c, configDict)
  }

  // ---- Main Public API ----

  async invokeStructuredOutput<T extends z.ZodTypeAny>(params: {
    promptMessages: LLMMessage[]
    outputSchema: T
    primaryConfigDict: LLMConfigDict
    fallbackConfigDict?: LLMConfigDict | null
    fixerConfigDict?: LLMConfigDict | null
    stepName?: string
  }): Promise<{ result: z.infer<T>; modelUsed: string | null }> {
    return invokeStructuredOutputCore(this, params)
  }

  async invokeStructuredOutputWithWebSearch<T extends z.ZodTypeAny>(params: {
    promptMessages: LLMMessage[]
    outputSchema: T
    primaryConfigDict: LLMConfigDict
    fallbackConfigDict?: LLMConfigDict | null
    fixerConfigDict?: LLMConfigDict | null
    stepName?: string
  }): Promise<{ result: z.infer<T>; modelUsed: string | null }> {
    return invokeWithWebSearchCore(this, params)
  }

  async invokeStructuredOutputWithTools<T extends z.ZodTypeAny>(params: {
    promptMessages: LLMMessage[]
    outputSchema: T
    primaryConfigDict: LLMConfigDict
    fallbackConfigDict?: LLMConfigDict | null
    fixerConfigDict?: LLMConfigDict | null
    stepName?: string
    availableTools?: string[]
  }): Promise<{ result: z.infer<T>; modelUsed: string | null }> {
    return invokeWithToolsCore(this, params)
  }
}

function createLangChainModel(
  c: LLMConfig,
  dict: LLMConfigDict
): BaseChatModel {
  const temp = c.temperature != null ? { temperature: c.temperature } : {}

  switch (c.provider) {
    case LLMProvider.OPENAI:
      return new ChatOpenAI({
        model: c.modelName,
        apiKey: c.apiKey,
        maxTokens: c.maxTokens,
        ...temp,
      }) as unknown as BaseChatModel

    case LLMProvider.AZURE_OPENAI: {
      if (!c.apiBase) throw new Error("Azure OpenAI requires 'apiBase'.")
      return new ChatOpenAI({
        model: c.deploymentId ?? c.modelName,
        openAIApiKey: c.apiKey,
        configuration: {
          baseURL: c.apiBase,
          defaultHeaders: {
            'api-key': c.apiKey ?? '',
          },
          defaultQuery: {
            'api-version': c.apiVersion ?? '2024-02-01',
          },
        },
        maxTokens: c.maxTokens,
        ...temp,
      }) as unknown as BaseChatModel
    }

    case LLMProvider.ANTHROPIC: {
      const platform =
        c.platform ?? resolvePlatform(LLMProvider.ANTHROPIC, dict)
      const mt = c.maxTokens ?? 4096
      if (platform === 'bedrock') {
        const id =
          BEDROCK_MODEL_MAP[c.modelName] ?? `us.anthropic.${c.modelName}-v1:0`
        return new ChatAnthropic({
          model: id,
          maxTokens: mt,
          ...temp,
        }) as unknown as BaseChatModel
      }
      return new ChatAnthropic({
        model: c.modelName,
        anthropicApiKey: c.apiKey,
        maxTokens: mt,
        ...temp,
      }) as unknown as BaseChatModel
    }

    case LLMProvider.GROQ:
      return new ChatOpenAI({
        model: c.modelName,
        apiKey: c.apiKey,
        configuration: { baseURL: 'https://api.groq.com/openai/v1' },
        maxTokens: c.maxTokens,
        ...temp,
      }) as unknown as BaseChatModel

    case LLMProvider.GROK:
      return new ChatOpenAI({
        model: c.modelName,
        apiKey: c.apiKey,
        configuration: { baseURL: 'https://api.x.ai/v1' },
        maxTokens: c.maxTokens,
        ...temp,
      }) as unknown as BaseChatModel

    case LLMProvider.GOOGLE:
      return new ChatGoogleGenerativeAI({
        model: c.modelName,
        apiKey: c.apiKey,
        maxOutputTokens: c.maxTokens,
        ...temp,
      }) as unknown as BaseChatModel

    case LLMProvider.PERPLEXITY:
      return new ChatOpenAI({
        model: c.modelName,
        apiKey: c.apiKey,
        configuration: { baseURL: 'https://api.perplexity.ai' },
        maxTokens: c.maxTokens,
        ...temp,
      }) as unknown as BaseChatModel

    default:
      throw new Error(`Provider '${c.provider}' not implemented.`)
  }
}

// ============================================================
// Core Structured Output Pipeline
// ============================================================

async function callPrimaryLlm(
  svc: LLMService,
  config: LLMConfig,
  dict: LLMConfigDict,
  msgs: LLMMessage[],
  schemaJson: Record<string, unknown>
): Promise<string | null> {
  const p = config.provider

  if (p === LLMProvider.GOOGLE) {
    return invokeGoogleNativeStructured(config, msgs, schemaJson)
  }
  if (p === LLMProvider.PERPLEXITY) {
    return invokePerplexityNativeStructured(config, msgs)
  }
  if (p === LLMProvider.ANTHROPIC) {
    const thinking = dict.enable_thinking ?? dict.enableThinking ?? false
    const cache = dict.enable_cache ?? dict.enableCache ?? false
    if (thinking || cache) {
      return invokeAnthropicNativeStructured({
        config,
        messages: msgs,
        enableThinking: thinking,
        thinkingBudgetTokens:
          dict.thinking_budget_tokens ?? dict.thinkingBudgetTokens ?? 8000,
        enableCache: cache,
        cacheTtl: dict.cache_ttl ?? dict.cacheTtl ?? '5m',
      })
    }
  }

  const llm = svc.getLlmInstance(dict)
  const resp = await llm.invoke(toLangChainMessages(msgs))
  return typeof resp.content === 'string'
    ? resp.content
    : JSON.stringify(resp.content)
}

interface RetryResult {
  output: string | null
  lastErr: Error | null
  modelUsed: string | null
}

async function runWithRetry(
  svc: LLMService,
  pc: LLMConfig,
  dict: LLMConfigDict,
  msgs: LLMMessage[],
  schema: Record<string, unknown>,
  hasFallback: boolean
): Promise<RetryResult> {
  for (let i = 0; i <= RATE_LIMIT_MAX_RETRIES; i++) {
    try {
      const output = await callPrimaryLlm(svc, pc, dict, msgs, schema)
      return { output, lastErr: null, modelUsed: pc.modelName }
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      const isRL = RATE_LIMIT_PHRASES.some((phrase) =>
        err.message.toLowerCase().includes(phrase)
      )
      if (isRL && hasFallback) {
        return { output: null, lastErr: err, modelUsed: null }
      }
      if (isRL && i < RATE_LIMIT_MAX_RETRIES) {
        const wait =
          RATE_LIMIT_BACKOFFS[Math.min(i, RATE_LIMIT_BACKOFFS.length - 1)]
        await sleep(wait)
        continue
      }
      return { output: null, lastErr: err, modelUsed: null }
    }
  }
  return { output: null, lastErr: new Error('Max retries'), modelUsed: null }
}

async function invokeStructuredOutputCore<T extends z.ZodTypeAny>(
  svc: LLMService,
  params: {
    promptMessages: LLMMessage[]
    outputSchema: T
    primaryConfigDict: LLMConfigDict
    fallbackConfigDict?: LLMConfigDict | null
    fixerConfigDict?: LLMConfigDict | null
    stepName?: string
  }
): Promise<{ result: z.infer<T>; modelUsed: string | null }> {
  const {
    promptMessages,
    outputSchema,
    primaryConfigDict,
    stepName = 'structured_output',
  } = params
  const fallbackDict = params.fallbackConfigDict ?? null
  const fixerDict = params.fixerConfigDict ?? null

  const pc = svc.prepareLlmConfig(primaryConfigDict)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schemaJson = zodToJsonSchema(outputSchema as any) as Record<
    string,
    unknown
  >

  let fc: LLMConfig | null = null
  if (fallbackDict) {
    try {
      fc = svc.prepareLlmConfig(fallbackDict)
    } catch {
      /* skip */
    }
  }

  let { output, lastErr, modelUsed } = await runWithRetry(
    svc,
    pc,
    primaryConfigDict,
    promptMessages,
    schemaJson,
    !!fc
  )

  if (lastErr && fc && fallbackDict) {
    try {
      const fbResult = await callPrimaryLlm(
        svc,
        fc,
        fallbackDict,
        promptMessages,
        schemaJson
      )
      output = fbResult
      lastErr = null
      modelUsed = fc.modelName
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      lastErr = new Error(`Primary+Fallback failed: ${err.message}`)
      modelUsed = null
    }
  }

  if (!output?.trim() || lastErr) {
    throw new StructuredOutputError({
      message: `${stepName}: ${lastErr?.message ?? 'empty response'}`,
      rawOutput: output,
      modelUsed,
    })
  }

  const fast = tryParseAndValidate(output, outputSchema)
  if (fast.result !== null) return { result: fast.result, modelUsed }

  if (!fixerDict) {
    throw new StructuredOutputError({
      message: `${stepName} validation failed: no fixer config.`,
      rawOutput: output,
      modelUsed,
    })
  }

  const fixed = await validateAndFixJson({
    llmOutput: output,
    schema: outputSchema,
    fixerLlm: svc.getLlmInstance(fixerDict),
  })

  if (fixed.error) {
    throw new StructuredOutputError({
      message: `${stepName} validation failed after fix.`,
      validationError: fixed.error,
      rawOutput: output,
      modelUsed,
    })
  }

  return { result: fixed.result!, modelUsed }
}

export { getAnthropicConfigForTask } from '../helpers/anthropicTaskConfig'

// ============================================================
// Singleton
// ============================================================

export const llmService = new LLMService()
