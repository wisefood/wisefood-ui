<template>
  <div class="relative w-full aspect-square max-w-lg mx-auto p-4">
    <svg viewBox="0 0 500 500" class="w-full h-full overflow-visible">
      <!-- Background grid circles -->
      <g class="text-zinc-200 dark:text-zinc-700">
        <circle
          v-for="level in 5"
          :key="level"
          cx="250"
          cy="250"
          :r="level * 28"
          fill="none"
          stroke="currentColor"
          stroke-width="1"
          :opacity="0.5 + (level * 0.1)"
        />
      </g>

      <!-- Axis lines -->
      <g class="text-zinc-300 dark:text-zinc-600">
        <line
          v-for="(nutrient, index) in nutrients"
          :key="`axis-${index}`"
          x1="250"
          y1="250"
          :x2="getAxisEndX(index)"
          :y2="getAxisEndY(index)"
          stroke="currentColor"
          stroke-width="1"
        />
      </g>

      <!-- Data polygon -->
      <polygon
        :points="polygonPoints"
        class="fill-brandg-500/30 dark:fill-brandg-400/30 stroke-brandg-500 dark:stroke-brandg-400"
        stroke-width="2"
        stroke-linejoin="round"
      />

      <!-- Data points -->
      <circle
        v-for="(point, index) in dataPoints"
        :key="`point-${index}`"
        :cx="point.x"
        :cy="point.y"
        r="6"
        class="fill-brandg-500 dark:fill-brandg-400 stroke-white dark:stroke-zinc-800"
        stroke-width="2"
      />

      <!-- Labels -->
      <g class="text-xs font-medium">
        <text
          v-for="(nutrient, index) in nutrients"
          :key="`label-${index}`"
          :x="getLabelX(index)"
          :y="getLabelY(index)"
          :text-anchor="getTextAnchor(index)"
          dominant-baseline="middle"
          class="fill-zinc-700 dark:fill-zinc-300"
        >
          <tspan>{{ nutrient.label }}</tspan>
          <tspan
            :x="getLabelX(index)"
            :dy="14"
            class="fill-zinc-500 dark:fill-zinc-400 text-[10px]"
          >
            {{ nutrient.displayValue }}
          </tspan>
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface NutrientData {
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

// Define nutrients with their max values for normalization
const nutrients = computed<NutrientData[]>(() => [
  { label: 'Calories', value: props.calories, max: 800, displayValue: `${Math.round(props.calories)} kcal` },
  { label: 'Protein', value: props.protein, max: 50, displayValue: `${props.protein.toFixed(1)}g` },
  { label: 'Carbs', value: props.carbs, max: 100, displayValue: `${props.carbs.toFixed(1)}g` },
  { label: 'Fat', value: props.fat, max: 50, displayValue: `${props.fat.toFixed(1)}g` },
  { label: 'Fiber', value: props.fiber, max: 30, displayValue: `${props.fiber.toFixed(1)}g` },
  { label: 'Sugar', value: props.sugar, max: 50, displayValue: `${props.sugar.toFixed(1)}g` },
  { label: 'Sodium', value: props.sodium, max: 2000, displayValue: `${props.sodium.toFixed(0)}mg` },
  { label: 'Cholesterol', value: props.cholesterol, max: 300, displayValue: `${props.cholesterol.toFixed(0)}mg` },
])

const centerX = 250
const centerY = 250
const maxRadius = 140

// Calculate angle for each nutrient (evenly distributed)
const getAngle = (index: number): number => {
  const angleStep = (2 * Math.PI) / nutrients.value.length
  return angleStep * index - Math.PI / 2 // Start from top
}

// Get normalized value (0 to 1)
const getNormalizedValue = (nutrient: NutrientData): number => {
  return Math.min(nutrient.value / nutrient.max, 1)
}

// Calculate point coordinates for a given nutrient
const getPointCoords = (index: number): { x: number; y: number } => {
  const angle = getAngle(index)
  const radius = getNormalizedValue(nutrients.value[index]) * maxRadius
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  }
}

// Get axis end coordinates (for grid lines)
const getAxisEndX = (index: number): number => {
  const angle = getAngle(index)
  return centerX + maxRadius * Math.cos(angle)
}

const getAxisEndY = (index: number): number => {
  const angle = getAngle(index)
  return centerY + maxRadius * Math.sin(angle)
}

// Get label position (outside the chart)
const getLabelX = (index: number): number => {
  const angle = getAngle(index)
  const labelRadius = maxRadius + 45
  return centerX + labelRadius * Math.cos(angle)
}

const getLabelY = (index: number): number => {
  const angle = getAngle(index)
  const labelRadius = maxRadius + 45
  return centerY + labelRadius * Math.sin(angle)
}

// Get text anchor based on position
const getTextAnchor = (index: number): string => {
  const angle = getAngle(index)
  const degrees = (angle * 180) / Math.PI
  if (degrees > -45 && degrees < 45) return 'start'
  if (degrees > 135 || degrees < -135) return 'end'
  return 'middle'
}

// Computed data points
const dataPoints = computed(() => {
  return nutrients.value.map((_, index) => getPointCoords(index))
})

// Computed polygon points string
const polygonPoints = computed(() => {
  return dataPoints.value.map(p => `${p.x},${p.y}`).join(' ')
})
</script>
