<template>
  <div class="flex flex-col gap-4">
    <!-- Zoom Controls -->
    <div class="flex items-center justify-center gap-2">
      <button
        @click="zoomOut"
        :disabled="zoomLevel <= 0.5"
        class="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <UIcon name="i-lucide-zoom-out" class="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
      </button>
      <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400 w-12 text-center">
        {{ Math.round(zoomLevel * 100) }}%
      </span>
      <button
        @click="zoomIn"
        :disabled="zoomLevel >= 2"
        class="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <UIcon name="i-lucide-zoom-in" class="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
      </button>
      <button
        @click="resetZoom"
        class="ml-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300 transition-colors"
      >
        {{ t('recipeWrangler.detail.nutrientChart.reset') }}
      </button>
    </div>

    <!-- Chart Container -->
    <div class="relative w-full aspect-square max-w-xl mx-auto overflow-hidden">
      <svg
        :viewBox="computedViewBox"
        class="w-full h-full transition-all duration-300 ease-out"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Background grid circles -->
        <g class="text-zinc-200 dark:text-zinc-700">
          <circle
            v-for="level in 5"
            :key="level"
            cx="200"
            cy="200"
            :r="level * 20"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
            :opacity="0.5 + (level * 0.1)"
          />
        </g>

        <!-- Axis lines for visible nutrients -->
        <g class="text-zinc-300 dark:text-zinc-600">
          <line
            v-for="(nutrient, index) in visibleNutrients"
            :key="`axis-${nutrient.key}`"
            x1="200"
            y1="200"
            :x2="getAxisEndX(index, visibleNutrients.length)"
            :y2="getAxisEndY(index, visibleNutrients.length)"
            stroke="currentColor"
            stroke-width="1"
          />
        </g>

        <!-- Data polygon -->
        <polygon
          v-if="visibleNutrients.length >= 3"
          :points="polygonPoints"
          class="fill-brandg-500/30 dark:fill-brandg-400/30 stroke-brandg-500 dark:stroke-brandg-400 transition-all duration-300"
          stroke-width="2"
          stroke-linejoin="round"
        />

        <!-- Data points -->
        <circle
          v-for="(point, index) in dataPoints"
          :key="`point-${visibleNutrients[index]?.key}`"
          :cx="point.x"
          :cy="point.y"
          r="5"
          class="fill-brandg-500 dark:fill-brandg-400 stroke-white dark:stroke-zinc-800 transition-all duration-300"
          stroke-width="2"
        />

        <!-- Labels -->
        <g class="text-xs font-medium">
          <text
            v-for="(nutrient, index) in visibleNutrients"
            :key="`label-${nutrient.key}`"
            :x="getLabelX(index, visibleNutrients.length)"
            :y="getLabelY(index, visibleNutrients.length)"
            :text-anchor="getTextAnchor(index, visibleNutrients.length)"
            dominant-baseline="middle"
            class="fill-zinc-700 dark:fill-zinc-300 transition-all duration-300"
          >
            <tspan>{{ nutrient.label }}</tspan>
            <tspan
              :x="getLabelX(index, visibleNutrients.length)"
              :dy="12"
              class="fill-zinc-500 dark:fill-zinc-400 text-[10px]"
            >
              {{ nutrient.displayValue }}
            </tspan>
          </text>
        </g>
      </svg>
    </div>

    <!-- Horizontal Scrollable Legend -->
    <div class="relative">
      <div class="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent">
        <div class="flex gap-2 min-w-max px-1">
          <button
            v-for="nutrient in allNutrients"
            :key="nutrient.key"
            @click="toggleNutrient(nutrient.key)"
            :class="[
              'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all whitespace-nowrap',
              visibleKeys.has(nutrient.key)
                ? 'bg-brandg-50 dark:bg-brandg-900/30 border-brandg-300 dark:border-brandg-700'
                : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 opacity-50'
            ]"
          >
            <span
              :class="[
                'w-3 h-3 rounded-full transition-colors',
                visibleKeys.has(nutrient.key)
                  ? 'bg-brandg-500 dark:bg-brandg-400'
                  : 'bg-zinc-300 dark:bg-zinc-600'
              ]"
            />
            <span class="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {{ nutrient.label }}
            </span>
            <span class="text-[10px] text-zinc-500 dark:text-zinc-400">
              {{ nutrient.displayValue }}
            </span>
          </button>
        </div>
      </div>
      <!-- Scroll indicators -->
      <div class="absolute left-0 top-0 bottom-2 w-6 bg-gradient-to-r from-white dark:from-zinc-800 to-transparent pointer-events-none" />
      <div class="absolute right-0 top-0 bottom-2 w-6 bg-gradient-to-l from-white dark:from-zinc-800 to-transparent pointer-events-none" />
    </div>

    <!-- Minimum selection warning -->
    <p v-if="visibleNutrients.length < 3" class="text-center text-xs text-amber-600 dark:text-amber-400">
      {{ t('recipeWrangler.detail.nutrientChart.minSelectionWarning') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface NutrientData {
  key: string
  label: string
  value: number
  max: number
  displayValue: string
}

const props = defineProps<{
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  cholesterol: number
}>()
const { t } = useI18n()

// Zoom state - using viewBox manipulation for centered zoom
const zoomLevel = ref(1)
const baseViewBoxSize = 400
const centerPoint = 200

// Computed viewBox that zooms while keeping center
const computedViewBox = computed(() => {
  const size = baseViewBoxSize / zoomLevel.value
  const offset = centerPoint - size / 2
  return `${offset} ${offset} ${size} ${size}`
})

const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value + 0.25, 2)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value - 0.25, 0.5)
}

