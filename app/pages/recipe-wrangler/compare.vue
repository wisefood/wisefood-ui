<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <!-- Header -->
    <RecipesRecipeWranglerHeader back-to="/recipe-wrangler" :back-label="t('recipeWrangler.backToRecipes')">
      <template #actions>
        <button
          v-if="compareRecipes.length > 0"
          @click="clearAll"
          class="flex items-center gap-2 px-4 py-2 min-h-11 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
        >
          <UIcon name="i-lucide-x" class="w-4 h-4" />
          {{ t('recipeWrangler.comparePage.clearAll') }}
        </button>
      </template>
    </RecipesRecipeWranglerHeader>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Empty State -->
      <div v-if="compareRecipes.length === 0" class="text-center py-16">
        <UIcon name="i-lucide-git-compare" class="w-20 h-20 text-zinc-300 dark:text-zinc-700 mx-auto mb-6" />
        <h2 class="text-2xl font-semibold text-zinc-900 dark:text-white mb-3">
          {{ t('recipeWrangler.comparePage.empty.title') }}
        </h2>
        <p class="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
          {{ t('recipeWrangler.comparePage.empty.subtitle') }}
        </p>
        <NuxtLink
          to="/recipe-wrangler"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brandg-600 text-white hover:bg-brandg-700 transition-colors font-medium"
        >
          <UIcon name="i-lucide-search" class="w-5 h-5" />
          {{ t('recipeWrangler.comparePage.empty.browseRecipes') }}
        </NuxtLink>
      </div>

      <template v-else>
        <!--
          Phone: two recipes at a time, metric by metric.

          Four 320px columns are 1400px of table, and a sticky feature column
          on a 375px screen leaves 200px for the values. Two recipes across is
          the widest a phone can honestly show, so the picker decides which
          two and the metrics stack underneath.
        -->
        <div class="sm:hidden space-y-4">
          <div v-if="compareRecipes.length > 2">
            <p class="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {{ t('recipeWrangler.comparePage.pickTwo') }}
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="recipe in compareRecipes"
                :key="`pick-${recipe.recipe_id}`"
                type="button"
                :aria-pressed="isPicked(recipe.recipe_id)"
                :class="[
                  'inline-flex items-center max-w-full min-h-11 px-3 rounded-full border text-sm font-medium transition-colors',
                  isPicked(recipe.recipe_id)
                    ? 'bg-brandg-600 border-brandg-600 text-white'
                    : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                ]"
                @click="pick(recipe.recipe_id)"
              >
                <span class="truncate">{{ recipe.title }}</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="recipe in pickedRecipes"
              :key="`head-${recipe.recipe_id}`"
              class="rounded-2xl overflow-hidden bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md"
            >
              <div class="relative h-32 bg-gradient-to-br from-brandg-100 to-brandg-200 dark:from-brandg-900/40 dark:to-brandg-800/40">
                <img
                  v-if="shouldShowRecipeImage(recipe)"
                  :src="normalizeImageUrl(recipe.image_url)"
                  :alt="recipe.title"
                  class="w-full h-full object-cover"
                  referrerpolicy="no-referrer"
                  @error="markImageFailed(recipe.recipe_id)"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-lucide-utensils" class="w-10 h-10 text-brandg-300 dark:text-brandg-700" />
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                <div class="absolute bottom-0 left-0 right-0 p-3">
                  <h3 class="text-sm font-serif font-bold text-white drop-shadow-lg line-clamp-2">
                    {{ recipe.title }}
                  </h3>
                </div>
                <button
                  type="button"
                  :aria-label="t('recipeWrangler.recipe.removeFromComparison')"
                  class="absolute top-0 right-0 min-h-11 min-w-11 flex items-center justify-center z-10"
                  @click="removeRecipe(recipe.recipe_id)"
                >
                  <span class="w-7 h-7 rounded-full bg-red-500 text-white shadow-lg flex items-center justify-center">
                    <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>
              <NuxtLink
                :to="`/recipe-wrangler/${encodeURIComponent(recipe.recipe_id)}`"
                class="flex items-center justify-center gap-1.5 min-h-11 px-3 text-xs font-medium text-brandg-600 dark:text-brandg-400"
              >
                <span>{{ t('recipeWrangler.recipe.viewRecipe') }}</span>
                <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5" />
              </NuxtLink>
            </div>
          </div>

          <div class="rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg divide-y divide-zinc-200 dark:divide-zinc-700">
            <div
              v-for="metric in metrics"
              :key="`stack-${metric.key}`"
              class="px-4 py-3"
            >
              <div class="flex items-center gap-2 mb-2 text-sm font-medium text-zinc-900 dark:text-white">
                <UIcon :name="metric.icon" :class="['w-4 h-4', metric.iconClass]" />
                <span>{{ metric.label }}</span>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <RecipesCompareMetricCell
                  v-for="recipe in pickedRecipes"
                  :key="`${metric.key}-${recipe.recipe_id}`"
                  :metric="metric"
                  :recipe="recipe"
                  compact
                />
              </div>
            </div>
          </div>
        </div>

        <!--
          Tablet and up: the table. The rounded, clipped box is the scroll
          wrapper, not the table, because `overflow: hidden` on the table made
          the sticky feature column scroll away with everything else.
        -->
        <div class="hidden sm:block overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-lg bg-white dark:bg-zinc-800">
          <table class="w-full">
            <!-- Table Header with Recipe Images and Titles -->
            <thead>
              <tr class="border-b border-zinc-200 dark:border-zinc-700">
                <th class="text-left p-4 lg:p-6 bg-zinc-50 dark:bg-zinc-900 font-semibold text-zinc-700 dark:text-zinc-300 sticky left-0 z-20 border-r border-zinc-200 dark:border-zinc-700">
                  <span class="text-sm uppercase tracking-wide">{{ t('recipeWrangler.comparePage.table.feature') }}</span>
                </th>
                <th
                  v-for="recipe in compareRecipes"
                  :key="recipe.recipe_id"
                  class="p-4 lg:p-6 bg-zinc-50 dark:bg-zinc-900 w-[240px] lg:w-[320px] min-w-[240px]"
                >
                  <div class="space-y-3">
                    <!-- Recipe Image with Title Overlay -->
                    <div class="relative h-40 lg:h-[240px] rounded-xl overflow-hidden bg-gradient-to-br from-brandg-100 to-brandg-200 dark:from-brandg-900/40 dark:to-brandg-800/40 shadow-md">
                      <img
                        v-if="shouldShowRecipeImage(recipe)"
                        :src="normalizeImageUrl(recipe.image_url)"
                        :alt="recipe.title"
                        class="w-full h-full object-cover"
                        referrerpolicy="no-referrer"
                        @error="markImageFailed(recipe.recipe_id)"
                      />
                      <div v-else class="w-full h-full flex items-center justify-center">
                        <UIcon name="i-lucide-utensils" class="w-12 h-12 text-brandg-300 dark:text-brandg-700" />
                      </div>

                      <!-- Gradient Overlay -->
                      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

                      <!-- Title Overlay -->
                      <div class="absolute bottom-0 left-0 right-0 p-4">
                        <h3 class="text-lg font-serif font-bold text-white drop-shadow-lg line-clamp-2">
                          {{ recipe.title }}
                        </h3>
                      </div>

                      <!-- Remove Button: a small red dot with a finger-sized hit box around it -->
                      <button
                        type="button"
                        :aria-label="t('recipeWrangler.recipe.removeFromComparison')"
                        class="absolute top-0 right-0 min-h-11 min-w-11 flex items-center justify-center z-10 group"
                        @click="removeRecipe(recipe.recipe_id)"
                      >
                        <span class="w-7 h-7 rounded-full bg-red-500 group-hover:bg-red-600 text-white transition-colors shadow-lg flex items-center justify-center">
                          <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
                        </span>
                      </button>
                    </div>

                    <!-- View Recipe Link -->
                    <NuxtLink
                      :to="`/recipe-wrangler/${encodeURIComponent(recipe.recipe_id)}`"
                      class="inline-flex items-center gap-2 min-h-11 text-sm font-medium text-brandg-600 dark:text-brandg-400 hover:text-brandg-700 dark:hover:text-brandg-300 transition-colors"
                    >
                      <span>{{ t('recipeWrangler.recipe.viewRecipe') }}</span>
                      <UIcon name="i-lucide-arrow-right" class="w-4 h-4" />
                    </NuxtLink>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(metric, index) in metrics"
                :key="metric.key"
                :class="[
                  'border-b last:border-b-0 border-zinc-200 dark:border-zinc-700',
                  index % 2 === 1 ? 'bg-zinc-50 dark:bg-zinc-900' : ''
                ]"
              >
                <td
                  :class="[
                    'p-4 lg:p-6 font-medium text-zinc-900 dark:text-white sticky left-0 z-10 border-r border-zinc-200 dark:border-zinc-700',
                    index % 2 === 1 ? 'bg-zinc-50 dark:bg-zinc-900' : 'bg-white dark:bg-zinc-800'
                  ]"
                >
                  <div class="flex items-center gap-2">
                    <UIcon :name="metric.icon" :class="['w-5 h-5', metric.iconClass]" />
                    <span>{{ metric.label }}</span>
                  </div>
                </td>
                <td
                  v-for="recipe in compareRecipes"
                  :key="`${metric.key}-${recipe.recipe_id}`"
                  class="p-4 lg:p-6"
                >
                  <RecipesCompareMetricCell :metric="metric" :recipe="recipe" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { track } from '~/composables/useTelemetry'
