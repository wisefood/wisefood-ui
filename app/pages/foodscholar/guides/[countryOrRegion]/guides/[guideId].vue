<template>
  <div class="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <FoodscholarMicroHeader
      :show-back="true"
      :back-to="resolvedRegion ? buildGuidesRegionPath(resolvedRegion) : buildGuidesCatalogPath()"
      back-label="Back to Guides"
      back-icon="i-lucide-arrow-left"
      brand-title="FoodScholar"
      brand-lead="Dietary guides by country."
    />

    <!-- Guide title + metadata header -->
    <div v-if="selectedGuide" class="shrink-0 bg-white/70 px-4 py-5 backdrop-blur-sm dark:bg-zinc-900/50 sm:px-6">
      <div class="mx-auto flex max-w-6xl items-start justify-between gap-4">
        <div class="min-w-0 space-y-2.5">
          <h1 class="text-xl font-semibold leading-snug text-gray-900 dark:text-white sm:text-2xl">
            {{ selectedGuide.title }}
          </h1>
          <p v-if="selectedGuide.description" class="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {{ selectedGuide.description }}
          </p>
          <!-- Primary metadata row -->
          <div class="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
            <span class="inline-flex items-center gap-1.5 font-medium text-brand-600 dark:text-brand-400">
              {{ regionTitle }}
            </span>
            <span v-if="guidePublisher" class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-building-2" class="h-3.5 w-3.5 shrink-0" />
              {{ guidePublisher }}
            </span>
            <span v-if="guidePublicationLabel" class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-calendar" class="h-3.5 w-3.5 shrink-0" />
              {{ guidePublicationLabel }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-list-checks" class="h-3.5 w-3.5 shrink-0" />
              {{ totalGuideGuidelines }} rules
            </span>
          </div>
          <!-- Secondary metadata row -->
          <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
            <span v-if="selectedGuide.document_type" class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-file-type" class="h-3.5 w-3.5 shrink-0" />
              {{ formatEnumLabel(selectedGuide.document_type) }}
            </span>
            <span v-if="selectedGuide.language" class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-languages" class="h-3.5 w-3.5 shrink-0" />
              {{ selectedGuide.language.toUpperCase() }}
            </span>
            <span v-if="selectedGuide.license" class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-scale" class="h-3.5 w-3.5 shrink-0" />
              {{ formatEnumLabel(selectedGuide.license) }}
            </span>
            <span v-if="selectedGuide.graphical_model" class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-pie-chart" class="h-3.5 w-3.5 shrink-0" />
              {{ formatEnumLabel(selectedGuide.graphical_model) }}
            </span>
            <span v-if="selectedGuide.evidence_basis" class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-microscope" class="h-3.5 w-3.5 shrink-0" />
              {{ formatEnumLabel(selectedGuide.evidence_basis) }}
            </span>
            <span v-if="selectedGuide.applicability_status && selectedGuide.applicability_status !== 'unknown'" class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-circle-check" class="h-3.5 w-3.5 shrink-0" />
              {{ formatEnumLabel(selectedGuide.applicability_status) }}
            </span>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-2 pt-0.5">
          <UButton
            v-if="selectedGuide?.url"
            :to="selectedGuide.url"
            target="_blank"
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-external-link"
            class="hidden sm:flex"
          >
            Source
          </UButton>
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            :icon="showInfoPanel ? 'i-lucide-panel-right-close' : 'i-lucide-info'"
            class="xl:hidden"
            @click="showInfoPanel = !showInfoPanel"
          />
        </div>
      </div>
    </div>

    <!-- Loading / error states -->
    <div v-if="detailLoading && !selectedGuide" class="flex flex-1 items-center justify-center">
      <div class="text-center">
        <div class="mx-auto h-10 w-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
        <p class="mt-4 text-sm text-gray-600 dark:text-gray-300">
          Loading guide…
        </p>
      </div>
    </div>

    <UAlert
      v-else-if="detailError && !selectedGuide"
      color="error"
      variant="soft"
      icon="i-lucide-alert-circle"
      :title="detailError"
      class="m-4"
    />

    <!-- Main split layout -->
    <div v-else-if="selectedGuide" class="flex min-h-0 flex-1 justify-center">
    <div class="flex min-h-0 w-full max-w-6xl flex-1">
      <!-- LEFT: PDF viewer -->
      <div v-if="primaryPdfArtifact" class="flex min-w-0 flex-1 flex-col">
        <!-- PDF toolbar -->
        <div class="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-100/60 bg-white/70 px-3 py-2 dark:border-white/5 dark:bg-zinc-900/40">
          <!-- Artifact selector -->
          <USelectMenu
            v-if="pdfArtifacts.length > 1"
            v-model="selectedArtifactId"
            :items="pdfArtifactOptions"
            value-key="value"
            label-key="label"
            size="xs"
            class="w-44"
          />

          <div class="ml-auto flex items-center gap-1">
            <!-- Page navigation -->
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-chevron-left"
              :disabled="currentPage <= 1"
              @click="currentPage = Math.max(1, currentPage - 1)"
            />
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-chevron-right"
              :disabled="pdfTotalPages > 0 && currentPage >= pdfTotalPages"
              @click="currentPage = pdfTotalPages ? Math.min(pdfTotalPages, currentPage + 1) : currentPage + 1"
            />

            <div class="mx-1 h-4 w-px bg-gray-200 dark:bg-white/10" />

            <!-- Zoom -->
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-zoom-out"
              :disabled="zoom <= 0.5"
              @click="zoom = Math.max(0.5, parseFloat((zoom - 0.1).toFixed(1)))"
            />
            <span class="min-w-[2.5rem] text-center text-xs text-gray-600 dark:text-gray-300">
              {{ Math.round(zoom * 100) }}%
            </span>
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-zoom-in"
              :disabled="zoom >= 2"
              @click="zoom = Math.min(2, parseFloat((zoom + 0.1).toFixed(1)))"
            />
          </div>
        </div>

        <!-- PDF canvas area -->
        <div class="flex-1 overflow-auto pb-8">
          <ClientOnly>
            <ReviewPdfViewport
              :artifact="primaryPdfArtifact"
              :current-page="currentPage"
              :zoom="zoom"
              @navigate-page="handlePdfPageNavigation"
              @status-change="handlePdfStatusChange"
            />
            <template #fallback>
              <div class="flex h-full items-center justify-center">
                <div class="text-center text-sm text-gray-500 dark:text-gray-400">
                  <UIcon name="i-lucide-loader-circle" class="mx-auto h-6 w-6 animate-spin" />
                  <p class="mt-2">Loading PDF viewer…</p>
                </div>
              </div>
            </template>
          </ClientOnly>
        </div>
      </div>

      <!-- LEFT (no PDF): metadata + artifacts column -->
      <div v-else class="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-r border-gray-200/70 p-4 dark:border-white/10">
        <GuideMetadataPanel
          :guide="selectedGuide"
          :guideline-count="totalGuideGuidelines"
        />
        <GuideArtifactList :artifacts="selectedGuide.artifacts" />
      </div>

      <!-- RIGHT: Guidelines panel -->
      <div class="flex w-[22rem] shrink-0 flex-col bg-white/60 dark:bg-zinc-900/50 xl:w-96">
        <!-- Panel header -->
        <div class="shrink-0 px-4 pt-4 pb-3 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              {{ guidelineTotal }} Rules
            </span>
            <div class="flex items-center gap-3">
              <button
                v-if="hasActiveFilters"
                type="button"
                class="text-xs text-gray-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
                @click="resetGuidelineFilters"
              >
                Clear filters
              </button>
              <!-- Page sync toggle -->
              <button
                v-if="primaryPdfArtifact && hasPageAssociations"
                type="button"
                :class="[
                  'flex items-center gap-1.5 text-xs transition-colors',
                  syncToPdfPage ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                ]"
                @click="syncToPdfPage = !syncToPdfPage"
              >
                <UIcon :name="syncToPdfPage ? 'i-lucide-link' : 'i-lucide-link-2-off'" class="h-3.5 w-3.5" />
                <span>Sync</span>
              </button>
            </div>
          </div>

          <!-- Search -->
          <input
            v-model="queryText"
            type="text"
            placeholder="Search rules…"
            class="w-full rounded-md border-0 bg-gray-100/80 px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-400/40 dark:bg-zinc-800/60 dark:text-white dark:placeholder-gray-500 dark:focus:bg-zinc-800 transition-colors"
          />

          <!-- Filters -->
          <div v-if="topicOptions.length > 1 || audienceOptions.length > 1" class="flex gap-2">
            <USelectMenu
              v-if="topicOptions.length > 1"
              v-model="selectedTopic"
              :items="topicOptions"
              value-key="value"
              label-key="label"
              size="xs"
              class="flex-1"
            />
            <USelectMenu
              v-if="audienceOptions.length > 1"
              v-model="selectedAudience"
              :items="audienceOptions"
              value-key="value"
              label-key="label"
              size="xs"
              class="flex-1"
            />
          </div>
        </div>

        <!-- Guidelines list -->
        <div class="flex-1 overflow-y-auto pb-8">
          <!-- Loading skeletons -->
          <div v-if="guidelinesLoading && !guidelines.length" class="space-y-px px-4 py-2">
            <div
              v-for="index in 6"
              :key="`gl-skeleton-${index}`"
              class="animate-pulse py-3"
            >
              <div class="space-y-2">
                <div class="h-2.5 w-full rounded bg-gray-100 dark:bg-zinc-800" />
                <div class="h-2.5 w-4/5 rounded bg-gray-100 dark:bg-zinc-800" />
                <div class="h-2.5 w-3/5 rounded bg-gray-100 dark:bg-zinc-800" />
              </div>
            </div>
          </div>

          <div v-else-if="guidelinesError" class="mx-4 mt-4 rounded-lg bg-red-50/60 p-3 text-xs text-red-600 dark:bg-red-900/10 dark:text-red-300">
            {{ guidelinesError }}
          </div>

          <div v-else-if="!guidelines.length" class="py-16 text-center">
            <p class="text-xs text-gray-400 dark:text-gray-500">
              {{ syncToPdfPage && hasPageAssociations ? `No rules for page ${currentPage}.` : 'No rules match.' }}
            </p>
          </div>

          <div v-else class="divide-y divide-gray-100/80 dark:divide-white/5">
            <button
              v-for="guideline in guidelines"
              :key="guideline.id"
              type="button"
              :class="[
                'group w-full px-4 py-3.5 text-left transition-colors duration-100',
                activeGuidelineId === guideline.id
                  ? 'bg-brand-50/80 dark:bg-brand-900/20'
                  : 'hover:bg-gray-50/80 dark:hover:bg-white/[0.03]'
              ]"
              @click="selectGuideline(guideline)"
            >
              <div class="flex gap-3">
                <div
                  :class="[
                    'mt-1 h-1.5 w-1.5 shrink-0 rounded-full transition-colors',
                    activeGuidelineId === guideline.id ? 'bg-brand-500' : 'bg-gray-300 group-hover:bg-gray-400 dark:bg-zinc-600'
                  ]"
                />
                <p class="text-xs leading-5 text-gray-700 dark:text-gray-300">
                  {{ guideline.rule_text }}
                </p>
              </div>
            </button>
          </div>

          <!-- Pagination -->
          <div v-if="guidelineTotal > guidelinePageSize" class="flex items-center justify-between px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
            <button
              type="button"
              :disabled="guidelinePage <= 1"
              class="disabled:opacity-30 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              @click="guidelinePage--"
            >
              ← Prev
            </button>
            <span>{{ guidelinePage }} / {{ Math.ceil(guidelineTotal / guidelinePageSize) }}</span>
            <button
              type="button"
              :disabled="guidelinePage >= Math.ceil(guidelineTotal / guidelinePageSize)"
              class="disabled:opacity-30 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              @click="guidelinePage++"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <!-- Info panel overlay (mobile / optional) -->
      <div
        v-if="showInfoPanel && selectedGuide"
        class="absolute inset-y-0 right-0 z-30 flex w-80 flex-col gap-4 overflow-y-auto border-l border-gray-200/70 bg-white/95 p-4 shadow-xl dark:border-white/10 dark:bg-zinc-900/95 xl:hidden"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
            Guide Info
          </h2>
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-x"
            @click="showInfoPanel = false"
          />
        </div>
        <GuideMetadataPanel
          :guide="selectedGuide"
          :guideline-count="totalGuideGuidelines"
        />
        <GuideArtifactList :artifacts="selectedGuide.artifacts" />
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { CatalogArtifact, CatalogFacetBucket, CatalogGuide, CatalogGuideline } from '~/services/catalogApi'
import GuideArtifactList from '~/components/foodscholar/guides/GuideArtifactList.vue'
import GuideMetadataPanel from '~/components/foodscholar/guides/GuideMetadataPanel.vue'
import ReviewPdfViewport from '~/components/console/guides/ReviewPdfViewport.client.vue'
import catalogApi from '~/services/catalogApi'
import {
  buildFacetSelectOptions,
  buildGuideDetailPath,
  buildGuidesCatalogPath,
  buildGuidesRegionPath,
  firstQueryValue,
  formatEnumLabel,
  getGuidePublicationLabel,
  getGuidePublisher,
  getGuidelinePageReferences,
  getRegionPresentation,
  hasGuidePageAssociations,
  isPdfArtifact,
  parsePositivePageQuery,
  quoteCatalogFilterValue
} from '~/utils/guidesCatalog'

