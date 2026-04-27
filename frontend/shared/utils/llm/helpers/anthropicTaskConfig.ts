// frontend/features/llm/helpers/anthropicTaskConfig.ts

import { type LLMConfigDict, LLMProvider } from '../llm.interface'

const COMPLEX_TASKS = new Set([
  'funnel_diagnosis',
  'experiment_design',
  'experiment_proposal',
  'root_cause_analysis',
  'pipeline_strategy',
  'learning_synthesis',
  'copy_analysis',
  // b2b_laudo_generation intentionally excluded: extended thinking + 16k tokens
  // causes Vercel 5-min function timeout. Uses MODERATE path instead (no thinking, 8k tokens).
])

const MODERATE_TASKS = new Set([
  'daily_brief',
  'status_report',
  'alert_analysis',
  'general_response',
  'pdf_extraction',
  'action_plan_generation',
])

// Tasks that need high output token limits but not extended thinking
const HIGH_OUTPUT_TASKS = new Set([
  'b2b_laudo_generation',
  'brightmonitor_pgr_generation',
])

/**
 * Get optimized Anthropic config based on task complexity.
 *
 * COMPLEX tasks (thinking enabled): funnel_diagnosis, experiment_design, etc.
 * MODERATE tasks (caching only): daily_brief, status_report, etc.
 * SIMPLE tasks: everything else
 */
export function getAnthropicConfigForTask(
  taskType: string,
  baseConfig?: Partial<LLMConfigDict>
): LLMConfigDict {
  const base = baseConfig ?? {}
  const config: LLMConfigDict = {
    provider: LLMProvider.ANTHROPIC,
    model_name: base.model_name ?? base.modelName ?? 'claude-sonnet-4-6',
    api_key: base.api_key ?? base.apiKey ?? process.env.ANTHROPIC_API_KEY,
    enable_cache: true,
    cache_ttl: '5m',
    ...base,
  }

  if (COMPLEX_TASKS.has(taskType)) {
    config.enable_thinking = true
    config.thinking_budget_tokens = 10000
    config.max_tokens = 16000
  } else if (HIGH_OUTPUT_TASKS.has(taskType)) {
    config.enable_thinking = false
    config.max_tokens = 8192
  } else if (MODERATE_TASKS.has(taskType)) {
    config.enable_thinking = false
    config.max_tokens = 4096
  } else {
    config.enable_thinking = false
    config.max_tokens = 2048
  }

  return config
}
