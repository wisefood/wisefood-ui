<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <!-- Header -->
    <FoodscholarMicroHeader
      :show-back="true"
      back-to="/foodscholar"
      back-label="Back to FoodScholar"
      back-icon="i-lucide-arrow-left"
      brand-title="FoodScholar"
      brand-lead="Educational content and nutritional insights about sustainable eating"
      section-title="Article Catalog"
      section-subtitle="Advanced search and filtering for nutrition science literature"
    />

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Loading State -->
      <div v-if="loading && (!articles || articles.length === 0)" class="flex justify-center items-center py-24">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">Loading articles...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="max-w-2xl mx-auto">
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Failed to load articles</h3>
              <p class="text-red-700 dark:text-red-300 mb-4">{{ error }}</p>
              <button
                @click="loadArticles"
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div v-else class="flex gap-6">
        <!-- Left Sidebar - Filters -->
        <aside
          :class="[
            'lg:block lg:w-64 flex-shrink-0',
            showFilters ? 'block fixed inset-0 z-20 bg-white dark:bg-zinc-900 p-4 overflow-y-auto' : 'hidden'
          ]"
        >
          <div class="sticky top-24">
            <!-- Mobile close button -->
            <div v-if="showFilters" class="lg:hidden flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-zinc-800">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
              <button
                @click="showFilters = false"
                class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <UIcon name="i-lucide-x" class="w-5 h-5" />
              </button>
            </div>

            <div class="space-y-8">
              <!-- Category Filter -->
              <div v-if="categoryFacets.length > 0">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <UIcon name="i-lucide-folder" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  Category
                </h3>
                <div>
                  <div :class="['space-y-3', showAllCategories && categoryFacets.length > initialFilterCount ? 'max-h-80 overflow-y-auto pr-2' : '']">
                    <label
                      v-for="facet in displayedCategoryFacets"
                      :key="facet.value"
                      class="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        :value="facet.value"
                        v-model="selectedCategories"
                        class="w-4 h-4 rounded border-gray-300 dark:border-zinc-600 text-brand-600 focus:ring-brand-500"
                      />
                      <span class="text-base text-gray-700 dark:text-gray-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 flex-1 transition-colors">
                        {{ facet.label }}
                      </span>
                      <span class="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                        {{ facet.count }}
                      </span>
                    </label>
                  </div>
                  <button
                    v-if="categoryFacets.length > initialFilterCount"
                    @click="showAllCategories = !showAllCategories"
                    class="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors flex items-center gap-1 mt-3"
                  >
                    {{ showAllCategories ? 'Show Less' : `Show ${categoryFacets.length - initialFilterCount} More` }}
                    <UIcon :name="showAllCategories ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Venue Filter -->
              <div v-if="venueFacets.length > 0">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <UIcon name="i-lucide-book-open" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  Venue
                </h3>
                <div>
                  <div :class="['space-y-3', showAllVenues && venueFacets.length > initialFilterCount ? 'max-h-80 overflow-y-auto pr-2' : '']">
                    <label
                      v-for="facet in displayedVenueFacets"
                      :key="facet.value"
                      class="flex items-start gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        :value="facet.value"
                        v-model="selectedVenues"
                        class="w-4 h-4 mt-0.5 rounded border-gray-300 dark:border-zinc-600 text-brand-600 focus:ring-brand-500"
                      />
                      <span class="text-base text-gray-700 dark:text-gray-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 flex-1 leading-tight transition-colors">
                        {{ facet.value }}
                      </span>
                      <span class="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                        {{ facet.count }}
                      </span>
                    </label>
                  </div>
                  <button
                    v-if="venueFacets.length > initialFilterCount"
                    @click="showAllVenues = !showAllVenues"
                    class="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors flex items-center gap-1 mt-3"
                  >
                    {{ showAllVenues ? 'Show Less' : `Show ${venueFacets.length - initialFilterCount} More` }}
                    <UIcon :name="showAllVenues ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Publication Year Filter -->
              <div v-if="yearFacets.length > 0">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <UIcon name="i-lucide-calendar" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  Publication Year
                </h3>
                <div>
                  <div :class="['space-y-3', showAllYears && yearFacets.length > initialFilterCount ? 'max-h-80 overflow-y-auto pr-2' : '']">
                    <label
                      v-for="facet in displayedYearFacets"
                      :key="facet.value"
                      class="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        :value="facet.value"
                        v-model="selectedYears"
                        class="w-4 h-4 rounded border-gray-300 dark:border-zinc-600 text-brand-600 focus:ring-brand-500"
                      />
                      <span class="text-base text-gray-700 dark:text-gray-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 flex-1 transition-colors">
                        {{ facet.value }}
                      </span>
                      <span class="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                        {{ facet.count }}
                      </span>
                    </label>
                  </div>
                  <button
                    v-if="yearFacets.length > initialFilterCount"
                    @click="showAllYears = !showAllYears"
                    class="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors flex items-center gap-1 mt-3"
                  >
                    {{ showAllYears ? 'Show Less' : `Show ${yearFacets.length - initialFilterCount} More` }}
                    <UIcon :name="showAllYears ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Tags Filter -->
              <div v-if="tagFacets.length > 0">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <UIcon name="i-lucide-tags" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  Tags
                </h3>
                <div>
                  <div :class="['space-y-3', showAllTags && tagFacets.length > initialFilterCount ? 'max-h-80 overflow-y-auto pr-2' : '']">
                    <label
                      v-for="facet in displayedTagFacets"
                      :key="facet.value"
                      class="flex items-start gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        :value="facet.value"
                        v-model="selectedTags"
                        class="w-4 h-4 mt-0.5 rounded border-gray-300 dark:border-zinc-600 text-brand-600 focus:ring-brand-500"
                      />
                      <span class="text-base text-gray-700 dark:text-gray-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 flex-1 leading-tight transition-colors">
                        {{ facet.label }}
                      </span>
                      <span class="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                        {{ facet.count }}
                      </span>
                    </label>
                  </div>
                  <button
                    v-if="tagFacets.length > initialFilterCount"
                    @click="showAllTags = !showAllTags"
                    class="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors flex items-center gap-1 mt-3"
                  >
                    {{ showAllTags ? 'Show Less' : `Show ${tagFacets.length - initialFilterCount} More` }}
                    <UIcon :name="showAllTags ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Reset Filters -->
              <button
                v-if="hasActiveFilters"
                @click="resetFilters"
                class="w-full px-4 py-3 text-base font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </aside>

        <!-- Main Content Area -->
        <main class="flex-1 min-w-0">
          <!-- Natural Language Search -->
          <div class="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-search" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Natural Language Search</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">Search articles using natural language</p>
              </div>
            </div>
            <div>
              <FoodscholarNLInput
                v-model="nlQuery"
                @enter="performNLSearch"
                placeholder='Try "articles about gut health and probiotics" or "sustainable protein sources"'
              >
                <template #right>
                  <button
                    @click="performNLSearch"
                    class="h-10 w-10 flex items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                  >
                    <UIcon
                      name="i-lucide-arrow-right"
                      class="w-4 h-4 text-white"
                    />
                  </button>
                </template>
              </FoodscholarNLInput>

              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  v-for="example in exampleQueries"
                  :key="example"
                  @click="nlQuery = example; performNLSearch()"
                  class="px-3 py-1.5 text-xs rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-brand-100 dark:hover:bg-brand-900/30 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                >
                  {{ example }}
                </button>
              </div>
            </div>
          </div>

          <!-- Sorting Options -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <label class="text-sm text-gray-600 dark:text-gray-400">Sort by:</label>
              <select
                v-model="sortBy"
                class="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="created_at desc">Most Recent</option>
                <option value="publication_year desc">Publication Year (Newest)</option>
                <option value="publication_year asc">Publication Year (Oldest)</option>
                <option value="title asc">Title (A-Z)</option>
              </select>
            </div>
          </div>

          <!-- Active Filters Display -->
          <div v-if="hasActiveFilters" class="mb-4 flex flex-wrap gap-2">
            <span class="text-xs text-gray-600 dark:text-gray-400 self-center">Active filters:</span>
            <button
              v-for="category in selectedCategories"
              :key="`cat-${category}`"
              @click="selectedCategories = selectedCategories.filter(c => c !== category)"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 hover:bg-brand-200 dark:hover:bg-brand-900/50"
            >
              {{ category }}
              <UIcon name="i-lucide-x" class="w-3 h-3" />
            </button>
            <button
              v-for="venue in selectedVenues"
              :key="`venue-${venue}`"
              @click="selectedVenues = selectedVenues.filter(v => v !== venue)"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 hover:bg-brand-200 dark:hover:bg-brand-900/50"
            >
              {{ venue }}
              <UIcon name="i-lucide-x" class="w-3 h-3" />
            </button>
            <button
              v-for="year in selectedYears"
              :key="`year-${year}`"
              @click="selectedYears = selectedYears.filter(y => y !== year)"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 hover:bg-brand-200 dark:hover:bg-brand-900/50"
            >
              {{ year }}
              <UIcon name="i-lucide-x" class="w-3 h-3" />
            </button>
            <button
              v-for="tag in selectedTags"
              :key="`tag-${tag}`"
              @click="selectedTags = selectedTags.filter(t => t !== tag)"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 hover:bg-brand-200 dark:hover:bg-brand-900/50"
            >
              <UIcon name="i-lucide-tag" class="w-3 h-3" />
              {{ tag }}
              <UIcon name="i-lucide-x" class="w-3 h-3" />
            </button>
          </div>

          <!-- Articles List -->
          <div v-if="displayArticles.length > 0">
            <div class="grid grid-cols-1 gap-6 mb-8">
              <FoodscholarArticleCard
                v-for="(article, index) in displayArticles"
                :key="article.urn"
                :article="article"
                :fade="false"
                :index="index"
              />
            </div>

            <!-- Pagination -->
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

          <!-- No Results -->
          <div v-else class="text-center py-12">
            <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <UIcon name="i-lucide-search-x" class="w-8 h-8 text-gray-400" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No articles found</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your filters or search query</p>
            <button
              @click="resetFilters"
              class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useArticles } from '~/composables/useArticles'
