<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />
    <UPageHeader
      title="Article Enrichment"
      description="Enrichment coverage across the catalog, batch runs by journal, and the progress of each run."
      :ui="{ root: 'relative py-8 border-b-0' }"
    >
      <template #links>
        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          :loading="loading"
          @click="loadAll"
        >
          Refresh
        </UButton>
      </template>
    </UPageHeader>

    <UPageBody class="space-y-6">
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :title="error"
      />

      <!-- ── Coverage tiles ─────────────────────────────────────────────── -->
      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <UCard
          v-for="tile in tiles"
          :key="tile.label"
          :ui="{ body: 'p-5' }"
          class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
        >
          <p class="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
            {{ tile.label }}
          </p>
          <p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {{ tile.value }}
          </p>
          <p
            v-if="tile.hint"
            class="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >
            {{ tile.hint }}
          </p>
        </UCard>
      </section>

      <!-- ── Run a batch ────────────────────────────────────────────────── -->
      <UCard
        :ui="{ body: 'p-5' }"
        class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
      >
        <div class="flex flex-wrap items-end gap-3">
          <div class="min-w-[16rem] flex-1">
            <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Journal (optional)</label>
            <USelectMenu
              v-model="batchVenue"
              :items="venueOptions"
              value-key="value"
              label-key="label"
              searchable
              placeholder="All journals"
              class="w-full"
            />
          </div>
          <div class="w-32">
            <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Limit</label>
            <UInput
              v-model.number="batchLimit"
              type="number"
              :min="1"
              :max="2000"
            />
          </div>
          <UCheckbox
            v-model="batchForce"
            label="Force (re-enrich already-enriched)"
          />
          <UButton
            icon="i-lucide-sparkles"
            :loading="startingBatch"
            @click="startBatch()"
          >
            {{ batchButtonLabel }}
          </UButton>
        </div>
        <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Batches are idempotent across runs: the selection skips already-enriched articles
          (unless forced) and never duplicates a queued or running job — re-running the same
          criteria simply continues where the last run stopped.
        </p>
      </UCard>

      <!-- ── Per-journal coverage ───────────────────────────────────────── -->
      <UCard
        :ui="{ body: 'p-0' }"
        class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
      >
        <div class="border-b border-gray-100 px-5 py-3 dark:border-white/5">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
            Coverage by journal
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            The largest journals in the catalog and how much of each is enriched.
          </p>
        </div>
        <div class="max-h-[28rem] overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-gray-50/95 text-left text-xs uppercase tracking-wide text-gray-500 backdrop-blur dark:bg-zinc-900/95 dark:text-gray-400">
              <tr>
                <th class="px-5 py-2 font-medium">
                  Journal
                </th>
                <th class="px-3 py-2 text-right font-medium">
                  Articles
                </th>
                <th class="px-3 py-2 text-right font-medium">
                  Enriched
                </th>
                <th class="w-44 px-3 py-2 font-medium">
                  Coverage
                </th>
                <th class="px-5 py-2 text-right font-medium" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in overview?.venues || []"
                :key="row.venue"
                class="border-t border-gray-100 dark:border-white/5"
              >
                <td class="max-w-[22rem] truncate px-5 py-2 text-gray-800 dark:text-gray-200">
                  {{ row.venue }}
                </td>
                <td class="px-3 py-2 text-right tabular-nums text-gray-600 dark:text-gray-300">
                  {{ row.total }}
                </td>
                <td class="px-3 py-2 text-right tabular-nums text-gray-600 dark:text-gray-300">
                  {{ row.enriched }}
                </td>
                <td class="px-3 py-2">
                  <div class="flex items-center gap-2">
                    <UProgress
                      :model-value="coveragePercent(row)"
                      size="sm"
                      class="flex-1"
                    />
                    <span class="w-10 text-right text-xs tabular-nums text-gray-500 dark:text-gray-400">{{ coveragePercent(row) }}%</span>
                  </div>
                </td>
                <td class="px-5 py-2 text-right">
                  <UButton
                    v-if="row.pending > 0"
                    size="xs"
                    color="neutral"
                    variant="soft"
                    icon="i-lucide-sparkles"
                    :loading="startingBatch && batchVenueInFlight === row.venue"
                    @click="startVenueBatch(row)"
                  >
                    Enrich {{ Math.min(row.pending, 2000) }}
                  </UButton>
                  <UBadge
                    v-else
                    color="success"
                    variant="soft"
                  >
                    Complete
                  </UBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <!-- ── Recent batches ─────────────────────────────────────────────── -->
      <UCard
        :ui="{ body: 'p-0' }"
        class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
      >
        <div class="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-white/5">
          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Batch runs
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Live progress refreshes automatically while a batch is running.
            </p>
          </div>
          <UBadge
            v-if="anyBatchActive"
            color="info"
            variant="soft"
          >
            running
          </UBadge>
        </div>
        <div
          v-if="!batches.length"
          class="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          No batches yet. Start one above, or from a journal row.
        </div>
        <ul v-else>
          <li
            v-for="batch in batches"
            :key="batch.batch_id"
            class="border-t border-gray-100 px-5 py-3 first:border-t-0 dark:border-white/5"
          >
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span class="text-sm font-medium text-gray-800 dark:text-gray-200">
                {{ batchLabel(batch) }}
              </span>
              <UBadge
                :color="batchColor(batch)"
                variant="soft"
              >
                {{ batchStatus(batch) }}
              </UBadge>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatWhen(batch.created_at) }}
                <template v-if="batch.requested_by"> · {{ batch.requested_by }}</template>
              </span>
            </div>
            <div
              v-if="batch.progress"
              class="mt-2 flex items-center gap-3"
            >
              <UProgress
                :model-value="batch.progress.percent"
                size="sm"
                class="max-w-md flex-1"
              />
              <span class="text-xs tabular-nums text-gray-600 dark:text-gray-300">
                {{ batch.progress.done }}/{{ batch.progress.total }}
                <template v-if="batch.progress.failed"> · {{ batch.progress.failed }} failed</template>
                <template v-if="batch.progress.running"> · {{ batch.progress.running }} running</template>
              </span>
            </div>
            <details
              v-if="batch.failures?.length"
              class="mt-2"
            >
              <summary class="cursor-pointer text-xs text-red-600 dark:text-red-400">
                {{ batch.failures.length }} recent failure(s)
              </summary>
              <ul class="mt-1 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                <li
                  v-for="failure in batch.failures"
                  :key="failure.urn"
                  class="truncate"
                >
                  {{ failure.urn }} — {{ failure.error || 'unknown error' }}
                </li>
              </ul>
            </details>
          </li>
        </ul>
      </UCard>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
