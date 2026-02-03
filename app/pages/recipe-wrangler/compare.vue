<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <!-- Header -->
    <div class="border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div class="flex items-center justify-between">
          <NuxtLink
            to="/recipe-wrangler"
            class="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-brandg-600 dark:hover:text-brandg-400 transition-colors"
          >
            <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
            <span class="text-sm font-medium">Back to Recipes</span>
          </NuxtLink>

          <button
            v-if="compareRecipes.length > 0"
            @click="clearAll"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
          >
            <UIcon name="i-lucide-x" class="w-4 h-4" />
            Clear All
          </button>
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
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Empty State -->
      <div v-if="compareRecipes.length === 0" class="text-center py-16">
        <UIcon name="i-lucide-git-compare" class="w-20 h-20 text-zinc-300 dark:text-zinc-700 mx-auto mb-6" />
        <h2 class="text-2xl font-semibold text-zinc-900 dark:text-white mb-3">
          No Recipes to Compare
        </h2>
        <p class="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
          Select recipes from the search results to compare their nutritional values and ingredients
        </p>
        <NuxtLink
          to="/recipe-wrangler"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brandg-600 text-white hover:bg-brandg-700 transition-colors font-medium"
        >
          <UIcon name="i-lucide-search" class="w-5 h-5" />
          Browse Recipes
        </NuxtLink>
      </div>

      <!-- Comparison Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-lg overflow-hidden">
          <!-- Table Header with Recipe Images and Titles -->
          <thead>
            <tr class="border-b border-zinc-200 dark:border-zinc-700">
              <th class="text-left p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-900 font-semibold text-zinc-700 dark:text-zinc-300 sticky left-0 z-20">
                <span class="text-sm uppercase tracking-wide">Feature</span>
              </th>
              <th
                v-for="recipe in compareRecipes"
                :key="recipe.recipe_id"
                class="p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-900 w-[280px]"
              >
                <div class="space-y-3">
                  <!-- Recipe Image with Title Overlay -->
                  <div class="relative h-[210px] rounded-xl overflow-hidden bg-gradient-to-br from-brandg-100 to-brandg-200 dark:from-brandg-900/40 dark:to-brandg-800/40 shadow-md">
                    <img
                      v-if="recipe.image_url"
                      :src="recipe.image_url"
                      :alt="recipe.title"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <UIcon name="i-lucide-utensils" class="w-12 h-12 text-brandg-300 dark:text-brandg-700" />
                    </div>

                    <!-- Gradient Overlay -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

                    <!-- Title Overlay -->
                    <div class="absolute bottom-0 left-0 right-0 p-4">
                      <h3 class="text-base font-serif font-bold text-white drop-shadow-lg line-clamp-2">
                        {{ recipe.title }}
                      </h3>
                    </div>

                    <!-- Remove Button -->
                    <button
                      @click="removeRecipe(recipe.recipe_id)"
                      class="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg flex items-center justify-center z-10"
                    >
                      <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <!-- View Recipe Link -->
                  <NuxtLink
                    :to="`/recipe-wrangler/${recipe.recipe_id}`"
                    class="inline-flex items-center gap-2 text-sm font-medium text-brandg-600 dark:text-brandg-400 hover:text-brandg-700 dark:hover:text-brandg-300 transition-colors"
                  >
                    <span>View Recipe</span>
                    <UIcon name="i-lucide-arrow-right" class="w-4 h-4" />
                  </NuxtLink>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <!-- Nutri-Score Row -->
            <tr class="border-b border-zinc-200 dark:border-zinc-700">
              <td class="p-4 sm:p-6 font-medium text-zinc-900 dark:text-white sticky left-0 bg-white dark:bg-zinc-800 z-10 border-r border-zinc-200 dark:border-zinc-700 border-r border-zinc-200 dark:border-zinc-700">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-award" class="w-5 h-5 text-brandg-600 dark:text-brandg-400" />
                  <span>Nutri-Score</span>
                </div>
              </td>
              <td
                v-for="recipe in compareRecipes"
                :key="`nutri-${recipe.recipe_id}`"
                class="p-4 sm:p-6 text-center"
              >
                <div class="flex justify-center">
                  <div
                    :class="[
                      'px-4 py-2 rounded-full text-white font-black text-lg',
                      getNutriScoreColorBg(getNutriScoreGrade(recipe.nutri_score))
                    ]"
                  >
                    {{ getNutriScoreGrade(recipe.nutri_score) }}
                  </div>
                </div>
              </td>
            </tr>

            <!-- Duration Row -->
            <tr class="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
              <td class="p-4 sm:p-6 font-medium text-zinc-900 dark:text-white sticky left-0 bg-zinc-50 dark:bg-zinc-900 z-10 border-r border-zinc-200 dark:border-zinc-700">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-clock" class="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  <span>Duration</span>
                </div>
              </td>
              <td
                v-for="recipe in compareRecipes"
                :key="`duration-${recipe.recipe_id}`"
                class="p-4 sm:p-6 text-center"
              >
                <span class="text-lg font-semibold text-zinc-900 dark:text-white">
                  {{ recipe.duration || 'N/A' }}<span v-if="recipe.duration" class="text-sm text-zinc-500"> min</span>
                </span>
              </td>
            </tr>

            <!-- Servings Row -->
            <tr class="border-b border-zinc-200 dark:border-zinc-700">
              <td class="p-4 sm:p-6 font-medium text-zinc-900 dark:text-white sticky left-0 bg-white dark:bg-zinc-800 z-10 border-r border-zinc-200 dark:border-zinc-700">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-users" class="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  <span>Servings</span>
                </div>
              </td>
              <td
                v-for="recipe in compareRecipes"
                :key="`serves-${recipe.recipe_id}`"
                class="p-4 sm:p-6 text-center"
              >
                <span class="text-lg font-semibold text-zinc-900 dark:text-white">
                  {{ recipe.serves || 'N/A' }}
                </span>
              </td>
            </tr>

            <!-- Calories Row -->
            <tr class="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
              <td class="p-4 sm:p-6 font-medium text-zinc-900 dark:text-white sticky left-0 bg-zinc-50 dark:bg-zinc-900 z-10 border-r border-zinc-200 dark:border-zinc-700">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-flame" class="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <span>Calories</span>
                </div>
              </td>
              <td
                v-for="recipe in compareRecipes"
                :key="`cal-${recipe.recipe_id}`"
                class="p-4 sm:p-6"
              >
                <div class="space-y-2">
                  <div class="text-center">
                    <span class="text-lg font-bold text-zinc-900 dark:text-white">
                      {{ Math.round(recipe.total_kcal_per_serving) }}
                    </span>
                  </div>
                  <div class="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-orange-500"
                      :style="{ width: `${Math.min((recipe.total_kcal_per_serving / maxCalories) * 100, 100)}%` }"
                    ></div>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Protein Row -->
            <tr class="border-b border-zinc-200 dark:border-zinc-700">
              <td class="p-4 sm:p-6 font-medium text-zinc-900 dark:text-white sticky left-0 bg-white dark:bg-zinc-800 z-10 border-r border-zinc-200 dark:border-zinc-700">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-dumbbell" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Protein</span>
                </div>
              </td>
              <td
                v-for="recipe in compareRecipes"
                :key="`protein-${recipe.recipe_id}`"
                class="p-4 sm:p-6"
              >
                <div class="space-y-2">
                  <div class="text-center">
                    <span class="text-lg font-bold text-zinc-900 dark:text-white">
                      {{ recipe.total_protein_g_per_serving.toFixed(1) }}<span class="text-sm text-zinc-500">g</span>
                    </span>
                  </div>
                  <div class="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-blue-500"
                      :style="{ width: `${Math.min((recipe.total_protein_g_per_serving / maxProtein) * 100, 100)}%` }"
                    ></div>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Carbs Row -->
            <tr class="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
              <td class="p-4 sm:p-6 font-medium text-zinc-900 dark:text-white sticky left-0 bg-zinc-50 dark:bg-zinc-900 z-10 border-r border-zinc-200 dark:border-zinc-700">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-wheat" class="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>Carbs</span>
                </div>
              </td>
              <td
                v-for="recipe in compareRecipes"
                :key="`carbs-${recipe.recipe_id}`"
                class="p-4 sm:p-6"
              >
                <div class="space-y-2">
                  <div class="text-center">
                    <span class="text-lg font-bold text-zinc-900 dark:text-white">
                      {{ recipe.total_carbs_g_per_serving.toFixed(1) }}<span class="text-sm text-zinc-500">g</span>
                    </span>
                  </div>
                  <div class="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-purple-500"
                      :style="{ width: `${Math.min((recipe.total_carbs_g_per_serving / maxCarbs) * 100, 100)}%` }"
                    ></div>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Fat Row -->
            <tr class="border-b border-zinc-200 dark:border-zinc-700">
              <td class="p-4 sm:p-6 font-medium text-zinc-900 dark:text-white sticky left-0 bg-white dark:bg-zinc-800 z-10 border-r border-zinc-200 dark:border-zinc-700">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-droplet" class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <span>Fat</span>
                </div>
              </td>
              <td
                v-for="recipe in compareRecipes"
                :key="`fat-${recipe.recipe_id}`"
                class="p-4 sm:p-6"
              >
                <div class="space-y-2">
                  <div class="text-center">
                    <span class="text-lg font-bold text-zinc-900 dark:text-white">
                      {{ recipe.total_fat_g_per_serving.toFixed(1) }}<span class="text-sm text-zinc-500">g</span>
                    </span>
                  </div>
                  <div class="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-yellow-500"
                      :style="{ width: `${Math.min((recipe.total_fat_g_per_serving / maxFat) * 100, 100)}%` }"
                    ></div>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Fiber Row -->
            <tr class="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
              <td class="p-4 sm:p-6 font-medium text-zinc-900 dark:text-white sticky left-0 bg-zinc-50 dark:bg-zinc-900 z-10 border-r border-zinc-200 dark:border-zinc-700">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-leaf" class="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span>Fiber</span>
                </div>
              </td>
              <td
                v-for="recipe in compareRecipes"
                :key="`fiber-${recipe.recipe_id}`"
                class="p-4 sm:p-6"
              >
                <div class="space-y-2">
                  <div class="text-center">
                    <span class="text-lg font-bold text-zinc-900 dark:text-white">
                      {{ recipe.total_fiber_g_per_serving.toFixed(1) }}<span class="text-sm text-zinc-500">g</span>
                    </span>
                  </div>
                  <div class="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-green-500"
                      :style="{ width: `${Math.min((recipe.total_fiber_g_per_serving / maxFiber) * 100, 100)}%` }"
                    ></div>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Sugar Row -->
            <tr class="border-b border-zinc-200 dark:border-zinc-700">
              <td class="p-4 sm:p-6 font-medium text-zinc-900 dark:text-white sticky left-0 bg-white dark:bg-zinc-800 z-10 border-r border-zinc-200 dark:border-zinc-700">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-candy" class="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  <span>Sugar</span>
                </div>
              </td>
              <td
                v-for="recipe in compareRecipes"
                :key="`sugar-${recipe.recipe_id}`"
                class="p-4 sm:p-6 text-center"
              >
                <span class="text-lg font-bold text-zinc-900 dark:text-white">
                  {{ recipe.total_sugar_g_per_serving.toFixed(1) }}<span class="text-sm text-zinc-500">g</span>
                </span>
              </td>
            </tr>

            <!-- Sodium Row -->
            <tr class="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
              <td class="p-4 sm:p-6 font-medium text-zinc-900 dark:text-white sticky left-0 bg-zinc-50 dark:bg-zinc-900 z-10 border-r border-zinc-200 dark:border-zinc-700">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-salt" class="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  <span>Sodium</span>
                </div>
              </td>
              <td
                v-for="recipe in compareRecipes"
                :key="`sodium-${recipe.recipe_id}`"
                class="p-4 sm:p-6 text-center"
              >
                <span class="text-lg font-bold text-zinc-900 dark:text-white">
                  {{ recipe.total_sodium_mg_per_serving.toFixed(0) }}<span class="text-sm text-zinc-500">mg</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRecipeStore } from '~/stores/recipe'
