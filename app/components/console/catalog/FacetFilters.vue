<!--
  Filters built from the catalog's own facet buckets.

  Not a hardcoded list of statuses and licences: the same `/search` call that
  fills the table returns `fields` aggregations, so the options are whatever
  the data actually contains, with counts. A licence nobody uses does not
  appear; one that appears fifty times says so.

  Each selection becomes an `fq` term (`status:active`), which the catalog
  applies server-side — so filtering narrows the query rather than hiding rows
  the browser already paid to fetch.
-->
<template>
  <div
    v-if="groups.length"
    class="flex flex-wrap items-start gap-x-4 gap-y-3"
  >
    <div
      v-for="group in groups"
      :key="group.field"
      class="min-w-0"
    >
      <p class="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {{ group.label }}
      </p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="option in group.options"
          :key="option.value"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition"
          :class="isActive(group.field, option.value)
            ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400/60 dark:bg-brand-500/15 dark:text-brand-200'
            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5'"
          @click="toggle(group.field, option.value)"
        >
          {{ option.label }}
          <span class="tabular-nums opacity-60">{{ option.count }}</span>
        </button>
      </div>
    </div>

    <UButton
      v-if="selected.length"
      color="neutral"
      variant="ghost"
      size="xs"
      icon="i-lucide-x"
      class="mt-5 cursor-pointer"
      @click="clear"
    >
      Clear {{ selected.length }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** `{field: {value: count}}` from the search response. */
  facets: Record<string, Record<string, number>>
  /** Active `fq` terms, e.g. `['status:active']`. */
  modelValue: string[]
  /** Which facet fields to show, in order, with their headings. */
  labels: Record<string, string>
}>()

const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

const selected = computed(() => props.modelValue)

const groups = computed(() =>
  Object.keys(props.labels)
    .map(field => ({
      field,
      label: props.labels[field] ?? field,
      options: Object.entries(props.facets[field] ?? {})
        // Busiest first: the bucket somebody is most likely to want is the
        // one they should not have to hunt for.
        .sort((a, b) => b[1] - a[1])
        .map(([value, count]) => ({ value, label: value || '—', count }))
    }))
    .filter(group => group.options.length > 1))

/*
 * Values can contain a colon (a URN, a licence URL), so the term is split on
 * the FIRST colon only — splitting on every one would turn
 * `license:CC-BY-4.0` into something the catalog cannot parse.
 */
const term = (field: string, value: string) => `${field}:${value}`

function isActive(field: string, value: string): boolean {
  return selected.value.includes(term(field, value))
}

function toggle(field: string, value: string) {
  const next = term(field, value)
  emit('update:modelValue', selected.value.includes(next)
    ? selected.value.filter(t => t !== next)
    : [...selected.value, next])
}

function clear() {
  emit('update:modelValue', [])
}
</script>
