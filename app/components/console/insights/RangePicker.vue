<template>
  <!-- A toggle group, announced as one. The selected period was carried only
       by background colour, and focus was invisible. -->
  <div
    class="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-white/10"
    role="group"
    aria-label="Reporting period"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="rounded-md px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-zinc-900"
      :class="modelValue === option.value
        ? 'bg-brand-500 text-white'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'"
      :aria-pressed="modelValue === option.value"
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
// The range control the Observability tab already uses, lifted out so every
// Insights page offers the same choices in the same place.
defineProps<{ modelValue: number }>()
defineEmits<{ 'update:modelValue': [value: number] }>()

const options = [
  { label: '24h', value: 1 },
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 }
]
</script>
