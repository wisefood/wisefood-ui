<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <!-- Header -->
    <AppPageHeader
      back-to="/foodscholar"
      back-label="FoodScholar"
      brand-title="FoodScholar"
      brand-class="text-brand-500 dark:text-brand-400"
      subtitle="Textbook Library"
    />

    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Loading -->
      <div v-if="loading && !textbooks.length" class="flex justify-center items-center py-24">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p class="text-gray-600 dark:text-gray-400">Loading textbooks…</p>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="max-w-2xl mx-auto">
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Failed to load textbooks</h3>
              <p class="text-red-700 dark:text-red-300 mb-4">{{ error }}</p>
              <button class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors" @click="loadTextbooks">
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div v-else class="flex flex-col lg:flex-row lg:items-start gap-6">
        <!-- Sidebar Filters -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          leave-active-class="transition-all duration-300 ease-in"
          enter-from-class="opacity-0 -translate-x-full"
          enter-to-class="opacity-100 translate-x-0"
          leave-from-class="opacity-100 translate-x-0"
          leave-to-class="opacity-0 -translate-x-full"
        >
          <aside v-if="showFilters" class="w-full lg:w-72 shrink-0 lg:self-start">
            <div class="sticky top-24">
              <div class="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-sm">
                <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
                  <div>
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Filters</h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ totalResults.toLocaleString() }} results
                      <span v-if="facetsActiveCount"> · {{ facetsActiveCount }} active</span>
                    </p>
                  </div>
                  <button
                    v-if="hasActiveFilters"
                    class="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
                    @click="resetFilters"
                  >
                    Reset all
                  </button>
                </div>

                <div class="px-4 py-2">
                  <div v-if="facetsLoading && !hasFacetOptions" class="py-4 text-sm text-gray-500 dark:text-gray-400">
                    Loading filters…
                  </div>
                  <div v-else class="divide-y divide-gray-100 dark:divide-zinc-800">
                    <!-- Topics pills -->
                    <div v-if="topicFacets.length" class="py-3">
                      <div class="mb-2 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                          <UIcon name="i-lucide-compass" class="w-3.5 h-3.5" />
                          Topics
                        </label>
                        <button v-if="selectedTopics.length" class="text-xs text-brand-600 dark:text-brand-400 hover:underline" @click="selectedTopics = []">Clear</button>
                      </div>
                      <div class="flex flex-wrap gap-1.5">
                        <button
                          v-for="facet in topTopicPills"
                          :key="facet.value"
                          :class="[
                            'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors',
                            selectedTopics.includes(facet.value)
                              ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                              : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                          ]"
                          @click="toggleTopic(facet.value)"
                        >
                          <span class="truncate max-w-[10rem]">{{ facet.value }}</span>
                          <span class="text-[10px] opacity-70">{{ facet.count }}</span>
                        </button>
                        <button
                          v-if="topicFacets.length > TOP_PILLS"
                          class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-700"
                          @click="showMoreTopics = !showMoreTopics"
                        >
                          {{ showMoreTopics ? 'Less' : `More (${topicFacets.length - TOP_PILLS})` }}
                          <UIcon :name="showMoreTopics ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-3 h-3" />
                        </button>
                      </div>
                      <div v-if="showMoreTopics" class="mt-2">
                        <USelectMenu
                          :model-value="selectedTopics"
                          :items="topicFacets"
                          multiple
                          value-key="value"
                          label-key="value"
                          :search-input="{ placeholder: 'Search topics…' }"
                          placeholder="Select topics"
                          class="w-full"
                          @update:model-value="(v) => { selectedTopics = Array.isArray(v) ? v : [] }"
                        >
                          <template #default="{ modelValue }">
                            <span v-if="Array.isArray(modelValue) && modelValue.length" class="text-sm">{{ modelValue.length }} selected</span>
                            <span v-else class="text-sm text-gray-400">Select topics</span>
                          </template>
                          <template #item="{ item }">
                            <span class="flex-1 min-w-0 truncate">{{ item.value }}</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">{{ item.count }}</span>
                          </template>
                        </USelectMenu>
                      </div>
                    </div>

                    <!-- Tags pills -->
                    <div v-if="tagFacets.length" class="py-3">
                      <div class="mb-2 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                          <UIcon name="i-lucide-tags" class="w-3.5 h-3.5" />
                          Tags
                        </label>
                        <button v-if="selectedTags.length" class="text-xs text-brand-600 dark:text-brand-400 hover:underline" @click="selectedTags = []">Clear</button>
                      </div>
                      <div class="flex flex-wrap gap-1.5">
                        <button
                          v-for="facet in topTagPills"
                          :key="facet.value"
                          :class="[
                            'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors',
                            selectedTags.includes(String(facet.value))
                              ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                              : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                          ]"
                          @click="toggleTag(String(facet.value))"
                        >
                          <span class="truncate max-w-[10rem]">{{ facet.value }}</span>
                          <span class="text-[10px] opacity-70">{{ facet.count }}</span>
                        </button>
                      </div>
                    </div>

                    <!-- Publication year range -->
                    <div v-if="yearBounds" class="py-3">
                      <div class="mb-2 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                          <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5" />
                          Publication Year
                        </label>
                        <button v-if="hasYearRangeFilter" class="text-xs text-brand-600 dark:text-brand-400 hover:underline" @click="clearYearRange">Clear</button>
                      </div>
                      <div class="rounded-lg border border-gray-200 dark:border-zinc-800 p-2">
                        <div class="flex h-10 items-end gap-[2px]">
                          <div
                            v-for="(bin, idx) in yearHistogramBins"
                            :key="idx"
                            class="flex-1 rounded-sm transition-colors"
                            :class="bin.active ? 'bg-brand-500/70 dark:bg-brand-400/70' : 'bg-gray-300 dark:bg-zinc-700'"
                            :style="{ height: `${bin.heightPct}%` }"
                            :title="`${bin.from}${bin.from !== bin.to ? `-${bin.to}` : ''}: ${bin.count}`"
                          />
                        </div>
                        <USlider
                          v-model="yearRangeSlider"
                          :min="yearBounds.min"
                          :max="yearBounds.max"
                          :step="1"
                          :min-steps-between-thumbs="0"
                          class="mt-3"
                        />
                        <div class="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                          <span>{{ yearBounds.min }}</span>
                          <span class="font-medium text-gray-700 dark:text-gray-300">{{ yearRangeLabel }}</span>
                          <span>{{ yearBounds.max }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Generic select menus (language, audience, region) -->
                    <div
                      v-for="filter in genericFilterRows"
                      :key="filter.key"
                      class="py-3"
                    >
                      <div class="mb-2 flex items-center justify-between gap-2">
                        <label class="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">{{ filter.label }}</label>
                        <button v-if="filter.modelRef.value.length" class="text-xs text-brand-600 dark:text-brand-400 hover:underline" @click="filter.modelRef.value = []">Clear</button>
                      </div>
                      <USelectMenu
                        :model-value="filter.modelRef.value"
                        :items="filter.options"
                        multiple
                        value-key="value"
                        label-key="value"
                        :search-input="{ placeholder: 'Search…' }"
                        :placeholder="filter.placeholder"
                        :disabled="loading || !filter.options.length"
                        class="w-full"
                        @update:model-value="(v) => { filter.modelRef.value = Array.isArray(v) ? v : [] }"
                      >
                        <template #default="{ modelValue }">
                          <span v-if="Array.isArray(modelValue) && modelValue.length" class="text-sm">{{ modelValue.length }} selected</span>
                          <span v-else class="text-sm text-gray-400">{{ filter.placeholder }}</span>
                        </template>
                        <template #item="{ item }">
                          <span class="flex-1 min-w-0 truncate">{{ item.value }}</span>
                          <span class="text-xs text-gray-500 dark:text-gray-400">{{ item.count }}</span>
                        </template>
                      </USelectMenu>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </Transition>

        <!-- Main content -->
        <main class="flex-1 min-w-0">
          <!-- Filter toggle + count -->
          <div class="mb-3 flex items-center justify-between gap-3">
            <button
              class="px-4 py-2 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              @click="showFilters = !showFilters"
            >
              <UIcon :name="showFilters ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'" class="w-4 h-4" />
              {{ showFilters ? 'Hide filters' : 'Show filters' }}
              <span v-if="facetsActiveCount" class="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[11px] font-semibold bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
                {{ facetsActiveCount }}
              </span>
            </button>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ totalResults.toLocaleString() }} results</p>
          </div>

          <!-- Search bar -->
          <div class="mb-4">
            <div class="catalog-search-composer">
              <FoodscholarNLInput
                v-model="nlQuery"
                placeholder="Search textbooks by title, author, topic…"
                input-class="w-full h-12 pl-11 pr-16 rounded-xl bg-transparent text-[15px] text-gray-900 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-zinc-400 focus:outline-none transition-all duration-200"
                @enter="performSearch"
              >
                <template #left>
                  <UIcon name="i-lucide-search" class="w-4.5 h-4.5 text-gray-500 dark:text-gray-400" />
                </template>
                <template #right>
                  <button
                    class="catalog-search-send h-10 w-10 flex items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                    @click="performSearch"
                  >
                    <UIcon name="i-lucide-arrow-right" class="w-4 h-4 text-white" />
                  </button>
                </template>
              </FoodscholarNLInput>
            </div>
            <div class="mt-2 flex flex-wrap gap-1.5">
              <button
                v-for="example in exampleQueries"
                :key="example"
                class="px-2 py-1 text-[11px] rounded-full text-gray-600 dark:text-gray-300 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                @click="nlQuery = example; performSearch()"
              >
                {{ example }}
              </button>
            </div>
          </div>

          <!-- Sort row -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <label class="text-sm text-gray-600 dark:text-gray-400">Sort</label>
              <select
                v-model="sortBy"
                class="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="score desc">Relevance</option>
                <option value="updated_at desc">Most recent</option>
                <option value="publication_year desc">Year (newest)</option>
                <option value="publication_year asc">Year (oldest)</option>
                <option value="title asc">Title A–Z</option>
              </select>
            </div>
          </div>

          <!-- Active filter chips -->
          <div v-if="hasActiveFilters" class="mb-3 flex flex-wrap gap-1.5">
            <span class="text-xs text-gray-600 dark:text-gray-400 self-center">Active filters:</span>
            <button
              v-for="chip in activeFilterChips"
              :key="`${chip.key}-${chip.value}`"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 hover:bg-brand-200 dark:hover:bg-brand-900/50"
              @click="removeChip(chip)"
            >
              <UIcon v-if="chip.icon" :name="chip.icon" class="w-3 h-3" />
              {{ chip.label }}
              <UIcon name="i-lucide-x" class="w-3 h-3" />
            </button>
          </div>

          <!-- Textbook grid -->
          <div v-if="textbooks.length">
            <div class="grid grid-cols-1 gap-4 mb-6">
              <FoodscholarTextbookCard
                v-for="(book, index) in textbooks"
                :key="book.urn"
                :textbook="book"
                :fade="false"
                :index="index"
              />
            </div>
            <div class="flex justify-center">
              <UPagination
                v-model:page="page"
                :total="totalResults"
                :items-per-page="itemsPerPage"
                :sibling-count="1"
                show-edges
              />
            </div>
          </div>

          <!-- Empty state -->
          <div v-else class="text-center py-12">
            <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <UIcon name="i-lucide-book-x" class="w-8 h-8 text-gray-400" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No textbooks found</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your search or filters.</p>
            <button class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors" @click="resetFilters">
              Reset filters
            </button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, type Ref } from 'vue'
