<template>
  <UCard
    :ui="{ body: 'p-5' }"
    class="border border-gray-200/70 dark:border-white/10"
  >
    <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">
      {{ title }}
    </h3>
    <slot />
  </UCard>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>
