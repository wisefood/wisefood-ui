<template>
  <NuxtLink
    :to="`/recipe-wrangler/collections/${encodeURIComponent(collection.urn)}`"
    class="group flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
  >
    <!-- Cover -->
    <div class="relative h-32 shrink-0 overflow-hidden bg-gradient-to-br from-brandg-50 to-brandg-100 dark:from-brandg-900/30 dark:to-brandg-800/30">
      <img
        v-if="coverUrl"
        :src="coverUrl"
        :alt="collection.title"
        class="w-full h-full object-contain p-4 bg-white dark:bg-zinc-900 transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="imageFailed = true"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <UIcon name="i-lucide-library-big" class="w-10 h-10 text-brandg-300 dark:text-brandg-700" />
      </div>

      <span
        v-if="collection.review_status === 'verified'"
        class="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-brandg-600/90 px-2 py-0.5 text-[0.6875rem] font-semibold text-white backdrop-blur-sm"
      >
        <UIcon name="i-lucide-shield-check" class="w-3 h-3" />
        Verified
      </span>
    </div>

    <!-- Body -->
    <div class="flex flex-1 flex-col p-4">
      <h3 class="font-semibold text-zinc-900 dark:text-white line-clamp-2 group-hover:text-brandg-600 dark:group-hover:text-brandg-400 transition-colors">
        {{ collection.title }}
      </h3>

      <p v-if="summary" class="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
        {{ summary }}
      </p>

      <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <span v-if="collection.recipe_count != null" class="inline-flex items-center gap-1 font-medium text-brandg-700 dark:text-brandg-300">
          <UIcon name="i-lucide-book-open" class="w-3.5 h-3.5" />
          {{ collection.recipe_count.toLocaleString() }} recipes
        </span>
        <span v-if="collection.source_type" class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-database" class="w-3.5 h-3.5" />
          {{ sourceTypeLabel }}
        </span>
        <span v-if="collection.language" class="inline-flex items-center gap-1 uppercase">
          <UIcon name="i-lucide-languages" class="w-3.5 h-3.5" />
          {{ collection.language }}
        </span>
      </div>

      <div v-if="collection.cuisines.length" class="mt-3 flex flex-wrap gap-1.5">
        <span
          v-for="cuisine in collection.cuisines.slice(0, 3)"
          :key="cuisine"
          class="inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 text-[0.6875rem] font-medium text-orange-800 dark:text-orange-200 border border-orange-100 dark:border-orange-900"
        >
          <span v-if="CUISINE_EMOJI[cuisine]" aria-hidden="true">{{ CUISINE_EMOJI[cuisine] }}</span>
          {{ humanizeFacet(cuisine) }}
        </span>
      </div>

      <div class="mt-auto pt-4 flex items-center gap-1 text-sm font-medium text-brandg-600 dark:text-brandg-400">
        <span>Browse collection</span>
        <UIcon name="i-lucide-arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { RecipeCollection, RCollectionSourceType } from '~/services/rcollectionsApi'
import { CUISINE_EMOJI, humanizeFacet } from '~/utils/facetPresentation'

const props = defineProps<{ collection: RecipeCollection }>()

const imageFailed = ref(false)
watch(() => props.collection.urn, () => { imageFailed.value = false })

const coverUrl = computed(() => imageFailed.value ? null : props.collection.image_url)

const SOURCE_TYPE_LABELS: Record<RCollectionSourceType, string> = {
  web_portal: 'Web portal',
  database: 'Database',
  book: 'Book',
  journal: 'Journal',
  other: 'Other'
}

const sourceTypeLabel = computed(() => {
  const type = props.collection.source_type
  return type ? SOURCE_TYPE_LABELS[type] ?? type : ''
})

/*
 * Descriptions are Markdown and some run to several screens. The card shows
 * the first plain-text sentence or two; the collection page renders the rest
 * properly, so stripping the syntax here is enough — rendering it would put
 * headings and lists inside a 4-line box.
 */
const summary = computed(() => {
  const raw = props.collection.description
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
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
