<template>
  <NuxtLink
    :to="`/recipe-wrangler/${recipe.recipe_id}`"
    class="recipe-card group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer block"
  >
    <!-- Image Container -->
    <div class="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
      <img
        v-if="recipe.image_url"
        :src="recipe.image_url"
        :alt="recipe.title"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        @error="handleImageError"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center bg-gradient-to-br from-brandg-50 to-brandg-100 dark:from-brandg-900/20 dark:to-brandg-800/20"
      >
        <UIcon
          name="i-lucide-utensils"
          class="w-16 h-16 text-brandg-300 dark:text-brandg-700"
        />
      </div>

      <!-- Compare Checkbox -->
      <button
        class="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg hover:scale-110 transition-all duration-200 z-10 flex items-center justify-center"
        @click="toggleCompare"
        :aria-label="isInCompare ? t('recipeWrangler.recipe.removeFromComparison') : t('recipeWrangler.recipe.addToComparison')"
        :disabled="!isInCompare && recipeStore.compareCount >= 4"
      >
        <UIcon
          :name="isInCompare ? 'i-lucide-check-square' : 'i-lucide-square'"
          :class="[
            'w-5 h-5 transition-colors duration-200',
            isInCompare
              ? 'text-brandg-600 dark:text-brandg-400'
              : 'text-gray-600 dark:text-gray-300'
          ]"
        />
      </button>

      <!-- Favorite Button -->
      <button
        class="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg hover:scale-110 transition-all duration-200 z-10 flex items-center justify-center"
        @click="toggleFavorite"
        :aria-label="isFavorite ? t('recipeWrangler.recipe.removeFromFavorites') : t('recipeWrangler.recipe.addToFavorites')"
      >
        <UIcon
          :name="isFavorite ? 'i-lucide-heart' : 'i-lucide-heart'"
          :class="[
            'w-5 h-5 transition-colors duration-200',
            isFavorite
              ? 'text-red-500 fill-red-500'
              : 'text-gray-600 dark:text-gray-300'
          ]"
        />
      </button>

      <!-- Duration Badge -->
      <div
        v-if="recipe.duration"
        class="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md flex items-center gap-1.5"
      >
        <UIcon name="i-lucide-clock" class="w-4 h-4 text-brandg-600 dark:text-brandg-400" />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
          {{ recipe.duration }} {{ t('recipeWrangler.recipe.minuteShort') }}
        </span>
      </div>

      <!-- Nutri-Score Badge -->
      <div
        v-if="recipe.nutri_score !== undefined"
        class="absolute bottom-3 right-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-lg p-2"
      >
        <div class="flex gap-0.5 items-center">
          <div
            v-for="(grade, idx) in ['A', 'B', 'C', 'D', 'E']"
            :key="grade"
            :class="[
              'flex items-center justify-center font-black text-white transition-all',
              getNutriScoreGrade(recipe.nutri_score) === grade
                ? 'w-7 h-9 text-sm'
                : 'w-5 h-7 text-xs opacity-40',
              idx === 0 ? 'rounded-l-full' : '',
              idx === 4 ? 'rounded-r-full' : '',
              getNutriScoreColorBg(grade)
            ]"
          >
            {{ grade }}
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Title -->
      <h3
        class="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-2 group-hover:text-brandg-600 dark:group-hover:text-brandg-400 transition-colors"
      >
        {{ recipe.title }}
      </h3>

      <!-- Metadata -->
      <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div v-if="recipe.serves" class="flex items-center gap-1">
          <UIcon name="i-lucide-users" class="w-4 h-4" />
          <span>{{ recipe.serves }} {{ t('recipeWrangler.recipe.servings', recipe.serves) }}</span>
        </div>
      </div>

      <!-- View Recipe Link -->
      <div class="mt-4 flex items-center text-sm font-medium text-brandg-600 dark:text-brandg-400 group-hover:gap-2 gap-1 transition-all">
        <span>{{ t('recipeWrangler.recipe.viewRecipe') }}</span>
        <UIcon
          name="i-lucide-arrow-right"
          class="w-4 h-4 transition-transform group-hover:translate-x-1"
        />
      </div>
    </div>

    <!-- Hover Overlay -->
    <div
      class="absolute inset-0 bg-gradient-to-t from-brandg-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
    />
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRecipeStore } from '~/stores/recipe'
import type { RecipeSearchResult } from '~/services/recipeApi'

// ============================================================================
// Props & Emits
// ============================================================================
interface Props {
  recipe: RecipeSearchResult
}

const props = defineProps<Props>()
const { t } = useI18n()

// ============================================================================
// Store
// ============================================================================
const recipeStore = useRecipeStore()

// ============================================================================
// Computed
// ============================================================================
const isFavorite = computed(() => recipeStore.isFavorite(props.recipe.recipe_id))
const isInCompare = computed(() => recipeStore.isInCompareList(props.recipe.recipe_id))

// ============================================================================
// Methods
// ============================================================================
const toggleCompare = (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  recipeStore.toggleCompare(props.recipe.recipe_id)
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

const toggleFavorite = (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  recipeStore.toggleFavorite(props.recipe.recipe_id)
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}
</script>

<style scoped>
.recipe-card {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
