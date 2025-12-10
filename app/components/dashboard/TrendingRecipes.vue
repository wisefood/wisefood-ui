<!-- Horizontal scroll wrapper with snap for trending recipes -->
<script setup lang="ts">
const props = defineProps<{
  recipes: Array<{
    id: number
    title: string
    thumb: string
    healthy: boolean
    sustainable: boolean
  }>
}>()
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold font-display text-gray-900 dark:text-white">
        Trending Recipes
      </h2>
      <UBadge color="primary" variant="subtle">
        Popular This Week
      </UBadge>
    </div>

    <div class="relative -mx-4 px-4 md:mx-0 md:px-0">
      <div class="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
        <DashboardTrendingRecipeCard
          v-for="recipe in recipes"
          :key="recipe.id"
          :id="recipe.id"
          :title="recipe.title"
          :thumb="recipe.thumb"
          :healthy="recipe.healthy"
          :sustainable="recipe.sustainable"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
