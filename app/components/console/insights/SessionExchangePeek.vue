<template>
  <div class="rounded-lg border border-gray-200/70 bg-gray-50/60 p-3 text-sm dark:border-white/10 dark:bg-white/[0.03]">
    <div
      v-if="loading"
      class="animate-pulse space-y-2"
      role="status"
      aria-label="Loading the exchange"
    >
      <div class="h-3 w-2/3 rounded bg-gray-200 dark:bg-zinc-800" />
      <div class="h-3 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
    </div>

    <p
      v-else-if="!messages.length"
      class="text-gray-500 dark:text-gray-400"
    >
      {{ unavailable }}
    </p>

    <div
      v-else
      class="space-y-3"
    >
      <p class="text-xs text-gray-500 dark:text-gray-400">
        {{ messages.length }} of {{ total }} messages in this conversation, around the one that was rated.
      </p>
      <ol class="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
        <li
          v-for="message in messages"
          :key="message.id"
          class="rounded-md px-3 py-2"
          :class="message.is_rated
            ? 'bg-red-50 ring-1 ring-red-300 dark:bg-red-500/10 dark:ring-red-500/40'
            : message.role === 'user'
              ? 'bg-white dark:bg-zinc-900'
              : 'bg-gray-100/70 dark:bg-white/5'"
        >
          <p class="mb-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500 dark:text-gray-400">
            <span class="font-medium text-gray-700 dark:text-gray-200">{{ message.role === 'user' ? 'Member' : 'FoodChat' }}</span>
            <span v-if="message.intent">{{ chatStepLabel(message.intent) }}</span>
            <span
              v-if="message.is_rated"
              class="font-medium text-red-600 dark:text-red-400"
            >the rated reply</span>
          </p>
          <p class="whitespace-pre-line break-words text-gray-900 dark:text-white">
            {{ message.content }}<span
              v-if="message.truncated"
              class="text-gray-400"
            > … (cut short)</span>
          </p>
          <div
            v-if="message.plan_id"
            class="mt-2"
          >
            <UButton
              size="xs"
              color="neutral"
              variant="outline"
              :icon="openPlans.has(message.plan_id) ? 'i-lucide-chevron-up' : 'i-lucide-utensils'"
              @click="togglePlan(message.plan_id)"
            >
              {{ openPlans.has(message.plan_id) ? 'Hide the plan' : 'Show the plan in this reply' }}
            </UButton>
            <ConsoleInsightsSessionPlanPeek
              v-if="openPlans.has(message.plan_id)"
              :plan-id="message.plan_id"
              class="mt-2"
            />
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import insightsApi, { type FeedbackContext } from '~/services/insightsApi'
import { chatStepLabel } from '~/utils/labels'

/**
 * The FoodChat exchange a rating was about: the rated reply and the turns
 * either side of it, as FoodChat's review read returns them. Nothing wider —
 * enough to judge the rating, not a window onto the whole conversation.
 */

const props = defineProps<{ feedbackId: number }>()

const loading = ref(true)
const context = ref<FeedbackContext | null>(null)
const openPlans = reactive(new Set<string>())

const messages = computed(() => (context.value?.available ? context.value.exchange?.messages ?? [] : []))
const total = computed(() => context.value?.exchange?.session_messages ?? messages.value.length)

const unavailable = computed(() =>
  context.value?.reason ?? 'The exchange could not be loaded. FoodChat or the gateway did not answer.'
)

function togglePlan(planId: string) {
  if (openPlans.has(planId)) openPlans.delete(planId)
  else openPlans.add(planId)
}

onMounted(async () => {
  context.value = await insightsApi.getFeedbackContext(props.feedbackId)
  loading.value = false
})
</script>
