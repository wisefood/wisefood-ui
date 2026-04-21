<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <FoodscholarMicroHeader
      :show-back="true"
      back-to="/foodscholar"
      back-label="Back to FoodScholar"
      back-icon="i-lucide-arrow-left"
      brand-title="FoodScholar"
      brand-lead="Explore dietary knowledge as a browsable atlas of countries, source guides, and rule-level recommendations."
      section-title="Guides Atlas"
      section-subtitle="European dietary guide catalog"
    />

    <UPage class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <UPageBody class="space-y-8">
        <CatalogHeader
          v-model="searchQuery"
          badge="Dietary Guides Catalog"
          title="Browse European dietary guides like a knowledge atlas"
          description="Search across guide publications and structured guideline rules, then move into country explorers for source documents, metadata, and rule-level browsing."
          placeholder="Ask for a country, theme, audience, or dietary rule"
          helper-text="This MVP uses the catalog search endpoints and keeps routes shareable."
          :submitting="searchLoading"
          @submit="performSearch"
        >
          <UBadge color="neutral" variant="outline">
            {{ regionSummaries.length }} regions
          </UBadge>
          <UBadge color="neutral" variant="outline">
            {{ totalGuideCount.toLocaleString() }} guides
          </UBadge>
          <UBadge v-if="hasGuidelineCounts" color="neutral" variant="outline">
            {{ totalGuidelineCount.toLocaleString() }} rules
          </UBadge>
        </CatalogHeader>

        <UAlert
          v-if="summaryError && !landingLoading"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="summaryError"
        />

        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <UCard
            v-for="stat in overviewStats"
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

        <section v-if="searchQuery.trim()" class="space-y-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Search Results
              </h2>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Results for <span class="font-medium text-gray-900 dark:text-white">“{{ searchQuery.trim() }}”</span>
              </p>
            </div>

            <UButton
              color="neutral"
              variant="ghost"
              :disabled="searchLoading"
              @click="clearSearch"
            >
              Clear
            </UButton>
          </div>

          <UAlert
            v-if="searchError"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :title="searchError"
          />

          <div v-else-if="searchLoading" class="grid gap-4 lg:grid-cols-2">
            <UCard
              v-for="index in 2"
              :key="`search-loading-${index}`"
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

          <div v-else-if="!guideSearchResults.length && !guidelineSearchResults.length" class="rounded-2xl border border-dashed border-gray-300/80 bg-white/80 px-6 py-12 text-center dark:border-white/15 dark:bg-white/5">
            <UIcon name="i-lucide-search-x" class="mx-auto h-8 w-8 text-gray-400" />
            <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
              No guides or guideline rules matched that search.
            </p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try a country name, topic, audience, or a phrase from the rule text.
            </p>
          </div>

          <div v-else class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <UCard
              :ui="{ body: 'p-5 sm:p-6' }"
              class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Matching guides
                  </h3>
                  <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {{ guideSearchTotal.toLocaleString() }} guide{{ guideSearchTotal === 1 ? '' : 's' }} found
                  </p>
                </div>
              </div>

              <div class="mt-5 grid gap-4 lg:grid-cols-2">
                <GuideCard
                  v-for="guide in guideSearchResults"
                  :key="guide.urn"
                  :guide="guide"
                  :to="buildGuideDetailPath(guide.region, guide.urn)"
                  :show-region="true"
                  compact
                />
              </div>
            </UCard>

            <UCard
              :ui="{ body: 'p-5 sm:p-6' }"
              class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Matching guideline rules
                  </h3>
                  <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {{ guidelineSearchTotal.toLocaleString() }} rule{{ guidelineSearchTotal === 1 ? '' : 's' }} found
                  </p>
                </div>
              </div>

              <div class="mt-5 space-y-4">
                <GuidelineCard
                  v-for="guideline in guidelineSearchResults"
                  :key="guideline.id"
                  :guideline="guideline"
                  :guide-title="guideLookup[guideline.guide_urn]?.title || guideline.guide_title"
                  :guide-to="resolveGuidelineGuideTo(guideline)"
                  compact
                />
              </div>
            </UCard>
          </div>
        </section>

        <section class="space-y-4">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Browse By Country / Region
              </h2>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Enter through a national or regional explorer to browse source guides and rule-level recommendations together.
              </p>
            </div>
          </div>

          <div v-if="landingLoading" class="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_21rem]">
            <div class="min-h-[30rem] animate-pulse rounded-[2.25rem] border border-gray-200/70 bg-white/90 dark:border-white/10 dark:bg-zinc-900/80" />
            <div class="min-h-[30rem] animate-pulse rounded-[2rem] border border-gray-200/70 bg-white/90 dark:border-white/10 dark:bg-zinc-900/80" />
          </div>

          <div v-else-if="euRegionSummaries.length" class="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_21rem]">
            <section class="overflow-hidden rounded-[2.25rem] border border-gray-200/70 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/80 sm:p-5">
              <EuropeGuidesMap
                v-model:selected-region-code="selectedMapRegionCode"
                :regions="euRegionSummaries"
              />

              <div class="mt-4 flex flex-col gap-3 border-t border-gray-200/80 pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ selectedMapRegion ? `${selectedMapRegion.flag || ''} ${selectedMapRegion.label}`.trim() : 'European atlas overview' }}
                  </p>
                  <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Click a country to zoom in smoothly, then open its explorer for guides, artifacts, and rule-level detail.
                  </p>
                </div>

                <NuxtLink
                  v-if="selectedMapRegion"
                  :to="buildGuidesRegionPath(selectedMapRegion.region)"
                  class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200 dark:hover:bg-brand-500/15"
                >
                  <span>Open country explorer</span>
                  <UIcon name="i-lucide-arrow-right" class="h-4 w-4" />
                </NuxtLink>
              </div>
            </section>

            <aside class="rounded-[2rem] border border-gray-200/70 bg-white/95 p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900/80 sm:p-6">
              <div v-if="selectedMapRegion">
                <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                  Selected Country
                </p>
                <h3 class="mt-3 text-2xl font-serif font-semibold text-gray-900 dark:text-white">
                  {{ `${selectedMapRegion.flag || ''} ${selectedMapRegion.label}`.trim() }}
                </h3>
                <p class="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {{ selectedMapRegion.guideCount.toLocaleString() }} guide{{ selectedMapRegion.guideCount === 1 ? '' : 's' }}
                  <span v-if="selectedMapRegion.guidelineCount !== null"> · {{ selectedMapRegion.guidelineCount.toLocaleString() }} rule{{ selectedMapRegion.guidelineCount === 1 ? '' : 's' }}</span>
                  <span v-if="selectedMapRegion.latestPublicationYear"> · Latest {{ selectedMapRegion.latestPublicationYear }}</span>
                </p>

                <div v-if="selectedMapRegion.topics.length" class="mt-4 flex flex-wrap gap-2">
                  <span
                    v-for="topic in selectedMapRegion.topics"
                    :key="`${selectedMapRegion.region}-${topic}`"
                    class="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-200"
                  >
                    {{ topic }}
                  </span>
                </div>
              </div>

              <div v-else>
                <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                  Browse The Atlas
                </p>
                <h3 class="mt-3 text-2xl font-serif font-semibold text-gray-900 dark:text-white">
                  Choose a country
                </h3>
                <p class="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  Select a country on the map or from the list to inspect guide coverage, recent publication years, and topic tags before opening the explorer.
                </p>
                <p v-if="defaultMapRegion" class="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Highest current coverage: {{ `${defaultMapRegion.flag || ''} ${defaultMapRegion.label}`.trim() }}
                </p>
              </div>

              <div class="mt-8 border-t border-gray-200/80 pt-5 dark:border-white/10">
                <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                  Countries
                </p>
                <div class="mt-3 max-h-[22rem] space-y-1 overflow-auto pr-1">
                  <button
                    v-for="region in euRegionBrowseList"
                    :key="region.region"
                    type="button"
                    :class="[
                      'flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors',
                      selectedMapRegion?.region === region.region
                        ? 'bg-brand-50 text-brand-900 dark:bg-brand-500/10 dark:text-white'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5'
                    ]"
                    @click="selectedMapRegionCode = getRegionPresentation(region.region).value.toUpperCase()"
                  >
                    <span class="truncate text-sm font-medium">
                      {{ `${region.flag || ''} ${region.label}`.trim() }}
                    </span>
                    <span class="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                      {{ region.guideCount }}
                    </span>
                  </button>
                </div>
              </div>
            </aside>
          </div>

          <div v-else class="rounded-2xl border border-dashed border-gray-300/80 bg-white/80 px-6 py-12 text-center dark:border-white/15 dark:bg-white/5">
            <UIcon name="i-lucide-map" class="mx-auto h-8 w-8 text-gray-400" />
            <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
              No EU country records are available yet.
            </p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Once European guide metadata is available, the interactive atlas will appear here automatically.
            </p>
          </div>
        </section>

        <section v-if="themeBuckets.length" class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <UCard
            :ui="{ body: 'p-5 sm:p-6' }"
            class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
          >
            <div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Quick-Access Themes
              </h2>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Jump into common diet-guide themes using existing guide metadata.
              </p>
            </div>

            <div class="mt-5 flex flex-wrap gap-2">
              <button
                v-for="theme in themeBuckets"
                :key="theme.value"
                type="button"
                class="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition-colors hover:border-brand-300 hover:text-brand-700 dark:border-white/10 dark:bg-zinc-900 dark:text-gray-200 dark:hover:border-brand-500/40 dark:hover:text-brand-200"
                @click="applyTheme(theme.value)"
              >
                <span>{{ theme.value }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ theme.count }}</span>
              </button>
            </div>
          </UCard>

          <UCard
            :ui="{ body: 'p-5 sm:p-6' }"
            class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                  Featured Guides
                </h2>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Quick entry points into well-described or recently published guide records.
                </p>
              </div>
            </div>

            <div class="mt-5 grid gap-4 md:grid-cols-2">
              <GuideCard
                v-for="guide in featuredGuides"
                :key="guide.urn"
                :guide="guide"
                :to="buildGuideDetailPath(guide.region, guide.urn)"
                :show-region="true"
                compact
              />
            </div>
          </UCard>
        </section>
      </UPageBody>
    </UPage>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { CatalogGuide, CatalogGuideline } from '~/services/catalogApi'
