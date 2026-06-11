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
          <div class="space-y-6">
            <div class="grid gap-6 lg:grid-cols-2">
              <ConsoleStatsMetricTrend
                title="Requests by model"
                :rows="modelRows"
                :enabled="obsEnabled"
              />
              <ConsoleStatsMetricTrend
                title="Cost by model"
                :rows="costRows"
                :enabled="obsEnabled"
              />
            </div>
            <ConsoleStatsTracesTable
              :traces="traces"
              :enabled="obsEnabled"
            />
            <ConsoleStatsPromptsPanel
              :prompts="prompts"
              :enabled="obsEnabled"
            />
          </div>
        </template>
      </UTabs>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useConsoleStats } from '~/composables/useConsoleStats'
import observabilityApi, { type MetricRow, type TraceRow, type PromptSummary } from '~/services/observabilityApi'

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

const { catalog, obsStatus, load } = useConsoleStats()
const obsEnabled = computed(() => Boolean(obsStatus.value?.enabled))

const modelRows = ref<MetricRow[]>([])
const costRows = ref<MetricRow[]>([])
const traces = ref<TraceRow[]>([])
const prompts = ref<PromptSummary[]>([])

const isoDaysAgo = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

onMounted(async () => {
  await load()
  if (!obsStatus.value?.enabled) return
  const from = isoDaysAgo(7)
  const to = new Date().toISOString()
  const [m, c, t, p] = await Promise.allSettled([
    observabilityApi.getMetrics({ from, to, view: 'observations', measure: 'count', aggregation: 'count', dimension: 'providedModelName' }),
    observabilityApi.getMetrics({ from, to, view: 'observations', measure: 'totalCost', aggregation: 'sum', dimension: 'providedModelName' }),
    observabilityApi.getTraces(25),
    observabilityApi.getPrompts()
  ])
  if (m.status === 'fulfilled') modelRows.value = m.value.rows
  if (c.status === 'fulfilled') costRows.value = c.value.rows
  if (t.status === 'fulfilled') traces.value = t.value
  if (p.status === 'fulfilled') prompts.value = p.value
})
</script>
