<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <FoodscholarMicroHeader
      :show-back="true"
      :back-to="buildGuidesCatalogPath()"
      back-label="Back to Guides"
      back-icon="i-lucide-arrow-left"
      brand-title="FoodScholar"
      brand-lead="Country and region explorers combine guide publications with searchable dietary rules."
      section-title="Country Explorer"
      :section-subtitle="regionTitle"
    />

    <UPage class="mx-auto max-w-7xl px-4 pt-3 pb-6 sm:px-6 lg:px-8">
      <UPageBody class="space-y-0">
        <UBreadcrumb
          :items="breadcrumbItems"
          class="mb-4"
        />

        <UAlert
          v-if="pageError"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="pageError"
          class="mt-4"
        >
          <template #description>
            <div class="space-y-3">
              <p>Choose one of the available regions below to continue browsing.</p>
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-for="region in availableRegionLinks"
                  :key="region.region"
                  :to="region.to"
                  color="neutral"
                  variant="outline"
                  size="sm"
                >
                  {{ region.label }}
                </UButton>
              </div>
            </div>
          </template>
        </UAlert>

        <div v-else class="space-y-6">
          <CatalogHeader
            v-model="queryText"
            badge="Country / Region Explorer"
            :title="regionTitle"
            description=""
            placeholder="Search this country’s guides or guideline rules"
            helper-text="Filters persist in the URL so this view stays shareable."
          >
            <UBadge color="neutral" variant="outline">
              {{ totalRegionGuides.toLocaleString() }} guides
            </UBadge>
            <UBadge v-if="totalRegionGuidelines === null || totalRegionGuidelines > 0" color="neutral" variant="outline">
              {{ totalRegionGuidelines === null ? 'Rules indexed live' : `${totalRegionGuidelines.toLocaleString()} rules` }}
            </UBadge>
            <UBadge v-if="artifactTotal > 0" color="neutral" variant="outline">
              {{ artifactTotal.toLocaleString() }} artifacts
            </UBadge>
          </CatalogHeader>

          <UTabs
            v-model="activeTab"
            :items="tabItems"
            variant="link"
            class="w-full"
            :ui="{ content: 'pt-6' }"
          >
            <template #overview>
              <div class="space-y-6">
                <UAlert
                  v-if="overviewError"
                  color="error"
                  variant="soft"
                  icon="i-lucide-alert-circle"
                  :title="overviewError"
                />

                <div v-else class="space-y-6">
                  <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <UCard
                      v-for="stat in regionStats"
                      :key="stat.label"
                      :ui="{ body: 'p-5' }"
                      class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <p class="text-xs font-medium uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                            {{ stat.label }}
                          </p>
                          <p class="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                            {{ stat.value }}
                          </p>
                          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {{ stat.hint }}
                          </p>
                        </div>

                        <div class="rounded-2xl bg-brand-50 p-3 text-brand-600 ring-1 ring-brand-200/70 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/20">
                          <UIcon :name="stat.icon" class="h-5 w-5" />
                        </div>
                      </div>
                    </UCard>
                  </section>

                  <section class="space-y-4">
                    <div class="flex items-center justify-between gap-3">
                      <div>
                        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                          Featured Guides
                        </h2>
                        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          Quick entry points into the most recent or best-described records for this country or region.
                        </p>
                      </div>
                    </div>

                    <div v-if="overviewLoading && !featuredGuides.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <UCard
                        v-for="index in 3"
                        :key="`featured-loading-${index}`"
                        :ui="{ body: 'p-6' }"
                        class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
                      >
                        <div class="space-y-4 animate-pulse">
                          <div class="h-4 w-24 rounded bg-gray-200 dark:bg-zinc-700" />
                          <div class="h-6 w-3/4 rounded bg-gray-200 dark:bg-zinc-700" />
                          <div class="h-4 w-full rounded bg-gray-200 dark:bg-zinc-700" />
                          <div class="h-4 w-5/6 rounded bg-gray-200 dark:bg-zinc-700" />
                        </div>
                      </UCard>
                    </div>

                    <div v-else-if="featuredGuides.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <GuideCard
                        v-for="guide in featuredGuides"
                        :key="guide.urn"
                        :guide="guide"
                        :guideline-count="guideGuidelineCounts[guide.urn] ?? null"
                        :to="getGuideCardTarget(guide)"
                      />
                    </div>
                  </section>
                </div>
              </div>
            </template>

            <template #guides>
              <div class="space-y-4">
                <UCard
                  :ui="{ body: 'p-4 sm:p-5' }"
                  class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
                >
                  <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                        Guide Library
                      </h2>
                      <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {{ guideResultSummary }}
                      </p>
                    </div>

                    <div class="w-full lg:w-64">
                      <USelectMenu
                        v-model="guideSort"
                        :items="guideSortOptions"
                        value-key="value"
                        label-key="label"
                        leading-icon="i-lucide-arrow-up-down"
                        class="w-full"
                      />
                    </div>
                  </div>
                </UCard>

                <UAlert
                  v-if="guidesError"
                  color="error"
                  variant="soft"
                  icon="i-lucide-alert-circle"
                  :title="guidesError"
                />

                <div v-else-if="guidesLoading && !guides.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <UCard
                    v-for="index in 6"
                    :key="`guide-loading-${index}`"
                    :ui="{ body: 'p-6' }"
                    class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
                  >
                    <div class="space-y-4 animate-pulse">
                      <div class="h-4 w-24 rounded bg-gray-200 dark:bg-zinc-700" />
                      <div class="h-6 w-3/4 rounded bg-gray-200 dark:bg-zinc-700" />
                      <div class="h-4 w-full rounded bg-gray-200 dark:bg-zinc-700" />
                      <div class="h-4 w-5/6 rounded bg-gray-200 dark:bg-zinc-700" />
                    </div>
                  </UCard>
                </div>

                <div v-else-if="!guides.length" class="rounded-2xl border border-dashed border-gray-300/80 bg-white/80 px-6 py-12 text-center dark:border-white/15 dark:bg-white/5">
                  <UIcon name="i-lucide-book-x" class="mx-auto h-8 w-8 text-gray-400" />
                  <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                    No guides match the current search.
                  </p>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Try clearing the text query or switching to the overview tab to explore available themes.
                  </p>
                </div>

                <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <GuideCard
                    v-for="guide in guides"
                    :key="guide.urn"
                    :guide="guide"
                    :guideline-count="guideGuidelineCounts[guide.urn] ?? null"
                    :to="getGuideCardTarget(guide)"
                  />
                </div>

                <div class="flex justify-end">
                  <UPagination
                    v-if="guideTotal > guidePageSize"
                    v-model:page="guidePage"
                    :total="guideTotal"
                    :items-per-page="guidePageSize"
                    :sibling-count="1"
                    show-edges
                  />
                </div>
              </div>
            </template>

            <template #guidelines>
              <div class="space-y-4">
                <GuidelineFilters
                  v-model:topic="selectedTopic"
                  v-model:audience="selectedAudience"
                  v-model:guide="selectedGuide"
                  v-model:year="selectedYear"
                  v-model:sort="guidelineSort"
                  :topic-options="topicOptions"
                  :audience-options="audienceOptions"
                  :guide-options="guideOptions"
                  :year-options="yearOptions"
                  :sort-options="guidelineSortOptions"
                  :show-guide-filter="true"
                  :show-query-input="false"
                  :show-year-filter="true"
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
                        Guideline Rules
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
                    :key="`guideline-loading-${index}`"
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
                    Adjust the topic, audience, year, or source-guide filters and try again.
                  </p>
                </div>

                <div v-else class="space-y-4">
                  <GuidelineCard
                    v-for="guideline in guidelines"
                    :key="guideline.id"
                    :guideline="guideline"
                    :guide-title="regionGuideLookup[guideline.guide_urn]?.title || guideline.guide_title"
                    :guide-to="buildGuideDetailPath(resolvedRegion, guideline.guide_urn)"
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
              </div>
            </template>
          </UTabs>
        </div>
      </UPageBody>
    </UPage>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CatalogFacetBucket, CatalogGuide, CatalogGuideline } from '~/services/catalogApi'
