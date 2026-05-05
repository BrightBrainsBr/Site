// frontend/app/api/brightmonitor/[companyId]/reports/lib/invoke-report-llm.ts

import {
  type LLMConfigDict,
  type LLMMessage,
  LLMProvider,
  llmService,
  toLangChainMessages,
} from '~/shared/utils/llm'

/**
 * NR-1 Bright Monitor reports return long-form Markdown.
 *
 * History:
 * - We previously wrapped the output in `{"markdown":"..."}` JSON and ran the structured-output
 *   pipeline (Sonnet 4.6 → Haiku 4.5 → Gemini fixer). With max_tokens 8192 the model would
 *   truncate mid-string on long PGRs (notably `inventario` and `pgr-completo`), the JSON
 *   parser failed, and the fixer cannot recover an arbitrarily-truncated string.
 *   See vercel logs 2026-05-04 18:20 — `brightmonitor_pgr_report validation failed after fix.`
 * - Sonnet 4.6 generation also frequently approached Vercel's 300s function limit.
 *
 * Current pipeline (raw markdown, no JSON envelope):
 * - Primary:  Gemini 3 Flash Preview (fast, cheap, 64K output window)
 * - Fallback: Anthropic Claude Haiku 4.5 (proven quality, 8K output)
 * No structured-output validation step — we return the model's text directly, so a
 * truncated response simply becomes a slightly shorter (still valid) Markdown document.
 */

/**
 * Gemini Developer API model id for Gemini 3 Flash Preview.
 * @see https://ai.google.dev/gemini-api/docs/models/gemini-3-flash-preview
 */
const PRIMARY_GEMINI_MODEL = 'gemini-3-flash-preview'

/**
 * Anthropic Messages API alias `claude-haiku-4-5` (latest Haiku 4.5 snapshot).
 * @see https://docs.anthropic.com/en/docs/about-claude/models
 */
const FALLBACK_ANTHROPIC_MODEL = 'claude-haiku-4-5'

const PRIMARY_MAX_TOKENS = 16000
const FALLBACK_MAX_TOKENS = 8192

export type BrightmonitorReportTask =
  | 'general_response'
  | 'brightmonitor_pgr_generation'
  | 'brightmonitor_analise_ia'

function geminiPrimaryDict(): LLMConfigDict {
  return {
    provider: LLMProvider.GOOGLE,
    model_name: PRIMARY_GEMINI_MODEL,
    max_tokens: PRIMARY_MAX_TOKENS,
    temperature: 0.4,
  }
}

function anthropicFallbackDict(): LLMConfigDict {
  return {
    provider: LLMProvider.ANTHROPIC,
    model_name: FALLBACK_ANTHROPIC_MODEL,
    api_key: process.env.ANTHROPIC_API_KEY,
    max_tokens: FALLBACK_MAX_TOKENS,
    temperature: 0.4,
    enable_cache: false,
  }
}

function stripCodeFences(raw: string): string {
  let out = raw.trim()
  if (out.startsWith('```markdown')) out = out.slice('```markdown'.length)
  else if (out.startsWith('```md')) out = out.slice('```md'.length)
  else if (out.startsWith('```')) out = out.slice(3)
  if (out.endsWith('```')) out = out.slice(0, -3)
  return out.trim()
}

async function invokeRawMarkdown(
  configDict: LLMConfigDict,
  messages: LLMMessage[]
): Promise<string> {
  const llm = llmService.getLlmInstance(configDict)
  const resp = await llm.invoke(toLangChainMessages(messages))
  const content =
    typeof resp.content === 'string'
      ? resp.content
      : JSON.stringify(resp.content)
  return stripCodeFences(content)
}

/**
 * Generate long-form NR-1 markdown using Gemini 3 Flash (primary) with Haiku 4.5 fallback.
 * Returns raw Markdown — no JSON envelope, no schema validation step.
 */
export async function invokeBrightMonitorMarkdown(params: {
  system: string
  user: string
  task: BrightmonitorReportTask
  stepName: string
}): Promise<string> {
  const messages: LLMMessage[] = [
    { role: 'system', content: params.system },
    { role: 'human', content: params.user },
  ]

  try {
    const md = await invokeRawMarkdown(geminiPrimaryDict(), messages)
    if (md.length < 200) {
      throw new Error(
        `Primary returned suspiciously short output (${md.length} chars)`
      )
    }
    return md
  } catch (primaryErr) {
    const primaryMsg =
      primaryErr instanceof Error ? primaryErr.message : String(primaryErr)
    console.warn(
      `[${params.stepName}] Gemini primary failed (${primaryMsg}); falling back to Haiku 4.5`
    )

    try {
      const md = await invokeRawMarkdown(anthropicFallbackDict(), messages)
      if (!md.trim()) {
        throw new Error('Fallback returned empty output')
      }
      return md
    } catch (fallbackErr) {
      const fallbackMsg =
        fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
      throw new Error(
        `${params.stepName}: primary (${primaryMsg}) and fallback (${fallbackMsg}) both failed`
      )
    }
  }
}
