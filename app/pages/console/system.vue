<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />
    <UPageHeader
      title="Platform Operations"
      description="Elasticsearch index state, embedding coverage, and corpus-wide maintenance. Administrators only."
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

    <UPageBody>
      <!-- The server enforces this too; the client gate is so an expert never
           sees a control that would only 403 on them. -->
      <UAlert
        v-if="!isAdmin"
        color="warning"
        variant="soft"
        icon="i-lucide-shield-alert"
        title="Administrator access required"
        description="These controls affect the whole corpus and are limited to administrators. Ask an administrator if you need an index rebuilt or embeddings backfilled."
      />

      <div
        v-else
        class="space-y-6"
      >
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="error"
        />

        <!-- Service health -->
        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <UCard
            v-for="tile in healthTiles"
            :key="tile.label"
            :ui="{ body: 'p-5' }"
            class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-medium uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                  {{ tile.label }}
                </p>
                <p class="mt-2 truncate text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  {{ tile.value }}
                </p>
                <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  {{ tile.hint }}
                </p>
              </div>
              <UIcon
                :name="tile.icon"
                :class="['h-5 w-5 shrink-0', tile.tone]"
              />
            </div>
          </UCard>
        </section>

        <!-- Index state -->
        <UCard
          :ui="{ body: 'p-0', header: 'p-5 sm:px-6' }"
          class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
        >
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Index state
                </h2>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Document counts and mapping drift for every index this service owns.
                </p>
              </div>
              <UBadge
                v-if="indexState?.drifted?.length"
                color="warning"
                variant="subtle"
              >
                {{ indexState.drifted.length }} with missing fields
              </UBadge>
            </div>
          </template>

          <UAlert
            v-if="indexState?.drifted?.length"
            color="warning"
            variant="soft"
            icon="i-lucide-triangle-alert"
            class="mx-5 mb-4 mt-4 sm:mx-6"
            title="Some indices are missing mapping fields"
            description="New fields are added automatically when the API starts. If an index still reports missing fields after a restart, the field type conflicts with what is already mapped and the index needs rebuilding."
          />

          <UTable
            :data="indexRows"
            :columns="indexColumns"
            :loading="loading"
          >
            <template #index-cell="{ row }">
              <div class="flex flex-col">
                <span class="font-medium text-gray-900 dark:text-white">{{ row.original.index }}</span>
                <span
                  v-if="row.original.concrete_index"
                  class="text-xs text-gray-500 dark:text-gray-400"
                >→ {{ row.original.concrete_index }}</span>
              </div>
            </template>

            <template #doc_count-cell="{ row }">
              <span class="tabular-nums">{{ formatCount(row.original.doc_count) }}</span>
            </template>

            <template #size_bytes-cell="{ row }">
              <span class="tabular-nums text-gray-600 dark:text-gray-300">
                {{ formatConsoleBytes(row.original.size_bytes ?? null) }}
              </span>
            </template>

            <template #mapped_fields-cell="{ row }">
              <span class="tabular-nums text-gray-600 dark:text-gray-300">
                {{ row.original.mapped_fields ?? '—' }}
              </span>
            </template>

            <template #health-cell="{ row }">
              <UBadge
                v-if="!row.original.exists"
                color="error"
                variant="subtle"
              >
                Missing
              </UBadge>
              <UTooltip
                v-else-if="row.original.missing_fields?.length"
                :text="row.original.missing_fields.join(', ')"
              >
                <UBadge
                  color="warning"
                  variant="subtle"
                >
                  {{ row.original.missing_fields.length }} fields behind
                </UBadge>
              </UTooltip>
              <UBadge
                v-else
                color="success"
                variant="subtle"
              >
                Up to date
              </UBadge>
            </template>

            <template #empty>
              <div class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                No index information available.
              </div>
            </template>
          </UTable>
        </UCard>

        <!-- Embedding coverage -->
        <UCard
          :ui="{ body: 'p-5 sm:p-6', header: 'p-5 sm:px-6' }"
          class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
        >
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Embedding coverage
                </h2>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Semantic search only reaches documents that carry a vector. Backfill anything missing before enabling hybrid retrieval.
                </p>
              </div>
              <UBadge
                :color="queuePending === null ? 'error' : queuePending ? 'info' : 'neutral'"
                variant="subtle"
              >
                {{ queueLabel }}
              </UBadge>
            </div>
          </template>

          <div class="space-y-4">
            <div
              v-for="row in embeddingRows"
              :key="row.index"
              class="rounded-xl border border-gray-200/70 p-4 dark:border-white/10"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ row.index }}
                  </p>
                  <p class="mt-0.5 text-xs text-gray-600 dark:text-gray-300">
                    <template v-if="row.exists">
                      {{ formatCount(row.embedded) }} of {{ formatCount(row.total) }} embedded
                      <template v-if="row.missing"> · {{ formatCount(row.missing) }} missing</template>
                    </template>
                    <template v-else>Index does not exist</template>
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <UBadge
                    :color="coverageColor(row)"
                    variant="subtle"
                  >
                    {{ formatCoverage(row.coverage) }}
                  </UBadge>
                  <UButton
                    v-if="backfillable(row) && row.missing"
                    size="xs"
                    color="neutral"
                    variant="outline"
                    :loading="backfillPending === row.index"
                    @click="runBackfill(row.index, true)"
                  >
                    Preview
                  </UButton>
                  <UButton
                    v-if="backfillable(row) && row.missing"
                    size="xs"
                    color="primary"
                    variant="soft"
                    :loading="backfillPending === row.index"
                    @click="runBackfill(row.index, false)"
                  >
                    Backfill
                  </UButton>
                </div>
              </div>

              <div
                v-if="row.exists && row.total"
                class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10"
              >
                <div
                  class="h-full rounded-full bg-primary-500 transition-all"
                  :style="{ width: `${Math.round((row.coverage ?? 0) * 100)}%` }"
                />
              </div>
            </div>

            <p class="text-xs text-gray-500 dark:text-gray-400">
              Backfilling queues jobs for the embedding worker; it processes them in the background and the counts above update as it goes.
              Only documents without a vector are queued, so running it twice is safe.
            </p>
          </div>
        </UCard>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