import CatalogHeader from '~/components/foodscholar/guides/CatalogHeader.vue'
import GuideCard from '~/components/foodscholar/guides/GuideCard.vue'
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
  getRegionPresentation,
  parsePositivePageQuery,
  quoteCatalogFilterValue,
  resolveRegionFromParam
} from '~/utils/guidesCatalog'

type CountryTab = 'overview' | 'guides' | 'guidelines'

definePageMeta({
  middleware: ['auth', 'profile']
})

const DEFAULT_GUIDE_SORT = 'publication_year desc'
const DEFAULT_GUIDELINE_SORT = 'updated_at desc'
const guidePageSize = 9
const guidelinePageSize = 10

const route = useRoute()
const router = useRouter()

const regionParam = computed(() => String(route.params.countryOrRegion || ''))

const availableRegions = ref<string[]>([])
const resolvedRegion = ref('')
const pageError = ref<string | null>(null)

const overviewLoading = ref(false)
const overviewError = ref<string | null>(null)
const guidesLoading = ref(false)
const guidesError = ref<string | null>(null)
const guidelinesLoading = ref(false)
const guidelinesError = ref<string | null>(null)

const regionGuidesAll = ref<CatalogGuide[]>([])
const guideTotal = ref(0)
const guides = ref<CatalogGuide[]>([])
const guidelineTotal = ref(0)
const guidelines = ref<CatalogGuideline[]>([])
const totalRegionGuides = ref(0)
const totalRegionGuidelines = ref<number | null>(null)
const artifactTotal = ref(0)
const guideGuidelineCounts = ref<Record<string, number>>({})
const guidelineOverviewFacets = ref<Record<string, CatalogFacetBucket[]>>({})

