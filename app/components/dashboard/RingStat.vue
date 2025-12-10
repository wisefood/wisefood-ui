<!-- Accessible inline SVG ring for macro percent display -->
<script setup lang="ts">
const props = defineProps<{
  id: string
  label: string
  percent: number
  value: string
}>()

const radius = 40
const circumference = 2 * Math.PI * radius
const offset = ref(circumference)

const dashOffset = computed(() => {
  return circumference - (props.percent / 100) * circumference
})

onMounted(() => {
  setTimeout(() => {
    offset.value = dashOffset.value
  }, 100)
})
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <div class="relative w-24 h-24">
      <svg
        class="transform -rotate-90"
        :aria-label="`${label} ${percent}%`"
        role="img"
        width="96"
        height="96"
        viewBox="0 0 96 96"
      >
        <circle
          cx="48"
          cy="48"
          :r="radius"
          stroke="currentColor"
          stroke-width="8"
          fill="none"
          class="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx="48"
          cy="48"
          :r="radius"
          stroke="currentColor"
          stroke-width="8"
          fill="none"
          class="text-brand transition-all duration-1000 ease-out"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="offset"
          stroke-linecap="round"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-xl font-semibold text-gray-900 dark:text-white">{{ percent }}%</span>
      </div>
    </div>
    <div class="text-center">
      <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ label }}</p>
      <p class="text-xs text-gray-500 dark:text-gray-400">{{ value }}</p>
    </div>
  </div>
</template>
