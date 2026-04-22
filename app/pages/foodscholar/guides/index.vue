<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <FoodscholarMicroHeader
      :show-back="true"
      back-to="/foodscholar"
      back-label="Back to FoodScholar"
      back-icon="i-lucide-arrow-left"
      brand-title="FoodScholar"
      brand-lead="Dietary guides by country."
    />

    <!-- Page tab switcher -->
    <div class="border-b border-zinc-200 bg-white/40 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <div class="mx-auto flex max-w-[92rem] justify-center px-4 sm:px-6 lg:px-8">
        <div class="flex gap-0">
          <button
            type="button"
            :class="[
              'border-b-2 px-5 py-3 text-sm font-medium transition-colors',
              activeTab === 'map'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            ]"
            @click="activeTab = 'map'"
          >
            <span class="flex items-center gap-1.5">
              <UIcon name="i-lucide-map" class="h-3.5 w-3.5" />
              Map
            </span>
          </button>
          <button
            type="button"
            :class="[
              'border-b-2 px-5 py-3 text-sm font-medium transition-colors',
              activeTab === 'catalog'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            ]"
            @click="activeTab = 'catalog'"
          >
            <span class="flex items-center gap-1.5">
              <UIcon name="i-lucide-book-open" class="h-3.5 w-3.5" />
              Catalog
            </span>
          </button>
        </div>
      </div>
    </div>

    <UPage class="mx-auto max-w-[92rem] px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <UPageBody>
        <UAlert
          v-if="summaryError && !landingLoading"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="summaryError"
          class="mb-6"
        />

        <!-- MAP TAB -->
        <div v-show="activeTab === 'map'">
          <section
            v-if="landingLoading"
            class="grid gap-10 xl:grid-cols-[minmax(0,1fr)_14rem] xl:items-start"
          >
            <div class="atlas-map-wrap relative">
              <div class="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_48%_48%,rgba(255,255,255,0.55),rgba(255,255,255,0)_66%)] dark:bg-[radial-gradient(circle_at_48%_48%,rgba(255,255,255,0.08),rgba(255,255,255,0)_66%)]" />
            </div>

            <div class="space-y-6 pt-6">
              <div class="grid grid-cols-3 gap-4 border-b border-black/10 pb-6 dark:border-white/10">
                <div
                  v-for="index in 3"
                  :key="`atlas-stat-${index}`"
                  class="h-16 animate-pulse rounded-3xl bg-white/55 dark:bg-white/6"
                />
              </div>

              <div class="h-20 animate-pulse rounded-[2rem] bg-white/55 dark:bg-white/6" />

              <div class="space-y-2 border-t border-black/10 pt-6 dark:border-white/10">
                <div
                  v-for="index in 10"
                  :key="`country-loading-${index}`"
                  class="h-10 animate-pulse rounded-full bg-white/55 dark:bg-white/6"
                />
              </div>
            </div>
          </section>

          <section
            v-else-if="euRegionSummaries.length"
            class="grid gap-10 xl:grid-cols-[minmax(0,1fr)_14rem] xl:items-start"
          >
            <div class="atlas-map-wrap min-w-0 h-[56rem]">
              <EuropeGuidesMap
                v-model:selected-region-code="selectedMapRegionCode"
                :regions="euRegionSummaries"
                :hide-controls="true"
                :view-padding="0.04"
              />
            </div>

            <aside class="xl:pt-10">
              <div class="xl:sticky xl:top-24">
                <dl class="grid grid-cols-3 gap-4 border-b border-black/10 pb-6 dark:border-white/10">
                  <div>
                    <dt class="text-[0.65rem] uppercase tracking-[0.18em] text-[#7a6657] dark:text-stone-500">
                      Countries
                    </dt>
                    <dd class="mt-1 text-2xl font-semibold tracking-tight text-[#1f1a15] dark:text-white">
                      {{ euRegionSummaries.length }}
                    </dd>
                  </div>

                  <div>
                    <dt class="text-[0.65rem] uppercase tracking-[0.18em] text-[#7a6657] dark:text-stone-500">
                      Guides
                    </dt>
                    <dd class="mt-1 text-2xl font-semibold tracking-tight text-[#1f1a15] dark:text-white">
                      {{ totalGuideCount.toLocaleString() }}
                    </dd>
                  </div>

                  <div>
                    <dt class="text-[0.65rem] uppercase tracking-[0.18em] text-[#7a6657] dark:text-stone-500">
                      Rules
                    </dt>
                    <dd class="mt-1 text-2xl font-semibold tracking-tight text-[#1f1a15] dark:text-white">
                      {{ hasGuidelineCounts ? totalGuidelineCount.toLocaleString() : '—' }}
                    </dd>
                  </div>
                </dl>

                <div v-if="selectedMapRegion" class="mt-8">
                  <h2 class="text-3xl font-serif font-semibold tracking-tight text-[#1f1a15] dark:text-white">
                    {{ `${selectedMapRegion.flag || ''} ${selectedMapRegion.label}`.trim() }}
                  </h2>

                  <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#5f5146] dark:text-stone-300">
                    <span>{{ selectedMapRegion.guideCount.toLocaleString() }} guide{{ selectedMapRegion.guideCount === 1 ? '' : 's' }}</span>
                    <span v-if="selectedMapRegion.guidelineCount !== null">{{ selectedMapRegion.guidelineCount.toLocaleString() }} rule{{ selectedMapRegion.guidelineCount === 1 ? '' : 's' }}</span>
                    <span v-if="selectedMapRegion.latestPublicationYear">{{ selectedMapRegion.latestPublicationYear }}</span>
                  </div>

                  <div v-if="selectedMapRegion.topics.length" class="mt-5 flex flex-wrap gap-2">
                    <span
                      v-for="topic in selectedMapRegion.topics"
                      :key="`${selectedMapRegion.region}-${topic}`"
                      class="rounded-full bg-black/[0.04] px-3 py-1 text-xs font-medium text-[#4f453b] dark:bg-white/[0.07] dark:text-stone-300"
                    >
                      {{ topic }}
                    </span>
                  </div>

                  <NuxtLink
                    :to="buildGuidesRegionPath(selectedMapRegion.region)"
                    class="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#173f35] transition-colors hover:text-[#0d241f] dark:text-emerald-200 dark:hover:text-emerald-100"
                  >
                    <span>Open explorer</span>
                    <UIcon name="i-lucide-arrow-right" class="h-4 w-4" />
                  </NuxtLink>
                </div>

                <div class="mt-8 border-t border-black/10 pt-6 dark:border-white/10">
                  <div class="space-y-1">
                    <button
                      v-for="region in euRegionBrowseList"
                      :key="region.region"
                      type="button"
                      :class="[
                        'flex w-full items-center justify-between gap-3 rounded-full px-3 py-2.5 text-left text-sm transition-colors',
                        selectedMapRegionCode === getRegionPresentation(region.region).value.toUpperCase()
                          ? 'bg-[#173f35]/8 text-[#173f35] dark:bg-white/10 dark:text-white'
                          : 'text-[#4f453b] hover:bg-black/[0.03] dark:text-stone-300 dark:hover:bg-white/[0.04]'
                      ]"
                      @click="selectedMapRegionCode = getRegionPresentation(region.region).value.toUpperCase()"
                    >
                      <span class="truncate font-medium">
                        {{ `${region.flag || ''} ${region.label}`.trim() }}
                      </span>
                      <span class="shrink-0 text-xs text-[#7a6657] dark:text-stone-500">
                        {{ region.guideCount }}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </section>

          <div
            v-else
            class="py-24 text-center"
          >
            <UIcon name="i-lucide-map" class="mx-auto h-8 w-8 text-[#8c7a6a] dark:text-stone-500" />
            <p class="mt-4 text-sm font-medium text-[#1f1a15] dark:text-white">
              No EU country records are available yet.
            </p>
          </div>
        </div>

        <!-- CATALOG TAB -->
        <div v-show="activeTab === 'catalog'" class="space-y-6">
          <!-- Search bar -->
          <div class="flex flex-col items-center gap-3">
            <div class="relative w-full max-w-xl">
              <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c7a6a] dark:text-stone-500 pointer-events-none" />
              <input
                v-model="catalogQuery"
                type="text"
                placeholder="Search guides by title, country, topic…"
                class="w-full rounded-full border border-black/[0.08] bg-white/70 py-2.5 pl-9 pr-4 text-sm text-[#1f1a15] placeholder-[#8c7a6a] backdrop-blur-sm transition-colors focus:border-[#173f35]/40 focus:outline-none focus:ring-2 focus:ring-[#173f35]/10 dark:border-white/[0.08] dark:bg-zinc-900/60 dark:text-white dark:placeholder-stone-500 dark:focus:border-emerald-700/40"
                @keydown.enter="runCatalogSearch"
              />
            </div>
            <USelectMenu
              v-model="catalogSort"
              :items="catalogSortOptions"
              value-key="value"
              label-key="label"
              leading-icon="i-lucide-arrow-up-down"
              class="w-52"
            />
          </div>

          <!-- Active country filter pills -->
          <div v-if="selectedCatalogRegions.length" class="flex flex-wrap gap-2">
            <span
              v-for="regionCode in selectedCatalogRegions"
              :key="regionCode"
              class="inline-flex items-center gap-1.5 rounded-full bg-[#173f35]/8 px-3 py-1 text-xs font-medium text-[#173f35] dark:bg-emerald-900/20 dark:text-emerald-300"
            >
              {{ getRegionPresentation(regionCode).label }}
              <button
                type="button"
                class="ml-0.5 hover:text-[#0d241f] dark:hover:text-emerald-100 transition-colors"
                @click="removeRegionFilter(regionCode)"
              >
                <UIcon name="i-lucide-x" class="h-3 w-3" />
              </button>
            </span>
            <button
              v-if="selectedCatalogRegions.length > 1"
              type="button"
              class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs text-[#7a6657] hover:text-[#1f1a15] dark:text-stone-500 dark:hover:text-stone-200 transition-colors"
              @click="selectedCatalogRegions = []"
            >
              Clear all
            </button>
          </div>

          <!-- Region quick-filter chips from available summaries -->
          <div v-if="euRegionBrowseList.length && !landingLoading" class="flex flex-wrap gap-2">
            <button
              v-for="region in euRegionBrowseList"
              :key="region.region"
              type="button"
              :class="[
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                selectedCatalogRegions.includes(getRegionPresentation(region.region).value.toUpperCase())
                  ? 'border-[#173f35]/30 bg-[#173f35]/8 text-[#173f35] dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300'
                  : 'border-black/[0.06] bg-white/50 text-[#5f5146] hover:border-[#173f35]/20 hover:bg-[#173f35]/5 dark:border-white/[0.06] dark:bg-zinc-900/40 dark:text-stone-400 dark:hover:border-emerald-700/30 dark:hover:text-emerald-300'
              ]"
              @click="toggleRegionFilter(getRegionPresentation(region.region).value.toUpperCase())"
            >
              <span>{{ `${region.flag || ''} ${region.label}`.trim() }}</span>
              <span class="opacity-50">{{ region.guideCount }}</span>
            </button>
          </div>

          <!-- Results summary -->
          <p class="text-xs text-[#7a6657] dark:text-stone-500">
            <template v-if="catalogLoading">Loading…</template>
            <template v-else>
              {{ catalogTotal.toLocaleString() }} guide{{ catalogTotal === 1 ? '' : 's' }}
              <template v-if="catalogQuery.trim()"> matching "{{ catalogQuery.trim() }}"</template>
            </template>
          </p>

          <!-- Skeleton -->
          <div v-if="catalogLoading && !catalogGuides.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <UCard
              v-for="index in 6"
              :key="`catalog-loading-${index}`"
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

          <!-- Empty -->
          <div v-else-if="!catalogLoading && !catalogGuides.length" class="py-20 text-center">
            <UIcon name="i-lucide-book-x" class="mx-auto h-8 w-8 text-[#8c7a6a] dark:text-stone-500" />
            <p class="mt-4 text-sm font-medium text-[#1f1a15] dark:text-white">
              No guides match the current search.
            </p>
            <p class="mt-1 text-sm text-[#7a6657] dark:text-stone-400">
              Try adjusting your query or removing region filters.
            </p>
          </div>

          <!-- Guide grid -->
          <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <GuideCard
              v-for="guide in catalogGuides"
              :key="guide.urn"
              :guide="guide"
              :guideline-count="null"
              :show-region="true"
              :to="getGuideCardTarget(guide)"
            />
          </div>

          <div class="flex justify-end">
            <UPagination
              v-if="catalogTotal > catalogPageSize"
              v-model:page="catalogPage"
              :total="catalogTotal"
              :items-per-page="catalogPageSize"
              :sibling-count="1"
              show-edges
            />
          </div>
        </div>
      </UPageBody>
    </UPage>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { CatalogGuide } from '~/services/catalogApi'
