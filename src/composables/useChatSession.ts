// src/composables/useChatSession.ts
import { ref } from 'vue'
import * as foodScholarService from '@/services/foodscholarService'

export function useChatSession() {
  const messages = ref<foodScholarService.Message[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentSessionId = ref<string | null>(null)

  const selectSession = async (sessionId: string) => {
    currentSessionId.value = sessionId
    loading.value = true
    error.value = null
    try {
      const data = await foodScholarService.getSessionHistory(sessionId)
      messages.value = data.result.messages
    } catch (err: any) {
      error.value = err.message ?? String(err)
    } finally {
      loading.value = false
    }
  }

  const sendMessage = async (content: string) => {
    if (!currentSessionId.value) return
    try {
      const res = await foodScholarService.chatInSession(currentSessionId.value, content)
      messages.value.push({ type: 'human', content })
      if (res.result) messages.value.push(...res.result.messages)
    } catch (err: any) {
      console.error(err)
    }
  }

  return { messages, loading, error, selectSession, sendMessage, currentSessionId }
}
