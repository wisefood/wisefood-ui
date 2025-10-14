<template>
  <section class="chat-area">
    <header v-if="$slots.header" class="chat-area__header">
      <slot name="header" />
    </header>

    <div
      ref="scrollContainer"
      class="chat-area__scroll"
      role="log"
      aria-live="polite"
      aria-label="Food facts assistant conversation"
      @scroll="handleScroll"
    >
      <template v-if="entries.length">
        <div
          v-for="entry in entries"
          :key="entry.id"
          class="chat-area__item"
          :data-role="entry.role"
          :data-kind="entry.kind"
        >
          <ChatMessage
            v-if="entry.kind === 'message'"
            :message="toChatMessagePayload(entry)"
          />

          <template v-else>
            <div v-if="isResponsePending(entry)" class="chat-area__thinking">
              <slot name="thinking" :entry="entry">
                <div class="thinking-indicator" aria-live="assertive">
                  <span class="dot" v-for="n in 3" :key="n" />
                </div>
                <p v-if="entry.placeholder" class="thinking-text">{{ entry.placeholder }}</p>
              </slot>
            </div>

            <div
              v-else
              class="chat-area__response"
              :class="{ 'chat-area__response--streaming': entry.status === 'streaming' }"
            >
              <ChatResponse
                :response="entry.content"
                :facts="entry.facts"
                :references="entry.references"
              />
              <div
                v-if="entry.status === 'streaming'"
                class="chat-area__streaming-indicator"
                aria-hidden="true"
              >
                <span class="dot" v-for="n in 3" :key="n" />
              </div>
            </div>
          </template>
        </div>
      </template>

      <div v-else class="chat-area__empty">
        <slot name="empty">
          <p class="chat-area__empty-text">
            Ask anything about nutrition, ingredients, or culinary history to get started.
          </p>
        </slot>
      </div>
    </div>

    <footer v-if="$slots.footer" class="chat-area__footer">
      <slot name="footer" />
    </footer>

    <button
      v-if="showScrollButton"
      type="button"
      class="chat-area__scroll-button"
      @click="scrollToBottom('smooth')"
      aria-label="Scroll to latest message"
    >
      <span aria-hidden="true">↓</span>
      <span class="chat-area__scroll-button-text">Latest</span>
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, withDefaults } from 'vue'
import ChatMessage from './ChatMessage.vue'
import ChatResponse from './ChatResponse.vue'

defineOptions({ name: 'ChatArea' })

type ChatRole = 'user' | 'assistant' | 'system'
type EntryKind = 'message' | 'response'
type ResponseStatus = 'pending' | 'streaming' | 'complete'

type Metadata = Record<string, unknown>

type ChatMessagePayload = {
  role: 'user' | 'ai' | 'assistant'
  content: string
}

interface EntryBase {
  id: string
  kind: EntryKind
  role: ChatRole
  createdAt: number
  metadata?: Metadata
}

interface MessageEntry extends EntryBase {
  kind: 'message'
  content: string
}

interface ResponseEntry extends EntryBase {
  kind: 'response'
  role: 'assistant'
  content: string
  facts: string[]
  references: string[]
  status: ResponseStatus
  placeholder?: string
}

type ChatEntry = MessageEntry | ResponseEntry

type MessageInput = {
  id?: string
  role?: Exclude<ChatRole, 'assistant'>
  content: string
  createdAt?: number
  metadata?: Metadata
}

type ResponseInput = {
  id?: string
  content: string
  facts?: string[]
  references?: string[]
  status?: ResponseStatus
  placeholder?: string
  createdAt?: number
  metadata?: Metadata
}

type EntryInput =
  | ({ kind: 'message' } & MessageInput)
  | ({ kind: 'response' } & ResponseInput)

