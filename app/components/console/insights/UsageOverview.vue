<template>
  <div class="space-y-6">
    <ConsoleInsightsCollectionBanner
      :show="!collecting"
      :paused="paused"
    />

    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        What people did across FoodChat, FoodScholar and RecipeWrangler
      </p>
      <ConsoleInsightsRangePicker v-model="days" />
    </div>

    <!-- The decisions first, the totals after. -->
    <ConsoleInsightsAttentionPanel :items="attention" />

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <ConsoleInsightsDeltaTile
        label="People (identified)"
        :value="overview.active_users"
        :previous="overview.previous.active_users"
        :days="days"
        icon="i-lucide-users"
        hint="first period"
      />
      <ConsoleInsightsDeltaTile
        label="Sessions"
        :value="overview.sessions"
        :previous="overview.previous.sessions"
        :days="days"
        icon="i-lucide-monitor-smartphone"
      />
      <ConsoleInsightsDeltaTile
        label="Searches"
        :value="overview.searches"
        :previous="overview.previous.searches"
        :days="days"
        icon="i-lucide-search"
      />
      <ConsoleInsightsDeltaTile
        label="Model spend"
        :value="overview.cost_usd"
        :previous="overview.previous.cost_usd"
        :days="days"
        icon="i-lucide-cpu"
        prefix="$"
        :decimals="2"
        :higher-is-better="false"
      />
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <ConsoleInsightsDeltaTile
        label="Searches finding nothing"
        :value="overview.zero_result_rate"
        :previous="overview.previous.zero_result_rate"
        :days="days"
        icon="i-lucide-search-x"
        suffix="%"
        :decimals="1"
        :higher-is-better="false"
      />
      <ConsoleInsightsDeltaTile
        label="Negative feedback"
        :value="overview.negative_feedback_rate"
        :previous="overview.previous.negative_feedback_rate"
        :days="days"
        icon="i-lucide-thumbs-down"
        suffix="%"
        :decimals="1"
        :higher-is-better="false"
      />
      <ConsoleInsightsDeltaTile
        label="Recorded actions"
        :value="overview.events"
        :previous="overview.previous.events"
        :days="days"
        icon="i-lucide-activity"
      />
      <ConsoleInsightsDeltaTile
        label="Model calls"
        :value="overview.llm_calls"
        :previous="0"
        :days="days"
        icon="i-lucide-sparkles"
        :hint="`${overview.total_tokens.toLocaleString()} tokens`"
      />
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <ConsoleStatsChartCard title="Activity over time">
          <ConsoleStatsLineChart
            :data="activitySeries"
            color="#d53355"
          />
        </ConsoleStatsChartCard>
      </div>
      <ConsoleStatsChartCard title="Actions by product">
        <ConsoleStatsBarChart
          :data="appSeries"
          color="#a6b52b"
        />
      </ConsoleStatsChartCard>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <ConsoleInsightsTablePanel
        title="Trending searches"
        subtitle="Compared with the previous period"
        to="/console/insights/queries"
        link-label="All searches"
        :rows="trending"
        :columns="trendingColumns"
        empty="No searches recorded yet."
        :empty-hint="collecting ? 'They appear as people search.' : 'Collection is off.'"
        empty-icon="i-lucide-search"
      >
        <template #cell-change="{ row }">
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
        </template>
      </ConsoleInsightsTablePanel>

      <ConsoleInsightsTablePanel
        title="Searches finding nothing"
        subtitle="Each one is a gap in the catalogue"
        to="/console/insights/queries"
        link-label="Review gaps"
        :rows="zeroResult"
        :columns="zeroColumns"
        empty="Every search found something."
        empty-hint="Nothing to fix here."
        empty-icon="i-lucide-check-circle-2"
      />
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <ConsoleInsightsTablePanel
        title="Feedback awaiting triage"
        subtitle="What people told us, unread"
        to="/console/insights/feedback"
        link-label="Open inbox"
        :rows="newFeedback"
        :columns="feedbackColumns"
        empty="Nothing waiting."
        empty-hint="Feedback from the apps arrives here."
        empty-icon="i-lucide-message-square"
      >
        <template #cell-rating="{ row }">
          <UBadge
            :color="isNegative(row) ? 'error' : 'success'"
            variant="subtle"
          >
            {{ row.rating_value || row.rating_value_num || '—' }}
          </UBadge>
        </template>
      </ConsoleInsightsTablePanel>

      <ConsoleInsightsTablePanel
        title="Model spend by product"
        subtitle="Where the tokens go"
        to="/console/insights/usage"
        link-label="Full breakdown"
        :rows="usageByApp"
        :columns="usageColumns"
        empty="No model calls recorded."
        empty-hint="Usage is reported by the services as they run."
        empty-icon="i-lucide-cpu"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import insightsApi, {
  emptyOverview,
  type AttentionItem,
  type FeedbackRow,
  type Overview,
  type TrendingRow,
  type UsageRow,
  type ZeroResultRow
} from '~/services/insightsApi'

/**
 * The Usage tab of the console's analytics page.
 *
 * A component rather than a page so it sits alongside Content and
 * Observability in the existing Analytics screen instead of becoming a second
 * place people have to know about.
 */

const days = ref(7)
const overview = ref<Overview>(emptyOverview())
const attention = ref<AttentionItem[]>([])
const trending = ref<TrendingRow[]>([])
const zeroResult = ref<ZeroResultRow[]>([])
const newFeedback = ref<FeedbackRow[]>([])
const usageByApp = ref<UsageRow[]>([])
const collecting = ref(true)
const paused = ref(false)

const trendingColumns = [
  { key: 'query', label: 'Query' },
  { key: 'searches', label: 'Searches', align: 'right' as const },
  { key: 'change', label: 'Change', align: 'right' as const }
]
const zeroColumns = [
  { key: 'query', label: 'Query' },
  { key: 'searches', label: 'Times', align: 'right' as const },
  { key: 'sessions', label: 'People', align: 'right' as const }
]
const feedbackColumns = [
  { key: 'app', label: 'From' },
  { key: 'rating', label: 'Rating' },
  { key: 'comment', label: 'Comment', truncate: true }
]
const usageColumns = [
  { key: 'app', label: 'Product' },
  { key: 'calls', label: 'Calls', align: 'right' as const },
  { key: 'cost_usd', label: 'Cost', align: 'right' as const, money: true }
]

const activitySeries = computed(() =>
  overview.value.daily.map(d => ({ bucket: d.day, value: d.events }))
)
const appSeries = computed(() =>
  overview.value.events_by_app.map(a => ({ label: a.app, value: a.events }))
)

const NEGATIVE = new Set(['down', 'not_helpful', 'bad', 'awful'])
const isNegative = (row: FeedbackRow) =>
  NEGATIVE.has(row.rating_value ?? '') || (row.rating_value_num ?? 5) <= 2

async function load() {
  const [summary, items, queries, zero, feedback, usage, health] = await Promise.all([
    insightsApi.getOverview(days.value),
    insightsApi.getAttention(days.value),
    insightsApi.getTrending(days.value, 8),
    insightsApi.getZeroResult(days.value, 8),
    insightsApi.getFeedback({ status: 'new', limit: 8 }),
    insightsApi.getLlmUsage(days.value),
    insightsApi.getHealth()
  ])
  overview.value = summary
  attention.value = items
  trending.value = queries.top
  zeroResult.value = zero
  newFeedback.value = feedback.items
  usageByApp.value = usage.by_app
  collecting.value = Boolean(health?.enabled)
  paused.value = Boolean(health?.settings?.paused)
}

watch(days, () => { void load() })
onMounted(() => { void load() })
</script>
