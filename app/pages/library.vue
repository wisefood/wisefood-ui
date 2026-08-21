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

          <!-- Saved, but none could be resolved into cards (stale ids or a
               details lookup that returned nothing) — distinct from "you have
               saved nothing", so we don't tell the user their saves vanished. -->
          <div
            v-else-if="savedRecipes.length === 0 && recipeStore.favorites.length > 0"
            class="rounded-xl border border-dashed border-amber-300 dark:border-amber-700 p-10 text-center"
          >
            <UIcon
              name="i-lucide-unlink"
              class="w-12 h-12 text-amber-400 dark:text-amber-500 mx-auto mb-4"
            />
            <h3 class="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              {{ t('library.unresolvedTitle') }}
            </h3>
            <p class="text-zinc-600 dark:text-zinc-400 mb-6 max-w-md mx-auto">
              {{ t('library.unresolvedDescription', { count: recipeStore.favorites.length }) }}
            </p>
            <UButton
              color="primary"
              icon="i-lucide-refresh-cw"
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

        <!-- Saved meal plans -->
        <!--
          `savedPlans[]` has been fetched, stored and typed since the plan
          canvas shipped, with a bookmark button on every plan writing to it —
          and nothing has ever rendered it. So a member could save a plan, see
          the bookmark fill in, and then find their library had no meal plans
          in it. This is the missing half of that feature.
        -->
        <section class="mt-10">
          <div class="flex items-center gap-2 mb-4">
            <UIcon name="i-lucide-calendar-heart" class="w-5 h-5 text-brandp-500" />
            <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
              {{ t('library.savedPlans') }}
            </h2>
            <span
              v-if="savedPlans.length > 0"
              class="text-sm text-zinc-500 dark:text-zinc-400"
            >
              ({{ savedPlans.length }})
            </span>
          </div>

          <div
            v-if="plansError"
            class="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center"
          >
            <p class="text-sm text-red-700 dark:text-red-300">
              {{ t('library.savedPlansLoadFailed') }}
            </p>
          </div>

          <div
            v-else-if="!plansLoading && savedPlans.length === 0"
            class="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center"
          >
            <UIcon
              name="i-lucide-calendar-off"
              class="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-3"
            />
            <p class="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              {{ t('library.savedPlansEmpty') }}
            </p>
          </div>

          <div
            v-else
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            <NuxtLink
              v-for="plan in savedPlans"
              :key="plan.plan_id"
              :to="`/foodchat?session=${plan.session_id}&plan=${plan.plan_id}`"
              class="group rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 p-5 hover:border-brandp-300 dark:hover:border-brandp-700 hover:shadow-md transition-all"
            >
              <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-lg bg-brandp-50 dark:bg-brandp-950/40 flex items-center justify-center shrink-0">
                  <UIcon
                    :name="plan.plan_type === 'weekly' ? 'i-lucide-calendar-range' : 'i-lucide-calendar-days'"
                    class="w-4.5 h-4.5 text-brandp-500"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-sm font-medium text-zinc-900 dark:text-white truncate group-hover:text-brandp-600 dark:group-hover:text-brandp-400">
                    {{ planTitle(plan) }}
                  </h3>
                  <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {{ plan.plan_type === 'weekly' ? t('library.planWeekly') : t('library.planDaily') }}
                    <span v-if="planScale(plan)"> · {{ planScale(plan) }}</span>
                  </p>
                </div>
              </div>

              <p
                v-if="planDishes(plan)"
                class="mt-3 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2"
              >
                {{ planDishes(plan) }}
              </p>

              <div class="mt-3 flex items-center justify-between">
                <span
                  v-if="plan.saved_at"
                  class="text-[11px] text-zinc-400 dark:text-zinc-500"
                >
                  {{ t('library.planSavedOn', { date: formatDate(plan.saved_at) }) }}
                </span>
                <span class="text-[11px] text-brandp-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                  {{ t('library.planOpen') }} →
                </span>
              </div>
            </NuxtLink>
          </div>
        </section>

        <!-- Saved articles -->
        <section
          v-if="lit.savedCounts.value.article > 0 || lit.articles.value.length > 0"
          class="mt-10"
        >
          <div class="flex items-center gap-2 mb-4">
            <UIcon name="i-lucide-file-text" class="w-5 h-5 text-brand-500" />
            <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
              {{ t('library.savedArticles') }}
            </h2>
            <span class="text-sm text-zinc-500 dark:text-zinc-400">
              ({{ lit.savedCounts.value.article }})
            </span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FoodscholarArticleCard
              v-for="(article, i) in lit.articles.value"
              :key="article.urn"
              :article="article"
              :index="i"
            />
          </div>
        </section>

        <!-- Saved guides -->
        <section
          v-if="lit.savedCounts.value.guide > 0 || lit.guides.value.length > 0"
          class="mt-10"
        >
          <div class="flex items-center gap-2 mb-4">
            <UIcon name="i-lucide-compass" class="w-5 h-5 text-brand-500" />
            <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
              {{ t('library.savedGuides') }}
            </h2>
            <span class="text-sm text-zinc-500 dark:text-zinc-400">
              ({{ lit.savedCounts.value.guide }})
            </span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FoodscholarGuidesGuideCard
              v-for="guide in lit.guides.value"
              :key="guide.urn"
              :guide="guide"
              :to="buildGuideDetailPath(guide.region, guide.urn)"
            />
          </div>
        </section>

        <!-- Saved textbooks -->
        <section
          v-if="lit.savedCounts.value.textbook > 0 || lit.textbooks.value.length > 0"
          class="mt-10"
        >
          <div class="flex items-center gap-2 mb-4">
            <UIcon name="i-lucide-book" class="w-5 h-5 text-brand-500" />
            <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
              {{ t('library.savedTextbooks') }}
            </h2>
            <span class="text-sm text-zinc-500 dark:text-zinc-400">
              ({{ lit.savedCounts.value.textbook }})
            </span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FoodscholarTextbookCard
              v-for="(textbook, i) in lit.textbooks.value"
              :key="textbook.urn"
              :textbook="textbook"
              :index="i"
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
import foodchatApi, { type SavedPlan } from '~/services/foodchatApi'
import { useRecipeStore } from '~/stores/recipe'
import { useHouseholdStore } from '~/stores/household'
import { useSavedLibrary } from '~/composables/useSavedLibrary'
import { buildGuideDetailPath } from '~/utils/guidesCatalog'
import ArticleCard from '~/components/foodscholar/ArticleCard.vue'
import GuideCard from '~/components/foodscholar/guides/GuideCard.vue'
import TextbookCard from '~/components/foodscholar/TextbookCard.vue'

