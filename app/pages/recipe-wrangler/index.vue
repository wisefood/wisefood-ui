<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <!-- Header -->
    <div class="border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div class="flex items-center justify-between">
          <NuxtLink
            to="/dashboard"
            class="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
            <span class="text-sm font-medium hidden sm:inline">{{ t('recipeWrangler.backToDashboard') }}</span>
          </NuxtLink>
        </div>
        <div class="mt-3 sm:mt-4">
          <h1 class="text-2xl sm:text-3xl md:text-4xl font-light text-zinc-900 dark:text-white tracking-tight">
            <span class="font-serif italic text-brandg-500 dark:text-brandg-400 text-3xl sm:text-4xl md:text-5xl">RecipeWrangler</span>
          </h1>
          <p class="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-300 font-light">
            {{ t('recipeWrangler.subtitle') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
      <!-- Search Bar -->
      <section class="mb-8 sm:mb-12">
        <div class="max-w-2xl mx-auto">
          <div class="relative">
            <UIcon name="i-lucide-search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('recipeWrangler.search.placeholder')"
              class="w-full pl-11 sm:pl-12 pr-12 sm:pr-16 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brandg-500 text-sm sm:text-base"
              @keypress="handleSearchKeypress"
            />
            <button
              @click="performSearch"
              :disabled="loading"
              class="absolute right-2 top-1/2 -translate-y-1/2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-brandg-500 hover:bg-brandg-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white text-sm font-medium transition-colors disabled:cursor-not-allowed"
            >
              <UIcon v-if="loading" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              <UIcon v-else name="i-lucide-search" class="w-4 h-4" />
            </button>
          </div>

          <!-- Recent Searches -->
          <div v-if="recipeStore.searchHistory.length > 0 && !searchQuery" class="mt-3 flex flex-wrap gap-2">
            <span class="text-xs text-zinc-500 dark:text-zinc-400 w-full mb-1">{{ t('recipeWrangler.search.recentSearches') }}</span>
            <button
              v-for="query in recipeStore.recentSearches.slice(0, 5)"
              :key="query"
              @click="searchQuery = query; performSearch()"
              class="px-3 py-1 rounded-full text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-brandg-600 dark:hover:text-brandg-400 transition-colors"
            >
              {{ query }}
            </button>
          </div>
        </div>
      </section>

      <!-- Filters Sidebar Toggle -->
      <section class="mb-6 sm:mb-8">
        <div class="flex items-center justify-between">
          <h2 class="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white">
            {{ t('recipeWrangler.filters.title') }}
          </h2>
          <button
            @click="showFilters = !showFilters"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm"
          >
            <UIcon name="i-lucide-sliders" class="w-4 h-4" />
            <span>{{ showFilters ? t('recipeWrangler.filters.hide') : t('recipeWrangler.filters.show') }}</span>
            <UIcon
              :name="showFilters ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="w-4 h-4"
            />
          </button>
        </div>

        <!-- Filters Component -->
        <div v-if="showFilters" class="mt-4">
          <RecipesRecipeFilters
            @filter-change="handleFilterChange"
            @quick-filter="handleQuickFilter"
            @sort-change="handleFilterChange"
          />
        </div>
      </section>

      <!-- Recipe Grid -->
      <section class="mb-12 sm:mb-16">
        <div class="flex items-center justify-between mb-6 sm:mb-8">
          <div class="flex items-center gap-3">
            <h2 class="text-2xl sm:text-3xl font-serif font-semibold text-zinc-900 dark:text-white">
              <span v-if="loading">{{ t('recipeWrangler.results.searching') }}</span>
              <span v-else-if="error">{{ t('recipeWrangler.results.error') }}</span>
              <span v-else-if="!initialLoadComplete">{{ t('recipeWrangler.results.loading') }}</span>
              <span v-else>{{ t('recipeWrangler.results.found', recipesCount) }}</span>
            </h2>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="recipeStore.compareCount >= 2"
              @click="navigateToCompare"
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-brandg-600 dark:bg-brandg-500 text-white hover:bg-brandg-700 dark:hover:bg-brandg-600 transition-colors text-sm font-medium shadow-md"
            >
              <UIcon name="i-lucide-git-compare" class="w-4 h-4" />
              <span>{{ t('recipeWrangler.compare') }} ({{ recipeStore.compareCount }})</span>
            </button>
            <button
              v-if="recipeStore.favorites.length > 0"
              @click="() => {}"
              class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm"
            >
              <UIcon name="i-lucide-heart" class="w-4 h-4 text-red-500" />
              <span class="hidden sm:inline">{{ recipeStore.favorites.length }}</span>
            </button>
          </div>
        </div>

        <!-- Error State -->
        <div
          v-if="error"
          class="p-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center"
        >
          <UIcon name="i-lucide-alert-circle" class="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 class="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
            {{ t('recipeWrangler.results.error') }}
          </h3>
          <p class="text-sm text-red-600 dark:text-red-300 mb-4">{{ error }}</p>
          <UButton
            @click="performSearch"
            color="primary"
            variant="outline"
          >
            {{ t('recipeWrangler.results.tryAgain') }}
          </UButton>
        </div>

        <!-- Loading State -->
        <div v-else-if="loading" class="space-y-8">
          <!-- Cooking Animation - Clean, minimal container -->
          <div class="relative py-12 sm:py-16">
            <!-- SVG Cooking Animation Component -->
            <div class="flex items-center justify-center">
              <RecipesCookingAnimation />
            </div>

            <!-- Time estimate - subtle -->
            <div class="text-center mt-6">
              <p class="text-xs text-stone-400 dark:text-stone-500 tracking-wide">
                {{ t('recipeWrangler.loadingHint') }}
              </p>
            </div>
          </div>

          <!-- Skeleton Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div
              v-for="i in 6"
              :key="`skeleton-${i}`"
              class="rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden animate-pulse"
            >
              <div class="aspect-[4/3] bg-zinc-200 dark:bg-zinc-700"></div>
              <div class="p-4 space-y-3">
                <div class="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
                <div class="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-full"></div>
                <div class="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6"></div>
                <div class="flex gap-2">
                  <div class="h-6 bg-zinc-200 dark:bg-zinc-700 rounded flex-1"></div>
                  <div class="h-6 bg-zinc-200 dark:bg-zinc-700 rounded flex-1"></div>
                  <div class="h-6 bg-zinc-200 dark:bg-zinc-700 rounded flex-1"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!hasRecipes && initialLoadComplete"
          class="text-center py-12"
        >
          <UIcon name="i-lucide-search-x" class="w-16 h-16 text-zinc-400 mx-auto mb-4" />
          <h3 class="text-xl font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            {{ t('recipeWrangler.results.noResults') }}
          </h3>
          <p class="text-zinc-500 dark:text-zinc-400 mb-6">
            {{ t('recipeWrangler.results.noResultsMessage') }}
          </p>
        </div>

        <!-- Recipe Cards Grid -->
        <div
          v-else
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
        >
          <RecipesRecipeCard
            v-for="(recipe, index) in paginatedRecipes"
            :key="recipe.recipe_id || index"
            :recipe="recipe"
          />
        </div>

        <!-- Pagination -->
        <div v-if="hasRecipes && totalPages > 1" class="mt-8 sm:mt-12 flex justify-center">
          <nav class="flex items-center gap-2" :aria-label="t('recipeWrangler.pagination')">
            <!-- Previous Button -->
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :aria-label="t('recipeWrangler.previousPage')"
            >
              <UIcon name="i-lucide-chevron-left" class="w-5 h-5" />
            </button>

            <!-- Page Numbers -->
            <div class="flex items-center gap-1">
              <button
                v-for="page in Math.min(totalPages, 5)"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'px-4 py-2 rounded-lg border transition-colors',
                  page === currentPage
                    ? 'border-brandg-500 bg-brandg-500 text-white'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                ]"
              >
                {{ page }}
              </button>
              <span v-if="totalPages > 5" class="px-2 text-zinc-500">...</span>
              <button
                v-if="totalPages > 5 && currentPage < totalPages"
                @click="goToPage(totalPages)"
                :class="[
                  'px-4 py-2 rounded-lg border transition-colors',
                  totalPages === currentPage
                    ? 'border-brandg-500 bg-brandg-500 text-white'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                ]"
              >
                {{ totalPages }}
              </button>
            </div>

            <!-- Next Button -->
            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :aria-label="t('recipeWrangler.nextPage')"
            >
              <UIcon name="i-lucide-chevron-right" class="w-5 h-5" />
            </button>
          </nav>
        </div>
      </section>

      <!-- Categories Section -->
      <section class="bg-gradient-to-br from-brandg-50 to-brandg-100 dark:from-brandg-900/20 dark:to-brandg-800/20 border border-brandg-200 dark:border-brandg-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12">
        <h2 class="text-2xl sm:text-3xl font-serif font-semibold mb-6 sm:mb-8 text-zinc-900 dark:text-white">{{ t('recipeWrangler.categories.title') }}</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          <button
            v-for="category in categories"
            :key="category.name"
            @click="browseCategory(category)"
            :disabled="loading"
            class="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-white dark:hover:bg-zinc-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-brandg-100 dark:bg-brandg-900/50 flex items-center justify-center mb-2 sm:mb-3 mx-auto">
              <UIcon :name="category.icon" class="w-5 h-5 sm:w-6 sm:h-6 text-brandg-600 dark:text-brandg-400" />
            </div>
            <h3 class="font-semibold text-zinc-900 dark:text-white text-xs sm:text-sm">{{ category.name }}</h3>
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRecipes } from '~/composables/useRecipes'
import { useRecipeStore } from '~/stores/recipe'
import type { RecipeParamSearchParams } from '~/services/recipeApi'