/**
 * Administrator view of platform state.
 *
 * Everything here is corpus-wide and irreversible-ish (queued work, index
 * rebuilds), which is why it is admin-only rather than open to every console
 * user. The server enforces the same restriction on each endpoint.
 */
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import systemApi, {
  type EmbeddingIndexState,
  type EmbeddingStateResponse,
  type HealthResponse,
  type IndexStateResponse
} from '~/services/systemApi'
import { useAuthStore } from '~/stores/auth'
import { formatConsoleBytes } from '~/utils/consoleGuideCatalog'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })

useHead({ title: 'Platform Operations · Console' })

const authStore = useAuthStore()
const { isAdmin } = storeToRefs(authStore)
const toast = useToast()

const loading = ref(false)
const error = ref<string | null>(null)
const health = ref<HealthResponse | null>(null)
const indexState = ref<IndexStateResponse | null>(null)
const embeddingState = ref<EmbeddingStateResponse | null>(null)
const backfillPending = ref<string | null>(null)

const breadcrumbItems = consoleBreadcrumb({
  label: 'Platform Operations',
  icon: 'i-lucide-server-cog'
})

const indexColumns = [
  { accessorKey: 'index', header: 'Index' },
  { accessorKey: 'doc_count', header: 'Documents' },
  { accessorKey: 'size_bytes', header: 'Size' },
  { accessorKey: 'mapped_fields', header: 'Fields' },
  { accessorKey: 'health', header: 'Mapping' }
]

const indexRows = computed(() => indexState.value?.indices ?? [])
const embeddingRows = computed(() => embeddingState.value?.indices ?? [])
const queuePending = computed(() => embeddingState.value?.queue?.pending ?? null)

const queueLabel = computed(() => {
  const pending = queuePending.value
  // null is "Redis unreachable", which must not read as an empty queue.
  if (pending === null) return 'Queue unreachable'
  if (!pending) return 'Queue idle'
  return `${pending.toLocaleString()} job${pending === 1 ? '' : 's'} queued`
})

