<!--
  The filters currently narrowing the search, as removable chips.

  Sits under the search box on every width. Below `lg` the filter panel is a
  drawer, so once it closes nothing else on the page says why a search for
  "soup" came back with four recipes; on a desktop it is the same summary at
  a glance while the panel is collapsed.
-->
<template>
  <div
    v-if="chips.length"
    class="flex flex-wrap items-center gap-2"
    role="group"
    :aria-label="t('recipeWrangler.filters.active')"
  >
    <button
      v-for="chip in chips"
      :key="chip.key"
      type="button"
      :aria-label="t('recipeWrangler.filters.removeFilter', { label: chip.label })"
      :class="[
        'inline-flex items-center gap-1.5 max-w-full min-h-9 pointer-coarse:min-h-11 pl-2.5 pr-2 rounded-full border text-xs sm:text-sm font-medium transition-colors',
        chip.isSort
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'
          : 'bg-brandg-50 dark:bg-brandg-900/20 border-brandg-200 dark:border-brandg-800 text-brandg-700 dark:text-brandg-300 hover:bg-brandg-100 dark:hover:bg-brandg-900/40'
      ]"
      @click="remove(chip)"
    >
      <UIcon :name="chip.icon" class="w-3.5 h-3.5 shrink-0" />
      <span class="truncate">{{ chip.label }}</span>
      <UIcon name="i-lucide-x" class="w-3.5 h-3.5 shrink-0 opacity-60" />
    </button>
    <button
      type="button"
      class="min-h-9 pointer-coarse:min-h-11 px-2.5 rounded-full text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      @click="clearAll"
    >
      {{ t('recipeWrangler.filters.clearAll') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRecipeStore } from '~/stores/recipe'
import { useActiveRecipeFilters, type ActiveRecipeFilter } from '~/components/recipes/RecipeFilters.vue'

const emit = defineEmits<{ change: [] }>()
const { t } = useI18n()
const recipeStore = useRecipeStore()
const { chips, clearFilters } = useActiveRecipeFilters()

const remove = (chip: ActiveRecipeFilter) => {
  chip.remove()
  emit('change')
}

// Sort goes too. It is the one chip here that is not a filter, and a bar
// that says "Clear all" and leaves a chip behind reads as broken.
const clearAll = () => {
  clearFilters()
  recipeStore.setSortBy(null)
  emit('change')
}
</script>
