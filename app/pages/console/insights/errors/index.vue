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
      title="Browser errors"
      description="Distinct failures, ranked by how many people they reached."
      :ui="{ root: 'relative py-8 border-b-0' }"
    >
      <template #links>
        <ConsoleInsightsRangeControl v-model="range" />
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="space-y-6">
        <!--
          Five zeros in large type is what "nothing has arrived yet" used to
          look like, and also what "the API is down" looked like. Pulse until
          the report is here; show nothing when it failed — the list below
          says so in words.
        -->
        <div
          v-if="pending"
          class="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-5"
          role="status"
          aria-live="polite"
          aria-label="Loading browser errors"
        >
          <div
            v-for="n in 5"
            :key="n"
            class="h-20 rounded-lg border border-gray-200/70 bg-gray-100 dark:border-white/10 dark:bg-zinc-800/60"
          />
        </div>
        <div
          v-else-if="!failed"
          class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <ConsoleStatsStatTile
            label="Distinct failures"
            :value="report?.distinct_errors ?? 0"
            icon="i-lucide-bug"
          />
          <ConsoleStatsStatTile
            label="Occurrences"
            :value="report?.occurrences ?? 0"
            icon="i-lucide-repeat"
          />
          <ConsoleStatsStatTile
            label="Sessions affected"
            :value="report?.sessions_affected ?? 0"
            icon="i-lucide-users"
          />
          <ConsoleStatsStatTile
            label="New this period"
            :value="report?.new_groups ?? 0"
            icon="i-lucide-sparkles"
          />
          <ConsoleStatsStatTile
            label="Unhandled"
            :value="report?.unhandled ?? 0"
            icon="i-lucide-triangle-alert"
          />
        </div>

        <UAlert
          v-if="report?.new_groups"
          color="warning"
          variant="subtle"
          icon="i-lucide-sparkles"
          :title="`${report.new_groups} failures appeared for the first time in this period`"
          description="A failure first seen inside the window is the one that points at a recent deploy."
        />

        <!--
          The list is the work; the chart, the browser split and the filters
          are context for reading it. Stacked, all three pushed the first
          failure below the fold on the page whose whole job is that list.
        -->
        <div class="grid gap-6 lg:grid-cols-3">
          <div class="min-w-0 lg:col-span-2">
            <UCard
              :ui="{ body: 'p-0' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <div class="border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  Failures
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Sorted by people reached — two thousand throws for one person is a bug,
                  the same error across two hundred is an incident
                </p>
              </div>

              <div
                v-if="pending"
                class="animate-pulse divide-y divide-gray-100 px-5 dark:divide-zinc-800"
                role="status"
                aria-label="Loading failures"
              >
                <div
                  v-for="n in 5"
                  :key="n"
                  class="flex items-start justify-between gap-4 py-3"
                >
                  <div class="flex-1 space-y-2">
                    <span class="block h-3.5 w-1/3 rounded bg-gray-200 dark:bg-zinc-800" />
                    <span class="block h-3 w-3/4 rounded bg-gray-200 dark:bg-zinc-800" />
                  </div>
                  <span class="h-3.5 w-20 rounded bg-gray-200 dark:bg-zinc-800" />
                </div>
              </div>

              <ConsoleInsightsEmptyState
                v-else-if="failed"
                failed
                title="Failures could not be loaded"
                hint="The request to the API failed. This is not a clean period — retry, and if it persists check the gateway."
              />

              <ConsoleInsightsEmptyState
                v-else-if="!groups.length"
                title="No browser errors recorded."
                :hint="emptyHint"
                icon="i-lucide-shield-check"
              />

              <ul
                v-else
                class="divide-y divide-gray-100 dark:divide-zinc-800"
              >
                <li
                  v-for="group in groups"
                  :key="group.fingerprint"
                  class="px-5 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <NuxtLink
                    :to="`/console/insights/errors/${group.fingerprint}`"
                    class="block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <div class="flex items-start justify-between gap-4">
                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="font-semibold text-gray-900 dark:text-white">
                            {{ group.name || 'Error' }}
                          </span>
                          <UBadge
                            :color="statusColor(group.status)"
                            variant="subtle"
                            size="xs"
                          >
                            {{ group.status }}
                          </UBadge>
                          <UBadge
                            v-if="isNew(group)"
                            color="warning"
                            variant="subtle"
                            size="xs"
                          >
                            new
                          </UBadge>
                          <UBadge
                            v-if="group.kind && group.kind !== 'error'"
                            color="neutral"
                            variant="subtle"
                            size="xs"
                          >
                            {{ group.kind }}
                          </UBadge>
                        </div>
                        <!--
                          Neither line is clipped: the message's tail is often
                          the only thing that distinguishes two failures, and a
                          culprit is a file path with no spaces to wrap at.
                        -->
                        <p class="mt-0.5 break-words text-sm text-gray-600 dark:text-gray-300">
                          {{ group.message || 'No message' }}
                        </p>
                        <p
                          v-if="group.culprit"
                          class="mt-0.5 break-all font-mono text-xs text-gray-400 dark:text-gray-500"
                        >
                          {{ group.culprit }}
                        </p>
                      </div>
                      <div class="shrink-0 text-right text-xs tabular-nums text-gray-500 dark:text-gray-400">
                        <div class="text-sm font-semibold text-gray-900 dark:text-white">
                          {{ group.sessions.toLocaleString() }} sessions
                        </div>
                        <div>{{ group.occurrences.toLocaleString() }} times</div>
                        <div>{{ formatWhen(group.last_seen_at) }}</div>
                      </div>
                    </div>
                  </NuxtLink>
                </li>
              </ul>
            </UCard>
          </div>

          <!--
            Pinned below the sticky site header, and capped at the viewport so
            a long browser split cannot end up parked off the bottom of a
            column that no longer scrolls with the page.
          -->
          <div class="min-w-0 space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
            <!--
              Filters lead the column because they act on the list beside them,
              and pinned they are still reachable from failure two hundred
              rather than only from the top of the page.
            -->
            <UCard class="border border-gray-200/70 dark:border-white/10">
              <div class="flex items-center justify-between gap-2">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                  Filters
                </h3>
                <UButton
                  v-if="status || app"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-lucide-x"
                  @click="clearFilters"
                >
                  Clear
                </UButton>
              </div>
              <div class="mt-2 space-y-2">
                <USelect
                  v-model="status"
                  :items="statusOptions"
                  placeholder="Any status"
                  size="sm"
                  class="w-full"
                  aria-label="Filter by status"
                />
                <USelect
                  v-model="app"
                  :items="appOptions"
                  placeholder="Any service"
                  size="sm"
                  class="w-full"
                  aria-label="Filter by service"
                />
              </div>
            </UCard>

            <ConsoleStatsChartCard title="Errors per day">
              <div
                v-if="pending"
                class="h-40 animate-pulse rounded bg-gray-100 dark:bg-zinc-800/60"
                role="status"
                aria-label="Loading errors per day"
              />
              <ConsoleInsightsEmptyState
                v-else-if="failed"
                failed
                title="Errors per day could not be loaded"
                hint="The request to the API failed."
              />
              <ConsoleStatsBarChart
                v-else
                :data="dailySeries"
                color="#d53355"
              />
            </ConsoleStatsChartCard>

            <UCard
              v-if="pending || failed"
              :ui="{ body: 'p-0' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <div class="border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  By browser
                </h3>
              </div>
              <div
                v-if="pending"
                class="animate-pulse space-y-3 px-5 py-4"
                role="status"
                aria-label="Loading browser split"
              >
                <span
                  v-for="n in 4"
                  :key="n"
                  class="block h-3 rounded bg-gray-200 dark:bg-zinc-800"
                />
              </div>
              <ConsoleInsightsEmptyState
                v-else
                failed
                title="Browser split could not be loaded"
                hint="The request to the API failed."
              />
            </UCard>
            <ConsoleInsightsErrorBreakdown
              v-else
              title="By browser"
              icon="i-lucide-globe"
              :rows="browserRows"
            />
          </div>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import insightsApi, { type ErrorGroupRow, type ErrorReport } from '~/services/insightsApi'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Browser errors · Console' })

