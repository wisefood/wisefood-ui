import { api } from '@/lib/api.ts'

const PATH = '/foodscholar'

export type FoodScholarSession = {
  session_id: string
  session_title?: string
  metadata?: { title?: string }
}

export type Message = {
  type: 'human' | 'ai'
  content: string
  structured_response?: {
    answer: string
    facts: { fact: string; category: string; confidence: string }[]
    references: { source_type: string; description: string }[]
    follow_up_suggestions: string[]
  }
}

export type SessionHistoryResponse = {
  help: string
  success: boolean
  result: {
    session_id: string
    user_context: string
    session_title: string
    messages: Message[]
  }
}

/**
 * All functions accept an optional AbortSignal to allow the caller
 * (component/composable) to cancel the request on unmount.
 */

export async function getStatus(signal?: AbortSignal) {
  return api.get(`${PATH}/status`, { signal })
}

export async function getSessions(signal?: AbortSignal) {
  return api.get<{ sessions?: FoodScholarSession[] }>(`${PATH}/sessions`, { signal })
}

export async function getSessionHistory(session_id: string, signal?: AbortSignal) {
  const id = encodeURIComponent(session_id)
  return api.get<SessionHistoryResponse>(`${PATH}/sessions/${id}/history`, { signal })
}

export async function startNewSession(body?: { title?: string }, signal?: AbortSignal) {
  return api.post(`${PATH}/sessions`, body, { signal })
}

export async function chatInSession(session_id: string, message: string, signal?: AbortSignal) {
  const id = encodeURIComponent(session_id)
  return api.post(`${PATH}/chat/${id}`, { message }, { signal })
}
