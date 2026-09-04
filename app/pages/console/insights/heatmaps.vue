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
      <!--
        "Capture is off" is only claimed when the load succeeded and came back
        with nothing. A failed fetch used to land here too, and this alert
        then told the reader to go and flip a switch when the real problem
        was the API — the one diagnosis it must never hand out.
      -->
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
        <!--
          Five zeros in large type is what "nothing has arrived yet" looked
          like, and also what "the API is down" looked like. Pulse until the
          map is here; show nothing when it failed — the grid below says so.
        -->
        <div
          v-if="pending"
          class="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-5"
          role="status"
          aria-live="polite"
          aria-label="Loading click map"
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

        <!--
          A toggle group, announced as one: each button says whether it is the
          chosen size, so a screen reader hears the selection rather than
          inferring it from a background colour.
        -->
        <div
          class="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Screen size"
        >
          <span class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Screen size
          </span>
          <UButton
            v-for="option in deviceOptions"
            :key="option.value"
            :color="deviceType === option.value ? 'primary' : 'neutral'"
            :variant="deviceType === option.value ? 'solid' : 'ghost'"
            size="xs"
            :aria-pressed="deviceType === option.value"
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
            <div
              v-if="pending"
              class="aspect-[4/3] animate-pulse rounded-lg border border-gray-200/70 bg-gray-100 dark:border-white/10 dark:bg-zinc-800/60"
              role="status"
              aria-label="Loading the click map"
            />
            <UCard
              v-else-if="failed"
              :ui="{ body: 'p-0' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <ConsoleInsightsEmptyState
                failed
                title="The click map could not be loaded"
                hint="The request to the API failed. This does not mean capture is off — retry, and if it persists check the gateway."
              />
            </UCard>
            <ConsoleInsightsHeatmapGrid
              v-else-if="map"
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
              :loading="loading"
              :failed="failed"
              empty="No named controls were clicked."
              empty-hint="Elements are named from a data-track attribute where the UI sets one."
              empty-icon="i-lucide-mouse-pointer-click"
            >
              <template #cell-element_key="{ row }">
                <span class="break-all font-mono text-xs">{{ row.element_key || '—' }}</span>
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
              <div
                v-if="pending"
                class="animate-pulse divide-y divide-gray-100 px-5 dark:divide-zinc-800"
                role="status"
                aria-label="Loading scroll depth"
              >
                <div
                  v-for="n in 4"
                  :key="n"
                  class="space-y-2 py-3"
                >
                  <span class="block h-3 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
                  <span class="block h-1.5 rounded-full bg-gray-200 dark:bg-zinc-800" />
                </div>
              </div>
              <ConsoleInsightsEmptyState
                v-else-if="failed"
                failed
                title="Scroll depth could not be loaded"
                hint="The request to the API failed."
              />
              <ConsoleInsightsEmptyState
                v-else-if="!map?.scroll_depth.measured"
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
            :loading="loading"
            :failed="failed"
            empty="No clicks recorded in this period."
            empty-hint="Click capture ships switched off — see Platform Operations."
            empty-icon="i-lucide-mouse-pointer-click"
          >
            <template #cell-path="{ row }">
              <!--
                A real button, so it needs a visible focus ring — colour alone
                said "link" to a mouse and nothing to a keyboard. Left-aligned
                and allowed to break so a long route wraps instead of clipping.
              -->
              <button
                type="button"
                :class="PATH_BUTTON"
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
            :loading="loading"
            :failed="failed"
            empty="Nobody is visibly stuck."
            empty-hint="No rage or dead clicks recorded in this period."
            empty-icon="i-lucide-smile"
          >
            <template #cell-path="{ row }">
              <button
                type="button"
                :class="PATH_BUTTON"
                @click="selectedPath = String(row.path)"
              >
                {{ row.path }}
              </button>
            </template>
            <template #cell-element_key="{ row }">
              <span class="break-all font-mono text-xs">{{ row.element_key || '—' }}</span>
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

// The period is owned by useInsightsRange, which also remembers it across
// pages; the chosen page and screen size are this page's own and stay in the
// URL so a map can be linked to.
const range = useInsightsRange(30)
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

// The page-path cell is a button in two tables; one definition keeps its focus
// ring and wrapping in step between them.
const PATH_BUTTON = 'break-all rounded text-left font-mono text-xs text-brand-600 hover:underline '
  + 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-400'

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

const { status, loading, failed, loadedAt, reload } = useInsightsLoad(
  load,
  () => !pageRows.value.length && !frustrationRows.value.length && !map.value?.clicks
)

// Nothing recorded at all is far more likely to be the switch than a platform
// nobody clicked, so the page says so rather than showing a bare empty table.
// 'empty' is the load that succeeded with nothing in it; a failed load is not
// that, and never earns this alert.
const collectionLikelyOff = computed(() => status.value === 'empty')

// The first fetch, with nothing on screen yet; a refresh keeps the old view up.
const pending = computed(() => loading.value && !overview.value && !map.value)

// Only the page and screen size are mirrored here. `days` is owned by
// useInsightsRange, so the rest of the query is copied through untouched
// rather than rebuilt — rebuilding it would drop the period on every click.
watch([selectedPath, deviceType], () => {
  const query = { ...route.query }
  delete query.path
  delete query.device
  if (selectedPath.value) query.path = selectedPath.value
  if (deviceType.value) query.device = deviceType.value
  void router.replace({ query })
})

watch([range, selectedPath, deviceType], reload, { deep: true })
onMounted(reload)
</script>