const healthTiles = computed(() => {
  const cluster = health.value?.elasticsearch
  const redisUp = health.value?.redis?.reachable
  const storageUp = health.value?.storage?.healthy

  return [
    {
      label: 'Elasticsearch',
      value: cluster?.reachable ? (cluster.status ?? 'unknown') : 'unreachable',
      hint: cluster?.reachable
        ? `${cluster.number_of_nodes ?? '—'} node(s) · ${cluster.active_shards ?? '—'} active shards`
        : (cluster?.error ?? 'Cluster did not respond'),
      icon: 'i-lucide-database',
      tone: cluster?.status === 'green'
        ? 'text-emerald-500'
        : cluster?.reachable ? 'text-amber-500' : 'text-red-500'
    },
    {
      label: 'Job queue',
      value: redisUp ? 'reachable' : 'unreachable',
      hint: queueLabel.value,
      icon: 'i-lucide-list-checks',
      tone: redisUp ? 'text-emerald-500' : 'text-red-500'
    },
    {
      label: 'Object storage',
      value: storageUp ? 'healthy' : 'unhealthy',
      hint: storageUp ? 'Artifact uploads and downloads available' : 'Artifact access may fail',
      icon: 'i-lucide-hard-drive',
      tone: storageUp ? 'text-emerald-500' : 'text-red-500'
    },
    {
      label: 'Indices',
      value: `${indexRows.value.filter(row => row.exists).length}/${indexRows.value.length}`,
      hint: indexState.value?.drifted?.length
        ? `${indexState.value.drifted.length} missing mapping fields`
        : 'All mappings up to date',
      icon: 'i-lucide-layers',
      tone: indexState.value?.drifted?.length ? 'text-amber-500' : 'text-emerald-500'
    }
  ]
})

function formatCount(value?: number | null): string {
  return typeof value === 'number' ? value.toLocaleString() : '—'
}

function formatCoverage(coverage?: number | null): string {
  if (coverage === null || coverage === undefined) return 'No documents'
  return `${Math.round(coverage * 100)}%`
}

function coverageColor(row: EmbeddingIndexState) {
  if (!row.exists || row.total === 0) return 'neutral'
  const coverage = row.coverage ?? 0
  if (coverage >= 0.99) return 'success'
  if (coverage >= 0.5) return 'warning'
  return 'error'
}

// Only these two have a backfill endpoint; the rest report coverage only.
const BACKFILLABLE = new Set(['articles', 'guidelines'])
function backfillable(row: EmbeddingIndexState): boolean {
  return row.exists && BACKFILLABLE.has(row.index)
}

async function runBackfill(index: string, dryRun: boolean) {
  backfillPending.value = index
  try {
    const result = index === 'articles'
      ? await systemApi.backfillArticleEmbeddings({ dryRun })
      : await systemApi.backfillGuidelineEmbeddings({ dryRun })

    toast.add({
      title: dryRun ? 'Backfill preview' : 'Backfill queued',
      description: dryRun
        ? `${result.queued.toLocaleString()} document(s) would be queued.`
        : `${result.queued.toLocaleString()} document(s) queued${result.failed ? `, ${result.failed} failed` : ''}.`,
      color: result.failed ? 'warning' : 'success'
    })

    if (!dryRun) await loadEmbeddingState()
  } catch (err) {
    toast.add({
      title: 'Backfill failed',
      description: err instanceof Error ? err.message : 'Unknown error',
      color: 'error'
    })
  } finally {
    backfillPending.value = null
  }
}

async function loadEmbeddingState() {
  embeddingState.value = await systemApi.getEmbeddingState()
}

async function loadAll() {
  if (!isAdmin.value) return

  loading.value = true
  error.value = null
  try {
    const [healthResult, indexResult, embeddingResult] = await Promise.all([
      systemApi.getHealth(),
      systemApi.getIndexState(),
      systemApi.getEmbeddingState()
    ])
    health.value = healthResult
    indexState.value = indexResult
    embeddingState.value = embeddingResult
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not load platform state.'
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>