import textbooksApi, { type Textbook, type FacetBucket } from '~/services/textbooksApi'

definePageMeta({ middleware: ['auth', 'profile'] })

useHead({ title: 'Textbook Library – FoodScholar' })

const route = useRoute()
const router = useRouter()

// State
const textbooks = ref<Textbook[]>([])
const totalResults = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)
const facets = ref<Record<string, FacetBucket[]>>({})
const facetsLoading = ref(false)

const nlQuery = ref('')
const sortBy = ref('updated_at desc')
const page = ref(1)
const itemsPerPage = 6
const showFilters = ref(false)
const showMoreTopics = ref(false)

const selectedTopics = ref<string[]>([])
const selectedTags = ref<string[]>([])
const selectedLanguages = ref<string[]>([])
const selectedAudiences = ref<string[]>([])
const selectedRegions = ref<string[]>([])
const selectedYearRange = ref<[number, number] | null>(null)

const TOP_PILLS = 8
const HISTOGRAM_BINS = 16

const routeHydrated = ref(false)

// Query helpers
const parseQueryValues = (v: unknown): string[] => {
  if (v === null || v === undefined) return []
  return (Array.isArray(v) ? v : [v]).flatMap(e => String(e).split(',')).map(e => e.trim()).filter(Boolean)
}
const getSingle = (v: unknown) => parseQueryValues(v)[0] || ''
const getNumeric = (v: unknown): number | null => {
  const raw = getSingle(v)
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

const hydrateFromRoute = () => {
  nlQuery.value = getSingle(route.query.q)
  selectedTopics.value = parseQueryValues(route.query.topic)
  selectedTags.value = parseQueryValues(route.query.tag)
  selectedLanguages.value = parseQueryValues(route.query.language)
  selectedAudiences.value = parseQueryValues(route.query.audience)
  selectedRegions.value = parseQueryValues(route.query.region)
  const yMin = getNumeric(route.query.year_min)
  const yMax = getNumeric(route.query.year_max)
  selectedYearRange.value = yMin !== null && yMax !== null ? [Math.min(yMin, yMax), Math.max(yMin, yMax)] : null
  const sort = getSingle(route.query.sort)
  sortBy.value = sort || (nlQuery.value ? 'score desc' : 'updated_at desc')
  const qPage = getNumeric(route.query.page)
  page.value = qPage && qPage > 0 ? qPage : 1
}

const buildRouteQuery = () => {
  const q: Record<string, string | string[]> = {}
  if (nlQuery.value.trim()) q.q = nlQuery.value.trim()
  if (selectedTopics.value.length) q.topic = [...selectedTopics.value]
  if (selectedTags.value.length) q.tag = [...selectedTags.value]
  if (selectedLanguages.value.length) q.language = [...selectedLanguages.value]
  if (selectedAudiences.value.length) q.audience = [...selectedAudiences.value]
  if (selectedRegions.value.length) q.region = [...selectedRegions.value]
  if (hasYearRangeFilter.value) {
    const [a, b] = yearRangeSlider.value
    q.year_min = String(a)
    q.year_max = String(b)
  }
  if (sortBy.value !== 'updated_at desc') q.sort = sortBy.value
  if (page.value > 1) q.page = String(page.value)
  return q
}

const syncRoute = async () => {
  if (!routeHydrated.value) return
  const next = buildRouteQuery()
  const cur = route.query as Record<string, unknown>
  const serialize = (obj: Record<string, unknown>) =>
    JSON.stringify(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '').sort(([a], [b]) => a.localeCompare(b)))
  if (serialize(cur) === serialize(next)) return
  await router.replace({ query: next })
}

