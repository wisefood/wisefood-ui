<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />
    <ConsoleInsightsNav />
    <UPageHeader
      :title="selectedPath ? 'Click map' : 'Click maps'"
      :description="selectedPath
        ? `Where people click on ${selectedPath}, and where they get stuck.`
        : 'Which pages get clicked, and which ones frustrate people.'"
      :ui="{ root: 'relative py-8 border-b-0' }"
    >
      <template #links>
        <div class="flex items-center gap-2">
          <UButton
            v-if="selectedPath"
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-arrow-left"
            @click="selectedPath = ''"
          >
            All pages
          </UButton>
          <ConsoleInsightsRangeControl v-model="range" />
        </div>
      </template>
    </UPageHeader>

    <UPageBody>
      <UAlert
        v-if="collectionLikelyOff"
        color="info"
        variant="subtle"
        icon="i-lucide-power-off"
        title="Click capture is off"
        description="It ships switched off: it is the highest-volume thing the platform can
          record, and the one a study participant is most likely to consider surveillance.
          Turn it on for a period under Console → Platform Operations to answer a question,
          then turn it off again."
        class="mb-6"
      />

      <!-- One page's map ------------------------------------------------- -->
      <div
        v-if="selectedPath"
        class="space-y-6"
      >
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <ConsoleStatsStatTile
            label="Clicks"
            :value="map?.clicks ?? 0"
            icon="i-lucide-mouse-pointer-click"
          />
          <ConsoleStatsStatTile
            label="Sessions"
            :value="map?.sessions ?? 0"
            icon="i-lucide-monitor"
          />
          <ConsoleStatsStatTile
            label="Rage clicks"
            :value="map?.rage_clicks ?? 0"
            icon="i-lucide-flame"
          />
          <ConsoleStatsStatTile
            label="Dead clicks"
            :value="map?.dead_clicks ?? 0"
            icon="i-lucide-circle-slash"
          />
          <ConsoleStatsStatTile
            label="Median scroll"
            :value="Math.round(map?.median_scroll_depth ?? 0)"
            icon="i-lucide-chevrons-down"
          />
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Screen size
          </span>
          <UButton
            v-for="option in deviceOptions"
            :key="option.value"
            :color="deviceType === option.value ? 'primary' : 'neutral'"
            :variant="deviceType === option.value ? 'solid' : 'ghost'"
            size="xs"
            @click="deviceType = option.value"
          >
            {{ option.label }}
          </UButton>
        </div>

        <!--
          The map is the page and takes the two thirds; the control list and
          the scroll depths beside it are what the map's blobs are checked
          against. Neither column is pinned here: the map is a tall fixed
          aspect box and the control list runs to fifty rows, so whichever
          were pinned would be the one hiding its own bottom.
        -->
        <div class="grid gap-6 lg:grid-cols-3">
          <div class="min-w-0 lg:col-span-2">
            <ConsoleInsightsHeatmapGrid
              v-if="map"
              :cells="map.cells"
              :grid="map.grid"
              :peak="map.peak"
              :path="map.path"
            />
          </div>

          <div class="min-w-0 space-y-6 lg:self-start">
            <ConsoleInsightsTablePanel
              title="Controls clicked"
              subtitle="A control nobody touches is interface to remove"
              :rows="elementRows"
              :columns="elementColumns"
              empty="No named controls were clicked."
              empty-hint="Elements are named from a data-track attribute where the UI sets one."
              empty-icon="i-lucide-mouse-pointer-click"
            >
              <template #cell-element_key="{ row }">
                <span class="font-mono text-xs">{{ row.element_key || '—' }}</span>
              </template>
              <template #cell-trouble="{ row }">
                <UBadge
                  v-if="row.rage"
                  color="error"
                  variant="subtle"
                  size="xs"
                >
                  {{ row.rage }} rage
                </UBadge>
                <UBadge
                  v-else-if="row.dead"
                  color="warning"
                  variant="subtle"
                  size="xs"
                >
                  {{ row.dead }} dead
                </UBadge>
                <span v-else>—</span>
              </template>
            </ConsoleInsightsTablePanel>

            <UCard
              class="border border-gray-200/70 dark:border-white/10"
              :ui="{ body: 'p-0' }"
            >
              <div class="border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  How far down people get
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Everything below the median is written for a minority
                </p>
              </div>
              <ConsoleInsightsEmptyState
                v-if="!map?.scroll_depth.measured"
                title="No scroll depth recorded."
                hint="Measured once per page view, when the view ends."
                icon="i-lucide-chevrons-down"
              />
              <ul
                v-else
                class="divide-y divide-gray-100 dark:divide-zinc-800"
              >
                <li
                  v-for="step in scrollSteps"
                  :key="step.label"
                  class="px-5 py-2.5"
                >
                  <div class="flex items-baseline justify-between gap-3 text-sm">
                    <span class="text-gray-700 dark:text-gray-200">{{ step.label }}</span>
                    <span class="font-semibold tabular-nums text-gray-900 dark:text-white">
                      {{ step.rate }}%
                    </span>
                  </div>
                  <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                    <div
                      class="h-full rounded-full bg-brand-500"
                      :style="{ width: `${step.rate}%` }"
                    />
                  </div>
                </li>
              </ul>
            </UCard>
          </div>
        </div>
      </div>

      <!-- The index ------------------------------------------------------- -->
      <!--
        Same shape as the map view, so moving between the two is not a change
        of layout: the page list is what gets opened, and the stuck list is
        the reason to open one rather than a second table to scroll past.
        Both can run to the server's limit, so neither is pinned.
      -->
      <div
        v-else
        class="grid gap-6 lg:grid-cols-3"
      >
        <div class="min-w-0 lg:col-span-2">
          <ConsoleInsightsTablePanel
            title="Pages by clicks"
            subtitle="Open one to see its map"
            :rows="pageRows"
            :columns="pageColumns"
            empty="No clicks recorded in this period."
            empty-hint="Click capture ships switched off — see Platform Operations."
            empty-icon="i-lucide-mouse-pointer-click"
          >
            <template #cell-path="{ row }">
              <button
                class="font-mono text-xs text-brand-600 hover:underline dark:text-brand-400"
                @click="selectedPath = String(row.path)"
              >
                {{ row.path }}
              </button>
            </template>
          </ConsoleInsightsTablePanel>
        </div>

        <div class="min-w-0 lg:self-start">
          <ConsoleInsightsTablePanel
            title="Where people are stuck"
            subtitle="Rage and dead clicks — somebody clicking a thing that looks like it should work"
            :rows="frustrationRows"
            :columns="frustrationColumns"
            empty="Nobody is visibly stuck."
            empty-hint="No rage or dead clicks recorded in this period."
            empty-icon="i-lucide-smile"
          >
            <template #cell-path="{ row }">
              <button
                class="font-mono text-xs text-brand-600 hover:underline dark:text-brand-400"
                @click="selectedPath = String(row.path)"
              >
                {{ row.path }}
              </button>
            </template>
            <template #cell-element_key="{ row }">
              <span class="font-mono text-xs">{{ row.element_key || '—' }}</span>
            </template>
            <template #cell-kind="{ row }">
              <UBadge
                :color="row.kind === 'rage' ? 'error' : 'warning'"
                variant="subtle"
                size="xs"
              >
                {{ row.kind }}
              </UBadge>
            </template>
          </ConsoleInsightsTablePanel>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import insightsApi, { type ClickMap, type InteractionOverview } from '~/services/insightsApi'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Click maps · Console' })

