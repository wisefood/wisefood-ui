<template>
  <div class="food-scholar">
    <ChatArea
      ref="chatAreaRef"
      :initial-entries="initialEntries"
      :auto-scroll-threshold="140"
    >
      <template #header>
        <div class="food-scholar__header">
          <div class="food-scholar__status">
            <span v-if="isLoadingHistory" class="food-scholar__status-pill">
              <span class="dot" aria-hidden="true" />
              Loading conversation…
            </span>
            <span
              v-else-if="errorMessage"
              class="food-scholar__status-pill food-scholar__status-pill--error"
            >
              {{ errorMessage }}
            </span>
            <span
              v-else-if="activeSessionTitle"
              class="food-scholar__status-pill food-scholar__status-pill--info"
            >
              Session: {{ activeSessionTitle }}
            </span>
          </div>
        </div>
      </template>

      <template #empty>
        <div class="food-scholar__empty">
          <h3>Start exploring culinary knowledge</h3>
          <p>
            Ask about ingredients, nutritional facts, cooking techniques, or heritage dishes and
            FoodScholar will guide you with trustworthy insights.
          </p>
        </div>
      </template>

      <template #footer>
        <Chatbar
          :loading="isSending"
          :disabled="isLoadingHistory"
          :suggestions="composerSuggestions"
          helper-text="Press Enter to send • Shift+Enter for a new line"
          @submit="handleChatMessage"
        />
      </template>
    </ChatArea>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ChatArea, { type ChatAreaEntryInput } from '@/components/ChatArea.vue'
import Chatbar from '@/components/Chatbar.vue'
import { useFoodScholarSessions } from '@/composables/useFoodscholarSessions'
import { useAppStore, type SidebarItem } from '@/stores/app'
import {
  chatInSession,
  getSessionHistory,
  type Message as FoodScholarMessage,
} from '@/services/foodscholarService'

const DEFAULT_SUGGESTIONS = [
  'What vitamins are in spinach?',
  'Is sourdough healthier than white bread?',
  'How can I cook lentils faster?',
  'Share protein-rich vegetarian dinners.',
]

const STATIC_SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: 'New Chat',
    to: '/food-scholar',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16" /><path d="M4 12h16" /></svg>',
  },
  {
    label: 'Data Catalog',
    to: '/applications',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12.75c4.418 0 8-1.12 8-2.5s-3.582-2.5-8-2.5-8 1.12-8 2.5 3.582 2.5 8 2.5z" /><path d="M4 10.25v6.5c0 1.38 3.582 2.5 8 2.5s8-1.12 8-2.5v-6.5" /><path d="M4 13.75c0 1.38 3.582 2.5 8 2.5s8-1.12 8-2.5" /></svg>',
  },
]

const appStore = useAppStore()
const route = useRoute()
const router = useRouter()

const chatAreaRef = ref<InstanceType<typeof ChatArea> | null>(null)
const initialEntries = ref<ChatAreaEntryInput[]>([])
const activeSessionId = ref<string | null>(null)
const activeSessionTitle = ref('')
const isLoadingHistory = ref(false)
const isSending = ref(false)
const errorMessage = ref<string | null>(null)
const followUpSuggestions = ref<string[]>([])

const { sidebarSessions, addSession, fetchSessions } = useFoodScholarSessions()

const composerSuggestions = computed(() =>
  followUpSuggestions.value.length ? followUpSuggestions.value : DEFAULT_SUGGESTIONS
)

const sessionSubtitle = computed(() => {
  if (activeSessionId.value) {
    return activeSessionTitle.value
      ? `Continuing session: ${activeSessionTitle.value}`
      : 'Continuing your FoodScholar conversation.'
  }
  return 'Start a new conversation or pick a previous chat from the sidebar.'
})

let historyRequestId = 0

