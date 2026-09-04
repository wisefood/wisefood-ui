<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />
    <ConsoleInsightsNav />
    <UPageHeader
      title="Model usage"
      description="Tokens and spend by model, product, feature and person — the breakdown Langfuse cannot give per user."
      :ui="{ root: 'relative py-8 border-b-0' }"
    >
      <template #links>
        <ConsoleInsightsRangePicker v-model="days" />
        <ConsoleInsightsExportButton
          report="llm-usage"
          :days="days"
          label="Usage CSV"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <ConsoleStatsStatTile
            label="Model calls"
            :value="totals.calls"
            icon="i-lucide-sparkles"
          />
          <ConsoleStatsStatTile
            label="Input tokens"
            :value="totals.input"
            icon="i-lucide-arrow-down-to-line"
          />
          <ConsoleStatsStatTile
            label="Output tokens"
            :value="totals.output"
            icon="i-lucide-arrow-up-from-line"
          />
          <ConsoleStatsStatTile
            label="Tokens"
            :value="totals.tokens"
            icon="i-lucide-hash"
          />
          <UCard
            :ui="{ body: 'p-4' }"
            class="border border-gray-200/70 dark:border-white/10"
          >
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Spend
            </p>
            <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
              {{ usd(totals.cost) }}
            </p>
            <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
              <template v-if="pricing && pricing.unpriced_calls">
                covers {{ pct(pricing.priced_share) }} of calls — the rest have no rate
              </template>
              <template v-else-if="pricing">
                every call in this period had a rate
              </template>
              <template v-else>
                nothing priced yet
              </template>
            </p>
          </UCard>
        </div>

        <!--
          Input and output are separated because they are not interchangeable:
          output costs several times input on every provider here, so a single
          token total is precisely the number from which spend cannot be
          reconstructed.
        -->
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Output tokens cost several times input tokens, which is why the two are counted apart.
          Token and spend totals are summed over the models listed below; the report returns the
          top fifty by spend, so a very long tail would sit outside them.
        </p>

        <!--
          The coverage statement. A spend figure that silently drops calls with
          no known rate reads exactly like a platform nobody used, so the page
          says how much of its own money figure is grounded.
        -->
        <UCard
          :ui="{ body: 'p-5' }"
          class="border border-gray-200/70 dark:border-white/10"
        >
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">
            What the spend figure covers
          </h3>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Cost is computed from a table of published list prices when the call is recorded. A
            model with no rate is priced as unknown rather than as zero — its tokens still count,
            its money does not.
          </p>

          <ConsoleInsightsEmptyState
            v-if="!pricing || !pricing.calls"
            title="No model calls in this period."
            :hint="emptyHint"
            icon="i-lucide-receipt"
          />
          <template v-else>
            <div class="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p class="text-xs uppercase text-gray-500 dark:text-gray-400">
                  Priced share
                </p>
                <p
                  class="mt-1 text-xl font-semibold tabular-nums"
                  :class="pricing.priced_share >= 99
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'"
                >
                  {{ pct(pricing.priced_share) }}
                </p>
                <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  of {{ pricing.calls.toLocaleString() }} calls carry a rate
                </p>
              </div>
              <div>
                <p class="text-xs uppercase text-gray-500 dark:text-gray-400">
                  Unpriced calls
                </p>
                <p class="mt-1 text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
                  {{ pricing.unpriced_calls.toLocaleString() }}
                </p>
                <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  contribute nothing to the total above
                </p>
              </div>
              <div>
                <p class="text-xs uppercase text-gray-500 dark:text-gray-400">
                  Unpriced tokens
                </p>
                <p class="mt-1 text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
                  {{ pricing.unpriced_tokens.toLocaleString() }}
                </p>
                <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  spent, but not counted in dollars
                </p>
              </div>
            </div>

            <div
              v-if="unpricedModels.length"
              class="mt-4 border-t border-gray-100 pt-4 dark:border-zinc-800"
            >
              <p class="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Models with no rate
              </p>
              <div class="mt-2 flex flex-wrap gap-2">
                <UBadge
                  v-for="model in unpricedModels"
                  :key="model.model || 'unknown'"
                  color="warning"
                  variant="subtle"
                >
                  {{ model.model || 'unnamed model' }} · {{ model.calls.toLocaleString() }}
                </UBadge>
              </div>
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Give one of these a rate under Console → Platform Operations and it starts
                counting from the next call; past calls stay unpriced.
              </p>
            </div>

            <p class="mt-4 text-xs text-gray-400 dark:text-gray-500">
              Rates are the providers' published list prices as of
              {{ pricing.rates_as_of || 'an unrecorded date' }}. They are an estimate of list
              cost, not an invoice: negotiated rates, batch discounts and cached-input pricing
              are not in them.
            </p>
          </template>
        </UCard>

        <ConsoleStatsChartCard title="Spend over time">
          <ConsoleStatsLineChart
            :data="costSeries"
            color="#a6b52b"
            value-prefix="$"
          />
        </ConsoleStatsChartCard>

        <ConsoleInsightsTablePanel
          title="By model"
          subtitle="Input and output apart, because they are billed apart"
          :rows="byModel"
          :columns="modelColumns"
          empty="No model calls recorded."
          :empty-hint="emptyHint"
          empty-icon="i-lucide-cpu"
        >
          <template #cell-p95_ms="{ row }">
            {{ ms(row.p95_ms) }}
          </template>
          <template #cell-cost_usd="{ row }">
            <span>{{ usd(row.cost_usd) }}</span>
            <UBadge
              v-if="row.unpriced_calls"
              color="warning"
              variant="subtle"
              size="sm"
              class="ml-2"
            >
              {{ row.unpriced_calls.toLocaleString() }} unpriced
            </UBadge>
          </template>
        </ConsoleInsightsTablePanel>

        <div class="grid gap-6 lg:grid-cols-2">
          <ConsoleInsightsTablePanel
            title="By provider"
            subtitle="Who the bill would come from"
            :rows="byProvider"
            :columns="providerColumns"
            empty="No model calls recorded."
            :empty-hint="emptyHint"
            empty-icon="i-lucide-building-2"
          >
            <template #cell-cost_usd="{ row }">
              {{ usd(row.cost_usd) }}
            </template>
          </ConsoleInsightsTablePanel>
          <ConsoleInsightsTablePanel
            title="By product"
            :rows="byApp"
            :columns="appColumns"
            empty="No model calls recorded."
            :empty-hint="emptyHint"
            empty-icon="i-lucide-cpu"
          >
            <template #cell-cost_usd="{ row }">
              {{ usd(row.cost_usd) }}
            </template>
          </ConsoleInsightsTablePanel>
          <ConsoleInsightsTablePanel
            title="By feature"
            subtitle="Which part of the pipeline is spending"
            :rows="byFeature"
            :columns="featureColumns"
            empty="No model calls recorded."
            :empty-hint="emptyHint"
            empty-icon="i-lucide-cpu"
          >
            <template #cell-cost_usd="{ row }">
              {{ usd(row.cost_usd) }}
            </template>
          </ConsoleInsightsTablePanel>
          <ConsoleInsightsTablePanel
            title="By person"
            subtitle="Only those who agreed to be named"
            :rows="byUser"
            :columns="userColumns"
            empty="No attributed usage."
            empty-hint="Usage is still counted, just without a name."
            empty-icon="i-lucide-users"
          >
            <template #cell-cost_usd="{ row }">
              {{ usd(row.cost_usd) }}
            </template>
          </ConsoleInsightsTablePanel>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import insightsApi, { type UsageRow } from '~/services/insightsApi'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Model usage · Console' })

