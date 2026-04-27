// frontend/agents/shared/tracing.ts

import { awaitAllCallbacks } from '@langchain/core/callbacks/promises'

const TAG = '[tracing]'

export async function ensureTracingFlushed(): Promise<void> {
  const t0 = Date.now()
  try {
    await awaitAllCallbacks()
    console.warn(`${TAG} Flushed in ${Date.now() - t0}ms (LANGSMITH_TRACING=${process.env.LANGSMITH_TRACING ?? 'unset'}, LANGCHAIN_TRACING_V2=${process.env.LANGCHAIN_TRACING_V2 ?? 'unset'}, LANGSMITH_API_KEY=${process.env.LANGSMITH_API_KEY ? 'set' : 'MISSING'})`)
  } catch (error) {
    console.warn(`${TAG} Flush FAILED after ${Date.now() - t0}ms:`, error)
  }
}
