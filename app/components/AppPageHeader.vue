<template>
  <div class="border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
    <!--
      Two forms. The full one is the brand moment every app page opens with.
      The compact one is for pages that own the whole screen (a chat, a tree):
      on a phone the full header is a third of the viewport, so below `sm`
      those pages fold it into one row and keep the screen for the work.
    -->
    <div
      v-if="compact"
      class="sm:hidden max-w-7xl mx-auto px-4 py-2 flex items-center gap-2"
    >
      <NuxtLink
        :to="backTo"
        class="inline-flex items-center justify-center min-h-11 min-w-11 -ml-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
        <span class="sr-only">{{ backLabel }}</span>
      </NuxtLink>
      <h1 class="min-w-0 flex items-baseline gap-2 font-light text-zinc-900 dark:text-white tracking-tight">
        <span :class="['font-serif italic text-xl shrink-0', brandClass]">{{ brandTitle }}</span>
        <span class="text-xs text-zinc-600 dark:text-zinc-300 font-light truncate">{{ subtitle }}</span>
      </h1>
      <div class="ml-auto flex items-center gap-2 shrink-0">
        <slot name="actions" />
      </div>
    </div>

    <div
      class="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6"
      :class="compact ? 'hidden sm:block' : ''"
    >
      <div class="flex items-center justify-between gap-3">
        <!-- A 44px hit box that does not change the row's height. -->
        <NuxtLink
          :to="backTo"
          class="inline-flex items-center gap-2 min-h-11 -my-3 -ml-2 px-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
          <span class="text-sm font-medium hidden sm:inline">{{ backLabel }}</span>
          <span class="sr-only sm:hidden">{{ backLabel }}</span>
        </NuxtLink>
        <div class="flex flex-wrap items-center justify-end gap-2 min-w-0">
          <slot name="actions" />
        </div>
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
  /** One row below `sm`. For pages that own the whole screen. */
  compact?: boolean
}>()
</script>
