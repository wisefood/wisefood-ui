<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />
    <ConsoleInsightsNav />
    <UPageHeader
      title="Feedback inbox"
      description="Everything people told us, from every part of the platform, in one list."
      :ui="{ root: 'relative py-8 border-b-0' }"
    >
      <template #links>
        <ConsoleInsightsExportButton
          report="feedback-targets"
          :days="qualityDays"
          label="Targets CSV"
        />
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
          :loading="loading"
          @click="load"
        >
          Refresh
        </UButton>
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="space-y-6">
        <!--
          Feedback as a measurement rather than a queue. The inbox below says
          what people wrote; this says whether it is getting better, and which
          of the things we ship is drawing the complaints.
        -->
        <section class="space-y-4">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Feedback quality
            </h2>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              Last {{ qualityDays }} days
            </span>
          </div>

          <!--
            Three different silences, and the page names which one it is: the
            service not answering, collection switched off, and nobody having
            said anything.
          -->
          <ConsoleInsightsEmptyState
            v-if="!quality || !quality.score.responses && !backlogTotal"
            class="rounded-xl border border-gray-200/70 dark:border-white/10"
            :title="quality ? 'No feedback recorded in this period.' : 'Feedback quality is unavailable.'"
            :hint="quality
              ? emptyHint
              : 'The analytics service did not answer, so this says nothing about how much feedback arrived.'"
            :icon="quality ? 'i-lucide-message-square' : 'i-lucide-plug-zap'"
          />
          <template v-else>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <UCard
                :ui="{ body: 'p-4' }"
                class="border border-gray-200/70 dark:border-white/10"
              >
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Average score
                </p>
                <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                  {{ quality.score.mean ?? '—' }}
                  <span
                    v-if="quality.score.mean !== null"
                    class="text-base font-normal text-gray-400 dark:text-gray-500"
                  >/ 5</span>
                </p>
                <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  the {{ quality.score.scale }} ratings only — a thumb has no score to average
                </p>
              </UCard>
              <UCard
                :ui="{ body: 'p-4' }"
                class="border border-gray-200/70 dark:border-white/10"
              >
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Median score
                </p>
                <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                  {{ quality.score.median ?? '—' }}
                </p>
                <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  what the middle respondent said
                </p>
              </UCard>
              <UCard
                :ui="{ body: 'p-4' }"
                class="border border-gray-200/70 dark:border-white/10"
              >
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Scored responses
                </p>
                <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                  {{ quality.score.responses.toLocaleString() }}
                </p>
                <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  out of {{ feedbackTotal.toLocaleString() }} pieces of feedback
                </p>
              </UCard>
              <UCard
                :ui="{ body: 'p-4' }"
                class="border border-gray-200/70 dark:border-white/10"
              >
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Oldest untriaged
                </p>
                <p
                  class="mt-1 text-2xl font-semibold tabular-nums"
                  :class="staleBacklog
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-900 dark:text-white'"
                >
                  {{ oldestAge }}
                </p>
                <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  <!-- A count says how much is waiting; an age says how badly. -->
                  how long the oldest unread complaint has been sitting there
                </p>
              </UCard>
            </div>

            <div
              v-if="backlog.length"
              class="flex flex-wrap items-center gap-2"
            >
              <span class="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Backlog
              </span>
              <UBadge
                v-for="entry in backlog"
                :key="entry.status"
                :color="statusColor(entry.status)"
                variant="subtle"
              >
                {{ entry.count.toLocaleString() }} {{ statusLabel(entry.status) }}
              </UBadge>
            </div>

            <!--
              Negative rate per scale, never pooled. A thumbs-down is a
              complaint; choosing answer A over answer B is not, and averaging
              the two together diluted the only rate worth watching.
            -->
            <ConsoleInsightsTablePanel
              title="By rating scale"
              subtitle="Each scale judged on its own terms"
              :rows="quality.by_kind"
              :columns="kindColumns"
              empty="No ratings recorded."
              :empty-hint="emptyHint"
              empty-icon="i-lucide-scale"
            >
              <template #cell-rating_kind="{ row }">
                {{ kindLabel(row.rating_kind) }}
              </template>
              <template #cell-negative="{ row }">
                <span v-if="row.can_be_negative">{{ row.negative.toLocaleString() }}</span>
                <span
                  v-else
                  class="text-gray-400 dark:text-gray-500"
                >—</span>
              </template>
              <template #cell-negative_rate="{ row }">
                <span
                  v-if="row.can_be_negative"
                  :class="row.negative_rate >= 25 ? 'text-red-600 dark:text-red-400' : ''"
                >
                  {{ pct(row.negative_rate) }}
                </span>
                <UBadge
                  v-else
                  color="neutral"
                  variant="subtle"
                  size="sm"
                >
                  a preference, not a complaint
                </UBadge>
              </template>
              <template #cell-avg_score="{ row }">
                {{ row.avg_score ?? '—' }}
              </template>
            </ConsoleInsightsTablePanel>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              A preference vote picks one of two answers, so one side is always “not chosen”.
              Counting that as dissatisfaction would put a floor of fifty percent under the
              platform's complaint rate, which is why those rows carry no rate at all.
            </p>

            <div class="grid gap-6 lg:grid-cols-2">
              <ConsoleInsightsTablePanel
                title="Why people complained"
                subtitle="The reason picked alongside the rating"
                :rows="quality.reasons"
                :columns="reasonColumns"
                empty="No reasons given."
                empty-hint="The reason is optional, so it is only there when somebody chose one."
                empty-icon="i-lucide-list"
              />
              <ConsoleInsightsTablePanel
                title="Day by day"
                subtitle="Volume, complaints and average score together"
                :rows="dailyRows"
                :columns="dailyColumns"
                empty="No feedback in this period."
                :empty-hint="emptyHint"
                empty-icon="i-lucide-calendar"
              >
                <template #cell-avg_score="{ row }">
                  {{ row.avg_score ?? '—' }}
                </template>
              </ConsoleInsightsTablePanel>
            </div>

            <ConsoleStatsChartCard title="Feedback per day">
              <ConsoleStatsLineChart
                :data="dailySeries"
                color="#d53355"
              />
            </ConsoleStatsChartCard>

            <ConsoleInsightsTablePanel
              title="What draws complaints"
              subtitle="The specific recipe, article or answer people objected to, worst rate first"
              :rows="targetRows"
              :columns="targetColumns"
              empty="Nothing has been complained about."
              :empty-hint="emptyHint"
              empty-icon="i-lucide-crosshair"
            >
              <template #cell-negative_rate="{ row }">
                <span :class="row.negative_rate >= 50 ? 'text-red-600 dark:text-red-400' : ''">
                  {{ pct(row.negative_rate) }}
                </span>
              </template>
              <template #cell-last_seen="{ row }">
                {{ formatDay(row.last_seen) }}
              </template>
            </ConsoleInsightsTablePanel>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              A rate over a handful of ratings is noise: read the count beside it before treating
              a hundred percent as a verdict.
            </p>
          </template>
        </section>

        <div class="flex flex-wrap items-center gap-2">
          <UButton
            v-for="filter in filters"
            :key="filter.value"
            :color="status === filter.value ? 'primary' : 'neutral'"
            :variant="status === filter.value ? 'solid' : 'outline'"
            size="sm"
            @click="setStatus(filter.value)"
          >
            {{ filter.label }}
          </UButton>
          <div class="grow" />
          <UButton
            :color="negativeOnly ? 'error' : 'neutral'"
            :variant="negativeOnly ? 'solid' : 'outline'"
            size="sm"
            icon="i-lucide-thumbs-down"
            @click="toggleNegative"
          >
            Negative only
          </UButton>
        </div>

        <UCard
          :ui="{ body: 'p-0' }"
          class="overflow-hidden border border-gray-200/70 dark:border-white/10"
        >
          <ConsoleInsightsEmptyState
            v-if="!items.length"
            :title="status === 'new' ? 'Nothing waiting.' : 'No feedback here.'"
            :hint="emptyHint"
            icon="i-lucide-message-square"
          />
          <ul
            v-else
            class="divide-y divide-gray-100 dark:divide-zinc-800"
          >
            <li
              v-for="row in items"
              :key="row.id"
              class="px-5 py-4"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <UBadge
                      :color="isNegative(row) ? 'error' : 'success'"
                      variant="subtle"
                    >
                      {{ row.rating_value || row.rating_value_num || '—' }}
                    </UBadge>
                    <UBadge
                      color="neutral"
                      variant="subtle"
                    >
                      {{ row.app }}
                    </UBadge>
                    <span class="text-xs text-gray-400 dark:text-gray-500">
                      {{ row.target_type }}<template v-if="row.target_id"> · {{ row.target_id }}</template>
                    </span>
                    <span class="text-xs text-gray-400 dark:text-gray-500">
                      {{ formatWhen(row.occurred_at) }}
                    </span>
                  </div>
                  <p
                    v-if="row.comment"
                    class="mt-2 text-sm text-gray-800 dark:text-gray-200"
                  >
                    {{ row.comment }}
                  </p>
                  <p
                    v-else-if="row.reason"
                    class="mt-2 text-sm text-gray-600 dark:text-gray-300"
                  >
                    {{ row.reason }}
                  </p>
                  <p
                    v-else
                    class="mt-2 text-sm italic text-gray-400 dark:text-gray-500"
                  >
                    No comment left.
                  </p>
                  <p class="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    <template v-if="row.user_id">
                      {{ row.user_id }}
                    </template>
                    <template v-else>
                      Not attributed — this person has not agreed to be named
                    </template>
                  </p>
                </div>

                <div class="flex shrink-0 items-center gap-2">
                  <!--
                    A complaint on its own is an opinion; the session it came
                    out of is what the person was actually doing when they
                    formed it, which is usually the half that explains it.
                  -->
                  <UButton
                    v-if="row.client_session_id"
                    :to="`/console/insights/sessions/${row.client_session_id}`"
                    color="neutral"
                    variant="outline"
                    size="xs"
                    icon="i-lucide-footprints"
                  >
                    Session
                  </UButton>
                  <UButton
                    v-if="row.target_type === 'qa_answer' && row.target_id"
                    :to="`/console/insights/qa?request=${row.target_id}`"
                    color="neutral"
                    variant="outline"
                    size="xs"
                    icon="i-lucide-message-circle-question"
                  >
                    See answer
                  </UButton>
                  <UButton
                    v-if="row.status !== 'triaged'"
                    color="neutral"
                    variant="outline"
                    size="xs"
                    :loading="saving === row.id"
                    @click="setRowStatus(row, 'triaged')"
                  >
                    Mark read
                  </UButton>
                  <UButton
                    v-if="row.status !== 'resolved'"
                    color="primary"
                    variant="soft"
                    size="xs"
                    icon="i-lucide-check"
                    :loading="saving === row.id"
                    @click="setRowStatus(row, 'resolved')"
                  >
                    Resolve
                  </UButton>
                  <UBadge
                    v-else
                    color="success"
                    variant="subtle"
                  >
                    resolved
                  </UBadge>
                </div>
              </div>
            </li>
          </ul>

          <template
            v-if="total > pageSize"
            #footer
          >
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ total }} in total
              </span>
              <UPagination
                v-model:page="page"
                :items-per-page="pageSize"
                :total="total"
              />
            </div>
          </template>
        </UCard>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import insightsApi, {
  type FeedbackQuality,
  type FeedbackRow,
  type FeedbackTargetRow
} from '~/services/insightsApi'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Feedback inbox · Console' })

