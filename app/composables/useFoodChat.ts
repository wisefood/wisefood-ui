import { computed, ref } from 'vue'
import { useFoodChatStore } from '~/stores/foodchat'
import { useHouseholdStore } from '~/stores/household'
import type { ComposePick, FoodChatTool, MemorySuggestion, PlanParameterValues } from '~/services/foodchatApi'

export function useFoodChat() {
  const store = useFoodChatStore()
  const householdStore = useHouseholdStore()

  const memberId = computed(() => householdStore.currentMember?.id ?? null)

  // ---- Reactive state ----
  const sessions = computed(() => store.sortedSessions)
  const activeSession = computed(() => store.activeSession)
  const messages = computed(() => store.sortedMessages)
  const mealPlans = computed(() => store.activeMealPlans)
  const weeklyMealPlans = computed(() => store.activeWeeklyMealPlans)
  const hasMealPlans = computed(() => store.hasMealPlans)
  const hasWeeklyMealPlans = computed(() => store.hasWeeklyMealPlans)
  const hasAnyPlan = computed(() => store.hasAnyPlan)
  const clarificationPending = computed(() => store.clarificationPending)
  const currentPlanType = computed(() => store.currentPlanType)
  const hasMoreMessages = computed(() => store.hasMoreMessages)
  const loadingMoreMessages = computed(() => store.loadingMoreMessages)

  const sessionsLoading = computed(() => store.sessionsLoading)
  const messagesLoading = computed(() => store.messagesLoading)
  const sending = computed(() => store.sending)
  const error = computed(() => store.error)

  // ---- Actions ----

  async function loadSessions() {
    if (!memberId.value) return
    await store.fetchSessions(memberId.value)
    const latest = store.sortedSessions[0]
    if (latest && !store.activeSessionId) {
      await store.selectSession(latest.session_id, memberId.value)
    }
  }

  async function newSession(cookingFor?: string[]) {
    if (!memberId.value) return
    return store.createSession(memberId.value, cookingFor)
  }

  async function selectSession(sessionId: string) {
    if (!memberId.value) return
    await store.selectSession(sessionId, memberId.value)
  }

  async function deleteSession(sessionId: string) {
    await store.deleteSession(sessionId)
  }

  async function renameSession(sessionId: string, title: string) {
    if (!memberId.value) return
    await store.renameSession(sessionId, memberId.value, title)
  }

  /** Save (or unsave) a plan so it outlives its conversation. */
  async function savePlan(planId: string, saved: boolean, title?: string) {
    if (!store.activeSessionId || !memberId.value) return
    await store.savePlan(store.activeSessionId, planId, memberId.value, saved, title)
  }

  async function loadSavedPlans() {
    if (!memberId.value) return
    await store.loadSavedPlans(memberId.value)
  }

  async function sendMessage(content: string) {
    if (!store.activeSessionId || !memberId.value) return
    return store.sendMessage(store.activeSessionId, content, memberId.value)
  }

  async function loadMoreMessages() {
    if (!store.activeSessionId || !memberId.value) return
    await store.loadMoreMessages(store.activeSessionId, memberId.value)
  }

  async function submitMessageFeedback(messageId: number, rating: 'up' | 'down', comment?: string) {
    if (!store.activeSessionId || !memberId.value) return
    const { default: foodchatApi } = await import('~/services/foodchatApi')
    await foodchatApi.submitMessageFeedback(store.activeSessionId, messageId, {
      member_id: memberId.value,
      rating,
      comment
    })
  }

  async function submitMemoryDecision(decision: 'accept' | 'decline', suggestion: MemorySuggestion) {
    if (!store.activeSessionId || !memberId.value) return false
    return store.submitMemoryDecision(store.activeSessionId, memberId.value, decision, suggestion)
  }

  async function applyPlanParameters(
    values: PlanParameterValues,
    planType?: 'daily' | 'weekly'
  ) {
    if (!store.activeSessionId || !memberId.value) return
    return store.applyPlanParameters(store.activeSessionId, memberId.value, values, planType)
  }

  async function composePlan(
    picks: ComposePick[],
    planType: 'daily' | 'weekly' = 'daily',
    message?: string
  ) {
    if (!store.activeSessionId || !memberId.value) return
    return store.composePlan(store.activeSessionId, memberId.value, picks, planType, message)
  }

  // ---- Standing planning state (pantry, inferred facets, stated diet) ----

  /**
   * Pantry and facet edits are saved immediately but do NOT re-plan, so the
   * page has to know how many are waiting. Counted here rather than in the
   * store because it is a property of what the member is looking at: a fresh
   * plan clears it, and only the page knows when one arrives.
   */
  const pendingStateChanges = ref(0)

  async function loadPlanningState() {
    if (!store.activeSessionId || !memberId.value) return
    await store.fetchPlanningState(store.activeSessionId, memberId.value)
  }

  async function addPantryItems(items: string[]) {
    if (!store.activeSessionId || !memberId.value) return
    const before = store.planningState?.pantry.length ?? 0
    await store.addPantryItems(store.activeSessionId, memberId.value, items)
    // Only count it as pending if it actually changed something — re-adding
    // an item already in the pantry is not a change waiting to be applied.
    if ((store.planningState?.pantry.length ?? 0) !== before) pendingStateChanges.value += 1
  }

  async function removePantryItem(item: string) {
    if (!store.activeSessionId || !memberId.value) return
    const before = store.planningState?.pantry.length ?? 0
    await store.removePantryItem(store.activeSessionId, memberId.value, item)
    if ((store.planningState?.pantry.length ?? 0) !== before) pendingStateChanges.value += 1
  }

  async function addFacets(values: string[]) {
    if (!store.activeSessionId || !memberId.value) return
    await store.addFacets(store.activeSessionId, memberId.value, values)
    pendingStateChanges.value += 1
  }

  async function removeFacet(value: string) {
    if (!store.activeSessionId || !memberId.value) return
    await store.removeFacet(store.activeSessionId, memberId.value, value)
    pendingStateChanges.value += 1
  }

  /** Apply everything accumulated. One plan, however many edits. */
  async function replan(planType?: 'daily' | 'weekly') {
    if (!store.activeSessionId || !memberId.value) return
    const response = await store.replan(store.activeSessionId, memberId.value, planType)
    pendingStateChanges.value = 0
    return response
  }

  // ---- Tools ----

  /** The facet vocabulary the corpus carries. Fetched once, process-wide. */
  async function loadVocabularies() {
    return store.fetchVocabularies()
  }

  async function loadTools() {
    await store.fetchTools()
  }

  /**
   * Run one tool from the manifest.
   *
   * `session_id` is filled in here: the tool schemas declare it, the menu has
   * no business knowing it, and a caller that forgets it gets a 400 from the
   * registry rather than a tool acting on the wrong session.
   */
  async function invokeTool<T = Record<string, unknown>>(
    tool: FoodChatTool,
    args: Record<string, unknown> = {}
  ): Promise<T | undefined> {
    if (!store.activeSessionId || !memberId.value) return
    return store.invokeTool<T>(
      tool.name,
      memberId.value,
      { session_id: store.activeSessionId, ...args },
      { mutates: tool.mutates, sessionId: store.activeSessionId }
    )
  }

  const activeDiners = computed(() =>
    store.activeSessionId ? store.dinersBySession[store.activeSessionId] ?? null : null
  )

  async function updateDiners(cookingFor: string[]) {
    if (!store.activeSessionId || !memberId.value) return null
    return store.updateDiners(store.activeSessionId, memberId.value, cookingFor)
  }

  function setLocalDiners(cookingFor: string[], names: string[] = []) {
    if (!store.activeSessionId) return
    store.setLocalDiners(store.activeSessionId, cookingFor, names)
  }

  function clearError() {
    store.error = null
  }

  return {
    memberId,
    sessions,
    activeSession,
    messages,
    mealPlans,
    weeklyMealPlans,
    hasMealPlans,
    hasWeeklyMealPlans,
    hasAnyPlan,
    clarificationPending,
    currentPlanType,
    hasMoreMessages,
    loadingMoreMessages,
    sessionsLoading,
    messagesLoading,
    sending,
    error,

    loadSessions,
    newSession,
    selectSession,
    deleteSession,
    renameSession,
    savePlan,
    loadSavedPlans,
    savedPlans: computed(() => store.savedPlans),
    savedPlanIds: computed(() => store.savedPlanIds),
    sendMessage,
    loadMoreMessages,
    submitMessageFeedback,
    submitMemoryDecision,
    applyPlanParameters,
    composePlan,
    activeDiners,
    updateDiners,
    setLocalDiners,
    clearError,

    planningState: computed(() => store.planningState),
    planningStateLoading: computed(() => store.planningStateLoading),
    facetChips: computed(() => store.facetChips),
    hasStandingConstraints: computed(() => store.hasStandingConstraints),
    pendingStateChanges,
    loadPlanningState,
    addPantryItems,
    removePantryItem,
    addFacets,
    removeFacet,
    replan,

    vocabularies: computed(() => store.vocabularies),
    loadVocabularies,
    tools: computed(() => store.tools),
    runningTool: computed(() => store.runningTool),
    loadTools,
    invokeTool
  }
}
