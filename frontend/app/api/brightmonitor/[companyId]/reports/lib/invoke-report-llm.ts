import { z } from 'zod'

import {
  getAnthropicConfigForTask,
  type LLMConfigDict,
  LLMProvider,
  llmService,
} from '~/shared/utils/llm'

/** Same structured pipeline as pdf-extraction / action-plan-generator: primary → fallback → JSON fixer */
const nr1MarkdownSchema = z.object({
  markdown: z.string(),
})

/**
 * Anthropic Messages API — alias `claude-haiku-4-5` (maps to latest Haiku 4.5 snapshot).
 * @see https://docs.anthropic.com/en/docs/about-claude/models
 */
const FALLBACK_ANTHROPIC_MODEL = 'claude-haiku-4-5'

/**
 * Gemini Developer API model id for Gemini 3 Flash Preview.
 * @see https://ai.google.dev/gemini-api/docs/models/gemini-3-flash-preview
 */
const FIXER_GEMINI_MODEL = 'gemini-3-flash-preview'

function geminiFlashPreviewFixerDict(): LLMConfigDict {
  return {
    provider: LLMProvider.GOOGLE,
    model_name: FIXER_GEMINI_MODEL,
    max_tokens: 8192,
    temperature: 0,
  }
}

export type BrightmonitorReportTask =
  | 'general_response'
  | 'brightmonitor_pgr_generation'
  | 'brightmonitor_analise_ia'

function brightmonitorReportConfigs(primaryTask: BrightmonitorReportTask) {
  const primaryConfigDict = getAnthropicConfigForTask(primaryTask)

  const fallbackConfigDict = getAnthropicConfigForTask(primaryTask, {
    model_name: FALLBACK_ANTHROPIC_MODEL,
    enable_cache: false,
  })

  const fixerConfigDict = geminiFlashPreviewFixerDict()

  return { primaryConfigDict, fallbackConfigDict, fixerConfigDict }
}

const JSON_OUTPUT_SUFFIX = `\n\n[FORMATO DE SAÍDA — OBRIGATÓRIO]\nRetorne apenas um objeto JSON válido nesta forma: {"markdown":"<relatório completo em Markdown>"}.\nEscape aspas e quebras de linha dentro da string conforme JSON. Sem texto antes ou depois do JSON.`

/**
 * NR-1 Bright Monitor reports via `llmService.invokeStructuredOutput`:
 * primary Sonnet 4.6 (task defaults), Anthropic Haiku 4.5 fallback, Gemini 3 Flash Preview JSON fixer.
 */
export async function invokeBrightMonitorMarkdown(params: {
  system: string
  user: string
  task: BrightmonitorReportTask
  stepName: string
}): Promise<string> {
  const { primaryConfigDict, fallbackConfigDict, fixerConfigDict } =
    brightmonitorReportConfigs(params.task)

  const { result } = await llmService.invokeStructuredOutput({
    promptMessages: [
      { role: 'system', content: params.system },
      { role: 'human', content: params.user + JSON_OUTPUT_SUFFIX },
    ],
    outputSchema: nr1MarkdownSchema,
    primaryConfigDict,
    fallbackConfigDict,
    fixerConfigDict,
    stepName: params.stepName,
  })

  return result.markdown
}
