<template>
  <div>
    <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <UBreadcrumb
        :items="breadcrumbItems"
        class="mb-4"
      />

      <UPageHeader
        title="Dietary Guides"
        description="Search the guide catalog and open an individual guide workspace."
        :ui="{ root: 'relative py-8 border-b-0' }"
      />

      <UPageBody class="space-y-6">
        <UCard
          :ui="{ body: 'p-0', header: 'p-5 sm:p-6', footer: 'p-4 sm:px-6 sm:py-4' }"
          class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
        >
          <template #header>
            <div class="space-y-4">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                      Guide Library
                    </h2>
                    <UBadge
                      color="neutral"
                      variant="outline"
                    >
                      {{ resultCountLabel }}
                    </UBadge>
                  </div>
                </div>

                <div class="ml-auto flex flex-wrap gap-2">
                  <UButton
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-refresh-cw"
                    :loading="guidesLoading"
                    @click="refreshGuides"
                  >
                    Sync
                  </UButton>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    :disabled="guidesLoading || !hasActiveFilters"
                    @click="resetFilters"
                  >
                    Reset
                  </UButton>
                </div>
              </div>

              <div class="flex flex-col gap-2 xl:flex-row xl:items-center xl:gap-0">
                <div class="w-full xl:min-w-0 xl:flex-1">
                  <UInput
                    v-model="filters.q"
                    icon="i-lucide-search"
                    placeholder="Search title or authority"
                    @keydown.enter="applyFilters"
                  />
                </div>

                <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:ml-0 xl:flex xl:flex-none">
                  <USelectMenu
                    v-model="filters.region"
                    :items="regionFilterOptions"
                    value-key="value"
                    label-key="label"
                    leading-icon="i-lucide-globe"
                    class="w-full xl:w-36"
                  />
                  <USelectMenu
                    v-model="filters.status"
                    :items="guideStatusFilterOptions"
                    value-key="value"
                    label-key="label"
                    leading-icon="i-lucide-circle-dot"
                    class="w-full xl:w-36"
                  />
                  <USelectMenu
                    v-model="filters.review"
                    :items="guideReviewFilterOptions"
                    value-key="value"
                    label-key="label"
                    leading-icon="i-lucide-badge-check"
                    class="w-full xl:w-40"
                  />
                  <USelectMenu
                    v-model="filters.language"
                    :items="languageFilterOptions"
                    value-key="value"
                    label-key="label"
                    leading-icon="i-lucide-languages"
                    class="w-full xl:w-36"
                  />
                </div>
              </div>
            </div>
          </template>

          <UAlert
            v-if="guidesError"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :title="guidesError"
            class="mx-5 mt-5 sm:mx-6"
          />

          <UTable
            :data="guides"
            :columns="guideColumns"
            :meta="guideTableMeta"
            :loading="guidesLoading"
            sticky="header"
            :on-select="handleGuideRowSelect"
            class="min-h-[32rem]"
          >
            <template #title-cell="{ row }">
              <div class="min-w-[15rem] py-0.5">
                <p class="truncate font-medium text-gray-900 dark:text-white">
                  {{ row.original.title }}
                </p>
                <p class="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                  {{ compactGuideMeta(row.original) }}
                </p>
              </div>
            </template>

            <template #region-cell="{ row }">
              <span class="text-sm text-gray-700 dark:text-gray-200">
                {{ row.original.region || 'Global' }}
              </span>
            </template>

            <template #status-cell="{ row }">
              <UBadge
                :color="statusColor(row.original.status)"
                variant="soft"
              >
                {{ formatEnumLabel(row.original.status) }}
              </UBadge>
            </template>

            <template #review_status-cell="{ row }">
              <UBadge
                :color="reviewStatusColor(row.original.review_status)"
                variant="soft"
              >
                {{ formatEnumLabel(row.original.review_status) }}
              </UBadge>
            </template>

            <template #updated_at-cell="{ row }">
              <span class="text-sm text-gray-600 dark:text-gray-300">
                {{ formatDate(row.original.updated_at) }}
              </span>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex justify-end">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  trailing-icon="i-lucide-arrow-right"
                  @click.stop="openGuide(row.original)"
                >
                  Open
                </UButton>
              </div>
            </template>

            <template #empty>
              <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
                <UIcon
                  name="i-lucide-book-open"
                  class="h-8 w-8 text-gray-400"
                />
                <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                  No guides match the current search.
                </p>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Adjust the filters and run the search again.
                </p>
              </div>
            </template>
          </UTable>

          <template #footer>
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div class="flex flex-wrap items-center gap-3">
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  {{ paginationSummary }}
                </p>
              </div>

              <UPagination
                v-if="totalGuides > pageSize"
                v-model:page="page"
                :total="totalGuides"
                :items-per-page="pageSize"
                :sibling-count="1"
                show-edges
              />
            </div>
          </template>
        </UCard>
      </UPageBody>
    </UPage>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { CatalogFacetBucket, CatalogGuide } from '~/services/catalogApi'
