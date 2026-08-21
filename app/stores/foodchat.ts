import { defineStore } from 'pinia'
import foodchatApi from '~/services/foodchatApi'
import type {
  SavedPlan,
  ChatSession,
  ChatMessage,
  MealPlan,
  WeeklyMealPlan,
  UnifiedChatResponse,
  ComposePick,
  ConversationResponse,
  MemorySuggestion,
  PlanParameterValues,
  SessionDinersResponse,
  PlanningState,
  FacetChip,
  Vocabularies,
  FoodChatTool
} from '~/services/foodchatApi'

interface SessionDiners {
  cooking_for: string[]
  cooking_for_names: string[]
}

interface FoodChatState {
  sessions: ChatSession[]
  activeSessionId: string | null
  messages: ChatMessage[]
  hasMoreMessages: boolean
  nextBeforeId: number | null
  mealPlans: MealPlan[]
  weeklyMealPlans: WeeklyMealPlan[]
  lastResponse: UnifiedChatResponse | null
  /** Diner selection ("cooking for") persisted per session, client-side */
  dinersBySession: Record<string, SessionDiners>
  /** Plans the member saved — outlive their conversations */
  savedPlans: SavedPlan[]
  savedPlanIds: string[]
  /**
   * What is standing for the active session: pantry, inferred facets, a diet
   * stated in chat. Server-held, so unlike the per-message extras it survives
   * a reload — which is the point of reading it at all.
   */
  planningState: PlanningState | null
  planningStateLoading: boolean
  /** The facet vocabulary the corpus carries. Fetched once, process-wide. */
  vocabularies: Vocabularies | null
  /** The tool manifest, generated from FoodChat's registry. Fetched once. */
  tools: FoodChatTool[]
  /** Name of the tool currently running, so one spinner can't claim them all. */
  runningTool: string | null
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
    savedPlans: [],
    savedPlanIds: [],
    planningState: null,
    planningStateLoading: false,
    vocabularies: null,
    tools: [],
    runningTool: null,
    mealPlans: [],
    weeklyMealPlans: [],
    lastResponse: null,
    dinersBySession: {},
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

    /**
     * Every standing facet as a chip, flattened across the four families.
     *
     * Flattened because the member does not think in families: "light" is a
     * thing they asked for, and whether FoodChat read it as a mood or a
     * flavour is an implementation detail. The family rides along only so the
     * chip can be labelled.
     */
    facetChips: (state): FacetChip[] => {
      const facets = state.planningState?.facets
      if (!facets) return []
      const families: Array<FacetChip['family']> = [
        'cuisines', 'moods', 'flavor_profiles', 'food_groups'
      ]
      return families.flatMap(family =>
        (facets[family] || []).map(value => ({ family, value }))
      )
    },

    /** On-hand ingredients FoodChat is planning around. */
    pantryItems: (state): string[] => state.planningState?.pantry ?? [],

    /**
     * True when the member has told us something that shapes the next plan.
     *
     * Used to decide whether the panel is worth showing at all: an empty
     * pantry with no facets is not a state worth a header.
     */
    hasStandingConstraints: (state): boolean => {
      const ps = state.planningState
      if (!ps) return false
      return Boolean(
        ps.pantry.length
        || ps.diet_tags.length
        || ps.claim_tags.length
        || Object.values(ps.facets).some(values => values.length)
      )
    },

    /** Tools that change a plan, separated from the ones that only read it. */
    mutatingTools: (state): FoodChatTool[] => state.tools.filter(t => t.mutates),
    readOnlyTools: (state): FoodChatTool[] => state.tools.filter(t => !t.mutates),

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

    clarificationPending: (state): boolean =>
      state.lastResponse?.needs_clarification === true,

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

    async createSession(memberId: string, cookingFor?: string[]) {
      this.error = null
      try {
        const session = await foodchatApi.createSession(memberId, cookingFor)
        this.sessions.unshift(session)
        if (cookingFor?.length) {
          this.dinersBySession[session.session_id] = { cooking_for: cookingFor, cooking_for_names: [] }
        }
        await this.selectSession(session.session_id, memberId)
        return session
      } catch (err: any) {
        this.error = err.message || 'Failed to create session'
        throw err
      }
    },

    async renameSession(sessionId: string, memberId: string, title: string) {
      this.error = null
      try {
        const updated = await foodchatApi.renameSession(sessionId, memberId, title)
        this.sessions = this.sessions.map(s =>
          s.session_id === sessionId ? { ...s, title: updated.title } : s
        )
      } catch (err: any) {
        this.error = err.message || 'Failed to rename session'
        throw err
      }
    },

    /** Save (or unsave) a plan so it outlives its conversation. */
    async savePlan(
      sessionId: string,
      planId: string,
      memberId: string,
      saved: boolean,
      title?: string
    ) {
      this.error = null
      try {
        await foodchatApi.savePlan(sessionId, planId, memberId, saved, title)
        this.savedPlanIds = saved
          ? [...new Set([...this.savedPlanIds, planId])]
          : this.savedPlanIds.filter(id => id !== planId)
      } catch (err: any) {
        this.error = err.message || 'Failed to save plan'
        throw err
      }
    },

