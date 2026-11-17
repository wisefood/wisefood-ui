<template>
  <div class="rounded-lg border border-gray-200/70 bg-gray-50/60 p-3 text-sm dark:border-white/10 dark:bg-white/[0.03]">
    <div
      v-if="loading"
      class="animate-pulse space-y-2"
      role="status"
      aria-label="Loading what was said"
    >
      <div class="h-3 w-2/3 rounded bg-gray-200 dark:bg-zinc-800" />
      <div class="h-3 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
    </div>

    <p
      v-else-if="!transcript"
      class="text-gray-500 dark:text-gray-400"
    >
      {{ unavailable }}
    </p>

    <div
      v-else
      class="space-y-3"
    >
      <p
        v-if="!exchange.reply && !exchange.asked.length"
        class="text-gray-500 dark:text-gray-400"
      >
        This turn could not be found in the conversation. It may have been deleted, or the conversation was cut short.
      </p>

      <template v-else>
        <div
          v-for="message in exchange.asked"
          :key="message.id"
          class="rounded-md bg-white px-3 py-2 dark:bg-zinc-900"
        >
          <p class="mb-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500 dark:text-gray-400">
            <span class="font-medium text-gray-700 dark:text-gray-200">They wrote</span>
            <span v-if="message.intent">FoodChat read it as: {{ chatStepLabel(message.intent) }}</span>
          </p>
          <p class="whitespace-pre-line break-words text-gray-900 dark:text-white">
            {{ message.content }}<span
              v-if="message.truncated"
              class="text-gray-400"
            > … (cut short)</span>
          </p>
        </div>
        <div
          v-if="exchange.reply"
          class="rounded-md bg-gray-100/70 px-3 py-2 dark:bg-white/5"
        >
          <p class="mb-0.5 text-xs font-medium text-gray-700 dark:text-gray-200">
            FoodChat replied
          </p>
          <p class="whitespace-pre-line break-words text-gray-900 dark:text-white">
            {{ exchange.reply.content }}<span
              v-if="exchange.reply.truncated"
              class="text-gray-400"
            > … (cut short)</span>
          </p>
        </div>

        <ConsoleInsightsPlanRequestSummary
          v-if="plan"
          :request="plan.request"
        />

        <p
          v-if="exchange.how === 'order'"
          class="text-xs text-amber-700 dark:text-amber-300"
        >
          Matched by its place in the conversation, because the times did not line up. If this visit joined the conversation part-way, it may be a different turn.
        </p>
      </template>

      <div class="flex flex-wrap items-center gap-2">
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          :icon="showAll ? 'i-lucide-chevron-up' : 'i-lucide-list'"
          :aria-expanded="showAll"
          @click="showAll = !showAll"
        >
          {{ showAll ? 'Hide the conversation' : `Show the whole conversation (${transcript.messages.length} messages)` }}
        </UButton>
      </div>

      <ol
        v-if="showAll"
        class="max-h-[28rem] space-y-2 overflow-y-auto pr-1"
        aria-label="The whole conversation"
      >
        <li
          v-for="message in transcript.messages"
          :key="message.id"
          class="rounded-md px-3 py-2"
          :class="[
            message.role === 'user' ? 'bg-white dark:bg-zinc-900' : 'bg-gray-100/70 dark:bg-white/5',
            isThisTurn(message) ? 'ring-1 ring-brand-300 dark:ring-brand-500/40' : ''
          ]"
        >
          <p class="mb-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500 dark:text-gray-400">
            <span class="font-medium text-gray-700 dark:text-gray-200">{{ message.role === 'user' ? 'Member' : 'FoodChat' }}</span>
            <span v-if="message.timestamp">{{ timeOfDay(message.timestamp) }}</span>
            <span v-if="message.intent">{{ chatStepLabel(message.intent) }}</span>
            <span
              v-if="isThisTurn(message)"
              class="font-medium text-brand-600 dark:text-brand-300"
            >this turn</span>
          </p>
          <p class="whitespace-pre-line break-words text-gray-900 dark:text-white">
            {{ message.content }}<span
              v-if="message.truncated"
              class="text-gray-400"
            > … (cut short)</span>
          </p>
        </li>
        <li
          v-if="transcript.truncated"
          class="text-xs text-gray-500 dark:text-gray-400"
        >
          The conversation is longer; only its first {{ transcript.messages.length }} messages are shown.
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import insightsApi, { type ConversationReview } from '~/services/insightsApi'
import { chatStepLabel } from '~/utils/labels'
import { findTurnExchange } from '~/utils/turnExchange'

/**
 * What was said in one FoodChat turn of a session's story: the person's words,
 * FoodChat's reply and, when the turn made a plan, what that plan was asked
 * for. The whole conversation is one click further. Reviewers only; the
 * gateway records each read.
 */

const props = defineProps<{
  conversationId: string
  occurredAt?: string | null
  number?: number | null
  planId?: string | null
}>()

const loading = ref(true)
const review = ref<ConversationReview | null>(null)
const showAll = ref(false)

const transcript = computed(() => (review.value?.available ? review.value.transcript : null))

const unavailable = computed(() =>
  review.value?.reason ?? 'The conversation could not be loaded. FoodChat or the gateway did not answer.'
)

const exchange = computed(() =>
  findTurnExchange(transcript.value?.messages ?? [], {
    occurredAt: props.occurredAt,
    number: props.number,
    planId: props.planId
  })
)

/** The plan this turn made, from the reply's stamp or the story's own record. */
const plan = computed(() => {
  const id = exchange.value.reply?.plan_id || props.planId
  if (!id) return null
  return transcript.value?.plans.find(p => p.plan_id === id) ?? null
})

const turnIds = computed(() => new Set([
  ...exchange.value.asked.map(m => m.id),
  ...(exchange.value.reply ? [exchange.value.reply.id] : [])
]))

function isThisTurn(message: { id: number }) {
  return turnIds.value.has(message.id)
}

function timeOfDay(iso: string) {
  const at = new Date(iso)
  return Number.isNaN(at.getTime()) ? '' : at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

onMounted(async () => {
  review.value = await insightsApi.getConversation(props.conversationId)
  loading.value = false
})
</script>
