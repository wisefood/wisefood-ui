<template>
  <div
    class="px-5 py-10 text-center"
    :role="failed ? 'alert' : undefined"
  >
    <UIcon
      :name="failed ? 'i-lucide-cloud-off' : icon"
      class="mx-auto h-8 w-8"
      :class="failed ? 'text-red-400 dark:text-red-500' : 'text-gray-300 dark:text-zinc-600'"
    />
    <p
      class="mt-3 text-sm"
      :class="failed ? 'font-medium text-red-700 dark:text-red-300' : 'text-gray-500 dark:text-gray-400'"
    >
      {{ title }}
    </p>
    <p
      v-if="hint"
      class="mt-1 text-xs"
      :class="failed ? 'text-red-600/80 dark:text-red-400/80' : 'text-gray-400 dark:text-gray-500'"
    >
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
/*
 * "Nothing here", "collection is off" and "the request failed" look identical
 * in an empty table, and the difference is the whole diagnosis. The hint line
 * carries the first two apart; `failed` carries the third apart from both,
 * in a different colour with a different icon, because a failure that renders
 * like a quiet week is the one thing a measurement page must never do.
 */
withDefaults(defineProps<{
  title: string
  hint?: string
  icon?: string
  /** The data could not be fetched. Rendered as an alert, not as an absence. */
  failed?: boolean
}>(), {
  hint: '',
  icon: 'i-lucide-inbox',
  failed: false
})
</script>
