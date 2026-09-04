<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />
    <ConsoleInsightsNav />
    <UPageHeader
      title="Search insights"
      description="What people look for, what is newly popular, and what the catalogue does not have."
      :ui="{ root: 'relative py-8 border-b-0' }"
    >
      <template #links>
        <ConsoleInsightsRangeControl v-model="range" />
        <ConsoleInsightsExportButton
          report="queries"
          :days="windowDays"
          label="Queries CSV"
        />
        <ConsoleInsightsExportButton
          report="zero-result"
          :days="windowDays"
          label="Gaps CSV"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="space-y-6">
        <p
          v-if="customRange"
          class="text-xs text-gray-500 dark:text-gray-400"
        >
          Custom range {{ rangeLabel }}. Reports are served as a window ending now,
          so these figures cover the last {{ windowDays }} days.
        </p>

        <div class="grid gap-4 sm:grid-cols-3">
          <ConsoleStatsStatTile
            label="Distinct queries"
            :value="top.length"
            icon="i-lucide-search"
          />
          <ConsoleStatsStatTile
            label="Newly rising"
            :value="rising.filter(r => r.is_new).length"
            icon="i-lucide-trending-up"
          />
          <ConsoleStatsStatTile
            label="Queries finding nothing"
            :value="zeroResult.length"
            icon="i-lucide-search-x"
          />
        </div>

        <!--
          Two columns from lg up: what somebody opened this page to read on the
          left, the summaries that qualify it on the right. As one column the
          searches themselves sat three screens down and half a wide viewport
          was margin. Below lg it collapses, because a third of a phone is not
          a column.
        -->
        <div class="grid gap-6 lg:grid-cols-3">
          <div class="space-y-6 lg:col-span-2">
            <!-- Six columns wide, so it stays in the wide column: in a third
                 of the page every read of it would start with a sideways drag. -->
            <ConsoleInsightsTablePanel
              title="By surface"
              subtitle="Where the searching happens, and how well each place answers"
              :rows="quality?.by_surface ?? []"
              :columns="surfaceColumns"
              empty="No surface recorded a search."
              :empty-hint="emptyHint"
              empty-icon="i-lucide-layout-panel-top"
            >
              <template #cell-zero_result_rate="{ row }">
                {{ pct(row.zero_result_rate) }}
              </template>
              <template #cell-p95_ms="{ row }">
                {{ ms(row.p95_ms) }}
              </template>
            </ConsoleInsightsTablePanel>

            <!-- The funnel: searching is not the goal, opening a recipe is. -->
            <UCard
              :ui="{ body: 'p-0' }"
              class="overflow-hidden border border-gray-200/70 dark:border-white/10"
            >
              <div class="border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  Search funnel
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Counted by session against the first step, so one person searching six times and
                  clicking once is one person who got somewhere.
                </p>
              </div>
              <ConsoleInsightsEmptyState
                v-if="!funnelHasData"
                title="Nobody searched in this period."
                :hint="emptyHint"
                icon="i-lucide-filter"
              />
              <ol
                v-else
                class="divide-y divide-gray-100 dark:divide-zinc-800"
              >
                <li
                  v-for="(stage, index) in funnel"
                  :key="stage.stage"
                  class="px-5 py-4"
                >
                  <div class="flex flex-wrap items-baseline justify-between gap-2">
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ stage.stage }}
                    </span>
                    <span class="text-sm tabular-nums text-gray-600 dark:text-gray-300">
                      {{ stage.sessions.toLocaleString() }} sessions · {{ pct(stage.rate) }}
                    </span>
                  </div>
                  <div class="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                    <div
                      class="h-full rounded-full bg-brand-500"
                      :style="{ width: `${Math.min(100, stage.rate)}%` }"
                    />
                  </div>
                  <p
                    v-if="index > 0"
                    class="mt-1.5 text-xs"
                    :class="dropOff(index).lost ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'"
                  >
                    {{ dropOff(index).text }}
                  </p>
                </li>
              </ol>
            </UCard>

            <ConsoleStatsChartCard title="Most searched">
              <ConsoleStatsBarChart
                :data="topSeries"
                color="#d53355"
              />
            </ConsoleStatsChartCard>

            <ConsoleInsightsTablePanel
              title="Rising"
              subtitle="Growing fastest against the previous period"
              :rows="rising"
              :columns="risingColumns"
              empty="Nothing is rising yet."
              empty-hint="Needs two periods of searches to compare."
              empty-icon="i-lucide-trending-up"
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
                  class="text-emerald-600 dark:text-emerald-400"
                >+{{ row.change_pct }}%</span>
              </template>
            </ConsoleInsightsTablePanel>

            <ConsoleInsightsTablePanel
              title="Found nothing"
              subtitle="Each row is something a person wanted and we do not have"
              :rows="zeroResult"
              :columns="zeroColumns"
              empty="Every search found something."
              :empty-hint="collecting ? 'No catalogue gaps in this period.' : emptyHint"
              empty-icon="i-lucide-check-circle-2"
            >
              <template #cell-last_seen="{ row }">
                {{ formatWhen(row.last_seen) }}
              </template>
            </ConsoleInsightsTablePanel>

            <ConsoleInsightsTablePanel
              title="All searches"
              subtitle="Ordered by how often they were run"
              :rows="top"
              :columns="topColumns"
              empty="No searches recorded in this period."
              :empty-hint="emptyHint"
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
              <template #cell-zero_result="{ row }">
                <UBadge
                  v-if="row.zero_result"
                  color="warning"
                  variant="subtle"
                >
                  {{ row.zero_result }} empty
                </UBadge>
                <span v-else>—</span>
              </template>
            </ConsoleInsightsTablePanel>
          </div>

          <aside class="space-y-6">
            <!-- Search quality: how well the index answered, not just how much it was asked. -->
            <section class="space-y-4">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Search quality
              </h2>

              <ConsoleInsightsEmptyState
                v-if="!quality || !quality.searches"
                class="rounded-xl border border-gray-200/70 dark:border-white/10"
                title="No searches measured in this period."
                :hint="emptyHint"
                icon="i-lucide-search"
              />
              <!-- One per row from lg up: this column is roughly 310px at that
                   breakpoint, and five figures across it would leave each note
                   narrower than the sentence it has to carry. -->
              <div
                v-else
                class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1"
              >
                <UCard
                  :ui="{ body: 'p-4' }"
                  class="border border-gray-200/70 dark:border-white/10"
                >
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Found nothing
                  </p>
                  <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {{ pct(quality.zero_result_rate) }}
                  </p>
                  <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {{ quality.zero_result.toLocaleString() }} of {{ quality.searches.toLocaleString() }} searches
                  </p>
                </UCard>
                <UCard
                  :ui="{ body: 'p-4' }"
                  class="border border-gray-200/70 dark:border-white/10"
                >
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Needed loosening
                  </p>
                  <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {{ pct(quality.relaxed_rate) }}
                  </p>
                  <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {{ quality.relaxed.toLocaleString() }} searches only answered after constraints were dropped
                  </p>
                </UCard>
                <UCard
                  :ui="{ body: 'p-4' }"
                  class="border border-gray-200/70 dark:border-white/10"
                >
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Lexical fallback
                  </p>
                  <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {{ quality.lexical_fallback.toLocaleString() }}
                  </p>
                  <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    searches where semantic matching gave up and keywords answered
                  </p>
                </UCard>
                <UCard
                  :ui="{ body: 'p-4' }"
                  class="border border-gray-200/70 dark:border-white/10"
                >
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Median time
                  </p>
                  <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {{ ms(quality.p50_ms) }}
                  </p>
                  <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    half of searches were faster than this
                  </p>
                </UCard>
                <UCard
                  :ui="{ body: 'p-4' }"
                  class="border border-gray-200/70 dark:border-white/10"
                >
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Slowest 5%
                  </p>
                  <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {{ ms(quality.p95_ms) }}
                  </p>
                  <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    what the unlucky twentieth search waited
                  </p>
                </UCard>
              </div>

              <ConsoleInsightsTablePanel
                title="Rescued by loosening"
                subtitle="Near misses: nothing matched what was asked, something matched once the constraints were dropped"
                :rows="quality?.rescued_by_relaxing ?? []"
                :columns="rescuedColumns"
                empty="No search had to be loosened."
                :empty-hint="emptyHint"
                empty-icon="i-lucide-unlink"
              />
            </section>

            <!-- Facets: the constraints people add, and what those constraints cost them. -->
            <section class="space-y-4">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Filters people apply
              </h2>

              <div class="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <UCard
                  :ui="{ body: 'p-4' }"
                  class="border border-gray-200/70 dark:border-white/10"
                >
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Searches with a filter
                  </p>
                  <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {{ pct(filters?.filtered_rate) }}
                  </p>
                  <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {{ (filters?.unfiltered ?? 0).toLocaleString() }} of
                    {{ (filters?.searches ?? 0).toLocaleString() }} searches used none
                  </p>
                </UCard>
                <UCard
                  :ui="{ body: 'p-4' }"
                  class="border border-gray-200/70 dark:border-white/10"
                >
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Filters at a time
                  </p>
                  <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {{ filters?.avg_facets_when_filtered ?? '—' }}
                  </p>
                  <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    average, counting only searches that used at least one
                  </p>
                </UCard>
                <UCard
                  :ui="{ body: 'p-4' }"
                  class="border border-gray-200/70 dark:border-white/10"
                >
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Recovered from empty
                  </p>
                  <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {{ pct(filters?.recovery.recovery_rate) }}
                  </p>
                  <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    of the empty first passes ended up showing something
                  </p>
                </UCard>
              </div>

              <!--
                Two counts, deliberately kept apart: an empty first pass is a filter
                being too tight, a true miss is the catalogue not having the thing.
                Only the second is work for the content team.
              -->
              <UCard
                :ui="{ body: 'p-5' }"
                class="border border-gray-200/70 dark:border-white/10"
              >
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  Empty first pass, rescued, or a real gap
                </h3>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  A filtered search that finds nothing is not automatically a missing recipe. When
                  loosening the filters found something, the catalogue had it and the constraints were
                  too tight. Only what stayed empty is a gap.
                </p>
                <div class="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p class="text-xs uppercase text-gray-500 dark:text-gray-400">
                      Empty first pass
                    </p>
                    <p class="mt-1 text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
                      {{ (filters?.recovery.empty_first_pass ?? 0).toLocaleString() }}
                    </p>
                  </div>
                  <div>
                    <p class="text-xs uppercase text-gray-500 dark:text-gray-400">
                      Rescued by loosening
                    </p>
                    <p class="mt-1 text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {{ (filters?.recovery.rescued ?? 0).toLocaleString() }}
                    </p>
                  </div>
                  <div>
                    <p class="text-xs uppercase text-gray-500 dark:text-gray-400">
                      True misses
                    </p>
                    <p class="mt-1 text-xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                      {{ (filters?.recovery.true_misses ?? 0).toLocaleString() }}
                    </p>
                  </div>
                </div>
              </UCard>

              <ConsoleInsightsTablePanel
                title="Facet usage"
                subtitle="Which filters get applied, and how often each one empties the results"
                :rows="filters?.facets ?? []"
                :columns="facetColumns"
                empty="Nobody filtered a search."
                :empty-hint="emptyHint"
                empty-icon="i-lucide-sliders-horizontal"
              >
                <template #cell-zero_result_rate="{ row }">
                  {{ pct(row.zero_result_rate) }}
                </template>
              </ConsoleInsightsTablePanel>

              <ConsoleInsightsTablePanel
                title="Combinations that always find nothing"
                subtitle="Named catalogue gaps: every search with these filters came back empty"
                :rows="filters?.empty_combinations ?? []"
                :columns="comboColumns"
                empty="Every filter combination found something."
                :empty-hint="emptyHint"
                empty-icon="i-lucide-check-circle-2"
              />
            </section>
          </aside>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import insightsApi, {
  type FunnelStage,
  type SearchFilterReport,
  type SearchQuality,
  type TrendingRow,
  type ZeroResultRow
} from '~/services/insightsApi'
import type { Range } from '~/components/console/insights/RangeControl.vue'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Search insights · Console' })

