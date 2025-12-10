<!-- Compact sustainability highlight card with CTA -->
<script setup lang="ts">
const props = defineProps<{
  ingredient: string
  note: string
  cta: string
  img: string
}>()
</script>

<template>
  <UCard class="overflow-hidden hover:shadow-lg transition-shadow duration-300">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-leaf" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h3 class="text-lg font-semibold font-display text-gray-900 dark:text-white">
          Sustainability Spotlight
        </h3>
      </div>
    </template>

    <div class="space-y-4">
      <div class="flex items-center gap-4">
        <div class="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
          <img
            :src="img"
            :alt="ingredient"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div class="flex-1">
          <h4 class="font-semibold text-base text-gray-900 dark:text-white mb-1">
            {{ ingredient }}
          </h4>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ note }}
          </p>
        </div>
      </div>

      <UButton
        color="emerald"
        variant="soft"
        block
        trailing-icon="i-lucide-arrow-right"
      >
        {{ cta }}
      </UButton>
    </div>
  </UCard>
</template>
