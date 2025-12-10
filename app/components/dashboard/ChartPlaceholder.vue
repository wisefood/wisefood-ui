<!-- Minimal placeholder wrapper for future charts -->
<script setup lang="ts">
const props = defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <UCard>
    <template #header>
      <div class="space-y-1">
        <h3 class="text-lg font-semibold font-display text-gray-900 dark:text-white">
          {{ title }}
        </h3>
        <p v-if="description" class="text-sm text-gray-600 dark:text-gray-400">
          {{ description }}
        </p>
      </div>
    </template>

    <div class="flex items-center justify-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
      <div class="text-center space-y-3">
        <div class="flex justify-center">
          <div class="p-3 rounded-full bg-gray-200 dark:bg-gray-800">
            <UIcon name="i-lucide-bar-chart-3" class="w-6 h-6 text-gray-400 dark:text-gray-600" />
          </div>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-500">
          Chart visualization coming soon
        </p>
      </div>
    </div>

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UCard>
</template>
