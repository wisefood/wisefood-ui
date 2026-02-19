<template>
  <component :is="tooltip ? 'UTooltip' : 'div'" v-bind="tooltip ? { text: tooltip } : {}">
    <div class="flex flex-col items-center gap-1">
      <div
        class="relative shrink-0"
        :style="{ width: `${size}px`, height: `${size}px` }"
        :aria-label="`${label}: ${displayValue}`"
        role="img"
      >
        <svg class="transform -rotate-90" :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
          <circle
            :cx="center"
            :cy="center"
            :r="radius"
            stroke="currentColor"
            :stroke-width="strokeWidth"
            fill="none"
            class="text-gray-200 dark:text-zinc-700"
          />
          <circle
            :cx="center"
            :cy="center"
            :r="radius"
            stroke="currentColor"
            :stroke-width="strokeWidth"
            fill="none"
            :class="[colorClass, 'transition-all duration-700 ease-out']"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="offset"
            stroke-linecap="round"
          />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-xs font-semibold text-gray-800 dark:text-gray-200 tabular-nums">
            {{ displayValue }}
          </span>
        </div>
      </div>
      <div class="text-[11px] text-gray-600 dark:text-gray-400 text-center leading-tight">
        {{ label }}
      </div>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  value?: number | null
  max?: number | null
  tooltip?: string
  size?: number
  strokeWidth?: number
  colorClass?: string
}>(), {
  size: 56,
  strokeWidth: 4,
  colorClass: 'text-brand-500'
})

const center = computed(() => props.size / 2)
const radius = computed(() => Math.max(1, (props.size - props.strokeWidth) / 2 - 2))
const circumference = computed(() => 2 * Math.PI * radius.value)

const normalizedMax = computed(() => {
  const m = props.max ?? 0
  return m > 0 ? m : 1
})

const percent = computed(() => {
  const v = props.value ?? 0
  if (v <= 0) return 0
  return Math.min(v / normalizedMax.value, 1)
})

const offset = computed(() => circumference.value - percent.value * circumference.value)

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined) return '—'
  return new Intl.NumberFormat().format(props.value)
})
</script>