const breadcrumbItems = consoleBreadcrumb(
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/console/insights' },
  { label: 'Model usage', icon: 'i-lucide-cpu' }
)

/*
 * One shape for the whole report, taken from the service rather than restated
 * here: the pricing block and the per-provider rows arrived together with the
 * cost columns, and a page that redeclares them drifts from them.
 */
type UsageReport = Awaited<ReturnType<typeof insightsApi.getLlmUsage>>

const days = ref(30)
const collecting = ref(true)
const usage = ref<UsageReport>({
  by_model: [],
  by_app: [],
  by_feature: [],
  by_user: [],
  by_provider: [],
  pricing: null,
  daily: []
})

// An empty table because nobody asked a model anything and an empty table
// because nothing is being recorded look identical, and only one is a fault.
const emptyHint = computed(() =>
  collecting.value
    ? 'Model calls appear here as the platform makes them.'
    : 'Activity collection is switched off, so nothing is being recorded.'
)

const byModel = computed(() => usage.value.by_model)
const byApp = computed(() => usage.value.by_app)
const byFeature = computed(() => usage.value.by_feature)
const byUser = computed(() => usage.value.by_user)
const byProvider = computed(() => usage.value.by_provider)
const pricing = computed(() => usage.value.pricing)
const unpricedModels = computed(() => pricing.value?.unpriced_models ?? [])