definePageMeta({
  middleware: ['auth', 'profile']
})

const DEFAULT_GUIDELINE_SORT = 'sequence_no asc'
const guidelinePageSize = 8

const route = useRoute()
const router = useRouter()

const regionParam = computed(() => String(route.params.countryOrRegion || ''))
const guideId = computed(() => decodeURIComponent(String(route.params.guideId || '')))

const selectedGuide = ref<CatalogGuide | null>(null)
const resolvedRegion = ref('')
const allGuideGuidelines = ref<CatalogGuideline[]>([])
const totalGuideGuidelines = ref(0)
const guidelineOverviewFacets = ref<Record<string, CatalogFacetBucket[]>>({})

const detailLoading = ref(true)
const detailError = ref<string | null>(null)
const guidelinesLoading = ref(false)
const guidelinesError = ref<string | null>(null)

const queryText = ref('')
const selectedTopic = ref('all')
const selectedAudience = ref('all')
const selectedPageRef = ref('all')
const guidelineSort = ref(DEFAULT_GUIDELINE_SORT)
const guidelinePage = ref(1)
const guidelines = ref<CatalogGuideline[]>([])
const guidelineTotal = ref(0)
const activeGuidelineId = ref<string | null>(null)

// PDF state
const currentPage = ref(1)
const zoom = ref(0.7)
const pdfTotalPages = ref(0)
const selectedArtifactId = ref<string>('')
const syncToPdfPage = ref(true)