const breadcrumbItems = consoleBreadcrumb(
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/console/insights' },
  { label: 'Browser errors', icon: 'i-lucide-bug' }
)

const route = useRoute()
const router = useRouter()

// Filter state lives in the query string so a filtered view can be pasted into
// a conversation — "the unresolved FoodChat ones" is a link, not instructions.
// The period is handled the same way by useInsightsRange, which also remembers
// it across pages; only the two filters are this page's own.
const range = useInsightsRange(7)
const status = ref<string | undefined>((route.query.status as string) || undefined)
const app = ref<string | undefined>((route.query.app as string) || undefined)
const report = ref<ErrorReport | null>(null)

const statusOptions = ['new', 'acknowledged', 'resolved', 'ignored']
const appOptions = ['foodchat', 'foodscholar', 'recipewrangler', 'catalog', 'console', 'platform']

const groups = computed(() => report.value?.groups ?? [])
const dailySeries = computed(() =>
  (report.value?.daily ?? []).map(row => ({ label: row.day.slice(5), value: row.errors }))
)
const browserRows = computed(() =>
  (report.value?.by_browser ?? []).map(row => ({ value: row.browser, count: row.errors }))
)

// Collection of errors is on by default, so an empty page here usually means
// nothing broke rather than nothing is being recorded — say the likelier thing.
const emptyHint = computed(() =>
  status.value || app.value
    ? 'Nothing matches these filters. Try clearing them.'
    : 'Nothing has thrown in this period. Error capture is on by default.'
)

const isNew = (group: ErrorGroupRow) =>
  Boolean(group.first_seen_at && report.value?.since && group.first_seen_at >= report.value.since)

// Nuxt UI types its colours as a closed union, so the lookup has to be typed
// too — an inferred `string` is rejected at the prop.
type Tone = 'error' | 'warning' | 'success' | 'neutral'

const STATUS_TONE: Record<string, Tone> = {
  new: 'error',
  acknowledged: 'warning',
  resolved: 'success',
  ignored: 'neutral'
}

const statusColor = (value: string): Tone => STATUS_TONE[value] ?? 'neutral'

function formatWhen(value: string | null) {
  if (!value) return '—'
  const when = new Date(value)
  return Number.isNaN(when.getTime()) ? '—' : when.toLocaleString()
}

function clearFilters() {
  status.value = undefined
  app.value = undefined
}

async function load() {
  report.value = await insightsApi.getErrors({
    days: range.value.days,
    status: status.value,
    app: app.value
  })
}

const { loading, failed, loadedAt, reload, busy } = useInsightsLoad(
  load,
  () => !groups.value.length && !dailySeries.value.length && !browserRows.value.length
)

// The first fetch, with nothing on screen yet; a refresh keeps the old list up.
const pending = computed(() => loading.value && !report.value)

// Only the filters are mirrored here. The period's own key is owned by
// useInsightsRange, so the rest of the query is copied through untouched
// rather than rebuilt — rebuilding it would drop `days` on every filter change.
watch([status, app], () => {
  const query = { ...route.query }
  delete query.status
  delete query.app
  if (status.value) query.status = status.value
  if (app.value) query.app = app.value
  void router.replace({ query })
})

watch([range, status, app], reload, { deep: true })
onMounted(reload)
</script>