const { t } = useI18n()

definePageMeta({
  middleware: ['auth', 'profile']
})

useHead({
  title: computed(() => t('recipeWrangler.title'))
})

useSeoMeta({
  description: computed(() => t('recipeWrangler.subtitle'))
})

// ============================================================================
// Composables & Stores
// ============================================================================
const { recipes, loading, error, searchRecipes, searchRecipesByParams, fetchRecipesByCategory, clearError } = useRecipes()
const recipeStore = useRecipeStore()

// ============================================================================
// State
// ============================================================================
const searchQuery = ref('')
const showFilters = ref(false)
const initialLoadComplete = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10
const paramSearchLimit = 20

const allergenAliasToBackend: Record<string, string> = {
  peanut: 'peanut',
  peanuts: 'peanut',
  'tree nut': 'tree_nut',
  'tree nuts': 'tree_nut',
  tree_nut: 'tree_nut',
  dairy: 'milk',
  milk: 'milk',
  lactose: 'milk',
  egg: 'egg',
  eggs: 'egg',
  soy: 'soy',
  wheat: 'wheat',
  gluten: 'wheat',
  fish: 'fish',
  shellfish: 'crustacean_shellfish',
  crustacean_shellfish: 'crustacean_shellfish',
  sesame: 'sesame'
}

