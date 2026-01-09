<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
    <!-- Header -->
    <div class="border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div class="flex items-center justify-between">
          <NuxtLink
            to="/dashboard"
            class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
            <span class="text-sm font-medium hidden sm:inline">Back to Dashboard</span>
          </NuxtLink>
        </div>
        <div class="mt-3 sm:mt-4">
          <h1 class="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 dark:text-white tracking-tight">
            <span class="font-serif italic text-green-600 dark:text-green-400 text-3xl sm:text-4xl md:text-5xl">RecipeWrangler</span>
          </h1>
          <p class="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 font-light">
            Discover personalized recipes tailored to your nutritional goals
          </p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
      <!-- Recipe Analysis Tool -->
      <section class="mb-8 sm:mb-12 scroll-fade-in">
        <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
          <div class="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-sparkles" class="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">AI Recipe Analyzer</h2>
              <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-light">
                Paste any recipe URL or ingredients list to get instant nutritional analysis
              </p>
            </div>
          </div>

          <div class="space-y-3 sm:space-y-4">
            <textarea
              v-model="recipeInput"
              placeholder="Paste recipe URL, ingredients, or recipe text here..."
              rows="4"
              class="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base resize-none"
            ></textarea>

            <UButton
              @click="analyzeRecipe"
              :loading="analyzing"
              color="primary"
              size="lg"
              :disabled="!recipeInput.trim()"
              class="w-full sm:w-auto cursor-pointer"
              trailing-icon="i-lucide-wand-2"
            >
              {{ analyzing ? 'Analyzing...' : 'Analyze Recipe' }}
            </UButton>
          </div>

          <!-- Analysis Result -->
          <div v-if="analysisResult" class="mt-6 p-4 sm:p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h3 class="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-green-600" />
              Analysis Results
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
              <div class="p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Calories</p>
                <p class="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">{{ analysisResult.calories }}</p>
              </div>
              <div class="p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Protein</p>
                <p class="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">{{ analysisResult.protein }}g</p>
              </div>
              <div class="p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Carbs</p>
                <p class="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">{{ analysisResult.carbs }}g</p>
              </div>
              <div class="p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Fat</p>
                <p class="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">{{ analysisResult.fat }}g</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <UBadge v-for="tag in analysisResult.tags" :key="tag" color="green" variant="subtle">
                {{ tag }}
              </UBadge>
            </div>
          </div>
        </div>
      </section>

      <!-- Search Bar -->
      <section class="mb-8 sm:mb-12 scroll-fade-in" style="--delay: 0.1s">
        <div class="max-w-2xl mx-auto">
          <div class="relative">
            <UIcon name="i-lucide-search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search recipes by ingredient, cuisine, or dietary preference..."
              class="w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
            />
          </div>
        </div>
      </section>

      <!-- Filter Pills -->
      <section class="mb-8 sm:mb-12 scroll-fade-in" style="--delay: 0.2s">
        <h2 class="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">Quick Filters</h2>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="filter in filters"
            :key="filter"
            @click="toggleFilter(filter)"
            :class="[
              'px-4 sm:px-6 py-2 rounded-full font-medium transition-all duration-300 text-xs sm:text-sm',
              selectedFilters.includes(filter)
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-400'
            ]"
          >
            {{ filter }}
          </button>
        </div>
      </section>

      <!-- Recipe Grid -->
      <section class="mb-12 sm:mb-16">
        <div class="flex items-center justify-between mb-6 sm:mb-8">
          <h2 class="text-2xl sm:text-3xl font-serif font-semibold text-gray-900 dark:text-white">
            {{ filteredRecipes.length }} Recipes Found
          </h2>
          <select class="px-3 sm:px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option>Most Popular</option>
            <option>Quick First</option>
            <option>Low Calorie</option>
            <option>High Protein</option>
          </select>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div
            v-for="(recipe, index) in filteredRecipes"
            :key="recipe.id"
            class="scroll-fade-in group rounded-xl sm:rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            :style="{ '--delay': `${0.3 + index * 0.05}s` }"
          >
            <!-- Recipe Image -->
            <div class="relative h-40 sm:h-48 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40">
              <div class="absolute inset-0 flex items-center justify-center">
                <UIcon name="i-lucide-utensils" class="w-12 h-12 sm:w-16 sm:h-16 text-green-500 opacity-50" />
              </div>
              <div class="absolute top-2 sm:top-3 right-2 sm:right-3">
                <button
                  @click.stop="toggleFavorite(recipe.id)"
                  :class="[
                    'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center transition-all hover:scale-110',
                    favorites.includes(recipe.id) ? 'text-red-500' : 'text-gray-400'
                  ]"
                >
                  <UIcon :name="favorites.includes(recipe.id) ? 'i-lucide-heart-fill' : 'i-lucide-heart'" class="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              <div class="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 flex flex-wrap gap-1 sm:gap-2">
                <UBadge v-if="recipe.healthy" color="green" variant="solid" size="xs">Healthy</UBadge>
                <UBadge v-if="recipe.quick" color="yellow" variant="solid" size="xs">Quick</UBadge>
              </div>
            </div>

            <!-- Recipe Info -->
            <div class="p-4 sm:p-5">
              <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-2">
                {{ recipe.title }}
              </h3>
              <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-light mb-3 sm:mb-4 line-clamp-2">
                {{ recipe.description }}
              </p>

              <!-- Recipe Stats -->
              <div class="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide-clock" class="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{{ recipe.time }}m</span>
                </div>
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide-flame" class="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{{ recipe.calories }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide-user" class="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{{ recipe.servings }}</span>
                </div>
              </div>

              <!-- Action Button -->
              <UButton
                variant="outline"
                size="sm"
                class="w-full group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors text-xs sm:text-sm"
                trailing-icon="i-lucide-arrow-right"
              >
                View Recipe
              </UButton>
            </div>
          </div>
        </div>
      </section>

      <!-- Categories Section -->
      <section class="scroll-fade-in bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12" style="--delay: 0.5s">
        <h2 class="text-2xl sm:text-3xl font-serif font-semibold mb-6 sm:mb-8 text-gray-900 dark:text-white">Browse by Category</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          <div
            v-for="category in categories"
            :key="category.name"
            class="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center"
          >
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-2 sm:mb-3 mx-auto">
              <UIcon :name="category.icon" class="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">{{ category.name }}</h3>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'RecipeWrangler'
})