// UI state
const showInfoPanel = ref(false)

const guidelineLoadToken = ref(0)
let suppressWatcher = false
let refreshTimeout: ReturnType<typeof setTimeout> | null = null

const guideTitle = computed(() => selectedGuide.value?.title || 'Guide detail')
const regionTitle = computed(() => getRegionPresentation(resolvedRegion.value || regionParam.value).label)
const guidePublisher = computed(() => selectedGuide.value ? getGuidePublisher(selectedGuide.value) : null)
const guidePublicationLabel = computed(() => selectedGuide.value ? getGuidePublicationLabel(selectedGuide.value) : null)


useHead({
  title: computed(() => `${guideTitle.value} | FoodScholar`)
})

useSeoMeta({
  description: computed(() => `Browse guide metadata, artifacts, and rule-level guidelines for ${guideTitle.value}.`)
})


const pdfArtifacts = computed<CatalogArtifact[]>(() => {
  return selectedGuide.value?.artifacts.filter(artifact => isPdfArtifact(artifact)) ?? []
})

const primaryPdfArtifact = computed<CatalogArtifact | null>(() => {
  if (!pdfArtifacts.value.length) return null
  return pdfArtifacts.value.find(artifact => artifact.id === selectedArtifactId.value) ?? pdfArtifacts.value[0] ?? null
})

