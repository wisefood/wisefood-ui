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
      title="Expert activity"
      description="Who used their privileges, and on what. Includes reading people's questions, not only changing things."
      :ui="{ root: 'relative py-8 border-b-0' }"
    >
      <template #links>
        <ConsoleInsightsRangePicker v-model="range.days" />
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="space-y-6">
        <ConsoleInsightsTablePanel
          title="By person and action"
          subtitle="Reviews recorded, answers read, settings changed"
          :rows="byActor"
          :columns="actorColumns"
          :loading="loading"
          :failed="failed"
          empty="No privileged activity recorded."
          empty-hint="Actions are recorded from the moment analytics is switched on."
          empty-icon="i-lucide-shield"
        >
          <template #cell-last_seen="{ row }">
            {{ formatWhen(row.last_seen) }}
          </template>
        </ConsoleInsightsTablePanel>

        <ConsoleInsightsTablePanel
          title="Recent actions"
          :rows="recent"
          :columns="recentColumns"
          :loading="loading"
          :failed="failed"
          empty="Nothing recorded yet."
          empty-icon="i-lucide-history"
        >
          <template #cell-occurred_at="{ row }">
            {{ formatWhen(row.occurred_at) }}
          </template>
          <template #cell-props="{ row }">
            <span class="break-all font-mono text-xs text-gray-500 dark:text-gray-400">
              {{ summarise(row.props) }}
            </span>
          </template>
        </ConsoleInsightsTablePanel>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import insightsApi from '~/services/insightsApi'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Expert activity · Console' })

const breadcrumbItems = consoleBreadcrumb(
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/console/insights' },
  { label: 'Expert activity', icon: 'i-lucide-shield' }
)

// Shared with every other insights page, so the window somebody picked there
// is the window this opens on — a review count read here is comparable with
// the question count read a page earlier.
const range = useInsightsRange(30)
const byActor = ref<Array<Record<string, unknown>>>([])
const recent = ref<Array<Record<string, unknown>>>([])

const actorColumns = [
  { key: 'user_id', label: 'Person' },
  { key: 'action', label: 'Action' },
  { key: 'count', label: 'Times', align: 'right' as const },
  { key: 'last_seen', label: 'Last', align: 'right' as const }
]
const recentColumns = [
  { key: 'occurred_at', label: 'When' },
  { key: 'user_id', label: 'Person' },
  { key: 'event_type', label: 'Action' },
  { key: 'props', label: 'Detail' }
]

const formatWhen = (value: unknown) => {
  if (!value) return '—'
  const when = new Date(String(value))
  return Number.isNaN(when.getTime()) ? '—' : when.toLocaleString()
}

// The props blob differs per action; show its keys rather than raw JSON.
const summarise = (props: unknown) => {
  if (!props || typeof props !== 'object') return '—'
  const entries = Object.entries(props as Record<string, unknown>)
    .filter(([, value]) => value !== null && value !== '')
    .slice(0, 3)
    .map(([key, value]) => `${key}=${String(value).slice(0, 24)}`)
  return entries.length ? entries.join(' · ') : '—'
}

async function load() {
  const result = await insightsApi.getExpertActivity(range.value.days, 100)
  byActor.value = result.by_actor as unknown as Array<Record<string, unknown>>
  recent.value = result.recent
}

const { loading, failed, loadedAt, reload, busy } = useInsightsLoad(
  load,
  () => !byActor.value.length && !recent.value.length
)

watch(range, () => {
  void reload()
}, { deep: true })
onMounted(() => {
  void reload()
})
</script>
