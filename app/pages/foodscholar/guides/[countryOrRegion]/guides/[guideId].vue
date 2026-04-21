<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <FoodscholarMicroHeader
      :show-back="true"
      :back-to="resolvedRegion ? buildGuidesRegionPath(resolvedRegion) : buildGuidesCatalogPath()"
      back-label="Back to Country Explorer"
      back-icon="i-lucide-arrow-left"
      brand-title="FoodScholar"
      brand-lead="Guide detail pages connect the publication record, attached artifacts, and searchable rule-level guidance."
      section-title="Guide Detail"
      :section-subtitle="guideTitle"
    />

    <UPage class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <UPageBody class="space-y-6">
        <UBreadcrumb
          :items="breadcrumbItems"
          class="mb-2"
        />

        <div v-if="detailLoading && !selectedGuide" class="rounded-2xl border border-gray-200/70 bg-white/95 px-6 py-16 text-center shadow-sm dark:border-white/10 dark:bg-zinc-900/80">
          <div class="mx-auto h-12 w-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p class="mt-4 text-sm text-gray-600 dark:text-gray-300">
            Loading guide detail…
          </p>
        </div>

        <UAlert
          v-else-if="detailError && !selectedGuide"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="detailError"
        />

        <template v-else-if="selectedGuide">
          <UCard
            :ui="{ body: 'p-6 sm:p-8' }"
            class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
          >
            <div class="space-y-5">
              <div class="flex flex-wrap gap-2">
                <UBadge color="primary" variant="soft">
                  {{ regionTitle }}
                </UBadge>
                <UBadge v-if="selectedGuide.document_type" color="neutral" variant="outline">
                  {{ selectedGuide.document_type }}
                </UBadge>
                <UBadge v-if="selectedGuide.language" color="neutral" variant="outline">
                  {{ selectedGuide.language.toUpperCase() }}
                </UBadge>
                <UBadge color="neutral" variant="outline">
                  {{ totalGuideGuidelines.toLocaleString() }} rules
                </UBadge>
              </div>

              <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div class="min-w-0 flex-1">
                  <h1 class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                    {{ selectedGuide.title }}
                  </h1>
                  <p v-if="selectedGuide.description" class="mt-3 max-w-4xl text-sm leading-6 text-gray-600 dark:text-gray-300 sm:text-base">
                    {{ selectedGuide.description }}
                  </p>

                  <div class="mt-5 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <span v-if="guidePublisher" class="inline-flex items-center gap-1.5">
                      <UIcon name="i-lucide-building-2" class="h-4 w-4 text-brand-500" />
                      {{ guidePublisher }}
                    </span>
                    <span v-if="guidePublicationLabel" class="inline-flex items-center gap-1.5">
                      <UIcon name="i-lucide-calendar" class="h-4 w-4 text-brand-500" />
                      {{ guidePublicationLabel }}
                    </span>
                    <span v-if="guideAudience" class="inline-flex items-center gap-1.5">
                      <UIcon name="i-lucide-users" class="h-4 w-4 text-brand-500" />
                      {{ guideAudience }}
                    </span>
                  </div>
                </div>

                <div class="flex shrink-0 flex-wrap gap-2">
                  <UButton
                    v-if="selectedGuide.url"
                    :to="selectedGuide.url"
                    target="_blank"
                    color="neutral"
                    variant="outline"
                    icon="i-lucide-external-link"
                  >
                    Source publication
                  </UButton>
                </div>
              </div>
            </div>
          </UCard>

          <div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <GuideMetadataPanel
              :guide="selectedGuide"
              :guideline-count="totalGuideGuidelines"
            />

            <GuideArtifactList :artifacts="selectedGuide.artifacts" />
          </div>

          <section class="space-y-4">
            <GuidelineFilters
              v-model:query="queryText"
              v-model:topic="selectedTopic"
              v-model:audience="selectedAudience"
              v-model:page-ref="selectedPageRef"
              v-model:sort="guidelineSort"
              v-model:view="viewMode"
              :topic-options="topicOptions"
              :audience-options="audienceOptions"
              :page-options="pageOptions"
              :sort-options="guidelineSortOptions"
              :view-options="guidelineViewOptions"
              :show-view-toggle="hasPageAssociations"
              :show-page-filter="pageOptions.length > 1"
              :disabled="guidelinesLoading && !guidelines.length"
              @reset="resetGuidelineFilters"
            />

            <UCard
              :ui="{ body: 'p-4 sm:p-5' }"
              class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
            >
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Guide Guidelines
                  </h2>
                  <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {{ guidelineResultSummary }}
                  </p>
                </div>
              </div>
            </UCard>

            <UAlert
              v-if="guidelinesError"
              color="error"
              variant="soft"
              icon="i-lucide-alert-circle"
              :title="guidelinesError"
            />

            <div v-else-if="guidelinesLoading && !guidelines.length" class="space-y-4">
              <UCard
                v-for="index in 4"
                :key="`detail-guideline-loading-${index}`"
                :ui="{ body: 'p-5' }"
                class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
              >
                <div class="space-y-4 animate-pulse">
                  <div class="h-4 w-24 rounded bg-gray-200 dark:bg-zinc-700" />
                  <div class="h-4 w-full rounded bg-gray-200 dark:bg-zinc-700" />
                  <div class="h-4 w-5/6 rounded bg-gray-200 dark:bg-zinc-700" />
                </div>
              </UCard>
            </div>

            <div v-else-if="!guidelines.length" class="rounded-2xl border border-dashed border-gray-300/80 bg-white/80 px-6 py-12 text-center dark:border-white/15 dark:bg-white/5">
              <UIcon name="i-lucide-list-x" class="mx-auto h-8 w-8 text-gray-400" />
              <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                No guideline rules match the current filters.
              </p>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try clearing the query, topic, audience, or page filters.
              </p>
            </div>

            <div v-else-if="viewMode === 'page' && groupedGuidelines.length" class="space-y-4">
              <UCard
                v-for="group in groupedGuidelines"
                :key="group.key"
                :ui="{ body: 'p-5' }"
                class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
              >
                <div class="space-y-4">
                  <div class="flex items-center justify-between gap-3 border-b border-gray-200/70 pb-4 dark:border-white/10">
                    <div>
                      <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                        {{ group.label }}
                      </h3>
                      <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {{ group.guidelines.length }} rule{{ group.guidelines.length === 1 ? '' : 's' }}
                      </p>
                    </div>
                  </div>

                  <div class="space-y-4">
                    <GuidelineCard
                      v-for="guideline in group.guidelines"
                      :key="guideline.id"
                      :guideline="guideline"
                      :show-guide-link="false"
                    />
                  </div>
                </div>
              </UCard>
            </div>

            <div v-else class="space-y-4">
              <GuidelineCard
                v-for="guideline in guidelines"
                :key="guideline.id"
                :guideline="guideline"
                :show-guide-link="false"
              />
            </div>

            <div class="flex justify-end">
              <UPagination
                v-if="guidelineTotal > guidelinePageSize"
                v-model:page="guidelinePage"
                :total="guidelineTotal"
                :items-per-page="guidelinePageSize"
                :sibling-count="1"
                show-edges
              />
            </div>
          </section>
        </template>
      </UPageBody>
    </UPage>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CatalogFacetBucket, CatalogGuide, CatalogGuideline } from '~/services/catalogApi'
