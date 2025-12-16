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
      <div class="flex gap-6">
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

            <div class="space-y-6">
              <!-- Category Filter -->
              <div class="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <UIcon name="i-lucide-folder" class="w-4 h-4" />
                  Category
                </h3>
                <div class="space-y-2">
                  <label
                    v-for="category in categories"
                    :key="category"
                    class="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      :value="category"
                      v-model="selectedCategories"
                      class="w-4 h-4 rounded border-gray-300 dark:border-zinc-600 text-brand-600 focus:ring-brand-500"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                      {{ category }}
                    </span>
                    <span class="ml-auto text-xs text-gray-500">
                      {{ getCategoryCount(category) }}
                    </span>
                  </label>
                </div>
              </div>

              <!-- Read Time Filter -->
              <div class="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <UIcon name="i-lucide-clock" class="w-4 h-4" />
                  Read Time
                </h3>
                <div class="space-y-2">
                  <label
                    v-for="range in readTimeRanges"
                    :key="range.label"
                    class="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      :value="range.label"
                      v-model="selectedReadTimes"
                      class="w-4 h-4 rounded border-gray-300 dark:border-zinc-600 text-brand-600 focus:ring-brand-500"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                      {{ range.label }}
                    </span>
                  </label>
                </div>
              </div>

              <!-- Citations Filter -->
              <div class="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <UIcon name="i-lucide-quote" class="w-4 h-4" />
                  Citations
                </h3>
                <div class="space-y-3">
                  <div>
                    <label class="text-xs text-gray-600 dark:text-gray-400">Minimum citations</label>
                    <input
                      type="range"
                      v-model.number="minCitations"
                      min="0"
                      max="100"
                      class="w-full mt-2"
                    />
                    <div class="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span class="font-medium text-brand-600">{{ minCitations }}</span>
                      <span>100+</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Engagement Filter -->
              <div class="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <UIcon name="i-lucide-trending-up" class="w-4 h-4" />
                  Engagement
                </h3>
                <div class="space-y-2">
                  <label class="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      v-model="filters.highlyRated"
                      class="w-4 h-4 rounded border-gray-300 dark:border-zinc-600 text-brand-600 focus:ring-brand-500"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                      Highly rated (200+ reactions)
                    </span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      v-model="filters.widelyCited"
                      class="w-4 h-4 rounded border-gray-300 dark:border-zinc-600 text-brand-600 focus:ring-brand-500"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                      Widely cited (40+ citations)
                    </span>
                  </label>
                </div>
              </div>

              <!-- Reset Filters -->
              <button
                @click="resetFilters"
                class="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
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
                <p class="text-sm text-gray-500 dark:text-gray-400">Search using plain English queries</p>
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
                <option value="relevance">Relevance</option>
                <option value="citations">Citations (High to Low)</option>
                <option value="reactions">Engagement (High to Low)</option>
                <option value="readTime">Read Time (Short to Long)</option>
                <option value="recent">Most Recent</option>
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
              v-if="minCitations > 0"
              @click="minCitations = 0"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 hover:bg-brand-200 dark:hover:bg-brand-900/50"
            >
              Min {{ minCitations }} citations
              <UIcon name="i-lucide-x" class="w-3 h-3" />
            </button>
          </div>

          <!-- Articles List -->
          <div v-if="sortedArticles.length > 0">
            <div class="grid grid-cols-1 gap-6 mb-8">
              <FoodscholarArticleCard
                v-for="(article, index) in paginatedArticles"
                :key="article.id"
                :article="article"
                :fade="false"
                :index="index"
              />
            </div>

            <!-- Pagination -->
            <div class="flex justify-center">
              <UPagination
                v-model:page="page"
                :total="sortedArticles.length"
                :items-per-page="itemsPerPage"
                :sibling-count="1"
                show-edges
                :ui="{
                  base: 'min-w-[2rem] justify-center',
                }"
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

definePageMeta({
  middleware: 'auth'
})

useSeoMeta({
  title: 'Article Catalog - FoodScholar',
  description: 'Advanced search and filtering for nutrition science literature'
})

interface Article {
  id: number
  title: string
  category: string
  excerpt: string
  readTime: number
  reactions?: {
    helpful: number
    insightful: number
    interesting: number
  }
  citations?: number
}

