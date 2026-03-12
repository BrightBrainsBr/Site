// frontend/shared/utils/safe-json-parse.ts

export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

export function safeJsonParseArray<T>(json: string): T[] {
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

export async function safeJsonFetch<T>(
  response: Response
): Promise<T | null> {
  try {
    const text = await response.text()
    if (!text || text.trim() === '') return null
    return JSON.parse(text) as T
  } catch {
    return null
  }
}