import CatalogHeader from '~/components/foodscholar/guides/CatalogHeader.vue'
import EuropeGuidesMap from '~/components/foodscholar/guides/EuropeGuidesMap.vue'
import GuideCard from '~/components/foodscholar/guides/GuideCard.vue'
import GuidelineCard from '~/components/foodscholar/guides/GuidelineCard.vue'
import catalogApi from '~/services/catalogApi'
import {
  buildGuideDetailPath,
  buildGuidesCatalogPath,
  buildGuidesRegionPath,
  buildRegionSummaries,
  collectThemeBucketsFromGuides,
  firstQueryValue,
  getRegionPresentation
} from '~/utils/guidesCatalog'
import { euCountryCodes } from '~/utils/countries'

definePageMeta({
  middleware: ['auth', 'profile']
})

useHead({
  title: 'Dietary Guides Atlas'
})

useSeoMeta({
  description: 'Browse European dietary guides by country, source publication, and guideline rule.'
})

const route = useRoute()
const router = useRouter()
const EU_COUNTRY_CODE_SET = new Set<string>(euCountryCodes)

const searchQuery = ref('')
const selectedMapRegionCode = ref<string | null>(null)

const landingLoading = ref(true)
const summaryError = ref<string | null>(null)
const searchLoading = ref(false)
const searchError = ref<string | null>(null)

