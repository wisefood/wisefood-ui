<template>
  <UCard
    :ui="{ body: 'p-0' }"
    class="overflow-hidden border border-gray-200/70 dark:border-white/10"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
      <div class="min-w-0">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          What they told us
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Ratings and comments left during this visit, and what each one was about.
        </p>
      </div>
      <span
        v-if="items.length"
        class="shrink-0 text-xs text-gray-400 dark:text-gray-500"
      >
        {{ items.length }} item{{ items.length === 1 ? '' : 's' }}
      </span>
    </div>

    <ConsoleInsightsEmptyState
      v-if="!items.length"
      title="No feedback was left in this session."
      hint="Feedback is always recorded when it is given, so an empty list means none was — most visits leave none."
      icon="i-lucide-message-square"
    />

    <ul
      v-else
      class="divide-y divide-gray-100 dark:divide-zinc-800"
    >
      <li
        v-for="row in items"
        :key="row.id"
        class="px-5 py-3"
      >
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
          <UBadge
            :color="verdict(row).color"
            variant="subtle"
            size="sm"
            class="shrink-0"
            :icon="verdict(row).icon"
          >
            {{ verdict(row).label }}
          </UBadge>
          <span class="shrink-0 text-xs text-gray-400 dark:text-gray-500">
            {{ formatWhen(row.occurred_at) }}
          </span>
          <UBadge
            color="neutral"
            variant="subtle"
            size="sm"
            class="shrink-0"
          >
            {{ row.app }}
          </UBadge>
          <UBadge
            v-if="row.status !== 'new'"
            color="neutral"
            variant="subtle"
            size="sm"
            class="shrink-0"
          >
            {{ row.status }}
          </UBadge>
        </div>

        <!-- The reason is a picked option and the comment is typed prose; they
             are different evidence, so they are not run together on one line. -->
        <p
          v-if="row.reason"
          class="mt-2 text-sm text-gray-700 dark:text-gray-200"
        >
          <span class="text-gray-400 dark:text-gray-500">Reason</span>
          {{ row.reason }}
        </p>
        <blockquote
          v-if="row.comment"
          class="mt-2 break-words border-l-2 border-gray-200 pl-3 text-sm italic text-gray-700 dark:border-zinc-700 dark:text-gray-200"
        >
          {{ row.comment }}
        </blockquote>
        <p
          v-if="!row.reason && !row.comment"
          class="mt-2 text-xs italic text-gray-400 dark:text-gray-500"
        >
          A rating with nothing written alongside it.
        </p>

        <p class="mt-2 flex flex-wrap items-baseline gap-x-2 text-xs text-gray-400 dark:text-gray-500">
          <span>About</span>
          <span class="text-gray-500 dark:text-gray-400">{{ row.target_type }}</span>
          <!-- Target ids are URNs and can be long; they wrap rather than push
               the card sideways. -->
          <span
            v-if="row.target_id"
            class="min-w-0 break-all font-mono text-gray-500 dark:text-gray-400"
          >{{ row.target_id }}</span>
          <span
            v-else
            class="italic"
          >no particular item</span>
        </p>
      </li>
    </ul>
  </UCard>
</template>

<script setup lang="ts">
import type { FeedbackRow } from '~/services/insightsApi'

/**
 * The feedback given during one session, in full.
 *
 * "3 pieces of feedback" is a number. The words somebody typed are the reason
 * anyone opened this session in the first place, and they arrived in the same
 * response the whole time.
 */
defineProps<{ items: FeedbackRow[] }>()

/*
 * Feedback arrives in several shapes — a thumb, a star count, a label — so the
 * verdict is read from whichever field the source filled in rather than from
 * one assumed scale. Anything unrecognised stays neutral: guessing a rating
 * wrong is worse than showing it plainly.
 */
const NEGATIVE = new Set(['down', 'negative', 'bad', 'no', 'unhelpful', 'thumbs_down'])
const POSITIVE = new Set(['up', 'positive', 'good', 'yes', 'helpful', 'thumbs_up'])

function label(row: FeedbackRow): string {
  const parts = [row.rating_value, row.rating_value_num !== null ? String(row.rating_value_num) : '']
    .filter(Boolean)
  return parts.length ? `${row.rating_kind} ${parts.join(' ')}` : row.rating_kind
}

function verdict(row: FeedbackRow): { label: string, color: 'success' | 'error' | 'neutral', icon: string } {
  const value = (row.rating_value || '').trim().toLowerCase()
  const score = row.rating_value_num

  if (NEGATIVE.has(value) || (score !== null && score <= 2)) {
    return { label: label(row), color: 'error', icon: 'i-lucide-thumbs-down' }
  }
  if (POSITIVE.has(value) || (score !== null && score >= 4)) {
    return { label: label(row), color: 'success', icon: 'i-lucide-thumbs-up' }
  }
  return { label: label(row), color: 'neutral', icon: 'i-lucide-circle-dot' }
}

const formatWhen = (value: string) => {
  const when = new Date(value)
  return Number.isNaN(when.getTime()) ? '—' : when.toLocaleString()
}
</script>