const resetZoom = () => {
  zoomLevel.value = 1
}

// Visible nutrients tracking
const visibleKeys = ref(new Set([
  'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium', 'cholesterol'
]))

const toggleNutrient = (key: string) => {
  const newSet = new Set(visibleKeys.value)
  if (newSet.has(key)) {
    newSet.delete(key)
  } else {
    newSet.add(key)
  }
  visibleKeys.value = newSet
  // Reset zoom when nutrients change to keep chart centered
  zoomLevel.value = 1
}

// Define all nutrients with their max values for normalization
const allNutrients = computed<NutrientData[]>(() => [
  { key: 'calories', label: t('recipeWrangler.detail.calories'), value: props.calories, max: 800, displayValue: `${Math.round(props.calories)} kcal` },
  { key: 'protein', label: t('recipeWrangler.detail.protein'), value: props.protein, max: 50, displayValue: `${props.protein.toFixed(1)}g` },
  { key: 'carbs', label: t('recipeWrangler.detail.carbs'), value: props.carbs, max: 100, displayValue: `${props.carbs.toFixed(1)}g` },
  { key: 'fat', label: t('recipeWrangler.detail.fat'), value: props.fat, max: 50, displayValue: `${props.fat.toFixed(1)}g` },
  { key: 'fiber', label: t('recipeWrangler.detail.fiber'), value: props.fiber, max: 30, displayValue: `${props.fiber.toFixed(1)}g` },
  { key: 'sugar', label: t('recipeWrangler.detail.sugar'), value: props.sugar, max: 50, displayValue: `${props.sugar.toFixed(1)}g` },
  { key: 'sodium', label: t('recipeWrangler.detail.sodium'), value: props.sodium, max: 2000, displayValue: `${props.sodium.toFixed(0)}mg` },
  { key: 'cholesterol', label: t('recipeWrangler.detail.cholesterol'), value: props.cholesterol, max: 300, displayValue: `${props.cholesterol.toFixed(0)}mg` }
])

// Filtered visible nutrients
const visibleNutrients = computed(() => {
  return allNutrients.value.filter(n => visibleKeys.value.has(n.key))
})

const centerX = 200
const centerY = 200
const maxRadius = 100

// Calculate angle for each nutrient (evenly distributed)
const getAngle = (index: number, total: number): number => {
  const angleStep = (2 * Math.PI) / total
  return angleStep * index - Math.PI / 2 // Start from top
}

// Get normalized value (0 to 1)
const getNormalizedValue = (nutrient: NutrientData): number => {
  return Math.min(nutrient.value / nutrient.max, 1)
}

// Calculate point coordinates for a given nutrient
const getPointCoords = (index: number, total: number, nutrient: NutrientData): { x: number, y: number } => {
  const angle = getAngle(index, total)
  const radius = getNormalizedValue(nutrient) * maxRadius
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle)
  }
}

// Get axis end coordinates (for grid lines)
const getAxisEndX = (index: number, total: number): number => {
  const angle = getAngle(index, total)
  return centerX + maxRadius * Math.cos(angle)
}

const getAxisEndY = (index: number, total: number): number => {
  const angle = getAngle(index, total)
  return centerY + maxRadius * Math.sin(angle)
}

// Get label position (outside the chart)
const getLabelX = (index: number, total: number): number => {
  const angle = getAngle(index, total)
  const labelRadius = maxRadius + 35
  return centerX + labelRadius * Math.cos(angle)
}

const getLabelY = (index: number, total: number): number => {
  const angle = getAngle(index, total)
  const labelRadius = maxRadius + 35
  return centerY + labelRadius * Math.sin(angle)
}

// Get text anchor based on position
const getTextAnchor = (index: number, total: number): string => {
  const angle = getAngle(index, total)
  const degrees = (angle * 180) / Math.PI
  if (degrees > -45 && degrees < 45) return 'start'
  if (degrees > 135 || degrees < -135) return 'end'
  return 'middle'
}

// Computed data points
const dataPoints = computed(() => {
  const total = visibleNutrients.value.length
  return visibleNutrients.value.map((nutrient, index) => getPointCoords(index, total, nutrient))
})

// Computed polygon points string
const polygonPoints = computed(() => {
  return dataPoints.value.map(p => `${p.x},${p.y}`).join(' ')
})
</script>

<style scoped>
/* Custom scrollbar styles */
.scrollbar-thin::-webkit-scrollbar {
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgb(212 212 216);
  border-radius: 3px;
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgb(82 82 91);
}
</style>