// Facet helpers
const toFacetOptions = (entries: FacetBucket[] | undefined) =>
  (entries || []).filter(e => e.value !== null && e.value !== undefined && String(e.value).trim() !== '').sort((a, b) => b.count - a.count)

const topicFacets = computed(() => toFacetOptions(facets.value.topics))
const tagFacets = computed(() => toFacetOptions(facets.value.tags))
const languageFacets = computed(() => toFacetOptions(facets.value.language))
const audienceFacets = computed(() => toFacetOptions(facets.value.audience))
const regionFacets = computed(() => toFacetOptions(facets.value.region))

const topTopicPills = computed(() => topicFacets.value.slice(0, TOP_PILLS))
const topTagPills = computed(() => tagFacets.value.slice(0, TOP_PILLS))

interface FilterRow {
  key: string
  label: string
  placeholder: string
  modelRef: Ref<string[]>
  options: FacetBucket[]
}

const genericFilterRows = computed<FilterRow[]>(() =>
  [
    { key: 'language', label: 'Language', placeholder: 'Select language', modelRef: selectedLanguages, options: languageFacets.value },
    { key: 'audience', label: 'Audience', placeholder: 'Select audience', modelRef: selectedAudiences, options: audienceFacets.value },
    { key: 'region', label: 'Region', placeholder: 'Select region', modelRef: selectedRegions, options: regionFacets.value }
  ].filter(row => row.options.length > 0)
)

