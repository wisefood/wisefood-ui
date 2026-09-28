<template>
  <section class="space-y-10">
    <!-- Recipe collections -->
    <div>
      <div class="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h2 class="text-2xl sm:text-3xl font-claude text-zinc-900 dark:text-white">Recipe Collections</h2>
          <p class="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            The corpora these recipes come from. Open one to browse everything it contributed.
          </p>
        </div>
        <span v-if="collectionTotal" class="text-sm text-zinc-500 dark:text-zinc-400">
          {{ collectionTotal.toLocaleString() }} registered
        </span>
      </div>

      <div v-if="collectionsLoading" :class="gridClass">
        <div
          v-for="index in PAGE_SIZE"
          :key="`collection-skeleton-${index}`"
          class="rounded-2xl overflow-hidden bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 animate-pulse"
        >
          <div class="h-32 bg-zinc-200 dark:bg-zinc-700" />
          <div class="p-4 space-y-3">
            <div class="h-4 rounded bg-zinc-200 dark:bg-zinc-700 w-4/5" />
            <div class="h-3 rounded bg-zinc-200 dark:bg-zinc-700 w-full" />
            <div class="h-3 rounded bg-zinc-200 dark:bg-zinc-700 w-1/2" />
          </div>
        </div>
      </div>

      <div
        v-else-if="collectionsError"
        class="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-5 flex flex-wrap items-center justify-between gap-3"
      >
        <p class="flex items-center gap-2 text-sm text-red-800 dark:text-red-200">
          <UIcon name="i-lucide-alert-circle" class="w-4 h-4 shrink-0" />
          {{ collectionsError }}
        </p>
        <UButton color="error" variant="soft" size="sm" class="cursor-pointer" @click="loadCollections(0)">
          Try again
        </UButton>
      </div>

      <p
        v-else-if="!collections.length"
        class="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-sm text-zinc-500 dark:text-zinc-400"
      >
        No recipe collections are published yet.
      </p>

      <template v-else>
        <div :class="gridClass">
          <RecipesCollectionCard
            v-for="collection in collections"
            :key="collection.urn"
            :collection="collection"
          />
        </div>
        <div v-if="collections.length < collectionTotal" class="mt-5 flex justify-center">
          <UButton
            color="neutral"
            variant="outline"
            class="cursor-pointer"
            :loading="collectionsLoadingMore"
            @click="loadCollections(collections.length)"
          >
            Show more collections
          </UButton>
        </div>
      </template>
    </div>

    <!-- Food composition tables -->
    <div>
      <div class="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h2 class="text-2xl sm:text-3xl font-claude text-zinc-900 dark:text-white">Food Composition Tables</h2>
          <p class="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            The reference data behind every nutrition figure and Nutri-Score on this site.
          </p>
        </div>
        <span v-if="tableTotal" class="text-sm text-zinc-500 dark:text-zinc-400">
          {{ tableTotal.toLocaleString() }} registered
        </span>
      </div>

      <div v-if="tablesLoading" :class="gridClass">
        <div
          v-for="index in PAGE_SIZE"
          :key="`table-skeleton-${index}`"
          class="rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 space-y-3 animate-pulse"
        >
          <div class="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          <div class="h-4 rounded bg-zinc-200 dark:bg-zinc-700 w-4/5" />
          <div class="h-3 rounded bg-zinc-200 dark:bg-zinc-700 w-full" />
          <div class="h-3 rounded bg-zinc-200 dark:bg-zinc-700 w-1/2" />
        </div>
      </div>

      <div
        v-else-if="tablesError"
        class="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-5 flex flex-wrap items-center justify-between gap-3"
      >
        <p class="flex items-center gap-2 text-sm text-red-800 dark:text-red-200">
          <UIcon name="i-lucide-alert-circle" class="w-4 h-4 shrink-0" />
          {{ tablesError }}
        </p>
        <UButton color="error" variant="soft" size="sm" class="cursor-pointer" @click="loadTables(0)">
          Try again
        </UButton>
      </div>

      <p
        v-else-if="!tables.length"
        class="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-sm text-zinc-500 dark:text-zinc-400"
      >
        No food composition tables are registered yet.
      </p>

      <template v-else>
        <div :class="gridClass">
          <RecipesFCTableCard
            v-for="table in tables"
            :key="table.urn"
            :table="table"
          />
        </div>
        <div v-if="tables.length < tableTotal" class="mt-5 flex justify-center">
          <UButton
            color="neutral"
            variant="outline"
            class="cursor-pointer"
            :loading="tablesLoadingMore"
            @click="loadTables(tables.length)"
          >
            Show more tables
          </UButton>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * What RecipeWrangler is built out of: the recipe collections it drew from,
 * and the food composition tables its nutrition figures are computed against.
 *
 * Both are registered catalog entities with their own pages, and until now
 * neither had a way in from the reader-facing side — the collection page
 * existed but nothing linked to it.
 */
