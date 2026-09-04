<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />
    <ConsoleInsightsNav />
    <UPageHeader
      title="Usage patterns"
      description="When people use the platform, and how far they get once they are in."
      :ui="{ root: 'relative py-8 border-b-0' }"
    >
      <template #links>
        <ConsoleInsightsRangeControl v-model="range" />
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="space-y-6">
        <UAlert
          v-if="loaded && !report"
          color="info"
          variant="subtle"
          icon="i-lucide-power-off"
          title="No pattern report came back"
          description="Either activity analytics is switched off on the API or the analytics
            schema has not been applied. Until it is on, a flat day here means nothing was
            recorded rather than nobody came."
        />

        <!--
          Two columns from lg up. The shapes — hours, weekdays, how deep a
          visit gets — are what the page is for and they all want width; new
          against returning is a caveated subset of the same traffic, so it
          rides alongside as context instead of pushing the charts up a screen.
          It is short enough to pin, which keeps the caveat in view while the
          charts are being read.
        -->
        <div class="grid gap-6 lg:grid-cols-3">
          <div class="space-y-6 lg:col-span-2">
            <ConsoleStatsChartCard title="Hour of day">
              <ConsoleInsightsPatternBarSeries
                :bars="hourBars"
                :highlight-index="busiestIndex"
                :tick-every="3"
                empty="No activity recorded in this period."
                empty-hint="Every event carries its hour, so an empty day means no events at all."
                empty-icon="i-lucide-clock"
              />
              <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
                <span
                  v-if="busiestLabel"
                  class="font-semibold text-gray-700 dark:text-gray-200"
                >Busiest at {{ busiestLabel }}. </span>
                Hours are read off the server's clock rather than the visitor's, and the quiet
                ones are when a deploy costs least.
              </p>
            </ConsoleStatsChartCard>

            <ConsoleStatsChartCard title="Day of week">
              <ConsoleInsightsPatternBarSeries
                :bars="weekdayBars"
                empty="No activity recorded in this period."
                empty-hint="A week with no events is either a quiet week or a window shorter than a day."
                empty-icon="i-lucide-calendar"
              />
              <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
                The week starts on Sunday, which is how the database counts days — not a
                presentation choice, so the bars line up with anything queried directly.
              </p>
            </ConsoleStatsChartCard>

            <UCard
              :ui="{ body: 'p-5' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  How far a visit gets
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ depth.sessions.toLocaleString() }} sessions in this period
                </p>
              </div>

              <ConsoleInsightsEmptyState
                v-if="!depth.sessions"
                title="No sessions recorded in this period."
                hint="Depth is counted per client session, so this is empty when nothing was recorded at all."
                icon="i-lucide-footprints"
              />

              <template v-else>
                <!-- Figures over the chart rather than beside it: this card is
                     two thirds of the page now, and splitting that again left
                     four percentiles sharing 300px. Stacked, the distribution
                     gets the full width a bar series is worth reading at. -->
                <div class="mt-4 grid gap-6">
                  <div>
                    <dl class="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <dt class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Median
                        </dt>
                        <dd class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                          {{ depth.median_actions ?? '—' }}
                        </dd>
                      </div>
                      <div>
                        <dt class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          90th
                        </dt>
                        <dd class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                          {{ depth.p90_actions ?? '—' }}
                        </dd>
                      </div>
                      <div>
                        <dt class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Deepest
                        </dt>
                        <dd class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                          {{ depth.max_actions ?? '—' }}
                        </dd>
                      </div>
                      <div>
                        <dt class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Bounced
                        </dt>
                        <dd class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                          {{ percent(depth.bounce_rate) }}
                        </dd>
                      </div>
                    </dl>

                    <p class="mt-4 text-xs text-gray-500 dark:text-gray-400">
                      A bounce here is a session with exactly one action — somebody who arrived and
                      left without doing a second thing.
                    </p>
                    <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      This is shown as a distribution and not a mean on purpose. An average of four
                      actions per session describes both "everyone does four" and "most do one and
                      somebody did three hundred", and those two call for opposite responses: the
                      first is a product working as designed, the second is a product nobody can get
                      into plus one power user. The buckets tell them apart; the average never can.
                    </p>
                  </div>

                  <div>
                    <ConsoleInsightsPatternBarSeries
                      :bars="bucketBars"
                      :height="120"
                      empty="No sessions to distribute."
                      empty-hint="Sessions exist only once an event carries a client session id."
                      empty-icon="i-lucide-footprints"
                    />
                  </div>
                </div>
              </template>
            </UCard>
          </div>

          <aside class="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <UCard
              :ui="{ body: 'p-5' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                New against returning
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Someone is returning when their first event anywhere predates this window
              </p>

              <ConsoleInsightsEmptyState
                v-if="!retention.identified_users"
                title="No named users were active in this period."
                hint="Activity is still counted — it simply cannot be attributed to a person without consent."
                icon="i-lucide-user-round"
              />

              <!-- One per row in this column: each figure carries a line of
                   explanation, and three of them across a third of the page
                   would be a column of single words. -->
              <dl
                v-else
                class="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-1"
              >
                <div>
                  <dt class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    New
                  </dt>
                  <dd class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {{ retention.new_users.toLocaleString() }}
                  </dd>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    First ever seen inside this window
                  </p>
                </div>
                <div>
                  <dt class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Returning
                  </dt>
                  <dd class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {{ retention.returning_users.toLocaleString() }}
                  </dd>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Came back — the only honest read on whether it is useful
                  </p>
                </div>
                <div>
                  <dt class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Returning rate
                  </dt>
                  <dd class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {{ percent(retention.returning_rate) }}
                  </dd>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Of {{ retention.identified_users.toLocaleString() }} named users
                  </p>
                </div>
              </dl>

              <!-- On the page, not in a tooltip: a reader who takes these as user
                   totals will understate the platform, and a tooltip is a footnote
                   nobody opens. -->
              <p class="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">
                These counts cover only people who consented to being named. Everyone else is still
                using the platform and their events are still recorded — they just have no user id
                attached, so they can be neither new nor returning here. Read this panel as a subset
                of real activity, never as a headcount.
              </p>
            </UCard>
          </aside>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import insightsApi, { type EngagementPatterns } from '~/services/insightsApi'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Usage patterns · Console' })