const regionSummaries = ref<ReturnType<typeof buildRegionSummaries>>([])
const themeBuckets = ref<ReturnType<typeof collectThemeBucketsFromGuides>>([])
const featuredGuides = ref<CatalogGuide[]>([])

const guideSearchResults = ref<CatalogGuide[]>([])
const guideSearchTotal = ref(0)
const guidelineSearchResults = ref<CatalogGuideline[]>([])
const guidelineSearchTotal = ref(0)
const guideLookup = ref<Record<string, CatalogGuide>>({})

const euRegionSummaries = computed(() => {
  return regionSummaries.value.filter((region) => {
    return EU_COUNTRY_CODE_SET.has(getRegionPresentation(region.region).value.toUpperCase())
  })
})

const euRegionBrowseList = computed(() => {
  return euRegionSummaries.value
    .slice()
    .sort((left, right) => left.label.localeCompare(right.label))
})

const defaultMapRegion = computed(() => {
  return euRegionSummaries.value
    .slice()
    .sort((left, right) => {
      return right.guideCount - left.guideCount
        || (right.guidelineCount || 0) - (left.guidelineCount || 0)
        || left.label.localeCompare(right.label)
    })[0] || null
})

const selectedMapRegion = computed(() => {
  return euRegionSummaries.value.find((region) => {
    return getRegionPresentation(region.region).value.toUpperCase() === selectedMapRegionCode.value
  })
})