const pdfArtifactOptions = computed(() => {
  return pdfArtifacts.value.map(artifact => ({
    label: artifact.title,
    value: artifact.id
  }))
})

const hasPageAssociations = computed(() => hasGuidePageAssociations(allGuideGuidelines.value))

const topicBuckets = computed(() => {
  return guidelineOverviewFacets.value.topic?.length
    ? guidelineOverviewFacets.value.topic
    : guidelineOverviewFacets.value.food_groups || []
})

const audienceBuckets = computed(() => {
  return guidelineOverviewFacets.value.audience?.length
    ? guidelineOverviewFacets.value.audience
    : guidelineOverviewFacets.value.target_populations || []
})

const topicFilterField = computed(() => guidelineOverviewFacets.value.topic?.length ? 'topic' : 'food_groups')
const audienceFilterField = computed(() => guidelineOverviewFacets.value.audience?.length ? 'audience' : 'target_populations')

const topicOptions = computed(() => {
  return buildFacetSelectOptions(
    'All topics',
    topicBuckets.value,
    selectedTopic.value,
    value => topicFilterField.value === 'food_groups' ? formatEnumLabel(value) : value
  )
})

const audienceOptions = computed(() => {
  return buildFacetSelectOptions(
    'All audiences',
    audienceBuckets.value,
    selectedAudience.value,
    value => audienceFilterField.value === 'target_populations' ? formatEnumLabel(value) : value
  )
})