import GuideArtifactList from '~/components/foodscholar/guides/GuideArtifactList.vue'
import GuideMetadataPanel from '~/components/foodscholar/guides/GuideMetadataPanel.vue'
import GuidelineCard from '~/components/foodscholar/guides/GuidelineCard.vue'
import GuidelineFilters from '~/components/foodscholar/guides/GuidelineFilters.vue'
import catalogApi from '~/services/catalogApi'
import {
  buildFacetSelectOptions,
  buildGuideDetailPath,
  buildGuidesCatalogPath,
  buildGuidesRegionPath,
  firstQueryValue,
  formatEnumLabel,
  getGuideAudience,
  getGuidePublicationLabel,
  getGuidePublisher,
  getGuidelinePageReferences,
  getRegionPresentation,
  groupGuidelinesByPage,
  hasGuidePageAssociations,
  parsePositivePageQuery,
  quoteCatalogFilterValue
} from '~/utils/guidesCatalog'

definePageMeta({
  middleware: ['auth', 'profile']
})

const DEFAULT_GUIDELINE_SORT = 'sequence_no asc'
const guidelinePageSize = 12

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
const viewMode = ref<'list' | 'page'>('list')
const guidelinePage = ref(1)

const guidelines = ref<CatalogGuideline[]>([])
const guidelineTotal = ref(0)

const guidelineLoadToken = ref(0)

let suppressWatcher = false
let refreshTimeout: ReturnType<typeof setTimeout> | null = null

const guidelineSortOptions = [
  { label: 'Rule sequence', value: 'sequence_no asc' },
  { label: 'Page order', value: 'page_no asc' },
  { label: 'Recently updated', value: 'updated_at desc' }
]

const guidelineViewOptions = [
  { label: 'Flat list', value: 'list' },
  { label: 'Grouped by page', value: 'page' }
]

const validGuidelineSortValues = new Set(guidelineSortOptions.map(option => option.value))

useHead({
  title: computed(() => `${guideTitle.value} | Dietary Guide`)
})

useSeoMeta({
  description: computed(() => `Browse guide metadata, artifacts, and rule-level guidelines for ${guideTitle.value}.`)
})

const guideTitle = computed(() => selectedGuide.value?.title || 'Guide detail')
const regionTitle = computed(() => getRegionPresentation(resolvedRegion.value || regionParam.value).label)
const guidePublisher = computed(() => selectedGuide.value ? getGuidePublisher(selectedGuide.value) : null)
const guidePublicationLabel = computed(() => selectedGuide.value ? getGuidePublicationLabel(selectedGuide.value) : null)
const guideAudience = computed(() => selectedGuide.value ? getGuideAudience(selectedGuide.value) : null)

