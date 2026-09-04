<template>
  <section class="space-y-4">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          What the experts concluded
        </h2>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Every verdict recorded below, counted. Last {{ days }} days.
        </p>
      </div>
      <slot name="actions" />
    </div>

    <UCard
      v-if="!summary || !summary.reviews"
      :ui="{ body: 'p-0' }"
      class="overflow-hidden border border-gray-200/70 dark:border-white/10"
    >
      <!--
        Two different silences: the service not answering at all, and nobody
        having judged anything yet. The first is a fault, the second is work
        that has not happened.
      -->
      <ConsoleInsightsEmptyState
        :title="summary ? 'No verdicts recorded in this period.' : 'Review history is unavailable.'"
        :hint="summary
          ? 'A verdict recorded on a question below appears here immediately.'
          : 'The analytics service did not answer, so this says nothing about how much review happened.'"
        :icon="summary ? 'i-lucide-gavel' : 'i-lucide-plug-zap'"
      />
    </UCard>

    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ConsoleStatsStatTile
          label="Verdicts recorded"
          :value="summary.reviews"
          icon="i-lucide-gavel"
        />
        <ConsoleStatsStatTile
          label="Things judged"
          :value="summary.agreement.targets_reviewed"
          icon="i-lucide-target"
        />
        <ConsoleStatsStatTile
          label="Seen by two experts"
          :value="summary.agreement.reviewed_more_than_once"
          icon="i-lucide-users"
        />
        <UCard
          :ui="{ body: 'p-4' }"
          class="border border-gray-200/70 dark:border-white/10"
        >
          <p class="text-sm text-gray-500 dark:text-gray-400">
            They disagreed
          </p>
          <p
            class="mt-1 text-2xl font-semibold tabular-nums"
            :class="summary.agreement.disagreement_rate >= 25
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-gray-900 dark:text-white'"
          >
            {{ doubleReviewed ? `${summary.agreement.disagreement_rate}%` : '—' }}
          </p>
          <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
            <template v-if="doubleReviewed">
              {{ summary.agreement.disagreements.toLocaleString() }} of
              {{ doubleReviewed.toLocaleString() }} doubly reviewed
            </template>
            <template v-else>
              nothing was reviewed twice, so there is nothing to compare
            </template>
          </p>
        </UCard>
      </div>

      <!--
        Agreement is measured only where two people looked at the same thing,
        which is a small slice of the work — stating the denominator stops the
        rate reading as a property of the whole review effort.
      -->
      <p
        v-if="doubleReviewed"
        class="text-xs text-gray-500 dark:text-gray-400"
      >
        Agreement is measured over the {{ doubleReviewed.toLocaleString() }}
        {{ doubleReviewed === 1 ? 'thing' : 'things' }} two or more experts both judged —
        {{ overlapShare }} of everything judged in this period. It says nothing about the rest.
      </p>

      <UCard
        :ui="{ body: 'p-5' }"
        class="border border-gray-200/70 dark:border-white/10"
      >
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          Verdicts
        </h3>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          One verdict per expert per thing: revisiting a judgement replaces it, a second
          expert's judgement is a separate row.
        </p>
        <ul class="mt-4 space-y-3">
          <li
            v-for="entry in summary.by_verdict"
            :key="entry.verdict"
          >
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ verdictLabel(entry.verdict) }}
              </span>
              <span class="text-sm tabular-nums text-gray-600 dark:text-gray-300">
                {{ entry.count.toLocaleString() }} · {{ entry.share }}%
              </span>
            </div>
            <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
              <div
                class="h-full rounded-full"
                :class="verdictBar(entry.verdict)"
                :style="{ width: `${Math.min(100, entry.share)}%` }"
              />
            </div>
          </li>
        </ul>
      </UCard>

      <div class="grid gap-6 lg:grid-cols-2">
        <ConsoleInsightsTablePanel
          title="Who reviewed"
          subtitle="Verdicts recorded, and the last time each person recorded one"
          :rows="summary.by_reviewer"
          :columns="reviewerColumns"
          empty="Nobody has recorded a verdict."
          empty-hint="Verdicts are recorded from the question detail below."
          empty-icon="i-lucide-user-check"
        >
          <template #cell-reviewer="{ row }">
            {{ row.reviewer_name || row.reviewer_id }}
          </template>
          <template #cell-last_review="{ row }">
            {{ formatDay(row.last_review) }}
          </template>
        </ConsoleInsightsTablePanel>

        <ConsoleInsightsTablePanel
          title="What has been covered"
          subtitle="Which kinds of thing the review effort has reached"
          :rows="summary.by_target_type"
          :columns="targetColumns"
          empty="Nothing has been reviewed."
          empty-hint="Answers, recipes and articles can each carry verdicts."
          empty-icon="i-lucide-layers"
        >
          <template #cell-target_type="{ row }">
            {{ targetLabel(row.target_type) }}
          </template>
        </ConsoleInsightsTablePanel>
      </div>

      <UCard
        v-if="summary.tags.length"
        :ui="{ body: 'p-5' }"
        class="border border-gray-200/70 dark:border-white/10"
      >
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          Tags reviewers reached for
        </h3>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Free text, chosen by whoever typed it — a tag used once is one person's wording,
          not a category.
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <UBadge
            v-for="tag in summary.tags"
            :key="tag.tag"
            color="neutral"
            variant="subtle"
          >
            {{ tag.tag }} · {{ tag.count.toLocaleString() }}
          </UBadge>
        </div>
      </UCard>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ReviewSummary } from '~/services/insightsApi'