const hasFacetOptions = computed(() =>
  topicFacets.value.length > 0 || tagFacets.value.length > 0 || (facets.value.publication_year || []).length > 0
)

// Year histogram
interface HistogramBin { from: number; to: number; count: number; heightPct: number; active: boolean }

const yearDistributionEntries = computed(() => {
  return (facets.value.publication_year || [])
    .map(f => ({ value: Number(f.value), count: f.count }))
    .filter(e => Number.isFinite(e.value))
    .sort((a, b) => a.value - b.value)
})

const yearBounds = computed(() => {
  const entries = yearDistributionEntries.value
  if (!entries.length) return null
  return { min: entries[0].value, max: entries[entries.length - 1].value }
})

const yearRangeSlider = computed<[number, number]>({
  get() {
    const b = yearBounds.value
    if (!b) return [2000, 2025]
    const [a, c] = selectedYearRange.value || [b.min, b.max]
    return [Math.max(b.min, a), Math.min(b.max, c)] as [number, number]
  },
  set(value) {
    if (!Array.isArray(value) || value.length < 2) return
    const b = yearBounds.value
    const mn = Math.min(Number(value[0]), Number(value[1]))
    const mx = Math.max(Number(value[0]), Number(value[1]))
    selectedYearRange.value = b ? [Math.max(b.min, mn), Math.min(b.max, mx)] : [mn, mx]
  }
})