import catalogApi from '~/services/catalogApi'
import {
  buildGuideRoutePath,
  formatDate,
  formatEnumLabel,
  guideReviewFilterOptions,
  guideStatusFilterOptions,
  reviewStatusColor,
  statusColor
} from '~/utils/consoleGuideCatalog'

definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Dietary Guides'
})

useSeoMeta({
  description: 'Wisefood guide library for browsing and opening individual guide workspaces'
})

const pageSize = 10
const guideFieldList = [
  'urn',
  'title',
  'issuing_authority',
  'publication_year',
  'region',
  'language',
  'status',
  'review_status',
  'updated_at'
]

const route = useRoute()
const router = useRouter()

const guides = ref<CatalogGuide[]>([])
const totalGuides = ref(0)
const guideFacets = ref<Record<string, CatalogFacetBucket[]>>({})
const guidesLoading = ref(false)
const guidesError = ref<string | null>(null)
const page = ref(1)
let suppressPageWatcher = false
let suppressFilterWatcher = false
let filterRefreshTimeout: ReturnType<typeof setTimeout> | null = null

const filters = reactive({
  q: '',
  region: 'all',
  status: 'all',
  review: 'all',
  language: 'all'
})

const breadcrumbItems = [
  {
    label: 'Console',
    icon: 'i-lucide-panel-top',
    to: '/console'
  },
  {
    label: 'Asset Manager',
    icon: 'i-lucide-folder-open',
    to: '/console/assets'
  },
  {
    label: 'Dietary Guides',
    icon: 'i-lucide-book-open-check'
  }
]

const guideColumns = [
  { accessorKey: 'title', header: 'Guide' },
  { accessorKey: 'region', header: 'Region' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'review_status', header: 'Review' },
  { accessorKey: 'updated_at', header: 'Updated' },
  { id: 'actions', header: '', enableSorting: false }
]

const guideTableMeta = computed(() => ({
  class: {
    tr: 'cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5'
  }
}))

const validStatusValues = new Set(guideStatusFilterOptions.map(option => option.value))
const validReviewValues = new Set(guideReviewFilterOptions.map(option => option.value))

const regionFacetBuckets = computed(() => {
  return guideFacets.value.region?.length
    ? guideFacets.value.region
    : deriveGuideFacetBuckets(guide => guide.region)
})

const languageFacetBuckets = computed(() => {
  return guideFacets.value.language?.length
    ? guideFacets.value.language
    : deriveGuideFacetBuckets(guide => guide.language)
})

const regionFilterOptions = computed(() => buildFacetFilterOptions('All regions', regionFacetBuckets.value, filters.region))
const languageFilterOptions = computed(() => buildFacetFilterOptions('All languages', languageFacetBuckets.value, filters.language))

const resultCountLabel = computed(() => {
  return totalGuides.value === 1 ? '1 guide' : `${totalGuides.value.toLocaleString()} guides`
})

const hasActiveFilters = computed(() => {
  return Boolean(
    filters.q.trim()
    || filters.region !== 'all'
    || filters.status !== 'all'
    || filters.review !== 'all'
    || filters.language !== 'all'
  )
})

const paginationSummary = computed(() => {
  if (!totalGuides.value) {
    return 'No guides available'
  }

  const start = ((page.value - 1) * pageSize) + 1
  const end = start + guides.value.length - 1
  return `Showing ${start}-${end} of ${totalGuides.value.toLocaleString()}`
})

function firstQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : ''
  }

  return typeof value === 'string' ? value : ''
}

