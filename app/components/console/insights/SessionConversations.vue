<template>
  <UCard
    :ui="{ body: 'p-0' }"
    class="overflow-hidden border border-gray-200/70 dark:border-white/10"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
      <div class="min-w-0">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          FoodChat conversations
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Each conversation as the turns they took: what each turn was for, the plan it made, and what it had to look up.
        </p>
      </div>
      <span
        v-if="conversations.length"
        class="shrink-0 text-xs text-gray-400 dark:text-gray-500"
      >
        {{ conversations.length }} conversation{{ conversations.length === 1 ? '' : 's' }}
      </span>
    </div>

    <ConsoleInsightsEmptyState
      v-if="!conversations.length"
      title="No FoodChat in this session."
      :hint="usedFoodChat
        ? 'FoodChat was opened, but none of its turns have been linked to this session yet. Turns are linked within a minute of being reported; older sessions need the one-off backfill.'
        : 'Nothing in this visit went to FoodChat.'"
      icon="i-lucide-messages-square"
    />

    <ul
      v-else
      class="divide-y divide-gray-100 dark:divide-zinc-800"
    >
      <li
        v-for="conv in conversations"
        :key="conv.conversation_id"
        class="px-5 py-4"
      >
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span class="shrink-0 font-mono text-xs tabular-nums text-gray-400 dark:text-gray-500">
            {{ formatTime(conv.started_at) }}
          </span>
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            {{ conv.turns }} turn{{ conv.turns === 1 ? '' : 's' }}
          </span>
          <UBadge
            v-if="conv.plans_generated"
            color="neutral"
            variant="subtle"
            size="sm"
            icon="i-lucide-utensils"
          >
            {{ planSummary(conv) }}
          </UBadge>
          <UBadge
            v-if="conv.plans_saved"
            color="success"
            variant="subtle"
            size="sm"
            icon="i-lucide-bookmark-check"
          >
            {{ conv.plans_saved }} saved
          </UBadge>
          <UBadge
            v-else-if="conv.plans_generated"
            color="neutral"
            variant="outline"
            size="sm"
          >
            none saved
          </UBadge>
          <UBadge
            v-if="conv.failed_turns"
            color="error"
            variant="subtle"
            size="sm"
          >
            {{ conv.failed_turns }} failed
          </UBadge>
          <span class="ml-auto shrink-0 text-xs tabular-nums text-gray-400 dark:text-gray-500">
            <template v-if="conv.llm_calls">{{ conv.llm_calls }} model call{{ conv.llm_calls === 1 ? '' : 's' }} · ${{ conv.cost_usd.toFixed(4) }}</template>
          </span>
        </div>

        <div class="mt-2.5">
          <ConsoleInsightsJourneyPath :steps="conv.path" />
        </div>

        <UButton
          color="neutral"
          variant="link"
          size="xs"
          class="mt-2 px-0"
          :trailing-icon="isOpen(conv.conversation_id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          :aria-expanded="isOpen(conv.conversation_id)"
          @click="toggle(conv.conversation_id)"
        >
          {{ isOpen(conv.conversation_id) ? 'Hide the turns' : 'Show the turns' }}
        </UButton>

        <ol
          v-if="isOpen(conv.conversation_id)"
          class="mt-2 space-y-2 border-l border-gray-200 pl-4 dark:border-zinc-700"
        >
          <li
            v-for="(step, index) in conv.steps"
            :key="index"
            class="text-sm"
          >
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span class="w-20 shrink-0 font-mono text-xs tabular-nums text-gray-400 dark:text-gray-500">
                {{ formatTime(step.occurred_at) }}
              </span>

              <template v-if="step.kind === 'turn'">
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ step.outcome === 'ok' ? chatStepLabel(step.intent || 'unknown') : chatStepLabel(step.outcome) }}
                </span>
                <span
                  v-if="step.opening_turn"
                  class="text-xs text-gray-400 dark:text-gray-500"
                >opened the conversation</span>
                <span
                  v-if="step.latency_ms !== null"
                  class="ml-auto shrink-0 font-mono text-xs tabular-nums"
                  :class="(step.latency_ms ?? 0) > 15000 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'"
                  :title="step.llm_calls ? `${step.llm_calls} model calls` : undefined"
                >
                  {{ formatSeconds(step.latency_ms) }}
                </span>
              </template>
              <template v-else-if="step.kind === 'plan_saved'">
                <span class="font-medium text-emerald-700 dark:text-emerald-300">Saved the plan</span>
              </template>
              <template v-else>
                <span class="font-medium text-gray-900 dark:text-white">{{ planLine(step) }}</span>
              </template>
            </div>

            <div
              v-if="step.kind === 'turn' && (step.plan || step.lookups.length)"
              class="mt-1 space-y-0.5 pl-0 text-xs text-gray-500 sm:pl-[5.75rem] dark:text-gray-400"
            >
              <p v-if="step.plan">
                <UIcon
                  name="i-lucide-utensils"
                  class="mr-1 inline h-3 w-3 align-[-2px]"
                />{{ planLine(step.plan) }}
              </p>
              <p
                v-for="(lookup, li) in step.lookups"
                :key="li"
                :class="lookup.zero_result ? 'text-amber-600 dark:text-amber-400' : ''"
              >
                <UIcon
                  name="i-lucide-search"
                  class="mr-1 inline h-3 w-3 align-[-2px]"
                />Looked up
                <span class="font-medium">{{ lookup.query ? `“${lookup.query}”` : 'recipes' }}</span>
                — {{ lookup.zero_result ? 'found nothing' : `${(lookup.results ?? 0).toLocaleString()} found` }}{{ lookup.relaxed ? ', after loosening' : '' }}
              </p>
            </div>
          </li>
          <li
            v-if="conv.steps_truncated"
            class="text-xs text-gray-400 dark:text-gray-500"
          >
            Later steps are not shown.
          </li>
        </ol>
      </li>
    </ul>

    <p
      v-if="conversations.length"
      class="border-t border-gray-200/70 px-5 py-2.5 text-xs text-gray-400 dark:border-white/10 dark:text-gray-500"
    >
      What members type into FoodChat is never recorded here — only what each turn was routed to and what came of it.
    </p>
  </UCard>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ChatConversation, ChatPlanMade } from '~/services/insightsApi'