const cols = (key: string, label: string) => [
  { key, label },
  { key: 'calls', label: 'Calls', align: 'right' as const },
  { key: 'input_tokens', label: 'In', align: 'right' as const },
  { key: 'output_tokens', label: 'Out', align: 'right' as const },
  { key: 'total_tokens', label: 'Tokens', align: 'right' as const },
  { key: 'cost_usd', label: 'Cost', align: 'right' as const }
]
const modelColumns = [
  { key: 'model', label: 'Model' },
  { key: 'calls', label: 'Calls', align: 'right' as const },
  { key: 'input_tokens', label: 'In', align: 'right' as const },
  { key: 'output_tokens', label: 'Out', align: 'right' as const },
  { key: 'total_tokens', label: 'Tokens', align: 'right' as const },
  { key: 'p95_ms', label: 'p95', align: 'right' as const },
  { key: 'cost_usd', label: 'Cost', align: 'right' as const }
]
const providerColumns = cols('provider', 'Provider')
const appColumns = cols('app', 'Product')
const featureColumns = cols('feature', 'Feature')
const userColumns = cols('user_id', 'Person')

const totals = computed(() => {
  const rows = byModel.value
  const sum = (pick: (row: UsageRow) => number) => rows.reduce((acc, row) => acc + pick(row), 0)
  return {
    // The true call count when pricing reported one: the model table is the
    // top fifty by spend, so summing it would undercount a long tail.
    calls: pricing.value?.calls ?? sum(row => row.calls),
    tokens: sum(row => row.total_tokens),
    input: sum(row => row.input_tokens ?? 0),
    output: sum(row => row.output_tokens ?? 0),
    cost: sum(row => row.cost_usd)
  }
})

const costSeries = computed(() =>
  usage.value.daily.map(d => ({ bucket: d.day, value: d.cost_usd }))
)

const pct = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${value}%`

const ms = (value: unknown) => {
  if (value === null || value === undefined) return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  return n >= 1000 ? `${(n / 1000).toFixed(1)}s` : `${Math.round(n)}ms`
}

/**
 * Two decimals turn every real per-call figure into `$0.00` — the same thing
 * this page said back when nothing was priced at all — so small amounts keep
 * four.
 */
const usd = (value: unknown) => {
  if (value === null || value === undefined) return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  if (n === 0) return '$0.00'
  return n < 1 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`
}

async function load() {
  const [report, health] = await Promise.all([
    insightsApi.getLlmUsage(days.value),
    insightsApi.getHealth()
  ])
  usage.value = report
  collecting.value = Boolean(health?.enabled)
}

watch(days, () => {
  void load()
})
onMounted(() => {
  void load()
})
</script>
