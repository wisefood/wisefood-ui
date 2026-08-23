<template>
  <!--
    The pipeline's reasoning, shown the way ChatGPT shows its work: a compact
    header that narrates the current step while the agent runs, expandable to
    the full timeline, and collapsing to a one-line summary once the answer
    lands. Every line here is a step the backend actually took — searches with
    their rationales, the evidence ranking, notes it kept, verdicts — not
    decoration.
  -->
  <div
    v-if="steps.length"
    class="qa-reasoning-panel rounded-2xl border border-gray-200 dark:border-zinc-700/70 bg-white/60 dark:bg-zinc-900/40 overflow-hidden"
  >
    <button
      class="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 transition-colors"
      :aria-expanded="open"
      @click="open = !open"
    >
      <UIcon
        :name="live ? 'i-lucide-loader-2' : 'i-lucide-brain'"
        class="w-4 h-4 text-brandp-500 shrink-0"
        :class="{ 'animate-spin': live }"
      />
      <span class="text-sm font-medium text-gray-700 dark:text-zinc-200 truncate">
        {{ headerLabel }}
      </span>
      <span
        v-if="!open"
        class="text-[10px] px-1.5 py-0.5 rounded-full bg-brandp-50 dark:bg-brandp-900/30 text-brandp-600 dark:text-brandp-300 tabular-nums shrink-0"
      >{{ steps.length }}</span>
      <UIcon
        :name="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        class="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 ml-auto shrink-0"
      />
    </button>

    <div
      v-if="open"
      class="px-4 pb-3"
    >
      <ol class="space-y-1.5">
        <li
          v-for="step in steps"
          :key="step.id"
          class="flex items-start gap-2"
        >
          <UIcon
            :name="step.status === 'running' ? 'i-lucide-loader-2' : stepIcon(step.kind)"
            class="w-3.5 h-3.5 mt-0.5 shrink-0"
            :class="step.status === 'running'
              ? 'animate-spin text-brandp-500'
              : 'text-gray-400 dark:text-zinc-500'"
          />
          <div class="min-w-0 flex-1">
            <p class="text-xs text-gray-600 dark:text-zinc-300 leading-snug">
              {{ step.title }}
              <span
                v-if="step.status === 'done' && step.elapsed_ms && step.elapsed_ms >= 1000"
                class="text-gray-400 dark:text-zinc-500 tabular-nums font-light"
              >
                · {{ (step.elapsed_ms / 1000).toFixed(1) }}s
              </span>
            </p>
            <p
              v-if="step.detail"
              class="text-[11px] text-gray-400 dark:text-zinc-500 font-light leading-snug"
            >
              {{ step.detail }}
            </p>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { QaReasoningStep } from '~/services/foodscholarApi'

const props = withDefaults(defineProps<{
  steps: QaReasoningStep[]
  /** True while the pipeline is still streaming. */
  live?: boolean
  startOpen?: boolean
}>(), {
  live: false,
  startOpen: false
})

const { t } = useI18n()

const open = ref(props.startOpen || props.live)

// Mirror the ChatGPT affordance: open while thinking, collapsed once the
// answer arrives — the member can always reopen it.
watch(() => props.live, (now, was) => {
  if (now && !was) open.value = true
  if (was && !now) open.value = false
})

/** While collapsed and live, the header narrates the current running step. */
const headerLabel = computed(() => {
  if (props.live) {
    const running = [...props.steps].reverse().find(step => step.status === 'running')
    return running?.title || t('foodScholarHome.qa.reasoning.thinking')
  }
  return t('foodScholarHome.qa.reasoning.summary', { count: props.steps.length })
})

const STEP_ICONS: Record<QaReasoningStep['kind'], string> = {
  plan: 'i-lucide-clipboard-list',
  search: 'i-lucide-search',
  rank: 'i-lucide-arrow-down-wide-narrow',
  notes: 'i-lucide-sticky-note',
  evaluate: 'i-lucide-scale',
  repair: 'i-lucide-refresh-cw',
  answer: 'i-lucide-pen-line',
  cache: 'i-lucide-zap',
  clarification: 'i-lucide-circle-help'
}

function stepIcon(kind: QaReasoningStep['kind']): string {
  return STEP_ICONS[kind] || 'i-lucide-circle-check'
}
</script>

<style scoped>
.qa-reasoning-panel {
  backdrop-filter: blur(4px);
}
</style>