/*
 * The aggregate side of expert review.
 *
 * Verdicts have been stored since the first release and never counted, which
 * left the review console a data-entry form: it could take a judgement but
 * could not say what had been judged, by whom, or whether two experts looking
 * at the same answer reached the same conclusion.
 *
 * Its own component so the Q&A page keeps its two-column reviewing layout
 * intact and simply gains a section above it.
 */
const props = withDefaults(defineProps<{
  summary: ReviewSummary | null
  days?: number
}>(), {
  days: 90
})

const doubleReviewed = computed(() => props.summary?.agreement.reviewed_more_than_once ?? 0)

const overlapShare = computed(() => {
  const judged = props.summary?.agreement.targets_reviewed ?? 0
  if (!judged) return '0%'
  return `${Math.round((doubleReviewed.value / judged) * 1000) / 10}%`
})

const reviewerColumns = [
  { key: 'reviewer', label: 'Reviewer' },
  { key: 'reviews', label: 'Verdicts', align: 'right' as const },
  { key: 'targets', label: 'Things', align: 'right' as const },
  { key: 'last_review', label: 'Last', align: 'right' as const }
]
const targetColumns = [
  { key: 'target_type', label: 'Kind' },
  { key: 'reviews', label: 'Verdicts', align: 'right' as const },
  { key: 'targets', label: 'Things', align: 'right' as const }
]

const VERDICT_LABELS: Record<string, string> = {
  correct: 'Correct',
  partially_correct: 'Partly correct',
  incorrect: 'Incorrect',
  unsafe: 'Unsafe',
  off_topic: 'Off topic',
  unclear: 'Unclear'
}
const verdictLabel = (value: string) => VERDICT_LABELS[value] ?? value.replace(/_/g, ' ')

// The bar colour carries the same meaning as the verdict buttons on the page
// below, so a glance at the distribution reads the same way as recording one.
const VERDICT_BAR: Record<string, string> = {
  correct: 'bg-emerald-500',
  partially_correct: 'bg-amber-500',
  incorrect: 'bg-red-500',
  unsafe: 'bg-red-600',
  off_topic: 'bg-gray-400',
  unclear: 'bg-gray-400'
}
const verdictBar = (value: string) => VERDICT_BAR[value] ?? 'bg-brand-500'

const TARGET_LABELS: Record<string, string> = {
  qa_answer: 'Q&A answer',
  recipe: 'Recipe',
  article: 'Article',
  guide: 'Guide'
}
const targetLabel = (value: unknown) => TARGET_LABELS[String(value)] ?? String(value ?? '—')

const formatDay = (value: unknown) => {
  if (!value) return '—'
  const when = new Date(String(value))
  return Number.isNaN(when.getTime()) ? '—' : when.toLocaleDateString()
}
</script>
