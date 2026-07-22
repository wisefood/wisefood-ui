<!-- Image-first recipe card with badges and save toggle -->
<script setup lang="ts">
import { computed } from 'vue'
import { MICROCOPY } from '@/utils/constants'
import { useRecipeStore } from '~/stores/recipe'

const props = defineProps<{
  id: number | string
  title: string
  thumb: string
  healthy: boolean
  sustainable: boolean
}>()

// This used to keep its own list in localStorage under 'wisefood-saved-recipes',
// which never reached the server and so disagreed with the hearts everywhere
// else. Favorites live in the recipe store, which syncs per member.
const recipeStore = useRecipeStore()

// Favorites are keyed by the opaque RecipeWrangler id (a string).
const recipeId = computed(() => String(props.id))

const isSaved = computed(() => recipeStore.isFavorite(recipeId.value))

const toggleSave = () => {
  recipeStore.toggleFavorite(recipeId.value)
}
</script>

<template>
  <div class="flex-shrink-0 w-64 snap-start">
    <UCard class="overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div class="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <img
          :src="thumb"
          :alt="title"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <button
          :aria-label="isSaved ? MICROCOPY.accessibility.unsaveRecipe : MICROCOPY.accessibility.saveRecipe"
          class="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 transition-all duration-200 hover:scale-110"
          @click="toggleSave"
        >
          <UIcon
            :name="isSaved ? 'i-lucide-heart-filled' : 'i-lucide-heart'"
            :class="[
              'w-5 h-5',
              isSaved ? 'text-brand' : 'text-gray-600 dark:text-gray-400'
            ]"
          />
        </button>
      </div>

      <template #footer>
        <div class="space-y-3">
          <h3 class="font-semibold text-base text-gray-900 dark:text-white line-clamp-2">
            {{ title }}
          </h3>
          <div class="flex gap-2 flex-wrap">
            <UBadge v-if="healthy" color="green" variant="subtle" size="sm">
              Healthy
            </UBadge>
            <UBadge v-if="sustainable" color="emerald" variant="subtle" size="sm">
              Sustainable
            </UBadge>
          </div>
        </div>
      </template>
    </UCard>
  </div>
</template>