const activeTab = ref<CountryTab>('overview')
const queryText = ref('')
const selectedTopic = ref('all')
const selectedAudience = ref('all')
const selectedGuide = ref('all')
const selectedYear = ref('all')
const guideSort = ref(DEFAULT_GUIDE_SORT)
const guidelineSort = ref(DEFAULT_GUIDELINE_SORT)
const guidePage = ref(1)
const guidelinePage = ref(1)

const guideLoadToken = ref(0)
const guidelineLoadToken = ref(0)

let suppressWatcher = false
let refreshTimeout: ReturnType<typeof setTimeout> | null = null

const guideSortOptions = [
  { label: 'Newest publication', value: 'publication_year desc' },
  { label: 'Oldest publication', value: 'publication_year asc' },
  { label: 'Recently updated', value: 'updated_at desc' },
  { label: 'Title A-Z', value: 'title asc' }
]

const guidelineSortOptions = [
  { label: 'Recently updated', value: 'updated_at desc' },
  { label: 'Guide year, newest first', value: 'publication_year desc' },
  { label: 'Guide year, oldest first', value: 'publication_year asc' },
  { label: 'Rule sequence', value: 'sequence_no asc' }
]

const validTabValues = new Set<CountryTab>(['overview', 'guides', 'guidelines'])
const validGuideSortValues = new Set(guideSortOptions.map(option => option.value))
const validGuidelineSortValues = new Set(guidelineSortOptions.map(option => option.value))

const regionPresentation = computed(() => getRegionPresentation(resolvedRegion.value))
const regionTitle = computed(() => regionPresentation.value.label)

useHead({
  title: computed(() => `${regionTitle.value} Dietary Guides`)
})

useSeoMeta({
  description: computed(() => `Browse ${regionTitle.value} dietary guides and guideline rules in FoodScholar.`)
})

const breadcrumbItems = computed(() => [
  {
    label: 'FoodScholar',
    icon: 'i-lucide-library',
    to: '/foodscholar'
  },
  {
    label: 'Dietary Guides',
    icon: 'i-lucide-book-open',
    to: buildGuidesCatalogPath()
  },
  {
    label: regionTitle.value,
    icon: 'i-lucide-map-pinned'
  }
])

const availableRegionLinks = computed(() => {
  return availableRegions.value
    .map((region) => {
      const presentation = getRegionPresentation(region)
      return {
        region,
        label: presentation.label,
        to: buildGuidesRegionPath(region)
      }
    })
    .sort((left, right) => left.label.localeCompare(right.label))
})

const tabItems = [
  { label: 'Overview', value: 'overview', slot: 'overview' as const, icon: 'i-lucide-layout-grid' },
  { label: 'Guides', value: 'guides', slot: 'guides' as const, icon: 'i-lucide-book-open' },
  { label: 'Guidelines', value: 'guidelines', slot: 'guidelines' as const, icon: 'i-lucide-list-checks' }
]

const regionGuideLookup = computed<Record<string, CatalogGuide>>(() => {
  return Object.fromEntries(regionGuidesAll.value.map(guide => [guide.urn, guide]))
})

function getGuideCardTarget(guide: CatalogGuide) {
  return buildGuideDetailPath(resolvedRegion.value, guide.urn)
}

