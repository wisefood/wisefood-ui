<template>
  <UCard
    :ui="{ body: 'p-0' }"
    class="overflow-hidden border border-gray-200/70 dark:border-white/10"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
      <div class="min-w-0">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          How it felt to use
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          What the browser measured on the pages they opened, not what a test rig measured.
        </p>
      </div>
      <span
        v-if="vitals.length"
        class="shrink-0 text-xs text-gray-400 dark:text-gray-500"
      >
        {{ vitals.length }} measurement{{ vitals.length === 1 ? '' : 's' }}
      </span>
    </div>

    <ConsoleInsightsEmptyState
      v-if="!vitals.length"
      title="No page timings were reported."
      hint="Vitals are sent when a page is left, so a session still open, one that ended on a crash, or a browser that does not report them leaves none."
      icon="i-lucide-gauge"
    />

    <ul
      v-else
      class="divide-y divide-gray-100 dark:divide-zinc-800"
    >
      <li
        v-for="(row, index) in vitals"
        :key="index"
        class="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5"
      >
        <span class="w-16 shrink-0 font-mono text-xs font-medium uppercase text-gray-700 dark:text-gray-200">
          {{ row.metric }}
        </span>
        <span class="min-w-0 flex-1 break-all font-mono text-xs text-gray-500 dark:text-gray-400">
          {{ row.path || '—' }}
        </span>
        <UBadge
          v-if="row.rating"
          :color="ratingColor(row.rating)"
          variant="subtle"
          size="sm"
          class="shrink-0"
        >
          {{ row.rating.replace(/-/g, ' ') }}
        </UBadge>
        <span class="w-20 shrink-0 text-right font-mono text-sm tabular-nums text-gray-900 dark:text-white">
          {{ formatValue(row.metric, row.value) }}
        </span>
      </li>
    </ul>
  </UCard>
</template>

<script setup lang="ts">
/**
 * The web vitals recorded during one session.
 *
 * A session-level view of these is not a duplicate of the speed page: that one
 * answers "is the product slow", this one answers "was it slow for this
 * person", which is the question a support conversation actually asks.
 */
type VitalRow = {
  metric: string
  path: string
  value: number
  rating: string | null
}

defineProps<{ vitals: VitalRow[] }>()

const ratingColor = (rating: string): 'success' | 'warning' | 'error' | 'neutral' => {
  const value = rating.toLowerCase()
  if (value === 'good') return 'success'
  if (value === 'poor') return 'error'
  if (value.includes('improvement')) return 'warning'
  return 'neutral'
}

/*
 * CLS is a ratio and everything else is a duration. Stamping "ms" on a layout
 * shift score of 0.14 would be nonsense, and reading it as 0ms would be worse.
 */
const formatValue = (metric: string, value: number) => {
  if (metric.toUpperCase() === 'CLS') return value.toFixed(3)
  return `${Math.round(value).toLocaleString()}ms`
}
</script>