const parseAssistantMessage = (message: FoodScholarMessage) => {
  const fallback = {
    answer: message.content ?? '',
    facts: [] as string[],
    references: [] as string[],
    followUps: [] as string[],
  }

  if (!message) return fallback

  if (message.structured_response) {
    const { answer, facts, references, follow_up_suggestions } = message.structured_response
    fallback.answer = typeof answer === 'string' ? answer : fallback.answer
    fallback.facts =
      facts?.map(fact => {
        const suffix = fact.confidence ? ` (confidence: ${fact.confidence})` : ''
        return fact.fact ? `${fact.fact}${suffix}` : ''
      }).filter((factString): factString is string => typeof factString === 'string' && factString.length) ??
      fallback.facts
    fallback.references =
      references
        ?.map(ref => [ref.source_type, ref.description].filter(Boolean).join(' · '))
        .filter(ref => ref.length) ?? fallback.references
    fallback.followUps =
      follow_up_suggestions?.filter(
        (suggestion): suggestion is string => typeof suggestion === 'string' && suggestion.trim().length > 0
      ) ?? []
    return fallback
  }

  try {
    const parsed = JSON.parse(message.content ?? '')
    fallback.answer = parsed.answer ?? fallback.answer
    fallback.facts =
      parsed.facts?.map((fact: any) => fact?.fact ?? String(fact)).filter(Boolean) ??
      fallback.facts
    fallback.references =
      parsed.references
        ?.map((ref: any) => [ref?.source_type, ref?.description].filter(Boolean).join(' · '))
        .filter((ref: unknown): ref is string => typeof ref === 'string' && ref.length) ??
      fallback.references
    fallback.followUps =
      parsed.follow_up_suggestions?.filter(
        (suggestion: unknown): suggestion is string =>
          typeof suggestion === 'string' && suggestion.trim().length > 0
      ) ?? fallback.followUps
  } catch {
    // ignore malformed json
  }

  return fallback
}

const transformMessagesToEntries = (messages: FoodScholarMessage[]): ChatAreaEntryInput[] => {
  const timestampSeed = Date.now()
  return messages.map((message, index) => {
    const createdAt = timestampSeed + index
    if (message.type === 'human') {
      return {
        kind: 'message',
        role: 'user',
        content: message.content ?? '',
        createdAt,
        metadata: { source: 'user' },
      } satisfies ChatAreaEntryInput
    }

    const structured = parseAssistantMessage(message)
    const facts = structured.facts.filter((fact): fact is string => typeof fact === 'string' && fact.length)
    const references = structured.references.filter(
      (reference): reference is string => typeof reference === 'string' && reference.length
    )
    const followUps = structured.followUps.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0
    )

    return {
      kind: 'response',
      content: structured.answer ?? '',
      facts,
      references,
      status: 'complete',
      createdAt,
      metadata: {
        followUps,
        source: 'assistant',
      },
    } satisfies ChatAreaEntryInput
  })
}

const updateFollowUpsFromEntries = (entries: ChatAreaEntryInput[]) => {
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    const entry = entries[i]
    if (entry.kind === 'response') {
      const metadata = entry.metadata as { followUps?: unknown } | undefined
      const rawFollowUps = metadata?.followUps
      if (!Array.isArray(rawFollowUps)) continue
      const suggestions = rawFollowUps.filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0
      )
      if (suggestions.length) {
        followUpSuggestions.value = suggestions
        return
      }
    }
  }
  followUpSuggestions.value = []
}

const loadSessionHistory = async (sessionId: string) => {
  const token = ++historyRequestId
  isLoadingHistory.value = true
  errorMessage.value = null

  try {
    const result = await getSessionHistory(sessionId)
    if (token !== historyRequestId) {
      return
    }

    if (!result || typeof result !== 'object') {
      throw new Error('Malformed history response')
    }

    const sessionIdentifier =
      (result as { session_id?: string }).session_id ?? sessionId

    activeSessionId.value = sessionIdentifier
    activeSessionTitle.value =
      (result as { session_title?: string }).session_title ??
      (result as { metadata?: { title?: string } }).metadata?.title ??
      activeSessionTitle.value

    const historyMessages = (result as { messages?: FoodScholarMessage[] }).messages ?? []
    const entries = transformMessagesToEntries(historyMessages)
    initialEntries.value = entries
    updateFollowUpsFromEntries(entries)

    nextTick(() => {
      if (chatAreaRef.value) {
        chatAreaRef.value.replaceConversation(entries)
        chatAreaRef.value.scrollToBottom('auto')
      }
    })
  } catch (err: any) {
    if (token !== historyRequestId) return
    const message =
      err?.response?.data?.message ??
      err?.message ??
      'Unable to load session history. Please try another session.'
    errorMessage.value = message
    initialEntries.value = []
    followUpSuggestions.value = []
  } finally {
    if (token === historyRequestId) {
      isLoadingHistory.value = false
    }
  }
}

const resetConversation = () => {
  activeSessionId.value = null
  activeSessionTitle.value = ''
  initialEntries.value = []
  followUpSuggestions.value = []
  errorMessage.value = null
  chatAreaRef.value?.clear()
}