const breadcrumbItems = consoleBreadcrumb(
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/console/insights' },
  { label: 'Usage patterns', icon: 'i-lucide-activity' }
)

const route = useRoute()
const router = useRouter()

// The period lives in the query string so a shape worth pointing at — "look at
// the weekend on the 90 day view" — survives being pasted to somebody else.
const range = ref({ days: Number(route.query.days) || 30 })
const report = ref<EngagementPatterns | null>(null)
const loaded = ref(false)

/** Postgres counts the week from Sunday, and so does the report. */
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const hourLabel = (hour: number) => `${String(hour).padStart(2, '0')}:00`

/*
 * Hours and weekdays are filled out to the full cycle before drawing.
 *
 * The query groups by hour, so an hour nobody used is simply absent from the
 * rows. Drawn as they arrive, a dead night would close the gap and shift every
 * later bar left — the chart would show a busy 24-hour day that never happened.
 * An empty slot has to be drawn empty.
 */
const hourBars = computed(() => {
  const rows = report.value?.by_hour ?? []
  if (!rows.length) return []
  const byHour = new Map(rows.map(row => [row.hour, row]))
  return Array.from({ length: 24 }, (_, hour) => {
    const row = byHour.get(hour)
    return {
      label: hourLabel(hour),
      tick: String(hour).padStart(2, '0'),
      value: row?.events ?? 0,
      detail: `${hourLabel(hour)} — ${(row?.events ?? 0).toLocaleString()} events, `
        + `${(row?.sessions ?? 0).toLocaleString()} sessions`
    }
  })
})

const weekdayBars = computed(() => {
  const rows = report.value?.by_weekday ?? []
  if (!rows.length) return []
  const byDay = new Map(rows.map(row => [row.weekday, row]))
  return Array.from({ length: 7 }, (_, weekday) => {
    const row = byDay.get(weekday)
    const label = row?.label ?? WEEKDAYS[weekday] ?? String(weekday)
    return {
      label,
      tick: label.slice(0, 3),
      value: row?.events ?? 0,
      detail: `${label} — ${(row?.events ?? 0).toLocaleString()} events, `
        + `${(row?.sessions ?? 0).toLocaleString()} sessions`
    }
  })
})

// The busiest hour is a value, not a position; with every hour drawn the two
// happen to coincide, which is exactly why the fill above has to stay.
const busiestIndex = computed(() => {
  const hour = report.value?.busiest_hour
  return hour === null || hour === undefined ? -1 : hour
})

const busiestLabel = computed(() =>
  busiestIndex.value < 0 ? '' : hourLabel(busiestIndex.value)
)

const depth = computed(() => report.value?.session_depth ?? {
  sessions: 0,
  median_actions: null,
  p90_actions: null,
  max_actions: null,
  buckets: [],
  bounce_rate: 0
})

const retention = computed(() => report.value?.retention ?? {
  identified_users: 0,
  new_users: 0,
  returning_users: 0,
  returning_rate: 0
})

const bucketBars = computed(() =>
  depth.value.buckets.map(bucket => ({
    label: bucket.label,
    value: bucket.sessions,
    detail: `${bucket.label}: ${bucket.sessions.toLocaleString()} sessions`
  }))
)

const percent = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${value.toFixed(1)}%`

async function load() {
  report.value = await insightsApi.getPatterns(range.value.days)
  loaded.value = true
}

watch(range, () => {
  void router.replace({
    query: { ...(range.value.days === 30 ? {} : { days: String(range.value.days) }) }
  })
  void load()
}, { deep: true })

onMounted(() => { void load() })
</script>