const featuredGuides = computed(() => {
  return regionGuidesAll.value
    .slice()
    .sort((left, right) => {
      return (right.publication_year || 0) - (left.publication_year || 0)
    })
    .slice(0, 3)
})


const regionStats = computed(() => {
  const latestYear = regionGuidesAll.value.reduce<number | null>((latest, guide) => {
    if (!guide.publication_year) {
      return latest
    }

    return latest === null ? guide.publication_year : Math.max(latest, guide.publication_year)
  }, null)

  return [
    {
      label: 'Guide records',
      value: totalRegionGuides.value.toLocaleString(),
      hint: 'Publications available in this explorer',
      icon: 'i-lucide-book-open'
    },
    {
      label: 'Guideline rules',
      value: totalRegionGuidelines.value === null ? 'Live search' : totalRegionGuidelines.value.toLocaleString(),
      hint: 'Rule-level dietary recommendations',
      icon: 'i-lucide-list-checks'
    },
    {
      label: 'Artifacts',
      value: artifactTotal.value.toLocaleString(),
      hint: 'PDF and other source files attached',
      icon: 'i-lucide-file-stack'
    },
    {
      label: 'Latest publication',
      value: latestYear ? String(latestYear) : 'Undated',
      hint: 'Newest guide publication year available',
      icon: 'i-lucide-calendar'
    }
  ]
})

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

const guideOptions = computed(() => {
  return [
    { label: 'All source guides', value: 'all' },
    ...regionGuidesAll.value
      .slice()
      .sort((left, right) => left.title.localeCompare(right.title))
      .map(guide => ({
        label: guide.title,
        value: guide.urn
      }))
  ]
})

const yearOptions = computed(() => {
  return buildFacetSelectOptions(
    'All years',
    guidelineOverviewFacets.value.publication_year || [],
    selectedYear.value
  )
})

const guideResultSummary = computed(() => {
  const query = queryText.value.trim()
  return query
    ? `${guideTotal.value.toLocaleString()} guide${guideTotal.value === 1 ? '' : 's'} matched “${query}”.`
    : `${guideTotal.value.toLocaleString()} guide${guideTotal.value === 1 ? '' : 's'} available in ${regionTitle.value}.`
})

const guidelineResultSummary = computed(() => {
  const parts = [
    `${guidelineTotal.value.toLocaleString()} rule${guidelineTotal.value === 1 ? '' : 's'}`
  ]

  if (queryText.value.trim()) {
    parts.push(`matching “${queryText.value.trim()}”`)
  }

  if (selectedGuide.value !== 'all') {
    const selectedGuideRecord = regionGuideLookup.value[selectedGuide.value]
    parts.push(`from ${selectedGuideRecord?.title || 'the selected guide'}`)
  }

  return `${parts.join(' ')}.`
})

function buildRouteQuery() {
  return {
    tab: activeTab.value !== 'overview' ? activeTab.value : undefined,
    q: queryText.value.trim() || undefined,
    topic: selectedTopic.value !== 'all' ? selectedTopic.value : undefined,
    audience: selectedAudience.value !== 'all' ? selectedAudience.value : undefined,
    guide: selectedGuide.value !== 'all' ? selectedGuide.value : undefined,
    year: selectedYear.value !== 'all' ? selectedYear.value : undefined,
    guideSort: guideSort.value !== DEFAULT_GUIDE_SORT ? guideSort.value : undefined,
    guidelineSort: guidelineSort.value !== DEFAULT_GUIDELINE_SORT ? guidelineSort.value : undefined,
    guidePage: guidePage.value > 1 ? String(guidePage.value) : undefined,
    guidelinePage: guidelinePage.value > 1 ? String(guidelinePage.value) : undefined
  }
}

function syncRouteQuery() {
  void router.replace({
    path: buildGuidesRegionPath(resolvedRegion.value || regionParam.value),
    query: buildRouteQuery()
  })
}

function buildRegionFilter() {
  return resolvedRegion.value ? `region:${quoteCatalogFilterValue(resolvedRegion.value)}` : null
}

function buildGuidelineRegionFilter() {
  return resolvedRegion.value ? `guide_region:${quoteCatalogFilterValue(resolvedRegion.value)}` : null
}

