<template>
  <UCard
    :ui="{ body: 'p-0' }"
    class="flex flex-col overflow-hidden border border-gray-200/70 dark:border-white/10"
  >
    <div class="border-b border-gray-200/70 px-4 py-2.5 dark:border-white/10">
      <div class="flex items-center gap-2">
        <UIcon
          :name="icon"
          class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500"
        />
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ title }}
        </h3>
      </div>
      <p
        v-if="subtitle"
        class="mt-0.5 text-xs text-gray-500 dark:text-gray-400"
      >
        {{ subtitle }}
      </p>
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
        class="px-4 py-2.5"
      >
        <div class="flex items-baseline justify-between gap-3">
          <span class="min-w-0 truncate text-sm text-gray-800 dark:text-gray-100">
            {{ names[row.value] ?? row.value ?? 'unattributed' }}
          </span>
          <span class="shrink-0 text-xs tabular-nums text-gray-500 dark:text-gray-400">
            {{ share(row.events) }}%
          </span>
        </div>
        <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
          <div
            class="h-full rounded-full bg-brand-500 dark:bg-brand-400"
            :style="{ width: `${share(row.events)}%` }"
          />
        </div>
        <p class="mt-1 text-xs tabular-nums text-gray-400 dark:text-gray-500">
          {{ row.events.toLocaleString() }} events · {{ row.sessions.toLocaleString() }} sessions
        </p>
      </li>
    </ul>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * One "where the traffic came from" split, as shares of events.
 *
 * Both counts are shown because they disagree in a way that is the finding:
 * a client with a large share of events across very few sessions is one
 * automated caller, not a popular surface, and only the pair of numbers says
 * so. Rows are grouped without a not-null filter on the server, so a null
 * value is a real bucket here rather than a bug — it is named, not dropped.
 */
const props = withDefaults(defineProps<{
  title: string
  rows: Array<{ value: string, events: number, sessions: number }>
  subtitle?: string
  icon?: string
  /** Friendlier wording for machine values — 'sdk' reads as 'Python SDK'. */
  names?: Record<string, string>
  empty?: string
  emptyHint?: string
  emptyIcon?: string
}>(), {
  subtitle: '',
  icon: 'i-lucide-pie-chart',
  names: () => ({}),
  empty: 'Nothing recorded.',
  emptyHint: '',
  emptyIcon: 'i-lucide-pie-chart'
})

const total = computed(() => props.rows.reduce((sum, row) => sum + row.events, 0))

const share = (events: number) =>
  total.value ? Math.round((events / total.value) * 100) : 0
</script>
