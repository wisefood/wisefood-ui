<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Home',
    to: '/',
    active: route.path === '/'
  },
  {
    label: 'FoodScholar',
    to: `${useRuntimeConfig().public.contextPath || ''}/foodscholar`,
    active: route.path.startsWith('/foodscholar')
  },
  {
    label: 'RecipeWrangler',
    to: `${useRuntimeConfig().public.contextPath || ''}/recipe-wrangler`,
    active: route.path.startsWith('/recipe-wrangler'),
  },
  {
    label: 'FoodChat',
    to: `${useRuntimeConfig().public.contextPath || ''}/foodchat`,
    active: route.path.startsWith('/foodchat')
  }
])
</script>

<template>
  <UHeader
    to="/"
    mode="slideover"
  >
    <template #title>
      <NuxtImg src="logo.png" alt="WiseFood" class="h-9 w-auto" />
    </template>

    <UNavigationMenu :items="items" />

    <template #right>
      <UColorModeButton />
    </template>

    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>
