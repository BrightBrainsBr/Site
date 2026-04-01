// frontend/agents/shared/errors.ts

export class AgentError extends Error {
  constructor(
    message: string,
    public readonly node: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'AgentError'
  }
}

export class RetryableError extends AgentError {
  constructor(message: string, node: string, cause?: unknown) {
    super(message, node, cause)
    this.name = 'RetryableError'
  }
}

export const DEFAULT_RETRY_POLICY = {
  maxAttempts: 3,
  retryOn: (error: Error) => error instanceof RetryableError,
}
