<template>
  <UCard
    :ui="{ body: 'p-0' }"
    class="flex flex-col overflow-hidden border border-gray-200/70 dark:border-white/10"
  >
    <div class="flex items-center gap-2 border-b border-gray-200/70 px-4 py-2.5 dark:border-white/10">
      <UIcon
        :name="icon"
        class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500"
      />
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
        {{ title }}
      </h3>
    </div>

    <p
      v-if="verdict"
      class="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
    >
      <UIcon
        name="i-lucide-crosshair"
        class="mr-1 inline h-3.5 w-3.5 align-[-2px]"
      />
      {{ verdict }}
    </p>

    <ConsoleInsightsEmptyState
      v-if="!rows.length"
      title="Nothing recorded."
      hint="The occurrences carry no value for this."
      icon="i-lucide-list"
    />

    <ul
      v-else
      class="divide-y divide-gray-100 dark:divide-zinc-800"
    >
      <li
        v-for="row in rows"
        :key="row.value"
        class="px-4 py-2"
      >
        <div class="flex items-baseline justify-between gap-3">
          <span
            class="min-w-0 break-all text-xs text-gray-700 dark:text-gray-200"
            :class="mono ? 'font-mono' : ''"
          >{{ row.value }}</span>
          <span class="shrink-0 text-xs tabular-nums text-gray-500 dark:text-gray-400">
            {{ row.count.toLocaleString() }} · {{ share(row.count) }}%
          </span>
        </div>
        <div class="mt-1 h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
          <div
            class="h-full rounded-full bg-brand-500"
            :style="{ width: `${share(row.count)}%` }"
          />
        </div>
      </li>
    </ul>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * One "what these occurrences have in common" breakdown.
 *
 * The shares matter more than the counts: an error spread evenly across every
 * browser is a logic bug and an error that is 100% Safari is a compatibility
 * bug, and those are two different afternoons. So a breakdown that collapses
 * onto a single value says so in words at the top rather than leaving the
 * reader to compare two numbers in a list.
 */
const props = withDefaults(defineProps<{
  title: string
  rows: Array<{ value: string, count: number }>
  icon?: string
  /** Paths, releases and element keys are machine strings; names are not. */
  mono?: boolean
}>(), {
  icon: 'i-lucide-list',
  mono: false
})

const total = computed(() => props.rows.reduce((sum, row) => sum + row.count, 0))

const share = (count: number) =>
  total.value ? Math.round((count / total.value) * 100) : 0

const verdict = computed(() => {
  const top = props.rows[0]
  // One occurrence is not a pattern, and "everything is unknown" is a gap in
  // what was recorded rather than a finding about the failure.
  if (!top || total.value < 2) return ''
  if (props.rows.length === 1 && top.value === 'unknown') return ''
  const pct = share(top.count)
  if (pct < 80) return ''
  return pct >= 100
    ? `Every occurrence is on ${top.value}.`
    : `${pct}% of occurrences are on ${top.value}.`
})
</script>