import type { Article } from '~/services/articlesApi'

definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'Article Catalog - FoodScholar'
})

useSeoMeta({
  description: 'Advanced search and filtering for nutrition science literature'
})

// Composable
const {
  articles,
  loading,
  error,
  totalResults,
  searchArticles,
  clearError
} = useArticles()

// Facets from API
const facets = ref<Record<string, Array<{ value: any, count: number }>>>({})

// Filter and Search State
const selectedCategories = ref<string[]>([])
const selectedVenues = ref<string[]>([])
const selectedYears = ref<string[]>([])
const selectedTags = ref<string[]>([])
const nlQuery = ref("")
const sortBy = ref("created_at desc")
const showFilters = ref(false)
const page = ref(1)
const itemsPerPage = 6

// Show More states
const showAllCategories = ref(false)
const showAllVenues = ref(false)
const showAllYears = ref(false)
const showAllTags = ref(false)
const initialFilterCount = 5

// Annotated facet interface for tracking field source
interface AnnotatedFacet {
  value: string
  count: number
  field: string // The actual field name (category, ai_category, tags, ai_tags)
  label?: string // Optional label for display (e.g., "Clinical Nutrition (AI)")
}

const exampleQueries = [
  "gut microbiome research",
  "sustainable protein alternatives",
  "vitamin D deficiency studies",
]

