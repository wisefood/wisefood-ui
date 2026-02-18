<!-- WiseFood Dashboard - Inspiring & Welcoming -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">

    <!-- Loading State -->
    <div v-if="!authStore.initialized" class="flex items-center justify-center py-20">
      <div class="text-center">
        <UIcon name="i-lucide-loader-2" class="h-12 w-12 animate-spin mx-auto mb-4 text-brandg" />
        <p class="text-gray-600 dark:text-gray-400">
          {{ t('dashboard.loading') }}
        </p>
      </div>
    </div>

    <!-- Not Authenticated State -->
    <div v-else-if="!authStore.isAuthenticated" class="flex items-center justify-center py-20">
      <UCard class="max-w-md">
        <div class="text-center">
          <UIcon name="i-lucide-alert-circle" class="h-12 w-12 text-brand mx-auto mb-4" />
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {{ t('dashboard.notAuthenticated') }}
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {{ t('dashboard.signInPrompt') }}
          </p>
          <UButton @click="navigateTo('/login')">
            {{ t('dashboard.goToLogin') }}
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Dashboard Content -->
    <main v-else class="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
      <!-- Hero Section -->
      <div class="mb-12 text-center scroll-fade-in">
        <p class="text-sm uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 font-light mb-3">
          {{ greeting }}
        </p>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 dark:text-white tracking-tight mb-4">
          {{ t('dashboard.welcome') }} <span class="font-serif italic text-brand-500 text-5xl sm:text-6xl lg:text-7xl">{{ userGreeting }}</span>
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-300 font-light max-w-2xl mx-auto">
          {{ encouragement }}
        </p>
      </div>

      <!-- Applications Quick Access -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 scroll-fade-in" style="--delay: 0.1s">
        <NuxtLink
          to="/foodscholar"
          class="group p-6 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20 border border-brand-200 dark:border-brand-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
        >
          <UIcon name="i-lucide-graduation-cap" class="w-8 h-8 text-brand-600 dark:text-brand-400 mb-3" />
          <h3 class="font-semibold text-gray-900 dark:text-white mb-1">{{ t('dashboard.apps.foodScholar.title') }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 font-light">{{ t('dashboard.apps.foodScholar.description') }}</p>
        </NuxtLink>

        <NuxtLink
          to="/recipe-wrangler"
          class="group p-6 rounded-2xl bg-gradient-to-br from-brandg-50 to-brandg-200 dark:from-brandg-900/20 dark:to-brandg-800/20 border border-brandg-200 dark:border-brandg-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
        >
          <UIcon name="i-lucide-chef-hat" class="w-8 h-8 text-brandg-600 dark:text-brandg-400 mb-3" />
          <h3 class="font-semibold text-gray-900 dark:text-white mb-1">{{ t('dashboard.apps.recipeWrangler.title') }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 font-light">{{ t('dashboard.apps.recipeWrangler.description') }}</p>
        </NuxtLink>

        <NuxtLink
          to="/foodchat"
          class="group p-6 rounded-2xl bg-gradient-to-br from-brandp-50 to-brandp-100 dark:from-brandp-600/20 dark:to-brandp-600/20 border border-brandp-200 dark:border-brandp-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
        >
          <UIcon name="i-lucide-message-circle" class="w-8 h-8 text-brandp-400 dark:text-brandp-400 mb-3" />
          <h3 class="font-semibold text-gray-900 dark:text-white mb-1">{{ t('dashboard.apps.foodChat.title') }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 font-light">{{ t('dashboard.apps.foodChat.description') }}</p>
        </NuxtLink>
      </div>

      <!-- Today's Spotlight & Meal Schedule -->
      <div class="mb-12 scroll-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6" style="--delay: 0.2s">
        <!-- FoodScholar Insight Card -->
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-[0_12px_28px_rgba(15,23,42,0.10)] lg:col-span-1">
          <!-- Content Section -->
          <div class="p-5">
            <div class="flex items-center justify-between mb-2">
              <UBadge color="primary" variant="solid" size="sm">
                {{ t('dashboard.spotlight.badge') }}
              </UBadge>
              <UIcon name="i-lucide-lightbulb" class="w-5 h-5 text-brand-500" />
            </div>
            <h2 class="text-xl font-light text-gray-900 dark:text-white mb-2">
              {{ activeInsightTitle }}
            </h2>
            <div class="relative h-24 mb-4 overflow-hidden">
              <Transition name="insight-slide" mode="out-in">
                <div
                  :key="`insight-${activeInsightIndex}`"
                  class="h-full flex flex-col justify-start"
                >
                  <p class="text-gray-700 dark:text-gray-200 leading-relaxed insight-text-clamp insight-tip-emphasis">
                    {{ activeInsight.text }}
                  </p>
                </div>
              </Transition>
            </div>
            <div class="flex items-center gap-1.5 mb-3">
              <span
                v-for="(_, idx) in insightSlidesForDisplay"
                :key="`insight-dot-${idx}`"
                class="h-1.5 rounded-full transition-all duration-300"
                :class="idx === activeInsightIndex ? 'w-5 bg-brand-500' : 'w-1.5 bg-gray-300 dark:bg-zinc-600'"
              />
            </div>
            <NuxtLink
              to="/foodscholar"
              class="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              {{ t('dashboard.insights.learnMore') }} →
            </NuxtLink>
          </div>
        </div>

        <!-- Meal Schedule Calendar Card -->
        <div class="relative overflow-hidden rounded-3xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 shadow-xl p-5 lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-xl font-light text-gray-900 dark:text-white">{{ t('dashboard.schedule.title') }}</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ currentDateTime }}</p>
            </div>
            <NuxtLink
              to="/foodchat"
              class="text-sm font-medium text-brandp-500 dark:text-brandp-400 hover:underline"
            >
              {{ todayMealPlan ? t('dashboard.schedule.refineInFoodChat') : t('dashboard.schedule.createInFoodChat') }} →
            </NuxtLink>
          </div>

          <!-- Upcoming Meals Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <template v-for="meal in upcomingMeals" :key="meal.id">
              <NuxtLink
                v-if="meal.recipeId"
                :to="`/recipe-wrangler/${meal.recipeId}`"
                class="group flex flex-col gap-2 p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-md hover:bg-gray-50 dark:hover:bg-zinc-700/50 focus-visible:outline-none focus-visible:scale-[1.01] focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-1"
                :class="meal.isNow ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800' : 'border-transparent'"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <UIcon
                      :name="meal.icon"
                      class="w-5 h-5"
                      :class="meal.isNow ? 'text-brand-500' : 'text-gray-400'"
                    />
                    <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ meal.time }}</span>
                  </div>
                  <UBadge v-if="meal.isNow" color="primary" variant="solid" size="xs">{{ t('dashboard.schedule.now') }}</UBadge>
                </div>
                <div>
                  <h3 class="font-semibold text-sm text-gray-900 dark:text-white mb-1">{{ meal.name }}</h3>
                  <p class="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{{ meal.description }}</p>
                </div>
                <div class="flex items-center gap-2 mt-auto">
                  <div v-if="meal.members.length" class="flex items-center -space-x-0.5">
                    <UTooltip
                      v-for="member in meal.members"
                      :key="`${meal.id}-${member.id}`"
                      :text="member.name"
                    >
                      <ProfileAvatar
                        v-if="getMemberAvatar(member)"
                        :avatar="getMemberAvatarForDisplay(member)"
                        size="xxs"
                        class="ring-1 ring-white dark:ring-zinc-800"
                      />
                      <div
                        v-else
                        class="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-[10px] font-semibold flex items-center justify-center ring-1 ring-white dark:ring-zinc-800"
                      >
                        {{ memberInitials(member.name) }}
                      </div>
                    </UTooltip>
                  </div>
                  <span v-else class="text-xs text-gray-500 dark:text-gray-400">
                    {{ t('dashboard.schedule.noMembers') }}
                  </span>
                </div>
              </NuxtLink>

              <div
                v-else
                class="group flex flex-col gap-2 p-3 rounded-xl border border-transparent transition-all duration-200 cursor-default"
                :class="meal.isNow ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800' : ''"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <UIcon
                      :name="meal.icon"
                      class="w-5 h-5"
                      :class="meal.isNow ? 'text-brand-500' : 'text-gray-400'"
                    />
                    <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ meal.time }}</span>
                  </div>
                  <UBadge v-if="meal.isNow" color="primary" variant="solid" size="xs">{{ t('dashboard.schedule.now') }}</UBadge>
                </div>
                <div>
                  <h3 class="font-semibold text-sm text-gray-900 dark:text-white mb-1">{{ meal.name }}</h3>
                  <p class="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{{ meal.description }}</p>
                </div>
                <div class="flex items-center gap-2 mt-auto">
                  <div v-if="meal.members.length" class="flex items-center -space-x-0.5">
                    <UTooltip
                      v-for="member in meal.members"
                      :key="`${meal.id}-${member.id}`"
                      :text="member.name"
                    >
                      <ProfileAvatar
                        v-if="getMemberAvatar(member)"
                        :avatar="getMemberAvatarForDisplay(member)"
                        size="xxs"
                        class="ring-1 ring-white dark:ring-zinc-800"
                      />
                      <div
                        v-else
                        class="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-[10px] font-semibold flex items-center justify-center ring-1 ring-white dark:ring-zinc-800"
                      >
                        {{ memberInitials(member.name) }}
                      </div>
                    </UTooltip>
                  </div>
                  <span v-else class="text-xs text-gray-500 dark:text-gray-400">
                    {{ t('dashboard.schedule.noMembers') }}
                  </span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="mb-12 scroll-fade-in" style="--delay: 0.3s">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-light text-gray-900 dark:text-white">
            <span class="text-gray-900 dark:text-white">{{ t('dashboard.recipes.recommendedPrefix') }} </span>
            <span class="font-serif italic text-brand-500 dark:text-brand-400 text-3xl"> {{ t('dashboard.recipes.recommendedAccent') }}</span>
          </h2>
          <NuxtLink
            to="/recipe-wrangler"
            class="text-sm font-medium text-brandg-600 dark:text-brandg-400 hover:underline"
          >
            {{ t('dashboard.recipes.discoverInRecipeWrangler') }} →
          </NuxtLink>
        </div>

        <div v-if="loadingRecommendedRecipes" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            v-for="i in 4"
            :key="`rec-skeleton-${i}`"
            class="rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-3 animate-pulse"
          >
            <div class="flex items-start gap-3">
              <div class="w-16 h-16 rounded-lg bg-gray-200 dark:bg-zinc-700 shrink-0" />
              <div class="min-w-0 flex-1 space-y-2">
                <div class="h-3.5 rounded bg-gray-200 dark:bg-zinc-700 w-5/6" />
                <div class="h-3.5 rounded bg-gray-200 dark:bg-zinc-700 w-2/3" />
                <div class="pt-1 flex items-center gap-2">
                  <div class="h-3 rounded bg-gray-200 dark:bg-zinc-700 w-10" />
                  <div class="h-3 rounded bg-gray-200 dark:bg-zinc-700 w-14" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="recommendedRecipes.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NuxtLink
            v-for="recipe in recommendedRecipes"
            :key="recipe.recipe_id"
            :to="`/recipe-wrangler/${recipe.recipe_id}`"
            class="group rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div class="flex items-start gap-3">
              <div class="w-16 h-16 rounded-lg overflow-hidden border border-gray-100 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-700 shrink-0">
                <img
                  v-if="recipe.image_url && !failedRecommendedImages[recipe.recipe_id]"
                  :src="recipe.image_url"
                  :alt="recipe.title"
                  class="w-full h-full object-cover"
                  loading="lazy"
                  @error="markRecommendedImageFailed(recipe.recipe_id)"
                >
                <div
                  v-else
                  class="w-full h-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center"
                >
                  <UIcon name="i-lucide-utensils" class="w-5 h-5 text-gray-500 dark:text-zinc-300" />
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-brandg-600 dark:group-hover:text-brandg-300 transition-colors">
                  {{ recipe.title }}
                </h3>
                <div class="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span v-if="recipe.duration">{{ recipe.duration }}{{ t('dashboard.recipes.minuteShort') }}</span>
                  <span v-if="recipe.serves">{{ t('dashboard.recipes.serves', { count: recipe.serves }) }}</span>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>

        <div v-else class="rounded-xl border border-gray-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-800/50 p-4 text-sm text-gray-500 dark:text-gray-400">
          {{ t('dashboard.recipes.noRecommendationsYet') }}
        </div>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useHouseholdStore } from '@/stores/household'
