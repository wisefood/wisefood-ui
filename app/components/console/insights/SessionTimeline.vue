<template>
  <UCard
    :ui="{ body: 'p-0' }"
    class="overflow-hidden border border-gray-200/70 dark:border-white/10"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
      <div class="min-w-0">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          What happened
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Oldest first. A pause is marked where somebody stopped for long enough to have been reading, stuck, or gone.
        </p>
      </div>
      <span class="shrink-0 text-xs text-gray-400 dark:text-gray-500">
        {{ entries.length }} action{{ entries.length === 1 ? '' : 's' }}
      </span>
    </div>

    <ConsoleInsightsEmptyState
      v-if="!entries.length"
      title="No individual actions recorded."
      hint="The counts on this page come from other tables. Per-action records age out first, and a session made only of model calls never had any."
      icon="i-lucide-history"
    />

    <ol
      v-else
      class="divide-y divide-gray-100 dark:divide-zinc-800"
    >
      <template
        v-for="(entry, index) in compacted"
        :key="index"
      >
        <!-- The pause is its own row rather than a column, because it belongs
             between two actions and not to either of them. -->
        <li
          v-if="isLongGap(entry.gap_seconds)"
          class="flex items-center gap-3 bg-gray-50/70 px-5 py-1.5 dark:bg-zinc-900/40"
        >
          <span class="h-px flex-1 bg-gray-200 dark:bg-zinc-700" />
          <span class="shrink-0 text-xs text-gray-400 dark:text-gray-500">
            {{ formatDuration(entry.gap_seconds) }} later
          </span>
          <span class="h-px flex-1 bg-gray-200 dark:bg-zinc-700" />
        </li>

        <li
          class="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-2.5 sm:flex-nowrap"
          :class="rowTone(entry.status)"
        >
          <span class="w-24 shrink-0 font-mono text-xs text-gray-400 dark:text-gray-500">
            {{ formatTime(entry.occurred_at) }}
          </span>
          <!-- A minimum, not a fixed width: `expert.feedback_context_read` is
               longer than forty rem-units of column and was being clipped. -->
          <span class="min-w-40 shrink-0 break-all text-sm font-medium text-gray-900 dark:text-white">
            {{ entry.event_type }}
            <!-- The run is shown, not hidden: forty polls collapse to one line
                 that says forty, so nothing is lost but the scrolling. -->
            <span
              v-if="entry.repeats > 1"
              class="ml-1 rounded bg-gray-100 px-1 text-xs tabular-nums text-gray-500 dark:bg-zinc-800 dark:text-gray-400"
              :title="`${entry.repeats} of these in a row, ${Math.round(entry.spanMs)}ms in total`"
            >×{{ entry.repeats }}</span>
          </span>
          <UBadge
            color="neutral"
            variant="subtle"
            size="sm"
            class="shrink-0"
          >
            {{ entry.app }}
          </UBadge>

          <!-- A failed action is the reason this page gets opened, so the code
               is a badge and not a number in the margin. -->
          <UBadge
            v-if="entry.status !== null && entry.status >= 400"
            :color="entry.status >= 500 ? 'error' : 'warning'"
            variant="subtle"
            size="sm"
            class="shrink-0"
            :title="entry.status >= 500 ? 'the server failed' : 'the request was rejected'"
          >
            {{ entry.status }}
          </UBadge>
          <span
            v-else-if="entry.status !== null"
            class="shrink-0 font-mono text-xs tabular-nums text-gray-300 dark:text-zinc-600"
            title="the request succeeded"
          >
            {{ entry.status }}
          </span>

          <span class="min-w-0 flex-1 truncate text-xs text-gray-500 dark:text-gray-400">
            {{ describe(entry) }}
          </span>

          <span
            v-if="entry.gap_seconds !== null && !isLongGap(entry.gap_seconds)"
            class="shrink-0 font-mono text-xs tabular-nums text-gray-300 dark:text-zinc-600"
            :title="`${entry.gap_seconds}s after the previous action`"
          >
            +{{ entry.gap_seconds }}s
          </span>

          <span
            v-if="entry.duration_ms !== null"
            class="w-16 shrink-0 text-right font-mono text-xs tabular-nums"
            :class="(entry.duration_ms ?? 0) > 2000 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'"
          >
            {{ entry.duration_ms }}ms
          </span>
        </li>
      </template>
    </ol>

    <div
      v-if="entries.length && total > entries.length"
      class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/70 px-5 py-3 dark:border-white/10"
    >
      <p class="text-xs text-gray-500 dark:text-gray-400">
        Showing {{ (offset + 1).toLocaleString() }}–{{ (offset + entries.length).toLocaleString() }}
        of {{ total.toLocaleString() }} actions
      </p>
      <div class="flex items-center gap-2">
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-chevron-left"
          :disabled="offset === 0 || loading"
          @click="$emit('page', Math.max(0, offset - limit))"
        >
          Earlier
        </UButton>
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          trailing-icon="i-lucide-chevron-right"
          :disabled="!truncated || loading"
          @click="$emit('page', offset + limit)"
        >
          Later
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDuration } from '~/utils/deviceIcons'

