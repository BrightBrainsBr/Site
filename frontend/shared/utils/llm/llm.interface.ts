// frontend/features/llm/llm.interface.ts

import type { z } from 'zod'

// ============================================================
// LLM Provider Enum
// ============================================================

export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  AZURE_OPENAI = 'azure_openai',
  GROQ = 'groq',
  GOOGLE = 'google',
  GROK = 'grok',
  PERPLEXITY = 'perplexity',
  CUSTOM = 'custom',
}

// ============================================================
// LLM Configuration
// ============================================================

export interface LLMConfig {
  provider: LLMProvider
  modelName: string
  apiKey?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  jsonMode?: boolean

  // Azure-specific
  apiBase?: string
  apiVersion?: string
  deploymentId?: string

  // Cloud platform routing
  platform?: 'direct' | 'vertex' | 'bedrock'

  // Anthropic-specific
  enableThinking?: boolean
  thinkingBudgetTokens?: number
  enableCache?: boolean
  cacheTtl?: '5m' | '1h'

  // Tool/search features
  enableWebSearch?: boolean
  maxSearchesPerQuery?: number
  maxResultsPerSearch?: number
}

// ============================================================
// Config Dict (raw dict passed by callers, similar to Python)
// ============================================================

export interface LLMConfigDict {
  provider: string | LLMProvider
  model_name?: string
  modelName?: string
  api_key?: string
  apiKey?: string
  temperature?: number
  max_tokens?: number
  maxTokens?: number
  top_p?: number
  topP?: number
  json_mode?: boolean
  jsonMode?: boolean

  // Azure
  api_base?: string
  apiBase?: string
  api_version?: string
  apiVersion?: string
  deployment_id?: string
  deploymentId?: string

  // Platform
  platform?: string

  // Anthropic
  enable_thinking?: boolean
  enableThinking?: boolean
  thinking_budget_tokens?: number
  thinkingBudgetTokens?: number
  enable_cache?: boolean
  enableCache?: boolean
  cache_ttl?: '5m' | '1h'
  cacheTtl?: '5m' | '1h'

  // Search
  enable_web_search?: boolean
  max_searches_per_query?: number
  max_results_per_search?: number
}

// ============================================================
// Structured Output Error
// ============================================================

export class StructuredOutputError extends Error {
  rawOutput?: string | null
  modelUsed?: string | null
  validationError?: string | null

  constructor(params: {
    message: string
    rawOutput?: string | null
    modelUsed?: string | null
    validationError?: string | null
  }) {
    super(params.message)
    this.name = 'StructuredOutputError'
    this.rawOutput = params.rawOutput ?? null
    this.modelUsed = params.modelUsed ?? null
    this.validationError = params.validationError ?? null
  }
}

// ============================================================
// Message Types (LangChain-compatible)
// ============================================================

export type MessageRole = 'system' | 'human' | 'ai' | 'user' | 'assistant'

export interface LLMMessage {
  role: MessageRole
  content: string | MessageContentPart[]
}

export interface MessageContentPart {
  type: 'text' | 'image_url'
  text?: string
  image_url?: {
    url: string
  }
}

// ============================================================
// Invoke Options
// ============================================================

export interface InvokeStructuredOutputOptions<T extends z.ZodTypeAny> {
  promptMessages: LLMMessage[]
  outputSchema: T
  primaryConfigDict: LLMConfigDict
  fallbackConfigDict?: LLMConfigDict | null
  fixerConfigDict?: LLMConfigDict | null
  stepName?: string
}

export interface InvokeStructuredOutputResult<T> {
  result: T
  modelUsed: string | null
}

// ============================================================
// Cost Tracking Context
// ============================================================

export interface CostContext {
  editionId?: string | null
  operationType?: string | null
  jobId?: string | null
  userId?: string | null
}

// ============================================================
// Bedrock Model Mapping
// ============================================================

export const BEDROCK_MODEL_MAP: Record<string, string> = {
  'claude-sonnet-4-6': 'us.anthropic.claude-sonnet-4-6-v1:0',
  'claude-opus-4-6': 'us.anthropic.claude-opus-4-6-v1:0',
  'claude-haiku-3-5': 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
}

// ============================================================
// Platform Environment Variable Mapping
// ============================================================

export const PLATFORM_ENV_VARS: Partial<Record<LLMProvider, string>> = {
  [LLMProvider.ANTHROPIC]: 'ANTHROPIC_PLATFORM',
  [LLMProvider.GOOGLE]: 'GOOGLE_PLATFORM',
}

// ============================================================
// API Key Environment Variable Mapping
// ============================================================

export const API_KEY_ENV_VARS: Partial<Record<LLMProvider, string>> = {
  [LLMProvider.OPENAI]: 'OPENAI_API_KEY',
  [LLMProvider.ANTHROPIC]: 'ANTHROPIC_API_KEY',
  [LLMProvider.AZURE_OPENAI]: 'AZURE_OPENAI_API_KEY',
  [LLMProvider.GROQ]: 'GROQ_API_KEY',
  [LLMProvider.GOOGLE]: 'GEMINI_API_KEY',
  [LLMProvider.GROK]: 'GROK_API_KEY',
  [LLMProvider.PERPLEXITY]: 'PERPLEXITY_API_KEY',
}

// ============================================================
// Rate Limit Configuration
// ============================================================

export const RATE_LIMIT_PHRASES = [
  '429',
  'rate limit',
  'rate_limit',
  'resource_exhausted',
  'too many requests',
  'quota exceeded',
]

export const RATE_LIMIT_MAX_RETRIES = 3
export const RATE_LIMIT_BACKOFFS = [15, 30, 60] // seconds
