<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />
    <ConsoleInsightsNav
      :loaded-at="loadedAt"
      :refreshing="loading"
      @refresh="reload"
    />
    <UPageHeader
      title="Service health"
      description="How long each endpoint takes and how often it fails, from the requests people actually made."
      :ui="{ root: 'relative py-8 border-b-0' }"
    >
      <template #links>
        <ConsoleInsightsRangeControl v-model="range" />
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="space-y-6">
        <!--
          The tiles are sums over the table, so before the table has arrived
          they would read as zero — a false quiet week in the biggest type on
          the page. Pulse instead until there is something to sum, and show
          nothing when the fetch failed: the panels below carry that news.
        -->
        <div
          v-if="pending"
          class="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-4"
          role="status"
          aria-live="polite"
          aria-label="Loading service health"
        >
          <div
            v-for="n in 4"
            :key="n"
            class="h-20 rounded-lg border border-gray-200/70 bg-gray-100 dark:border-white/10 dark:bg-zinc-800/60"
          />
        </div>
        <div
          v-else-if="!failed"
          class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <ConsoleStatsStatTile
            label="Requests"
            :value="totalRequests"
            icon="i-lucide-activity"
          />
          <ConsoleStatsStatTile
            label="Failed"
            :value="totalErrors"
            icon="i-lucide-circle-alert"
          />
          <ConsoleStatsStatTile
            label="Server errors"
            :value="totalServerErrors"
            icon="i-lucide-server-crash"
          />
          <ConsoleStatsStatTile
            label="Routes seen"
            :value="routes.length"
            icon="i-lucide-route"
          />
        </div>

        <UAlert
          v-if="worst"
          :color="worst.server_errors ? 'error' : 'warning'"
          variant="subtle"
          :icon="worst.server_errors ? 'i-lucide-server-crash' : 'i-lucide-triangle-alert'"
          :title="`${worst.error_rate}% of requests to ${shortRoute(worst.route)} failed`"
          :description="`${worst.errors.toLocaleString()} of ${worst.requests.toLocaleString()} requests in the last ${range.days === 1 ? '24 hours' : `${range.days} days`}, on ${worst.app}.`"
        />

        <!--
          The table is the page — every route, seven columns — so it takes the
          two thirds. The two panels beside it are the questions asked before
          reading it, "which one is worst" and "what came back", and both are
          answered at a glance rather than scanned.
        -->
        <div class="grid gap-6 lg:grid-cols-3">
          <div class="min-w-0 lg:col-span-2">
            <ConsoleInsightsTablePanel
              title="Every endpoint"
              subtitle="Sorted by traffic. Median is the typical wait, p95 is the bad one."
              :rows="routes"
              :columns="routeColumns"
              :loading="loading"
              :failed="failed"
              empty="No requests recorded in this period."
              empty-hint="Turn on recording in Platform Operations to populate this."
              empty-icon="i-lucide-route"
            >
              <template #cell-route="{ row }">
                <span class="break-all font-mono text-xs">{{ shortRoute(row.route) }}</span>
              </template>
              <template #cell-p50_ms="{ row }">
                {{ formatMs(row.p50_ms) }}
              </template>
              <template #cell-p95_ms="{ row }">
                <span :class="latencyClass(row.p95_ms)">{{ formatMs(row.p95_ms) }}</span>
              </template>
              <template #cell-max_ms="{ row }">
                {{ formatMs(row.max_ms) }}
              </template>
              <template #cell-error_rate="{ row }">
                <UBadge
                  v-if="row.errors"
                  :color="row.server_errors ? 'error' : 'warning'"
                  variant="subtle"
                >
                  {{ row.error_rate }}%
                </UBadge>
                <span v-else>—</span>
              </template>
            </ConsoleInsightsTablePanel>
          </div>

          <!--
            Pinned below the sticky site header so the shortlist stays beside
            the row being read, and capped at the viewport: a pinned column
            taller than the screen has a bottom nothing can scroll to.
          -->
          <div class="min-w-0 space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
            <UCard
              :ui="{ body: 'p-0' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <div class="border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  Slowest endpoints
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  By 95th percentile — what the unlucky one in twenty waits
                </p>
              </div>
              <div
                v-if="pending"
                class="animate-pulse divide-y divide-gray-100 px-5 dark:divide-zinc-800"
                role="status"
                aria-label="Loading slowest endpoints"
              >
                <div
                  v-for="n in 5"
                  :key="n"
                  class="space-y-2 py-3"
                >
                  <span class="block h-3 w-3/4 rounded bg-gray-200 dark:bg-zinc-800" />
                  <span class="block h-1 rounded-full bg-gray-200 dark:bg-zinc-800" />
                </div>
              </div>
              <ConsoleInsightsEmptyState
                v-else-if="failed"
                failed
                title="Slowest endpoints could not be loaded"
                hint="The request to the API failed. Retry, and if it persists check the gateway."
              />
              <ConsoleInsightsEmptyState
                v-else-if="!slowest.length"
                title="No timings recorded."
                hint="Timings appear once requests are being recorded."
                icon="i-lucide-timer"
              />
              <ul
                v-else
                class="divide-y divide-gray-100 dark:divide-zinc-800"
              >
                <li
                  v-for="row in slowest"
                  :key="row.route"
                  class="px-5 py-2.5"
                >
                  <div class="flex items-baseline justify-between gap-3">
                    <!--
                      Route templates have no spaces, so a long one has to be
                      allowed to break anywhere or it is clipped — and the tail
                      is the part that identifies it.
                    -->
                    <span class="min-w-0 break-all text-sm text-gray-700 dark:text-gray-200">
                      {{ shortRoute(row.route) }}
                    </span>
                    <span
                      class="shrink-0 text-sm font-semibold tabular-nums"
                      :class="latencyClass(row.p95_ms)"
                    >{{ formatMs(row.p95_ms) }}</span>
                  </div>
                  <div class="mt-1 h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                    <div
                      class="h-full rounded-full bg-brand-500"
                      :style="{ width: `${barWidth(row.p95_ms)}%` }"
                    />
                  </div>
                </li>
              </ul>
            </UCard>

            <ConsoleStatsChartCard title="Responses by status">
              <div
                v-if="pending"
                class="h-40 animate-pulse rounded bg-gray-100 dark:bg-zinc-800/60"
                role="status"
                aria-label="Loading responses by status"
              />
              <ConsoleInsightsEmptyState
                v-else-if="failed"
                failed
                title="Responses by status could not be loaded"
                hint="The request to the API failed."
              />
              <ConsoleStatsBarChart
                v-else
                :data="statusSeries"
                color="#d53355"
              />
            </ConsoleStatsChartCard>
          </div>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import insightsApi, { type RoutePerfRow } from '~/services/insightsApi'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Service health · Console' })

