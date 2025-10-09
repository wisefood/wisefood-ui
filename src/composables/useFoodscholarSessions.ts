
// src/composables/useFoodScholarSessions.ts
import { ref, computed, onMounted } from 'vue'
import * as foodScholarService from '@/services/foodscholarService'

export function useFoodScholarSessions() {
  const sessions = ref<foodScholarService.FoodScholarSession[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** Computed sidebar items based on current sessions */
  const sidebarSessions = computed(() =>
    sessions.value.map(session => ({
      label: session.metadata?.title ?? session.session_title ?? 'Untitled session',
      to: `/food-scholar?session=${session.session_id}`,
    }))
  )

  const fetchSessions = async () => {
    loading.value = true
    error.value = null
    try {
      const result = await foodScholarService.getSessions()
      sessions.value = result.sessions ?? []
    } catch (err: any) {
      error.value = err.message ?? String(err)
    } finally {
      loading.value = false
    }
  }

  /** Optional helper to add a new session locally and refetch */
  const addSession = async (title?: string) => {
    try {
      const newSession = await foodScholarService.startNewSession({ title })
      // refetch sessions to keep in sync with backend
      await fetchSessions()
      return newSession
    } catch (err: any) {
      throw err
    }
  }

  onMounted(() => fetchSessions())

  return { sessions, sidebarSessions, fetchSessions, addSession, loading, error }
}