const breadcrumbItems = consoleBreadcrumb(
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/console/insights' },
  { label: 'Search insights', icon: 'i-lucide-search' }
)

const route = useRoute()
const router = useRouter()

// The period lives in the URL: "the numbers I was looking at" is something
// people paste to each other, and a view nobody can link to gets re-derived by
// hand every time it is discussed.
const range = ref<Range>({
  days: Number(route.query.days) || 7,
  since: typeof route.query.since === 'string' ? route.query.since : undefined,
  until: typeof route.query.until === 'string' ? route.query.until : undefined
})

const customRange = computed(() => Boolean(range.value.since || range.value.until))

/*
 * The reports are served as a window that ends now, so a custom range becomes
 * the number of days back to its start. That is wider than what was asked for
 * whenever the end date is in the past, which is why the page says so rather
 * than quietly relabelling the result.
 */
const windowDays = computed(() => {
  const since = range.value.since
  if (!since) return range.value.days
  const started = new Date(since).getTime()
  if (Number.isNaN(started)) return range.value.days
  return Math.max(1, Math.ceil((Date.now() - started) / 86_400_000))
})

const rangeLabel = computed(() => {
  const from = range.value.since?.slice(0, 10) || 'the beginning'
  const to = range.value.until?.slice(0, 10) || 'today'
  return `${from} → ${to}`
})