function buildGuidelineFilters() {
  const filters = [buildGuidelineRegionFilter()].filter((value): value is string => Boolean(value))

  if (selectedTopic.value !== 'all') {
    filters.push(`${topicFilterField.value}:${quoteCatalogFilterValue(selectedTopic.value)}`)
  }

  if (selectedAudience.value !== 'all') {
    filters.push(`${audienceFilterField.value}:${quoteCatalogFilterValue(selectedAudience.value)}`)
  }

  if (selectedGuide.value !== 'all') {
    filters.push(`guide_urn:${quoteCatalogFilterValue(selectedGuide.value)}`)
  }

  if (selectedYear.value !== 'all') {
    filters.push(`publication_year:${quoteCatalogFilterValue(selectedYear.value)}`)
  }

  return filters
}

function hydrateStateFromRoute() {
  const tab = firstQueryValue(route.query.tab)
  activeTab.value = validTabValues.has(tab as CountryTab) ? tab as CountryTab : 'overview'
  queryText.value = firstQueryValue(route.query.q)
  selectedTopic.value = firstQueryValue(route.query.topic) || 'all'
  selectedAudience.value = firstQueryValue(route.query.audience) || 'all'
  selectedGuide.value = firstQueryValue(route.query.guide) || 'all'
  selectedYear.value = firstQueryValue(route.query.year) || 'all'

  const nextGuideSort = firstQueryValue(route.query.guideSort)
  guideSort.value = validGuideSortValues.has(nextGuideSort) ? nextGuideSort : DEFAULT_GUIDE_SORT

  const nextGuidelineSort = firstQueryValue(route.query.guidelineSort)
  guidelineSort.value = validGuidelineSortValues.has(nextGuidelineSort) ? nextGuidelineSort : DEFAULT_GUIDELINE_SORT

  guidePage.value = parsePositivePageQuery(route.query.guidePage)
  guidelinePage.value = parsePositivePageQuery(route.query.guidelinePage)
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
    void Promise.all([
      loadGuides(),
      loadGuidelines()
    ])
  }, 250)
}

async function loadOverview() {
  const regionFilter = buildRegionFilter()
  if (!regionFilter) {
    return
  }

  overviewLoading.value = true
  overviewError.value = null

  try {
    const [guideResponse, guidelineResponse] = await Promise.all([
      catalogApi.searchGuides({
        limit: 250,
        offset: 0,
        fq: [regionFilter],
        sort: 'publication_year desc',
        facet_limit: 100
      }),
      catalogApi.searchGuidelines({
        limit: 1,
        offset: 0,
        fq: [buildGuidelineRegionFilter()].filter((v): v is string => Boolean(v)),
        fields: ['guide_urn', 'topic', 'food_groups', 'audience', 'target_populations', 'publication_year'],
        facet_limit: 100
      })
    ])

    regionGuidesAll.value = guideResponse.guides
    totalRegionGuides.value = guideResponse.total
    artifactTotal.value = guideResponse.guides.reduce((sum, guide) => sum + guide.artifacts.length, 0)
    totalRegionGuidelines.value = guidelineResponse.total
    guidelineOverviewFacets.value = guidelineResponse.facets
    guideGuidelineCounts.value = Object.fromEntries(
      (guidelineResponse.facets.guide_urn || []).map(bucket => [bucket.value, bucket.count])
    )

    if (selectedGuide.value !== 'all' && !regionGuidesAll.value.some(guide => guide.urn === selectedGuide.value)) {
      selectedGuide.value = 'all'
    }
  } catch (error) {
    console.error('[GuidesRegionExplorer] Failed to load overview:', error)
    overviewError.value = 'The region overview could not be loaded right now.'
    regionGuidesAll.value = []
    totalRegionGuides.value = 0
    totalRegionGuidelines.value = null
    artifactTotal.value = 0
    guidelineOverviewFacets.value = {}
    guideGuidelineCounts.value = {}
  } finally {
    overviewLoading.value = false
  }
}