// Transform articles to match ArticleCard interface
const displayArticles = computed(() => {
  return articles.value.map(article => ({
    ...article,
    id: article.id,
    urn: article.urn,
    category: article.category || article.ai_category || 'Uncategorized',
    ai_category: article.ai_category,
    excerpt: article.abstract || article.description || '',
    readTime: calculateReadTime(article.content || ''),
    authors: article.authors || [],
    tags: article.tags || [],
    ai_tags: article.ai_tags || [],
    venue: article.venue,
    publication_year: article.publication_year,
  }))
})

// Helper to calculate read time
const calculateReadTime = (content: string | undefined): number => {
  if (!content) return 1
  const wordsPerMinute = 225
  const wordCount = content.trim().split(/\s+/).length
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return Math.max(1, minutes)
}

// Computed facets for UI - merged Category (category + ai_category)
const categoryFacets = computed((): AnnotatedFacet[] => {
  const humanCategories = (facets.value.category || []).map(f => ({
    value: f.value,
    count: f.count,
    field: 'category',
    label: f.value
  }))

  const aiCategories = (facets.value.ai_category || []).map(f => ({
    value: f.value,
    count: f.count,
    field: 'ai_category',
    label: `${f.value} (AI)`
  }))

  // Merge and deduplicate by value, prioritizing human-reviewed
  const merged = new Map<string, AnnotatedFacet>()

  humanCategories.forEach(cat => merged.set(cat.value, cat))
  aiCategories.forEach(cat => {
    if (!merged.has(cat.value)) {
      merged.set(cat.value, cat)
    } else {
      // Add AI count to existing human category
      const existing = merged.get(cat.value)!
      existing.count += cat.count
    }
  })

  return Array.from(merged.values()).sort((a, b) => b.count - a.count)
})