import foodscholarApi, { type QaTipsResult } from '~/services/foodscholarApi'
import recipeApi, { type RecipeSearchResult } from '~/services/recipeApi'
import memberMealPlansApi, { extractMealPlanFromMemberMealPlanResponse } from '~/services/memberMealPlansApi'
import type { MealPlan, MealRecipe } from '~/services/foodchatApi'
import type { HouseholdMember } from '~/services/householdsApi'
import { stringToAvatarConfig, type AvatarConfig } from '~/utils/avatarPresets'

const { t } = useI18n()

definePageMeta({
  middleware: ['auth', 'profile']
})

useHead({
  title: computed(() => t('dashboard.title'))
})

useSeoMeta({
  description: computed(() => t('dashboard.seoDescription'))
})

const authStore = useAuthStore()
const householdStore = useHouseholdStore()

const userGreeting = computed(() => {
  // First priority: selected member name from household
  if (householdStore.currentMember?.name) {
    return householdStore.currentMember.name
  }

  // Second priority: account given_name or full name
  const user = authStore.currentUser
  if (user?.given_name) {
    return user.given_name
  }
  if (user?.name) {
    return user.name
  }

  return t('dashboard.friend')
})

const { greeting, encouragement, discoveries } = useDashboardData()

type InsightKind = 'did_you_know' | 'tip'