const breadcrumbItems = consoleBreadcrumb(
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/console/insights' },
  { label: 'Feedback inbox', icon: 'i-lucide-message-square' }
)

const filters = [
  { label: 'New', value: 'new' },
  { label: 'Read', value: 'triaged' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'All', value: '' }
]

/*
 * The session an item came from, described here rather than assumed of the
 * shared row type: the inbox reads a field it does not own, and an optional
 * widening keeps the page compiling whichever way that type is written.
 */
type InboxRow = FeedbackRow & { client_session_id?: string | null }

const pageSize = 25
const qualityDays = 30
const status = ref('new')
const negativeOnly = ref(false)
const page = ref(1)
const total = ref(0)
const items = ref<InboxRow[]>([])
const loading = ref(false)
const saving = ref<number | null>(null)

const quality = ref<FeedbackQuality | null>(null)
const targets = ref<FeedbackTargetRow[]>([])
const collecting = ref(true)

// Nothing to show because nobody said anything, and nothing to show because
// nothing is being recorded, look identical — and only one is a fault.
const emptyHint = computed(() =>
  collecting.value
    ? 'Ratings and comments from the apps arrive here as people leave them.'
    : 'Activity collection is switched off, so nothing is being recorded.'
)

const backlog = computed(() => quality.value?.backlog ?? [])
const backlogTotal = computed(() => backlog.value.reduce((sum, row) => sum + row.count, 0))
const dailyRows = computed(() => quality.value?.daily ?? [])
const feedbackTotal = computed(() =>
  dailyRows.value.reduce((sum, row) => sum + row.feedback, 0)
)
const dailySeries = computed(() =>
  dailyRows.value.map(row => ({ bucket: row.day, value: row.feedback }))
)