const top = ref<TrendingRow[]>([])
const rising = ref<TrendingRow[]>([])
const zeroResult = ref<ZeroResultRow[]>([])
const quality = ref<SearchQuality | null>(null)
const funnel = ref<FunnelStage[]>([])
const filters = ref<SearchFilterReport | null>(null)
const collecting = ref(true)

// An empty table because nobody searched and an empty table because nothing is
// being recorded look identical, and only one of them is worth acting on.
const emptyHint = computed(() =>
  collecting.value
    ? 'Searches appear here as people run them.'
    : 'Activity collection is switched off, so nothing is being recorded.'
)

const funnelHasData = computed(() => funnel.value.some(stage => stage.sessions > 0))

const topColumns = [
  { key: 'query', label: 'Query' },
  { key: 'searches', label: 'Searches', align: 'right' as const },
  { key: 'sessions', label: 'People', align: 'right' as const },
  { key: 'zero_result', label: 'Empty', align: 'right' as const },
  { key: 'change', label: 'Change', align: 'right' as const }
]
const risingColumns = [
  { key: 'query', label: 'Query' },
  { key: 'searches', label: 'Now', align: 'right' as const },
  { key: 'previous', label: 'Before', align: 'right' as const },
  { key: 'change', label: 'Change', align: 'right' as const }
]
const zeroColumns = [
  { key: 'query', label: 'Query' },
  { key: 'searches', label: 'Times', align: 'right' as const },
  { key: 'sessions', label: 'People', align: 'right' as const },
  { key: 'last_seen', label: 'Last tried', align: 'right' as const }
]
const surfaceColumns = [
  { key: 'surface', label: 'Surface' },
  { key: 'searches', label: 'Searches', align: 'right' as const },
  { key: 'zero_result', label: 'Empty', align: 'right' as const },
  { key: 'zero_result_rate', label: 'Empty rate', align: 'right' as const },
  { key: 'relaxed', label: 'Loosened', align: 'right' as const },
  { key: 'p95_ms', label: 'p95', align: 'right' as const }
]
const rescuedColumns = [
  { key: 'query', label: 'Query' },
  { key: 'searches', label: 'Times', align: 'right' as const }
]
const facetColumns = [
  { key: 'facet', label: 'Filter' },
  { key: 'searches', label: 'Used in', align: 'right' as const },
  { key: 'zero_result', label: 'Empty', align: 'right' as const },
  { key: 'zero_result_rate', label: 'Empty rate', align: 'right' as const }
]
const comboColumns = [
  { key: 'filters', label: 'Filter combination' },
  { key: 'searches', label: 'Times tried', align: 'right' as const }
]