const backendTagMatchers: Array<{ pattern: RegExp; tag: string }> = [
  { pattern: /\bvegetarian\b/, tag: 'vegetarian' },
  { pattern: /\bvegan\b/, tag: 'vegan' },
  { pattern: /\bgluten[ -]?free\b/, tag: 'gluten-free' },
  { pattern: /\bdairy[ -]?free\b/, tag: 'dairy_free' },
  { pattern: /\bnut[ -]?free\b/, tag: 'nut_free' },
  { pattern: /\blow[ -]?carb\b/, tag: 'low-carb' },
  { pattern: /\blow[ -]?fat\b/, tag: 'low-fat' },
  { pattern: /\bhigh[ -]?protein\b/, tag: 'high-protein' },
  { pattern: /\bbreakfast\b/, tag: 'breakfast' },
  { pattern: /\b(beverage|beverages|drink|drinks)\b/, tag: 'beverages' },
  { pattern: /\b(snack|snacks)\b/, tag: 'snacks' },
  { pattern: /\b(dessert|desserts)\b/, tag: 'desserts' },
  { pattern: /\b(main dish|main-dish|main course)\b/, tag: 'main-dish' },
  { pattern: /\b(5 ingredients or less|five ingredients or less|few ingredients)\b/, tag: '5_ingredients_or_less' },
  { pattern: /\b(30 minutes or less|30 minute meals?|half hour meals?)\b/, tag: '30_minutes_or_less' },
  { pattern: /\blow[ -]?calorie\b/, tag: 'low-fat' },
  { pattern: /\bhealthy\b/, tag: 'low-fat' }
]

