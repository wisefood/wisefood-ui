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
        <!-- Background grid circles, each labelled with the share of the
             daily reference intake it represents. Unlabelled rings were the
             literal complaint: "grid levels ... are unclear". -->
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
        <g class="text-[9px] fill-zinc-400 dark:fill-zinc-500">
          <text
            v-for="level in 5"
            :key="`ring-${level}`"
            x="203"
            :y="200 - level * 20 + 3"
            text-anchor="start"
          >{{ level * 20 }}%</text>
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
            <tspan>{{ nutrient.lowerIsBetter ? '▼ ' : '' }}{{ nutrient.label }}</tspan>
            <tspan
              :x="getLabelX(index, visibleNutrients.length)"
              :dy="12"
              class="fill-zinc-500 dark:fill-zinc-400 text-[10px]"
            >
              {{ nutrient.displayValue }}
            </tspan>
            <tspan
              :x="getLabelX(index, visibleNutrients.length)"
              :dy="11"
              :class="nutrient.overRi
                ? 'fill-amber-600 dark:fill-amber-400 text-[10px] font-semibold'
                : 'fill-zinc-400 dark:fill-zinc-500 text-[10px]'"
            >
              {{ Math.round(nutrient.percentRi) }}%{{ nutrient.overRi ? '+' : '' }} RI
            </tspan>
          </text>
        </g>
      </svg>
    </div>

    <!-- Nutrient Toggles -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <button
        v-for="nutrient in allNutrients"
        :key="nutrient.key"
        @click="toggleNutrient(nutrient.key)"
        :class="[
          'text-left px-3 py-2 rounded-lg border transition-all',
          visibleKeys.has(nutrient.key)
            ? 'bg-brandg-50 dark:bg-brandg-900/30 border-brandg-300 dark:border-brandg-700'
            : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 opacity-70'
        ]"
      >
        <div class="flex items-center gap-2">
          <span
            :class="[
              'w-2.5 h-2.5 rounded-full transition-colors',
              visibleKeys.has(nutrient.key)
                ? 'bg-brandg-500 dark:bg-brandg-400'
                : 'bg-zinc-300 dark:bg-zinc-600'
            ]"
          />
          <span class="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {{ nutrient.label }}
          </span>
        </div>
        <div class="text-[11px] mt-1 text-zinc-500 dark:text-zinc-400">
          {{ nutrient.displayValue }}
          <span :class="nutrient.overRi ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''">
            · {{ Math.round(nutrient.percentRi) }}%{{ nutrient.overRi ? '+' : '' }} RI
          </span>
        </div>
      </button>
    </div>

    <!-- What the rings mean, and which direction is the good one. Without
         this the chart implies one direction is better for every axis, while
         it plots fibre (more is better) next to sodium (less is better). -->
    <div class="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2.5 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
      <p>{{ t('recipeWrangler.detail.nutrientChart.ringsExplainer') }}</p>
      <p class="mt-1">
        <span class="font-semibold text-zinc-700 dark:text-zinc-300">▼</span>
        {{ t('recipeWrangler.detail.nutrientChart.lowerIsBetter') }}
      </p>
      <p class="mt-1">
        {{ t('recipeWrangler.detail.nutrientChart.fibreNote') }}
      </p>
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
  /** Daily reference intake, in this nutrient's own unit. */
  max: number
  displayValue: string
  /** Percentage of the reference intake this serving provides. */
  percentRi: number
  /** True where a smaller number is the better one. */
  lowerIsBetter: boolean
  /** Set when the serving exceeds the whole daily reference. */
  overRi: boolean
}