interface InsightSlide {
  kind: InsightKind
  text: string
}

const insightSlides = ref<InsightSlide[]>([])
const activeInsightIndex = ref(0)
const insightRotationMs = 5500

const fallbackInsightSlides = computed<InsightSlide[]>(() => {
  const fallbackSummary = discoveries[0]?.summary?.trim()
  if (!fallbackSummary) return []

  return [{
    kind: 'did_you_know',
    text: fallbackSummary
  }]
})

const insightSlidesForDisplay = computed<InsightSlide[]>(() => {
  return insightSlides.value.length ? insightSlides.value : fallbackInsightSlides.value
})

const activeInsight = computed<InsightSlide>(() => {
  const slides = insightSlidesForDisplay.value
  if (!slides.length) {
    return {
      kind: 'did_you_know',
      text: ''
    }
  }

  const safeIndex = activeInsightIndex.value % slides.length
  return slides[safeIndex]
})

const activeInsightTitle = computed(() => {
  return activeInsight.value.kind === 'tip'
    ? t('dashboard.insights.tipsOfTheDay')
    : t('dashboard.insights.didYouKnow')
})

const recommendedRecipes = ref<RecipeSearchResult[]>([])
const loadingRecommendedRecipes = ref(false)
const failedRecommendedImages = ref<Record<string, boolean>>({})