async function loadGuides() {
  const regionFilter = buildRegionFilter()
  if (!regionFilter) {
    guides.value = []
    guideTotal.value = 0
    return
  }

  const loadToken = ++guideLoadToken.value
  guidesLoading.value = true
  guidesError.value = null

  try {
    const response = await catalogApi.searchGuides({
      q: queryText.value.trim() || '',
      limit: guidePageSize,
      offset: (guidePage.value - 1) * guidePageSize,
      fq: [regionFilter],
      sort: guideSort.value
    })

    if (loadToken !== guideLoadToken.value) {
      return
    }

    guideTotal.value = response.total

    const totalPages = Math.max(1, Math.ceil(response.total / guidePageSize))
    if (guidePage.value > totalPages) {
      guidePage.value = totalPages
      return
    }

    guides.value = response.guides
  } catch (error) {
    if (loadToken !== guideLoadToken.value) {
      return
    }

    console.error('[GuidesRegionExplorer] Failed to load guides:', error)
    guidesError.value = 'The guide list could not be loaded right now.'
    guides.value = []
    guideTotal.value = 0
  } finally {
    if (loadToken === guideLoadToken.value) {
      guidesLoading.value = false
    }
  }
}

async function loadGuidelines() {
  const regionFilter = buildRegionFilter()
  if (!regionFilter) {
    guidelines.value = []
    guidelineTotal.value = 0
    return
  }

  const loadToken = ++guidelineLoadToken.value
  guidelinesLoading.value = true
  guidelinesError.value = null

  try {
    const response = await catalogApi.searchGuidelines({
      q: queryText.value.trim() || '',
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

    console.error('[GuidesRegionExplorer] Failed to load guidelines:', error)
    guidelinesError.value = 'The guideline rule search could not be loaded right now.'
    guidelines.value = []
    guidelineTotal.value = 0
  } finally {
    if (loadToken === guidelineLoadToken.value) {
      guidelinesLoading.value = false
    }
  }
}

async function bootstrapRegion() {
  pageError.value = null
  clearScheduledRefresh()

  try {
    const regionResponse = await catalogApi.searchGuides({
      limit: 250,
      offset: 0,
      fields: ['region'],
      facet_limit: 100,
      sort: 'publication_year desc'
    })

    availableRegions.value = (regionResponse.facets.region || []).length
      ? (regionResponse.facets.region || []).map(bucket => bucket.value)
      : [...new Set(regionResponse.guides.map(guide => guide.region).filter((region): region is string => Boolean(region)))]

    const resolved = resolveRegionFromParam(regionParam.value, availableRegions.value)
    if (!resolved) {
      pageError.value = 'The selected country or region was not found in the guides catalog.'
      resolvedRegion.value = ''
      regionGuidesAll.value = []
      guides.value = []
      guidelines.value = []
      return
    }

    resolvedRegion.value = resolved

    const canonicalPath = buildGuidesRegionPath(resolved)
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
    await Promise.all([
      loadOverview(),
      loadGuides(),
      loadGuidelines()
    ])
    await nextTick()
    suppressWatcher = false
  } catch (error) {
    console.error('[GuidesRegionExplorer] Failed to bootstrap region explorer:', error)
    pageError.value = 'The country explorer could not be initialized right now.'
    resolvedRegion.value = ''
    regionGuidesAll.value = []
    guides.value = []
    guidelines.value = []
  }
}

function resetGuidelineFilters() {
  selectedTopic.value = 'all'
  selectedAudience.value = 'all'
  selectedGuide.value = 'all'
  selectedYear.value = 'all'
  guidelineSort.value = DEFAULT_GUIDELINE_SORT
}


watch(activeTab, () => {
  if (suppressWatcher) {
    return
  }

  syncRouteQuery()
})

watch([
  queryText,
  selectedTopic,
  selectedAudience,
  selectedGuide,
  selectedYear,
  guideSort,
  guidelineSort
], () => {
  if (suppressWatcher) {
    return
  }

  if (guidePage.value !== 1 || guidelinePage.value !== 1) {
    suppressWatcher = true
    guidePage.value = 1
    guidelinePage.value = 1

    void nextTick().then(() => {
      suppressWatcher = false
      scheduleRefresh()
    })
    return
  }

  scheduleRefresh()
})

watch(guidePage, (nextPage, previousPage) => {
  if (suppressWatcher || nextPage === previousPage) {
    return
  }

  syncRouteQuery()
  void Promise.all([
    loadGuides(),
    loadGuidelines()
  ])
})

watch(guidelinePage, (nextPage, previousPage) => {
  if (suppressWatcher || nextPage === previousPage) {
    return
  }

  syncRouteQuery()
  void Promise.all([
    loadGuides(),
    loadGuidelines()
  ])
})

watch(() => route.params.countryOrRegion, () => {
  void bootstrapRegion()
})

onMounted(async () => {
  await bootstrapRegion()
})

onBeforeUnmount(() => {
  clearScheduledRefresh()
})
</script>
