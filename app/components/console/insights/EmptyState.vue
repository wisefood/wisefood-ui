<template>
  <div class="px-5 py-10 text-center">
    <UIcon
      :name="icon"
      class="mx-auto h-8 w-8 text-gray-300 dark:text-zinc-600"
    />
    <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
      {{ title }}
    </p>
    <p
      v-if="hint"
      class="mt-1 text-xs text-gray-400 dark:text-gray-500"
    >
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
// "Nothing here" and "collection is off" look identical in a table, and the
// difference is the whole diagnosis — so the hint line is not optional dressing.
withDefaults(defineProps<{ title: string, hint?: string, icon?: string }>(), {
  hint: '',
  icon: 'i-lucide-inbox'
})
</script>
