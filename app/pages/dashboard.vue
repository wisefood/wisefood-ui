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
            <UIcon name="i-lucide-calendar-days" class="w-7 h-7 text-brand-500" />
          </div>

          <!-- Upcoming Meals Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="meal in upcomingMeals"
              :key="meal.id"
              class="flex flex-col gap-2 p-3 rounded-xl transition-all border"
              :class="meal.isPast ? 'opacity-50 border-transparent' : meal.isNow ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800' : 'border-transparent hover:bg-gray-50 dark:hover:bg-zinc-700/50'"
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
                <UBadge color="gray" variant="subtle" size="xs">{{ meal.calories }} {{ t('dashboard.schedule.cal') }}</UBadge>
                <UBadge v-if="meal.prepared" color="green" variant="subtle" size="xs">
                  <UIcon name="i-lucide-check" class="w-3 h-3" />
                </UBadge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Your Progress -->
      <div class="mb-12 scroll-fade-in" style="--delay: 0.3s">
        <h2 class="text-2xl font-light text-gray-900 dark:text-white mb-6">
          {{ t('dashboard.progress.title') }} <span class="font-serif italic text-brand-500 text-3xl">{{ t('dashboard.progress.today') }}</span>
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            v-for="ring in rings"
            :key="ring.id"
            class="p-6 rounded-2xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700"
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-medium text-gray-900 dark:text-white">{{ ring.label }}</h3>
              <span class="text-2xl font-light text-brand-500">{{ ring.percent }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2 mb-2">
              <div
                class="bg-brand-500 h-2 rounded-full transition-all duration-500"
                :style="{ width: ring.percent + '%' }"
              ></div>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ ring.value }} {{ t('dashboard.progress.ofTarget') }}</p>
          </div>
        </div>
      </div>

      <!-- Feed Section -->
      <div class="space-y-6">
        <!-- Trending Recipe -->
        <div
          v-for="(recipe, index) in trendingRecipes"
          :key="recipe.id"
          class="scroll-fade-in p-6 rounded-2xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 hover:shadow-lg transition-all duration-300"
          :style="{ '--delay': `${0.4 + index * 0.1}s` }"
        >
          <div class="flex items-start gap-4">
            <div class="w-20 h-20 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/40 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-utensils" class="w-8 h-8 text-brand-500" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2">
                <UBadge v-if="recipe.healthy" color="green" variant="subtle" size="xs">{{ t('dashboard.badges.healthy') }}</UBadge>
                <UBadge v-if="recipe.sustainable" color="blue" variant="subtle" size="xs">{{ t('dashboard.badges.sustainable') }}</UBadge>
              </div>
              <h3 class="text-xl font-medium text-gray-900 dark:text-white mb-1">{{ recipe.title }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.recipes.recommendedForYou') }}</p>
            </div>
            <UButton variant="ghost" icon="i-lucide-chevron-right" class="cursor-pointer shrink-0" />
          </div>
        </div>

        <!-- FoodScholar Insight -->
        <div class="scroll-fade-in p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800" style="--delay: 0.7s">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-lightbulb" class="w-6 h-6 text-white" />
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-1">{{ activeInsightTitle }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">{{ activeInsight.text }}</p>
              <NuxtLink to="/foodscholar" class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                {{ t('dashboard.insights.learnMore') }} →
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Sustainability Highlight -->
        <div class="scroll-fade-in p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800" style="--delay: 0.8s">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-leaf" class="w-6 h-6 text-white" />
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-1">{{ t('dashboard.sustainability.title') }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-300 mb-1">
                <strong>{{ sustainability.ingredient }}</strong> - {{ sustainability.note }}
              </p>
              <button class="text-sm font-medium text-green-600 dark:text-green-400 hover:underline">
                {{ sustainability.cta }} →
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useHouseholdStore } from '@/stores/household'
import foodscholarApi, { type QaTipsResult } from '~/services/foodscholarApi'

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

const { greeting, encouragement, trendingRecipes, rings, sustainability, discoveries } = useDashboardData()

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

// Meal schedule data
const upcomingMeals = computed(() => {
  const now = currentTime.value
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const currentTimeInMinutes = currentHour * 60 + currentMinutes

  const meals = [
    {
      id: 1,
      name: 'Breakfast',
      time: '08:00',
      timeInMinutes: 8 * 60,
      description: 'Oatmeal with berries and nuts',
      calories: 350,
      icon: 'i-lucide-coffee',
      prepared: true
    },
    {
      id: 2,
      name: 'Morning Snack',
      time: '10:30',
      timeInMinutes: 10 * 60 + 30,
      description: 'Greek yogurt with honey',
      calories: 150,
      icon: 'i-lucide-apple',
      prepared: false
    },
    {
      id: 3,
      name: 'Lunch',
      time: '13:00',
      timeInMinutes: 13 * 60,
      description: 'Mediterranean Quinoa Bowl',
      calories: 520,
      icon: 'i-lucide-utensils',
      prepared: false
    },
    {
      id: 4,
      name: 'Afternoon Snack',
      time: '16:00',
      timeInMinutes: 16 * 60,
      description: 'Hummus with veggie sticks',
      calories: 180,
      icon: 'i-lucide-carrot',
      prepared: false
    },
    {
      id: 5,
      name: 'Dinner',
      time: '19:30',
      timeInMinutes: 19 * 60 + 30,
      description: 'Grilled salmon with roasted vegetables',
      calories: 480,
      icon: 'i-lucide-utensils',
      prepared: false
    }
  ]

  return meals.map(meal => ({
    ...meal,
    isPast: currentTimeInMinutes > meal.timeInMinutes + 60,
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

  // Update current time every minute
  timeInterval = setInterval(() => {
    currentTime.value = new Date()
  }, 60000)

  loadFoodScholarInsights()
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