const totalGuideCount = computed(() => {
  return regionSummaries.value.reduce((sum, region) => sum + region.guideCount, 0)
})

const totalGuidelineCount = computed(() => {
  return regionSummaries.value.reduce((sum, region) => sum + (region.guidelineCount ?? 0), 0)
})

const hasGuidelineCounts = computed(() => {
  return regionSummaries.value.some(region => region.guidelineCount !== null)
})

const overviewStats = computed(() => {
  const latestGuide = featuredGuides.value[0]

  return [
    {
      label: 'Atlas coverage',
      value: `${regionSummaries.value.length}`,
      hint: 'Countries / regions ready to browse',
      icon: 'i-lucide-map'
    },
    {
      label: 'Guide records',
      value: totalGuideCount.value.toLocaleString(),
      hint: 'Structured publications in the catalog',
      icon: 'i-lucide-book-open'
    },
    {
      label: 'Rule coverage',
      value: hasGuidelineCounts.value ? totalGuidelineCount.value.toLocaleString() : 'Live search',
      hint: hasGuidelineCounts.value ? 'Guideline rules indexed through search' : 'Rule counts appear when guideline facets are available',
      icon: 'i-lucide-list-checks'
    },
    {
      label: 'Latest entry point',
      value: latestGuide?.publication_year ? String(latestGuide.publication_year) : 'Metadata-first',
      hint: latestGuide?.title || 'Featured guides update as the catalog grows',
      icon: 'i-lucide-sparkles'
    }
  ]
})

function buildRouteQuery() {
  return {
    q: searchQuery.value.trim() || undefined
  }
}

async function syncRouteQuery() {
  await router.replace({
    path: buildGuidesCatalogPath(),
    query: buildRouteQuery()
  })
}

async function hydrateGuideLookup(guides: CatalogGuide[], guidelines: CatalogGuideline[]) {
  const nextLookup = new Map<string, CatalogGuide>()

  for (const guide of guides) {
    nextLookup.set(guide.urn, guide)
  }

  const missingUrns = [...new Set(
    guidelines
      .map(guideline => guideline.guide_urn)
      .filter(guideUrn => guideUrn && !nextLookup.has(guideUrn))
  )]

  if (missingUrns.length) {
    const extraGuides = await Promise.allSettled(
      missingUrns.slice(0, 12).map(guideUrn => catalogApi.getGuide(guideUrn))
    )

    for (const result of extraGuides) {
      if (result.status === 'fulfilled' && result.value.urn) {
        nextLookup.set(result.value.urn, result.value)
      }
    }
  }

  guideLookup.value = Object.fromEntries(nextLookup.entries())
}

