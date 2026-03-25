<template>
  <div class="recipe-filters space-y-4">
    <!-- Allergen Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <UIcon name="i-lucide-shield-alert" class="w-4 h-4 text-amber-500" />
          {{ t('recipeWrangler.filters.excludeAllergens') }}
        </h3>
        <button
          v-if="hasActiveFilters"
          @click="clearAllFilters"
          class="text-xs text-green-600 dark:text-green-400 hover:underline"
        >
          {{ t('recipeWrangler.filters.clearAll') }}
        </button>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="allergen in commonAllergens"
          :key="allergen.value"
          @click="toggleAllergen(allergen.value)"
          :class="[
            'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
            isAllergenExcluded(allergen.value)
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-2 ring-amber-400 dark:ring-amber-600'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          ]"
        >
          {{ allergen.label }}
        </button>
      </div>
    </div>

    <!-- Quick Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <UIcon name="i-lucide-sparkles" class="w-4 h-4 text-brandg-500" />
        {{ t('recipeWrangler.filters.quickFilters') }}
      </h3>

      <div class="space-y-2">
        <button
          v-for="filter in quickFilters"
          :key="filter.value"
          @click="applyQuickFilter(filter.value)"
          :class="[
            'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            selectedQuickFilter === filter.value
              ? 'bg-brandg-100 dark:bg-brandg-900/30 text-brandg-700 dark:text-brandg-400 ring-2 ring-brandg-400 dark:ring-brandg-600'
              : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          ]"
        >
          <UIcon :name="filter.icon" class="w-4 h-4" />
          <span>{{ filter.label }}</span>
        </button>
      </div>
    </div>

    <!-- Sort Options -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <UIcon name="i-lucide-arrow-up-down" class="w-4 h-4 text-blue-500" />
        {{ t('recipeWrangler.filters.sortBy') }}
      </h3>

      <div class="space-y-2">
        <button
          v-for="option in sortOptions"
          :key="option.value"
          @click="changeSortBy(option.value)"
          :class="[
            'w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            sortBy === option.value
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-2 ring-blue-400 dark:ring-blue-600'
              : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          ]"
        >
          <UIcon :name="option.icon" class="w-4 h-4" />
          <span>{{ option.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRecipeStore } from '~/stores/recipe'

// ============================================================================
// Props & Emits
// ============================================================================
const emit = defineEmits<{
  filterChange: []
  quickFilter: [filterType: string]
  sortChange: [sortBy: string]
}>()

// ============================================================================
// Store
// ============================================================================
const recipeStore = useRecipeStore()
const { t } = useI18n()

// ============================================================================
// State
// ============================================================================
const selectedQuickFilter = ref<string | null>(null)
type RecipeSortBy = 'relevance' | 'duration' | 'calories' | 'nutri_score'

// ============================================================================
// Constants
// ============================================================================
const commonAllergens = computed(() => [
  { value: 'peanuts', label: t('recipeWrangler.filters.allergens.peanuts') },
  { value: 'tree nuts', label: t('recipeWrangler.filters.allergens.treeNuts') },
  { value: 'dairy', label: t('recipeWrangler.filters.allergens.dairy') },
  { value: 'eggs', label: t('recipeWrangler.filters.allergens.eggs') },
  { value: 'soy', label: t('recipeWrangler.filters.allergens.soy') },
  { value: 'wheat', label: t('recipeWrangler.filters.allergens.wheat') },
  { value: 'fish', label: t('recipeWrangler.filters.allergens.fish') },
  { value: 'shellfish', label: t('recipeWrangler.filters.allergens.shellfish') },
  { value: 'gluten', label: t('recipeWrangler.filters.allergens.gluten') },
  { value: 'lactose', label: t('recipeWrangler.filters.allergens.lactose') }
])

const quickFilters = computed(() => [
  { value: 'quick', label: t('recipeWrangler.filters.quickOptions.quickEasy'), icon: 'i-lucide-zap' },
  { value: 'healthy', label: t('recipeWrangler.filters.quickOptions.healthy'), icon: 'i-lucide-leaf' },
  { value: 'vegetarian', label: t('recipeWrangler.filters.quickOptions.vegetarian'), icon: 'i-lucide-sprout' },
  { value: 'vegan', label: t('recipeWrangler.filters.quickOptions.vegan'), icon: 'i-lucide-carrot' },
  { value: 'low-calorie', label: t('recipeWrangler.filters.quickOptions.lowCalorie'), icon: 'i-lucide-flame' }
])

const sortOptions = computed(() => [
  { value: 'relevance', label: t('recipeWrangler.filters.sortOptions.mostRelevant'), icon: 'i-lucide-star' },
  { value: 'duration', label: t('recipeWrangler.filters.sortOptions.cookingTime'), icon: 'i-lucide-clock' },
  { value: 'calories', label: t('recipeWrangler.filters.sortOptions.calories'), icon: 'i-lucide-flame' },
  { value: 'nutri_score', label: t('recipeWrangler.filters.sortOptions.nutritionScore'), icon: 'i-lucide-award' }
])

// ============================================================================
// Computed
// ============================================================================
const sortBy = computed(() => recipeStore.sortBy)
const hasActiveFilters = computed(() => recipeStore.excludedAllergens.length > 0)

// ============================================================================
// Methods
// ============================================================================
const isAllergenExcluded = (allergen: string) => {
  return recipeStore.isAllergenExcluded(allergen)
}

const toggleAllergen = (allergen: string) => {
  recipeStore.toggleAllergen(allergen)
  emit('filterChange')
}

const clearAllFilters = () => {
  recipeStore.clearAllergenFilters()
  selectedQuickFilter.value = null
  emit('filterChange')
}

const applyQuickFilter = (filterType: string) => {
  if (selectedQuickFilter.value === filterType) {
    selectedQuickFilter.value = null
  } else {
    selectedQuickFilter.value = filterType
  }
  emit('quickFilter', filterType)
}

const changeSortBy = (sortByValue: string) => {
  recipeStore.setSortBy(sortByValue as RecipeSortBy)
  emit('sortChange', sortByValue)
}
</script>

<style scoped>
.recipe-filters {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
