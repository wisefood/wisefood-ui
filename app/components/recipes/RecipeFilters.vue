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

    <!-- Dish Type Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <UIcon name="i-lucide-utensils" class="w-4 h-4 text-brandg-500" />
        Dish Type
      </h3>
      <div v-if="dishTypeOptions.length" class="flex flex-wrap gap-2">
        <button
          v-for="dishType in dishTypeOptions"
          :key="dishType.value"
          @click="toggleDishType(dishType.value)"
          :class="[
            'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
            isDishTypeSelected(dishType.value)
              ? 'bg-brandg-100 dark:bg-brandg-900/30 text-brandg-700 dark:text-brandg-400 ring-2 ring-brandg-400 dark:ring-brandg-600'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          ]"
        >
          <span class="flex items-center gap-1.5">
            <UIcon :name="dishType.icon" class="w-3.5 h-3.5" />
            {{ dishType.label }}
            <span
              v-if="dishType.count !== null"
              class="text-[10px] font-normal opacity-70 tabular-nums"
            >{{ dishType.count }}</span>
          </span>
        </button>
      </div>
      <p v-else class="text-xs text-gray-400 dark:text-gray-500">
        Run a search to see available dish types.
      </p>
    </div>

    <!-- Source Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <UIcon name="i-lucide-database" class="w-4 h-4 text-blue-500" />
        Source
      </h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="source in sourceOptions"
          :key="source.value"
          @click="toggleSource(source.value)"
          :class="[
            'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
            isSourceSelected(source.value)
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-2 ring-blue-400 dark:ring-blue-600'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          ]"
        >
          {{ source.label }}
        </button>
      </div>
    </div>

    <!-- Time Range (placeholder, not yet wired) -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <UIcon name="i-lucide-timer" class="w-4 h-4 text-blue-500" />
          {{ t('recipeWrangler.filters.timeRange') }}
        </h3>
        <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500">
          {{ t('recipeWrangler.filters.timeRangeComingSoon') }}
        </span>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="range in timeRanges"
          :key="range.value"
          @click="toggleTimeRange(range.value)"
          :class="[
            'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex flex-col items-start leading-tight',
            selectedTimeRange === range.value
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-2 ring-blue-400 dark:ring-blue-600'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          ]"
        >
          <span>{{ range.label }}</span>
          <span v-if="range.hint" class="text-[10px] font-normal opacity-70">{{ range.hint }}</span>
        </button>
      </div>
    </div>

    <!-- Dietary Tags -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <UIcon name="i-lucide-leaf" class="w-4 h-4 text-brandg-500" />
        {{ t('recipeWrangler.filters.dietTags') }}
      </h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tag in dietTagOptions"
          :key="tag.value"
          @click="toggleDietTag(tag.value)"
          :class="[
            'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
            isDietTagSelected(tag.value)
              ? 'bg-brandg-100 dark:bg-brandg-900/30 text-brandg-700 dark:text-brandg-400 ring-2 ring-brandg-400 dark:ring-brandg-600'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          ]"
        >
          {{ tag.label }}
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
import type { RecipeDishType, RecipeFacetMap, RecipeParamSortBy, RecipeSource } from '~/services/recipeApi'
import { formatDishTypeLabel, getDishTypeIcon } from '~/utils/dishTypes'

// ============================================================================
// Props & Emits
// ============================================================================
const props = defineProps<{
  facets?: RecipeFacetMap
}>()

