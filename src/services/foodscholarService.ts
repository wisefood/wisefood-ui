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
    user_context?: string
    session_title?: string | null
    metadata?: { title?: string }
    messages: Message[]
  }
}

export type SessionHistoryResult = SessionHistoryResponse['result']

export type ChatResponsePayload = {
  session_id: string
  response: {
    answer: string
    facts?: { fact: string; category?: string; confidence?: string }[] | null
    references?: { source_type?: string; description?: string }[] | null
    follow_up_suggestions?: string[] | null
  }
  timestamp?: string
  is_first_message?: boolean
  session_title?: string | null
}

export type StartSessionResult = {
  session_id: string
  session_title?: string | null
  metadata?: { title?: string }
  user_context?: string
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
  return api.get<SessionHistoryResult>(`${PATH}/sessions/${id}/history`, { signal })
}

export type StartSessionPayload = {
  title?: string
  memberId?: string
}

export async function startNewSession(payload?: StartSessionPayload, signal?: AbortSignal) {
  const { memberId, title } = payload ?? {}
  const body = title !== undefined ? { title } : undefined

  return api.post<StartSessionResult>(`${PATH}/sessions`, body, {
    signal,
    params: memberId ? { member_id: memberId } : undefined,
  })
}

export async function chatInSession(session_id: string, message: string, signal?: AbortSignal) {
  const id = encodeURIComponent(session_id)
  return api.post<ChatResponsePayload>(`${PATH}/chat/${id}`, { message }, { signal })
}
