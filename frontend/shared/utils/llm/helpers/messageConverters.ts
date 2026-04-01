// frontend/features/llm/helpers/messageConverters.ts

import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages'

import type { LLMMessage } from '../llm.interface'

/**
 * Convert LLMMessage[] to LangChain BaseMessage[].
 */
export function toLangChainMessages(messages: LLMMessage[]): BaseMessage[] {
  return messages.map((msg) => {
    const content =
      typeof msg.content === 'string'
        ? msg.content
        : msg.content
            .map((p) => (p.type === 'text' ? (p.text ?? '') : ''))
            .join('\n')

    switch (msg.role) {
      case 'system':
        return new SystemMessage(content)
      case 'ai':
      case 'assistant':
        return new AIMessage(content)
      case 'human':
      case 'user':
      default:
        return new HumanMessage(content)
    }
  })
}

type OpenAIMessageContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    >

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: OpenAIMessageContent
}

/**
 * Convert LLMMessage[] to OpenAI-compatible message format.
 */
export function toOpenAIMessages(messages: LLMMessage[]): OpenAIMessage[] {
  return messages.map((msg) => {
    let role: OpenAIMessage['role']
    switch (msg.role) {
      case 'system':
        role = 'system'
        break
      case 'ai':
      case 'assistant':
        role = 'assistant'
        break
      default:
        role = 'user'
        break
    }

    if (typeof msg.content === 'string') {
      return { role, content: msg.content }
    }

    const parts: OpenAIMessage['content'] = msg.content.map((p) => {
      if (p.type === 'image_url' && p.image_url) {
        return {
          type: 'image_url' as const,
          image_url: { url: p.image_url.url },
        }
      }
      return { type: 'text' as const, text: p.text ?? '' }
    })

    return { role, content: parts }
  })
}
