<template>
  <div class="flex flex-col gap-3 p-5 bg-white dark:bg-zinc-800/50 transition-all hover:bg-gray-50 dark:hover:bg-zinc-700/30">
    <!-- Meal type + time -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <UIcon :name="icon" class="w-5 h-5 text-brandp-500" />
        <span class="text-xs font-semibold uppercase tracking-wider text-brandp-600 dark:text-brandp-400">{{ type }}</span>
      </div>
      <span class="text-xs text-gray-400 font-light">{{ time }}</span>
    </div>

    <!-- Recipe info -->
    <div class="flex items-start gap-3">
      <div class="flex-1 min-w-0">
        <h3 class="font-medium text-sm sm:text-base text-gray-900 dark:text-white mb-1.5 leading-snug">{{ recipe.title }}</h3>
        <p v-if="recipe.ingredients" class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-light leading-relaxed line-clamp-2">
          {{ recipe.ingredients }}
        </p>
      </div>

      <!-- Mini ring chart with tooltip — real nutritional data -->
      <UTooltip :text="nutritionTooltip">
        <div class="relative w-10 h-10 shrink-0 cursor-help">
          <svg class="transform -rotate-90" width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="15" stroke="currentColor" stroke-width="3" fill="none" class="text-gray-200 dark:text-zinc-700" />
            <circle
              cx="20" cy="20" r="15"
              stroke="currentColor" stroke-width="3" fill="none"
              class="text-brandp-500 transition-all duration-700 ease-out"
              :stroke-dasharray="ringCircumference"
              :stroke-dashoffset="ringOffset"
              stroke-linecap="round"
            />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <span v-if="nutritionLoading" class="text-[9px] text-gray-400">...</span>
            <span v-else class="text-[9px] font-semibold text-gray-700 dark:text-gray-300">{{ displayCalories }}</span>
          </div>
        </div>
      </UTooltip>
    </div>

    <!-- View recipe link -->
    <div v-if="recipe.recipe_id" class="mt-auto pt-1">
      <NuxtLink
        :to="`/recipe-wrangler/${recipe.recipe_id}`"
        class="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-brandp-600 dark:text-brandp-400 hover:text-brandp-700 dark:hover:text-brandp-300 transition-colors"
      >
        <UIcon name="i-lucide-external-link" class="w-3.5 h-3.5" />
        {{ t('foodChatHome.mealCard.viewRecipe') }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MealRecipe } from '~/services/foodchatApi'
import type { Recipe } from '~/services/recipeApi'
import recipeApi from '~/services/recipeApi'

const props = defineProps<{
  type: string
  time: string
  icon: string
  recipe: MealRecipe
}>()
const { t } = useI18n()

const nutritionData = ref<Recipe | null>(null)
const nutritionLoading = ref(false)

onMounted(async () => {
  if (!props.recipe.recipe_id) return
  nutritionLoading.value = true
  try {
    nutritionData.value = await recipeApi.getRecipe(props.recipe.recipe_id)
  } catch {
    // Non-critical — ring will show fallback
  } finally {
    nutritionLoading.value = false
  }
})

// Ring chart: show kcal percentage of a 2000 kcal daily target
const kcal = computed(() => nutritionData.value?.total_kcal_per_serving ?? 0)
const kcalPercent = computed(() => Math.min(Math.round((kcal.value / 2000) * 100), 100))

const displayCalories = computed(() => {
  if (!nutritionData.value) return '—'
  return `${Math.round(kcal.value)}`
})

const ringRadius = 15
const ringCircumference = 2 * Math.PI * ringRadius
const ringOffset = computed(() => ringCircumference - (kcalPercent.value / 100) * ringCircumference)

const nutritionTooltip = computed(() => {
  if (!nutritionData.value) return t('foodChatHome.mealCard.loadingNutrition')
  const d = nutritionData.value
  return `${Math.round(d.total_kcal_per_serving)} kcal · P ${Math.round(d.total_protein_g_per_serving)}g · C ${Math.round(d.total_carbs_g_per_serving)}g · F ${Math.round(d.total_fat_g_per_serving)}g`
})
</script>
