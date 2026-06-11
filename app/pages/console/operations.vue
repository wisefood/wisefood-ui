<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />
    <UPageHeader
      title="Analytics & Observability"
      description="Catalog content statistics and LLM observability across Foodchat, RecipeWrangler and FoodScholar."
      :ui="{ root: 'relative py-8 border-b-0' }"
    />

    <UPageBody>
      <UTabs
        v-model="activeTab"
        :items="tabs"
        variant="link"
        class="w-full"
        :ui="{ content: 'w-full pt-6' }"
      >
        <template #content>
          <div class="space-y-6">
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ConsoleStatsStatTile
                v-for="e in catalog?.entities ?? []"
                :key="e.key"
                :label="e.label"
                :value="e.total"
                icon="i-lucide-database"
              />
            </div>
            <ConsoleStatsReviewPipeline :stats="catalog" />
          </div>
        </template>

        <template #observability>
          <!-- Not-configured banner -->
          <div
            v-if="!dashboardLoading && !dashboard.enabled"
            class="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
          >
            Observability is not configured. Set Langfuse keys on the API to populate these panels.
          </div>

          <div
            v-else
            class="space-y-6"
          >
            <!-- Date-range selector -->
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                LLM usage across Foodchat, RecipeWrangler and FoodScholar
              </p>
              <div class="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-white/10">
                <button
                  v-for="r in ranges"
                  :key="r.value"
                  class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
                  :class="range === r.value
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'"
                  @click="setRange(r.value)"
                >
                  {{ r.label }}
                </button>
              </div>
            </div>

            <!-- Time-series row -->
            <div class="grid gap-6 lg:grid-cols-3">
              <ConsoleStatsChartCard title="Requests over time">
                <ConsoleStatsLineChart
                  :data="dashboard.requestsOverTime"
                  color="#d53355"
                />
              </ConsoleStatsChartCard>
              <ConsoleStatsChartCard title="Cost over time">
                <ConsoleStatsLineChart
                  :data="dashboard.costOverTime"
                  color="#a6b52b"
                  value-prefix="$"
                />
              </ConsoleStatsChartCard>
              <ConsoleStatsChartCard title="Tokens over time">
                <ConsoleStatsLineChart
                  :data="dashboard.tokensOverTime"
                  color="#a35ece"
                />
              </ConsoleStatsChartCard>
            </div>

            <!-- By-model breakdowns -->
            <div class="grid gap-6 lg:grid-cols-2">
              <ConsoleStatsChartCard title="Requests by model">
                <ConsoleStatsBarChart
                  :data="dashboard.requestsByModel"
                  color="#d53355"
                />
              </ConsoleStatsChartCard>
              <ConsoleStatsChartCard title="Cost by model">
                <ConsoleStatsBarChart
                  :data="dashboard.costByModel"
                  color="#a6b52b"
                  value-prefix="$"
                />
              </ConsoleStatsChartCard>
              <ConsoleStatsChartCard title="Tokens by model">
                <ConsoleStatsBarChart
                  :data="dashboard.tokensByModel"
                  color="#a35ece"
                />
              </ConsoleStatsChartCard>
              <ConsoleStatsChartCard title="Latency p95 by model (ms)">
                <ConsoleStatsBarChart
                  :data="dashboard.latencyByModel.p95"
                  color="#f59e0b"
                  value-prefix="ms"
                />
              </ConsoleStatsChartCard>
            </div>

            <!-- By-feature -->
            <ConsoleStatsChartCard title="Requests by feature (trace name)">
              <ConsoleStatsBarChart
                :data="dashboard.requestsByFeature"
                color="#6366f1"
              />
            </ConsoleStatsChartCard>

            <ConsoleStatsTracesTable
              :traces="dashboard.traces"
              :enabled="dashboard.enabled"
            />
            <ConsoleStatsPromptsPanel
              :prompts="dashboard.prompts"
              :enabled="dashboard.enabled"
            />
          </div>
        </template>
      </UTabs>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useConsoleStats } from '~/composables/useConsoleStats'
import observabilityApi, { type DashboardData, type DashboardRange } from '~/services/observabilityApi'

definePageMeta({ layout: 'default' })
useHead({ title: 'Analytics & Observability' })

const breadcrumbItems = [
  { label: 'Console', icon: 'i-lucide-panel-top', to: '/console' },
  { label: 'Analytics', icon: 'i-lucide-chart-column' }
]

const tabs = [
  { label: 'Content', value: 'content', slot: 'content', icon: 'i-lucide-folder-open' },
  { label: 'Observability', value: 'observability', slot: 'observability', icon: 'i-lucide-sparkles' }
]

// Allow deep-linking to a tab via ?tab=observability (e.g. from the console
// "Prompt / LLM Controls" card). Falls back to Content for any other value.
const route = useRoute()
const initialTab = route.query.tab === 'observability' ? 'observability' : 'content'
const activeTab = ref(initialTab)

const { catalog, load } = useConsoleStats()

const ranges: Array<{ label: string, value: DashboardRange }> = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' }
]
const range = ref<DashboardRange>('7d')

const emptyDashboard = (): DashboardData => ({
  enabled: false,
  requestsOverTime: [], costOverTime: [], tokensOverTime: [],
  requestsByModel: [], costByModel: [], tokensByModel: [],
  latencyByModel: { p50: [], p95: [], p99: [] },
  requestsByFeature: [], traces: [], prompts: []
})

const dashboard = ref<DashboardData>(emptyDashboard())
const dashboardLoading = ref(true)
let dashboardLoaded = false

const loadDashboard = async () => {
  dashboardLoading.value = true
  dashboard.value = await observabilityApi.getDashboard(range.value)
  dashboardLoading.value = false
  dashboardLoaded = true
}

const setRange = (value: DashboardRange) => {
  if (range.value === value) return
  range.value = value
}

// Refetch when the range changes (only once the dashboard has been loaded).
watch(range, () => {
  if (dashboardLoaded) void loadDashboard()
})

// Lazy-load the dashboard the first time the Observability tab is opened.
watch(activeTab, (tab) => {
  if (tab === 'observability' && !dashboardLoaded) void loadDashboard()
}, { immediate: true })

onMounted(() => {
  void load()
})
</script>
