// frontend/shared/utils/api-helpers.ts

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  success: boolean
}

export async function apiRequest<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const text = await response.text()

    if (
      !text ||
      text.trim() === '' ||
      text === 'undefined' ||
      text === 'null'
    ) {
      if (response.ok) {
        return { success: true, data: null as T }
      }
      return {
        success: false,
        error: `HTTP ${response.status}: Empty response`,
      }
    }

    let data: T
    try {
      data = JSON.parse(text) as T
    } catch {
      return {
        success: false,
        error: `Invalid JSON response: ${text.substring(0, 100)}...`,
      }
    }

    if (!response.ok) {
      const errBody = data as Record<string, unknown>
      return {
        success: false,
        error:
          (errBody?.error as string) ||
          (errBody?.message as string) ||
          `HTTP ${response.status}`,
        data,
      }
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

export async function apiGet<T = unknown>(
  url: string
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { method: 'GET' })
}

export async function apiPost<T = unknown>(
  url: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

export async function apiPut<T = unknown>(
  url: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  })
}

export async function apiPatch<T = unknown>(
  url: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  })
}

export async function apiDelete<T = unknown>(
  url: string
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { method: 'DELETE' })
}