/**
 * Article enrichment operations.
 *
 * The per-article buttons live on the articles list; this page is the
 * administrator's fleet view: how much of the catalog is enriched, which
 * journals are behind, and batch runs that are idempotent to re-fire.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import foodscholarEnrichmentApi from '~/services/foodscholarEnrichmentApi'
import type {
  EnrichmentBatchSummary,
  EnrichmentOverview,
  VenueEnrichmentStatus
} from '~/services/foodscholarEnrichmentApi'

definePageMeta({
  middleware: ['auth', 'profile']
})

useHead({ title: 'Article Enrichment · Console' })

const breadcrumbItems = [
  { label: 'Console', to: '/console' },
  { label: 'Articles', to: '/console/assets/articles' },
  { label: 'Enrichment' }
]

const loading = ref(false)
const error = ref<string | null>(null)
const overview = ref<EnrichmentOverview | null>(null)
const batches = ref<EnrichmentBatchSummary[]>([])

const batchVenue = ref<string | undefined>(undefined)
const batchLimit = ref(200)
const batchForce = ref(false)
const startingBatch = ref(false)
const batchVenueInFlight = ref<string | null>(null)

const tiles = computed(() => {
  const data = overview.value
  if (!data) return []
  const percent = data.total ? Math.round((100 * data.enriched) / data.total) : 0
  return [
    { label: 'Articles', value: data.total.toLocaleString(), hint: 'Live catalog documents' },
    { label: 'Enriched', value: data.enriched.toLocaleString(), hint: `${percent}% of the catalog` },
    { label: 'Pending', value: data.pending.toLocaleString(), hint: 'No enrichment yet' },
    {
      label: 'Queue',
      value: data.queue_depth === null || data.queue_depth === undefined ? '—' : String(data.queue_depth),
      hint: data.sweeper_paused ? 'Sweeper paused' : 'Jobs waiting for the worker'
    }
  ]
})

const venueOptions = computed(() =>
  (overview.value?.venues || []).map(row => ({
    value: row.venue,
    label: `${row.venue} (${row.pending} pending)`
  }))
)

const batchButtonLabel = computed(() => {
  if (batchVenue.value) return `Enrich "${batchVenue.value}"`
  return batchForce.value ? 'Re-enrich batch' : 'Enrich missing'
})

const anyBatchActive = computed(() =>
  batches.value.some(batch => (batch.progress?.done ?? 0) < (batch.progress?.total ?? 0))
)

function coveragePercent(row: VenueEnrichmentStatus): number {
  return row.total ? Math.round((100 * row.enriched) / row.total) : 0
}

function batchLabel(batch: EnrichmentBatchSummary): string {
  const scope = batch.criteria?.venue || 'All journals'
  const mode = batch.criteria?.force ? 'force' : 'missing only'
  return `${scope} · ${batch.selected} selected (${mode})`
}

function batchStatus(batch: EnrichmentBatchSummary): string {
  const progress = batch.progress
  if (!progress || !progress.total) return 'empty'
  if (progress.done >= progress.total) {
    return progress.failed ? 'done, with failures' : 'done'
  }
  return 'running'
}

function batchColor(batch: EnrichmentBatchSummary): 'success' | 'error' | 'info' | 'neutral' {
  const status = batchStatus(batch)
  if (status === 'done') return 'success'
  if (status === 'done, with failures') return 'error'
  if (status === 'running') return 'info'
  return 'neutral'
}

function formatWhen(value?: string): string {
  if (!value) return ''
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}

async function loadAll() {
  loading.value = true
  error.value = null
  try {
    const [ov, list] = await Promise.all([
      foodscholarEnrichmentApi.getOverview(),
      foodscholarEnrichmentApi.listBatches()
    ])
    overview.value = ov
    // Fetch live progress for each listed batch (list rows omit it).
    batches.value = await Promise.all(
      list.map(batch =>
        foodscholarEnrichmentApi.getBatch(batch.batch_id).catch(() => batch)
      )
    )
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load enrichment overview.'
  } finally {
    loading.value = false
  }
}

async function startBatch(venueOverride?: string) {
  startingBatch.value = true
  error.value = null
  try {
    await foodscholarEnrichmentApi.enqueueBatch({
      venue: venueOverride ?? batchVenue.value ?? null,
      only_missing: !batchForce.value,
      force: batchForce.value,
      limit: batchLimit.value
    })
    await loadAll()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to start the batch.'
  } finally {
    startingBatch.value = false
    batchVenueInFlight.value = null
  }
}

async function startVenueBatch(row: VenueEnrichmentStatus) {
  batchVenueInFlight.value = row.venue
  batchLimit.value = Math.min(row.pending, 2000)
  await startBatch(row.venue)
}

// Poll while any batch is still working so progress bars move on their own.
let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await loadAll()
  pollTimer = setInterval(() => {
    if (anyBatchActive.value && !loading.value) void loadAll()
  }, 5000)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>
