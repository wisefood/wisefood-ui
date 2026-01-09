import { useAuthStore } from '~/stores/auth'

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

interface ApiError {
  message: string
  status: number
  data?: unknown
}

class WiseFoodApiService {
  private getBaseUrl(): string {
    // Get base URL from runtime config or use default
    const config = useRuntimeConfig()
    return (config.public.wisefoodApiUrl as string) || 'http://localhost:8080/api'
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
        data: errorData,
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

    return response.json()
  }

  /**
   * Makes an authenticated GET request
   */
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options
    const url = this.buildUrl(endpoint, params)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
        ...fetchOptions.headers,
      },
      ...fetchOptions,
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
      headers: {
        ...this.getAuthHeaders(),
        ...fetchOptions.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...fetchOptions,
    })

    return this.handleResponse<T>(response)
  }

  /**
   * Makes an authenticated PUT request
   */
  async put<T, D = unknown>(endpoint: string, data?: D, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options
    const url = this.buildUrl(endpoint, params)

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
        ...fetchOptions.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...fetchOptions,
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
      headers: {
        ...this.getAuthHeaders(),
        ...fetchOptions.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...fetchOptions,
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
      headers: {
        ...this.getAuthHeaders(),
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    })

    return this.handleResponse<T>(response)
  }
}

export default new WiseFoodApiService()
export type { ApiError, RequestOptions }