import EuropeGuidesMap from '~/components/foodscholar/guides/EuropeGuidesMap.vue'
import GuideCard from '~/components/foodscholar/guides/GuideCard.vue'
import catalogApi from '~/services/catalogApi'
import {
  buildGuideDetailPath,
  buildGuidesRegionPath,
  buildRegionSummaries,
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

type AtlasTab = 'map' | 'catalog'

const EU_COUNTRY_CODE_SET = new Set<string>(euCountryCodes)

const activeTab = ref<AtlasTab>('catalog')

// Map tab state
const selectedMapRegionCode = ref<string | null>(null)
const landingLoading = ref(true)
const summaryError = ref<string | null>(null)
const regionSummaries = ref<ReturnType<typeof buildRegionSummaries>>([])

// Catalog tab state
const catalogQuery = ref('')
const catalogSort = ref('publication_year desc')
const catalogPage = ref(1)
const catalogPageSize = 9
const catalogLoading = ref(false)
const catalogGuides = ref<CatalogGuide[]>([])
const catalogTotal = ref(0)
const catalogLoadToken = ref(0)
const selectedCatalogRegions = ref<string[]>([])

const catalogSortOptions = [
  { label: 'Newest publication', value: 'publication_year desc' },
  { label: 'Oldest publication', value: 'publication_year asc' },
  { label: 'Recently updated', value: 'updated_at desc' },
  { label: 'Title A-Z', value: 'title asc' }
]

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

function toggleRegionFilter(code: string) {
  const idx = selectedCatalogRegions.value.indexOf(code)
  if (idx >= 0) {
    selectedCatalogRegions.value.splice(idx, 1)
  } else {
    selectedCatalogRegions.value.push(code)
  }
  catalogPage.value = 1
}

function removeRegionFilter(code: string) {
  const idx = selectedCatalogRegions.value.indexOf(code)
  if (idx >= 0) {
    selectedCatalogRegions.value.splice(idx, 1)
  }
  catalogPage.value = 1
}

function buildCatalogFilters() {
  if (selectedCatalogRegions.value.length === 0) return []
  if (selectedCatalogRegions.value.length === 1) {
    return [`region:${selectedCatalogRegions.value[0]}`]
  }
  return [`region:(${selectedCatalogRegions.value.join(' OR ')})`]
}

function getGuideCardTarget(guide: CatalogGuide) {
  return buildGuideDetailPath(guide.region, guide.urn)
}

async function loadCatalogGuides() {
  const loadToken = ++catalogLoadToken.value
  catalogLoading.value = true

  try {
    const response = await catalogApi.searchGuides({
      q: catalogQuery.value.trim() || null,
      limit: catalogPageSize,
      offset: (catalogPage.value - 1) * catalogPageSize,
      fq: buildCatalogFilters(),
      sort: catalogSort.value
    })

    if (loadToken !== catalogLoadToken.value) return

    catalogTotal.value = response.total
    const totalPages = Math.max(1, Math.ceil(response.total / catalogPageSize))
    if (catalogPage.value > totalPages) {
      catalogPage.value = totalPages
      return
    }

    catalogGuides.value = response.guides
  } catch {
    if (loadToken !== catalogLoadToken.value) return
    catalogGuides.value = []
    catalogTotal.value = 0
  } finally {
    if (loadToken === catalogLoadToken.value) {
      catalogLoading.value = false
    }
  }
}

function runCatalogSearch() {
  catalogPage.value = 1
  void loadCatalogGuides()
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
  } catch (error) {
    console.error('[GuidesCatalogLanding] Failed to load catalog summary:', error)
    summaryError.value = 'The dietary guides catalog could not be loaded right now.'
    regionSummaries.value = []
  } finally {
    landingLoading.value = false
  }
}

watch(euRegionSummaries, (regions) => {
  if (!selectedMapRegionCode.value) return
  if (!regions.some(region => getRegionPresentation(region.region).value.toUpperCase() === selectedMapRegionCode.value)) {
    selectedMapRegionCode.value = null
  }
})

watch(activeTab, (tab) => {
  if (tab === 'catalog' && !catalogGuides.value.length && !catalogLoading.value) {
    void loadCatalogGuides()
  }
})

watch([catalogSort, selectedCatalogRegions], () => {
  catalogPage.value = 1
  void loadCatalogGuides()
}, { deep: true })

watch(catalogPage, () => {
  void loadCatalogGuides()
})

onMounted(async () => {
  await Promise.all([
    loadLandingSummary(),
    loadCatalogGuides()
  ])
})
</script>

<style scoped>
.atlas-map-wrap {
  height: clamp(32rem, 72vh, 56rem);
  overflow: hidden;
}

/* Override EuropeGuidesMap's internal min-height so it fills the constrained wrapper */
.atlas-map-wrap :deep(.relative),
.atlas-map-wrap :deep([class*="min-h-"]) {
  min-height: unset !important;
  height: 100%;
}
</style>
