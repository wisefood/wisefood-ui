<!-- Hero card with greeting, wellness ring, and callout badge -->
<script setup lang="ts">
import { MICROCOPY, TIME_OF_DAY } from '@/utils/constants'

const props = defineProps<{
  greeting?: string
  encouragement: string
  wellnessPercent: number
  callout: string
}>()

const currentGreeting = computed(() => {
  if (props.greeting) return props.greeting

  const hour = new Date().getHours()
  if (hour >= TIME_OF_DAY.morning.start && hour < TIME_OF_DAY.morning.end) {
    return MICROCOPY.hero.morning
  } else if (hour >= TIME_OF_DAY.afternoon.start && hour < TIME_OF_DAY.afternoon.end) {
    return MICROCOPY.hero.afternoon
  } else {
    return MICROCOPY.hero.evening
  }
})

const radius = 60
const circumference = 2 * Math.PI * radius
const offset = ref(circumference)

const dashOffset = computed(() => {
  return circumference - (props.wellnessPercent / 100) * circumference
})

onMounted(() => {
  setTimeout(() => {
    offset.value = dashOffset.value
  }, 200)
})
</script>

<template>
  <UCard class="bg-gradient-to-br from-earth-1 to-white dark:from-gray-900 dark:to-gray-800 border-none shadow-lg">
    <div class="flex flex-col md:flex-row items-center justify-between gap-8 py-4">
      <div class="flex-1 text-center md:text-left">
        <h1 class="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
          {{ currentGreeting }}
        </h1>
        <p class="text-base text-gray-600 dark:text-gray-300 mb-4">
          {{ encouragement }}
        </p>
        <UBadge color="green" variant="subtle" size="lg" class="inline-flex items-center gap-2">
          <UIcon name="i-lucide-check-circle" class="w-4 h-4" />
          {{ callout }}
        </UBadge>
      </div>

      <div class="relative w-36 h-36 flex-shrink-0">
        <svg
          class="transform -rotate-90"
          :aria-label="`${MICROCOPY.accessibility.wellnessRing} ${wellnessPercent} percent`"
          role="img"
          width="144"
          height="144"
          viewBox="0 0 144 144"
        >
          <circle
            cx="72"
            cy="72"
            :r="radius"
            stroke="currentColor"
            stroke-width="12"
            fill="none"
            class="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="72"
            cy="72"
            :r="radius"
            stroke="currentColor"
            stroke-width="12"
            fill="none"
            class="text-brandg transition-all duration-1500 ease-out"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="offset"
            stroke-linecap="round"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-3xl font-bold text-gray-900 dark:text-white">{{ wellnessPercent }}%</span>
          <span class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Wellness</span>
        </div>
      </div>
    </div>
  </UCard>
</template>
