<!-- Three large accessible square action buttons -->
<script setup lang="ts">
import { MICROCOPY } from '@/utils/constants'

const actions = [
  {
    title: MICROCOPY.quickActions.scholar,
    description: 'Get evidence-based nutritional insights',
    icon: 'i-lucide-book-open',
    color: 'blue',
    to: '/scholar',
  },
  {
    title: MICROCOPY.quickActions.analyze,
    description: 'Check nutritional and environmental impact',
    icon: 'i-lucide-scanner',
    color: 'green',
    to: '/recipes/analyze',
  },
  {
    title: MICROCOPY.quickActions.mealPlan,
    description: 'AI-powered personalized meal suggestions',
    icon: 'i-lucide-sparkles',
    color: 'purple',
    to: '/chat',
  },
]

const colorClasses: Record<string, { icon: string; bg: string }> = {
  blue: {
    icon: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/20',
  },
  green: {
    icon: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/20',
  },
  purple: {
    icon: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/20',
  },
}
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold font-display text-gray-900 dark:text-white">
      Quick Actions
    </h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <NuxtLink
        v-for="action in actions"
        :key="action.title"
        :to="action.to"
        :aria-label="action.title"
        class="group"
      >
        <UCard
          class="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
        >
          <div class="flex flex-col items-center text-center gap-4 py-4">
            <div
              :class="[
                'p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110',
                colorClasses[action.color].bg,
              ]"
            >
              <UIcon
                :name="action.icon"
                :class="['w-8 h-8', colorClasses[action.color].icon]"
              />
            </div>
            <div class="space-y-2">
              <h3 class="font-semibold text-lg text-gray-900 dark:text-white">
                {{ action.title }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ action.description }}
              </p>
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>
  </div>
</template>
