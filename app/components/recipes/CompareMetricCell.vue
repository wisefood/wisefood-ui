<!--
  One value in the comparison: a Nutri-Score badge, a number with its unit,
  or a number over a bar scaled to the largest recipe on the page. The table
  and the phone's stacked list both render their cells through this, so the
  two never disagree on how a value looks.
-->
<template>
  <div
    v-if="metric.kind === 'nutri'"
    class="flex justify-center"
  >
    <div
      :class="[
        'px-4 py-2 rounded-full font-black',
        compact ? 'text-base' : 'text-lg',
        grade
          ? `${nutriScoreBg(grade)} text-white`
          : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
      ]"
    >
      {{ grade ?? t('recipeWrangler.comparePage.notAvailable') }}
    </div>
  </div>
  <div
    v-else-if="metric.kind === 'bar'"
    class="space-y-2"
  >
    <div class="text-center">
      <span :class="['font-bold text-zinc-900 dark:text-white', compact ? 'text-base' : 'text-lg']">
        {{ value }}<span
          v-if="unit"
          class="text-sm text-zinc-500"
        >{{ unit }}</span>
      </span>
    </div>
    <div class="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
      <div
        :class="['h-full', metric.barClass]"
        :style="{ width: `${percent}%` }"
      />
    </div>
  </div>
  <div
    v-else
    class="text-center"
  >
    <span :class="['font-bold text-zinc-900 dark:text-white', compact ? 'text-base' : 'text-lg']">
      {{ value }}<span
        v-if="unit"
        class="text-sm text-zinc-500"
      >{{ unit }}</span>
    </span>
  </div>
</template>

<script lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Recipe } from '~/services/recipeApi'

export interface CompareMetric {
  key: string
  label: string
  icon: string
  iconClass: string
  kind: 'nutri' | 'text' | 'bar'
  /** The formatted number, or the not-available marker. */
  value: (recipe: Recipe) => string
  /** Empty when the value is not a number, so "N/A g" never renders. */
  unit: (recipe: Recipe) => string
  /** Bar fill, 0-100, relative to the largest recipe on the page. */
  percent?: (recipe: Recipe) => number
  barClass?: string
}
</script>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  metric: CompareMetric
  recipe: Recipe
  /** The phone list shows two side by side in half the width; type shrinks a step. */
  compact?: boolean
}>(), {
  compact: false
})

const { t } = useI18n()

const grade = computed(() => props.metric.kind === 'nutri' ? getNutriScoreGrade(props.recipe.nutri_score) : null)
const value = computed(() => props.metric.value(props.recipe))
const unit = computed(() => props.metric.unit(props.recipe))
const percent = computed(() => props.metric.percent?.(props.recipe) ?? 0)

// The official Nutri-Score colours.
const nutriScoreBg = (letter: string): string => {
  const colors: Record<string, string> = {
    A: 'bg-[#038141]',
    B: 'bg-[#85BB2F]',
    C: 'bg-[#FECB02]',
    D: 'bg-[#EE8100]',
    E: 'bg-[#E63E11]'
  }
  return colors[letter] || 'bg-zinc-400'
}
</script>