const { t } = useI18n()
const recipeStore = useRecipeStore()
const householdStore = useHouseholdStore()

// Saved literature (articles / guides / textbooks). Recipes stay on the recipe
// store above; this covers everything else the typed library can hold.
const lit = useSavedLibrary()

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

// ── Saved meal plans ──────────────────────────────────────────────────────
// Fetched directly rather than through the FoodChat store: this page has no
// active session, and pulling the whole chat store in to read one list would
// mean loading sessions and conversations nobody is going to look at.

const savedPlans = ref<SavedPlan[]>([])
const plansLoading = ref(false)
const plansError = ref(false)

const loadSavedPlans = async () => {
  const memberId = householdStore.currentMember?.id
  if (!memberId) {
    savedPlans.value = []
    return
  }
  plansLoading.value = true
  plansError.value = false
  try {
    savedPlans.value = await foodchatApi.getSavedPlans(memberId)
  } catch (e) {
    console.error('[Library] Failed to load saved plans:', e)
    savedPlans.value = []
    plansError.value = true
  } finally {
    plansLoading.value = false
  }
}

/**
 * The member's own name for the plan, or an honest fallback.
 *
 * `saved_title` is what they typed when they bookmarked it. Without one, the
 * date it was made beats "Untitled": a member scanning six saved plans is
 * looking for *which* one, and a date distinguishes them where a placeholder
 * does not.
 */
