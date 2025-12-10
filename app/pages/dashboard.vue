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
          Your <span class="font-serif italic text-brand-500 text-5xl sm:text-6xl lg:text-7xl">WiseFood</span>
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
          class="group p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
        >
          <UIcon name="i-lucide-chef-hat" class="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
          <h3 class="font-semibold text-gray-900 dark:text-white mb-1">RecipeWrangler</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 font-light">Find recipes</p>
        </NuxtLink>

        <NuxtLink
          to="/foodchat"
          class="group p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
        >
          <UIcon name="i-lucide-message-circle" class="w-8 h-8 text-purple-600 dark:text-purple-400 mb-3" />
          <h3 class="font-semibold text-gray-900 dark:text-white mb-1">FoodChat</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 font-light">Ask anything</p>
        </NuxtLink>
      </div>

      <!-- Today's Spotlight -->
      <div class="mb-12 scroll-fade-in" style="--delay: 0.2s">
        <div class="relative overflow-hidden rounded-3xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 shadow-xl">
          <div class="grid grid-cols-1 lg:grid-cols-2">
            <!-- Image Section -->
            <div class="relative h-64 lg:h-auto bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/40">
              <div class="absolute inset-0 flex items-center justify-center">
                <UIcon name="i-lucide-sparkles" class="w-20 h-20 text-brand-500 opacity-50" />
              </div>
              <div class="absolute top-4 left-4">
                <UBadge color="primary" variant="solid" size="lg">Today's Focus</UBadge>
              </div>
            </div>

            <!-- Content Section -->
            <div class="p-8 lg:p-10 flex flex-col justify-center">
              <h2 class="text-3xl sm:text-4xl font-light text-gray-900 dark:text-white mb-3">
                {{ spotlight.title }}
              </h2>
              <p class="text-lg text-gray-600 dark:text-gray-300 font-light mb-6 leading-relaxed">
                {{ spotlight.description }}
              </p>
              <div class="flex gap-3">
                <UButton
                  color="primary"
                  size="lg"
                  trailing-icon="i-lucide-arrow-right"
                  class="cursor-pointer"
                >
                  Explore Recipe
                </UButton>
                <UButton
                  variant="outline"
                  size="lg"
                  leading-icon="i-lucide-bookmark"
                  class="cursor-pointer"
                >
                  Save
                </UButton>
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
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

definePageMeta({
  middleware: 'auth'
})

useSeoMeta({
  title: 'Dashboard - WiseFood',
  description: 'Your personalized food wellness snapshot'
})

const authStore = useAuthStore()

const { hero, spotlight, trendingRecipes, rings, sustainability, discoveries } = useDashboardData()

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
})

onUnmounted(() => {
  observer?.disconnect()
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