const hasActiveFilters = computed(() => {
  return queryText.value.trim() !== '' || selectedTopic.value !== 'all' || selectedAudience.value !== 'all' || (syncToPdfPage.value && hasPageAssociations.value)
})


function selectGuideline(guideline: CatalogGuideline) {
  activeGuidelineId.value = guideline.id

  const pages = getGuidelinePageReferences(guideline)
  if (pages.length && primaryPdfArtifact.value && pages[0] !== undefined) {
    currentPage.value = pages[0]
  }
}

function handlePdfPageNavigation(page: number) {
  currentPage.value = page
}

function handlePdfStatusChange(status: { totalPages: number }) {
  pdfTotalPages.value = status.totalPages
}

function buildGuidelineFilters() {
  const filters: string[] = []

  if (selectedTopic.value !== 'all') {
    filters.push(`${topicFilterField.value}:${quoteCatalogFilterValue(selectedTopic.value)}`)
  }

  if (selectedAudience.value !== 'all') {
    filters.push(`${audienceFilterField.value}:${quoteCatalogFilterValue(selectedAudience.value)}`)
  }

  if (syncToPdfPage.value && primaryPdfArtifact.value && hasPageAssociations.value) {
    filters.push(`page_no:${quoteCatalogFilterValue(String(currentPage.value))}`)
  } else if (selectedPageRef.value !== 'all') {
    filters.push(`page_no:${quoteCatalogFilterValue(selectedPageRef.value)}`)
  }

  return filters
}

function buildRouteQuery() {
  return {
    q: queryText.value.trim() || undefined,
    topic: selectedTopic.value !== 'all' ? selectedTopic.value : undefined,
    audience: selectedAudience.value !== 'all' ? selectedAudience.value : undefined,
    page: guidelinePage.value > 1 ? String(guidelinePage.value) : undefined
  }
}

function syncRouteQuery() {
  void router.replace({
    path: selectedGuide.value
      ? buildGuideDetailPath(resolvedRegion.value || regionParam.value, selectedGuide.value.urn)
      : route.path,
    query: buildRouteQuery()
  })
}

function hydrateStateFromRoute() {
  const q = route.query as Record<string, string | string[] | null | undefined>
  queryText.value = firstQueryValue(q.q)
  selectedTopic.value = firstQueryValue(q.topic) || 'all'
  selectedAudience.value = firstQueryValue(q.audience) || 'all'
  selectedPageRef.value = firstQueryValue(q.pageRef) || 'all'
  guidelinePage.value = parsePositivePageQuery(q.page)
}

function clearScheduledRefresh() {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
    refreshTimeout = null
  }
}

function scheduleRefresh() {
  clearScheduledRefresh()
  refreshTimeout = setTimeout(() => {
    syncRouteQuery()
    void loadGuidelines()
  }, 250)
}

async function loadGuidelineContext() {
  if (!selectedGuide.value) return

  try {
    const [allGuidelines, guidelineSearch] = await Promise.all([
      catalogApi.fetchGuidelinesByGuide(selectedGuide.value.urn, { limit: 1000, offset: 0 }),
      catalogApi.searchGuidelinesByGuide(selectedGuide.value.urn, {
        limit: 1,
        offset: 0,
        fields: ['topic', 'food_groups', 'audience', 'target_populations', 'page_no'],
        facet_limit: 100
      })
    ])

    allGuideGuidelines.value = allGuidelines
      .slice()
      .sort((left, right) => (left.sequence_no || 0) - (right.sequence_no || 0))
    totalGuideGuidelines.value = guidelineSearch.total || allGuideGuidelines.value.length
    guidelineOverviewFacets.value = guidelineSearch.facets
  } catch (error) {
    console.error('[GuideDetail] Failed to load guideline context:', error)
    allGuideGuidelines.value = []
    totalGuideGuidelines.value = 0
    guidelineOverviewFacets.value = {}
  }
}