async function loadLandingSummary() {
  landingLoading.value = true
  summaryError.value = null

  try {
    const [guideResponse, guidelineResponse] = await Promise.all([
      catalogApi.searchGuides({
        limit: 250,
        offset: 0,
        sort: 'publication_year desc',
        fields: ['region', 'topic'],
        facet_limit: 100
      }),
      catalogApi.searchGuidelines({
        limit: 1,
        offset: 0,
        fields: ['region'],
        facet_limit: 100
      }).catch(() => ({
        guidelines: [],
        total: 0,
        facets: {} as Record<string, Array<{ value: string, count: number }>>
      }))
    ])

    regionSummaries.value = buildRegionSummaries(
      guideResponse.guides,
      guideResponse.facets.region || [],
      guidelineResponse.facets.region || []
    )
    themeBuckets.value = collectThemeBucketsFromGuides(guideResponse.guides).slice(0, 10)
    featuredGuides.value = guideResponse.guides
      .slice()
      .sort((left, right) => {
        return (right.publication_year || 0) - (left.publication_year || 0)
      })
      .slice(0, 4)
  } catch (error) {
    console.error('[GuidesCatalogLanding] Failed to load catalog summary:', error)
    summaryError.value = 'The dietary guides catalog could not be loaded right now.'
    regionSummaries.value = []
    themeBuckets.value = []
    featuredGuides.value = []
  } finally {
    landingLoading.value = false
  }
}

async function performSearch() {
  await syncRouteQuery()

  const query = searchQuery.value.trim()
  if (!query) {
    guideSearchResults.value = []
    guideSearchTotal.value = 0
    guidelineSearchResults.value = []
    guidelineSearchTotal.value = 0
    guideLookup.value = {}
    searchError.value = null
    return
  }

  searchLoading.value = true
  searchError.value = null

  try {
    const [guideResponse, guidelineResponse] = await Promise.all([
      catalogApi.searchGuides({
        q: query,
        limit: 6,
        offset: 0,
        sort: 'updated_at desc'
      }),
      catalogApi.searchGuidelines({
        q: query,
        limit: 8,
        offset: 0,
        sort: 'updated_at desc'
      })
    ])

    guideSearchResults.value = guideResponse.guides
    guideSearchTotal.value = guideResponse.total
    guidelineSearchResults.value = guidelineResponse.guidelines
    guidelineSearchTotal.value = guidelineResponse.total
    await hydrateGuideLookup(guideResponse.guides, guidelineResponse.guidelines)
  } catch (error) {
    console.error('[GuidesCatalogLanding] Failed to search catalog:', error)
    searchError.value = 'The catalog search could not be completed right now.'
    guideSearchResults.value = []
    guideSearchTotal.value = 0
    guidelineSearchResults.value = []
    guidelineSearchTotal.value = 0
    guideLookup.value = {}
  } finally {
    searchLoading.value = false
  }
}

function resolveGuidelineGuideTo(guideline: CatalogGuideline) {
  const guide = guideLookup.value[guideline.guide_urn]
  const region = guide?.region || guideline.region

  return region ? buildGuideDetailPath(region, guideline.guide_urn) : null
}

function applyTheme(theme: string) {
  searchQuery.value = theme
  void performSearch()
}

function clearSearch() {
  searchQuery.value = ''
  void performSearch()
}

watch(euRegionSummaries, (regions) => {
  if (!selectedMapRegionCode.value) {
    return
  }

  if (!regions.some(region => getRegionPresentation(region.region).value.toUpperCase() === selectedMapRegionCode.value)) {
    selectedMapRegionCode.value = null
  }
})

onMounted(async () => {
  searchQuery.value = firstQueryValue(route.query.q)
  await loadLandingSummary()

  if (searchQuery.value.trim()) {
    await performSearch()
  }
})
</script>