const hasYearRangeFilter = computed(() => {
  const b = yearBounds.value
  if (!b || !selectedYearRange.value) return false
  const [a, c] = yearRangeSlider.value
  return a !== b.min || c !== b.max
})

const yearRangeLabel = computed(() => {
  const [a, b] = yearRangeSlider.value
  return a === b ? String(a) : `${a}–${b}`
})

const yearHistogramBins = computed((): HistogramBin[] => {
  const entries = yearDistributionEntries.value
  if (!entries.length) return []
  const min = entries[0].value
  const max = entries[entries.length - 1].value
  const span = Math.max(1, max - min)
  const binCount = Math.min(HISTOGRAM_BINS, span + 1)
  const width = Math.max(1, Math.ceil((span + 1) / binCount))
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => {
    const from = min + i * width
    const to = i === binCount - 1 ? max : Math.min(max, from + width - 1)
    return { from, to, count: 0, heightPct: 0, active: false }
  })
  entries.forEach(e => {
    const idx = Math.max(0, Math.min(binCount - 1, Math.floor((e.value - min) / width)))
    bins[idx].count += e.count
  })
  const peak = Math.max(...bins.map(b => b.count), 1)
  const [selMin, selMax] = yearRangeSlider.value
  return bins.map(b => ({ ...b, heightPct: Math.max(10, Math.round((b.count / peak) * 100)), active: b.to >= selMin && b.from <= selMax }))
})

