// frontend/features/llm/services/llmToolsWrapper.ts

import type { z } from 'zod'

import {
  tryParseAndValidate,
  validateAndFixJson,
} from '../helpers/validateAndFixJson'
import type { LLMConfigDict, LLMMessage } from '../llm.interface'
import { LLMProvider } from '../llm.interface'
import type { LLMService } from './llmService'
import { invokeAnthropicWithWebSearch } from './providers/anthropicNativeProvider'
import { invokeGrokWithLiveSearch } from './providers/openaiCompatibleProvider'

const log = {
  error: (...args: unknown[]) => console.error('[LLMService:tools]', ...args),
}

/**
 * Web search wrapper: Anthropic web search → enhance prompt → structured output.
 */
export async function invokeWithWebSearchCore<T extends z.ZodTypeAny>(
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
  const { promptMessages, primaryConfigDict } = params
  const config = svc.prepareLlmConfig(primaryConfigDict)

  if (config.provider === LLMProvider.ANTHROPIC) {
    const context = await invokeAnthropicWithWebSearch({
      config,
      messages: promptMessages,
      maxUses: primaryConfigDict.max_searches_per_query ?? 3,
    })

    const enhanced = [...promptMessages]
    for (let i = enhanced.length - 1; i >= 0; i--) {
      if (enhanced[i].role === 'human' || enhanced[i].role === 'user') {
        const orig =
          typeof enhanced[i].content === 'string'
            ? (enhanced[i].content as string)
            : ''
        enhanced[i] = {
          ...enhanced[i],
          content: `${orig}\n\n## ADDITIONAL CONTEXT FROM WEB SEARCH:\n${context}`,
        }
        break
      }
    }

    return svc.invokeStructuredOutput({
      ...params,
      promptMessages: enhanced,
    })
  }

  return svc.invokeStructuredOutput(params)
}

/**
 * Tools wrapper: Grok live search → validate → fallback to structured output.
 */
export async function invokeWithToolsCore<T extends z.ZodTypeAny>(
  svc: LLMService,
  params: {
    promptMessages: LLMMessage[]
    outputSchema: T
    primaryConfigDict: LLMConfigDict
    fallbackConfigDict?: LLMConfigDict | null
    fixerConfigDict?: LLMConfigDict | null
    stepName?: string
    availableTools?: string[]
  }
): Promise<{ result: z.infer<T>; modelUsed: string | null }> {
  const {
    promptMessages,
    outputSchema,
    primaryConfigDict,
    stepName = 'structured_output_tools',
  } = params
  const available = params.availableTools ?? []
  const pc = svc.prepareLlmConfig(primaryConfigDict)

  if (available.length > 0 && pc.provider === LLMProvider.GROK) {
    const hasXSearch = available.some((t) =>
      ['x_keyword_search', 'x_semantic_search'].includes(t)
    )

    if (hasXSearch) {
      try {
        const raw = await invokeGrokWithLiveSearch(pc, promptMessages, true)
        const fast = tryParseAndValidate(raw, outputSchema)
        if (fast.result !== null) {
          return { result: fast.result, modelUsed: pc.modelName }
        }

        if (params.fixerConfigDict) {
          const fixer = svc.getLlmInstance(params.fixerConfigDict)
          const fixed = await validateAndFixJson({
            llmOutput: raw,
            schema: outputSchema,
            fixerLlm: fixer,
          })
          if (fixed.result !== null) {
            return { result: fixed.result, modelUsed: pc.modelName }
          }
        }
      } catch (e) {
        log.error(`[${stepName}] Grok failed: ${String(e)}. Falling back.`)
      }
    }
  }

  return svc.invokeStructuredOutput(params)
}
