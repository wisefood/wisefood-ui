// src/lib/apiClient.ts
import { useAuthStore } from '@/stores/authStore'

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export class ApiError extends Error {
  status?: number
  code?: string
  details?: any
  constructor(message: string, status?: number, code?: string, details?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

/** Safely parse JSON; returns null or raw text when parsing fails or body empty */
async function safeJson(res: Response): Promise<any | null> {
  const text = await res.text().catch(() => '')
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function stripTrailingSlash(s: string) {
  return s.replace(/\/+$/, '')
}

function serializeQuery(params?: Record<string, any>) {
  if (!params) return ''
  const pairs: string[] = []
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    if (Array.isArray(v)) {
      v.forEach(el => pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(el))}`))
    } else {
      pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    }
  }
  return pairs.length ? `?${pairs.join('&')}` : ''
}

/** Lightweight ApiClient factory */
export function createApiClient(baseUrl: string) {
  const BASE = stripTrailingSlash(baseUrl)

  function getAuthHeaders(): Record<string, string> {
    // lazy read the store to avoid importing before Pinia init
    const auth = useAuthStore()
    const token = auth.getToken?.()
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    return headers
  }

  async function normalizeFetch(res: Response) {
    if (!res.ok) {
      const body = await safeJson(res)
      const detail =
        body?.error?.detail ||
        body?.error?.title ||
        body?.detail ||
        (typeof body === 'string' ? body : null) ||
        res.statusText ||
        `HTTP ${res.status}`
      const code = body?.error?.code ?? undefined
      throw new ApiError(detail, res.status, code, body)
    }

    const data = (await safeJson(res)) as any | null
    if (!data) return null
    // If your API follows { success, result, help } envelope:
    if ('success' in data) {
      if (data.success) return data.result ?? null
      const err = data.error ?? data
      const message = typeof err === 'string' ? err : (err?.detail || err?.title || JSON.stringify(err))
      const code = err?.code
      throw new ApiError(message, undefined, code, err)
    }
    // fallback: return raw body if it doesn't use the envelope
    return data
  }

  async function request<T = any>(
    method: HTTPMethod,
    path: string,
    options?: {
      params?: Record<string, any>
      body?: any
      headers?: Record<string, string>
      signal?: AbortSignal
    }
  ): Promise<T> {
    const { params, body, headers = {}, signal } = options ?? {}
    const url = `${BASE}${path}${serializeQuery(params)}`
    const defaultHeaders = getAuthHeaders()
    const finalHeaders = { ...defaultHeaders, ...headers }

    const fetchOptions: RequestInit = {
      method,
      headers: finalHeaders,
      signal,
    }

    if (body !== undefined) {
      // allow callers to send raw FormData etc by passing body that is not an object
      if (body instanceof FormData || body instanceof Blob) {
        fetchOptions.body = body
        // do not set content-type: browser sets FormData boundary
      } else if (typeof body === 'object') {
        finalHeaders['Content-Type'] = finalHeaders['Content-Type'] ?? 'application/json'
        fetchOptions.body = JSON.stringify(body)
      } else {
        fetchOptions.body = String(body)
        finalHeaders['Content-Type'] = finalHeaders['Content-Type'] ?? 'text/plain'
      }
    }

    const res = await fetch(url, fetchOptions)
    return normalizeFetch(res) as Promise<T>
  }

  return {
    get: <T = any>(path: string, opts?: { params?: Record<string, any>; headers?: Record<string, string>; signal?: AbortSignal }) =>
      request<T>('GET', path, { params: opts?.params, headers: opts?.headers, signal: opts?.signal }),
    post: <T = any>(path: string, body?: any, opts?: { params?: Record<string, any>; headers?: Record<string, string>; signal?: AbortSignal }) =>
      request<T>('POST', path, { body, params: opts?.params, headers: opts?.headers, signal: opts?.signal }),
    put: <T = any>(path: string, body?: any, opts?: { params?: Record<string, any>; headers?: Record<string, string>; signal?: AbortSignal }) =>
      request<T>('PUT', path, { body, params: opts?.params, headers: opts?.headers, signal: opts?.signal }),
    patch: <T = any>(path: string, body?: any, opts?: { params?: Record<string, any>; headers?: Record<string, string>; signal?: AbortSignal }) =>
      request<T>('PATCH', path, { body, params: opts?.params, headers: opts?.headers, signal: opts?.signal }),
    delete: <T = any>(path: string, opts?: { params?: Record<string, any>; headers?: Record<string, string>; signal?: AbortSignal }) =>
      request<T>('DELETE', path, { params: opts?.params, headers: opts?.headers, signal: opts?.signal }),
    ApiError,
  }
}
