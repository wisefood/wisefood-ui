import { useAuthStore } from '~/stores/auth'

// ============================================================================
// Timeout Configuration
// ============================================================================
const DEFAULT_TIMEOUT = 30000
const MESSAGE_TIMEOUT = 120000 // 2 minutes for AI responses

// ============================================================================
// Type Definitions — aligned with actual API responses
// ============================================================================

export interface ChatSession {
  session_id: string
  member_id: string
  state: string
  message_count: number
  title?: string
  created_at: string
  updated_at?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface MealRecipe {
  recipe_id: string
  title: string
  ingredients: string   // comma-separated string from API
  directions: string    // paragraph string from API
}

export interface MealPlan {
  id: string
  created_at: string
  breakfast?: MealRecipe
  lunch?: MealRecipe
  dinner?: MealRecipe
  reasoning?: string
}

export interface SendMessageResponse {
  role: 'assistant'
  content: string
  needs_clarification: boolean
  meal_plan?: MealPlan
}

export interface FoodChatStatus {
  status: string
  version?: string
}

export interface ApiError {
  message: string
  status?: number
  code?: string
}

// ============================================================================
// FoodChat API Service
// ============================================================================

class FoodChatApiService {
  private readonly basePath = '/foodchat'

  /**
   * Health check
   */
  async getStatus(): Promise<FoodChatStatus> {
    try {
      return await this.fetchWithTimeout<FoodChatStatus>(
        `${this.basePath}/status`,
        'GET',
        undefined,
        DEFAULT_TIMEOUT
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to check FoodChat status')
    }
  }

  /**
   * Create a new chat session for a member
   */
  async createSession(memberId: string): Promise<ChatSession> {
    try {
      return await this.fetchWithTimeout<ChatSession>(
        `${this.basePath}/sessions`,
        'POST',
        { member_id: memberId },
        DEFAULT_TIMEOUT
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to create chat session')
    }
  }

  /**
   * Get all sessions for a member
   */
  async getSessions(memberId: string): Promise<ChatSession[]> {
    try {
      return await this.fetchWithTimeout<ChatSession[]>(
        `${this.basePath}/members/${memberId}/sessions`,
        'GET',
        undefined,
        DEFAULT_TIMEOUT
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch chat sessions')
    }
  }

  /**
   * Get session metadata
   */
  async getSession(sessionId: string): Promise<ChatSession> {
    try {
      return await this.fetchWithTimeout<ChatSession>(
        `${this.basePath}/sessions/${sessionId}`,
        'GET',
        undefined,
        DEFAULT_TIMEOUT
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch session')
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await this.fetchWithTimeout<void>(
        `${this.basePath}/sessions/${sessionId}`,
        'DELETE',
        undefined,
        DEFAULT_TIMEOUT
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to delete session')
    }
  }

  /**
   * Send a message to a session and get the assistant response
   */
  async sendMessage(sessionId: string, content: string): Promise<SendMessageResponse> {
    try {
      return await this.fetchWithTimeout<SendMessageResponse>(
        `${this.basePath}/sessions/${sessionId}/messages`,
        'POST',
        { content },
        MESSAGE_TIMEOUT
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to send message')
    }
  }

  /**
   * Fetch all messages for a session
   */
  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      return await this.fetchWithTimeout<ChatMessage[]>(
        `${this.basePath}/sessions/${sessionId}/messages`,
        'GET',
        undefined,
        DEFAULT_TIMEOUT
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch messages')
    }
  }

  /**
   * Fetch meal plans for a session
   */
  async getMealPlans(sessionId: string): Promise<MealPlan[]> {
    try {
      return await this.fetchWithTimeout<MealPlan[]>(
        `${this.basePath}/sessions/${sessionId}/meal-plans`,
        'GET',
        undefined,
        DEFAULT_TIMEOUT
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch meal plans')
    }
  }

  // ============================================================================
  // Private helpers
  // ============================================================================

  private async fetchWithTimeout<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE',
    data?: unknown,
    timeoutMs: number = DEFAULT_TIMEOUT
  ): Promise<T> {
    const config = useRuntimeConfig()
    const baseUrl = (config.public.wisefoodRestApiUrl as string) || 'https://wisefood.gr/rest/api/v1'
    const url = `${baseUrl}${endpoint}`

    const authStore = useAuthStore()
    const token = authStore.getToken()
    if (!token) {
      throw new Error('No authentication token available')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorData: unknown
        try {
          errorData = await response.json()
        } catch {
          errorData = await response.text()
        }

        if (response.status === 401) {
          const refreshed = await authStore.refreshToken()
          if (!refreshed && import.meta.client) {
            await authStore.logout()
          }
          throw new Error('Authentication failed. Please log in again.')
        }

        throw {
          message: `API request failed with status ${response.status}`,
          status: response.status,
          data: errorData
        }
      }

      // Handle empty responses (e.g. DELETE)
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
    } catch (error: any) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        throw {
          message: `Request timeout after ${timeoutMs / 1000} seconds. Please try again.`,
          status: 408,
          code: 'TIMEOUT'
        }
      }

      throw error
    }
  }

  private handleError(error: any, defaultMessage: string): ApiError {
    const apiError: ApiError = {
      message: defaultMessage,
      status: error?.status || 500
    }

    if (error?.message) {
      apiError.message = error.message
    }

    if (error?.code) {
      apiError.code = error.code
    }

    return apiError
  }
}

export default new FoodChatApiService()
