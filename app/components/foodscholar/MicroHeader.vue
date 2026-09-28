<template>
  <div class="border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div class="flex items-center justify-between gap-3">
        <!-- A 44px hit box that does not change the row's height. -->
        <NuxtLink
          v-if="showBack"
          :to="backTo"
          class="inline-flex items-center gap-2 min-h-11 -my-3 -ml-2 px-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <UIcon :name="backIcon" class="w-5 h-5" />
          <span class="text-sm font-medium hidden sm:inline">{{ backLabel }}</span>
          <span class="sr-only sm:hidden">{{ backLabel }}</span>
        </NuxtLink>
        <div v-else class="w-5" />
        <div class="flex flex-wrap items-center justify-end gap-2 min-w-0">
          <slot name="actions" />
        </div>
      </div>
      <div class="mt-1 flex items-end justify-between gap-4">
        <div class="min-w-0">
          <!-- On a phone the section name is an eyebrow over the title; wider,
               it sits to the right and leaves the title the full width. -->
          <p v-if="sectionTitle" class="sm:hidden text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{{ sectionTitle }}</p>
          <h1 class="font-light text-zinc-900 dark:text-white tracking-tight">
            <span class="font-serif italic text-2xl sm:text-3xl md:text-4xl text-brand-500 dark:text-brand-400">{{ brandTitle }}</span>
          </h1>
          <p class="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 font-light">{{ sectionSubtitle || brandLead }}</p>
        </div>
        <div v-if="sectionTitle" class="hidden sm:block shrink-0 text-right">
          <p class="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{{ sectionTitle }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  showBack: { type: Boolean, default: true },
  backTo: { type: [String, Object], default: '/dashboard' },
  backLabel: { type: String, default: 'Back to Dashboard' },
  backIcon: { type: String, default: 'i-lucide-arrow-left' },
  brandTitle: { type: String, default: 'FoodScholar' },
  brandLead: { type: String },
  sectionTitle: { type: String },
  sectionSubtitle: { type: String }
})
</script>
