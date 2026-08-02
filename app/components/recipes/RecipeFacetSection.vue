<!--
  A chip group driven by a search facet.

  The four annotation facets (cuisine, mood, flavour, food group) render
  identically, so they share one component rather than four near-copies of the
  Dish Type block. Adding a fifth facet becomes a line of config instead of
  thirty lines of markup.

  Two behaviours worth stating:

  - A selected value stays visible even when the current result set gives it a
    count of zero. Dropping it would make the chip the user just clicked
    disappear, leaving them unable to unclick it.
  - The section renders nothing at all when the facet is absent. The corpus does
    not have every facet populated yet, and an empty "Cuisine" panel reads as
    broken rather than as "not applicable".
-->
<template>
  <div
    v-if="options.length"
    class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
  >
    <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
      <UIcon
        :name="icon"
        class="w-4 h-4 text-brandg-500"
      />
      {{ title }}
      <span
        v-if="selected.length"
        class="ml-auto text-[10px] font-normal text-brandg-600 dark:text-brandg-400"
      >{{ selected.length }} selected</span>
    </h3>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in visibleOptions"
        :key="option.value"
        type="button"
        :aria-pressed="isSelected(option.value)"
        :class="[
          'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
          isSelected(option.value)
            ? 'bg-brandg-100 dark:bg-brandg-900/30 text-brandg-700 dark:text-brandg-400 ring-2 ring-brandg-400 dark:ring-brandg-600'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        ]"
        @click="toggle(option.value)"
      >
        <span class="flex items-center gap-1.5">
          <span
            v-if="option.emoji"
            aria-hidden="true"
          >{{ option.emoji }}</span>
          {{ option.label }}
          <span
            v-if="option.count !== null"
            class="text-[10px] font-normal opacity-70 tabular-nums"
          >{{ option.count }}</span>
        </span>
      </button>

      <button
        v-if="options.length > collapsedLimit"
        type="button"
        class="px-3 py-1.5 rounded-full text-sm font-medium text-brandg-600 dark:text-brandg-400 hover:underline"
        @click="expanded = !expanded"
      >
        {{ expanded ? 'Show fewer' : `+${options.length - collapsedLimit} more` }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { humanizeFacet } from '~/utils/facetPresentation'

interface FacetOption {
  value: string
  label: string
  count: number | null
  emoji?: string
}

const props = withDefaults(
  defineProps<{
    title: string
    icon: string
    /** Raw facet bucket: { value: count }. */
    bucket?: Record<string, number>
    /** Currently selected values. */
    selected: string[]
    /** Optional emoji per value, for facets worth making scannable. */
    emojis?: Record<string, string>
    /** How many chips to show before collapsing. */
    collapsedLimit?: number
  }>(),
  { collapsedLimit: 12 }
)

const emit = defineEmits<{ (e: 'toggle', value: string): void }>()

const expanded = ref(false)

const options = computed<FacetOption[]>(() => {
  const bucket = props.bucket ?? {}
  // Union of what the current results offer and what is already selected, so a
  // chip never vanishes from under the user's cursor when its count hits zero.
  const values = new Set<string>([...Object.keys(bucket), ...props.selected])
  return [...values]
    .map(value => ({
      value,
      label: humanizeFacet(value),
      count: typeof bucket[value] === 'number' ? bucket[value] : null,
      emoji: props.emojis?.[value]
    }))
    // Selected first so the active filters stay visible when collapsed,
    // then by count — the most useful choices are the ones that lead somewhere.
    .sort((a, b) => {
      const aSel = props.selected.includes(a.value) ? 1 : 0
      const bSel = props.selected.includes(b.value) ? 1 : 0
      if (aSel !== bSel) return bSel - aSel
      return (b.count ?? -1) - (a.count ?? -1)
    })
})

const visibleOptions = computed(() =>
  expanded.value ? options.value : options.value.slice(0, props.collapsedLimit)
)

function isSelected(value: string): boolean {
  return props.selected.includes(value)
}

function toggle(value: string): void {
  emit('toggle', value)
}
</script>
