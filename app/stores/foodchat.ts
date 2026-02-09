import { defineStore } from 'pinia'
import foodchatApi from '~/services/foodchatApi'
import type {
  ChatSession,
  ChatMessage,
  MealPlan,
  SendMessageResponse
} from '~/services/foodchatApi'

interface FoodChatState {
  sessions: ChatSession[]
  activeSessionId: string | null
  messages: ChatMessage[]
  mealPlans: MealPlan[]
  lastResponse: SendMessageResponse | null
  sessionsLoading: boolean
  messagesLoading: boolean
  sending: boolean
  error: string | null
}

export const useFoodChatStore = defineStore('foodchat', {
  state: (): FoodChatState => ({
    sessions: [],
    activeSessionId: null,
    messages: [],
    mealPlans: [],
    lastResponse: null,
    sessionsLoading: false,
    messagesLoading: false,
    sending: false,
    error: null
  }),

  getters: {
    activeSession: (state) =>
      state.sessions.find(s => s.session_id === state.activeSessionId) || null,

    sortedSessions: (state) =>
      [...state.sessions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),

    // Messages are already in chronological order from the API
    sortedMessages: (state) =>
      [...state.messages].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),

    // Collect meal plans from the dedicated endpoint + the last response
    activeMealPlans: (state): MealPlan[] => {
      const ids = new Set(state.mealPlans.map(p => p.id))
      const merged = [...state.mealPlans]

      // If the last send-message response included a meal plan, merge it in
      if (state.lastResponse?.meal_plan && !ids.has(state.lastResponse.meal_plan.id)) {
        merged.push(state.lastResponse.meal_plan)
      }

      return merged.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    },

    hasMealPlans(): boolean {
      return this.activeMealPlans.length > 0
    }
  },

  actions: {
    // ----------------------------------------------------------------
    // Sessions
    // ----------------------------------------------------------------
    async fetchSessions(memberId: string) {
      this.sessionsLoading = true
      this.error = null
      try {
        this.sessions = await foodchatApi.getSessions(memberId)
      } catch (err: any) {
        this.error = err.message || 'Failed to load sessions'
      } finally {
        this.sessionsLoading = false
      }
    },

    async createSession(memberId: string) {
      this.error = null
      try {
        const session = await foodchatApi.createSession(memberId)
        this.sessions.unshift(session)
        await this.selectSession(session.session_id)
        return session
      } catch (err: any) {
        this.error = err.message || 'Failed to create session'
        throw err
      }
    },

    async deleteSession(sessionId: string) {
      this.error = null
      try {
        await foodchatApi.deleteSession(sessionId)
        this.sessions = this.sessions.filter(s => s.session_id !== sessionId)
        if (this.activeSessionId === sessionId) {
          this.activeSessionId = null
          this.messages = []
          this.mealPlans = []
          this.lastResponse = null
        }
      } catch (err: any) {
        this.error = err.message || 'Failed to delete session'
        throw err
      }
    },

    async selectSession(sessionId: string) {
      this.activeSessionId = sessionId
      this.messages = []
      this.mealPlans = []
      this.lastResponse = null
      await Promise.all([
        this.fetchMessages(sessionId),
        this.fetchMealPlans(sessionId)
      ])
    },

    // ----------------------------------------------------------------
    // Messages
    // ----------------------------------------------------------------
    async fetchMessages(sessionId: string) {
      this.messagesLoading = true
      this.error = null
      try {
        this.messages = await foodchatApi.getMessages(sessionId)
      } catch (err: any) {
        this.error = err.message || 'Failed to load messages'
      } finally {
        this.messagesLoading = false
      }
    },

    async sendMessage(sessionId: string, content: string) {
      this.sending = true
      this.error = null

      // Optimistic user message
      const userMessage: ChatMessage = {
        role: 'user',
        content,
        timestamp: new Date().toISOString()
      }
      this.messages.push(userMessage)

      try {
        const response = await foodchatApi.sendMessage(sessionId, content)
        this.lastResponse = response

        // Re-fetch messages from API for ground truth
        await this.fetchMessages(sessionId)

        // If response includes a meal plan, refresh meal plans too
        if (response.meal_plan) {
          await this.fetchMealPlans(sessionId)
        }

        // Refresh session metadata (message_count may have changed)
        const sessionIdx = this.sessions.findIndex(s => s.session_id === sessionId)
        if (sessionIdx !== -1) {
          try {
            const updated = await foodchatApi.getSession(sessionId)
            this.sessions[sessionIdx] = updated
          } catch {
            // Non-critical; don't block on this
          }
        }

        return response
      } catch (err: any) {
        // Rollback optimistic message
        this.messages = this.messages.filter(m => m !== userMessage)
        this.error = err.message || 'Failed to send message'
        throw err
      } finally {
        this.sending = false
      }
    },

    // ----------------------------------------------------------------
    // Meal Plans
    // ----------------------------------------------------------------
    async fetchMealPlans(sessionId: string) {
      try {
        this.mealPlans = await foodchatApi.getMealPlans(sessionId)
      } catch {
        // Meal plans are supplementary; don't block UI on failure
        this.mealPlans = []
      }
    },

    // ----------------------------------------------------------------
    // Cleanup
    // ----------------------------------------------------------------
    reset() {
      this.sessions = []
      this.activeSessionId = null
      this.messages = []
      this.mealPlans = []
      this.lastResponse = null
      this.sessionsLoading = false
      this.messagesLoading = false
      this.sending = false
      this.error = null
    }
  }
})
