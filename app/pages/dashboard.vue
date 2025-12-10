<!-- WiseFood Apple Health-inspired dashboard page -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"> 

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
    <main v-else class="container mx-auto px-4 py-8 max-w-7xl">
      <div class="space-y-8">
        <!-- Hero Card -->
        <DashboardHeroCard
          :greeting="hero.greeting"
          :encouragement="hero.encouragement"
          :wellness-percent="hero.wellnessPercent"
          :callout="hero.callout"
        />

        <!-- Quick Actions -->
        <DashboardQuickActions />

        <!-- Main Grid Layout: 2-column on desktop -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Column (2/3 width on desktop) -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Trending Recipes -->
            <DashboardTrendingRecipes :recipes="trendingRecipes" />

            <!-- Nutritional Rings -->
            <DashboardNutritionalRingsRow :rings="rings" />

            <!-- Chart Placeholder -->
            <DashboardChartPlaceholder
              title="Weekly Nutrition Trends"
              description="Track your macro and micronutrient intake over time"
            />
          </div>

          <!-- Right Rail (1/3 width on desktop) -->
          <aside class="space-y-8">
            <!-- Sustainability Highlight -->
            <DashboardSustainabilityHighlight
              :ingredient="sustainability.ingredient"
              :note="sustainability.note"
              :cta="sustainability.cta"
              :img="sustainability.img"
            />

            <!-- FoodScholar Discoveries -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-semibold font-display text-gray-900 dark:text-white">
                  FoodScholar Insights
                </h2>
                <UBadge color="primary" variant="subtle">
                  Latest Research
                </UBadge>
              </div>
              <div class="space-y-4">
                <DashboardDiscoveryCard
                  v-for="discovery in discoveries"
                  :key="discovery.id"
                  :id="discovery.id"
                  :title="discovery.title"
                  :summary="discovery.summary"
                  :source="discovery.source"
                  :date="discovery.date"
                />
              </div>
            </div>

            <!-- Additional Chart Placeholder -->
            <DashboardChartPlaceholder
              title="Sustainability Score"
              description="Your environmental impact this week"
            />
          </aside>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

definePageMeta({
  middleware: 'auth'
})

useSeoMeta({
  title: 'Dashboard - WiseFood',
  description: 'Your personalized food wellness snapshot'
})

const authStore = useAuthStore()

const handleSignOut = async () => {
  await authStore.logout('/')
}

const { hero, trendingRecipes, rings, sustainability, discoveries } = useDashboardData()
</script>
