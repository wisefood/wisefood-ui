<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
    <!-- Header -->
    <div class="border-b border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div class="flex items-center justify-between">
          <NuxtLink
            to="/recipe-wrangler"
            class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-brandg-600 dark:hover:text-brandg-400 transition-colors"
          >
            <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
            <span class="text-sm font-medium">Back to Recipes</span>
          </NuxtLink>
          <button
            v-if="recipe"
            @click="toggleFavorite"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <UIcon
              :name="isFavorite ? 'i-lucide-heart' : 'i-lucide-heart'"
              :class="[
                'w-5 h-5 transition-colors',
                isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600 dark:text-gray-300'
              ]"
            />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
              {{ isFavorite ? 'Saved' : 'Save' }}
            </span>
          </button>
        </div>
        <div class="mt-3 sm:mt-4">
          <h1 class="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 dark:text-white tracking-tight">
            <span class="font-serif italic text-brandg-500 dark:text-brandg-400 text-3xl sm:text-4xl md:text-5xl">RecipeWrangler</span>
          </h1>
          <p class="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 font-light">
            Discover personalized recipes tailored to your nutritional goals
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div class="animate-pulse space-y-6">
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div class="aspect-video bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
        <div class="space-y-3">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center">
      <UIcon name="i-lucide-alert-circle" class="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Failed to load recipe</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">{{ error }}</p>
      <UButton @click="loadRecipe" color="primary">
        Try Again
      </UButton>
    </div>

    <!-- Recipe Content -->
    <main v-else-if="recipe" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
      <!-- Hero Section with Image -->
      <div class="mb-8 sm:mb-10">
        <!-- Image -->
        <div v-if="recipe.image_url" class="relative aspect-[16/7] sm:aspect-[16/6] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-xl mb-6">
          <img
            :src="recipe.image_url"
            :alt="recipe.title"
            class="w-full h-full object-cover"
            @error="handleImageError"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

          <!-- Title Overlay on Image -->
          <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
            <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-3 drop-shadow-lg">
              {{ recipe.title }}
            </h1>

            <!-- Meta Info -->
            <div class="flex flex-wrap items-center gap-3 sm:gap-4 text-white/90">
              <div v-if="recipe.duration" class="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <UIcon name="i-lucide-clock" class="w-4 h-4" />
                <span class="text-xs sm:text-sm font-medium">{{ recipe.duration }} min</span>
              </div>
              <div v-if="recipe.serves" class="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <UIcon name="i-lucide-users" class="w-4 h-4" />
                <span class="text-xs sm:text-sm font-medium">{{ recipe.serves }} {{ recipe.serves === 1 ? 'serving' : 'servings' }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="mb-6">
          <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-4">
            {{ recipe.title }}
          </h1>
          <!-- Meta Info for no-image case -->
          <div class="flex flex-wrap items-center gap-3 sm:gap-4 text-gray-600 dark:text-gray-400">
            <div v-if="recipe.duration" class="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
              <UIcon name="i-lucide-clock" class="w-4 h-4 text-brandg-600 dark:text-brandg-400" />
              <span class="text-xs sm:text-sm font-medium">{{ recipe.duration }} min</span>
            </div>
            <div v-if="recipe.serves" class="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
              <UIcon name="i-lucide-users" class="w-4 h-4 text-brandg-600 dark:text-brandg-400" />
              <span class="text-xs sm:text-sm font-medium">{{ recipe.serves }} {{ recipe.serves === 1 ? 'serving' : 'servings' }}</span>
            </div>
            <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
              <UIcon name="i-lucide-award" class="w-4 h-4 text-brandg-600 dark:text-brandg-400" />
              <span class="text-xs sm:text-sm font-medium">Nutri-Score {{ getNutriScoreGrade(recipe.nutri_score) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <!-- Main Content (Left Column) -->
        <div class="lg:col-span-2 space-y-10 sm:space-y-12">

          <!-- Nutrition Information -->
          <section class="bg-white dark:bg-gray-800 rounded-3xl p-8 sm:p-10 border border-gray-200 dark:border-gray-700 shadow-lg">
            <h2 class="text-3xl font-serif font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-3">
              <UIcon name="i-lucide-activity" class="w-7 h-7 text-brandg-600 dark:text-brandg-400" />
              Nutritional Information
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-8">Per serving</p>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <div class="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800 hover:shadow-md transition-shadow">
                <div class="flex items-center gap-2 mb-3">
                  <UIcon name="i-lucide-flame" class="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Calories</p>
                </div>
                <p class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  {{ Math.round(recipe.total_kcal_per_serving) }}
                </p>
              </div>

              <div class="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
                <div class="flex items-center gap-2 mb-3">
                  <UIcon name="i-lucide-dumbbell" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Protein</p>
                </div>
                <p class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  {{ recipe.total_protein_g_per_serving.toFixed(1) }}<span class="text-xl text-gray-500">g</span>
                </p>
              </div>

              <div class="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow">
                <div class="flex items-center gap-2 mb-3">
                  <UIcon name="i-lucide-wheat" class="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Carbs</p>
                </div>
                <p class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  {{ recipe.total_carbs_g_per_serving.toFixed(1) }}<span class="text-xl text-gray-500">g</span>
                </p>
              </div>

              <div class="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 hover:shadow-md transition-shadow">
                <div class="flex items-center gap-2 mb-3">
                  <UIcon name="i-lucide-droplet" class="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Fat</p>
                </div>
                <p class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  {{ recipe.total_fat_g_per_serving.toFixed(1) }}<span class="text-xl text-gray-500">g</span>
                </p>
              </div>
            </div>

            <!-- Additional Nutrition -->
            <div class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div class="text-center sm:text-left">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Fiber</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ recipe.total_fiber_g_per_serving.toFixed(1) }}<span class="text-base text-gray-500">g</span>
                </p>
              </div>
              <div class="text-center sm:text-left">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Sugar</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ recipe.total_sugar_g_per_serving.toFixed(1) }}<span class="text-base text-gray-500">g</span>
                </p>
              </div>
              <div class="text-center sm:text-left">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Sodium</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ recipe.total_sodium_mg_per_serving.toFixed(0) }}<span class="text-base text-gray-500">mg</span>
                </p>
              </div>
              <div class="text-center sm:text-left">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Cholesterol</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ recipe.total_cholesterol_mg_per_serving.toFixed(0) }}<span class="text-base text-gray-500">mg</span>
                </p>
              </div>
            </div>
          </section>

          <!-- Instructions -->
          <section class="bg-white dark:bg-gray-800 rounded-3xl p-8 sm:p-10 border border-gray-200 dark:border-gray-700 shadow-lg">
            <h2 class="text-3xl font-serif font-semibold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
              <UIcon name="i-lucide-chef-hat" class="w-7 h-7 text-brandg-600 dark:text-brandg-400" />
              Instructions
            </h2>

            <ol class="space-y-6">
              <li
                v-for="(instruction, index) in recipe.instructions"
                :key="index"
                @click="toggleInstruction(index)"
                class="flex gap-5 group cursor-pointer"
              >
                <div
                  :class="[
                    'flex-shrink-0 w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-base shadow-md transition-all',
                    checkedInstructions[index]
                      ? 'bg-gray-400 dark:bg-gray-600 group-hover:scale-100'
                      : 'bg-gradient-to-br from-brandg-500 to-brandg-600 dark:from-brandg-600 dark:to-brandg-700 group-hover:scale-110'
                  ]"
                >
                  <UIcon
                    v-if="checkedInstructions[index]"
                    name="i-lucide-check"
                    class="w-5 h-5"
                  />
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <p
                  :class="[
                    'flex-1 text-base leading-relaxed pt-2 transition-all',
                    checkedInstructions[index]
                      ? 'line-through text-gray-400 dark:text-gray-600'
                      : 'text-gray-700 dark:text-gray-300'
                  ]"
                >
                  {{ instruction }}
                </p>
              </li>
            </ol>
          </section>
        </div>

        <!-- Sidebar (Right Column) -->
        <div class="space-y-8">
          <!-- Nutri-Score Display -->
          <section class="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg relative z-10">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <UIcon name="i-lucide-award" class="w-6 h-6 text-brandg-600 dark:text-brandg-400" />
              Nutri-Score
            </h3>

            <!-- Nutri-Score Label (Official Design) -->
            <div class="flex flex-col items-center">
              <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Nutritional Quality</p>
              <div class="flex gap-1 relative">
                <div
                  v-for="(grade, idx) in ['A', 'B', 'C', 'D', 'E']"
                  :key="grade"
                  :class="[
                    'relative flex items-center justify-center font-black text-white transition-all',
                    getNutriScoreGrade(recipe.nutri_score) === grade
                      ? 'w-16 h-20 text-3xl z-10'
                      : 'w-12 h-16 text-xl opacity-50',
                    idx === 0 ? 'rounded-l-full' : '',
                    idx === 4 ? 'rounded-r-full' : '',
                    getNutriScoreColorBg(grade)
                  ]"
                >
                  <span class="relative z-10">{{ grade }}</span>
                  <!-- Arrow pointer for active grade -->
                  <div
                    v-if="getNutriScoreGrade(recipe.nutri_score) === grade"
                    :class="[
                      'absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0',
                      'border-l-[12px] border-l-transparent',
                      'border-r-[12px] border-r-transparent',
                      'border-t-[12px]',
                      getNutriScoreArrowColor(grade)
                    ]"
                  ></div>
                </div>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-6 text-center">
                {{ getNutriScoreDescription(getNutriScoreGrade(recipe.nutri_score)) }}
              </p>
            </div>
          </section>

          <!-- Environmental Impact -->
          <section class="bg-gradient-to-br from-brandg-50 to-brandg-100 dark:from-brandg-900/20 dark:to-brandg-800/20 rounded-3xl p-8 border border-brandg-200 dark:border-brandg-800 shadow-lg relative z-10">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <UIcon name="i-lucide-leaf" class="w-6 h-6 text-brandg-600 dark:text-brandg-400" />
              Environmental Impact
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Sustainability score based on ingredient sourcing and preparation methods.
            </p>
            <div class="flex items-center gap-3">
              <div class="flex-1 h-3 bg-brandg-200 dark:bg-brandg-900/50 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-brandg-500 to-brandg-600 dark:from-brandg-600 dark:to-brandg-700 rounded-full" style="width: 75%"></div>
              </div>
              <span class="text-base font-bold text-brandg-700 dark:text-brandg-400">Good</span>
            </div>
          </section>

          <!-- Ingredients -->
          <section class="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg sticky top-24 z-20">
            <h2 class="text-2xl font-serif font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <UIcon name="i-lucide-shopping-basket" class="w-6 h-6 text-brandg-600 dark:text-brandg-400" />
              Ingredients
            </h2>

            <ul class="space-y-4">
              <li
                v-for="(ingredient, index) in recipe.ingredients"
                :key="index"
                @click="toggleIngredient(index)"
                class="flex items-start gap-4 group cursor-pointer"
              >
                <div
                  :class="[
                    'w-6 h-6 rounded-md border-2 border-brandg-500 dark:border-brandg-400 mt-0.5 flex-shrink-0 flex items-center justify-center transition-all',
                    checkedIngredients[index] ? 'bg-brandg-500 dark:bg-brandg-400' : 'group-hover:bg-brandg-100 dark:group-hover:bg-brandg-900/30'
                  ]"
                >
                  <UIcon
                    v-if="checkedIngredients[index]"
                    name="i-lucide-check"
                    class="w-4 h-4 text-white"
                  />
                </div>
                <div class="flex-1">
                  <p :class="[
                    'font-medium text-base transition-all',
                    checkedIngredients[index]
                      ? 'line-through text-gray-400 dark:text-gray-600'
                      : 'text-gray-900 dark:text-white'
                  ]">
                    {{ ingredient.name }}
                  </p>
                  <p v-if="ingredient.measurement" :class="[
                    'text-sm mt-1 transition-all',
                    checkedIngredients[index]
                      ? 'line-through text-gray-400 dark:text-gray-600'
                      : 'text-gray-500 dark:text-gray-400'
                  ]">
                    {{ ingredient.measurement }}
                  </p>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useRecipes } from '~/composables/useRecipes'
