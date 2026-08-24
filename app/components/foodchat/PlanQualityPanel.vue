<template>
  <!--
    What the judges said about this plan.

    Extracted from the daily canvas so the weekly one can show it too. Weekly is
    the deepest plan the product makes — 21 meals — and it said the least about
    them: the two graders were instance attributes on the daily service, so no
    variety score, no diversity judgement and no guideline adherence ever
    reached a week, and this panel was wired to the daily plan object alone.

    `llm_score` is deliberately absent from what gets passed in. It is the
    grader's internal ranking of one candidate day against nine others, which
    means nothing to the person eating it.
  -->
  <div
    v-if="metrics.length"
    class="mb-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 overflow-hidden"
  >
    <button
      class="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors"
      @click="open = !open"
    >
      <span class="inline-flex items-center gap-1.5">
        <UIcon name="i-lucide-gauge" class="w-3.5 h-3.5 text-brandp-400" />
        {{ t('foodChatHome.quality.title') }}
      </span>
      <UIcon
        :name="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        class="w-3.5 h-3.5"
      />
    </button>
    <div v-show="open" class="px-3 pb-3 pt-1 space-y-2">
      <div
        v-for="metric in metrics"
        :key="metric.key"
        class="flex items-center gap-2"
      >
        <span class="w-24 shrink-0 text-[11px] font-light text-gray-500 dark:text-zinc-400">
          {{ metric.label }}
        </span>
        <template v-if="metric.max != null">
          <div class="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700 overflow-hidden">
            <div
              class="h-full rounded-full bg-brandp-400 dark:bg-brandp-500 transition-all"
              :style="{ width: `${Math.min(Math.max(metric.value / metric.max, 0), 1) * 100}%` }"
            />
          </div>
          <span class="w-9 shrink-0 text-right text-[11px] font-medium text-gray-700 dark:text-zinc-200">
            {{ metric.value }}/{{ metric.max }}
          </span>
        </template>
        <span
          v-else
          class="flex-1 text-right text-[11px] font-medium text-gray-700 dark:text-zinc-200"
        >
          {{ t('foodChatHome.quality.varietyValue', { count: metric.value }) }}
        </span>
        <UTooltip v-if="metric.reasoning" :text="metric.reasoning">
          <UIcon
            name="i-lucide-info"
            class="w-3 h-3 text-gray-300 dark:text-zinc-600 cursor-help shrink-0"
          />
        </UTooltip>
        <span v-else class="w-3 shrink-0" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

export interface QualityMetric {
  key: string
  label: string
  value: number
  /** Present for scores out of N; absent for a plain count like variety. */
  max?: number
  reasoning?: string
}

withDefaults(defineProps<{
  metrics: QualityMetric[]
  /** Collapsed by default — this is detail, not the plan. */
  startOpen?: boolean
}>(), { startOpen: false })

const { t } = useI18n()
const open = ref(false)
</script>