import { chatStepLabel } from '~/utils/labels'

/**
 * A session's FoodChat conversations, as the steps somebody took.
 *
 * The question this answers is the one the counts above cannot: not "three
 * plans", but that the first plan was refined twice, a lookup found nothing,
 * a turn failed, and they left without saving. The path is always shown; the
 * turn-by-turn detail opens on request, except when there is only one
 * conversation and opening it is the only thing to do.
 */
const props = defineProps<{
  conversations: ChatConversation[]
  /** The session reached FoodChat at all, by the gateway's own record. */
  usedFoodChat?: boolean
}>()

const open = ref(new Set<string>())

watch(
  () => props.conversations,
  (next) => {
    if (next.length === 1 && next[0]) open.value = new Set([next[0].conversation_id])
  },
  { immediate: true }
)

const isOpen = (id: string) => open.value.has(id)

function toggle(id: string) {
  const next = new Set(open.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  open.value = next
}

function planSummary(conv: ChatConversation): string {
  const made = `${conv.plans_generated} plan${conv.plans_generated === 1 ? '' : 's'}`
  return conv.plans_refined ? `${made}, ${conv.plans_refined} refined` : made
}

function planLine(plan: ChatPlanMade): string {
  const kind = plan.plan_type ? `${plan.plan_type} plan` : 'plan'
  const verb = plan.refinement ? `Refined the ${kind}` : `Made a ${kind}`
  const parts = [verb]
  if (plan.version && plan.version > 1) parts.push(`version ${plan.version}`)
  if (plan.item_count) parts.push(`${plan.item_count} dish${plan.item_count === 1 ? '' : 'es'}`)
  return parts.join(' · ')
}

const formatTime = (value: string | null) => {
  if (!value) return ''
  const when = new Date(value)
  return Number.isNaN(when.getTime()) ? '' : when.toLocaleTimeString()
}

const formatSeconds = (ms: number | null) => {
  if (ms === null) return ''
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}
</script>