import { onMounted, ref } from 'vue'
import rcollectionsApi, { COLLECTION_CARD_FIELDS } from '~/services/rcollectionsApi'
import type { RecipeCollection } from '~/services/rcollectionsApi'
import fctablesApi, { FCTABLE_CARD_FIELDS } from '~/services/fctablesApi'
import type { FCTable } from '~/services/fctablesApi'

const PAGE_SIZE = 4

const gridClass = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'

/*
 * Retired records only.
 *
 * Collections are already narrowed server-side to public and approved for
 * anyone who is not an expert, so requiring `status:active` here would only
 * change what experts see — and hide the drafts they are working on from the
 * one page where noticing them is useful. Composition tables carry no
 * visibility gate at all, so this exclusion is what keeps a deleted one off
 * the page.
 */
const RETIRED_EXCLUDED = 'NOT status:(deleted OR archived OR deprecated)'

const collections = ref<RecipeCollection[]>([])
const collectionTotal = ref(0)
const collectionsLoading = ref(true)
const collectionsLoadingMore = ref(false)
const collectionsError = ref<string | null>(null)

const tables = ref<FCTable[]>([])
const tableTotal = ref(0)
const tablesLoading = ref(true)
const tablesLoadingMore = ref(false)
const tablesError = ref<string | null>(null)

async function loadCollections(offset: number) {
  const first = offset === 0
  if (first) collectionsLoading.value = true
  else collectionsLoadingMore.value = true
  collectionsError.value = null
  try {
    const result = await rcollectionsApi.searchCollections({
      fq: [RETIRED_EXCLUDED],
      fl: COLLECTION_CARD_FIELDS,
      // Biggest first: the collection someone wants to browse is almost
      // always one of the few that carry most of the corpus.
      sort: 'recipe_count desc',
      // Facets are the filter panel's job, and this section has no filters.
      fields: [],
      limit: PAGE_SIZE,
      offset
    })
    collections.value = first ? result.collections : [...collections.value, ...result.collections]
    collectionTotal.value = result.total
  } catch (caught) {
    collectionsError.value = caught instanceof Error ? caught.message : 'Could not load collections.'
  } finally {
    collectionsLoading.value = false
    collectionsLoadingMore.value = false
  }
}

async function loadTables(offset: number) {
  const first = offset === 0
  if (first) tablesLoading.value = true
  else tablesLoadingMore.value = true
  tablesError.value = null
  try {
    const result = await fctablesApi.searchTables({
      fq: [RETIRED_EXCLUDED],
      fl: FCTABLE_CARD_FIELDS,
      sort: 'number_of_entries desc',
      fields: [],
      limit: PAGE_SIZE,
      offset
    })
    tables.value = first ? result.tables : [...tables.value, ...result.tables]
    tableTotal.value = result.total
  } catch (caught) {
    tablesError.value = caught instanceof Error ? caught.message : 'Could not load composition tables.'
  } finally {
    tablesLoading.value = false
    tablesLoadingMore.value = false
  }
}

onMounted(() => {
  void loadCollections(0)
  void loadTables(0)
})
</script>
