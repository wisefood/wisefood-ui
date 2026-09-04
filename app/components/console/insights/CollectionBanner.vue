<template>
  <div
    v-if="show"
    class="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
  >
    <p class="font-medium">
      {{ paused ? 'Collection is paused' : 'Activity analytics is not collecting' }}
    </p>
    <p class="mt-1">
      {{ paused
        ? 'An administrator paused recording from Platform Operations. Existing data is still shown.'
        : 'These pages will stay empty until ANALYTICS_ENABLED is set on the API and the analytics schema is applied.' }}
    </p>
  </div>
</template>

<script setup lang="ts">
// Shown above every Insights page. An empty dashboard because nothing is being
// recorded looks exactly like an empty dashboard because nobody used the
// product, and only one of those is worth acting on.
defineProps<{ show: boolean, paused?: boolean }>()
</script>
