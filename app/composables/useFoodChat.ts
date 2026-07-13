import { computed } from 'vue'
import { useFoodChatStore } from '~/stores/foodchat'
import { useHouseholdStore } from '~/stores/household'
import type { MemorySuggestion, PlanParameterValues } from '~/services/foodchatApi'

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

  async function applyPlanParameters(values: PlanParameterValues) {
    if (!store.activeSessionId || !memberId.value) return
    return store.applyPlanParameters(store.activeSessionId, memberId.value, values)
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
    sendMessage,
    loadMoreMessages,
    submitMessageFeedback,
    submitMemoryDecision,
    applyPlanParameters,
    activeDiners,
    updateDiners,
    setLocalDiners,
    clearError
  }
}
