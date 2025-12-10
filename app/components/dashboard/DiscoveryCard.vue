<!-- FoodScholar research highlight card -->
<script setup lang="ts">
const props = defineProps<{
  id: number
  title: string
  summary: string
  source: string
  date: string
}>()

const formattedDate = computed(() => {
  const d = new Date(props.date)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - d.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
})
</script>

<template>
  <UCard class="hover:shadow-lg transition-shadow duration-300">
    <div class="space-y-3">
      <div class="flex items-start gap-3">
        <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex-shrink-0">
          <UIcon name="i-lucide-microscope" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-base text-gray-900 dark:text-white mb-2 line-clamp-2">
            {{ title }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {{ summary }}
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <UBadge color="blue" variant="subtle" size="sm">
          {{ source }}
        </UBadge>
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {{ formattedDate }}
        </span>
      </div>
    </div>
  </UCard>
</template>
