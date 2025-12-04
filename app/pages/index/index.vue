<script setup lang="ts">
definePageMeta({
  layout: 'default',
  sidebarNavigation: [[{
    label: 'Overview',
    icon: 'i-lucide-house',
    to: '/'
  }]]
});


</script>

<template>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Nuxt UI theme check</h1>
      <UButton color="secondary" variant="solid">Secondary</UButton>
    </div>

</template>

