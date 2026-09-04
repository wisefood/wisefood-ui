<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />
    <ConsoleInsightsNav />
    <UPageHeader
      title="Page speed"
      description="How fast pages felt, as the browser measured it — not how fast the server answered."
      :ui="{ root: 'relative py-8 border-b-0' }"
    >
      <template #links>
        <ConsoleInsightsRangeControl v-model="range" />
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="space-y-6">
        <UAlert
          v-if="loaded && !metrics.length"
          color="info"
          variant="subtle"
          icon="i-lucide-power-off"
          title="Page-speed capture is off"
          description="It ships switched off, for volume rather than sensitivity — a page load
            time is about the page. Turn it on under Console → Platform Operations."
        />

        <!--
          The five tiles are the summary band, so they stay full width: at a
          third of it they would be five columns of about a hundred pixels,
          and the median/95th/samples list inside each would wrap to nothing.
        -->
        <div
          v-if="metrics.length"
          class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <UCard
            v-for="metric in metrics"
            :key="metric.metric"
            class="border border-gray-200/70 dark:border-white/10"
          >
            <div class="flex items-baseline justify-between gap-2">
              <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {{ metric.metric }}
              </span>
              <UBadge
                :color="verdictColor(verdict(metric.metric, metric.p75))"
                variant="subtle"
                size="xs"
              >
                {{ verdict(metric.metric, metric.p75) }}
              </UBadge>
            </div>
            <div class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
              {{ display(metric.metric, metric.p75) }}
            </div>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {{ NAMES[metric.metric] || metric.metric }}
            </p>
            <dl class="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
              <div class="flex justify-between">
                <dt>Median</dt>
                <dd class="tabular-nums">
                  {{ display(metric.metric, metric.p50) }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt>95th</dt>
                <dd class="tabular-nums">
                  {{ display(metric.metric, metric.p95) }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt>Good / poor</dt>
                <dd class="tabular-nums">
                  {{ metric.good_rate }}% / {{ metric.poor_rate }}%
                </dd>
              </div>
              <div class="flex justify-between">
                <dt>Samples</dt>
                <dd class="tabular-nums">
                  {{ metric.samples.toLocaleString() }}
                </dd>
              </div>
            </dl>
          </UCard>
        </div>

        <!--
          Slowest pages is the list that gets acted on, so it takes the two
          thirds. The screen-size split sits beside it rather than under it
          because it is the check you make about a slow page, not after it.
        -->
        <div class="grid gap-6 lg:grid-cols-3">
          <div class="min-w-0 lg:col-span-2">
            <ConsoleInsightsTablePanel
              title="Slowest pages"
              subtitle="Worst 75th percentile first"
              :rows="pathRows"
              :columns="pathColumns"
              empty="No measurements yet."
              empty-hint="Page-speed capture ships switched off."
              empty-icon="i-lucide-file-clock"
            >
              <template #cell-path="{ row }">
                <span class="font-mono text-xs">{{ row.path }}</span>
              </template>
              <template #cell-p75="{ row }">
                <span :class="verdictClass(verdict(String(row.metric), row.p75 as number | null))">
                  {{ display(String(row.metric), row.p75 as number | null) }}
                </span>
              </template>
            </ConsoleInsightsTablePanel>
          </div>

          <!--
            Pinned below the sticky site header, capped at the viewport so a
            long screen-size table cannot be left with a bottom the page can
            no longer scroll to.
          -->
          <div class="min-w-0 space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
            <ConsoleInsightsTablePanel
              title="By screen size"
              subtitle="The split an average hides"
              :rows="deviceRows"
              :columns="deviceColumns"
              empty="No measurements yet."
              empty-hint="Page-speed capture ships switched off."
              empty-icon="i-lucide-gauge"
            >
              <template #cell-p75="{ row }">
                <span :class="verdictClass(verdict(String(row.metric), row.p75 as number | null))">
                  {{ display(String(row.metric), row.p75 as number | null) }}
                </span>
              </template>
            </ConsoleInsightsTablePanel>

            <!-- Next to the split it justifies, rather than adrift under the tiles. -->
            <p
              v-if="metrics.length"
              class="text-xs text-gray-500 dark:text-gray-400"
            >
              The verdict is taken at the 75th percentile, which is how the web-vitals standard
              itself is defined: a page passes when three quarters of visits are good. An average
              would let a fast desktop majority hide a phone minority for whom the page is unusable.
            </p>
          </div>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import insightsApi, { type VitalsReport } from '~/services/insightsApi'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Page speed · Console' })

const breadcrumbItems = consoleBreadcrumb(
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/console/insights' },
  { label: 'Page speed', icon: 'i-lucide-gauge' }
)

const range = ref({ days: 7 })
const report = ref<VitalsReport | null>(null)
const loaded = ref(false)

/** What each acronym means, since nobody should have to remember five of them. */
const NAMES: Record<string, string> = {
  LCP: 'Largest paint — when the page looks ready',
  CLS: 'Layout shift — how much it moves under you',
  INP: 'Interaction delay — how long a tap takes to answer',
  TTFB: 'First byte — how long the server took',
  FCP: 'First paint — when anything appears'
}

/**
 * Google's published thresholds: at or below the first is good, above the
 * second is poor. Hard-coded rather than derived, because they are an external
 * standard and inventing our own would make the verdict meaningless.
 */
const THRESHOLDS: Record<string, [number, number]> = {
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800]
}

const metrics = computed(() =>
  // Fixed order, so the tiles do not rearrange themselves between periods.
  ['LCP', 'INP', 'CLS', 'FCP', 'TTFB']
    .map(name => (report.value?.by_metric ?? []).find(row => row.metric === name))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
)

const deviceColumns = [
  { key: 'metric', label: 'Metric' },
  { key: 'device_type', label: 'Screen' },
  { key: 'p75', label: '75th percentile', align: 'right' as const },
  { key: 'good_rate', label: 'Good %', align: 'right' as const },
  { key: 'poor_rate', label: 'Poor %', align: 'right' as const },
  { key: 'samples', label: 'Samples', align: 'right' as const }
]
const pathColumns = [
  { key: 'path', label: 'Page' },
  { key: 'metric', label: 'Metric' },
  { key: 'p75', label: '75th percentile', align: 'right' as const },
  { key: 'poor_rate', label: 'Poor %', align: 'right' as const },
  { key: 'samples', label: 'Samples', align: 'right' as const }
]

const deviceRows = computed(() => report.value?.by_device ?? [])
const pathRows = computed(() =>
  [...(report.value?.by_path ?? [])].sort((a, b) => (b.poor_rate ?? 0) - (a.poor_rate ?? 0))
)

function verdict(metric: string, value: number | null | undefined): string {
  const bounds = THRESHOLDS[metric]
  if (!bounds || value === null || value === undefined) return 'no data'
  if (value <= bounds[0]) return 'good'
  return value <= bounds[1] ? 'needs work' : 'poor'
}

// Nuxt UI types its colours as a closed union; an inferred `string` is rejected.
type Tone = 'success' | 'warning' | 'error' | 'neutral'

const VERDICT_TONE: Record<string, Tone> = {
  'good': 'success',
  'needs work': 'warning',
  'poor': 'error'
}

const verdictColor = (value: string): Tone => VERDICT_TONE[value] ?? 'neutral'

const verdictClass = (value: string) =>
  ({
    'good': 'text-emerald-600 dark:text-emerald-400',
    'needs work': 'text-amber-600 dark:text-amber-400',
    'poor': 'text-red-600 dark:text-red-400'
  })[value] ?? ''

/** CLS is a ratio, not a duration — rendering it as milliseconds is a lie. */
function display(metric: string, value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  if (metric === 'CLS') return value.toFixed(3)
  return value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${Math.round(value)}ms`
}

async function load() {
  report.value = await insightsApi.getVitals(range.value.days, 50)
  loaded.value = true
}

watch(range, () => { void load() }, { deep: true })
onMounted(() => { void load() })
</script>