/*
 * The report returns the twenty-five things with the most complaints; sorting
 * those by rate puts what is disliked *whenever it is seen* above what is
 * merely seen a lot.
 */
const targetRows = computed(() =>
  [...targets.value].sort((a, b) => b.negative_rate - a.negative_rate)
)

const kindColumns = [
  { key: 'rating_kind', label: 'Scale' },
  { key: 'feedback', label: 'Ratings', align: 'right' as const },
  { key: 'negative', label: 'Negative', align: 'right' as const },
  { key: 'negative_rate', label: 'Negative rate', align: 'right' as const },
  { key: 'avg_score', label: 'Average', align: 'right' as const }
]
const reasonColumns = [
  { key: 'reason', label: 'Reason' },
  { key: 'count', label: 'Times', align: 'right' as const },
  { key: 'negative', label: 'Of those, negative', align: 'right' as const }
]
const dailyColumns = [
  { key: 'day', label: 'Day' },
  { key: 'feedback', label: 'Feedback', align: 'right' as const },
  { key: 'negative', label: 'Negative', align: 'right' as const },
  { key: 'avg_score', label: 'Average score', align: 'right' as const }
]
const targetColumns = [
  { key: 'target_type', label: 'Kind' },
  { key: 'target_id', label: 'What', truncate: true },
  { key: 'app', label: 'Product' },
  { key: 'feedback', label: 'Ratings', align: 'right' as const },
  { key: 'negative', label: 'Negative', align: 'right' as const },
  { key: 'negative_rate', label: 'Negative rate', align: 'right' as const },
  { key: 'last_seen', label: 'Last', align: 'right' as const }
]

