<template>
  <div class="inline-flex items-center gap-2">
    <div class="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-white/10">
      <button
        v-for="option in options"
        :key="option.value"
        class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
        :class="!custom && days === option.value
          ? 'bg-brand-500 text-white'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'"
        @click="choose(option.value)"
      >
        {{ option.label }}
      </button>
      <button
        class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
        :class="custom
          ? 'bg-brand-500 text-white'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'"
        @click="custom = !custom"
      >
        Custom
      </button>
    </div>

    <div
      v-if="custom"
      class="inline-flex items-center gap-1.5"
    >
      <UInput
        v-model="from"
        type="date"
        size="xs"
        :max="to || today"
        aria-label="From date"
      />
      <span class="text-xs text-gray-400">to</span>
      <UInput
        v-model="to"
        type="date"
        size="xs"
        :min="from"
        :max="today"
        aria-label="To date"
      />
      <UButton
        size="xs"
        color="neutral"
        variant="soft"
        :disabled="!from && !to"
        @click="apply"
      >
        Apply
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

/*
 * The reporting period, as either a preset or an arbitrary range.
 *
 * Presets cover the question people ask most ("how did this week go") and the
 * custom range covers the one that matters for evaluation ("what happened
 * during the March study"), which no fixed set of buckets can express. Both
 * produce the same three values, so a page consumes one shape either way.
 */
export interface Range {
  days: number
  since?: string
  until?: string
}

const props = withDefaults(defineProps<{ modelValue: Range }>(), {})
const emit = defineEmits<{ 'update:modelValue': [value: Range] }>()

const options = [
  { label: '24h', value: 1 },
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 }
]

const today = new Date().toISOString().slice(0, 10)
const custom = ref(Boolean(props.modelValue.since || props.modelValue.until))
const from = ref(props.modelValue.since?.slice(0, 10) ?? '')
const to = ref(props.modelValue.until?.slice(0, 10) ?? '')
const days = computed(() => props.modelValue.days)

function choose(value: number) {
  custom.value = false
  from.value = ''
  to.value = ''
  emit('update:modelValue', { days: value })
}

function apply() {
  // The end date is inclusive to the reader, so it is sent as the end of that
  // day rather than its start — otherwise picking today returns nothing.
  emit('update:modelValue', {
    days: props.modelValue.days,
    since: from.value ? `${from.value}T00:00:00Z` : undefined,
    until: to.value ? `${to.value}T23:59:59Z` : undefined
  })
}

watch(custom, (open) => {
  if (!open && (props.modelValue.since || props.modelValue.until)) {
    emit('update:modelValue', { days: props.modelValue.days })
  }
})
</script>