const RECOMMENDED_RECIPES_CACHE_KEY = 'dashboard.recommendedRecipes.v1'
const RECOMMENDED_RECIPES_CACHE_TTL_MS = 12 * 60 * 60 * 1000

interface RecommendedRecipesCachePayload {
  savedAt: number
  recipes: RecipeSearchResult[]
}

const shuffleList = <T,>(items: T[]): T[] => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = copy[i]
    copy[i] = copy[j]
    copy[j] = current
  }
  return copy
}

const readRecommendedRecipesCache = (): RecipeSearchResult[] | null => {
  if (!import.meta.client) return null

  try {
    const raw = localStorage.getItem(RECOMMENDED_RECIPES_CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<RecommendedRecipesCachePayload>
    if (typeof parsed.savedAt !== 'number' || !Array.isArray(parsed.recipes)) return null

    if ((Date.now() - parsed.savedAt) > RECOMMENDED_RECIPES_CACHE_TTL_MS) {
      localStorage.removeItem(RECOMMENDED_RECIPES_CACHE_KEY)
      return null
    }

    return parsed.recipes
  } catch {
    return null
  }
}

const writeRecommendedRecipesCache = (recipes: RecipeSearchResult[]) => {
  if (!import.meta.client) return

  const payload: RecommendedRecipesCachePayload = {
    savedAt: Date.now(),
    recipes
  }

  try {
    localStorage.setItem(RECOMMENDED_RECIPES_CACHE_KEY, JSON.stringify(payload))
  } catch {
    // ignore cache write errors
  }
}

const loadRecommendedRecipes = async () => {
  loadingRecommendedRecipes.value = true

  const queryPool = [
    'quick balanced meals',
    'high protein dinner recipes',
    'family friendly recipes',
    'easy pasta recipes',
    'seafood dinner recipes',
    'healthy chicken recipes',
    'high protein breakfast recipes',
    'quick lunch recipes'
  ]

  try {
    const cachedRecipes = readRecommendedRecipesCache()
    if (cachedRecipes?.length) {
      recommendedRecipes.value = shuffleList(cachedRecipes).slice(0, 4)
      failedRecommendedImages.value = {}
      return
    }

    const selectedQueries = shuffleList(queryPool).slice(0, 4)
    const groupedResults = await Promise.all(
      selectedQueries.map(async (question) => {
        const results = await recipeApi.searchRecipes({ question })
        const unique = Array.from(new Map(results.map(recipe => [recipe.recipe_id, recipe])).values())
        return shuffleList(unique).slice(0, 8)
      })
    )

    const interleaved: RecipeSearchResult[] = []
    const maxGroupSize = Math.max(...groupedResults.map(group => group.length), 0)

    for (let index = 0; index < maxGroupSize; index += 1) {
      for (const group of groupedResults) {
        const recipe = group[index]
        if (recipe) interleaved.push(recipe)
      }
    }

    const uniqueById = Array.from(new Map(interleaved.map(recipe => [recipe.recipe_id, recipe])).values()).slice(0, 24)
    writeRecommendedRecipesCache(uniqueById)
    recommendedRecipes.value = shuffleList(uniqueById).slice(0, 4)
    failedRecommendedImages.value = {}
  } catch (err) {
    console.warn('Failed to fetch recommended recipes', err)
    recommendedRecipes.value = []
    failedRecommendedImages.value = {}
  } finally {
    loadingRecommendedRecipes.value = false
  }
}

const markRecommendedImageFailed = (recipeId: string) => {
  failedRecommendedImages.value = {
    ...failedRecommendedImages.value,
    [recipeId]: true
  }
}

// Current date and time
const currentTime = ref(new Date())
const currentDateTime = computed(() => {
  const now = currentTime.value
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

  const dayName = t(`dashboard.schedule.days.${dayKeys[now.getDay()]}`)
  const monthName = t(`dashboard.schedule.months.${monthKeys[now.getMonth()]}`)
  const date = now.getDate()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')

  return `${dayName}, ${monthName} ${date} • ${hours}:${minutes}`
})

const currentMemberId = computed(() => householdStore.currentMember?.id ?? null)
const householdMembers = computed(() => householdStore.householdMembers)
const memberMealPlansById = ref<Record<string, MealPlan | null>>({})

const formatDateForApi = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const mealDescriptionFromRecipe = (recipe: MealRecipe | undefined, fallback: string): string => {
  if (!recipe) return fallback
  if (recipe.title?.trim()) return recipe.title.trim()
  if (recipe.ingredients?.trim()) return recipe.ingredients.trim().split(',').slice(0, 3).join(', ')
  if (recipe.directions?.trim()) return recipe.directions.trim()
  return fallback
}

const memberInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const getMemberAvatar = (member: HouseholdMember): AvatarConfig | null => {
  if (!member.image_url) return null
  return stringToAvatarConfig(member.image_url)
}

const getMemberAvatarForDisplay = (member: HouseholdMember): AvatarConfig => {
  return getMemberAvatar(member) || stringToAvatarConfig(member.id)
}

const todayMealPlan = computed<MealPlan | null>(() => {
  if (!currentMemberId.value) return null
  return memberMealPlansById.value[currentMemberId.value] ?? null
})

const membersByMealType = computed<Record<'breakfast' | 'lunch' | 'dinner', HouseholdMember[]>>(() => {
  const byType: Record<'breakfast' | 'lunch' | 'dinner', HouseholdMember[]> = {
    breakfast: [],
    lunch: [],
    dinner: []
  }

  if (!todayMealPlan.value) {
    return byType
  }

  for (const member of householdMembers.value) {
    const plan = memberMealPlansById.value[member.id]
    if (!plan) continue

    if (plan.breakfast) byType.breakfast.push(member)
    if (plan.lunch) byType.lunch.push(member)
    if (plan.dinner) byType.dinner.push(member)
  }

  return byType
})

const loadHouseholdMealPlans = async () => {
  if (!householdMembers.value.length) {
    memberMealPlansById.value = {}
    return
  }

  const targetDate = formatDateForApi(new Date())
  const entries = await Promise.all(
    householdMembers.value.map(async (member) => {
      try {
        const response = await memberMealPlansApi.getMealPlan(member.id, targetDate)
        return [member.id, extractMealPlanFromMemberMealPlanResponse(response)] as const
      } catch {
        return [member.id, null] as const
      }
    })
  )

  const next: Record<string, MealPlan | null> = {}
  for (const [memberId, mealPlan] of entries) {
    next[memberId] = mealPlan
  }

  memberMealPlansById.value = next
}

watch(
  [currentMemberId, () => householdMembers.value.map(member => member.id).join(',')],
  () => {
    void loadHouseholdMealPlans()
  },
  { immediate: true }
)

// Meal schedule data
const upcomingMeals = computed(() => {
  const now = currentTime.value
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const currentTimeInMinutes = currentHour * 60 + currentMinutes

  const meals = [
    {
      id: 'breakfast',
      mealType: 'breakfast' as const,
      name: t('dashboard.schedule.meals.breakfast'),
      time: '08:00',
      timeInMinutes: 8 * 60,
      icon: 'i-lucide-coffee',
      recipe: todayMealPlan.value?.breakfast,
      fallbackDescription: t('dashboard.schedule.noBreakfast')
    },
    {
      id: 'lunch',
      mealType: 'lunch' as const,
      name: t('dashboard.schedule.meals.lunch'),
      time: '13:00',
      timeInMinutes: 13 * 60,
      icon: 'i-lucide-utensils',
      recipe: todayMealPlan.value?.lunch,
      fallbackDescription: t('dashboard.schedule.noLunch')
    },
    {
      id: 'dinner',
      mealType: 'dinner' as const,
      name: t('dashboard.schedule.meals.dinner'),
      time: '19:30',
      timeInMinutes: 19 * 60 + 30,
      icon: 'i-lucide-moon',
      recipe: todayMealPlan.value?.dinner,
      fallbackDescription: t('dashboard.schedule.noDinner')
    }
  ]

  return meals.map(meal => ({
    id: meal.id,
    name: meal.name,
    time: meal.time,
    icon: meal.icon,
    recipeId: meal.recipe?.recipe_id || null,
    description: mealDescriptionFromRecipe(meal.recipe, meal.fallbackDescription),
    members: membersByMealType.value[meal.mealType],
    isNow: currentTimeInMinutes >= meal.timeInMinutes && currentTimeInMinutes < meal.timeInMinutes + 60
  }))
})

// Update time every minute
let timeInterval: NodeJS.Timeout | null = null
let insightInterval: NodeJS.Timeout | null = null

let observer: IntersectionObserver | null = null

const normalizeTipText = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []

  return value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean)
}