const quickFilterConfigs: Record<string, { query: string; params: RecipeParamSearchParams }> = {
  quick: {
    query: 'quick recipes under 30 minutes',
    params: {
      diet_tags: ['30_minutes_or_less'],
      max_duration_minutes: 30
    }
  },
  healthy: {
    query: 'healthy nutritious recipes',
    params: { diet_tags: ['low-fat'] }
  },
  vegetarian: {
    query: 'vegetarian recipes',
    params: { diet_tags: ['vegetarian'] }
  },
  vegan: {
    query: 'vegan recipes',
    params: { diet_tags: ['vegan'] }
  },
  'low-calorie': {
    query: 'low calorie recipes',
    params: { diet_tags: ['low-fat'] }
  }
}

// ============================================================================
// Categories
// ============================================================================
const categories = computed(() => [
  { name: t('recipeWrangler.categories.pasta'), icon: 'i-lucide-soup', query: 'pasta' },
  { name: t('recipeWrangler.categories.salad'), icon: 'i-lucide-salad', query: 'salad' },
  { name: t('recipeWrangler.categories.soup'), icon: 'i-lucide-soup', query: 'soup' },
  { name: t('recipeWrangler.categories.breakfast'), icon: 'i-lucide-sunrise', query: 'breakfast' },
  { name: t('recipeWrangler.categories.dessert'), icon: 'i-lucide-cake', query: 'dessert' },
  { name: t('recipeWrangler.categories.snacks'), icon: 'i-lucide-cookie', query: 'snacks' },
  { name: t('recipeWrangler.categories.beverages'), icon: 'i-lucide-coffee', query: 'beverages' },
  { name: t('recipeWrangler.categories.quickMeals'), icon: 'i-lucide-zap', query: 'quick recipes' },
])

// ============================================================================
// Computed
// ============================================================================
const recipesCount = computed(() => recipes.value?.length || 0)

const hasRecipes = computed(() => recipesCount.value > 0)

const totalPages = computed(() => Math.ceil(recipesCount.value / itemsPerPage))

const paginatedRecipes = computed(() => {
  if (!recipes.value) return []
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return recipes.value.slice(start, end)
})

const uniqueStrings = (values: string[]): string[] => {
  return Array.from(
    new Set(
      values
        .map(value => value.trim())
        .filter(value => value.length > 0)
    )
  )
}

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const normalizeBackendAllergen = (allergen: string): string => {
  const normalized = allergen.trim().toLowerCase()
  return allergenAliasToBackend[normalized] || normalized.replace(/\s+/g, '_')
}

const toBackendAllergenList = (allergens: string[]): string[] => {
  return uniqueStrings(allergens.map(allergen => normalizeBackendAllergen(allergen)))
}

const hasParamFilters = (params: RecipeParamSearchParams): boolean => {
  return Boolean(
    (params.include_ingredients && params.include_ingredients.length > 0) ||
    (params.exclude_ingredients && params.exclude_ingredients.length > 0) ||
    (params.exclude_allergens && params.exclude_allergens.length > 0) ||
    (params.diet_tags && params.diet_tags.length > 0) ||
    params.max_duration_minutes
  )
}

