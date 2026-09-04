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

    <ConsoleInsightsEmptyState
      v-if="!rows.length"
      :title="empty"
      :hint="emptyHint"
      :icon="emptyIcon"
    />

    <ul
      v-else
      class="divide-y divide-gray-100 dark:divide-zinc-800"
    >
      <li
        v-for="row in rows"
        :key="row.value ?? 'unknown'"
        class="px-4 py-2"
      >
        <div class="flex items-baseline justify-between gap-3">
          <span
            class="min-w-0 break-all text-xs text-gray-700 dark:text-gray-200"
            :class="mono ? 'font-mono' : ''"
          >{{ row.value || 'unknown' }}</span>
          <span class="shrink-0 text-xs tabular-nums text-gray-500 dark:text-gray-400">
            {{ row.count.toLocaleString() }} · {{ share(row.count) }}%
          </span>
        </div>
        <div class="mt-1 h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
          <div
            class="h-full rounded-full bg-brand-500 dark:bg-brand-400"
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
 * A `{ value, count }` breakdown of one recorded property.
 *
 * The same list as the error breakdown, but with its own empty state: that one
 * is worded for occurrences of a failure, and "the occurrences carry no value
 * for this" is the wrong sentence under a language split that is empty because
 * nobody asked anything. The share bar matters more than the count — a model
 * answering 4% of questions and one answering 96% are different facts about
 * the same total.
 */
const props = withDefaults(defineProps<{
  title: string
  rows: Array<{ value: string, count: number }>
  icon?: string
  /** Model ids and mode names are machine strings; languages are not. */
  mono?: boolean
  empty?: string
  emptyHint?: string
  emptyIcon?: string
}>(), {
  icon: 'i-lucide-list',
  mono: false,
  empty: 'Nothing recorded.',
  emptyHint: '',
  emptyIcon: 'i-lucide-list'
})

const total = computed(() => props.rows.reduce((sum, row) => sum + row.count, 0))

const share = (count: number) =>
  total.value ? Math.round((count / total.value) * 100) : 0
</script>