async function loadGuidelines() {
  if (!selectedGuide.value) {
    guidelines.value = []
    guidelineTotal.value = 0
    return
  }

  const loadToken = ++guidelineLoadToken.value
  guidelinesLoading.value = true
  guidelinesError.value = null

  try {
    const response = await catalogApi.searchGuidelinesByGuide(selectedGuide.value.urn, {
      q: queryText.value.trim() || null,
      limit: guidelinePageSize,
      offset: (guidelinePage.value - 1) * guidelinePageSize,
      fq: buildGuidelineFilters(),
      sort: guidelineSort.value
    })

    if (loadToken !== guidelineLoadToken.value) return

    guidelineTotal.value = response.total

    const totalPages = Math.max(1, Math.ceil(response.total / guidelinePageSize))
    if (guidelinePage.value > totalPages) {
      guidelinePage.value = totalPages
      return
    }

    guidelines.value = response.guidelines
    activeGuidelineId.value = null
  } catch (error) {
    if (loadToken !== guidelineLoadToken.value) return
    console.error('[GuideDetail] Failed to load guide guidelines:', error)
    guidelinesError.value = 'The guide guidelines could not be loaded right now.'
    guidelines.value = []
    guidelineTotal.value = 0
  } finally {
    if (loadToken === guidelineLoadToken.value) {
      guidelinesLoading.value = false
    }
  }
}

async function loadGuideDetail() {
  detailLoading.value = true
  detailError.value = null
  selectedGuide.value = null
  clearScheduledRefresh()

  try {
    const guide = await catalogApi.getGuide(guideId.value)
    selectedGuide.value = guide
    resolvedRegion.value = guide.region || regionParam.value

    const firstPdf = guide.artifacts.find(artifact => isPdfArtifact(artifact))
    if (firstPdf) {
      selectedArtifactId.value = firstPdf.id
    }

    const canonicalPath = buildGuideDetailPath(resolvedRegion.value, guide.urn)
    if (canonicalPath !== route.path) {
      await navigateTo({ path: canonicalPath, query: route.query }, { replace: true })
      return
    }

    suppressWatcher = true
    hydrateStateFromRoute()
    await loadGuidelineContext()
    await loadGuidelines()
    await nextTick()
    suppressWatcher = false
  } catch (error) {
    console.error('[GuideDetail] Failed to load guide detail:', error)
    detailError.value = 'The selected guide could not be loaded.'
    selectedGuide.value = null
    resolvedRegion.value = regionParam.value
  } finally {
    detailLoading.value = false
  }
}

function resetGuidelineFilters() {
  queryText.value = ''
  selectedTopic.value = 'all'
  selectedAudience.value = 'all'
  syncToPdfPage.value = false
}

watch([
  queryText,
  selectedTopic,
  selectedAudience,
  guidelineSort
], () => {
  if (suppressWatcher) return

  if (guidelinePage.value !== 1) {
    suppressWatcher = true
    guidelinePage.value = 1

    void nextTick().then(() => {
      suppressWatcher = false
      scheduleRefresh()
    })
    return
  }

  scheduleRefresh()
})

watch(guidelinePage, (nextPage, previousPage) => {
  if (suppressWatcher || nextPage === previousPage) return

  syncRouteQuery()
  void loadGuidelines()
})

// When PDF page changes and sync is on, reload guidelines for that page
watch(currentPage, () => {
  if (!syncToPdfPage.value || !hasPageAssociations.value) return

  clearScheduledRefresh()
  refreshTimeout = setTimeout(() => {
    guidelinePage.value = 1
    void loadGuidelines()
  }, 300)
})

watch(syncToPdfPage, () => {
  guidelinePage.value = 1
  void loadGuidelines()
})

watch([
  () => route.params.countryOrRegion,
  () => route.params.guideId
], () => {
  void loadGuideDetail()
})

onMounted(async () => {
  await loadGuideDetail()
})

onBeforeUnmount(() => {
  clearScheduledRefresh()
})
</script>