const emit = defineEmits<{
  filterChange: []
  quickFilter: [filterType: string]
  sortChange: [sortBy: RecipeParamSortBy | null]
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
// Visual-only placeholder selection — not wired to the store or API yet.
const selectedTimeRange = ref<string | null>(null)

// ============================================================================
// Constants
// ============================================================================
// Allergen `value`s are matched on the backend as `toLower(al.name) IN exclude_allergens`
// (param_search), so they must equal the lowercase canonical `Allergen.name` used by the
// graph tagging (e.g. `tree_nut`, `crustacean_shellfish`). Entries not yet covered by the
// backend allergen tagging won't match any recipes until that vocabulary is extended.
const commonAllergens = computed(() => [
  { value: 'celery', label: t('recipeWrangler.filters.allergens.celery') },
  { value: 'crustacean_shellfish', label: t('recipeWrangler.filters.allergens.crustaceanShellfish') },
  { value: 'egg', label: t('recipeWrangler.filters.allergens.egg') },
  { value: 'fish', label: t('recipeWrangler.filters.allergens.fish') },
  { value: 'gluten', label: t('recipeWrangler.filters.allergens.gluten') },
  { value: 'lupin', label: t('recipeWrangler.filters.allergens.lupin') },
  { value: 'milk', label: t('recipeWrangler.filters.allergens.milk') },
  { value: 'molluscs', label: t('recipeWrangler.filters.allergens.molluscs') },
  { value: 'mustard', label: t('recipeWrangler.filters.allergens.mustard') },
  { value: 'peanut', label: t('recipeWrangler.filters.allergens.peanut') },
  { value: 'sesame', label: t('recipeWrangler.filters.allergens.sesame') },
  { value: 'soy', label: t('recipeWrangler.filters.allergens.soy') },
  { value: 'sulphites', label: t('recipeWrangler.filters.allergens.sulphites') },
  { value: 'tree_nut', label: t('recipeWrangler.filters.allergens.treeNut') },
  { value: 'wheat', label: t('recipeWrangler.filters.allergens.wheat') }
])

// Dish types are driven by whatever buckets the backend returns in the
// param_search `dish_type` facet, merged with any currently-selected values
// so a user can always deselect what they've chosen even if it doesn't
// appear in the current filtered result set.
const dishTypeOptions = computed<{ value: RecipeDishType; label: string; icon: string; count: number | null }[]>(() => {
  // Backend keys the facet bucket by the Tag.category value, which is
  // 'dish-type' (hyphen), not 'dish_type'.
  const bucket = (props.facets?.['dish-type'] ?? {}) as Record<string, number>
  const values = new Set<string>(Object.keys(bucket))
  for (const selected of recipeStore.selectedDishTypes) values.add(selected)
  return [...values]
    .map(value => ({
      value,
      label: formatDishTypeLabel(value),
      icon: getDishTypeIcon(value),
      count: typeof bucket[value] === 'number' ? bucket[value] : null
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

// Time-range buckets are visual placeholders for now. When wired they will map
// to `max_duration_minutes` (quick=30, medium=60, slow=open-ended, any=cleared).
const timeRanges = computed(() => [
  { value: 'quick', label: t('recipeWrangler.filters.timeRangeOptions.quick'), hint: '≤ 30 min' },
  { value: 'medium', label: t('recipeWrangler.filters.timeRangeOptions.medium'), hint: '30–60 min' },
  { value: 'slow', label: t('recipeWrangler.filters.timeRangeOptions.slow'), hint: '60+ min' },
  { value: 'any', label: t('recipeWrangler.filters.timeRangeOptions.any'), hint: '' }
])

// Diet-tag values are sent to the backend as snake_case (`diet_tags[]`), matching
// the backend convention surfaced in the recipe detail page tag map.
const dietTagOptions = computed(() => [
  { value: 'nut_free', label: t('recipeWrangler.filters.dietTagsOptions.nutFree') },
  { value: 'vegetarian', label: t('recipeWrangler.filters.dietTagsOptions.vegetarian') },
  { value: 'pescatarian', label: t('recipeWrangler.filters.dietTagsOptions.pescatarian') },
  { value: 'dairy_free', label: t('recipeWrangler.filters.dietTagsOptions.dairyFree') },
  { value: 'vegan', label: t('recipeWrangler.filters.dietTagsOptions.vegan') },
  { value: 'gluten_free', label: t('recipeWrangler.filters.dietTagsOptions.glutenFree') }
])

const sourceOptions: { value: RecipeSource; label: string }[] = [
  { value: 'healthyfoods', label: 'Healthy Foods' },
  { value: 'foodhero', label: 'Food Hero' },
  { value: 'myplate', label: 'MyPlate' },
  { value: 'irish_safefood', label: 'Irish Safefood' },
  { value: 'recipe1m', label: 'Recipe1M' }
]

const quickFilters = computed(() => [
  { value: 'quick', label: t('recipeWrangler.filters.quickOptions.quickEasy'), icon: 'i-lucide-zap' },
  { value: 'healthy', label: t('recipeWrangler.filters.quickOptions.healthy'), icon: 'i-lucide-leaf' },
  { value: 'vegetarian', label: t('recipeWrangler.filters.quickOptions.vegetarian'), icon: 'i-lucide-sprout' },
  { value: 'vegan', label: t('recipeWrangler.filters.quickOptions.vegan'), icon: 'i-lucide-carrot' },
  { value: 'low-calorie', label: t('recipeWrangler.filters.quickOptions.lowCalorie'), icon: 'i-lucide-flame' },
  { value: 'low-fat', label: t('recipeWrangler.filters.quickOptions.lowFat'), icon: 'i-lucide-droplet' },
  { value: 'high-fibre', label: t('recipeWrangler.filters.quickOptions.highFibre'), icon: 'i-lucide-wheat' },
  { value: 'high-protein', label: t('recipeWrangler.filters.quickOptions.highProtein'), icon: 'i-lucide-beef' }
])

const sortOptions: { value: RecipeParamSortBy; label: string; icon: string }[] = [
  { value: 'title_asc', label: 'Title (A–Z)', icon: 'i-lucide-arrow-up-a-z' },
  { value: 'title_desc', label: 'Title (Z–A)', icon: 'i-lucide-arrow-down-z-a' },
  { value: 'time_asc', label: 'Quickest First', icon: 'i-lucide-clock' },
  { value: 'time_desc', label: 'Longest First', icon: 'i-lucide-clock-3' },
  { value: 'random', label: 'Random', icon: 'i-lucide-shuffle' }
]

// ============================================================================
// Computed
// ============================================================================
const sortBy = computed(() => recipeStore.sortBy)
const hasActiveFilters = computed(() =>
  recipeStore.excludedAllergens.length > 0 ||
  recipeStore.selectedSources.length > 0 ||
  recipeStore.selectedDishTypes.length > 0 ||
  recipeStore.selectedDietTags.length > 0
)

// ============================================================================
// Methods
// ============================================================================
const isAllergenExcluded = (allergen: string) => recipeStore.isAllergenExcluded(allergen)
const isSourceSelected = (source: RecipeSource) => recipeStore.selectedSources.includes(source)
const isDishTypeSelected = (dishType: RecipeDishType) => recipeStore.selectedDishTypes.includes(dishType)
const isDietTagSelected = (tag: string) => recipeStore.selectedDietTags.includes(tag)

const toggleAllergen = (allergen: string) => {
  recipeStore.toggleAllergen(allergen)
  emit('filterChange')
}

const toggleSource = (source: RecipeSource) => {
  recipeStore.toggleSource(source)
  emit('filterChange')
}

const toggleDishType = (dishType: RecipeDishType) => {
  recipeStore.toggleDishType(dishType)
  emit('filterChange')
}

const toggleDietTag = (tag: string) => {
  recipeStore.toggleDietTag(tag)
  emit('filterChange')
}

// Placeholder only: toggles the visual selection without touching the store/API.
const toggleTimeRange = (range: string) => {
  selectedTimeRange.value = selectedTimeRange.value === range ? null : range
}

const clearAllFilters = () => {
  recipeStore.clearAllergenFilters()
  recipeStore.clearSourceFilters()
  recipeStore.clearDishTypeFilters()
  recipeStore.clearDietTagFilters()
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

const changeSortBy = (value: RecipeParamSortBy) => {
  const next = recipeStore.sortBy === value ? null : value
  recipeStore.setSortBy(next)
  emit('sortChange', next)
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
