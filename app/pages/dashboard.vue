<!-- WiseFood Dashboard - Inspiring & Welcoming -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">

    <!-- Loading State -->
    <div v-if="!authStore.initialized" class="flex items-center justify-center py-20">
      <div class="text-center">
        <UIcon name="i-lucide-loader-2" class="h-12 w-12 animate-spin mx-auto mb-4 text-brandg" />
        <p class="text-gray-600 dark:text-gray-400">
          Loading your dashboard...
        </p>
      </div>
    </div>

    <!-- Not Authenticated State -->
    <div v-else-if="!authStore.isAuthenticated" class="flex items-center justify-center py-20">
      <UCard class="max-w-md">
        <div class="text-center">
          <UIcon name="i-lucide-alert-circle" class="h-12 w-12 text-brand mx-auto mb-4" />
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Not Authenticated
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to access your dashboard
          </p>
          <UButton @click="navigateTo('/login')">
            Go to Login
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Dashboard Content -->
    <main v-else class="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
      <!-- Hero Section -->
      <div class="mb-12 text-center scroll-fade-in">
        <p class="text-sm uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 font-light mb-3">
          {{ hero.greeting }}
        </p>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 dark:text-white tracking-tight mb-4">
          Welcome, <span class="font-serif italic text-brand-500 text-5xl sm:text-6xl lg:text-7xl">{{ userGreeting }}</span>
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-300 font-light max-w-2xl mx-auto">
          {{ hero.encouragement }}
        </p>
      </div>

      <!-- Applications Quick Access -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 scroll-fade-in" style="--delay: 0.1s">
        <NuxtLink
          to="/foodscholar"
          class="group p-6 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20 border border-brand-200 dark:border-brand-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
        >
          <UIcon name="i-lucide-graduation-cap" class="w-8 h-8 text-brand-600 dark:text-brand-400 mb-3" />
          <h3 class="font-semibold text-gray-900 dark:text-white mb-1">FoodScholar</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 font-light">Learn & discover</p>
        </NuxtLink>

        <NuxtLink
          to="/recipe-wrangler"
          class="group p-6 rounded-2xl bg-gradient-to-br from-brandg-50 to-brandg-200 dark:from-brandg-900/20 dark:to-brandg-800/20 border border-brandg-200 dark:border-brandg-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
        >
          <UIcon name="i-lucide-chef-hat" class="w-8 h-8 text-brandg-600 dark:text-brandg-400 mb-3" />
          <h3 class="font-semibold text-gray-900 dark:text-white mb-1">RecipeWrangler</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 font-light">Find recipes</p>
        </NuxtLink>

        <NuxtLink
          to="/foodchat"
          class="group p-6 rounded-2xl bg-gradient-to-br from-brandp-50 to-brandp-100 dark:from-brandp-900/20 dark:to-brandp-800/20 border border-brandp-200 dark:border-brandp-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
        >
          <UIcon name="i-lucide-message-circle" class="w-8 h-8 text-brandp-400 dark:text-brandp-400 mb-3" />
          <h3 class="font-semibold text-gray-900 dark:text-white mb-1">FoodChat</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 font-light">Ask anything</p>
        </NuxtLink>
      </div>

      <!-- Today's Spotlight & Meal Schedule -->
      <div class="mb-12 scroll-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6" style="--delay: 0.2s">
        <!-- Recipe Spotlight Card -->
        <div class="relative overflow-hidden rounded-3xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 shadow-xl lg:col-span-1">
          <!-- Image Section -->
          <div class="relative h-40 bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/40">
            <div class="absolute inset-0 flex items-center justify-center">
              <UIcon name="i-lucide-sparkles" class="w-16 h-16 text-brand-500 opacity-50" />
            </div>
            <div class="absolute top-3 left-3">
              <UBadge color="primary" variant="solid" size="sm">Today's Focus</UBadge>
            </div>
          </div>

          <!-- Content Section -->
          <div class="p-5">
            <h2 class="text-xl font-light text-gray-900 dark:text-white mb-2">
              {{ spotlight.title }}
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-300 font-light mb-4 leading-relaxed">
              {{ spotlight.description }}
            </p>
            <div class="flex flex-col gap-2">
              <UButton
                color="primary"
                size="sm"
                trailing-icon="i-lucide-arrow-right"
                class="cursor-pointer"
              >
                Explore Recipe
              </UButton>
              <UButton
                variant="outline"
                size="sm"
                leading-icon="i-lucide-bookmark"
                class="cursor-pointer"
              >
                Save
              </UButton>
            </div>
          </div>
        </div>

        <!-- Meal Schedule Calendar Card -->
        <div class="relative overflow-hidden rounded-3xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 shadow-xl p-5 lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-xl font-light text-gray-900 dark:text-white">Today's Schedule</h2>
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
                <UBadge v-if="meal.isNow" color="primary" variant="solid" size="xs">Now</UBadge>
              </div>
              <div>
                <h3 class="font-semibold text-sm text-gray-900 dark:text-white mb-1">{{ meal.name }}</h3>
                <p class="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{{ meal.description }}</p>
              </div>
              <div class="flex items-center gap-2 mt-auto">
                <UBadge color="gray" variant="subtle" size="xs">{{ meal.calories }} cal</UBadge>
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
          Your Progress <span class="font-serif italic text-brand-500 text-3xl">Today</span>
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
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ ring.value }} of target</p>
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
                <UBadge v-if="recipe.healthy" color="green" variant="subtle" size="xs">Healthy</UBadge>
                <UBadge v-if="recipe.sustainable" color="blue" variant="subtle" size="xs">Sustainable</UBadge>
              </div>
              <h3 class="text-xl font-medium text-gray-900 dark:text-white mb-1">{{ recipe.title }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Recommended for you</p>
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
              <h3 class="font-semibold text-gray-900 dark:text-white mb-1">Did you know?</h3>
              <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">{{ discoveries[0].summary }}</p>
              <NuxtLink to="/foodscholar" class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                Learn more in FoodScholar →
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
              <h3 class="font-semibold text-gray-900 dark:text-white mb-1">Sustainable Choice</h3>
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
import { useAuthStore } from '@/stores/auth'
import { useHouseholdStore } from '@/stores/household'


definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'Dashboard'
})

useSeoMeta({
  description: 'Your personalized food wellness snapshot'
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

  return 'Friend'
})

const { hero, spotlight, trendingRecipes, rings, sustainability, discoveries } = useDashboardData()

// Current date and time
const currentTime = ref(new Date())
const currentDateTime = computed(() => {
  const now = currentTime.value
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const dayName = days[now.getDay()]
  const monthName = months[now.getMonth()]
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

let observer: IntersectionObserver | null = null

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
})

onUnmounted(() => {
  observer?.disconnect()
  if (timeInterval) {
    clearInterval(timeInterval)
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

html { scroll-behavior: smooth; }
</style>
