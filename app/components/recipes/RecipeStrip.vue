<template>
  <section>
    <!-- Heading -->
    <div class="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h2 class="text-xl sm:text-2xl font-claude text-zinc-900 dark:text-white flex items-center gap-2">
          <UIcon v-if="icon" :name="icon" class="w-5 h-5 text-brandg-500 shrink-0" />
          {{ title }}
        </h2>
        <p v-if="subtitle" class="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{{ subtitle }}</p>
      </div>
      <slot name="actions" />
    </div>

    <!-- Loading: the same grid, so nothing jumps when it resolves -->
    <div v-if="loading" :class="gridClass">
      <div
        v-for="index in skeletonCount"
        :key="`skeleton-${index}`"
        class="rounded-xl overflow-hidden bg-white dark:bg-zinc-800 shadow-md animate-pulse"
      >
        <div class="aspect-[4/3] bg-zinc-200 dark:bg-zinc-700" />
        <div class="p-4 space-y-3">
          <div class="h-4 rounded bg-zinc-200 dark:bg-zinc-700 w-4/5" />
          <div class="h-3 rounded bg-zinc-200 dark:bg-zinc-700 w-1/2" />
          <div class="h-3 rounded bg-zinc-200 dark:bg-zinc-700 w-2/3" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-5 flex flex-wrap items-center justify-between gap-3"
    >
      <p class="flex items-center gap-2 text-sm text-red-800 dark:text-red-200">
        <UIcon name="i-lucide-alert-circle" class="w-4 h-4 shrink-0" />
        {{ error }}
      </p>
      <UButton color="error" variant="soft" size="sm" class="cursor-pointer" @click="emit('retry')">
        Try again
      </UButton>
    </div>

    <!-- Empty -->
    <div
      v-else-if="!recipes.length"
      class="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center"
    >
      <UIcon name="i-lucide-utensils-crossed" class="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
      <p class="font-medium text-zinc-700 dark:text-zinc-300">{{ emptyTitle }}</p>
      <p v-if="emptyDescription" class="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
        {{ emptyDescription }}
      </p>
    </div>

    <!-- Results -->
    <template v-else>
      <div :class="gridClass">
        <RecipesRecipeCard
          v-for="recipe in recipes"
          :key="recipe.recipe_id || recipe.id"
          :recipe="recipe"
        />
      </div>

      <div v-if="hasMore" class="mt-6 flex justify-center">
        <UButton
          color="neutral"
          variant="outline"
          size="lg"
          class="cursor-pointer"
          :loading="loadingMore"
          @click="emit('loadMore')"
        >
          {{ loadingMore ? 'Loading…' : 'Show more recipes' }}
        </UButton>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
/**
 * A grid of recipe cards with its four states.
 *
 * Presentational on purpose: the collection page pages through thousands of
 * recipes and the detail page shows six and never pages, so fetching stays
 * with whoever knows which of those it is.
 */
import { computed } from 'vue'
import type { RecipeSearchResult } from '~/services/recipeApi'

const props = withDefaults(defineProps<{
  title: string
  recipes: RecipeSearchResult[]
  subtitle?: string
  icon?: string
  loading?: boolean
  loadingMore?: boolean
  error?: string | null
  hasMore?: boolean
  /** Placeholders while the first page loads. Match the real page size. */
  skeletonCount?: number
  columns?: 3 | 4
  emptyTitle?: string
  emptyDescription?: string
}>(), {
  subtitle: undefined,
  icon: undefined,
  loading: false,
  loadingMore: false,
  error: null,
  hasMore: false,
  skeletonCount: 3,
  columns: 3,
  emptyTitle: 'No recipes to show',
  emptyDescription: undefined
})

const emit = defineEmits<{ retry: [], loadMore: [] }>()

// Written out rather than interpolated: Tailwind reads the source for class
// names, and `md:grid-cols-${n}` is a class that never gets generated.
const gridClass = computed(() => props.columns === 4
  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6'
  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6')
</script>