useSeoMeta({
  description: 'Discover personalized recipes tailored to your nutritional goals'
})

const searchQuery = ref('')
const selectedFilters = ref<string[]>([])
const recipeInput = ref('')
const analyzing = ref(false)
const analysisResult = ref<any>(null)
const favorites = ref<number[]>([])

const filters = ["Vegetarian", "Vegan", "Gluten-Free", "High Protein", "Low Carb", "Quick Meals"]

const recipes = [
  { id: 1, title: "Mediterranean Quinoa Bowl", description: "Fresh vegetables with quinoa and tahini", time: 25, calories: 420, servings: 2, healthy: true, quick: false, tags: ['vegetarian', 'high-protein'] },
  { id: 2, title: "Green Smoothie Power", description: "Spinach, banana, and protein blend", time: 5, calories: 180, servings: 1, healthy: true, quick: true, tags: ['vegan', 'quick-meals'] },
  { id: 3, title: "Lentil Buddha Bowl", description: "Protein-rich lentils with roasted veggies", time: 35, calories: 380, servings: 2, healthy: true, quick: false, tags: ['vegan', 'high-protein'] },
  { id: 4, title: "Avocado Toast Deluxe", description: "Whole grain with avocado and eggs", time: 10, calories: 320, servings: 1, healthy: true, quick: true, tags: ['vegetarian', 'quick-meals'] },
  { id: 5, title: "Chickpea Curry", description: "Spiced chickpeas in coconut sauce", time: 30, calories: 450, servings: 4, healthy: true, quick: false, tags: ['vegan', 'gluten-free'] },
  { id: 6, title: "Greek Salad Bowl", description: "Fresh veggies with feta and olives", time: 15, calories: 280, servings: 2, healthy: true, quick: true, tags: ['vegetarian', 'quick-meals', 'low-carb'] },
  { id: 7, title: "Protein Pancakes", description: "Fluffy pancakes with whey protein", time: 20, calories: 350, servings: 2, healthy: true, quick: false, tags: ['high-protein', 'vegetarian'] },
  { id: 8, title: "Tofu Stir-Fry", description: "Crispy tofu with mixed vegetables", time: 25, calories: 310, servings: 2, healthy: true, quick: false, tags: ['vegan', 'gluten-free', 'high-protein'] },
  { id: 9, title: "Chia Pudding Parfait", description: "Overnight chia with berries", time: 10, calories: 220, servings: 1, healthy: true, quick: true, tags: ['vegan', 'quick-meals', 'gluten-free'] },
]

const categories = [
  { name: "Breakfast", icon: "i-lucide-sunrise" },
  { name: "Lunch", icon: "i-lucide-sun" },
  { name: "Dinner", icon: "i-lucide-moon" },
  { name: "Snacks", icon: "i-lucide-cookie" },
  { name: "Desserts", icon: "i-lucide-cake" },
  { name: "Beverages", icon: "i-lucide-coffee" },
  { name: "Salads", icon: "i-lucide-salad" },
  { name: "Soups", icon: "i-lucide-soup" },
]

const filteredRecipes = computed(() => {
  let filtered = recipes

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(recipe =>
      recipe.title.toLowerCase().includes(query) ||
      recipe.description.toLowerCase().includes(query)
    )
  }

  // Filter by selected filters
  if (selectedFilters.value.length > 0) {
    filtered = filtered.filter(recipe => {
      return selectedFilters.value.every(filter => {
        const filterKey = filter.toLowerCase().replace(/\s+/g, '-')
        return recipe.tags.includes(filterKey)
      })
    })
  }

  return filtered
})

const toggleFilter = (filter: string) => {
  const index = selectedFilters.value.indexOf(filter)
  if (index > -1) {
    selectedFilters.value.splice(index, 1)
  } else {
    selectedFilters.value.push(filter)
  }
}

const toggleFavorite = (recipeId: number) => {
  const index = favorites.value.indexOf(recipeId)
  if (index > -1) {
    favorites.value.splice(index, 1)
  } else {
    favorites.value.push(recipeId)
  }
}

const analyzeRecipe = () => {
  analyzing.value = true

  // Simulate AI analysis
  setTimeout(() => {
    analysisResult.value = {
      calories: Math.floor(Math.random() * 400) + 200,
      protein: Math.floor(Math.random() * 30) + 15,
      carbs: Math.floor(Math.random() * 50) + 20,
      fat: Math.floor(Math.random() * 20) + 5,
      tags: ['Balanced', 'Heart-Healthy', 'High Fiber']
    }
    analyzing.value = false
  }, 1500)
}

let observer: IntersectionObserver | null = null

onMounted(() => {
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

  document.querySelectorAll('.scroll-fade-in').forEach((el) => {
    observer?.observe(el)
  })
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}

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