const normalizeInsightSlides = (result: QaTipsResult | null | undefined): InsightSlide[] => {
  const didYouKnow = normalizeTipText(result?.did_you_know).map(text => ({
    kind: 'did_you_know' as const,
    text
  }))
  const tips = normalizeTipText(result?.tips).map(text => ({
    kind: 'tip' as const,
    text
  }))

  const merged: InsightSlide[] = []
  const maxLength = Math.max(didYouKnow.length, tips.length)

  for (let index = 0; index < maxLength; index += 1) {
    if (didYouKnow[index]) merged.push(didYouKnow[index])
    if (tips[index]) merged.push(tips[index])
  }

  return merged
}

const restartInsightRotation = () => {
  if (insightInterval) {
    clearInterval(insightInterval)
    insightInterval = null
  }

  const slideCount = insightSlidesForDisplay.value.length
  if (slideCount <= 1) return

  insightInterval = setInterval(() => {
    const currentCount = insightSlidesForDisplay.value.length
    if (!currentCount) return

    activeInsightIndex.value = (activeInsightIndex.value + 1) % currentCount
  }, insightRotationMs)
}

const loadFoodScholarInsights = async () => {
  try {
    const response = await foodscholarApi.listTips()
    insightSlides.value = normalizeInsightSlides(response)
  } catch (err) {
    console.warn('Failed to fetch FoodScholar tips', err)
    insightSlides.value = []
  } finally {
    activeInsightIndex.value = 0
    restartInsightRotation()
  }
}