const clearYearRange = () => { selectedYearRange.value = null }

// Active filter count
const facetsActiveCount = computed(() =>
  selectedTopics.value.length +
  selectedTags.value.length +
  selectedLanguages.value.length +
  selectedAudiences.value.length +
  selectedRegions.value.length +
  (hasYearRangeFilter.value ? 1 : 0)
)

const hasActiveFilters = computed(() => facetsActiveCount.value > 0 || nlQuery.value.trim() !== '')

interface FilterChip { key: string; value: string; label: string; icon?: string }

const activeFilterChips = computed<FilterChip[]>(() => {
  const chips: FilterChip[] = []
  selectedTopics.value.forEach(v => chips.push({ key: 'topic', value: v, label: v, icon: 'i-lucide-compass' }))
  selectedTags.value.forEach(v => chips.push({ key: 'tag', value: v, label: v, icon: 'i-lucide-tags' }))
  selectedLanguages.value.forEach(v => chips.push({ key: 'language', value: v, label: v, icon: 'i-lucide-languages' }))
  selectedAudiences.value.forEach(v => chips.push({ key: 'audience', value: v, label: v, icon: 'i-lucide-users' }))
  selectedRegions.value.forEach(v => chips.push({ key: 'region', value: v, label: v, icon: 'i-lucide-globe' }))
  if (hasYearRangeFilter.value) chips.push({ key: 'year_range', value: yearRangeLabel.value, label: `Year: ${yearRangeLabel.value}`, icon: 'i-lucide-calendar' })
  if (nlQuery.value.trim()) chips.push({ key: 'query', value: nlQuery.value.trim(), label: `"${nlQuery.value.trim()}"`, icon: 'i-lucide-search' })
  return chips
})

const removeChip = (chip: FilterChip) => {
  if (chip.key === 'topic') { selectedTopics.value = selectedTopics.value.filter(v => v !== chip.value); return }
  if (chip.key === 'tag') { selectedTags.value = selectedTags.value.filter(v => v !== chip.value); return }
  if (chip.key === 'language') { selectedLanguages.value = selectedLanguages.value.filter(v => v !== chip.value); return }
  if (chip.key === 'audience') { selectedAudiences.value = selectedAudiences.value.filter(v => v !== chip.value); return }
  if (chip.key === 'region') { selectedRegions.value = selectedRegions.value.filter(v => v !== chip.value); return }
  if (chip.key === 'year_range') { clearYearRange(); return }
  if (chip.key === 'query') { nlQuery.value = ''; void syncRoute(); loadTextbooks(); }
}

const toggleTopic = (v: string) => {
  selectedTopics.value = selectedTopics.value.includes(v)
    ? selectedTopics.value.filter(x => x !== v)
    : [...selectedTopics.value, v]
}

const toggleTag = (v: string) => {
  selectedTags.value = selectedTags.value.includes(v)
    ? selectedTags.value.filter(x => x !== v)
    : [...selectedTags.value, v]
}

const exampleQueries = [
  'Human nutrition',
  'Food science',
  'Dietetics',
  'Biochemistry of food'
]

// API calls
const FACET_FIELDS = ['topics', 'tags', 'publication_year', 'language', 'audience', 'region']

const loadFacets = async () => {
  facetsLoading.value = true
  try {
    const res = await textbooksApi.searchTextbooks({
      q: null,
      limit: 6,
      offset: 0,
      sort: 'updated_at desc',
      fields: FACET_FIELDS,
      facet_limit: 200
    })
    if (Object.values(res.facets).some(e => e.length)) {
      facets.value = res.facets
    }
  } catch (err) {
    console.error('Failed to load textbook facets:', err)
  } finally {
    facetsLoading.value = false
  }
}

