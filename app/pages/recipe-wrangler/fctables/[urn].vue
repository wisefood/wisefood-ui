<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <RecipesRecipeWranglerHeader back-to="/recipe-wrangler" back-label="RecipeWrangler" />

    <!-- Loading -->
    <div v-if="loading" class="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div class="animate-pulse space-y-6">
        <div class="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
        <div class="h-24 bg-zinc-200 dark:bg-zinc-700 rounded-2xl" />
        <div class="space-y-3">
          <div class="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
          <div class="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6" />
          <div class="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-4/6" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
      <UIcon name="i-lucide-alert-circle" class="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Failed to load table</h2>
      <p class="text-zinc-600 dark:text-zinc-400 mb-6">{{ error }}</p>
      <UButton color="primary" class="cursor-pointer" @click="loadTable">Try again</UButton>
    </div>

    <!-- Content -->
    <main v-else-if="table" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-start gap-4 mb-4">
          <div class="w-14 h-14 shrink-0 rounded-2xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
            <UIcon name="i-lucide-table-2" class="w-7 h-7 text-sky-600 dark:text-sky-300" />
          </div>
          <div class="min-w-0">
            <h1 class="text-2xl sm:text-4xl font-serif font-bold text-zinc-900 dark:text-white wrap-break-word">
              {{ table.title }}
            </h1>
            <p v-if="table.compiling_institution" class="mt-1 text-zinc-600 dark:text-zinc-400">
              Compiled by {{ table.compiling_institution }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mb-5">
          <span v-if="table.status" :class="statusBadgeClass(table.status)" class="inline-flex items-center max-w-full min-w-0 wrap-anywhere px-2.5 py-1 rounded-full text-xs font-semibold">
            {{ formatStatus(table.status) }}
          </span>
          <span v-if="table.type" class="inline-flex items-center max-w-full min-w-0 wrap-anywhere px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            {{ formatTag(table.type) }}
          </span>
          <span v-if="table.database_name" class="inline-flex items-center gap-1 max-w-full min-w-0 wrap-anywhere px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <UIcon name="i-lucide-database" class="w-3 h-3" />
            {{ table.database_name }}
          </span>
        </div>

        <!-- Quick stats -->
        <div class="flex flex-wrap gap-3">
          <div v-if="table.number_of_entries != null" class="flex items-center gap-2 bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700 px-3 py-2 rounded-xl">
            <UIcon name="i-lucide-list" class="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span class="text-sm font-semibold text-sky-800 dark:text-sky-200">{{ table.number_of_entries.toLocaleString() }} food items</span>
          </div>
          <div v-if="nutrientsPerItem" class="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 rounded-xl">
            <UIcon name="i-lucide-flask-conical" class="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{{ nutrientsPerItem }} nutrients per item</span>
          </div>
          <div v-if="table.region" class="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 rounded-xl">
            <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{{ table.region }}</span>
          </div>
          <div v-if="table.language" class="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 rounded-xl">
            <UIcon name="i-lucide-languages" class="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300 uppercase">{{ table.language }}</span>
          </div>
          <a
            v-if="table.url"
            :href="table.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-brandg-400 dark:hover:border-brandg-500 px-3 py-2 rounded-xl transition-colors"
          >
            <UIcon name="i-lucide-external-link" class="w-4 h-4 text-brandg-600 dark:text-brandg-400" />
            <span class="text-sm font-medium text-brandg-700 dark:text-brandg-300">Visit source</span>
          </a>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Main column -->
        <div class="lg:col-span-2 space-y-6">

          <!-- Description -->
          <div v-if="table.description" class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5">
            <h2 class="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white mb-1">
              <UIcon name="i-lucide-file-text" class="w-4 h-4 text-brandg-500" />
              About this table
            </h2>
            <!-- Table copy is stored English; there is no generation step to
                 ask for another language. -->
            <TranslationNotice class="pt-2" />
            <TranslatableContent>
              <div
                class="fctable-markdown prose prose-sm dark:prose-invert max-w-none pt-3 text-zinc-700 dark:text-zinc-300 leading-relaxed"
                v-html="descriptionHtml"
              />
            </TranslatableContent>
          </div>

          <!-- Nutrient coverage -->
          <div v-if="table.nutrient_coverage.length" class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5">
            <h2 class="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white mb-3">
              <UIcon name="i-lucide-flask-conical" class="w-4 h-4 text-brandg-500" />
              Nutrient Coverage
            </h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="nutrient in table.nutrient_coverage"
                :key="nutrient"
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brandg-100/70 dark:bg-brandg-900/40 text-brandg-800 dark:text-brandg-200 border border-brandg-200 dark:border-brandg-700"
              >
                {{ formatTag(nutrient) }}
              </span>
            </div>
          </div>

          <!-- Standards and formats -->
          <div v-if="hasStandards" class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-5">
            <div v-for="group in standardGroups" :key="group.label">
              <h3 class="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white mb-2">
                <UIcon :name="group.icon" class="w-4 h-4 text-brandg-500" />
                {{ group.label }}
              </h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="value in group.values"
                  :key="value"
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                >
                  {{ formatTag(value) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">

          <!-- Completeness -->
          <div v-if="table.completeness_percent != null || table.completeness_description" class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5">
            <h3 class="font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-gauge" class="w-4 h-4 text-brandg-500" />
              Completeness
            </h3>
            <div v-if="table.completeness_percent != null" class="space-y-1 mb-3">
              <div class="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                <span>Of the nutrients it declares</span>
                <span class="font-semibold">{{ Math.round(table.completeness_percent) }}%</span>
              </div>
              <div class="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-brandg-400 to-brandg-600 transition-all duration-500"
                  :style="{ width: `${Math.min(100, Math.max(0, Math.round(table.completeness_percent)))}%` }"
                />
              </div>
            </div>
            <p v-if="table.completeness_description" class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {{ table.completeness_description }}
            </p>
          </div>

          <!-- Provenance -->
          <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5">
            <h3 class="font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <UIcon name="i-lucide-scroll-text" class="w-4 h-4 text-brandg-500" />
              Provenance
            </h3>
            <dl class="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
              <div v-for="row in provenanceRows" :key="row.label" class="flex items-start justify-between gap-3 py-2">
                <dt class="text-zinc-500 dark:text-zinc-400 shrink-0">{{ row.label }}</dt>
                <dd class="text-right font-medium text-zinc-800 dark:text-zinc-200 break-words">{{ row.value }}</dd>
              </div>
            </dl>
          </div>

          <!-- Tags -->
          <div v-if="table.tags.length" class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5">
            <h3 class="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white mb-3">
              <UIcon name="i-lucide-tag" class="w-4 h-4 text-brandg-500" />
              Tags
            </h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in table.tags"
                :key="tag"
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
              >
                #{{ tag }}
              </span>
            </div>
          </div>

          <!-- What it is used for -->
          <div class="bg-gradient-to-br from-brandg-50 to-brandg-100 dark:from-brandg-900/30 dark:to-brandg-800/30 rounded-2xl border border-brandg-200 dark:border-brandg-700 p-5">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-lucide-calculator" class="w-4 h-4 text-brandg-600 dark:text-brandg-400" />
              <h3 class="font-semibold text-brandg-900 dark:text-brandg-100">How this is used</h3>
            </div>
            <p class="text-xs text-brandg-700 dark:text-brandg-300 mb-3 leading-relaxed">
              Composition tables are what a recipe's ingredient weights are matched against to produce
              its nutrition figures and its Nutri-Score. Switching region on a recipe switches the table.
            </p>
            <UButton to="/recipe-wrangler" color="primary" size="sm" class="justify-center w-full">
              Browse recipes
            </UButton>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * A registered food composition table, for readers.
 *
 * The console has an editor for these; this is the page the rest of the site
 * can link to. It matters because the recipe page attributes every nutrition
 * figure to one of these tables by name, and until now that name pointed
 * nowhere — the reader had no way to see what was actually behind the number.
 */
import { computed, onMounted, ref } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import fctablesApi from '~/services/fctablesApi'
import type { FCTable, FCTableStatus } from '~/services/fctablesApi'

definePageMeta({
  middleware: ['auth']
})

const route = useRoute()
const urn = computed(() => route.params.urn as string)

const table = ref<FCTable | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

useHead(() => ({
  title: table.value ? `${table.value.title} - RecipeWrangler` : 'Food Composition Table - RecipeWrangler'
}))

const descriptionHtml = computed(() => {
  if (!table.value?.description) return ''
  const raw = marked(table.value.description, { breaks: true, gfm: true }) as string
  return DOMPurify.sanitize(raw)
})

/** "12-34" when the range is real, "12" when both ends agree. */
const nutrientsPerItem = computed(() => {
  const min = table.value?.min_nutrients_per_item
  const max = table.value?.max_nutrients_per_item
  if (min != null && max != null) return min === max ? `${min}` : `${min}–${max}`
  return min != null ? `${min}` : max != null ? `${max}` : ''
})

const standardGroups = computed(() => {
  const current = table.value
  if (!current) return []
  return [
    { label: 'Classification Schemes', icon: 'i-lucide-folder-tree', values: current.classification_schemes },
    { label: 'Standardization Schemes', icon: 'i-lucide-ruler', values: current.standardization_schemes },
    { label: 'Measurement Units', icon: 'i-lucide-scale', values: current.measurement_units },
    { label: 'Reference Portions', icon: 'i-lucide-utensils', values: current.reference_portions },
    { label: 'Data Formats', icon: 'i-lucide-file-code-2', values: current.data_formats },
    { label: 'Tasks Supported', icon: 'i-lucide-list-checks', values: current.tasks_supported }
  ].filter(group => group.values.length > 0)
})

const hasStandards = computed(() => standardGroups.value.length > 0)

const provenanceRows = computed(() => {
  const current = table.value
  if (!current) return []
  return [
    { label: 'Licence', value: current.license || 'Not recorded' },
    { label: 'Identifier', value: current.external_id || current.id || current.urn },
    { label: 'Added', value: current.created_at ? formatDate(current.created_at) : '—' },
    { label: 'Updated', value: current.updated_at ? formatDate(current.updated_at) : '—' }
  ]
})

async function loadTable() {
  loading.value = true
  error.value = null
  try {
    table.value = await fctablesApi.getTable(urn.value)
  } catch (caught: unknown) {
    error.value = caught instanceof Error ? caught.message : 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}

onMounted(loadTable)

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatTag(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatStatus(status: FCTableStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function statusBadgeClass(status: FCTableStatus): string {
  const map: Record<FCTableStatus, string> = {
    active: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700',
    draft: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700',
    archived: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-600',
    deleted: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700',
    deprecated: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700'
  }
  return map[status] ?? map.draft
}
</script>

<style scoped>
.fctable-markdown :deep(ul) {
  list-style: disc;
  margin: 0.75rem 0 0.75rem 1.25rem;
  padding-left: 1rem;
}

.fctable-markdown :deep(ol) {
  list-style: decimal;
  margin: 0.75rem 0 0.75rem 1.25rem;
  padding-left: 1rem;
}

.fctable-markdown :deep(li) {
  margin: 0.25rem 0;
  padding-left: 0.125rem;
}

.fctable-markdown :deep(li > p) {
  margin: 0.25rem 0;
}
</style>