import { useRecipeStore } from '~/stores/recipe'
import recipeApi from '~/services/recipeApi'
import type { Recipe } from '~/services/recipeApi'
import type { CompareMetric } from '~/components/recipes/CompareMetricCell.vue'

definePageMeta({
  middleware: ['auth', 'profile']
})
const { t } = useI18n()

useHead({
  title: computed(() => t('recipeWrangler.comparePage.pageTitle'))
})

// ============================================================================
// Store
// ============================================================================
const recipeStore = useRecipeStore()
const route = useRoute()

// ============================================================================
// State
// ============================================================================
const compareRecipes = ref<Recipe[]>([])
const loading = ref(false)
const failedRecipeImages = ref<Record<string, boolean>>({})

// ============================================================================
// Computed
// ============================================================================
const coerceNumber = (value: unknown): number => {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

const hasNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value)
}

const formatMetric = (value: unknown, digits: number): string => {
  if (!hasNumber(value)) return t('recipeWrangler.comparePage.notAvailable')
  return value.toFixed(digits)
}

const toBarPercent = (value: unknown, maxValue: number): number => {
  if (!hasNumber(value) || maxValue <= 0) return 0
  return Math.min((value / maxValue) * 100, 100)
}

const normalizeImageUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined
  if (url.startsWith('http://')) return `https://${url.slice('http://'.length)}`
  return url
}

