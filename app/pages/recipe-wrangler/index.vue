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
            <span class="text-sm font-medium hidden sm:inline">Back to Dashboard</span>
          </NuxtLink>
        </div>
        <div class="mt-3 sm:mt-4">
          <h1 class="text-2xl sm:text-3xl md:text-4xl font-light text-zinc-900 dark:text-white tracking-tight">
            <span class="font-serif italic text-brandg-500 dark:text-brandg-400 text-3xl sm:text-4xl md:text-5xl">RecipeWrangler</span>
          </h1>
          <p class="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-300 font-light">
            Discover personalized recipes tailored to your nutritional goals
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
              placeholder="Ask for recipes (e.g., 'pasta recipes', 'quick vegan meals')..."
              class="w-full pl-11 sm:pl-12 pr-12 sm:pr-16 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brandg-500 text-sm sm:text-base"
              @keypress="handleSearchKeypress"
            />
            <button
              @click="performSearch"
              :disabled="!searchQuery.trim() || loading"
              class="absolute right-2 top-1/2 -translate-y-1/2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-brandg-500 hover:bg-brandg-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white text-sm font-medium transition-colors disabled:cursor-not-allowed"
            >
              <UIcon v-if="loading" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              <UIcon v-else name="i-lucide-search" class="w-4 h-4" />
            </button>
          </div>

          <!-- Recent Searches -->
          <div v-if="recipeStore.searchHistory.length > 0 && !searchQuery" class="mt-3 flex flex-wrap gap-2">
            <span class="text-xs text-zinc-500 dark:text-zinc-400 w-full mb-1">Recent searches:</span>
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
            Filters & Preferences
          </h2>
          <button
            @click="showFilters = !showFilters"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm"
          >
            <UIcon name="i-lucide-sliders" class="w-4 h-4" />
            <span>{{ showFilters ? 'Hide' : 'Show' }} Filters</span>
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
              <span v-if="loading">Searching...</span>
              <span v-else-if="error">Error loading recipes</span>
              <span v-else-if="!initialLoadComplete">Loading recipes...</span>
              <span v-else>{{ recipesCount }} Recipe{{ recipesCount !== 1 ? 's' : '' }} Found</span>
            </h2>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="recipeStore.compareCount >= 2"
              @click="navigateToCompare"
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-brandg-600 dark:bg-brandg-500 text-white hover:bg-brandg-700 dark:hover:bg-brandg-600 transition-colors text-sm font-medium shadow-md"
            >
              <UIcon name="i-lucide-git-compare" class="w-4 h-4" />
              <span>Compare ({{ recipeStore.compareCount }})</span>
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
            Failed to load recipes
          </h3>
          <p class="text-sm text-red-600 dark:text-red-300 mb-4">{{ error }}</p>
          <UButton
            @click="performSearch"
            color="primary"
            variant="outline"
          >
            Try Again
          </UButton>
        </div>

        <!-- Loading State -->
        <div v-else-if="loading" class="space-y-6">
          <!-- Cooking Animation -->
          <div
            ref="cookingContainer"
            class="relative p-8 sm:p-12 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800 overflow-hidden"
            @mousemove="handleMouseMove"
            @mouseleave="handleMouseLeave"
          >
            <!-- Animated Background Elements -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                v-for="i in 8"
                :key="`bubble-${i}`"
                :class="bubbleClasses[i % 3]"
                :style="{
                  left: `${(i * 12) % 100}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${3 + (i % 3)}s`
                }"
              />
            </div>

            <!-- Cooking Scene -->
            <div class="relative z-10 flex flex-col items-center justify-center min-h-[300px]">
              <!-- Chef's Hat (follows mouse) -->
              <div
                class="chef-hat mb-4 transition-transform duration-300 ease-out"
                :style="hatStyle"
              >
                <div class="text-6xl sm:text-7xl">👨‍🍳</div>
              </div>

              <!-- Cooking Pot with Steam -->
              <div class="relative mb-6">
                <!-- Steam particles -->
                <div class="absolute -top-12 left-1/2 -translate-x-1/2">
                  <div
                    v-for="j in 3"
                    :key="`steam-${j}`"
                    class="steam-particle"
                    :style="{
                      left: `${(j - 2) * 15}px`,
                      animationDelay: `${j * 0.4}s`
                    }"
                  >
                    💨
                  </div>
                </div>

                <!-- Pot -->
                <div class="text-6xl sm:text-7xl cooking-pot">
                  🍲
                </div>

                <!-- Ingredients flying in -->
                <div class="absolute inset-0">
                  <div
                    v-for="(ingredient, idx) in floatingIngredients"
                    :key="`ingredient-${idx}`"
                    class="ingredient-float"
                    :style="{
                      left: `${ingredient.x}px`,
                      top: `${ingredient.y}px`,
                      animationDelay: `${idx * 0.5}s`
                    }"
                  >
                    {{ ingredient.emoji }}
                  </div>
                </div>
              </div>

              <!-- Loading Text -->
              <div class="text-center space-y-3">
                <h3 class="text-xl sm:text-2xl font-bold text-orange-800 dark:text-orange-300 flex items-center justify-center gap-2">
                  <span class="animate-pulse">Cooking up</span>
                  <span class="cooking-text">delicious recipes</span>
                  <span class="dots">
                    <span class="dot">.</span>
                    <span class="dot">.</span>
                    <span class="dot">.</span>
                  </span>
                </h3>
                <p class="text-sm sm:text-base text-orange-700 dark:text-orange-400">
                  Stirring ingredients and analyzing nutrition
                </p>
                <p class="text-xs text-orange-600 dark:text-orange-500">
                  This may take up to 60 seconds
                </p>
              </div>

              <!-- Progress hints -->
              <div class="mt-6 flex gap-2">
                <div class="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style="animation-delay: 0s"></div>
                <div class="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style="animation-delay: 0.4s"></div>
              </div>
            </div>

            <!-- Interactive hint -->
            <div class="absolute bottom-4 right-4 text-xs text-orange-500 dark:text-orange-400 opacity-70">
              Move your cursor around! 🖱️
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
            No recipes found
          </h3>
          <p class="text-zinc-500 dark:text-zinc-400 mb-6">
            Try adjusting your search or browse our categories below
          </p>
        </div>

        <!-- Recipe Cards Grid -->
        <div
          v-else
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
        >
          <RecipesRecipeCard
            v-for="(recipe, index) in paginatedRecipes"
            :key="recipe.recipe_id"
            :recipe="recipe"
          />
        </div>

        <!-- Pagination -->
        <div v-if="hasRecipes && totalPages > 1" class="mt-8 sm:mt-12 flex justify-center">
          <nav class="flex items-center gap-2" aria-label="Pagination">
            <!-- Previous Button -->
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
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
              aria-label="Next page"
            >
              <UIcon name="i-lucide-chevron-right" class="w-5 h-5" />
            </button>
          </nav>
        </div>
      </section>

      <!-- Categories Section -->
      <section class="bg-gradient-to-br from-brandg-50 to-brandg-100 dark:from-brandg-900/20 dark:to-brandg-800/20 border border-brandg-200 dark:border-brandg-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12">
        <h2 class="text-2xl sm:text-3xl font-serif font-semibold mb-6 sm:mb-8 text-zinc-900 dark:text-white">Browse by Category</h2>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRecipes } from '~/composables/useRecipes'