import recipeApi from '~/services/recipeApi'
import type { Recipe } from '~/services/recipeApi'

definePageMeta({
  middleware: ['auth', 'profile']
})

useHead({
  title: 'Compare Recipes - RecipeWrangler'
})

// ============================================================================
// Store
// ============================================================================
const recipeStore = useRecipeStore()

// ============================================================================
// State
// ============================================================================
const compareRecipes = ref<Recipe[]>([])
const loading = ref(false)

// ============================================================================
// Computed
// ============================================================================
const maxCalories = computed(() =>
  Math.max(...compareRecipes.value.map(r => r.total_kcal_per_serving), 1)
)

const maxProtein = computed(() =>
  Math.max(...compareRecipes.value.map(r => r.total_protein_g_per_serving), 1)
)

const maxCarbs = computed(() =>
  Math.max(...compareRecipes.value.map(r => r.total_carbs_g_per_serving), 1)
)

const maxFat = computed(() =>
  Math.max(...compareRecipes.value.map(r => r.total_fat_g_per_serving), 1)
)

const maxFiber = computed(() =>
  Math.max(...compareRecipes.value.map(r => r.total_fiber_g_per_serving), 1)
)

// ============================================================================
// Methods
// ============================================================================
const getNutriScoreGrade = (score: number): string => {
  if (score <= 0) return 'A'
  if (score <= 2) return 'B'
  if (score <= 10) return 'C'
  if (score <= 18) return 'D'
  return 'E'
}

const getNutriScoreColorBg = (grade: string): string => {
  const colors = {
    'A': 'bg-[#038141]',
    'B': 'bg-[#85BB2F]',
    'C': 'bg-[#FECB02]',
    'D': 'bg-[#EE8100]',
    'E': 'bg-[#E63E11]'
  }
  return colors[grade as keyof typeof colors] || 'bg-zinc-400'
}

const loadRecipes = async () => {
  loading.value = true
  try {
    const recipeIds = recipeStore.compareList
    const recipes = await Promise.all(
      recipeIds.map(id => recipeApi.getRecipe(id))
    )
    compareRecipes.value = recipes
  } catch (err) {
    console.error('Failed to load comparison recipes:', err)
  } finally {
    loading.value = false
  }
}

const removeRecipe = (recipeId: string) => {
  recipeStore.removeFromCompare(recipeId)
  compareRecipes.value = compareRecipes.value.filter(r => r.recipe_id !== recipeId)
}

const clearAll = () => {
  recipeStore.clearCompareList()
  compareRecipes.value = []
}

// ============================================================================
// Lifecycle
// ============================================================================
onMounted(() => {
  loadRecipes()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