// Daily reference intakes for an average adult (8400 kJ / 2000 kcal), from
// EU Regulation 1169/2011 Annex XIII — the same basis as the "%RI" figures on
// a supermarket label, so the numbers here mean what a shopper already expects
// them to mean.
//
// Every axis was previously normalised against a different and undeclared
// basis: calories against 800 (a meal), sodium against 2000 mg (most of a day),
// fibre against 30 g. Plotting a meal-sized cap and a day-sized cap on the same
// rings makes the shape of the polygon meaningless, which is what "scaling
// across different units is unclear" was describing.
//
// Fibre has no RI in Annex XIII; 25 g is the EFSA adequate intake for adults
// and is labelled as such in the explainer rather than passed off as an RI.
const REFERENCE_INTAKE = {
  // kcal
  calories: 2000,
  // grams
  fat: 70,
  carbs: 260,
  sugar: 90,
  protein: 50,
  // grams — EFSA adequate intake, not an Annex XIII reference intake
  fiber: 25,
  // milligrams, equivalent to 6 g of salt
  sodium: 2400
} as const

// Nutrients where the advice is to keep the number down. The chart cannot show
// a single "further out is better" direction because it plots both kinds at
// once — fibre outward is good, sodium outward is not — so the axis says which
// it is instead of leaving the reader to assume.
const LOWER_IS_BETTER = new Set(['fat', 'sugar', 'sodium'])

type MaybeNumber = number | null | undefined

const props = defineProps<{
  calories: MaybeNumber
  protein: MaybeNumber
  carbs: MaybeNumber
  fat: MaybeNumber
  fiber: MaybeNumber
  sugar: MaybeNumber
  sodium: MaybeNumber
}>()
const { t } = useI18n()

const hasNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value)
}

const safeNumber = (value: MaybeNumber): number => {
  return hasNumber(value) ? value : 0
}

const fmtFixed = (value: MaybeNumber, digits: number, unit: string): string => {
  return hasNumber(value) ? `${value.toFixed(digits)}${unit}` : `—${unit}`
}

const fmtRounded = (value: MaybeNumber, unit: string): string => {
  return hasNumber(value) ? `${Math.round(value)} ${unit}` : `— ${unit}`
}

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
  'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'
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

// Define all nutrients against their reference intake
const buildNutrient = (
  key: keyof typeof REFERENCE_INTAKE,
  value: MaybeNumber,
  displayValue: string
): NutrientData => {
  const max = REFERENCE_INTAKE[key]
  const safe = safeNumber(value)
  const percentRi = max > 0 ? (safe / max) * 100 : 0
  return {
    key,
    label: t(`recipeWrangler.detail.${key}`),
    value: safe,
    max,
    displayValue,
    percentRi,
    lowerIsBetter: LOWER_IS_BETTER.has(key),
    overRi: percentRi > 100
  }
}

const allNutrients = computed<NutrientData[]>(() => [
  buildNutrient('calories', props.calories, fmtRounded(props.calories, 'kcal')),
  buildNutrient('protein', props.protein, fmtFixed(props.protein, 1, ' g')),
  buildNutrient('carbs', props.carbs, fmtFixed(props.carbs, 1, ' g')),
  buildNutrient('fat', props.fat, fmtFixed(props.fat, 1, ' g')),
  buildNutrient('fiber', props.fiber, fmtFixed(props.fiber, 1, ' g')),
  buildNutrient('sugar', props.sugar, fmtFixed(props.sugar, 1, ' g')),
  buildNutrient('sodium', props.sodium, fmtRounded(props.sodium, 'mg'))
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

// Get normalized value (0 to 1), where 1 is the full daily reference intake.
//
// Linear, deliberately. This was Math.sqrt(value / max) to "make low but valid
// values easier to read", which bought legibility with honesty: a point three
// rings out of five reads as 60% and was actually 36%. On a chart whose rings
// are labelled as percentages of a reference intake, the radius has to be the
// percentage.
//
// A single serving usually lands in the inner half, and that is the true and
// useful answer — one meal is a fraction of a day. Anything past the rim is
// clamped and flagged via `overRi` rather than drawn outside the chart.
const getNormalizedValue = (nutrient: NutrientData): number => {
  return Math.min(Math.max(nutrient.percentRi / 100, 0), 1)
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