import { useRecipeStore } from '~/stores/recipe'
import type { RecipeSearchResult } from '~/services/recipeApi'

definePageMeta({
  middleware: ['auth', 'profile']
})

useHead({
  title: 'RecipeWrangler'
})

useSeoMeta({
  description: 'Discover personalized recipes tailored to your nutritional goals and environmental impact'
})

// ============================================================================
// Composables & Stores
// ============================================================================
const { recipes, loading, error, searchRecipes, fetchRecipesByCategory, clearError } = useRecipes()
const recipeStore = useRecipeStore()

// ============================================================================
// State
// ============================================================================
const searchQuery = ref('')
const showFilters = ref(false)
const initialLoadComplete = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10

// Cooking animation state
const cookingContainer = ref<HTMLElement | null>(null)
const mouseX = ref(0)
const mouseY = ref(0)
const hatRotateX = ref(0)
const hatRotateY = ref(0)

// Bubble animation classes
const bubbleClasses = [
  'bubble bubble-1',
  'bubble bubble-2',
  'bubble bubble-3'
]

// Floating ingredients
const floatingIngredients = [
  { emoji: '🥕', x: -60, y: -20 },
  { emoji: '🍅', x: 60, y: -30 },
  { emoji: '🧄', x: -50, y: 20 },
  { emoji: '🧅', x: 70, y: 10 },
  { emoji: '🌿', x: -70, y: -10 },
  { emoji: '🥬', x: 50, y: -40 }
]

// ============================================================================
// Categories
// ============================================================================
const categories = [
  { name: "Pasta", icon: "i-lucide-soup", query: "pasta" },
  { name: "Salad", icon: "i-lucide-salad", query: "salad" },
  { name: "Soup", icon: "i-lucide-soup", query: "soup" },
  { name: "Breakfast", icon: "i-lucide-sunrise", query: "breakfast" },
  { name: "Dessert", icon: "i-lucide-cake", query: "dessert" },
  { name: "Snacks", icon: "i-lucide-cookie", query: "snacks" },
  { name: "Beverages", icon: "i-lucide-coffee", query: "beverages" },
  { name: "Quick Meals", icon: "i-lucide-zap", query: "quick recipes" },
]

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

// ============================================================================
// Methods
// ============================================================================

/**
 * Search recipes with natural language query
 */
const performSearch = async () => {
  if (!searchQuery.value || searchQuery.value.trim() === '') return

  try {
    clearError()
    resetPagination()
    const excludeAllergens = recipeStore.excludedAllergens

    await searchRecipes({
      question: searchQuery.value,
      exclude_allergens: excludeAllergens.length > 0 ? excludeAllergens : undefined
    })

    recipeStore.addSearchQuery(searchQuery.value)
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
    const excludeAllergens = recipeStore.excludedAllergens

    await fetchRecipesByCategory(
      category.query,
      excludeAllergens.length > 0 ? excludeAllergens : undefined
    )
  } catch (err) {
    console.error('Failed to load category:', err)
  }
}

