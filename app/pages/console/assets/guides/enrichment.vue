<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />
    <UPageHeader
      title="Guideline Enrichment"
      description="Facet coverage across every guide, and the state of the backfill that produces it."
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

      <!-- The gate warning comes first: it is the thing that silently breaks
           guideline grounding in answers. -->
      <UAlert
        v-if="audit?.warning"
        color="warning"
        variant="soft"
        icon="i-lucide-triangle-alert"
        title="Most guidelines are not retrievable"
        :description="audit.warning"
      />

      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <UCard
          v-for="tile in tiles"
          :key="tile.label"
          :ui="{ body: 'p-5' }"
          class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
        >
          <p class="text-xs font-medium uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
            {{ tile.label }}
          </p>
          <p class="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {{ tile.value }}
          </p>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {{ tile.hint }}
          </p>
        </UCard>
      </section>

      <UCard
        :ui="{ body: 'p-5 sm:p-6', header: 'p-5 sm:px-6' }"
        class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
      >
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Backfill
              </h2>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Enriches every guide that has rules. Anything already at version {{ status?.version ?? '—' }} is skipped, so this is safe to re-run.
              </p>
            </div>
            <UBadge
              :color="queueColor"
              variant="subtle"
            >
              {{ queueLabel }}
            </UBadge>
          </div>
        </template>

        <div class="flex flex-wrap items-center gap-2">
          <UButton
            v-if="isAdmin"
            color="primary"
            variant="soft"
            icon="i-lucide-sparkles"
            :loading="enqueuePending"
            @click="enqueueAll(false)"
          >
            Enrich all guides
          </UButton>
          <UButton
            v-if="isAdmin"
            color="neutral"
            variant="outline"
            :loading="enqueuePending"
            @click="enqueueAll(true)"
          >
            Force re-enrich all
          </UButton>
          <p
            v-else
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            Running the backfill requires an administrator.
          </p>
        </div>
      </UCard>

      <UCard
        :ui="{ body: 'p-0', header: 'p-5 sm:px-6' }"
        class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
      >
        <template #header>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Per guide
          </h2>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Enriched counts come from the backfill; retrievable counts come from the corpus itself.
          </p>
        </template>

        <UTable
          :data="rows"
          :columns="columns"
          :loading="loading"
        >
          <template #guide-cell="{ row }">
            <ULink
              :to="`/console/assets/guides/${encodeURIComponent(row.original.guide_urn)}`"
              :title="row.original.guide_urn"
              class="font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              {{ row.original.title }}
            </ULink>
          </template>

          <template #coverage-cell="{ row }">
            <div class="flex items-center gap-2">
              <div class="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                <div
                  class="h-full rounded-full bg-primary-500"
                  :style="{ width: `${row.original.coveragePct}%` }"
                />
              </div>
              <span class="tabular-nums text-xs text-gray-600 dark:text-gray-300">
                {{ row.original.enriched }}/{{ row.original.total }}
              </span>
            </div>
          </template>

          <template #retrievable-cell="{ row }">
            <UBadge
              :color="row.original.retrievable === row.original.total ? 'success' : row.original.retrievable ? 'warning' : 'neutral'"
              variant="subtle"
            >
              {{ row.original.retrievable }} active
            </UBadge>
          </template>

          <template #context-cell="{ row }">
            <div class="flex flex-wrap gap-1">
              <UBadge
                v-for="source in row.original.context_sources"
                :key="source"
                color="neutral"
                variant="subtle"
                size="xs"
              >
                {{ formatSource(source) }}
              </UBadge>
              <span
                v-if="!row.original.context_sources.length"
                class="text-xs text-gray-400 dark:text-gray-500"
              >—</span>
            </div>
          </template>

          <template #state-cell="{ row }">
            <UBadge
              :color="stateColor(row.original.status)"
              variant="subtle"
            >
              {{ row.original.status }}
            </UBadge>
            <UTooltip
              v-if="row.original.error"
              :text="row.original.error"
            >
              <UIcon
                name="i-lucide-alert-circle"
                class="ml-1 h-3.5 w-3.5 text-red-500"
              />
            </UTooltip>
          </template>

          <template #actions-cell="{ row }">
            <UButton
              v-if="isAdmin"
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-sparkles"
              :loading="enqueuePendingUrn === row.original.guide_urn"
              @click="enqueueOne(row.original.guide_urn)"
            >
              Enrich
            </UButton>
          </template>

          <template #empty>
            <div class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              No guides with guidelines yet.
            </div>
          </template>
        </UTable>
      </UCard>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