const venueFacets = computed(() => facets.value.venue || [])

const yearFacets = computed(() => {
  // Convert timestamps to year strings and sort descending
  return (facets.value.publication_year || [])
    .map(f => ({
      value: new Date(f.value).getFullYear().toString(),
      count: f.count
    }))
    .sort((a, b) => parseInt(b.value) - parseInt(a.value))
})

// Computed facets for Tags (tags + ai_tags)
const tagFacets = computed((): AnnotatedFacet[] => {
  const humanTags = (facets.value.tags || []).map(f => ({
    value: f.value,
    count: f.count,
    field: 'tags',
    label: f.value
  }))

  const aiTags = (facets.value.ai_tags || []).map(f => ({
    value: f.value,
    count: f.count,
    field: 'ai_tags',
    label: `${f.value} (AI)`
  }))

  // Merge and deduplicate by value, prioritizing human-reviewed
  const merged = new Map<string, AnnotatedFacet>()

  humanTags.forEach(tag => merged.set(tag.value, tag))
  aiTags.forEach(tag => {
    if (!merged.has(tag.value)) {
      merged.set(tag.value, tag)
    } else {
      // Add AI count to existing human tag
      const existing = merged.get(tag.value)!
      existing.count += tag.count
    }
  })

  return Array.from(merged.values()).sort((a, b) => b.count - a.count)
})

// Displayed facets (with Show More logic)
const displayedCategoryFacets = computed(() =>
  showAllCategories.value ? categoryFacets.value : categoryFacets.value.slice(0, initialFilterCount)
)
const displayedVenueFacets = computed(() =>
  showAllVenues.value ? venueFacets.value : venueFacets.value.slice(0, initialFilterCount)
)
const displayedYearFacets = computed(() =>
  showAllYears.value ? yearFacets.value : yearFacets.value.slice(0, initialFilterCount)
)
const displayedTagFacets = computed(() =>
  showAllTags.value ? tagFacets.value : tagFacets.value.slice(0, initialFilterCount)
)

// Computed
const hasActiveFilters = computed(() => {
  return selectedCategories.value.length > 0 ||
         selectedVenues.value.length > 0 ||
         selectedYears.value.length > 0 ||
         selectedTags.value.length > 0 ||
         nlQuery.value.trim() !== ''
})

