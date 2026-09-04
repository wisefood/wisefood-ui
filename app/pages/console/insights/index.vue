<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />
    <ConsoleInsightsNav
      :loaded-at="loadedAt"
      :refreshing="busy"
      @refresh="reload"
    />
    <UPageHeader
      title="Analytics overview"
      description="What people are doing across FoodChat, FoodScholar and RecipeWrangler — searches, questions, meal plans, feedback and what it costs to run."
      :ui="{ root: 'relative py-8 border-b-0' }"
    >
      <template #links>
        <ConsoleInsightsRangeControl v-model="range" />
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="space-y-6">
        <!--
          "Collection is off" is a diagnosis this page may only make from a
          load that succeeded. The health probe degrades to null when the API is
          unreachable, which read as "not enabled" and lit this banner on every
          outage — telling the reader to go and switch collection on when the
          real fault was a dead gateway. So a failed load shows the failure
          below and says nothing about collection.
        -->
        <ConsoleInsightsCollectionBanner
          :show="!loading && !failed && !collecting"
          :paused="paused"
        />

        <!--
          Why "identified people" can read zero on a busy platform.

          Under opt-in, activity is counted but nobody is named until they
          agree. A healthy session count beside a zero reads exactly like a
          broken metric, so the page says which of the two it is rather than
          leaving the reader to guess — and says where the number comes from.
        -->
        <UAlert
          v-if="attributionGap"
          color="info"
          variant="subtle"
          icon="i-lucide-user-round-search"
          title="Nobody can be named yet"
          :description="attributionGap"
        />

        <!--
          The headline band has three states, not one.

          Before the data arrives the tiles rendered zeros, so every visit
          opened on "no activity" for as long as the fetch took — and a failed
          fetch left those zeros up permanently. The skeleton keeps the grid's
          shape so nothing jumps when the numbers land; a refresh never shows
          it, because the tiles already on screen are the better placeholder.
        -->
        <template v-if="loading">
          <div
            v-for="band in 2"
            :key="band"
            class="grid grid-cols-2 gap-4 sm:grid-cols-4"
            role="status"
            aria-live="polite"
            aria-label="Loading the overview"
          >
            <UCard
              v-for="n in 4"
              :key="n"
              :ui="{ body: 'p-4' }"
              class="animate-pulse border border-gray-200/70 dark:border-white/10"
            >
              <span class="block h-3 w-24 rounded bg-gray-200 dark:bg-zinc-800" />
              <span class="mt-3 block h-7 w-20 rounded bg-gray-200 dark:bg-zinc-800" />
              <span class="mt-3 block h-3 w-32 rounded bg-gray-200 dark:bg-zinc-800" />
            </UCard>
          </div>
        </template>

        <UCard
          v-else-if="failed"
          :ui="{ body: 'p-0' }"
          class="border border-gray-200/70 dark:border-white/10"
        >
          <ConsoleInsightsEmptyState
            failed
            title="The overview could not be loaded"
            hint="The request to the API failed. This is not a quiet period and it says nothing about whether collection is on — retry, and if it persists check the gateway."
          />
        </UCard>

        <template v-else>
          <!--
            Every headline figure carries its own direction.

            A total on its own is unreadable: 400 searches is either a good week
            or a collapse, and only the period before it says which. The console
            used to show four bare counts, so the first question anyone asked of
            it — "is that up or down?" — was the one it could not answer.
          -->
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ConsoleInsightsDeltaTile
              label="Identified people"
              :value="overview.active_users"
              :previous="overview.previous.active_users"
              :days="range.days"
              icon="i-lucide-users"
              hint="Only people who agreed to be named; totals below cover everyone"
            />
            <ConsoleInsightsDeltaTile
              label="Sessions"
              :value="overview.sessions"
              :previous="overview.previous.sessions"
              :days="range.days"
              icon="i-lucide-monitor-smartphone"
            />
            <ConsoleInsightsDeltaTile
              label="Searches"
              :value="overview.searches"
              :previous="overview.previous.searches"
              :days="range.days"
              icon="i-lucide-search"
            />
            <ConsoleInsightsDeltaTile
              label="Recorded actions"
              :value="overview.events"
              :previous="overview.previous.events"
              :days="range.days"
              icon="i-lucide-activity"
            />
          </div>

          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ConsoleInsightsDeltaTile
              label="Searches finding nothing"
              :value="overview.zero_result_rate"
              :previous="overview.previous.zero_result_rate"
              :days="range.days"
              icon="i-lucide-search-x"
              suffix="%"
              :decimals="1"
              :higher-is-better="false"
              hint="The catalogue's to-do list"
            />
            <ConsoleInsightsDeltaTile
              label="Negative feedback"
              :value="overview.negative_feedback_rate"
              :previous="overview.previous.negative_feedback_rate"
              :days="range.days"
              icon="i-lucide-thumbs-down"
              suffix="%"
              :decimals="1"
              :higher-is-better="false"
              :hint="`${overview.feedback_negative} of ${overview.feedback} ratings`"
            />
            <ConsoleInsightsDeltaTile
              label="Model spend"
              :value="overview.cost_usd"
              :previous="overview.previous.cost_usd"
              :days="range.days"
              icon="i-lucide-banknote"
              prefix="$"
              :decimals="2"
              :higher-is-better="false"
              :hint="spendHint"
            />
            <ConsoleInsightsDeltaTile
              label="Feedback received"
              :value="overview.feedback"
              :previous="overview.previous.feedback"
              :days="range.days"
              icon="i-lucide-message-square"
              :hint="`${overview.feedback_new} still unread`"
            />
          </div>

          <!-- The three numbers worth acting on, rather than admiring. -->
          <div class="grid gap-4 sm:grid-cols-3">
            <UCard
              :ui="{ body: 'p-4' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Searches finding nothing
              </p>
              <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                {{ overview.zero_result_rate }}%
              </p>
              <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {{ overview.searches_with_no_results }} of {{ overview.searches }} — the catalogue's to-do list
              </p>
            </UCard>
            <UCard
              :ui="{ body: 'p-4' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Negative feedback
              </p>
              <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                {{ overview.negative_feedback_rate }}%
              </p>
              <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {{ overview.feedback_new }} awaiting triage
              </p>
            </UCard>
            <UCard
              :ui="{ body: 'p-4' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Model spend
              </p>
              <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                ${{ overview.cost_usd.toFixed(2) }}
              </p>
              <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {{ overview.llm_calls }} calls · {{ overview.total_tokens.toLocaleString() }} tokens
              </p>
            </UCard>
          </div>

          <div class="grid gap-6 lg:grid-cols-2">
            <ConsoleStatsChartCard title="Activity over time">
              <ConsoleStatsLineChart
                :data="activitySeries"
                color="#d53355"
              />
            </ConsoleStatsChartCard>
            <ConsoleStatsChartCard title="Actions by product">
              <ConsoleStatsBarChart
                :data="appSeries"
                color="#a6b52b"
              />
            </ConsoleStatsChartCard>
          </div>
        </template>

        <!-- Straight to the two things an expert is here to do. -->
        <div class="grid gap-6 lg:grid-cols-2">
          <UCard
            :ui="{ body: 'p-0' }"
            class="overflow-hidden border border-gray-200/70 dark:border-white/10"
          >
            <div class="flex items-center justify-between border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                Trending searches
              </h3>
              <UButton
                to="/console/insights/queries"
                color="neutral"
                variant="ghost"
                size="xs"
                trailing-icon="i-lucide-arrow-right"
              >
                All searches
              </UButton>
            </div>
            <div
              v-if="loading"
              class="animate-pulse divide-y divide-gray-100 px-5 dark:divide-zinc-800"
              role="status"
              aria-live="polite"
              aria-label="Loading trending searches"
            >
              <div
                v-for="n in 5"
                :key="n"
                class="flex gap-6 py-3"
              >
                <span class="h-3 flex-1 rounded bg-gray-200 dark:bg-zinc-800" />
                <span class="h-3 w-12 rounded bg-gray-200 dark:bg-zinc-800" />
                <span class="h-3 w-12 rounded bg-gray-200 dark:bg-zinc-800" />
              </div>
            </div>
            <ConsoleInsightsEmptyState
              v-else-if="failed"
              failed
              title="Trending searches could not be loaded"
              hint="The request to the API failed. This is not an empty period — retry, and if it persists check the gateway."
            />
            <ConsoleInsightsEmptyState
              v-else-if="!trending.length"
              title="No searches recorded yet."
              :hint="collecting ? 'They appear here as people search.' : 'Collection is off.'"
              icon="i-lucide-search"
            />
            <table
              v-else
              class="w-full text-sm"
            >
              <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-zinc-900/50 dark:text-gray-400">
                <tr>
                  <th class="px-5 py-2">
                    Query
                  </th>
                  <th class="px-5 py-2 text-right">
                    Searches
                  </th>
                  <th class="px-5 py-2 text-right">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in trending.slice(0, 8)"
                  :key="row.query_hash"
                  class="border-t border-gray-100 dark:border-zinc-800"
                >
                  <td class="px-5 py-2 text-gray-900 dark:text-white">
                    {{ row.query }}
                  </td>
                  <td class="px-5 py-2 text-right tabular-nums">
                    {{ row.searches }}
                  </td>
                  <td class="px-5 py-2 text-right tabular-nums">
                    <UBadge
                      v-if="row.is_new"
                      color="info"
                      variant="subtle"
                    >
                      new
                    </UBadge>
                    <span
                      v-else
                      :class="(row.change_pct ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'"
                    >
                      {{ (row.change_pct ?? 0) >= 0 ? '+' : '' }}{{ row.change_pct }}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </UCard>

          <UCard
            :ui="{ body: 'p-0' }"
            class="overflow-hidden border border-gray-200/70 dark:border-white/10"
          >
            <div class="flex items-center justify-between border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                Feedback awaiting triage
              </h3>
              <UButton
                to="/console/insights/feedback"
                color="neutral"
                variant="ghost"
                size="xs"
                trailing-icon="i-lucide-arrow-right"
              >
                Inbox
              </UButton>
            </div>
            <div
              v-if="loading"
              class="animate-pulse divide-y divide-gray-100 px-5 dark:divide-zinc-800"
              role="status"
              aria-live="polite"
              aria-label="Loading feedback awaiting triage"
            >
              <div
                v-for="n in 5"
                :key="n"
                class="flex gap-6 py-3"
              >
                <span class="h-3 w-16 rounded bg-gray-200 dark:bg-zinc-800" />
                <span class="h-3 w-12 rounded bg-gray-200 dark:bg-zinc-800" />
                <span class="h-3 flex-1 rounded bg-gray-200 dark:bg-zinc-800" />
              </div>
            </div>
            <ConsoleInsightsEmptyState
              v-else-if="failed"
              failed
              title="The inbox could not be loaded"
              hint="The request to the API failed. Feedback may well be waiting — retry, and if it persists check the gateway."
            />
            <ConsoleInsightsEmptyState
              v-else-if="!newFeedback.length"
              title="Nothing waiting."
              hint="Feedback people leave in the apps arrives here."
              icon="i-lucide-message-square"
            />
            <table
              v-else
              class="w-full text-sm"
            >
              <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-zinc-900/50 dark:text-gray-400">
                <tr>
                  <th class="px-5 py-2">
                    From
                  </th>
                  <th class="px-5 py-2">
                    Rating
                  </th>
                  <th class="px-5 py-2">
                    Comment
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in newFeedback.slice(0, 8)"
                  :key="row.id"
                  class="border-t border-gray-100 dark:border-zinc-800"
                >
                  <td class="px-5 py-2 align-top">
                    {{ row.app }}
                  </td>
                  <td class="px-5 py-2 align-top">
                    <UBadge
                      :color="isNegative(row) ? 'error' : 'success'"
                      variant="subtle"
                    >
                      {{ row.rating_value || row.rating_value_num || '—' }}
                    </UBadge>
                  </td>
                  <!--
                    Wrapped, not truncated: a complaint cut off at the column
                    edge is a complaint the reviewer cannot read, and reading it
                    is the whole reason the panel is here.
                  -->
                  <td class="max-w-md break-words px-5 py-2 text-gray-600 dark:text-gray-300">
                    {{ row.comment || '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </UCard>
        </div>

        <!--
          Grouped, not listed.

          Twelve equal buttons is a wall: everything looks the same weight and
          nothing tells you which page answers your question. The headings are
          the questions people actually arrive with — what did they do, who
          were they, is it any good, is it working, what did it cost.
        -->
        <div class="space-y-5">
          <div
            v-for="group in sections"
            :key="group.title"
          >
            <div class="mb-2 flex items-baseline gap-2">
              <h3 class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {{ group.title }}
              </h3>
              <span class="text-xs text-gray-400 dark:text-gray-500">{{ group.links.length }} pages</span>
            </div>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <UButton
                v-for="link in group.links"
                :key="link.to"
                :to="link.to"
                color="neutral"
                variant="outline"
                :icon="link.icon"
                class="justify-start"
                :title="link.hint"
              >
                {{ link.label }}
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import insightsApi, {
  emptyOverview,
  type FeedbackRow,
  type Overview,
  type TrendingRow
} from '~/services/insightsApi'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'
import { INSIGHTS_NAV } from '~/utils/insightsNav'

definePageMeta({ layout: 'default' })
// Named the way the nav and the Control Panel card already name it. Three
// names for one page — "Usage Insights", "Overview", "Analytics" — meant
// nobody could be sure they had landed where the link said.
useHead({ title: 'Analytics overview · Console' })

const breadcrumbItems = consoleBreadcrumb({
  label: 'Analytics overview',
  icon: 'i-lucide-activity'
})

// Grouped the way the questions are asked, not the way the tables are laid
// out: what people did, then whether it worked, then what it cost.
// The menu and this launcher read one list, so they cannot drift.
const sections = INSIGHTS_NAV

const range = useInsightsRange(7)
const overview = ref<Overview>(emptyOverview())
const unpricedCalls = ref(0)
const trending = ref<TrendingRow[]>([])
const newFeedback = ref<FeedbackRow[]>([])
const collecting = ref(true)
const paused = ref(false)

// The line chart takes {bucket, value}; the bar chart takes {label, value}.
const activitySeries = computed(() =>
  overview.value.daily.map(d => ({ bucket: d.day, value: d.events }))
)
const appSeries = computed(() =>
  overview.value.events_by_app.map(a => ({ label: a.app, value: a.events }))
)

const NEGATIVE = new Set(['down', 'not_helpful', 'bad', 'awful'])
const isNegative = (row: FeedbackRow) =>
  NEGATIVE.has(row.rating_value ?? '') || (row.rating_value_num ?? 5) <= 2

/**
 * What the spend figure does not include.
 *
 * A model with no published rate is priced NULL rather than zero, so the total
 * is a floor. Saying so next to the number is the difference between a figure
 * somebody can act on and one they will later discover was wrong.
 */
/**
 * The sentence that explains a zero, or nothing when there is nothing to
 * explain. Empty as soon as somebody has consented, so it disappears the
 * moment it stops being true rather than nagging forever.
 */
const attributionGap = computed(() => {
  const consent = overview.value.consent
  if (!consent || consent.consented_users > 0) return ''
  if (overview.value.active_users > 0) return ''
  // Nothing recorded at all is a different problem, and the collection
  // banner above already covers it.
  if (overview.value.sessions === 0) return ''
  if (consent.mode === 'opt_in') {
    return `${overview.value.sessions.toLocaleString()} sessions were recorded, `
      + 'but nobody has agreed to being named yet — so every per-person view is '
      + 'empty. That is the opt-in setting working, not a fault. People grant it '
      + 'by accepting the cookie banner, or in their profile. Totals, searches '
      + 'and feedback below are complete either way.'
  }
  return 'No activity could be attributed to a person in this period, though '
    + 'the platform is set to attribute by default. Worth checking that the '
    + 'gateway is seeing tokens on these requests.'
})

const spendHint = computed(() =>
  unpricedCalls.value
    ? `${unpricedCalls.value} calls unpriced — this is a floor`
    : 'Estimated from published list prices'
)

async function load() {
  const [summary, queries, feedback, health, usage] = await Promise.all([
    insightsApi.getOverview(range.value.days),
    insightsApi.getTrending(range.value.days, 10),
    insightsApi.getFeedback({ status: 'new', limit: 10 }),
    insightsApi.getHealth(),
    insightsApi.getLlmUsage(range.value.days)
  ])
  overview.value = summary
  trending.value = queries.top
  newFeedback.value = feedback.items
  collecting.value = Boolean(health?.enabled)
  paused.value = Boolean(health?.settings?.paused)
  unpricedCalls.value = usage.by_model.reduce((sum, row) => sum + (row.unpriced_calls ?? 0), 0)
}

// "Empty" is every number and every list at zero: only then may the page
// suggest that collection is off rather than that nothing much happened.
const { loading, failed, loadedAt, reload, busy } = useInsightsLoad(load, () =>
  overview.value.sessions === 0
  && overview.value.events === 0
  && overview.value.searches === 0
  && !trending.value.length
  && !newFeedback.value.length
)

watch(range, () => {
  void reload()
}, { deep: true })
onMounted(() => {
  void reload()
})
</script>