/**
 * Corpus-wide view of guideline enrichment.
 *
 * Two different truths are joined here, and keeping them apart matters:
 * `enriched` is what the backfill has processed, `retrievable` is what the
 * retrieval gate will actually surface. A guide can be fully enriched and still
 * invisible to answers because none of its rules are active.
 */
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import foodscholarGuidelinesApi, {
  type FoodScholarCorpusAudit,
  type FoodScholarEnrichmentStatus
} from '~/services/foodscholarGuidelinesApi'
import catalogApi from '~/services/catalogApi'
import { useAuthStore } from '~/stores/auth'
import { assetSectionBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Guideline Enrichment · Console' })

const authStore = useAuthStore()
const { isAdmin } = storeToRefs(authStore)
const toast = useToast()

const loading = ref(false)
const enqueuePending = ref(false)
const enqueuePendingUrn = ref<string | null>(null)
const error = ref<string | null>(null)
const status = ref<FoodScholarEnrichmentStatus | null>(null)
const audit = ref<FoodScholarCorpusAudit | null>(null)
// Neither the audit nor the progress payload carries a title, so the catalog is
// the only place a human-readable name for a guide exists.
const titlesByUrn = ref<Map<string, string>>(new Map())

const breadcrumbItems = assetSectionBreadcrumb('guides', [
  { label: 'Guideline Enrichment', icon: 'i-lucide-sparkles' }
])

const columns = [
  { accessorKey: 'guide', header: 'Guide' },
  { accessorKey: 'coverage', header: 'Enriched' },
  { accessorKey: 'retrievable', header: 'Retrievable' },
  { accessorKey: 'context', header: 'Context from' },
  { accessorKey: 'state', header: 'Last run' },
  { accessorKey: 'actions', header: '' }
]

const rows = computed(() => {
  const progressByGuide = new Map(
    (status.value?.guides ?? []).map(guide => [guide.guide_urn, guide])
  )

  // Driven by the audit, not by the progress table: a guide that has never been
  // enriched has no progress row but still needs to appear.
  return (audit.value?.guides ?? []).map((guide) => {
    const progress = progressByGuide.get(guide.guide_urn)
    const enriched = guide.enriched ?? 0
    return {
      guide_urn: guide.guide_urn,
      // Falling back to the URN keeps a guide that is missing from the catalog
      // identifiable rather than blank.
      title: titlesByUrn.value.get(guide.guide_urn) || guide.guide_urn,
      total: guide.total,
      enriched,
      retrievable: guide.retrievable,
      coveragePct: guide.total ? Math.round((enriched / guide.total) * 100) : 0,
      context_sources: progress?.context_sources ?? [],
      status: progress?.status ?? 'not run',
      error: progress?.error ?? null
    }
  })
})

const queuePending = computed(() => status.value?.pending_jobs ?? null)

const queueLabel = computed(() => {
  const pending = queuePending.value
  // null means Redis was unreachable — not an empty queue.
  if (pending === null) return 'Queue unreachable'
  if (!pending) return 'Queue idle'
  return `${pending.toLocaleString()} guide${pending === 1 ? '' : 's'} queued`
})

const queueColor = computed(() => {
  if (queuePending.value === null) return 'error'
  return queuePending.value ? 'info' : 'neutral'
})

const tiles = computed(() => {
  const total = audit.value?.total ?? 0
  const unenriched = audit.value?.unenriched ?? 0
  const enriched = total - unenriched
  return [
    {
      label: 'Guidelines',
      value: total.toLocaleString(),
      hint: `${(audit.value?.guides?.length ?? 0).toLocaleString()} guide(s)`
    },
    {
      label: 'Enriched',
      value: total ? `${Math.round((enriched / total) * 100)}%` : '—',
      hint: `${enriched.toLocaleString()} of ${total.toLocaleString()} have facets`
    },
    {
      label: 'Retrievable',
      value: total ? `${Math.round(((audit.value?.retrievable ?? 0) / total) * 100)}%` : '—',
      hint: 'Active rules the QA gate will surface'
    },
    {
      label: 'Failures',
      value: (status.value?.totals?.failed ?? 0).toLocaleString(),
      hint: 'Rules the agent could not process'
    }
  ]
})

function formatSource(source: string): string {
  if (source === 'document_profile') return 'read from PDF'
  if (source === 'extraction_result') return 'extraction run'
  return source
}

function stateColor(state: string) {
  if (state === 'succeeded') return 'success'
  if (state === 'failed') return 'error'
  if (state === 'running') return 'info'
  if (state === 'queued') return 'warning'
  return 'neutral'
}

async function enqueueAll(force: boolean) {
  enqueuePending.value = true
  try {
    const result = await foodscholarGuidelinesApi.enqueueEnrichment({ force })
    const queued = typeof result === 'string' ? 0 : result.queued
    toast.add({
      title: 'Backfill queued',
      description: `${queued} guide(s) queued. The worker processes them in the background.`,
      color: 'success'
    })
    await loadAll()
  } catch (err) {
    toast.add({
      title: 'Could not queue the backfill',
      description: err instanceof Error ? err.message : 'Unknown error',
      color: 'error'
    })
  } finally {
    enqueuePending.value = false
  }
}

async function enqueueOne(guideUrn: string) {
  enqueuePendingUrn.value = guideUrn
  try {
    await foodscholarGuidelinesApi.enqueueEnrichment({ guide_urns: [guideUrn] })
    toast.add({ title: 'Guide queued', color: 'success' })
    await loadAll()
  } catch (err) {
    toast.add({
      title: 'Could not queue that guide',
      description: err instanceof Error ? err.message : 'Unknown error',
      color: 'error'
    })
  } finally {
    enqueuePendingUrn.value = null
  }
}

/**
 * Titles for every guide in the catalog, paged through because the corpus is
 * already larger than a single page. A failure here is deliberately not fatal:
 * the table still renders with URNs.
 */
async function loadTitles() {
  const pageSize = 200
  const titles = new Map<string, string>()
  try {
    for (let offset = 0; offset < 2000; offset += pageSize) {
      const page = await catalogApi.fetchGuides({ limit: pageSize, offset })
      for (const guide of page) {
        if (guide.urn && guide.title) {
          titles.set(guide.urn, guide.title)
        }
      }
      if (page.length < pageSize) break
    }
    titlesByUrn.value = titles
  } catch {
    // Leave whatever titles we already had; the URN fallback covers the rest.
  }
}

async function loadAll() {
  loading.value = true
  error.value = null
  try {
    const [statusResult, auditResult] = await Promise.all([
      foodscholarGuidelinesApi.getEnrichmentStatus(),
      foodscholarGuidelinesApi.auditCorpus(),
      loadTitles()
    ])
    status.value = typeof statusResult === 'string' ? null : statusResult
    audit.value = typeof auditResult === 'string' ? null : auditResult
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not load enrichment state.'
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>
