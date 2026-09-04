<template>
  <UCard
    :ui="{ body: 'p-0' }"
    class="overflow-hidden border border-gray-200/70 dark:border-white/10"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
      <div class="min-w-0">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          What they searched for
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          The words themselves, and whether each one worked.
        </p>
      </div>
      <span
        v-if="searches.length"
        class="shrink-0 text-xs text-gray-400 dark:text-gray-500"
      >
        {{ searches.length }} search{{ searches.length === 1 ? '' : 'es' }}
      </span>
    </div>

    <ConsoleInsightsEmptyState
      v-if="!searches.length"
      title="Nobody searched in this session."
      hint="Searches are recorded for every visit, so an empty list means none were run — not that the recording was off."
      icon="i-lucide-search"
    />

    <ul
      v-else
      class="divide-y divide-gray-100 dark:divide-zinc-800"
    >
      <li
        v-for="(row, index) in searches"
        :key="index"
        class="px-5 py-3"
        :class="row.zero_result ? 'bg-amber-50/70 dark:bg-amber-500/10' : ''"
      >
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span class="shrink-0 font-mono text-xs tabular-nums text-gray-400 dark:text-gray-500">
            {{ formatTime(row.occurred_at) }}
          </span>
          <!-- The query is the row: it wraps in place rather than being cut,
               because a truncated search term cannot be re-run or recognised. -->
          <p class="min-w-0 flex-1 break-words text-sm text-gray-900 dark:text-white">
            {{ row.query || 'query not kept' }}
          </p>
          <span
            v-if="row.latency_ms !== null"
            class="shrink-0 font-mono text-xs tabular-nums"
            :class="(row.latency_ms ?? 0) > 1000 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'"
          >
            {{ row.latency_ms }}ms
          </span>
        </div>

        <div class="mt-1.5 flex flex-wrap items-center gap-2">
          <UBadge
            v-if="row.zero_result"
            color="warning"
            variant="subtle"
            size="sm"
          >
            found nothing
          </UBadge>
          <span
            v-else
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            {{ (row.results ?? 0).toLocaleString() }} result{{ row.results === 1 ? '' : 's' }}
          </span>

          <!-- Recorded since the first release and never shown: a search that
               only returned anything because the constraints were loosened is
               a different outcome from one that just worked. -->
          <UBadge
            v-if="row.relaxed"
            color="neutral"
            variant="subtle"
            size="sm"
            title="the constraints were loosened to return anything at all"
          >
            relaxed
          </UBadge>
          <UBadge
            v-if="row.lexical_fallback"
            color="neutral"
            variant="subtle"
            size="sm"
            title="meaning-based matching returned nothing, so it fell back to matching words"
          >
            word match
          </UBadge>
          <span
            v-if="row.surface"
            class="text-xs text-gray-400 dark:text-gray-500"
          >
            {{ row.surface }}
          </span>
        </div>
      </li>
    </ul>
  </UCard>
</template>

<script setup lang="ts">
/**
 * Every search in one session, with its outcome.
 *
 * The page counted searches and counted the ones that found nothing, which
 * tells a reader that something went wrong and never what. The words are the
 * evidence: two near-identical queries in a row is somebody rephrasing, and a
 * relaxed or word-matched hit is a result that only looks like a success.
 */
type SearchRow = {
  occurred_at: string | null
  surface: string | null
  query: string | null
  results: number | null
  zero_result: boolean
  relaxed: boolean
  lexical_fallback: boolean
  latency_ms: number | null
}

defineProps<{ searches: SearchRow[] }>()

const formatTime = (value: string | null) => {
  if (!value) return '—'
  const when = new Date(value)
  return Number.isNaN(when.getTime()) ? '—' : when.toLocaleTimeString()
}
</script>