/**
 * One session's actions in order, with the silences between them.
 *
 * The timestamps were always here; the two things that explain a session were
 * not. A gap is how you see somebody stop — reading, stuck, or gone and back —
 * and it is invisible in a column of clock times, so a long one becomes a
 * divider that breaks the list where the person broke off. A status is how you
 * see the moment it went wrong, and that is the whole reason this page exists,
 * so 4xx and 5xx are badged and the row is tinted rather than left to be
 * spotted in a monospaced margin.
 */
type TimelineEntry = {
  occurred_at: string | null
  event_type: string
  app: string
  route: string | null
  status: number | null
  duration_ms: number | null
  gap_seconds: number | null
  props: Record<string, unknown>
}

const props = withDefaults(defineProps<{
  entries: TimelineEntry[]
  truncated?: boolean
  total?: number
  offset?: number
  limit?: number
  loading?: boolean
}>(), { truncated: false, total: 0, offset: 0, limit: 100, loading: false })

defineEmits<{ page: [offset: number] }>()

/*
 * Runs of the same action collapse into one row.
 *
 * A page that polls, or a search-as-you-type box, produces forty identical
 * `http.request` rows in a row. Rendered one per line they bury the three
 * things that actually happened in this visit, which is the only reason to
 * open a timeline at all. Collapsed, the run keeps its own count and its
 * total duration, so nothing is hidden — it is just no longer forty lines.
 *
 * Only *consecutive* identical actions merge. A repeat after something else
 * happened is a different event in the story and stays on its own line.
 */
const compacted = computed(() => {
  const out: Array<TimelineEntry & { repeats: number, spanMs: number }> = []
  for (const entry of props.entries) {
    const previous = out[out.length - 1]
    const sameAction = previous
      && previous.event_type === entry.event_type
      && previous.route === entry.route
      && previous.status === entry.status
      // A gap worth showing is a break in the narrative, so it also breaks a
      // run: two identical requests either side of four idle minutes are not
      // one thing happening.
      && (entry.gap_seconds ?? 0) < 60
    if (sameAction) {
      previous.repeats += 1
      previous.spanMs += entry.duration_ms ?? 0
      continue
    }
    out.push({ ...entry, repeats: 1, spanMs: entry.duration_ms ?? 0 })
  }
  return out
})

/*
 * A minute is the threshold.
 *
 * Below it the pause is part of doing the thing — a page loads, somebody picks
 * a filter. Above it they were doing something else, and that is the break
 * worth drawing. Anything shorter still shows as a "+12s" so the rhythm of a
 * fast session is not lost.
 */
const isLongGap = (seconds: number | null) => seconds !== null && seconds >= 60

const rowTone = (status: number | null) => {
  if (status === null || status < 400) return ''
  return status >= 500
    ? 'bg-red-50/70 dark:bg-red-500/10'
    : 'bg-amber-50/70 dark:bg-amber-500/10'
}

const formatTime = (value: string | null) => {
  if (!value) return ''
  const when = new Date(value)
  return Number.isNaN(when.getTime()) ? '' : when.toLocaleTimeString()
}

// `props` differs per event type, so show its contents rather than guessing at
// a shape none of them share.
const describe = (entry: TimelineEntry) => {
  const parts = Object.entries(entry.props || {})
    .filter(([, value]) => value !== null && value !== '' && value !== undefined)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value).slice(0, 40)}`)
  if (parts.length) return parts.join(' · ')
  return entry.route || ''
}
</script>
