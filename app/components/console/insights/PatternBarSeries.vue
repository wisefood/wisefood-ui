<template>
  <ConsoleInsightsEmptyState
    v-if="!bars.length"
    :title="empty"
    :hint="emptyHint"
    :icon="emptyIcon"
  />

  <div v-else>
    <div
      class="flex items-end gap-1 border-b border-gray-200 dark:border-white/10"
      :style="{ height: `${height}px` }"
    >
      <div
        v-for="(bar, index) in bars"
        :key="bar.label"
        class="group flex h-full flex-1 items-end"
        :title="describe(bar)"
      >
        <div
          class="w-full rounded-t-sm transition-colors"
          :class="index === highlightIndex
            ? 'bg-brand-500 dark:bg-brand-400'
            : 'bg-brand-500/45 group-hover:bg-brand-500/75 dark:bg-brand-400/40 dark:group-hover:bg-brand-400/70'"
          :style="{ height: barHeight(bar.value) }"
        />
      </div>
    </div>

    <div class="mt-1.5 flex gap-1">
      <span
        v-for="(bar, index) in bars"
        :key="`tick-${bar.label}`"
        class="flex-1 truncate text-center text-[10px] leading-tight tabular-nums"
        :class="index === highlightIndex
          ? 'font-semibold text-gray-900 dark:text-white'
          : 'text-gray-400 dark:text-gray-500'"
      >
        {{ showTick(index) ? bar.tick ?? bar.label : '' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * A distribution across a fixed set of buckets — hours of a day, days of a
 * week, session-depth bands.
 *
 * Deliberately not the shared bar chart: that one draws horizontally and grows
 * 36px per row, which turns twenty-four hours into a nine-hundred-pixel column
 * nobody can read as a daily shape. A day has to be seen left-to-right in one
 * glance for the shape to mean anything, and the buckets are fixed and few, so
 * plain divs beat a charting library here.
 */
export interface SeriesBar {
  label: string
  value: number
  /** Shorter text for the axis when the label is a sentence. */
  tick?: string
  /** What the bar means, spelled out for the hover title. */
  detail?: string
}

const props = withDefaults(defineProps<{
  bars: SeriesBar[]
  /** Bucket to pick out — the busiest hour, say. -1 for none. */
  highlightIndex?: number
  /** Draw every nth axis label, so twenty-four ticks do not collide. */
  tickEvery?: number
  height?: number
  empty?: string
  emptyHint?: string
  emptyIcon?: string
}>(), {
  highlightIndex: -1,
  tickEvery: 1,
  height: 144,
  empty: 'Nothing recorded in this period.',
  emptyHint: '',
  emptyIcon: 'i-lucide-bar-chart-3'
})

const peak = computed(() => Math.max(1, ...props.bars.map(bar => bar.value)))

/*
 * Scaled against the tallest bar rather than a round number, because the
 * question is which bucket is busiest, not how the total compares to some
 * absolute. An empty bucket draws nothing at all: a one-pixel stub would read
 * as "a little activity" when the truth is none.
 */
const barHeight = (value: number) =>
  value <= 0 ? '0px' : `${Math.max(2, (value / peak.value) * 100)}%`

const showTick = (index: number) =>
  index % props.tickEvery === 0 || index === props.highlightIndex

const describe = (bar: SeriesBar) =>
  bar.detail || `${bar.label}: ${bar.value.toLocaleString()}`
</script>
