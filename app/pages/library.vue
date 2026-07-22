<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <RecipesRecipeWranglerHeader
      back-to="/dashboard"
      :back-label="t('library.backToDashboard')"
    />

    <AppFeatureGate feature="library">
      <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <!-- Page heading -->
        <div class="mb-8">
          <h1 class="text-3xl sm:text-4xl font-serif font-bold text-zinc-900 dark:text-white mb-2">
            {{ t('library.title') }}
          </h1>
          <p class="text-zinc-600 dark:text-zinc-400">
            {{ t('library.subtitle') }}
          </p>
        </div>

        <!-- Saved recipes section -->
        <section>
          <div class="flex items-center gap-2 mb-4">
            <UIcon
              name="i-lucide-heart"
              class="w-5 h-5 text-red-500"
            />
            <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
              {{ t('library.savedRecipes') }}
            </h2>
            <span
              v-if="!loading && recipeStore.favorites.length > 0"
              class="text-sm text-zinc-500 dark:text-zinc-400"
            >
              ({{ recipeStore.favorites.length }})
            </span>
          </div>

          <!-- Loading -->
          <div
            v-if="loading"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            <div
              v-for="n in skeletonCount"
              :key="n"
              class="animate-pulse rounded-xl bg-white dark:bg-gray-800 shadow-md overflow-hidden"
            >
              <div class="aspect-[4/3] bg-zinc-200 dark:bg-zinc-700" />
              <div class="p-4 space-y-3">
                <div class="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
                <div class="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
              </div>
            </div>
          </div>

          <!-- Error -->
          <div
            v-else-if="error"
            class="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center"
          >
            <UIcon
              name="i-lucide-alert-circle"
              class="w-10 h-10 text-red-500 mx-auto mb-3"
            />
            <p class="text-zinc-700 dark:text-zinc-300 mb-4">
              {{ t('library.loadFailed') }}
            </p>
            <UButton
              color="primary"
              @click="loadSavedRecipes"
            >
              {{ t('library.tryAgain') }}
            </UButton>
          </div>

          <!-- Empty -->
          <div
            v-else-if="savedRecipes.length === 0"
            class="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center"
          >
            <UIcon
              name="i-lucide-heart"
              class="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4"
            />
            <h3 class="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              {{ t('library.emptyTitle') }}
            </h3>
            <p class="text-zinc-600 dark:text-zinc-400 mb-6 max-w-md mx-auto">
              {{ t('library.emptyDescription') }}
            </p>
            <UButton
              color="primary"
              to="/recipe-wrangler"
              icon="i-lucide-search"
            >
              {{ t('library.emptyCta') }}
            </UButton>
          </div>

          <!-- Results -->
          <div
            v-else
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            <RecipesRecipeCard
              v-for="recipe in savedRecipes"
              :key="recipe.recipe_id"
              :recipe="recipe"
            />
          </div>
        </section>
      </main>
    </AppFeatureGate>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import recipeApi, { type RecipeSearchResult } from '~/services/recipeApi'
import { useRecipeStore } from '~/stores/recipe'

const { t } = useI18n()
const recipeStore = useRecipeStore()

const savedRecipes = ref<RecipeSearchResult[]>([])
const loading = ref(false)
const error = ref(false)

// Keep the skeleton count in step with what we know is coming, so the
// placeholder grid doesn't visibly jump when the details resolve.
const skeletonCount = computed(() => Math.min(Math.max(recipeStore.favorites.length, 1), 8))

/**
 * Hydrate the favorited recipe ids into cards via the batch details endpoint,
 * preserving the store's favorites order. Ids the catalog no longer resolves
 * are dropped rather than rendered as blanks.
 */
const loadSavedRecipes = async () => {
  if (recipeStore.favorites.length === 0) {
    savedRecipes.value = []
    return
  }

  loading.value = true
  error.value = false
  try {
    const detailsById = await recipeApi.getRecipeDetailsBatch(recipeStore.favorites)
    savedRecipes.value = recipeStore.favorites
      .map(recipeId => detailsById[recipeId])
      .filter((card): card is NonNullable<typeof card> => Boolean(card))
      .map(card => ({
        recipe_id: card.recipe_id,
        title: card.title || t('recipeWrangler.recipe.untitled'),
        image_url: card.image_url ?? null,
        duration: card.duration ?? null,
        dish_types: card.dish_types ?? []
      }))
  } catch (e) {
    console.error('[Library] Failed to load saved recipes:', e)
    savedRecipes.value = []
    error.value = true
  } finally {
    loading.value = false
  }
}

// Favorites are loaded asynchronously by the boot plugin and change when the
// selected member changes, so react to the id list rather than loading once.
watch(
  () => recipeStore.favorites.slice(),
  (ids, previous) => {
    if (previous && ids.length === previous.length && ids.every((id, i) => id === previous[i])) {
      return
    }
    // Unfavoriting from this page: drop the card locally instead of refetching.
    if (previous && ids.length < previous.length && savedRecipes.value.length > 0) {
      const kept = new Set(ids)
      savedRecipes.value = savedRecipes.value.filter(r => !!r.recipe_id && kept.has(r.recipe_id))
      return
    }
    loadSavedRecipes()
  },
  { immediate: true }
)
</script>