onMounted(() => {
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.1
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer?.unobserve(entry.target)
      }
    })
  }, observerOptions)

  document.querySelectorAll('.scroll-fade-in').forEach((el) => {
    observer?.observe(el)
  })

  if (!householdMembers.value.length && householdStore.currentHousehold?.id) {
    void householdStore.fetchMembers()
  }

  // Update current time every minute
  timeInterval = setInterval(() => {
    currentTime.value = new Date()
  }, 60000)

  loadFoodScholarInsights()
  void loadRecommendedRecipes()
})

onUnmounted(() => {
  observer?.disconnect()
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  if (insightInterval) {
    clearInterval(insightInterval)
  }
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}

.scroll-fade-in {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
  transition-delay: var(--delay, 0s);
}

.scroll-fade-in.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.insight-slide-enter-active,
.insight-slide-leave-active {
  transition: opacity 0.38s ease, transform 0.38s ease;
}

.insight-slide-enter-from {
  opacity: 0;
  transform: translateX(14px);
}

.insight-slide-leave-to {
  opacity: 0;
  transform: translateX(-14px);
}

.insight-text-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.insight-tip-emphasis {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.2rem;
  font-weight: 500;
  letter-spacing: 0.01em;
}

html { scroll-behavior: smooth; }
</style>