// Load all facets (without filters) to keep facet options always available
const loadFacets = async () => {
  try {
    // Request facets without any filters to get all available facet values
    const facetResponse = await searchArticles({
      q: null,
      limit: 1, // Minimum required by API (we only need facets)
      offset: 0,
      sort: sortBy.value,
      fl: ['urn'], // Minimal field list since we only need facets
      fq: null,
      fields: [],
    })

    // Store facets from response
    if (facetResponse.result.facets) {
      facets.value = facetResponse.result.facets
    }
  } catch (err) {
    console.error('Failed to load facets:', err)
  }
}

// Load articles from backend with filters
const loadArticles = async () => {
  clearError()

  try {
    // Build filter queries
    const fq: string[] = []

    // Category filter: build OR query across both category and ai_category fields
    if (selectedCategories.value.length > 0) {
      const categoryFilters: string[] = []
      selectedCategories.value.forEach(cat => {
        // Search in both category and ai_category fields for each selected value
        categoryFilters.push(`category:"${cat}"`)
        categoryFilters.push(`ai_category:"${cat}"`)
      })
      const categoryFilter = categoryFilters.join(' OR ')
      fq.push(categoryFilters.length > 1 ? `(${categoryFilter})` : categoryFilter)
    }

    if (selectedVenues.value.length > 0) {
      const venueFilter = selectedVenues.value.map(v => `venue:"${v}"`).join(' OR ')
      fq.push(selectedVenues.value.length > 1 ? `(${venueFilter})` : venueFilter)
    }

    if (selectedYears.value.length > 0) {
      const yearFilter = selectedYears.value.map(y => `publication_year:${y}-*`).join(' OR ')
      fq.push(selectedYears.value.length > 1 ? `(${yearFilter})` : yearFilter)
    }

    // Tags filter: build OR query across both tags and ai_tags fields
    if (selectedTags.value.length > 0) {
      const tagFilters: string[] = []
      selectedTags.value.forEach(tag => {
        // Search in both tags and ai_tags fields for each selected value
        tagFilters.push(`tags:"${tag}"`)
        tagFilters.push(`ai_tags:"${tag}"`)
      })
      const tagFilter = tagFilters.join(' OR ')
      fq.push(tagFilters.length > 1 ? `(${tagFilter})` : tagFilter)
    }

    // Load articles with filters (no facets needed from this request)
    await searchArticles({
      q: nlQuery.value || null,
      limit: itemsPerPage,
      offset: (page.value - 1) * itemsPerPage,
      sort: sortBy.value,
      fl: ['urn', 'title', 'authors', 'tags', 'ai_tags', 'abstract', 'description', 'venue', 'publication_year', 'category', 'ai_category'],
      fq: fq.length > 0 ? fq : null,
      fields: [], // Don't request facets here since we get them separately
    })
  } catch (err) {
    console.error('Failed to load articles:', err)
  }
}

// Methods
const performNLSearch = () => {
  page.value = 1
  loadArticles()
}

const resetFilters = () => {
  selectedCategories.value = []
  selectedVenues.value = []
  selectedYears.value = []
  selectedTags.value = []
  nlQuery.value = ""
  sortBy.value = "created_at desc"
  page.value = 1
  loadArticles()
}

// Watch for changes
watch([selectedCategories, selectedVenues, selectedYears, selectedTags, sortBy], () => {
  page.value = 1
  loadArticles()
}, { deep: true })

watch(page, () => {
  loadArticles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
  setupObserver()
})

// Intersection Observer for animations
let observer: IntersectionObserver | null = null

const setupObserver = () => {
  // Clean up existing observations
  if (observer) {
    observer.disconnect()
  }

  // Set up new observer
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.1
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer?.unobserve(entry.target)
      }
    })
  }, observerOptions)

  // Observe all scroll-fade-in elements
  setTimeout(() => {
    document.querySelectorAll('.scroll-fade-in').forEach((el) => {
      el.classList.remove('is-visible')
      observer?.observe(el)
    })
  }, 50)
}

onMounted(() => {
  loadFacets() // Load all available facets once
  loadArticles() // Load filtered articles
  setupObserver()
})

onUnmounted(() => {
  observer?.disconnect()
})
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
</style>
