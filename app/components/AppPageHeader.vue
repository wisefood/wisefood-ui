<template>
  <div class="border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div class="flex items-center justify-between">
        <NuxtLink
          :to="backTo"
          class="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
          <span class="text-sm font-medium hidden sm:inline">{{ backLabel }}</span>
        </NuxtLink>
        <slot name="actions" />
      </div>
      <div class="mt-1">
        <h1 class="font-light text-zinc-900 dark:text-white tracking-tight">
          <span :class="['font-serif italic text-2xl sm:text-3xl md:text-4xl', brandClass]">{{ brandTitle }}</span>
        </h1>
        <p class="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 font-light">{{ subtitle }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  backTo: string
  backLabel: string
  brandTitle: string
  brandClass: string
  subtitle: string
}>()
</script>
