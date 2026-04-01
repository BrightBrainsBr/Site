// frontend/agents/shared/tracing.ts

import { awaitAllCallbacks } from '@langchain/core/callbacks/promises'

export async function ensureTracingFlushed(): Promise<void> {
  try {
    await awaitAllCallbacks()
  } catch (error) {
    console.warn('[tracing] Failed to flush callbacks:', error)
  }
}
