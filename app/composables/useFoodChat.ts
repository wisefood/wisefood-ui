import { computed } from 'vue'
import { useFoodChatStore } from '~/stores/foodchat'
import { useHouseholdStore } from '~/stores/household'

/**
 * Composable that bridges the FoodChat store with the active member context.
 * Provides a clean API for components to interact with FoodChat functionality.
 */
export function useFoodChat() {
  const store = useFoodChatStore()
  const householdStore = useHouseholdStore()

  const memberId = computed(() => householdStore.currentMember?.id ?? null)

  // ---- Reactive state (read-only) ----
  const sessions = computed(() => store.sortedSessions)
  const activeSession = computed(() => store.activeSession)
  const messages = computed(() => store.sortedMessages)
  const mealPlans = computed(() => store.activeMealPlans)
  const hasMealPlans = computed(() => store.hasMealPlans)

  const sessionsLoading = computed(() => store.sessionsLoading)
  const messagesLoading = computed(() => store.messagesLoading)
  const sending = computed(() => store.sending)
  const error = computed(() => store.error)

  // ---- Actions ----

  /** Load all sessions for the current member and auto-select the latest */
  async function loadSessions() {
    if (!memberId.value) return
    await store.fetchSessions(memberId.value)
    // Auto-select the most recent session so its messages and meal plans load
    const latest = store.sortedSessions[0]
    if (latest && !store.activeSessionId) {
      await store.selectSession(latest.session_id)
    }
  }

  /** Create a new chat session and select it */
  async function newSession() {
    if (!memberId.value) return
    return store.createSession(memberId.value)
  }

  /** Select an existing session and load its messages + meal plans */
  async function selectSession(sessionId: string) {
    await store.selectSession(sessionId)
  }

  /** Delete a session */
  async function deleteSession(sessionId: string) {
    await store.deleteSession(sessionId)
  }

  /** Send a message in the active session */
  async function sendMessage(content: string) {
    if (!store.activeSessionId) return
    return store.sendMessage(store.activeSessionId, content)
  }

  /** Clear any error */
  function clearError() {
    store.error = null
  }

  return {
    // State
    memberId,
    sessions,
    activeSession,
    messages,
    mealPlans,
    hasMealPlans,
    sessionsLoading,
    messagesLoading,
    sending,
    error,

    // Actions
    loadSessions,
    newSession,
    selectSession,
    deleteSession,
    sendMessage,
    clearError
  }
}