const breadcrumbItems = consoleBreadcrumb(
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/console/insights' },
  { label: 'Click maps', icon: 'i-lucide-mouse-pointer-click' }
)

const route = useRoute()
const router = useRouter()

const range = ref({ days: Number(route.query.days) || 30 })
const selectedPath = ref(String(route.query.path || ''))
const deviceType = ref(String(route.query.device || ''))
const overview = ref<InteractionOverview | null>(null)
const map = ref<ClickMap | null>(null)

const deviceOptions = [
  { label: 'All', value: '' },
  { label: 'Phone', value: 'phone' },
  { label: 'Tablet', value: 'tablet' },
  { label: 'Desktop', value: 'desktop' }
]

const pageColumns = [
  { key: 'path', label: 'Page' },
  { key: 'clicks', label: 'Clicks', align: 'right' as const },
  { key: 'sessions', label: 'Sessions', align: 'right' as const },
  { key: 'rage', label: 'Rage', align: 'right' as const },
  { key: 'dead', label: 'Dead', align: 'right' as const },
  { key: 'median_scroll_depth', label: 'Median scroll %', align: 'right' as const }
]
const frustrationColumns = [
  { key: 'path', label: 'Page' },
  { key: 'element_key', label: 'Control' },
  { key: 'kind', label: 'Kind' },
  { key: 'sessions', label: 'People', align: 'right' as const },
  { key: 'count', label: 'Times', align: 'right' as const }
]
const elementColumns = [
  { key: 'element_key', label: 'Control' },
  { key: 'clicks', label: 'Clicks', align: 'right' as const },
  { key: 'sessions', label: 'People', align: 'right' as const },
  { key: 'trouble', label: 'Trouble', align: 'right' as const }
]

const pageRows = computed(() => overview.value?.pages ?? [])
const frustrationRows = computed(() => overview.value?.frustration ?? [])
const elementRows = computed(() => map.value?.elements ?? [])

const scrollSteps = computed(() => {
  const depth = map.value?.scroll_depth
  if (!depth) return []
  return [
    { label: 'Reached a quarter', rate: depth.reached_25 },
    { label: 'Reached halfway', rate: depth.reached_50 },
    { label: 'Reached three quarters', rate: depth.reached_75 },
    { label: 'Reached the bottom', rate: depth.reached_bottom }
  ]
})

// Nothing recorded at all is far more likely to be the switch than a platform
// nobody clicked, so the page says so rather than showing a bare empty table.
const collectionLikelyOff = computed(() =>
  Boolean(overview.value) && !pageRows.value.length && !frustrationRows.value.length
)

async function load() {
  overview.value = await insightsApi.getInteractions(range.value.days, 50)
  if (selectedPath.value) {
    map.value = await insightsApi.getHeatmap({
      path: selectedPath.value,
      days: range.value.days,
      deviceType: deviceType.value || undefined
    })
  } else {
    map.value = null
  }
}

watch([range, selectedPath, deviceType], () => {
  void router.replace({
    query: {
      ...(range.value.days === 30 ? {} : { days: String(range.value.days) }),
      ...(selectedPath.value ? { path: selectedPath.value } : {}),
      ...(deviceType.value ? { device: deviceType.value } : {})
    }
  })
  void load()
}, { deep: true })

onMounted(() => { void load() })
</script>
