<template>
  <NuxtLink
    :to="`/recipe-wrangler/fctables/${encodeURIComponent(table.urn)}`"
    class="group flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm pointer-fine:hover:shadow-xl pointer-fine:hover:-translate-y-1 transition-all duration-300"
  >
    <div class="flex items-start gap-3 p-4 pb-0">
      <div class="w-10 h-10 shrink-0 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
        <UIcon name="i-lucide-table-2" class="w-5 h-5 text-sky-600 dark:text-sky-300" />
      </div>
      <div class="min-w-0">
        <h3 class="font-semibold text-zinc-900 dark:text-white line-clamp-2 group-hover:text-brandg-600 dark:group-hover:text-brandg-400 transition-colors">
          {{ table.title }}
        </h3>
        <p v-if="table.compiling_institution" class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
          {{ table.compiling_institution }}
        </p>
      </div>
    </div>

    <div class="flex flex-1 flex-col p-4 pt-3">
      <p v-if="summary" class="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
        {{ summary }}
      </p>

      <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <span v-if="table.number_of_entries != null" class="inline-flex items-center gap-1 font-medium text-sky-700 dark:text-sky-300">
          <UIcon name="i-lucide-list" class="w-3.5 h-3.5" />
          {{ table.number_of_entries.toLocaleString() }} foods
        </span>
        <span v-if="table.completeness_percent != null" class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-gauge" class="w-3.5 h-3.5" />
          {{ Math.round(table.completeness_percent) }}% complete
        </span>
        <span v-if="table.region" class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-map-pin" class="w-3.5 h-3.5" />
          {{ table.region }}
        </span>
      </div>

      <div v-if="table.nutrient_coverage.length" class="mt-3 flex flex-wrap gap-1.5">
        <span
          v-for="nutrient in table.nutrient_coverage.slice(0, 3)"
          :key="nutrient"
          class="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 text-[0.6875rem] font-medium text-zinc-600 dark:text-zinc-300"
        >
          {{ humanizeFacet(nutrient) }}
        </span>
        <span
          v-if="table.nutrient_coverage.length > 3"
          class="inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium text-zinc-500 dark:text-zinc-400"
        >
          +{{ table.nutrient_coverage.length - 3 }} more
        </span>
      </div>

      <div class="mt-auto pt-4 flex items-center gap-1 text-sm font-medium text-brandg-600 dark:text-brandg-400">
        <span>View table</span>
        <UIcon name="i-lucide-arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FCTable } from '~/services/fctablesApi'
import { humanizeFacet } from '~/utils/facetPresentation'

const props = defineProps<{ table: FCTable }>()

/** Markdown stripped to plain text; the detail page renders the real thing. */
const summary = computed(() => {
  const raw = props.table.description
  if (!raw) return ''
  return raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180)
})
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