const parseParametricSearchQuery = (query: string): RecipeParamSearchParams | null => {
  const normalized = query.toLowerCase().trim()
  if (!normalized) return null

  const params: RecipeParamSearchParams = {}
  const dietTags: string[] = []
  const excludeAllergens: string[] = []

  const durationMatch = normalized.match(/\b(?:under|less than|max(?:imum)?|within)\s+(\d{1,3})\s*(?:min|mins|minute|minutes)\b/)
  if (durationMatch) {
    const maxDuration = Number(durationMatch[1])
    params.max_duration_minutes = maxDuration
    if (maxDuration <= 30) {
      dietTags.push('30_minutes_or_less')
    }
  } else if (/\bquick\b/.test(normalized)) {
    params.max_duration_minutes = 30
    dietTags.push('30_minutes_or_less')
  }

  backendTagMatchers.forEach(({ pattern, tag }) => {
    if (pattern.test(normalized)) {
      dietTags.push(tag)
    }
  })

  const exclusionContext = /\b(without|exclude|excluding|free from|no)\b/.test(normalized)
  if (exclusionContext) {
    Object.keys(allergenAliasToBackend).forEach(allergenAlias => {
      const allergenRegex = new RegExp(`\\b${escapeRegExp(allergenAlias)}\\b`)
      if (allergenRegex.test(normalized)) {
        excludeAllergens.push(allergenAlias)
      }
    })
  }

  if (dietTags.length > 0) {
    params.diet_tags = uniqueStrings(dietTags)
  }

  if (excludeAllergens.length > 0) {
    params.exclude_allergens = toBackendAllergenList(excludeAllergens)
  }

  if (!hasParamFilters(params)) {
    return null
  }

  const isQuestionLike = /\?|^\s*(what|how|why|which|who)\b/.test(normalized)
  if (isQuestionLike) {
    return null
  }

  return params
}

const buildParamSearchWithAllergens = (
  params: RecipeParamSearchParams = {}
): RecipeParamSearchParams => {
  const mergedAllergens = toBackendAllergenList([
    ...(params.exclude_allergens || []),
    ...recipeStore.excludedAllergens
  ])

  return {
    ...params,
    exclude_allergens: mergedAllergens.length > 0 ? mergedAllergens : undefined,
    limit: paramSearchLimit
  }
}

// ============================================================================
// Methods
// ============================================================================

/**
 * Search recipes with natural language query
 */
const performSearch = async () => {
  try {
    clearError()
    resetPagination()
    const trimmedQuery = searchQuery.value.trim()

    if (!trimmedQuery) {
      await searchRecipesByParams(buildParamSearchWithAllergens())
      return
    }

    const parametricQuery = parseParametricSearchQuery(trimmedQuery)
    if (parametricQuery) {
      await searchRecipesByParams(buildParamSearchWithAllergens(parametricQuery))
    } else {
      const backendAllergens = toBackendAllergenList(recipeStore.excludedAllergens)
      await searchRecipes({
        question: trimmedQuery,
        exclude_allergens: backendAllergens.length > 0 ? backendAllergens : undefined
      })
    }

    recipeStore.addSearchQuery(trimmedQuery)
  } catch (err) {
    console.error('Search failed:', err)
  }
}

/**
 * Handle search on Enter key
 */
const handleSearchKeypress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    performSearch()
  }
}

/**
 * Reset to first page
 */
const resetPagination = () => {
  currentPage.value = 1
}

/**
 * Change page
 */
const goToPage = (page: number) => {
  currentPage.value = page
  // Scroll to top of results
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/**
 * Browse recipes by category
 */
const browseCategory = async (category: { name: string; query: string }) => {
  try {
    clearError()
    resetPagination()
    searchQuery.value = category.query
    const backendAllergens = toBackendAllergenList(recipeStore.excludedAllergens)

    await fetchRecipesByCategory(
      category.query,
      backendAllergens.length > 0 ? backendAllergens : undefined
    )
  } catch (err) {
    console.error('Failed to load category:', err)
  }
}

/**
 * Handle filter changes
 */
const handleFilterChange = async () => {
  // Re-run the last search with updated allergen filters
  resetPagination()
  await performSearch()
}

/**
 * Handle quick filter selection
 */
const handleQuickFilter = async (filterType: string) => {
  try {
    clearError()
    resetPagination()
    const config = quickFilterConfigs[filterType]
    if (!config) return

    searchQuery.value = config.query
    await searchRecipesByParams(buildParamSearchWithAllergens(config.params))
    recipeStore.addSearchQuery(config.query)
  } catch (err) {
    console.error('Quick filter failed:', err)
  }
}

/**
 * Navigate to comparison page
 */
const navigateToCompare = () => {
  navigateTo('/recipe-wrangler/compare')
}

// ============================================================================
// Lifecycle
// ============================================================================
onMounted(async () => {
  // Initialize store
  recipeStore.initialize()

  // Load initial recipes using deterministic parametric search
  try {
    await performSearch()
    initialLoadComplete.value = true
  } catch (err) {
    console.error('Failed to load initial recipes:', err)
    initialLoadComplete.value = true
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}
</style>
