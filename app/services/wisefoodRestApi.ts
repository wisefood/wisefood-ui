import { useAuthStore } from '~/stores/auth'
import { analyticsHeaders } from '~/composables/useAnalyticsSession'
import { getWisefoodRestApiUrl } from '~/utils/runtimeConfig'

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

interface ApiError {
  message: string
  status: number
  data?: unknown
}

/**
 * WiseFood REST API Service
 * Base URL: https://demo.wisefood-project.eu/rest/api/v1
 * Used for: Households, Members, Profiles
 */
class WiseFoodRestApiService {
  private getBaseUrl(): string {
    return getWisefoodRestApiUrl()
  }

  /**
   * Gets the authorization header with Keycloak JWT token
   */
  private getAuthHeaders(): HeadersInit {
    const authStore = useAuthStore()
    const token = authStore.getToken()

    if (!token) {
      throw new Error('No authentication token available')
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      // Which visit and which client this request belongs to. Never identity —
      // the bearer token is the only thing allowed to say who the caller is.
      ...analyticsHeaders(),
    }
  }

  /**
   * Builds URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.getBaseUrl()}${endpoint}`)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return url.toString()
  }

  /**
   * Handles API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: unknown
      try {
        errorData = await response.json()
      } catch {
        errorData = await response.text()
      }

      const error: ApiError = {
        message: `API request failed with status ${response.status}`,
        status: response.status,
        data: errorData
      }

      // Handle authentication errors
      if (response.status === 401) {
        const authStore = useAuthStore()
        // Try to refresh token
        const refreshed = await authStore.refreshToken()
        if (!refreshed) {
          // If refresh fails, redirect to login
          if (import.meta.client) {
            await authStore.logout()
          }
          error.message = 'Authentication failed. Please log in again.'
        }
      }

      throw error
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return undefined as T
    }

    // API returns { help, success, result } wrapper - extract result
    const json = await response.json()
    if (json && typeof json === 'object' && 'result' in json) {
      return json.result as T
    }
    return json as T
  }

  /**
   * Makes an authenticated GET request
   */
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options
    const url = this.buildUrl(endpoint, params)

    const response = await fetch(url, {
      method: 'GET',
      ...fetchOptions,
      // `...fetchOptions` goes FIRST: spread after `headers` it replaced
      // the whole merged object, so any caller passing its own headers
      // silently dropped Authorization along with everything else.
      headers: {
        ...this.getAuthHeaders(),
        ...fetchOptions.headers,
      },
    })

    return this.handleResponse<T>(response)
  }

  /**
   * Makes an authenticated POST request
   */
  async post<T, D = unknown>(endpoint: string, data?: D, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options
    const url = this.buildUrl(endpoint, params)

    const response = await fetch(url, {
      method: 'POST',
      ...fetchOptions,
      // `...fetchOptions` goes FIRST: spread after `headers` it replaced
      // the whole merged object, so any caller passing its own headers
      // silently dropped Authorization along with everything else.
      headers: {
        ...this.getAuthHeaders(),
        ...fetchOptions.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  /**
   * Makes an authenticated POST request and returns the raw streaming
   * Response (used for Server-Sent Events, e.g. FoodScholar's streaming QA).
   *
   * Unlike post(), the body is NOT consumed here — no envelope unwrapping,
   * no .json(). The caller reads `response.body` incrementally. Auth and the
   * one-shot 401 refresh mirror handleResponse(); EventSource cannot be used
   * because it cannot carry the Authorization header.
   */
  async postStream<D = unknown>(endpoint: string, data?: D, options: RequestOptions = {}): Promise<Response> {
    const { params, ...fetchOptions } = options
    const url = this.buildUrl(endpoint, params)

    const doFetch = () => fetch(url, {
      ...fetchOptions,
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        Accept: 'text/event-stream',
        ...fetchOptions.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    let response = await doFetch()

    if (response.status === 401) {
      const authStore = useAuthStore()
      const refreshed = await authStore.refreshToken()
      if (refreshed) {
        response = await doFetch()
      } else if (import.meta.client) {
        await authStore.logout()
      }
    }

    if (!response.ok || !response.body) {
      let errorData: unknown
      try {
        errorData = await response.json()
      } catch {
        errorData = await response.text().catch(() => undefined)
      }
      const error: ApiError = {
        message: `API request failed with status ${response.status}`,
        status: response.status,
        data: errorData
      }
      throw error
    }

    return response
  }

  /**
   * Makes an authenticated PUT request
   */
  async put<T, D = unknown>(endpoint: string, data?: D, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options
    const url = this.buildUrl(endpoint, params)

    const response = await fetch(url, {
      method: 'PUT',
      ...fetchOptions,
      // `...fetchOptions` goes FIRST: spread after `headers` it replaced
      // the whole merged object, so any caller passing its own headers
      // silently dropped Authorization along with everything else.
      headers: {
        ...this.getAuthHeaders(),
        ...fetchOptions.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  /**
   * Makes an authenticated PATCH request
   */
  async patch<T, D = unknown>(endpoint: string, data?: D, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options
    const url = this.buildUrl(endpoint, params)

    const response = await fetch(url, {
      method: 'PATCH',
      ...fetchOptions,
      // `...fetchOptions` goes FIRST: spread after `headers` it replaced
      // the whole merged object, so any caller passing its own headers
      // silently dropped Authorization along with everything else.
      headers: {
        ...this.getAuthHeaders(),
        ...fetchOptions.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  /**
   * Makes an authenticated DELETE request
   */
  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options
    const url = this.buildUrl(endpoint, params)

    const response = await fetch(url, {
      method: 'DELETE',
      ...fetchOptions,
      // `...fetchOptions` goes FIRST: spread after `headers` it replaced
      // the whole merged object, so any caller passing its own headers
      // silently dropped Authorization along with everything else.
      headers: {
        ...this.getAuthHeaders(),
        ...fetchOptions.headers,
      },
    })

    return this.handleResponse<T>(response)
  }
}

export default new WiseFoodRestApiService()
export type { ApiError, RequestOptions }
