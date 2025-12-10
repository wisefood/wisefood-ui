<template>
  <UCard :ui="{ body: { padding: 'p-5 sm:p-6' } }">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
          {{ title }}
        </p>
        <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
          {{ value }}
        </p>
        <p v-if="subtitle" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ subtitle }}
        </p>
      </div>
      <div
        v-if="icon"
        :class="[
          'flex h-12 w-12 items-center justify-center rounded-lg',
          iconBackgroundClass
        ]"
      >
        <UIcon :name="icon" :class="['h-6 w-6', iconColorClass]" />
      </div>
    </div>
    <div v-if="trend" class="mt-4 flex items-center">
      <UIcon
        :name="trend.direction === 'up' ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
        :class="[
          'h-4 w-4 mr-1',
          trend.direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        ]"
      />
      <span
        :class="[
          'text-sm font-medium',
          trend.direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        ]"
      >
        {{ trend.value }}
      </span>
      <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
        {{ trend.label }}
      </span>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Trend {
  direction: 'up' | 'down'
  value: string
  label: string
}

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  iconColorClass?: string
  iconBackgroundClass?: string
  trend?: Trend
}

withDefaults(defineProps<Props>(), {
  iconColorClass: 'text-primary-600 dark:text-primary-400',
  iconBackgroundClass: 'bg-primary-100 dark:bg-primary-900/20'
})
</script>