/**
 * Handle filter changes
 */
const handleFilterChange = () => {
  // Re-run the last search with updated allergen filters
  resetPagination()
  if (searchQuery.value) {
    performSearch()
  }
}

/**
 * Handle quick filter selection
 */
const handleQuickFilter = async (filterType: string) => {
  try {
    clearError()
    resetPagination()
    const excludeAllergens = recipeStore.excludedAllergens

    let query = ''
    switch (filterType) {
      case 'quick':
        query = 'quick recipes under 30 minutes'
        break
      case 'healthy':
        query = 'healthy nutritious recipes'
        break
      case 'vegetarian':
        query = 'vegetarian recipes'
        break
      case 'vegan':
        query = 'vegan recipes'
        break
      case 'low-calorie':
        query = 'low calorie recipes'
        break
      default:
        return
    }

    searchQuery.value = query
    await searchRecipes({
      question: query,
      exclude_allergens: excludeAllergens.length > 0 ? excludeAllergens : undefined
    })
  } catch (err) {
    console.error('Quick filter failed:', err)
  }
}

/**
 * Handle mouse movement for cooking animation
 */
const handleMouseMove = (event: MouseEvent) => {
  if (!cookingContainer.value) return

  const rect = cookingContainer.value.getBoundingClientRect()
  const centerX = rect.width / 2
  const centerY = rect.height / 2

  mouseX.value = event.clientX - rect.left
  mouseY.value = event.clientY - rect.top

  // Calculate rotation based on mouse position
  const deltaX = (mouseX.value - centerX) / centerX
  const deltaY = (mouseY.value - centerY) / centerY

  hatRotateY.value = deltaX * 20 // Max 20deg rotation
  hatRotateX.value = -deltaY * 15 // Max 15deg rotation
}

const handleMouseLeave = () => {
  hatRotateX.value = 0
  hatRotateY.value = 0
}

const hatStyle = computed(() => ({
  transform: `perspective(1000px) rotateX(${hatRotateX.value}deg) rotateY(${hatRotateY.value}deg)`
}))

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

  // Load initial recipes (pasta as default)
  try {
    await fetchRecipesByCategory('pasta', recipeStore.excludedAllergens)
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

/* ============================================================================ */
/* Cooking Animation Styles */
/* ============================================================================ */

/* Bubbles floating up */
.bubble {
  position: absolute;
  bottom: -20px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  opacity: 0.3;
  animation: float-up 4s infinite ease-in-out;
}

.bubble-1 {
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(255, 200, 100, 0.3));
}

.bubble-2 {
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(255, 150, 50, 0.3));
  width: 15px;
  height: 15px;
}

.bubble-3 {
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(255, 180, 80, 0.3));
  width: 25px;
  height: 25px;
}

@keyframes float-up {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 0.3;
  }
  90% {
    opacity: 0.3;
  }
  100% {
    transform: translateY(-400px) scale(1.5);
    opacity: 0;
  }
}

/* Chef hat animation */
.chef-hat {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
  animation: bob 2s ease-in-out infinite;
}

@keyframes bob {
  0%, 100% {
    transform: translateY(0) perspective(1000px);
  }
  50% {
    transform: translateY(-10px) perspective(1000px);
  }
}

/* Cooking pot wobble */
.cooking-pot {
  display: inline-block;
  animation: wobble 3s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
}

@keyframes wobble {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-3deg);
  }
  75% {
    transform: rotate(3deg);
  }
}

/* Steam particles */
.steam-particle {
  position: absolute;
  font-size: 24px;
  animation: steam-rise 2s ease-out infinite;
  opacity: 0;
}

@keyframes steam-rise {
  0% {
    transform: translateY(0) scale(0.5);
    opacity: 0;
  }
  20% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(-60px) scale(1.2);
    opacity: 0;
  }
}

/* Floating ingredients */
.ingredient-float {
  position: absolute;
  font-size: 32px;
  animation: ingredient-spin 3s ease-in-out infinite;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

@keyframes ingredient-spin {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  50% {
    transform: translate(20px, -30px) rotate(180deg) scale(1.2);
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translate(0, 0) rotate(360deg) scale(1);
    opacity: 0;
  }
}

/* Cooking text shimmer */
.cooking-text {
  background: linear-gradient(
    90deg,
    #f97316 0%,
    #fb923c 25%,
    #fbbf24 50%,
    #fb923c 75%,
    #f97316 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 3s linear infinite;
}

@keyframes shimmer {
  to {
    background-position: 200% center;
  }
}

/* Animated dots */
.dots {
  display: inline-flex;
  gap: 2px;
}

.dot {
  animation: dot-pulse 1.4s ease-in-out infinite;
}

.dot:nth-child(1) {
  animation-delay: 0s;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dot-pulse {
  0%, 60%, 100% {
    opacity: 1;
  }
  30% {
    opacity: 0.3;
  }
}
</style>