const props = withDefaults(
  defineProps<{
    /**
     * Optional conversation history that will be rendered on mount.
     */
    initialEntries?: EntryInput[]
    /**
     * Pixel distance from the bottom of the scroll container that is still considered "near bottom".
     * Used to decide when to auto-scroll.
     */
    autoScrollThreshold?: number
  }>(),
  {
    initialEntries: () => [],
    autoScrollThreshold: 96,
  }
)

const emit = defineEmits<{
  (e: 'entry-added', entry: ChatEntry): void
  (e: 'entries-changed', entries: ChatEntry[]): void
}>()

const entries = ref<ChatEntry[]>([])
const scrollContainer = ref<HTMLDivElement | null>(null)
const isNearBottom = ref(true)
const threshold = computed(() => Math.max(32, props.autoScrollThreshold))
const showScrollButton = computed(
  () => !isNearBottom.value && entries.value.length > 0
)

let idCounter = 0
const createId = () => `chat-entry-${Date.now()}-${idCounter++}`

const cloneEntry = (entry: ChatEntry): ChatEntry => {
  if (entry.kind === 'response') {
    return {
      ...entry,
      facts: [...entry.facts],
      references: [...entry.references],
      metadata: entry.metadata ? { ...entry.metadata } : undefined,
    }
  }
  return {
    ...entry,
    metadata: entry.metadata ? { ...entry.metadata } : undefined,
  }
}

const normalizeEntry = (input: EntryInput): ChatEntry => {
  const base: Omit<EntryBase, 'kind'> = {
    id: input.id ?? createId(),
    role:
      input.kind === 'message'
        ? input.role ?? 'user'
        : 'assistant',
    createdAt: input.createdAt ?? Date.now(),
    metadata: input.metadata,
  }

  if (input.kind === 'message') {
    return {
      ...base,
      kind: 'message',
      content: input.content,
    }
  }

  return {
    ...base,
    kind: 'response',
    role: 'assistant',
    content: input.content ?? '',
    facts: input.facts ? [...input.facts] : [],
    references: input.references ? [...input.references] : [],
    status: input.status ?? 'complete',
    placeholder: input.placeholder,
  }
}

const sortByCreatedAt = (list: ChatEntry[]) =>
  [...list].sort((a, b) => a.createdAt - b.createdAt)

const toChatMessagePayload = (entry: MessageEntry): ChatMessagePayload => ({
  content: entry.content,
  role: entry.role === 'user' ? 'user' : 'ai',
})

const isResponsePending = (entry: ChatEntry): entry is ResponseEntry =>
  entry.kind === 'response' && entry.status === 'pending'

const requestScroll = (force = false) => {
  nextTick(() => {
    if (force || isNearBottom.value) {
      scrollToBottom('smooth')
    }
  })
}

const handleScroll = () => {
  const el = scrollContainer.value
  if (!el) return

  const distance =
    el.scrollHeight - (el.scrollTop + el.clientHeight)
  isNearBottom.value = distance <= threshold.value
}

const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
  const el = scrollContainer.value
  if (!el) return
  el.scrollTo({
    top: el.scrollHeight,
    behavior,
  })
  isNearBottom.value = true
}

watch(
  entries,
  newEntries => {
    emit(
      'entries-changed',
      newEntries.map(entry => cloneEntry(entry))
    )
  },
  { deep: true }
)

const setInitialEntries = (history: EntryInput[]) => {
  if (!history.length) {
    entries.value = []
    return
  }

  entries.value = sortByCreatedAt(history.map(normalizeEntry))
  requestScroll(true)
}

watch(
  () => props.initialEntries,
  value => {
    if (value && value.length) {
      setInitialEntries(value)
    } else if (!entries.value.length) {
      entries.value = []
    }
  },
  { immediate: true, deep: true }
)