function parsePageQuery(value: unknown) {
  const parsed = Number(firstQueryValue(value))
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function quoteFilterValue(value: string) {
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return /[\s:]/.test(escaped) ? `"${escaped}"` : escaped
}

function buildFacetFilterOptions(label: string, buckets: CatalogFacetBucket[] = [], selectedValue = 'all') {
  const items = buckets
    .slice()
    .sort((left, right) => left.value.localeCompare(right.value))
    .map(bucket => ({
      label: `${bucket.value} (${bucket.count})`,
      value: bucket.value
    }))

  if (selectedValue !== 'all' && selectedValue && !items.some(item => item.value === selectedValue)) {
    items.unshift({
      label: selectedValue,
      value: selectedValue
    })
  }

  return [
    { label, value: 'all' },
    ...items
  ]
}

function deriveGuideFacetBuckets(selector: (guide: CatalogGuide) => string | null | undefined) {
  const counts = new Map<string, number>()

  for (const guide of guides.value) {
    const value = selector(guide)
    if (!value) {
      continue
    }

    counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => left.value.localeCompare(right.value))
}

function compactGuideMeta(guide: CatalogGuide) {
  const parts = [
    guide.issuing_authority,
    guide.publication_year?.toString()
  ].filter(Boolean)

  return parts.length ? parts.join(' · ') : 'No supporting metadata'
}

function buildFilterQueries() {
  const queries: string[] = []

  if (filters.region !== 'all') {
    queries.push(`region:${quoteFilterValue(filters.region)}`)
  }

  if (filters.status !== 'all') {
    queries.push(`status:${quoteFilterValue(filters.status)}`)
  }

  if (filters.review !== 'all') {
    queries.push(`review_status:${quoteFilterValue(filters.review)}`)
  }

  if (filters.language !== 'all') {
    queries.push(`language:${quoteFilterValue(filters.language)}`)
  }

  return queries
}

function buildRouteQuery() {
  return {
    q: filters.q.trim() || undefined,
    region: filters.region !== 'all' ? filters.region : undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    review: filters.review !== 'all' ? filters.review : undefined,
    language: filters.language !== 'all' ? filters.language : undefined,
    page: page.value > 1 ? String(page.value) : undefined
  }
}

function syncRouteQuery() {
  void router.replace({
    query: buildRouteQuery()
  })
}

function setPageWithoutWatcher(nextPage: number) {
  suppressPageWatcher = true
  page.value = nextPage
}

function hydrateStateFromRoute() {
  filters.q = firstQueryValue(route.query.q)
  filters.region = firstQueryValue(route.query.region) || 'all'
  filters.status = validStatusValues.has(firstQueryValue(route.query.status)) ? firstQueryValue(route.query.status) : 'all'
  filters.review = validReviewValues.has(firstQueryValue(route.query.review)) ? firstQueryValue(route.query.review) : 'all'
  filters.language = firstQueryValue(route.query.language) || 'all'
  page.value = parsePageQuery(route.query.page)
}

async function loadGuides() {
  guidesLoading.value = true
  guidesError.value = null

  try {
    const activeQueries = buildFilterQueries()
    const searchQuery = filters.q.trim() || null

    const [tableResponse, facetsResponse] = await Promise.all([
      catalogApi.searchGuides({
        q: searchQuery,
        limit: pageSize,
        offset: (page.value - 1) * pageSize,
        fl: guideFieldList,
        fq: activeQueries.length ? activeQueries : null,
        sort: 'updated_at desc',
        fields: null
      }),
      catalogApi.searchGuides({
        q: searchQuery,
        limit: 1,
        offset: 0,
        fl: null,
        fq: null,
        sort: 'updated_at desc',
        fields: ['region', 'language'],
        facet_limit: 100
      })
    ])

    guides.value = tableResponse.guides
    totalGuides.value = tableResponse.total
    guideFacets.value = facetsResponse.facets

    const totalPages = Math.max(1, Math.ceil(totalGuides.value / pageSize))
    if (page.value > totalPages) {
      setPageWithoutWatcher(totalPages)
      syncRouteQuery()
      return await loadGuides()
    }
  } catch (error) {
    console.error('[ConsoleGuidesIndex] Failed to load guides:', error)
    guidesError.value = 'The guide library could not be loaded right now.'
    guides.value = []
    totalGuides.value = 0
  } finally {
    guidesLoading.value = false
  }
}

async function openGuide(guide: CatalogGuide) {
  await navigateTo({
    path: buildGuideRoutePath(guide.urn),
    query: route.query
  })
}

function handleGuideRowSelect(_event: Event, row: { original: CatalogGuide }) {
  void openGuide(row.original)
}

function clearScheduledFilterRefresh() {
  if (filterRefreshTimeout) {
    clearTimeout(filterRefreshTimeout)
    filterRefreshTimeout = null
  }
}

function scheduleFilterRefresh() {
  clearScheduledFilterRefresh()

  filterRefreshTimeout = setTimeout(() => {
    syncRouteQuery()
    void loadGuides()
  }, 250)
}

async function applyFilters() {
  if (page.value !== 1) {
    setPageWithoutWatcher(1)
  }

  clearScheduledFilterRefresh()
  syncRouteQuery()
  await loadGuides()
}

async function resetFilters() {
  suppressFilterWatcher = true
  filters.q = ''
  filters.region = 'all'
  filters.status = 'all'
  filters.review = 'all'
  filters.language = 'all'

  if (page.value !== 1) {
    setPageWithoutWatcher(1)
  }

  clearScheduledFilterRefresh()
  syncRouteQuery()
  await loadGuides()
  await nextTick()
  suppressFilterWatcher = false
}

async function refreshGuides() {
  clearScheduledFilterRefresh()
  syncRouteQuery()
  await loadGuides()
}

watch(page, (nextPage, previousPage) => {
  if (suppressPageWatcher) {
    suppressPageWatcher = false
    return
  }

  if (nextPage === previousPage) {
    return
  }

  syncRouteQuery()
  void loadGuides()
})

watch([
  () => filters.q,
  () => filters.region,
  () => filters.status,
  () => filters.review,
  () => filters.language
], () => {
  if (suppressFilterWatcher) {
    return
  }

  if (page.value !== 1) {
    setPageWithoutWatcher(1)
  }

  scheduleFilterRefresh()
})

onMounted(async () => {
  const legacyGuideQuery = firstQueryValue(route.query.guide)

  if (legacyGuideQuery) {
    const { guide, ...restQuery } = route.query
    await navigateTo({
      path: buildGuideRoutePath(legacyGuideQuery),
      query: restQuery
    }, {
      replace: true
    })
    return
  }

  suppressFilterWatcher = true
  hydrateStateFromRoute()
  await loadGuides()
  await nextTick()
  suppressFilterWatcher = false
})

onBeforeUnmount(() => {
  clearScheduledFilterRefresh()
})
</script>
