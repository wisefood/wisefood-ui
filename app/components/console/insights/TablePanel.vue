<template>
  <UCard
    :ui="{ body: 'p-0' }"
    class="flex flex-col overflow-hidden border border-gray-200/70 dark:border-white/10"
  >
    <div class="flex items-center justify-between gap-3 border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
      <div class="min-w-0">
        <h3 class="truncate text-base font-semibold text-gray-900 dark:text-white">
          {{ title }}
        </h3>
        <p
          v-if="subtitle"
          class="truncate text-xs text-gray-500 dark:text-gray-400"
        >
          {{ subtitle }}
        </p>
      </div>
      <UButton
        v-if="to"
        :to="to"
        color="neutral"
        variant="ghost"
        size="xs"
        trailing-icon="i-lucide-arrow-right"
        class="shrink-0"
      >
        {{ linkLabel }}
      </UButton>
    </div>

    <ConsoleInsightsEmptyState
      v-if="!rows.length"
      :title="empty"
      :hint="emptyHint"
      :icon="emptyIcon"
    />

    <div
      v-else
      class="overflow-x-auto"
    >
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-zinc-900/50 dark:text-gray-400">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              class="px-5 py-2"
              :class="[
                column.align === 'right' ? 'text-right' : '',
                column.sortable !== false ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200' : ''
              ]"
              :aria-sort="ariaSort(column)"
              @click="column.sortable !== false && toggleSort(column.key)"
            >
              <span
                class="inline-flex items-center gap-1"
                :class="column.align === 'right' ? 'flex-row-reverse' : ''"
              >
                {{ column.label }}
                <UIcon
                  v-if="sortKey === column.key"
                  :name="sortDescending ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
                  class="h-3 w-3"
                />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in sortedRows"
            :key="index"
            class="border-t border-gray-100 dark:border-zinc-800"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-5 py-2"
              :class="[
                column.align === 'right' ? 'text-right tabular-nums' : '',
                column.truncate ? 'max-w-xs truncate' : ''
              ]"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
              >
                {{ format(row, column) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>

<script setup lang="ts" generic="Row extends Record<string, unknown>">
import { computed, ref } from 'vue'

/**
 * The console's hand-rolled table, as a component.
 *
 * The stats panels already share this exact markup copied four times; giving
 * it one definition means a column added to a report does not need the header,
 * the cell and the empty state kept in step by hand.
 */
export interface PanelColumn {
  key: string
  label: string
  align?: 'right'
  truncate?: boolean
  money?: boolean
  /** Columns are sortable unless a column says otherwise. */
  sortable?: boolean
}

const props = withDefaults(defineProps<{
  title: string
  rows: Row[]
  columns: PanelColumn[]
  subtitle?: string
  to?: string
  linkLabel?: string
  empty?: string
  emptyHint?: string
  emptyIcon?: string
}>(), {
  subtitle: '',
  to: '',
  linkLabel: 'View all',
  empty: 'Nothing to show.',
  emptyHint: '',
  emptyIcon: 'i-lucide-inbox'
})

/*
 * Sorting is client-side, over the rows already fetched.
 *
 * That is the honest limit and it is worth stating: every report is served
 * with a server-side LIMIT, so this reorders the top N rather than searching
 * the whole table. For "which of these is worst" — the question a console
 * table is actually asked — that is the right answer, and it costs no round
 * trip. Anyone who needs the true ordering of everything wants the CSV.
 */
const sortKey = ref<string | null>(null)
const sortDescending = ref(true)

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortDescending.value = !sortDescending.value
    return
  }
  sortKey.value = key
  // Numbers open largest-first and text opens A to Z, because that is what
  // each is usually being asked for.
  const sample = props.rows.find(row => row[key] !== null && row[key] !== undefined)
  sortDescending.value = typeof sample?.[key] !== 'string'
}

const sortedRows = computed(() => {
  const key = sortKey.value
  if (!key) return props.rows
  const direction = sortDescending.value ? -1 : 1
  return [...props.rows].sort((a, b) => {
    const left = a[key]
    const right = b[key]
    // Missing values sink to the bottom whichever way the column is sorted:
    // "no data" is never the most interesting row.
    if (left === null || left === undefined) return 1
    if (right === null || right === undefined) return -1
    if (typeof left === 'number' && typeof right === 'number') {
      return (left - right) * direction
    }
    return String(left).localeCompare(String(right)) * direction
  })
})

const ariaSort = (column: PanelColumn) => {
  if (column.sortable === false) return undefined
  if (sortKey.value !== column.key) return 'none'
  return sortDescending.value ? 'descending' : 'ascending'
}

defineSlots<{
  [key: `cell-${string}`]: (props: { row: Row }) => unknown
}>()

function format(row: Row, column: PanelColumn): string {
  const value = row[column.key]
  if (value === null || value === undefined || value === '') return '—'
  if (column.money) return `$${Number(value).toFixed(2)}`
  if (typeof value === 'number') return value.toLocaleString()
  return String(value)
}
</script>