function planTitle(plan: SavedPlan): string {
  const title = (plan.saved_title || '').trim()
  if (title) return title
  const stamp = plan.created_at || plan.saved_at
  const kind = plan.plan_type === 'weekly' ? t('library.planWeekly') : t('library.planDaily')
  return stamp ? `${kind} · ${formatDate(stamp)}` : kind
}

/**
 * How big the plan is — days for a week, meals for a day.
 *
 * Read off the stored payload, which is the same serialized shape the canvas
 * renders, so the count is the plan's own rather than an assumption about
 * three meals a day.
 */
function planScale(plan: SavedPlan): string {
  const payload = plan.plan as Record<string, unknown>
  const entries = payload?.entries
  if (Array.isArray(entries)) {
    const days = new Set(entries.map(e => (e as Record<string, unknown>)?.day).filter(d => d != null))
    return days.size ? t('library.planDayCount', { count: days.size }) : ''
  }
  const days = payload?.days
  if (Array.isArray(days) && days.length > 1) {
    return t('library.planDayCount', { count: days.length })
  }
  const count = countMeals(payload)
  return count ? t('library.planMealCount', { count }) : ''
}

/** Meals in a stored daily plan, from either the flexible or the legacy shape. */
function countMeals(payload: Record<string, unknown>): number {
  const days = payload?.days
  if (Array.isArray(days)) {
    return days.reduce((total: number, day: unknown) => {
      const meals = (day as Record<string, unknown>)?.meals
      return total + (Array.isArray(meals) ? meals.length : 0)
    }, 0)
  }
  return ['breakfast', 'lunch', 'dinner'].filter((slot) => {
    const course = payload?.[slot] as Record<string, unknown> | undefined
    return Boolean(course?.recipe_id)
  }).length
}

/**
 * A few dish names, so the card says what is in the plan.
 *
 * Titles only — a saved plan card is for recognising a plan, and the full
 * detail is one click away on the canvas that can render it properly.
 */
function planDishes(plan: SavedPlan): string {
  const payload = plan.plan as Record<string, unknown>
  const titles: string[] = []

  const entries = payload?.entries
  if (Array.isArray(entries)) {
    for (const entry of entries) {
      const recipe = (entry as Record<string, unknown>)?.recipe as Record<string, unknown> | undefined
      const title = recipe?.recipe_title ?? recipe?.title
      if (typeof title === 'string' && title) titles.push(title)
      if (titles.length >= 4) break
    }
    return titles.join(' · ')
  }

  const days = payload?.days
  if (Array.isArray(days)) {
    for (const day of days) {
      for (const meal of ((day as Record<string, unknown>)?.meals as unknown[]) ?? []) {
        for (const plate of ((meal as Record<string, unknown>)?.plates as unknown[]) ?? []) {
          const title = (plate as Record<string, unknown>)?.title
          if (typeof title === 'string' && title) titles.push(title)
          if (titles.length >= 4) return titles.join(' · ')
        }
      }
    }
    return titles.join(' · ')
  }

  for (const slot of ['breakfast', 'lunch', 'dinner']) {
    const course = payload?.[slot] as Record<string, unknown> | undefined
    if (typeof course?.title === 'string' && course.title) titles.push(course.title)
  }
  return titles.join(' · ')
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

// Literature has no boot-time store; load it for the current member and
// whenever the member changes. Saved plans are member-scoped too, so they
// follow the same trigger rather than loading once on mount.
watch(
  () => householdStore.currentMember?.id,
  () => {
    lit.load()
    loadSavedPlans()
  },
  { immediate: true }
)
</script>