const breadcrumbItems = consoleBreadcrumb(
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/console/insights' },
  { label: 'Service health', icon: 'i-lucide-gauge' }
)

const range = useInsightsRange(7)
const routes = ref<RoutePerfRow[]>([])
const slowest = ref<RoutePerfRow[]>([])
const mostErrors = ref<RoutePerfRow[]>([])
const byStatus = ref<Array<{ status: number | null, count: number }>>([])

const routeColumns = [
  { key: 'route', label: 'Endpoint' },
  { key: 'app', label: 'Service' },
  { key: 'requests', label: 'Requests', align: 'right' as const },
  { key: 'p50_ms', label: 'Median', align: 'right' as const },
  { key: 'p95_ms', label: 'p95', align: 'right' as const },
  { key: 'max_ms', label: 'Worst', align: 'right' as const },
  { key: 'error_rate', label: 'Failed', align: 'right' as const }
]

const totalRequests = computed(() => routes.value.reduce((sum, r) => sum + r.requests, 0))
const totalErrors = computed(() => routes.value.reduce((sum, r) => sum + r.errors, 0))
const totalServerErrors = computed(() => routes.value.reduce((sum, r) => sum + r.server_errors, 0))
const worst = computed(() => mostErrors.value[0] ?? null)

const statusSeries = computed(() =>
  byStatus.value.map(row => ({ label: String(row.status ?? '—'), value: row.count }))
)

// The bars compare endpoints against each other, so the widest is the slowest
// rather than some fixed ceiling nobody reaches.
const slowestMs = computed(() => Math.max(1, ...slowest.value.map(r => r.p95_ms ?? 0)))
const barWidth = (ms: number | null) => Math.round(((ms ?? 0) / slowestMs.value) * 100)

function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '—'
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`
}

// A page feels slow at about a second and broken at about three.
function latencyClass(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return ''
  if (ms >= 3000) return 'text-red-600 dark:text-red-400'
  if (ms >= 1000) return 'text-amber-600 dark:text-amber-400'
  return ''
}

// Route templates are long and share a prefix; the tail is the identifying part.
const shortRoute = (route: string) => route.replace(/^\/api\/v1\//, '')

async function load() {
  const report = await insightsApi.getPerformance(range.value.days, 50)
  routes.value = report?.routes ?? []
  slowest.value = report?.slowest ?? []
  mostErrors.value = report?.most_errors ?? []
  byStatus.value = report?.by_status ?? []
}

const { loading, failed, loadedAt, reload } = useInsightsLoad(
  load,
  () => !routes.value.length && !slowest.value.length && !byStatus.value.length
)

// The first fetch, with nothing on screen yet. A refresh keeps the old numbers
// up rather than pulsing over them, so this is false during one.
const pending = computed(() => loading.value && !routes.value.length)

watch(range, reload, { deep: true })
onMounted(reload)
</script>
