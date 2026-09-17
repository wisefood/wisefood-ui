<!--
  A list of short strings — cuisines, dietary patterns, measurement units.

  These fields are half of what a catalog record actually says, and a textarea
  of comma-separated values is how they end up with trailing spaces, empty
  entries and one value that is silently two. Each item is its own chip here,
  added deliberately and removed by clicking it.
-->
<template>
  <div class="space-y-2">
    <div
      v-if="items.length"
      class="flex flex-wrap gap-1.5"
    >
      <button
        v-for="(item, index) in items"
        :key="`${item}-${index}`"
        type="button"
        class="group inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-white/10 dark:bg-zinc-900 dark:text-gray-200 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-300"
        :title="`Remove ${item}`"
        @click="remove(index)"
      >
        {{ item }}
        <UIcon
          name="i-lucide-x"
          class="h-3 w-3 opacity-40 transition group-hover:opacity-100"
        />
      </button>
    </div>

    <div class="flex gap-2">
      <UInput
        v-model="draft"
        :placeholder="placeholder"
        class="w-full"
        size="sm"
        @keydown.enter.prevent="add"
      />
      <UButton
        color="neutral"
        variant="soft"
        size="sm"
        icon="i-lucide-plus"
        class="shrink-0 cursor-pointer"
        :disabled="!draft.trim()"
        @click="add"
      >
        Add
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

/*
 * `modelValue` is optional because these bind through an index signature
 * (`lists[field.key]`), which TypeScript types as possibly undefined. Taking
 * that here rather than asserting at every call site keeps the assertion out
 * of the pages.
 */
const props = withDefaults(defineProps<{
  modelValue?: string[]
  placeholder?: string
}>(), { modelValue: () => [], placeholder: '' })

const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

const draft = ref('')
const items = computed(() => props.modelValue ?? [])

function add() {
  // Comma-separated input is what people paste, so split it rather than
  // storing "beef, lamb" as one value somebody has to notice and fix.
  const values = draft.value.split(',').map(v => v.trim()).filter(Boolean)
  if (!values.length) return
  const next = [...items.value]
  for (const value of values) {
    if (!next.includes(value)) next.push(value)
  }
  emit('update:modelValue', next)
  draft.value = ''
}

function remove(index: number) {
  emit('update:modelValue', items.value.filter((_item, i) => i !== index))
}
</script>
