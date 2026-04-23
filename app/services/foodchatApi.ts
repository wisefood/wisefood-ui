import { useAuthStore } from '~/stores/auth'
import { getWisefoodRestApiUrl } from '~/utils/runtimeConfig'

// ============================================================================
// Timeout Configuration
// ============================================================================
const DEFAULT_TIMEOUT = 30000
const MESSAGE_TIMEOUT = 180000 // 3 minutes for AI responses

// ============================================================================
// Type Definitions
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
  id?: number
  role: 'user' | 'assistant'
  content: string
  intent?: string
  timestamp: string
}

export interface MealRecipe {
  recipe_id: string
  title: string
  ingredients: string
  directions: string
}

export interface MealPlan {
  id: string
  created_at: string
  version?: number
  parent_id?: string
  breakfast?: MealRecipe
  lunch?: MealRecipe
  dinner?: MealRecipe
  reasoning?: string
  llm_score?: number
  llm_reasoning?: string
  fvs_count?: number
  fvs_reasoning?: string
  diversity_llm_score?: number
  diversity_llm_reasoning?: string
  guideline_adherence_score?: number
  guideline_adherence_reasoning?: string
}

export interface WeeklyMealEntry {
  day: number
  meal_idx: number
  meal_type: string
  recipe: Record<string, unknown>
  reward: number
}

export interface WeeklyMealPlan {
  id: string
  created_at: string
  version?: number
  parent_id?: string
  entries: WeeklyMealEntry[]
}

export interface UnifiedChatRequest {
  content: string
  member_id: string
}

export interface UnifiedChatResponse {
  role: string
  content: string
  intent?: string
  needs_clarification: boolean
  meal_plan?: MealPlan
  weekly_meal_plan?: WeeklyMealPlan
  at_message_limit: boolean
  plan_version?: number
  plan_parent_id?: string
}

export interface ConversationResponse {
  messages: ChatMessage[]
  has_more: boolean
  next_before_id: number | null
}

export interface MessageFeedbackRequest {
  member_id: string
  rating: 'up' | 'down'
  comment?: string
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

// Legacy for backwards compat
export type SendMessageResponse = UnifiedChatResponse

// ============================================================================
// FoodChat API Service
// ============================================================================

class FoodChatApiService {
  private readonly basePath = '/foodchat'

  async getStatus(): Promise<FoodChatStatus> {
    return this.fetchWithTimeout<FoodChatStatus>(`${this.basePath}/status`, 'GET')
  }

  async createSession(memberId: string): Promise<ChatSession> {
    return this.fetchWithTimeout<ChatSession>(
      `${this.basePath}/sessions`,
      'POST',
      { member_id: memberId }
    )
  }

  async getSessions(memberId: string): Promise<ChatSession[]> {
    return this.fetchWithTimeout<ChatSession[]>(
      `${this.basePath}/members/${memberId}/sessions`,
      'GET'
    )
  }

  async getSession(sessionId: string): Promise<ChatSession> {
    return this.fetchWithTimeout<ChatSession>(
      `${this.basePath}/sessions/${sessionId}`,
      'GET'
    )
  }

  async deleteSession(sessionId: string): Promise<void> {
    return this.fetchWithTimeout<void>(
      `${this.basePath}/sessions/${sessionId}`,
      'DELETE'
    )
  }

  /** Unified chat endpoint — routes by intent */
  async unifiedChat(sessionId: string, req: UnifiedChatRequest): Promise<UnifiedChatResponse> {
    return this.fetchWithTimeout<UnifiedChatResponse>(
      `${this.basePath}/sessions/${sessionId}/chat`,
      'POST',
      req,
      MESSAGE_TIMEOUT
    )
  }

  /** Cursor-paginated conversation history */
  async getConversation(
    sessionId: string,
    memberId: string,
    beforeId?: number | null,
    limit = 20
  ): Promise<ConversationResponse> {
    const params = new URLSearchParams({ member_id: memberId, limit: String(limit) })
    if (beforeId != null) params.set('before_id', String(beforeId))
    return this.fetchWithTimeout<ConversationResponse>(
      `${this.basePath}/sessions/${sessionId}/conversation?${params}`,
      'GET'
    )
  }

  async getMealPlans(sessionId: string, memberId: string): Promise<MealPlan[]> {
    const params = new URLSearchParams({ member_id: memberId })
    return this.fetchWithTimeout<MealPlan[]>(
      `${this.basePath}/sessions/${sessionId}/meal-plans?${params}`,
      'GET'
    )
  }

  async getCurrentMealPlan(sessionId: string, memberId: string): Promise<MealPlan | null> {
    try {
      const params = new URLSearchParams({ member_id: memberId })
      return await this.fetchWithTimeout<MealPlan>(
        `${this.basePath}/sessions/${sessionId}/meal-plans/current?${params}`,
        'GET'
      )
    } catch {
      return null
    }
  }

  async getWeeklyMealPlans(sessionId: string, memberId: string): Promise<WeeklyMealPlan[]> {
    const params = new URLSearchParams({ member_id: memberId })
    return this.fetchWithTimeout<WeeklyMealPlan[]>(
      `${this.basePath}/sessions/${sessionId}/weekly-meal-plans?${params}`,
      'GET'
    )
  }

  async getCurrentWeeklyMealPlan(sessionId: string, memberId: string): Promise<WeeklyMealPlan | null> {
    try {
      const params = new URLSearchParams({ member_id: memberId })
      return await this.fetchWithTimeout<WeeklyMealPlan>(
        `${this.basePath}/sessions/${sessionId}/weekly-meal-plans/current?${params}`,
        'GET'
      )
    } catch {
      return null
    }
  }

  async submitMessageFeedback(
    sessionId: string,
    messageId: number,
    req: MessageFeedbackRequest
  ): Promise<void> {
    return this.fetchWithTimeout<void>(
      `${this.basePath}/sessions/${sessionId}/messages/${messageId}/feedback`,
      'POST',
      req
    )
  }

  // Legacy — kept for backwards compat with existing store
  async sendMessage(sessionId: string, content: string, memberId?: string): Promise<UnifiedChatResponse> {
    if (memberId) {
      return this.unifiedChat(sessionId, { content, member_id: memberId })
    }
    return this.fetchWithTimeout<UnifiedChatResponse>(
      `${this.basePath}/sessions/${sessionId}/messages`,
      'POST',
      { content },
      MESSAGE_TIMEOUT
    )
  }

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.fetchWithTimeout<ChatMessage[]>(
      `${this.basePath}/sessions/${sessionId}/messages`,
      'GET'
    )
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
    const baseUrl = getWisefoodRestApiUrl()
    const url = `${baseUrl}${endpoint}`

    const authStore = useAuthStore()
    const token = authStore.getToken()
    if (!token) throw new Error('No authentication token available')

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
        try { errorData = await response.json() } catch { errorData = await response.text() }

        if (response.status === 401) {
          const refreshed = await authStore.refreshToken()
          if (!refreshed && import.meta.client) await authStore.logout()
          throw new Error('Authentication failed. Please log in again.')
        }

        throw { message: `API request failed with status ${response.status}`, status: response.status, data: errorData }
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) return undefined as T

      const json = await response.json()
      if (json && typeof json === 'object' && 'result' in json) return json.result as T
      return json as T
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw { message: `Request timeout after ${timeoutMs / 1000}s. Please try again.`, status: 408, code: 'TIMEOUT' }
      }
      throw error
    }
  }
}

export default new FoodChatApiService()