// Names the scales the way somebody reading the console thinks of them.
const KIND_LABELS: Record<string, string> = {
  thumbs: 'Thumbs up or down',
  likert5: 'Five-point score',
  helpful: 'Helpful or not',
  ab: 'A or B preference'
}
const kindLabel = (value: unknown) => KIND_LABELS[String(value)] ?? String(value ?? '—')

// Nuxt UI types its colours as a closed union; an inferred `string` is rejected.
type Tone = 'error' | 'info' | 'success' | 'warning' | 'neutral' | 'primary'

const STATUS_TONE: Record<string, Tone> = {
  new: 'warning',
  triaged: 'info',
  resolved: 'success'
}
const statusColor = (value: string): Tone => STATUS_TONE[value] ?? 'neutral'
const STATUS_LABELS: Record<string, string> = {
  new: 'unread',
  triaged: 'read',
  resolved: 'resolved'
}
const statusLabel = (value: string) => STATUS_LABELS[value] ?? value

const pct = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${value}%`

const NEGATIVE = new Set(['down', 'not_helpful', 'bad', 'awful'])
const isNegative = (row: FeedbackRow) =>
  NEGATIVE.has(row.rating_value ?? '') || (row.rating_value_num ?? 5) <= 2

const formatWhen = (value: string | null) => {
  if (!value) return ''
  const when = new Date(value)
  return Number.isNaN(when.getTime()) ? '' : when.toLocaleString()
}

const formatDay = (value: unknown) => {
  if (!value) return '—'
  const when = new Date(String(value))
  return Number.isNaN(when.getTime()) ? '—' : when.toLocaleDateString()
}

/**
 * The wait, not the timestamp. "11 days" is a state of the backlog;
 * "2026-08-24T09:12Z" is a fact somebody has to do arithmetic on first.
 */
const oldestAge = computed(() => {
  const oldest = quality.value?.oldest_untriaged
  if (!oldest) return 'Nothing waiting'
  const when = new Date(oldest).getTime()
  if (Number.isNaN(when)) return '—'
  const minutes = Math.max(0, Math.round((Date.now() - when) / 60_000))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return hours === 1 ? '1 hour' : `${hours} hours`
  const days = Math.round(hours / 24)
  return days === 1 ? '1 day' : `${days} days`
})

// A week is the point at which "we will get to it" stopped being true.
const staleBacklog = computed(() => {
  const oldest = quality.value?.oldest_untriaged
  if (!oldest) return false
  const when = new Date(oldest).getTime()
  return !Number.isNaN(when) && Date.now() - when > 7 * 86_400_000
})

function setStatus(value: string) {
  status.value = value
  page.value = 1
}

function toggleNegative() {
  negativeOnly.value = !negativeOnly.value
  page.value = 1
}

async function load() {
  loading.value = true
  const [result, report, byTarget, health] = await Promise.all([
    insightsApi.getFeedback({
      limit: pageSize,
      offset: (page.value - 1) * pageSize,
      status: status.value || undefined,
      negativeOnly: negativeOnly.value
    }),
    insightsApi.getFeedbackQuality(qualityDays),
    insightsApi.getFeedbackTargets(qualityDays, 25),
    insightsApi.getHealth()
  ])
  total.value = result.total
  items.value = result.items
  quality.value = report
  targets.value = byTarget
  collecting.value = Boolean(health?.enabled)
  loading.value = false
}

async function setRowStatus(row: FeedbackRow, next: 'triaged' | 'resolved') {
  saving.value = row.id
  const ok = await insightsApi.setFeedbackStatus(row.id, next)
  saving.value = null
  if (!ok) return
  // Filtered lists drop the row rather than showing it in a state the filter
  // excludes; an unfiltered list keeps it and just updates the badge.
  if (status.value && status.value !== next) {
    items.value = items.value.filter(item => item.id !== row.id)
    total.value = Math.max(0, total.value - 1)
  } else {
    row.status = next
  }
}

watch([status, negativeOnly, page], () => { void load() })
onMounted(() => { void load() })
</script>
