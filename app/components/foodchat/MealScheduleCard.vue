<template>
  <div class="relative flex flex-col gap-3 p-5 bg-white dark:bg-zinc-800/50 transition-all hover:bg-gray-50 dark:hover:bg-zinc-700/30">
    <!-- Meal type + time -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <UIcon :name="icon" class="w-5 h-5 text-brandp-500" />
        <span class="text-xs font-semibold uppercase tracking-wider text-brandp-600 dark:text-brandp-400">{{ type }}</span>
      </div>
      <span class="text-xs text-gray-400 font-light">{{ time }}</span>
    </div>

    <!-- Recipe info row -->
    <div class="flex items-center gap-3 pr-16">
      <!-- Circular image bubble -->
      <NuxtLink
        :to="recipe.recipe_id ? `/recipe-wrangler/${recipe.recipe_id}` : ''"
        :target="recipe.recipe_id ? '_blank' : undefined"
        class="w-10 h-10 rounded-full shrink-0 overflow-hidden bg-gray-100 dark:bg-zinc-700 transition-transform duration-200 hover:scale-150 block"
      >
        <img
          v-if="recipeImage"
          :src="recipeImage"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <div v-else-if="nutritionLoading" class="w-full h-full animate-pulse bg-gray-200 dark:bg-zinc-600" />
        <div v-else class="w-full h-full flex items-center justify-center">
          <UIcon name="i-lucide-utensils" class="w-4 h-4 text-gray-300 dark:text-zinc-600" />
        </div>
      </NuxtLink>

      <NuxtLink
        v-if="recipe.recipe_id"
        :to="`/recipe-wrangler/${recipe.recipe_id}`"
        target="_blank"
        class="flex-1 min-w-0 font-medium text-sm sm:text-base text-gray-900 dark:text-white leading-snug hover:text-brandp-500 dark:hover:text-brandp-300 transition-colors"
      >{{ recipe.title }}</NuxtLink>
      <h3 v-else class="flex-1 min-w-0 font-medium text-sm sm:text-base text-gray-900 dark:text-white leading-snug">{{ recipe.title }}</h3>
    </div>

    <!-- Nutrient donut — bottom right corner -->
    <div
      class="absolute bottom-4 right-4 cursor-help"
      @mouseleave="hoveredSegment = null"
    >
      <svg
        width="60" height="60" viewBox="0 0 60 60"
        style="transform: rotate(-90deg)"
      >
        <!-- Track -->
        <circle cx="30" cy="30" r="23" stroke="#e5e7eb" stroke-width="6" fill="none" class="dark:stroke-zinc-700" />
        <!-- Segments -->
        <circle
          v-for="seg in segments"
          :key="seg.key"
          cx="30" cy="30" r="23"
          :stroke="seg.color"
          stroke-width="6"
          fill="none"
          :stroke-dasharray="`${seg.dash} ${circumference}`"
          :stroke-dashoffset="-seg.offset"
          stroke-linecap="butt"
          :style="{ opacity: hoveredSegment && hoveredSegment !== seg.key ? 0.25 : 1, transition: 'opacity 0.15s' }"
          @mouseenter="hoveredSegment = seg.key"
        />
      </svg>
      <!-- Center label -->
      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span v-if="nutritionLoading" class="text-[9px] text-gray-400">···</span>
        <template v-else-if="nutritionData">
          <span class="text-[10px] font-bold text-gray-700 dark:text-gray-200 leading-none">{{ centerValue }}</span>
          <span class="text-[8px] text-gray-400 dark:text-zinc-500 leading-none mt-0.5">{{ centerLabel }}</span>
        </template>
        <span v-else class="text-[9px] text-gray-300">—</span>
      </div>
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
const recipeImage = ref<string | null>(null)
const hoveredSegment = ref<string | null>(null)

onMounted(async () => {
  if (!props.recipe.recipe_id) return
  nutritionLoading.value = true
  try {
    const r = await recipeApi.getRecipe(props.recipe.recipe_id)
    nutritionData.value = r
    recipeImage.value = r.image_url ?? null
  } catch {
    // non-critical
  } finally {
    nutritionLoading.value = false
  }
})

// Brand palette colours (matching main.css vars)
// brandp-300 #a25ece  protein
// terracotta  #D98A6B  fat
// brandg-400  #b8c455  fiber
// earth-2     #CAD5B2  carbs
const SEGMENT_DEFS = [
  { key: 'protein', label: 'prot',  color: '#a25ece' },
  { key: 'carbs',   label: 'carbs', color: '#CAD5B2' },
  { key: 'fat',     label: 'fat',   color: '#D98A6B' },
  { key: 'fiber',   label: 'fiber', color: '#b8c455' },
]

const circumference = 2 * Math.PI * 23

const macros = computed(() => {
  const d = nutritionData.value
  if (!d) return null
  return {
    protein: Math.max(d.total_protein_g_per_serving ?? 0, 0),
    carbs:   Math.max(d.total_carbs_g_per_serving   ?? 0, 0),
    fat:     Math.max(d.total_fat_g_per_serving     ?? 0, 0),
    fiber:   Math.max(d.total_fiber_g_per_serving   ?? 0, 0),
  }
})

const segments = computed(() => {
  const m = macros.value
  if (!m) return []
  const values: Record<string, number> = { protein: m.protein, carbs: m.carbs, fat: m.fat, fiber: m.fiber }
  const total = Object.values(values).reduce((s, v) => s + v, 0) || 1
  let offset = 0
  return SEGMENT_DEFS.map(d => {
    const dash = (values[d.key] / total) * circumference
    const seg = { ...d, dash, offset }
    offset += dash
    return seg
  })
})

const centerValue = computed(() => {
  const m = macros.value
  if (!m) return '—'
  const key = hoveredSegment.value ?? 'protein'
  const val = (m as Record<string, number>)[key] ?? 0
  return `${Math.round(val)}g`
})

const centerLabel = computed(() => {
  const def = SEGMENT_DEFS.find(d => d.key === (hoveredSegment.value ?? 'protein'))
  return def?.label ?? 'prot'
})
</script>
