<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <RecipesRecipeWranglerHeader back-to="/recipe-wrangler" back-label="RecipeWrangler" />

    <!-- Loading State -->
    <div v-if="loading" class="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div class="animate-pulse space-y-6">
        <div class="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
        <div class="aspect-[16/5] bg-zinc-200 dark:bg-zinc-700 rounded-2xl" />
        <div class="space-y-3">
          <div class="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
          <div class="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6" />
          <div class="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-4/6" />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
      <UIcon name="i-lucide-alert-circle" class="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Failed to load collection</h2>
      <p class="text-zinc-600 dark:text-zinc-400 mb-6">{{ error }}</p>
      <UButton color="primary" @click="loadCollection">Try again</UButton>
    </div>

    <!-- Content -->
    <main v-else-if="collection" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

      <!-- Hero -->
      <div class="mb-8">
        <div v-if="collection.image_url" class="relative aspect-[16/5] rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-xl mb-6">
          <img
            :src="collection.image_url"
            :alt="collection.title"
            class="w-full h-full object-contain bg-white dark:bg-zinc-900 p-4"
            referrerpolicy="no-referrer"
            @error="imageError = true"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
          <div class="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
            <h1 class="text-2xl sm:text-4xl font-serif font-bold text-white drop-shadow-lg mb-2">
              {{ collection.title }}
            </h1>
            <div class="flex flex-wrap gap-2">
              <span v-if="collection.status" :class="statusBadgeClass(collection.status)" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                {{ formatStatus(collection.status) }}
              </span>
              <span v-if="collection.review_status" :class="reviewBadgeClass(collection.review_status)" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                <UIcon v-if="collection.review_status === 'verified'" name="i-lucide-shield-check" class="w-3 h-3" />
                {{ formatReviewStatus(collection.review_status) }}
              </span>
              <span v-if="collection.visibility === 'public'" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/80 text-white">
                <UIcon name="i-lucide-globe" class="w-3 h-3" />
                Public
              </span>
            </div>
          </div>
        </div>

        <!-- No-image title -->
        <div v-else class="mb-6">
          <h1 class="text-3xl sm:text-4xl font-serif font-bold text-zinc-900 dark:text-white mb-3">
            {{ collection.title }}
          </h1>
          <div class="flex flex-wrap gap-2">
            <span v-if="collection.status" :class="statusBadgeClass(collection.status)" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold">
              {{ formatStatus(collection.status) }}
            </span>
            <span v-if="collection.review_status" :class="reviewBadgeClass(collection.review_status)" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold">
              <UIcon v-if="collection.review_status === 'verified'" name="i-lucide-shield-check" class="w-3 h-3" />
              {{ formatReviewStatus(collection.review_status) }}
            </span>
            <span v-if="collection.visibility === 'public'" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700">
              <UIcon name="i-lucide-globe" class="w-3 h-3" />
              Public
            </span>
          </div>
        </div>

        <!-- Quick stats row -->
        <div class="flex flex-wrap gap-3">
          <div v-if="collection.recipe_count != null" class="flex items-center gap-2 bg-brandg-50 dark:bg-brandg-900/30 border border-brandg-200 dark:border-brandg-700 px-3 py-2 rounded-xl">
            <UIcon name="i-lucide-book-open" class="w-4 h-4 text-brandg-600 dark:text-brandg-400" />
            <span class="text-sm font-semibold text-brandg-800 dark:text-brandg-200">{{ collection.recipe_count.toLocaleString() }} recipes</span>
          </div>
          <div v-if="collection.language" class="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 rounded-xl">
            <UIcon name="i-lucide-languages" class="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300 uppercase">{{ collection.language }}</span>
          </div>
          <div v-if="collection.source_type" class="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 rounded-xl">
            <UIcon name="i-lucide-database" class="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{{ formatSourceType(collection.source_type) }}</span>
          </div>
          <a
            v-if="collection.url"
            :href="collection.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-brandg-400 dark:hover:border-brandg-500 px-3 py-2 rounded-xl transition-colors"
          >
            <UIcon name="i-lucide-external-link" class="w-4 h-4 text-brandg-600 dark:text-brandg-400" />
            <span class="text-sm font-medium text-brandg-700 dark:text-brandg-300">Visit website</span>
          </a>
        </div>
      </div>

      <!-- Two-column layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Main: Description -->
        <div class="lg:col-span-2 space-y-6">

          <!-- Description card -->
          <div v-if="collection.description" class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <button
              class="w-full flex items-center justify-between px-5 py-4 text-left"
              @click="descriptionExpanded = !descriptionExpanded"
            >
              <span class="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
                <UIcon name="i-lucide-file-text" class="w-4 h-4 text-brandg-500" />
                About this collection
              </span>
              <UIcon :name="descriptionExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-4 h-4 text-zinc-400" />
            </button>
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-[2000px]"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 max-h-[2000px]"
              leave-to-class="opacity-0 max-h-0"
            >
              <div v-if="descriptionExpanded" class="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-800">
                <div class="collection-markdown prose prose-sm dark:prose-invert max-w-none pt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed" v-html="descriptionHtml" />
              </div>
            </Transition>
          </div>

          <!-- Cuisines & Meal types -->
          <div v-if="collection.cuisines.length || collection.meal_types.length" class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
            <div v-if="collection.cuisines.length">
              <h3 class="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white mb-2">
                <UIcon name="i-lucide-globe-2" class="w-4 h-4 text-brandg-500" />
                Cuisines
              </h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="cuisine in collection.cuisines"
                  :key="cuisine"
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100/70 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-800"
                >
                  {{ formatTag(cuisine) }}
                </span>
              </div>
            </div>
            <div v-if="collection.meal_types.length">
              <h3 class="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white mb-2">
                <UIcon name="i-lucide-utensils" class="w-4 h-4 text-brandg-500" />
                Meal Types
              </h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="meal in collection.meal_types"
                  :key="meal"
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100/70 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800"
                >
                  {{ formatTag(meal) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Geographic coverage -->
          <div v-if="collection.geographic_coverage.length" class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5">
            <h3 class="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white mb-3">
              <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-brandg-500" />
              Geographic Coverage
            </h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="region in collection.geographic_coverage"
                :key="region"
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100/70 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800"
              >
                {{ formatTag(region) }}
              </span>
            </div>
          </div>

        </div>

        <!-- Sidebar -->
        <div class="space-y-4">

          <!-- Data quality card -->
          <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5">
            <h3 class="font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-bar-chart-2" class="w-4 h-4 text-brandg-500" />
              Data Quality
            </h3>
            <div class="space-y-3">
              <div v-if="collection.data_completeness != null" class="space-y-1">
                <div class="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                  <span>Completeness</span>
                  <span class="font-semibold">{{ Math.round(collection.data_completeness * 100) }}%</span>
                </div>
                <div class="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-brandg-400 to-brandg-600 transition-all duration-500"
                    :style="{ width: `${Math.round(collection.data_completeness * 100)}%` }"
                  />
                </div>
              </div>
              <div class="divide-y divide-zinc-100 dark:divide-zinc-800">
                <div class="flex items-center justify-between py-2">
                  <span class="text-xs text-zinc-500 dark:text-zinc-400">Has images</span>
                  <UIcon :name="collection.has_images ? 'i-lucide-check-circle-2' : 'i-lucide-x-circle'" :class="collection.has_images ? 'text-green-500' : 'text-zinc-300 dark:text-zinc-600'" class="w-4 h-4" />
                </div>
                <div class="flex items-center justify-between py-2">
                  <span class="text-xs text-zinc-500 dark:text-zinc-400">Nutritional data</span>
                  <UIcon :name="collection.has_nutritional_data ? 'i-lucide-check-circle-2' : 'i-lucide-x-circle'" :class="collection.has_nutritional_data ? 'text-green-500' : 'text-zinc-300 dark:text-zinc-600'" class="w-4 h-4" />
                </div>
                <div class="flex items-center justify-between py-2">
                  <span class="text-xs text-zinc-500 dark:text-zinc-400">Curated</span>
                  <UIcon :name="collection.is_curated ? 'i-lucide-check-circle-2' : 'i-lucide-x-circle'" :class="collection.is_curated ? 'text-green-500' : 'text-zinc-300 dark:text-zinc-600'" class="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          <!-- Curation notes -->
          <div v-if="collection.curation_notes" class="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-5">
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-clipboard-check" class="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h3 class="font-semibold text-amber-900 dark:text-amber-200 mb-1">Curation Notes</h3>
                <p class="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{{ collection.curation_notes }}</p>
              </div>
            </div>
          </div>

          <!-- Dietary patterns and tags -->
          <div v-if="collection.dietary_patterns.length || collection.tags.length" class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-5">
            <div v-if="collection.dietary_patterns.length">
              <h3 class="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white mb-3">
                <UIcon name="i-lucide-salad" class="w-4 h-4 text-brandg-500" />
                Dietary Patterns
              </h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="diet in collection.dietary_patterns"
                  :key="diet"
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brandg-100/70 dark:bg-brandg-900/40 text-brandg-800 dark:text-brandg-200 border border-brandg-200 dark:border-brandg-700"
                >
                  {{ formatTag(diet) }}
                </span>
              </div>
            </div>

            <div v-if="collection.tags.length">
              <h3 class="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white mb-3">
                <UIcon name="i-lucide-tag" class="w-4 h-4 text-brandg-500" />
                Tags
              </h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in collection.tags"
                  :key="tag"
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                >
                  #{{ tag }}
                </span>
              </div>
            </div>
          </div>

          <!-- Search recipes CTA -->
          <div class="bg-gradient-to-br from-brandg-50 to-brandg-100 dark:from-brandg-900/30 dark:to-brandg-800/30 rounded-2xl border border-brandg-200 dark:border-brandg-700 p-5">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-lucide-search" class="w-4 h-4 text-brandg-600 dark:text-brandg-400" />
              <h3 class="font-semibold text-brandg-900 dark:text-brandg-100">Browse Recipes</h3>
            </div>
            <p class="text-xs text-brandg-700 dark:text-brandg-300 mb-3 leading-relaxed">
              Explore recipes from this collection in RecipeWrangler.
            </p>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <UButton
                to="/recipe-wrangler"
                color="primary"
                size="sm"
                class="justify-center sm:flex-1"
              >
                Open RecipeWrangler
              </UButton>
              <div v-if="collection.created_at || collection.updated_at" class="shrink-0 space-y-0.5 text-[11px] leading-snug text-brandg-700 dark:text-brandg-300 sm:text-right">
                <p v-if="collection.created_at">Created {{ formatDate(collection.created_at) }}</p>
                <p v-if="collection.updated_at">Updated {{ formatDate(collection.updated_at) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import rcollectionsApi from '~/services/rcollectionsApi'
import type { RecipeCollection, RCollectionStatus, RCollectionReviewStatus, RCollectionSourceType } from '~/services/rcollectionsApi'

const route = useRoute()
const urn = computed(() => route.params.urn as string)

const collection = ref<RecipeCollection | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const imageError = ref(false)
const descriptionExpanded = ref(true)

const descriptionHtml = computed(() => {
  if (!collection.value?.description) return ''
  const raw = marked(collection.value.description, { breaks: true, gfm: true }) as string
  return DOMPurify.sanitize(raw)
})

useHead(() => ({
  title: collection.value ? `${collection.value.title} - RecipeWrangler` : 'Recipe Collection - RecipeWrangler'
}))

async function loadCollection() {
  loading.value = true
  error.value = null
  try {
    collection.value = await rcollectionsApi.getCollection(urn.value)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}

onMounted(loadCollection)

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatTag(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatStatus(status: RCollectionStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatReviewStatus(status: RCollectionReviewStatus): string {
  const map: Record<RCollectionReviewStatus, string> = {
    unreviewed: 'Unreviewed',
    pending_review: 'Pending Review',
    in_review: 'In Review',
    verified: 'Verified',
    changes_requested: 'Changes Requested',
    rejected: 'Rejected'
  }
  return map[status] ?? status
}

function formatSourceType(type: RCollectionSourceType): string {
  const map: Record<RCollectionSourceType, string> = {
    web_portal: 'Web Portal',
    database: 'Database',
    book: 'Book',
    journal: 'Journal',
    other: 'Other'
  }
  return map[type] ?? type
}

function statusBadgeClass(status: RCollectionStatus): string {
  const map: Record<RCollectionStatus, string> = {
    active: 'bg-green-500/80 text-white',
    draft: 'bg-zinc-400/80 text-white',
    archived: 'bg-zinc-600/80 text-white',
    deleted: 'bg-red-600/80 text-white',
    deprecated: 'bg-orange-500/80 text-white'
  }
  return map[status] ?? 'bg-zinc-400/80 text-white'
}

function reviewBadgeClass(status: RCollectionReviewStatus): string {
  const map: Record<RCollectionReviewStatus, string> = {
    verified: 'bg-brandg-500/80 text-white',
    pending_review: 'bg-yellow-500/80 text-white',
    in_review: 'bg-blue-500/80 text-white',
    unreviewed: 'bg-zinc-400/80 text-white',
    changes_requested: 'bg-orange-500/80 text-white',
    rejected: 'bg-red-500/80 text-white'
  }
  return map[status] ?? 'bg-zinc-400/80 text-white'
}
</script>

<style scoped>
.collection-markdown :deep(ul) {
  list-style: disc;
  margin: 0.75rem 0 0.75rem 1.25rem;
  padding-left: 1rem;
}

.collection-markdown :deep(ol) {
  list-style: decimal;
  margin: 0.75rem 0 0.75rem 1.25rem;
  padding-left: 1rem;
}

.collection-markdown :deep(li) {
  margin: 0.25rem 0;
  padding-left: 0.125rem;
}

.collection-markdown :deep(li > p) {
  margin: 0.25rem 0;
}
</style>
