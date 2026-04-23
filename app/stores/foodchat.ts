import { defineStore } from 'pinia'
import foodchatApi from '~/services/foodchatApi'
import type {
  ChatSession,
  ChatMessage,
  MealPlan,
  WeeklyMealPlan,
  UnifiedChatResponse,
  ConversationResponse
} from '~/services/foodchatApi'

interface FoodChatState {
  sessions: ChatSession[]
  activeSessionId: string | null
  messages: ChatMessage[]
  hasMoreMessages: boolean
  nextBeforeId: number | null
  mealPlans: MealPlan[]
  weeklyMealPlans: WeeklyMealPlan[]
  lastResponse: UnifiedChatResponse | null
  sessionsLoading: boolean
  messagesLoading: boolean
  loadingMoreMessages: boolean
  sending: boolean
  error: string | null
}

export const useFoodChatStore = defineStore('foodchat', {
  state: (): FoodChatState => ({
    sessions: [],
    activeSessionId: null,
    messages: [],
    hasMoreMessages: false,
    nextBeforeId: null,
    mealPlans: [],
    weeklyMealPlans: [],
    lastResponse: null,
    sessionsLoading: false,
    messagesLoading: false,
    loadingMoreMessages: false,
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

    // Messages are already oldest-first from the conversation endpoint
    sortedMessages: (state) => state.messages,

    activeMealPlans: (state): MealPlan[] => {
      const ids = new Set(state.mealPlans.map(p => p.id))
      const merged = [...state.mealPlans]
      if (state.lastResponse?.meal_plan && !ids.has(state.lastResponse.meal_plan.id)) {
        merged.push(state.lastResponse.meal_plan)
      }
      return merged.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    },

    activeWeeklyMealPlans: (state): WeeklyMealPlan[] => {
      const ids = new Set(state.weeklyMealPlans.map(p => p.id))
      const merged = [...state.weeklyMealPlans]
      if (state.lastResponse?.weekly_meal_plan && !ids.has(state.lastResponse.weekly_meal_plan.id)) {
        merged.push(state.lastResponse.weekly_meal_plan)
      }
      return merged.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    },

    hasMealPlans(): boolean {
      return this.activeMealPlans.length > 0
    },

    hasWeeklyMealPlans(): boolean {
      return this.activeWeeklyMealPlans.length > 0
    },

    // Whether any plan (daily or weekly) is present
    hasAnyPlan(): boolean {
      return this.hasMealPlans || this.hasWeeklyMealPlans
    },

    currentPlanType: (state): 'daily' | 'weekly' | null => {
      if (state.lastResponse?.weekly_meal_plan) return 'weekly'
      if (state.lastResponse?.meal_plan) return 'daily'
      if (state.weeklyMealPlans.length > 0 && state.mealPlans.length === 0) return 'weekly'
      if (state.mealPlans.length > 0) return 'daily'
      return null
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
        await this.selectSession(session.session_id, memberId)
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
          this.hasMoreMessages = false
          this.nextBeforeId = null
          this.mealPlans = []
          this.weeklyMealPlans = []
          this.lastResponse = null
        }
      } catch (err: any) {
        this.error = err.message || 'Failed to delete session'
        throw err
      }
    },

    async selectSession(sessionId: string, memberId: string) {
      this.activeSessionId = sessionId
      this.messages = []
      this.hasMoreMessages = false
      this.nextBeforeId = null
      this.mealPlans = []
      this.weeklyMealPlans = []
      this.lastResponse = null
      await Promise.all([
        this.fetchConversation(sessionId, memberId),
        this.fetchMealPlans(sessionId, memberId),
        this.fetchWeeklyMealPlans(sessionId, memberId)
      ])
    },

    // ----------------------------------------------------------------
    // Conversation (cursor-paginated)
    // ----------------------------------------------------------------
    async fetchConversation(sessionId: string, memberId: string) {
      this.messagesLoading = true
      this.error = null
      try {
        const res: ConversationResponse = await foodchatApi.getConversation(sessionId, memberId)
        this.messages = res.messages
        this.hasMoreMessages = res.has_more
        this.nextBeforeId = res.next_before_id
      } catch (err: any) {
        this.error = err.message || 'Failed to load conversation'
      } finally {
        this.messagesLoading = false
      }
    },

    async loadMoreMessages(sessionId: string, memberId: string) {
      if (!this.hasMoreMessages || this.loadingMoreMessages) return
      this.loadingMoreMessages = true
      try {
        const res: ConversationResponse = await foodchatApi.getConversation(
          sessionId, memberId, this.nextBeforeId
        )
        // Prepend older messages (API returns oldest-first)
        this.messages = [...res.messages, ...this.messages]
        this.hasMoreMessages = res.has_more
        this.nextBeforeId = res.next_before_id
      } catch {
        // silently ignore
      } finally {
        this.loadingMoreMessages = false
      }
    },

    // ----------------------------------------------------------------
    // Send (unified endpoint)
    // ----------------------------------------------------------------
    async sendMessage(sessionId: string, content: string, memberId: string) {
      this.sending = true
      this.error = null

      // Optimistic user message
      const optimistic: ChatMessage = {
        role: 'user',
        content,
        timestamp: new Date().toISOString()
      }
      this.messages.push(optimistic)

      try {
        const response = await foodchatApi.unifiedChat(sessionId, { content, member_id: memberId })
        this.lastResponse = response

        // Re-fetch conversation for ground truth
        await this.fetchConversation(sessionId, memberId)

        // Refresh plans based on response intent
        if (response.meal_plan) await this.fetchMealPlans(sessionId, memberId)
        if (response.weekly_meal_plan) await this.fetchWeeklyMealPlans(sessionId, memberId)

        // Refresh session metadata
        const idx = this.sessions.findIndex(s => s.session_id === sessionId)
        if (idx !== -1) {
          try {
            const updated = await foodchatApi.getSession(sessionId)
            this.sessions[idx] = updated
          } catch { /* non-critical */ }
        }

        return response
      } catch (err: any) {
        // Rollback optimistic message
        this.messages = this.messages.filter(m => m !== optimistic)
        this.error = err.message || 'Failed to send message'
        throw err
      } finally {
        this.sending = false
      }
    },

    // ----------------------------------------------------------------
    // Meal Plans
    // ----------------------------------------------------------------
    async fetchMealPlans(sessionId: string, memberId: string) {
      try {
        this.mealPlans = await foodchatApi.getMealPlans(sessionId, memberId)
      } catch {
        this.mealPlans = []
      }
    },

    async fetchWeeklyMealPlans(sessionId: string, memberId: string) {
      try {
        this.weeklyMealPlans = await foodchatApi.getWeeklyMealPlans(sessionId, memberId)
      } catch {
        this.weeklyMealPlans = []
      }
    },

    // ----------------------------------------------------------------
    // Cleanup
    // ----------------------------------------------------------------
    reset() {
      this.$patch({
        sessions: [],
        activeSessionId: null,
        messages: [],
        hasMoreMessages: false,
        nextBeforeId: null,
        mealPlans: [],
        weeklyMealPlans: [],
        lastResponse: null,
        sessionsLoading: false,
        messagesLoading: false,
        loadingMoreMessages: false,
        sending: false,
        error: null
      })
    }
  }
})