const breadcrumbItems = computed(() => [
  {
    label: 'FoodScholar',
    icon: 'i-lucide-library',
    to: '/foodscholar'
  },
  {
    label: 'Guides Atlas',
    icon: 'i-lucide-book-open',
    to: buildGuidesCatalogPath()
  },
  {
    label: regionTitle.value,
    icon: 'i-lucide-map-pinned',
    to: resolvedRegion.value ? buildGuidesRegionPath(resolvedRegion.value) : buildGuidesCatalogPath()
  },
  {
    label: guideTitle.value,
    icon: 'i-lucide-file-text'
  }
])

const hasPageAssociations = computed(() => hasGuidePageAssociations(allGuideGuidelines.value))
const groupedGuidelines = computed(() => groupGuidelinesByPage(guidelines.value))

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

const pageOptions = computed(() => {
  const counts = new Map<string, number>()

  for (const guideline of allGuideGuidelines.value) {
    for (const pageNumber of getGuidelinePageReferences(guideline)) {
      const key = String(pageNumber)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  return [
    { label: 'All pages', value: 'all' },
    ...[...counts.entries()]
      .sort((left, right) => Number(left[0]) - Number(right[0]))
      .map(([page, count]) => ({
        label: `Page ${page} (${count})`,
        value: page
      }))
  ]
})

const guidelineResultSummary = computed(() => {
  const query = queryText.value.trim()
  const base = `${guidelineTotal.value.toLocaleString()} rule${guidelineTotal.value === 1 ? '' : 's'}`

  if (!query) {
    return `${base} available for this guide.`
  }

  return `${base} matching “${query}”.`
})

function buildRouteQuery() {
  return {
    q: queryText.value.trim() || undefined,
    topic: selectedTopic.value !== 'all' ? selectedTopic.value : undefined,
    audience: selectedAudience.value !== 'all' ? selectedAudience.value : undefined,
    pageRef: selectedPageRef.value !== 'all' ? selectedPageRef.value : undefined,
    sort: guidelineSort.value !== DEFAULT_GUIDELINE_SORT ? guidelineSort.value : undefined,
    view: viewMode.value !== 'list' ? viewMode.value : undefined,
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

function buildGuidelineFilters() {
  const filters: string[] = []

  if (selectedTopic.value !== 'all') {
    filters.push(`${topicFilterField.value}:${quoteCatalogFilterValue(selectedTopic.value)}`)
  }

  if (selectedAudience.value !== 'all') {
    filters.push(`${audienceFilterField.value}:${quoteCatalogFilterValue(selectedAudience.value)}`)
  }

  if (selectedPageRef.value !== 'all') {
    filters.push(`page_no:${quoteCatalogFilterValue(selectedPageRef.value)}`)
  }

  return filters
}

function hydrateStateFromRoute() {
  queryText.value = firstQueryValue(route.query.q)
  selectedTopic.value = firstQueryValue(route.query.topic) || 'all'
  selectedAudience.value = firstQueryValue(route.query.audience) || 'all'
  selectedPageRef.value = firstQueryValue(route.query.pageRef) || 'all'

  const nextSort = firstQueryValue(route.query.sort)
  guidelineSort.value = validGuidelineSortValues.has(nextSort) ? nextSort : DEFAULT_GUIDELINE_SORT

  const nextView = firstQueryValue(route.query.view)
  viewMode.value = nextView === 'page' ? 'page' : 'list'
  guidelinePage.value = parsePositivePageQuery(route.query.page)
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
  if (!selectedGuide.value) {
    return
  }

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
    guidelinesError.value = 'The guide-specific guideline index could not be loaded right now.'
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

    if (loadToken !== guidelineLoadToken.value) {
      return
    }

    guidelineTotal.value = response.total

    const totalPages = Math.max(1, Math.ceil(response.total / guidelinePageSize))
    if (guidelinePage.value > totalPages) {
      guidelinePage.value = totalPages
      return
    }

    guidelines.value = response.guidelines
  } catch (error) {
    if (loadToken !== guidelineLoadToken.value) {
      return
    }

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

    const canonicalPath = buildGuideDetailPath(resolvedRegion.value, guide.urn)
    if (canonicalPath !== route.path) {
      await navigateTo({
        path: canonicalPath,
        query: route.query
      }, {
        replace: true
      })
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
  selectedPageRef.value = 'all'
  guidelineSort.value = DEFAULT_GUIDELINE_SORT
  viewMode.value = 'list'
}

watch(viewMode, () => {
  if (suppressWatcher) {
    return
  }

  syncRouteQuery()
})

watch([
  queryText,
  selectedTopic,
  selectedAudience,
  selectedPageRef,
  guidelineSort
], () => {
  if (suppressWatcher) {
    return
  }

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
  if (suppressWatcher || nextPage === previousPage) {
    return
  }

  syncRouteQuery()
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