import { useRecipeStore } from '~/stores/recipe'
import type { Recipe } from '~/services/recipeApi'

definePageMeta({
  middleware: ['auth', 'profile']
})

// ============================================================================
// Route & Stores
// ============================================================================
const route = useRoute()
const { currentRecipe, loading, error, fetchRecipe } = useRecipes()
const recipeStore = useRecipeStore()

// ============================================================================
// State
// ============================================================================
const checkedIngredients = ref<Record<number, boolean>>({})
const checkedInstructions = ref<Record<number, boolean>>({})

// ============================================================================
// Computed
// ============================================================================
const recipeId = computed(() => route.params.id as string)
const recipe = computed(() => currentRecipe.value)
const isFavorite = computed(() => recipe.value ? recipeStore.isFavorite(recipe.value.recipe_id) : false)

// ============================================================================
// Methods
// ============================================================================
const loadRecipe = async () => {
  try {
    // Reset checkboxes
    checkedIngredients.value = {}
    checkedInstructions.value = {}

    await fetchRecipe(recipeId.value)
    if (recipe.value) {
      recipeStore.addToRecentlyViewed(recipe.value.recipe_id)
      recipeStore.cacheRecipe(recipe.value)

      // Set page title
      useHead({
        title: `${recipe.value.title} - RecipeWrangler`
      })
    }
  } catch (err) {
    console.error('Failed to load recipe:', err)
  }
}