const extractSessionId = (payload: unknown): string | undefined => {
  if (!payload || typeof payload !== 'object') return undefined
  const root = payload as Record<string, unknown>
  const result = root.result as Record<string, unknown> | undefined
  const session = root.session as Record<string, unknown> | undefined

  const candidates = [
    result?.session_id,
    root.session_id,
    session?.session_id,
    result?.id,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length) {
      return candidate
    }
  }

  return undefined
}

const ensureActiveSession = async (seedTitle: string) => {
  const existing = activeSessionId.value
  if (existing) {
    return existing
  }

  const title = seedTitle.trim().slice(0, 60) || 'New FoodScholar session'
  const newSession = await addSession(title)
  const sessionId = extractSessionId(newSession)

  if (!sessionId) {
    throw new Error('FoodScholar did not return a new session id.')
  }

  activeSessionId.value = sessionId
  activeSessionTitle.value = title

  if (route.query.session !== sessionId) {
    await router.replace({ path: '/food-scholar', query: { session: sessionId } })
  }
  return sessionId
}

const handleChatMessage = async (message: string) => {
  const trimmed = message.trim()
  if (!trimmed || isSending.value) return

  const chatArea = chatAreaRef.value
  if (!chatArea) return

  followUpSuggestions.value = []
  errorMessage.value = null
  isSending.value = true

  let sessionId: string | null = null
  let placeholderId: string | null = null

  try {
    sessionId = await ensureActiveSession(trimmed)

    chatArea.appendUserMessage(trimmed)
    placeholderId = chatArea.appendAssistantPlaceholder({
      placeholder: 'Gathering culinary insights…',
    })

    await chatInSession(sessionId, trimmed)
    await loadSessionHistory(sessionId)
    await fetchSessions()
  } catch (err: any) {
    const friendlyMessage =
      err?.response?.data?.message ??
      err?.message ??
      'FoodScholar could not respond right now. Please try again in a moment.'

    if (placeholderId) {
      chatArea.resolveAssistantResponse(placeholderId, {
        content: friendlyMessage,
        status: 'complete',
      })
    } else {
      chatArea.appendAssistantResponse({
        content: friendlyMessage,
        status: 'complete',
      })
    }

    errorMessage.value = friendlyMessage
  } finally {
    isSending.value = false
  }
}

watch(
  sidebarSessions,
  items => {
    appStore.setSidebarScrollItems(items)
  },
  { immediate: true }
)

watch(
  () => route.query.session,
  session => {
    if (typeof session === 'string' && session.length) {
      loadSessionHistory(session)
    } else {
      resetConversation()
    }
  },
  { immediate: true }
)

onMounted(() => {
  appStore.setSidebarFixedItems(STATIC_SIDEBAR_ITEMS)
})

onBeforeUnmount(() => {
  appStore.resetSidebar()
})
</script>

<style scoped>
.food-scholar {
  display: flex;
  flex-direction: column;
  gap: 1.0rem;
  min-height: 50vh;
}

.food-scholar :deep(.chat-area) {
  height: clamp(500px, 80vh, 920px);
}

.food-scholar__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.25rem;
}

.food-scholar__title {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.88);
}

.food-scholar__subtitle {
  margin: 0.2rem 0 0;
  color: rgba(71, 85, 105, 0.85);
  font-size: 0.95rem;
}

.food-scholar__status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.food-scholar__status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: rgba(148, 163, 184, 0.12);
  color: rgba(71, 85, 105, 0.85);
}

.food-scholar__status-pill--info {
  background: rgba(99, 102, 241, 0.12);
  color: rgba(100, 151, 46, 0.85);
}

.food-scholar__status-pill--error {
  background: rgba(248, 113, 113, 0.15);
  color: rgba(220, 38, 38, 0.85);
}

.food-scholar__status-pill .dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: currentColor;
  animation: food-scholar__pulse 1.1s ease-in-out infinite;
}

.food-scholar__empty {
  text-align: center;
  padding: 3rem 1rem;
  color: rgba(71, 85, 105, 0.85);
}

.food-scholar__empty h3 {
  margin-bottom: 0.75rem;
  font-size: 1.35rem;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.9);
}

.food-scholar__empty p {
  margin: 0 auto;
  max-width: 420px;
  line-height: 1.6;
}

@keyframes food-scholar__pulse {
  0%,
  100% {
    transform: scale(0.9);
    opacity: 0.6;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 1024px) {
  .food-scholar__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .food-scholar :deep(.chat-area) {
    height: clamp(480px, 75vh, 860px);
  }
}
</style>
