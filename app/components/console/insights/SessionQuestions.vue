<template>
  <UCard
    :ui="{ body: 'p-0' }"
    class="overflow-hidden border border-gray-200/70 dark:border-white/10"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
      <div class="min-w-0">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          What they asked FoodScholar
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Each question, how its answer was made, and how they rated it.
        </p>
      </div>
      <span
        v-if="total"
        class="shrink-0 text-xs text-gray-400 dark:text-gray-500"
      >
        {{ total }} question{{ total === 1 ? '' : 's' }}
      </span>
    </div>

    <ConsoleInsightsEmptyState
      v-if="!questions.length"
      :title="total ? 'Questions were asked, but no answer reached the record.' : 'No questions in this session.'"
      :hint="total
        ? 'The browser reported asking; FoodScholar reported nothing back for this session — the answer may have failed, or it has not been linked yet.'
        : 'Nothing in this visit went to FoodScholar.'"
      icon="i-lucide-message-circle-question"
    />

    <ul
      v-else
      class="divide-y divide-gray-100 dark:divide-zinc-800"
    >
      <li
        v-for="(row, index) in questions"
        :key="row.qa_request_id || index"
        class="px-5 py-3"
        :class="negative(row.rating) ? 'bg-amber-50/70 dark:bg-amber-500/10' : ''"
      >
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span class="shrink-0 font-mono text-xs tabular-nums text-gray-400 dark:text-gray-500">
            {{ formatTime(row.occurred_at) }}
          </span>
          <!-- The words only when the person agreed and capture was on. Said
               plainly when they are absent, so a blank is not read as an
               empty question. -->
          <p
            class="min-w-0 flex-1 break-words text-sm"
            :class="row.question ? 'text-gray-900 dark:text-white' : 'italic text-gray-400 dark:text-gray-500'"
          >
            {{ row.question || 'question text not kept' }}
          </p>
        </div>

        <div class="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <UBadge
            v-if="!row.answered"
            color="warning"
            variant="subtle"
            size="sm"
          >
            no answer recorded
          </UBadge>
          <span v-if="row.mode">{{ qaModeLabel(row.mode) }}</span>
          <span v-if="row.sources_found !== null">
            · {{ row.sources_found }} source{{ row.sources_found === 1 ? '' : 's' }} found
          </span>
          <span v-if="row.articles_consulted !== null">
            · {{ row.articles_consulted }} consulted
          </span>
          <span v-if="row.confidence !== null && row.confidence !== ''">
            · confidence {{ row.confidence }}
          </span>
          <UBadge
            v-if="row.cache_hit"
            color="neutral"
            variant="subtle"
            size="sm"
            title="Answered from an earlier answer to the same question"
          >
            from cache
          </UBadge>
          <UBadge
            v-if="row.rating"
            :color="negative(row.rating) ? 'warning' : 'success'"
            variant="subtle"
            size="sm"
          >
            rated {{ humanize(row.rating).toLowerCase() }}
          </UBadge>
        </div>
      </li>
    </ul>
  </UCard>
</template>

<script setup lang="ts">
import type { ScholarQuestion } from '~/services/insightsApi'
import { humanize, qaModeLabel } from '~/utils/labels'

/**
 * A session's FoodScholar questions, with their answers' provenance.
 *
 * Joined from three reports that arrive separately — the retrieval behind the
 * question, the answer, and the rating somebody gave it — so the row reads as
 * one exchange rather than three facts filed in three places.
 */
defineProps<{
  questions: ScholarQuestion[]
  /** Questions counted, which can exceed the rows when an answer never reported. */
  total: number
}>()

const NEGATIVE = new Set(['down', 'not_helpful', 'bad', 'awful'])
const negative = (rating: string | null) => Boolean(rating && NEGATIVE.has(rating))

const formatTime = (value: string | null) => {
  if (!value) return ''
  const when = new Date(value)
  return Number.isNaN(when.getTime()) ? '' : when.toLocaleTimeString()
}
</script>