// Mock data - replace with API call
const allArticles: Article[] = [
  {
    id: 1,
    title: "Understanding Plant-Based Proteins",
    category: "Nutrition",
    excerpt: "Explore the complete amino acid profiles of legumes, grains, and plant-based sources.",
    readTime: 5,
    reactions: { helpful: 124, insightful: 89, interesting: 156 },
    citations: 23,
  },
  {
    id: 2,
    title: "The Carbon Footprint of Your Diet",
    category: "Sustainability",
    excerpt: "Learn how different foods impact the environment and discover lower-impact alternatives.",
    readTime: 7,
    reactions: { helpful: 201, insightful: 167, interesting: 243 },
    citations: 42,
  },
  {
    id: 3,
    title: "Micronutrients You Might Be Missing",
    category: "Health",
    excerpt: "A science-based guide to identifying and addressing common micronutrient deficiencies.",
    readTime: 6,
    reactions: { helpful: 178, insightful: 142, interesting: 91 },
    citations: 31,
  },
  {
    id: 4,
    title: "Seasonal Eating for Optimal Nutrition",
    category: "Wellness",
    excerpt: "Discover why eating seasonally benefits both your health and the planet.",
    readTime: 4,
    reactions: { helpful: 95, insightful: 73, interesting: 112 },
    citations: 18,
  },
  {
    id: 5,
    title: "Fermented Foods and Gut Health",
    category: "Health",
    excerpt: "Understanding the science behind probiotics and their role in digestive wellness.",
    readTime: 8,
    reactions: { helpful: 215, insightful: 189, interesting: 267 },
    citations: 56,
  },
  {
    id: 6,
    title: "Water Footprint of Different Foods",
    category: "Sustainability",
    excerpt: "How much water does it take to produce your favorite foods? A comprehensive analysis.",
    readTime: 5,
    reactions: { helpful: 167, insightful: 134, interesting: 198 },
    citations: 38,
  },
  {
    id: 7,
    title: "Omega-3 Fatty Acids: Sources and Benefits",
    category: "Nutrition",
    excerpt: "A deep dive into EPA, DHA, and ALA - their sources, conversion rates, and health impacts.",
    readTime: 9,
    reactions: { helpful: 289, insightful: 234, interesting: 312 },
    citations: 67,
  },
  {
    id: 8,
    title: "The Role of Fiber in Disease Prevention",
    category: "Health",
    excerpt: "Evidence-based review of dietary fiber's impact on cardiovascular health, diabetes, and cancer.",
    readTime: 10,
    reactions: { helpful: 342, insightful: 298, interesting: 401 },
    citations: 89,
  },
]

// Filter and Search State
const categories = ["Nutrition", "Sustainability", "Health", "Wellness"]
const selectedCategories = ref<string[]>([])
const selectedReadTimes = ref<string[]>([])
const minCitations = ref(0)
const nlQuery = ref("")
const sortBy = ref("relevance")
const showFilters = ref(false)
const page = ref(1)
const itemsPerPage = 6

const filters = ref({
  highlyRated: false,
  widelyCited: false,
})

const readTimeRanges = [
  { label: "Quick read (< 5 min)", min: 0, max: 4 },
  { label: "Medium read (5-7 min)", min: 5, max: 7 },
  { label: "Long read (8+ min)", min: 8, max: 999 },
]

const exampleQueries = [
  "gut microbiome research",
  "sustainable protein alternatives",
  "vitamin D deficiency studies",
]

// Computed
const hasActiveFilters = computed(() => {
  return selectedCategories.value.length > 0 ||
    selectedReadTimes.value.length > 0 ||
    minCitations.value > 0 ||
    filters.value.highlyRated ||
    filters.value.widelyCited
})

const filteredArticles = computed(() => {
  let filtered = [...allArticles]

  // Category filter
  if (selectedCategories.value.length > 0) {
    filtered = filtered.filter(article =>
      selectedCategories.value.includes(article.category)
    )
  }

  // Read time filter
  if (selectedReadTimes.value.length > 0) {
    filtered = filtered.filter(article => {
      return selectedReadTimes.value.some(rangeLabel => {
        const range = readTimeRanges.find(r => r.label === rangeLabel)
        return range && article.readTime >= range.min && article.readTime <= range.max
      })
    })
  }

  // Citations filter
  if (minCitations.value > 0) {
    filtered = filtered.filter(article =>
      (article.citations || 0) >= minCitations.value
    )
  }

  // Engagement filters
  if (filters.value.highlyRated) {
    filtered = filtered.filter(article => {
      const total = (article.reactions?.helpful || 0) +
        (article.reactions?.insightful || 0) +
        (article.reactions?.interesting || 0)
      return total >= 200
    })
  }

  if (filters.value.widelyCited) {
    filtered = filtered.filter(article =>
      (article.citations || 0) >= 40
    )
  }

  // Natural language search (simple keyword matching for demo)
  if (nlQuery.value.trim()) {
    const query = nlQuery.value.toLowerCase()
    filtered = filtered.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.excerpt.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query)
    )
  }

  return filtered
})

const sortedArticles = computed(() => {
  const sorted = [...filteredArticles.value]

  switch (sortBy.value) {
    case 'citations':
      return sorted.sort((a, b) => (b.citations || 0) - (a.citations || 0))
    case 'reactions':
      return sorted.sort((a, b) => {
        const totalA = (a.reactions?.helpful || 0) + (a.reactions?.insightful || 0) + (a.reactions?.interesting || 0)
        const totalB = (b.reactions?.helpful || 0) + (b.reactions?.insightful || 0) + (b.reactions?.interesting || 0)
        return totalB - totalA
      })
    case 'readTime':
      return sorted.sort((a, b) => a.readTime - b.readTime)
    case 'recent':
      return sorted.reverse()
    default: // relevance
      return sorted
  }
})

const paginatedArticles = computed(() => {
  const start = (page.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return sortedArticles.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(sortedArticles.value.length / itemsPerPage)
})

// Methods
const getCategoryCount = (category: string) => {
  return allArticles.filter(a => a.category === category).length
}

const performNLSearch = () => {
  // In a real app, this would call an AI search API
  console.log('Performing NL search:', nlQuery.value)
}

const resetFilters = () => {
  selectedCategories.value = []
  selectedReadTimes.value = []
  minCitations.value = 0
  filters.value.highlyRated = false
  filters.value.widelyCited = false
  nlQuery.value = ""
  sortBy.value = "relevance"
  page.value = 1
}

// Reset to page 1 when filters or sort changes
watch([selectedCategories, selectedReadTimes, minCitations, filters, sortBy, nlQuery], () => {
  page.value = 1
}, { deep: true })

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
  setupObserver()
})

// Re-setup observer when page changes
watch(page, () => {
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