const toggleFavorite = () => {
  if (recipe.value) {
    recipeStore.toggleFavorite(recipe.value.recipe_id)
  }
}

const toggleIngredient = (index: number) => {
  checkedIngredients.value[index] = !checkedIngredients.value[index]
}

const toggleInstruction = (index: number) => {
  checkedInstructions.value[index] = !checkedInstructions.value[index]
}

const getNutriScoreGrade = (score: number): string => {
  if (score <= 0) return 'A'
  if (score <= 2) return 'B'
  if (score <= 10) return 'C'
  if (score <= 18) return 'D'
  return 'E'
}

const getNutriScoreColorBg = (grade: string): string => {
  const colors = {
    'A': 'bg-[#038141]',  // Dark green (official Nutri-Score color)
    'B': 'bg-[#85BB2F]',  // Light green
    'C': 'bg-[#FECB02]',  // Yellow
    'D': 'bg-[#EE8100]',  // Orange
    'E': 'bg-[#E63E11]'   // Red
  }
  return colors[grade as keyof typeof colors] || 'bg-gray-400'
}

const getNutriScoreArrowColor = (grade: string): string => {
  const colors = {
    'A': 'border-t-[#038141]',
    'B': 'border-t-[#85BB2F]',
    'C': 'border-t-[#FECB02]',
    'D': 'border-t-[#EE8100]',
    'E': 'border-t-[#E63E11]'
  }
  return colors[grade as keyof typeof colors] || 'border-t-gray-400'
}

const getNutriScoreDescription = (grade: string): string => {
  const descriptions = {
    'A': 'Excellent nutritional quality',
    'B': 'Good nutritional quality',
    'C': 'Average nutritional quality',
    'D': 'Poor nutritional quality',
    'E': 'Low nutritional quality'
  }
  return descriptions[grade as keyof typeof descriptions] || 'Unknown'
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

// ============================================================================
// Lifecycle
// ============================================================================
onMounted(() => {
  loadRecipe()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}
</style>