const shouldShowRecipeImage = (recipe: Recipe): boolean => {
  return !!normalizeImageUrl(recipe.image_url) && !failedRecipeImages.value[recipe.recipe_id]
}

const markImageFailed = (recipeId: string) => {
  failedRecipeImages.value = {
    ...failedRecipeImages.value,
    [recipeId]: true
  }
}

// The largest value on the page, so every bar is drawn against the same scale.
const maxOf = (read: (recipe: Recipe) => unknown): number =>
  Math.max(...compareRecipes.value.map(recipe => coerceNumber(read(recipe))), 1)

// A number with its unit, or the not-available marker with no unit at all.
const numeric = (read: (recipe: Recipe) => unknown, digits: number, unit: string) => ({
  value: (recipe: Recipe) => formatMetric(read(recipe), digits),
  unit: (recipe: Recipe) => hasNumber(read(recipe)) ? unit : ''
})

const bar = (read: (recipe: Recipe) => unknown, digits: number, unit: string, barClass: string) => ({
  kind: 'bar' as const,
  ...numeric(read, digits, unit),
  percent: (recipe: Recipe) => toBarPercent(read(recipe), maxOf(read)),
  barClass
})

// The rows of the comparison, in the order they appear. Both layouts iterate
// this, so a metric added here shows up in the table and on the phone alike.
const metrics = computed<CompareMetric[]>(() => [
  {
    key: 'nutri',
    label: t('recipeWrangler.recipe.nutriScore'),
    icon: 'i-lucide-award',
    iconClass: 'text-brandg-600 dark:text-brandg-400',
    kind: 'nutri',
    value: () => '',
    unit: () => ''
  },
  {
    key: 'duration',
    label: t('recipeWrangler.comparePage.table.duration'),
    icon: 'i-lucide-clock',
    iconClass: 'text-zinc-600 dark:text-zinc-400',
    kind: 'text',
    value: recipe => recipe.duration ? String(recipe.duration) : t('recipeWrangler.comparePage.notAvailable'),
    unit: recipe => recipe.duration ? ` ${t('recipeWrangler.recipe.minuteShort')}` : ''
  },
  {
    key: 'servings',
    label: t('recipeWrangler.comparePage.table.servings'),
    icon: 'i-lucide-users',
    iconClass: 'text-zinc-600 dark:text-zinc-400',
    kind: 'text',
    value: recipe => recipe.serves ? String(recipe.serves) : t('recipeWrangler.comparePage.notAvailable'),
    unit: () => ''
  },
  {
    key: 'calories',
    label: t('recipeWrangler.detail.calories'),
    icon: 'i-lucide-flame',
    iconClass: 'text-orange-600 dark:text-orange-400',
    ...bar(recipe => recipe.total_kcal_per_serving, 0, '', 'bg-orange-500')
  },
  {
    key: 'protein',
    label: t('recipeWrangler.detail.protein'),
    icon: 'i-lucide-dumbbell',
    iconClass: 'text-blue-600 dark:text-blue-400',
    ...bar(recipe => recipe.total_protein_g_per_serving, 1, 'g', 'bg-blue-500')
  },
  {
    key: 'carbs',
    label: t('recipeWrangler.detail.carbs'),
    icon: 'i-lucide-wheat',
    iconClass: 'text-purple-600 dark:text-purple-400',
    ...bar(recipe => recipe.total_carbs_g_per_serving, 1, 'g', 'bg-purple-500')
  },
  {
    key: 'fat',
    label: t('recipeWrangler.detail.fat'),
    icon: 'i-lucide-droplet',
    iconClass: 'text-yellow-600 dark:text-yellow-400',
    ...bar(recipe => recipe.total_fat_g_per_serving, 1, 'g', 'bg-yellow-500')
  },
  {
    key: 'fiber',
    label: t('recipeWrangler.detail.fiber'),
    icon: 'i-lucide-leaf',
    iconClass: 'text-green-600 dark:text-green-400',
    ...bar(recipe => recipe.total_fiber_g_per_serving, 1, 'g', 'bg-green-500')
  },
  {
    key: 'sugar',
    label: t('recipeWrangler.detail.sugar'),
    icon: 'i-lucide-candy',
    iconClass: 'text-pink-600 dark:text-pink-400',
    kind: 'text',
    ...numeric(recipe => recipe.total_sugar_g_per_serving, 1, 'g')
  },
  {
    key: 'sodium',
    label: t('recipeWrangler.detail.sodium'),
    icon: 'i-lucide-salt',
    iconClass: 'text-zinc-600 dark:text-zinc-400',
    kind: 'text',
    ...numeric(recipe => recipe.total_sodium_mg_per_serving, 0, 'mg')
  }
])