const loadTextbooks = async () => {
  loading.value = true
  error.value = null
  try {
    const fq: string[] = []
    if (selectedTopics.value.length) {
      fq.push(`(${selectedTopics.value.map(v => `topics:"${v}"`).join(' OR ')})`)
    }
    if (selectedTags.value.length) {
      fq.push(`(${selectedTags.value.map(v => `tags:"${v}"`).join(' OR ')})`)
    }
    if (selectedLanguages.value.length) {
      fq.push(`(${selectedLanguages.value.map(v => `language:"${v}"`).join(' OR ')})`)
    }
    if (selectedAudiences.value.length) {
      fq.push(`(${selectedAudiences.value.map(v => `audience:"${v}"`).join(' OR ')})`)
    }
    if (selectedRegions.value.length) {
      fq.push(`(${selectedRegions.value.map(v => `region:"${v}"`).join(' OR ')})`)
    }
    if (hasYearRangeFilter.value) {
      const [a, b] = yearRangeSlider.value
      fq.push(`publication_year:[${a} TO ${b}]`)
    }

    const res = await textbooksApi.searchTextbooks({
      q: nlQuery.value || null,
      limit: itemsPerPage,
      offset: (page.value - 1) * itemsPerPage,
      sort: sortBy.value,
      fq: fq.length ? fq : null,
      fields: []
    })
    textbooks.value = res.textbooks
    totalResults.value = res.total

    if (!Object.values(facets.value).some(e => e.length) && Object.values(res.facets).some(e => e.length)) {
      facets.value = res.facets
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}

const performSearch = () => {
  page.value = 1
  sortBy.value = nlQuery.value ? 'score desc' : 'updated_at desc'
  void syncRoute()
  loadTextbooks()
}

const resetFilters = () => {
  selectedTopics.value = []
  selectedTags.value = []
  selectedLanguages.value = []
  selectedAudiences.value = []
  selectedRegions.value = []
  clearYearRange()
  nlQuery.value = ''
  sortBy.value = 'updated_at desc'
  page.value = 1
  void syncRoute()
  loadTextbooks()
}

// Watches
watch([
  selectedTopics, selectedTags, selectedLanguages, selectedAudiences, selectedRegions,
  selectedYearRange, sortBy
], () => {
  if (!routeHydrated.value) return
  page.value = 1
  void syncRoute()
  loadTextbooks()
}, { deep: true })

watch(page, () => {
  if (!routeHydrated.value) return
  void syncRoute()
  loadTextbooks()
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

// Observer for scroll animations
let observer: IntersectionObserver | null = null
const setupObserver = () => {
  observer?.disconnect()
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer?.unobserve(entry.target)
      }
    })
  }, { rootMargin: '0px 0px -80px 0px', threshold: 0.1 })
  setTimeout(() => {
    document.querySelectorAll('.scroll-fade-in').forEach(el => {
      el.classList.remove('is-visible')
      observer?.observe(el)
    })
  }, 50)
}

onMounted(async () => {
  hydrateFromRoute()
  routeHydrated.value = true
  await loadFacets()
  await loadTextbooks()
  setupObserver()
})

onUnmounted(() => observer?.disconnect())
</script>

<style scoped>
.scroll-fade-in {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
  transition-delay: var(--delay, 0s);
}
.scroll-fade-in.is-visible {
  opacity: 1;
  transform: translateY(0);
}
.catalog-search-composer {
  position: relative;
  border-radius: 0.9rem;
  padding: 0.35rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(14px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.catalog-search-composer:focus-within {
  border-color: rgb(59 130 246 / 0.45);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.12);
  background: rgba(255, 255, 255, 0.85);
}
.dark .catalog-search-composer {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(24, 24, 27, 0.65);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
}
.dark .catalog-search-composer:focus-within {
  border-color: rgb(96 165 250 / 0.45);
  box-shadow: 0 0 0 3px rgb(96 165 250 / 0.12);
  background: rgba(24, 24, 27, 0.82);
}
.catalog-search-send {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.catalog-search-send:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.22);
}
</style>