    async loadSavedPlans(memberId: string) {
      try {
        const saved = await foodchatApi.getSavedPlans(memberId)
        this.savedPlans = saved
        this.savedPlanIds = saved.map(p => p.plan_id)
      } catch {
        // A saved-plans listing that fails to load must not poison the chat
        // UI — the member can still plan; the bookmark states self-correct
        // on the next successful load.
      }
    },

    async deleteSession(sessionId: string) {
      this.error = null
      try {
        await foodchatApi.deleteSession(sessionId)
        this.sessions = this.sessions.filter(s => s.session_id !== sessionId)
        delete this.dinersBySession[sessionId]
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
        await this.ingestTurnResponse(sessionId, memberId, response)
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

    /** Shared post-processing for turn-shaped responses (chat + plan-parameters) */
    async ingestTurnResponse(sessionId: string, memberId: string, response: UnifiedChatResponse) {
      this.lastResponse = response

      // Re-fetch conversation for ground truth
      await this.fetchConversation(sessionId, memberId)

      // Attribution, memory suggestions, changed-slot proofs and the
      // plan-parameter card are not persisted server-side, so carry them from
      // the live response onto the just-fetched assistant message (client-side only)
      if (
        response.attribution
        || response.memory_suggestions?.length
        || response.changed_slots?.length
        || response.plan_parameters
      ) {
        const lastAssistant = [...this.messages].reverse().find(m => m.role === 'assistant')
        if (lastAssistant) {
          if (response.attribution) lastAssistant.attribution = response.attribution
          if (response.memory_suggestions?.length) {
            lastAssistant.memory_suggestions = response.memory_suggestions
          }
          if (response.changed_slots?.length) {
            lastAssistant.changed_slots = response.changed_slots
          }
          if (response.plan_parameters) {
            lastAssistant.plan_parameters = response.plan_parameters
          }
        }
      }

      // Always refresh both plan lists so stale plans don't hide the new type
      await Promise.all([
        this.fetchMealPlans(sessionId, memberId),
        this.fetchWeeklyMealPlans(sessionId, memberId)
      ])

      // Refresh session metadata
      const idx = this.sessions.findIndex(s => s.session_id === sessionId)
      if (idx !== -1) {
        try {
          const updated = await foodchatApi.getSession(sessionId, memberId)
          this.sessions[idx] = updated
        } catch { /* non-critical */ }
      }
    },

    // ----------------------------------------------------------------
    // Manual mode (hand-picked recipes → FoodChat fills the rest)
    // ----------------------------------------------------------------
    async composePlan(
      sessionId: string,
      memberId: string,
      picks: ComposePick[],
      planType: 'daily' | 'weekly' = 'daily',
      message?: string
    ) {
      this.sending = true
      this.error = null
      try {
        const response = await foodchatApi.composePlan(sessionId, {
          member_id: memberId,
          picks,
          plan_type: planType,
          message: message || null
        })
        await this.ingestTurnResponse(sessionId, memberId, response)
        return response
      } catch (err: any) {
        this.error = err.message || 'Failed to compose plan'
        throw err
      } finally {
        this.sending = false
      }
    },

    // ----------------------------------------------------------------
    // Plan parameters (interactive slider card)
    // ----------------------------------------------------------------
    async applyPlanParameters(
      sessionId: string,
      memberId: string,
      values: PlanParameterValues,
      planType?: 'daily' | 'weekly'
    ) {
      this.sending = true
      this.error = null
      try {
        const response = await foodchatApi.applyPlanParameters(sessionId, {
          member_id: memberId,
          values,
          plan_type: planType
        })
        // The canonical user message is added server-side; the conversation
        // refetch inside ingestTurnResponse picks it up
        await this.ingestTurnResponse(sessionId, memberId, response)
        return response
      } catch (err: any) {
        this.error = err.message || 'Failed to apply plan settings'
        throw err
      } finally {
        this.sending = false
      }
    },

    // ----------------------------------------------------------------
    // Memory suggestions
    // ----------------------------------------------------------------
    async submitMemoryDecision(
      sessionId: string,
      memberId: string,
      decision: 'accept' | 'decline',
      suggestion: MemorySuggestion
    ): Promise<boolean> {
      const res = await foodchatApi.submitMemoryDecision(sessionId, {
        member_id: memberId,
        decision,
        suggestion
      })
      return res?.applied === true
    },

    // ----------------------------------------------------------------
    // Diners ("cooking for")
    // ----------------------------------------------------------------
    async updateDiners(sessionId: string, memberId: string, cookingFor: string[]): Promise<SessionDinersResponse> {
      const res = await foodchatApi.updateSessionDiners(sessionId, memberId, cookingFor)
      this.dinersBySession[sessionId] = {
        cooking_for: res.cooking_for ?? cookingFor,
        cooking_for_names: res.cooking_for_names ?? []
      }
      return res
    },

    setLocalDiners(sessionId: string, cookingFor: string[], names: string[] = []) {
      this.dinersBySession[sessionId] = { cooking_for: cookingFor, cooking_for_names: names }
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
    // Standing planning state — the pantry panel and the facet chips
    // ----------------------------------------------------------------

    /**
     * What FoodChat is currently planning around.
     *
     * Failure leaves the previous value alone rather than clearing it: a
     * transient error should not make the member's pantry appear to have been
     * forgotten. `null` means never loaded; `{...}` with empty arrays means
     * loaded and genuinely empty, and the panel needs to tell those apart.
     */
    async fetchPlanningState(sessionId: string, memberId: string) {
      this.planningStateLoading = true
      try {
        this.planningState = await foodchatApi.getPlanningState(sessionId, memberId)
      } catch {
        // keep whatever we had
      } finally {
        this.planningStateLoading = false
      }
    },

    /**
     * Replace the pantry with exactly these items.
     *
     * Every mutation below returns the resulting state and stores it, so the
     * panel never has to re-fetch to find out what its own write did.
     */
    async setPantry(sessionId: string, memberId: string, items: string[]) {
      this.planningState = await foodchatApi.setPantry(sessionId, memberId, items)
      return this.planningState
    },

    async addPantryItems(sessionId: string, memberId: string, items: string[]) {
      this.planningState = await foodchatApi.addPantryItems(sessionId, memberId, items)
      return this.planningState
    },

    async removePantryItem(sessionId: string, memberId: string, item: string) {
      this.planningState = await foodchatApi.removePantryItem(sessionId, memberId, item)
      return this.planningState
    },

    /** Take back one inferred facet. Does NOT re-plan — see `replan`. */
    async removeFacet(sessionId: string, memberId: string, value: string) {
      this.planningState = await foodchatApi.removeFacet(sessionId, memberId, value)
      return this.planningState
    },

    /**
     * Re-plan from the standing state.
     *
     * Separate from the writes above on purpose: removing three chips should
     * produce one plan, not three. Routes through `ingestTurnResponse` like
     * every other turn-shaped response, so the canvas, the message list and
     * the plan lists all update the same way they do after a chat turn.
     */
    async replan(sessionId: string, memberId: string, planType?: 'daily' | 'weekly') {
      this.sending = true
      this.error = null
      try {
        const response = await foodchatApi.replan(sessionId, memberId, planType)
        await this.ingestTurnResponse(sessionId, memberId, response)
        await this.fetchPlanningState(sessionId, memberId)
        return response
      } catch (err: any) {
        this.error = err.message || 'Failed to update the plan'
        throw err
      } finally {
        this.sending = false
      }
    },

    /**
     * The facet vocabulary the corpus actually carries.
     *
     * Fetched once and kept: it is the same for every member and changes only
     * when the corpus is re-annotated. An empty result is the signal to offer
     * nothing rather than to guess — a value the corpus does not carry does
     * not soften a search, it empties it.
     */
    async fetchVocabularies() {
      if (this.vocabularies) return this.vocabularies
      try {
        this.vocabularies = await foodchatApi.getVocabularies()
      } catch {
        this.vocabularies = {}
      }
      return this.vocabularies
    },

    // ----------------------------------------------------------------
    // Tools
    // ----------------------------------------------------------------

    /** The tool manifest. Generated from FoodChat's registry, so it can't drift. */
    async fetchTools() {
      if (this.tools.length) return this.tools
      try {
        this.tools = await foodchatApi.listTools()
      } catch {
        this.tools = []
      }
      return this.tools
    },

    /**
     * Run one tool.
     *
     * A tool that mutates the plan is followed by the same refresh a turn gets,
     * because it has changed the canvas the member is looking at. A reader is
     * left alone — re-fetching the world to answer "what are the totals" would
     * make a read look like an edit.
     */
    async invokeTool<T = Record<string, unknown>>(
      toolName: string,
      memberId: string,
      args: Record<string, unknown>,
      opts: { mutates?: boolean, sessionId?: string } = {}
    ): Promise<T> {
      this.runningTool = toolName
      this.error = null
      try {
        const result = await foodchatApi.invokeTool<T>(toolName, memberId, args)
        const sessionId = opts.sessionId ?? (args.session_id as string | undefined)
        if (opts.mutates && sessionId) {
          await Promise.all([
            this.fetchMealPlans(sessionId, memberId),
            this.fetchWeeklyMealPlans(sessionId, memberId)
          ])
        }
        return result
      } catch (err: any) {
        // A ToolError is a 400 carrying member-facing prose — "this plan
        // covers Monday to Wednesday" — so it is worth showing verbatim
        // rather than replacing with a generic failure.
        this.error = err?.data?.detail || err.message || `Could not run ${toolName}`
        throw err
      } finally {
        this.runningTool = null
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
        dinersBySession: {},
        planningState: null,
        planningStateLoading: false,
        runningTool: null,
        sessionsLoading: false,
        messagesLoading: false,
        loadingMoreMessages: false,
        sending: false,
        error: null
      })
    }
  }
})
