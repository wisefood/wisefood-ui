<template>
  <UCard
    :ui="{ body: 'p-4' }"
    class="border border-gray-200/70 dark:border-white/10"
  >
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ label }}
        </p>
        <p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
          {{ display }}
        </p>
      </div>
      <div class="rounded-xl bg-brand-50 p-3 dark:bg-brand-500/10">
        <UIcon
          :name="icon"
          class="h-5 w-5 text-brand-600 dark:text-brand-300"
        />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ label: string, value: number | null | undefined, icon: string }>()

const display = computed(() => {
  const n = props.value
  if (n === null || n === undefined || n < 0) return '—'
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
})
</script>