const topSeries = computed(() =>
  top.value.slice(0, 12).map(row => ({ label: row.query, value: row.searches }))
)

// Rates arrive already rounded to a tenth of a percent; printing more digits
// than the API computed would invent precision that is not there.
const pct = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${value}%`

const ms = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '—'
  return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`
}

const formatWhen = (value: unknown) => {
  if (!value) return '—'
  const when = new Date(String(value))
  return Number.isNaN(when.getTime()) ? '—' : when.toLocaleDateString()
}

function dropOff(index: number): { lost: number, text: string } {
  const previous = funnel.value[index - 1]
  const current = funnel.value[index]
  if (!previous || !current) return { lost: 0, text: '' }
  const lost = previous.sessions - current.sessions
  if (lost <= 0) return { lost: 0, text: 'Nobody was lost at this step.' }
  const share = previous.sessions
    ? Math.round((lost / previous.sessions) * 1000) / 10
    : 0
  return {
    lost,
    text: `${lost.toLocaleString()} sessions (${share}%) stopped after “${previous.stage.toLowerCase()}”.`
  }
}

async function load() {
  const [trending, zero, searchQuality, stages, filterReport, health] = await Promise.all([
    insightsApi.getTrending(windowDays.value, 50),
    insightsApi.getZeroResult(windowDays.value, 50),
    insightsApi.getSearchQuality(windowDays.value),
    insightsApi.getFunnel(windowDays.value),
    insightsApi.getSearchFilters(windowDays.value, 20),
    insightsApi.getHealth()
  ])
  top.value = trending.top
  rising.value = trending.rising
  zeroResult.value = zero
  quality.value = searchQuality
  funnel.value = stages
  filters.value = filterReport
  collecting.value = Boolean(health?.enabled)
}

watch(range, (value) => {
  void router.replace({
    query: {
      days: String(value.days),
      ...(value.since ? { since: value.since } : {}),
      ...(value.until ? { until: value.until } : {})
    }
  })
  void load()
}, { deep: true })

onMounted(() => {
  void load()
})
</script>
