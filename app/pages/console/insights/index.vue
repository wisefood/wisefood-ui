<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />
    <ConsoleInsightsNav />
    <UPageHeader
      title="Usage Insights"
      description="What people are doing across FoodChat, FoodScholar and RecipeWrangler — searches, questions, meal plans, feedback and what it costs to run."
      :ui="{ root: 'relative py-8 border-b-0' }"
    >
      <template #links>
        <ConsoleInsightsRangeControl v-model="range" />
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="space-y-6">
        <ConsoleInsightsCollectionBanner
          :show="!collecting"
          :paused="paused"
        />

        <!--
          Why "identified users" can read zero on a busy platform.

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
          Every headline figure carries its own direction.

          A total on its own is unreadable: 400 searches is either a good week
          or a collapse, and only the period before it says which. The console
          used to show four bare counts, so the first question anyone asked of
          it — "is that up or down?" — was the one it could not answer.
        -->
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <ConsoleInsightsDeltaTile
            label="Identified users"
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
            <ConsoleInsightsEmptyState
              v-if="!trending.length"
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
            <ConsoleInsightsEmptyState
              v-if="!newFeedback.length"
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
                  <td class="px-5 py-2">
                    {{ row.app }}
                  </td>
                  <td class="px-5 py-2">
                    <UBadge
                      :color="isNegative(row) ? 'error' : 'success'"
                      variant="subtle"
                    >
                      {{ row.rating_value || row.rating_value_num || '—' }}
                    </UBadge>
                  </td>
                  <td class="max-w-xs truncate px-5 py-2 text-gray-600 dark:text-gray-300">
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
useHead({ title: 'Usage Insights · Console' })

const breadcrumbItems = consoleBreadcrumb({
  label: 'Usage Insights',
  icon: 'i-lucide-activity'
})

// Grouped the way the questions are asked, not the way the tables are laid
// out: what people did, then whether it worked, then what it cost.
// The menu and this launcher read one list, so they cannot drift.
const sections = INSIGHTS_NAV

const range = ref({ days: 7 })
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

watch(range, () => { void load() }, { deep: true })
onMounted(() => { void load() })
</script>