// ============================================================================
// Phone picker: which two of the (up to four) recipes are on screen
// ============================================================================
// Two slots. Picking a third recipe replaces the one picked earlier, the way
// a two-position switch would; picking one already shown does nothing.
const pickedIds = ref<string[]>([])

const pickedRecipes = computed<Recipe[]>(() => {
  const byId = new Map(compareRecipes.value.map(recipe => [recipe.recipe_id, recipe]))
  const picked = pickedIds.value
    .map(id => byId.get(id))
    .filter((recipe): recipe is Recipe => !!recipe)
  for (const recipe of compareRecipes.value) {
    if (picked.length >= 2) break
    if (!picked.includes(recipe)) picked.push(recipe)
  }
  return picked.slice(0, 2)
})

const isPicked = (recipeId: string) => pickedRecipes.value.some(recipe => recipe.recipe_id === recipeId)

const pick = (recipeId: string) => {
  if (isPicked(recipeId)) return
  const current = pickedRecipes.value.map(recipe => recipe.recipe_id)
  pickedIds.value = [...current.slice(-1), recipeId]
}

// ============================================================================
// Methods
// ============================================================================
const loadRecipes = async () => {
  loading.value = true
  try {
    const recipeIds = Array.from(
      new Set(recipeStore.compareList.map(id => String(id || '').trim()).filter(Boolean))
    )

    if (recipeIds.length === 0) {
      compareRecipes.value = []
      return
    }

    const settled = await Promise.allSettled(
      recipeIds.map(id => recipeApi.getRecipe(id))
    )

    const recipes: Recipe[] = []
    const failedIds: string[] = []

    settled.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        recipes.push(result.value)
      } else {
        failedIds.push(recipeIds[index] || '')
      }
    })

    if (failedIds.length > 0) {
      console.error('Some comparison recipes failed to load:', failedIds)
    }

    compareRecipes.value = recipes
    failedRecipeImages.value = {}
  } catch (err) {
    console.error('Failed to load comparison recipes:', err)
  } finally {
    loading.value = false
  }
}

const removeRecipe = (recipeId: string) => {
  recipeStore.removeFromCompare(recipeId)
  compareRecipes.value = compareRecipes.value.filter(r => r.recipe_id !== recipeId)
}

const clearAll = () => {
  recipeStore.clearCompareList()
  compareRecipes.value = []
}

// ============================================================================
// Lifecycle
// ============================================================================
onMounted(() => {
  recipeStore.initialize()

  const rawIds = route.query.ids
  const idsFromQuery = (Array.isArray(rawIds) ? rawIds : [rawIds])
    .flatMap((value) => {
      if (value === undefined || value === null) return []
      return String(value).split(',')
    })
    .map(id => String(id || '').trim())
    .filter(Boolean)
    .slice(0, 4)

  if (idsFromQuery.length > 0) {
    recipeStore.clearCompareList()
    idsFromQuery.forEach(id => recipeStore.addToCompare(id))
  }

  // Once per opening, and only with something to compare. The list is also
  // watched below so a recipe removed here reloads the table, but that is the
  // same comparison being narrowed, not a new one.
  if (recipeStore.compareList.length > 0) {
    track('recipe.compare', {
      count: recipeStore.compareList.length,
      from_link: idsFromQuery.length > 0
    }, 'recipewrangler')
  }

  loadRecipes()
})

watch(
  () => recipeStore.compareList.slice(),
  () => {
    void loadRecipes()
  }
)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