const appendUserMessage = (
  content: string,
  options: {
    id?: string
    role?: Exclude<ChatRole, 'assistant'>
    metadata?: Metadata
    createdAt?: number
    scroll?: boolean
  } = {}
) => {
  const entry: MessageEntry = {
    id: options.id ?? createId(),
    kind: 'message',
    role: options.role ?? 'user',
    content,
    createdAt: options.createdAt ?? Date.now(),
    metadata: options.metadata,
  }

  entries.value.push(entry)
  emit('entry-added', cloneEntry(entry))
  requestScroll(options.scroll !== false)
  return entry.id
}

const appendAssistantPlaceholder = (
  options: {
    id?: string
    placeholder?: string
    metadata?: Metadata
    createdAt?: number
    scroll?: boolean
  } = {}
) => {
  const entry: ResponseEntry = {
    id: options.id ?? createId(),
    kind: 'response',
    role: 'assistant',
    content: '',
    facts: [],
    references: [],
    status: 'pending',
    placeholder: options.placeholder ?? 'Thinking…',
    createdAt: options.createdAt ?? Date.now(),
    metadata: options.metadata,
  }

  entries.value.push(entry)
  emit('entry-added', cloneEntry(entry))
  requestScroll(options.scroll !== false)
  return entry.id
}

const findResponseEntry = (id: string) =>
  entries.value.find(
    (entry): entry is ResponseEntry =>
      entry.id === id && entry.kind === 'response'
  )

const updateAssistantResponse = (
  id: string,
  patch: {
    content?: string
    appendContent?: string
    facts?: string[]
    references?: string[]
    status?: ResponseStatus
    placeholder?: string | null
    metadata?: Metadata
    scroll?: boolean
  }
) => {
  const entry = findResponseEntry(id)
  if (!entry) {
    console.warn(`[ChatArea] Attempted to update missing response: ${id}`)
    return
  }

  if (typeof patch.content === 'string') {
    entry.content = patch.content
  }

  if (typeof patch.appendContent === 'string' && patch.appendContent.length) {
    entry.content = `${entry.content}${patch.appendContent}`
  }

  if (patch.facts) entry.facts = [...patch.facts]
  if (patch.references) entry.references = [...patch.references]
  if (patch.status) entry.status = patch.status

  if (patch.placeholder !== undefined) {
    entry.placeholder = patch.placeholder ?? undefined
  }

  if (patch.metadata) {
    entry.metadata = {
      ...(entry.metadata ?? {}),
      ...patch.metadata,
    }
  }

  requestScroll(patch.scroll === true)
}

const resolveAssistantResponse = (
  id: string,
  payload: {
    content: string
    facts?: string[]
    references?: string[]
    metadata?: Metadata
    status?: Exclude<ResponseStatus, 'pending'>
    scroll?: boolean
  }
) => {
  updateAssistantResponse(id, {
    content: payload.content,
    facts: payload.facts ?? [],
    references: payload.references ?? [],
    status: payload.status ?? 'complete',
    placeholder: null,
    metadata: payload.metadata,
    scroll: payload.scroll ?? true,
  })
  return id
}

const appendAssistantResponse = (
  payload: {
    content: string
    facts?: string[]
    references?: string[]
    metadata?: Metadata
    id?: string
    status?: ResponseStatus
    placeholder?: string
    scroll?: boolean
  }
) => {
  const responseId =
    payload.id ??
    appendAssistantPlaceholder({
      placeholder: payload.placeholder,
      metadata: payload.metadata,
      scroll: payload.scroll,
    })

  updateAssistantResponse(responseId, {
    content: payload.content,
    facts: payload.facts ?? [],
    references: payload.references ?? [],
    status: payload.status ?? 'complete',
    placeholder: null,
    metadata: payload.metadata,
    scroll: payload.scroll,
  })

  return responseId
}

const replaceConversation = (history: EntryInput[] = []) => {
  entries.value = history.length
    ? sortByCreatedAt(history.map(normalizeEntry))
    : []
  requestScroll(true)
}

const clear = () => {
  entries.value = []
}

onMounted(() => {
  nextTick(() => {
    handleScroll()
    if (entries.value.length) {
      scrollToBottom()
    }
  })
})

watch(
  entries,
  () => {
    if (isNearBottom.value) {
      requestScroll(true)
    }
  },
  { deep: true }
)

const getEntries = () => entries.value.map(entry => cloneEntry(entry))

defineExpose({
  appendUserMessage,
  appendAssistantPlaceholder,
  updateAssistantResponse,
  resolveAssistantResponse,
  appendAssistantResponse,
  replaceConversation,
  clear,
  scrollToBottom,
  getEntries,
})

export type ChatAreaEntryInput = EntryInput
</script>

<style scoped>
.chat-area {
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  overflow: hidden;
}

.chat-area__header,
.chat-area__footer {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.chat-area__footer {
  border-bottom: none;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
}

.chat-area__scroll {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  scroll-behavior: smooth;
}

.chat-area__scroll::-webkit-scrollbar {
  width: 10px;
}

.chat-area__scroll::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.35);
  border-radius: 9999px;
}

.chat-area__scroll::-webkit-scrollbar-track {
  background: transparent;
}

.chat-area__item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chat-area__thinking {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-radius: 14px;
  max-width: min(640px, 100%);
  background: rgba(99, 102, 241, 0.08);
  box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.1);
}

.thinking-indicator {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  height: 8px;
}

.thinking-indicator .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(45, 55, 72, 0.6);
  animation: chat-area__bounce 1.4s infinite ease-in-out;
}

.thinking-indicator .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.thinking-indicator .dot:nth-child(3) {
  animation-delay: 0.4s;
}

.thinking-text {
  margin: 0;
  font-size: 0.875rem;
  color: rgba(30, 41, 59, 0.8);
}

.chat-area__response {
  position: relative;
  max-width: min(720px, 100%);
}

.chat-area__response--streaming::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: linear-gradient(
    120deg,
    rgba(99, 102, 241, 0.18),
    rgba(99, 102, 241, 0.04),
    rgba(99, 102, 241, 0.18)
  );
  opacity: 0.25;
  animation: chat-area__sheen 2.8s linear infinite;
  pointer-events: none;
}

.chat-area__streaming-indicator {
  margin-top: 0.5rem;
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
}

.chat-area__streaming-indicator .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(79, 70, 229, 0.65);
  animation: chat-area__bounce 1.4s infinite ease-in-out;
}

.chat-area__streaming-indicator .dot:nth-child(2) {
  animation-delay: 0.18s;
}

.chat-area__streaming-indicator .dot:nth-child(3) {
  animation-delay: 0.36s;
}

.chat-area__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  text-align: center;
}

.chat-area__empty-text {
  margin: 0;
  max-width: 360px;
  color: rgba(71, 85, 105, 0.8);
  font-size: 0.95rem;
  line-height: 1.6;
}

.chat-area__scroll-button {
  position: absolute;
  right: 1.25rem;
  bottom: 1.25rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(79, 70, 229, 0.9);
  color: #fff;
  padding: 0.45rem 0.9rem;
  border-radius: 9999px;
  border: none;
  font-size: 0.75rem;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
  box-shadow: 0 12px 24px rgba(79, 70, 229, 0.2);
}

.chat-area__scroll-button:hover {
  transform: translateY(-2px);
  background: rgba(79, 70, 229, 1);
}

.chat-area__scroll-button-text {
  font-weight: 600;
  text-transform: uppercase;
}

@keyframes chat-area__bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  40% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

@keyframes chat-area__sheen {
  0% {
    opacity: 0.15;
  }
  50% {
    opacity: 0.35;
  }
  100% {
    opacity: 0.15;
  }
}

@media (max-width: 768px) {
  .chat-area__scroll {
    padding: 1rem;
  }

  .chat-area__scroll-button {
    right: 1rem;
    bottom: 1rem;
  }
}
</style>
