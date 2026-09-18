<template>
  <div
    ref="rootRef"
    class="relative"
  >
    <div
      class="flex items-center gap-2 rounded-xl border bg-white/90 dark:bg-zinc-900/90 px-3 shadow-sm transition-colors"
      :class="focused
        ? 'border-brand-400 dark:border-brand-500 ring-2 ring-brand-500/15'
        : 'border-zinc-200 dark:border-zinc-700'"
    >
      <UIcon
        name="i-lucide-search"
        class="h-4 w-4 shrink-0 text-zinc-400"
      />
      <input
        ref="inputRef"
        :value="modelValue"
        type="search"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="open"
        :aria-controls="`${uid}-suggestions`"
        :aria-activedescendant="activeIndex >= 0 ? `${uid}-option-${activeIndex}` : undefined"
        :placeholder="t('graph.search.placeholder')"
        class="h-10 min-w-0 flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
        @input="onInput"
        @focus="onFocus"
        @blur="focused = false"
        @keydown="onKeyDown"
      >
      <UIcon
        v-if="loading"
        name="i-lucide-loader-circle"
        class="h-4 w-4 shrink-0 animate-spin text-zinc-400"
      />
      <button
        v-else-if="modelValue"
        type="button"
        class="shrink-0 rounded p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        :aria-label="t('graph.search.clear')"
        @click="clear"
      >
        <UIcon
          name="i-lucide-x"
          class="h-4 w-4"
        />
      </button>
    </div>

    <ul
      v-if="open && suggestions.length"
      :id="`${uid}-suggestions`"
      role="listbox"
      class="absolute left-0 right-0 top-full z-40 mt-1 max-h-72 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-1 shadow-xl"
    >
      <li
        v-for="(item, index) in suggestions"
        :id="`${uid}-option-${index}`"
        :key="item.node_id"
        role="option"
        :aria-selected="index === activeIndex"
        class="flex cursor-pointer items-center gap-2 px-3 py-1.5 transition-colors"
        :class="index === activeIndex ? 'bg-brand-50 dark:bg-brand-900/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'"
        @mouseenter="activeIndex = index"
        @mousedown.prevent="choose(item)"
      >
        <span
          class="h-2 w-2 shrink-0 rounded-sm"
          :style="{ backgroundColor: palette.kind[item.kind] }"
        />
        <FoodscholarGraphShapeGlyph
          v-if="item.facet"
          :facet="item.facet"
          :size="10"
          class="shrink-0 text-zinc-400"
        />
        <span class="min-w-0 flex-1 truncate text-sm text-zinc-800 dark:text-zinc-100">{{ item.label }}</span>
        <span class="shrink-0 text-[0.65rem] tabular-nums text-zinc-400">{{ item.chunk_count.toLocaleString() }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import graphApi, { type GraphSuggestItem } from '~/services/graphApi'
import { GRAPH_THEME_DARK, GRAPH_THEME_LIGHT } from '~/utils/graphPalette'

/**
 * The search box, with autocomplete over node labels.
 *
 * Two different actions share it, and keeping them apart matters: choosing a
 * suggestion **goes to** that node — it selects it, reveals it in the tree and
 * centres it on the map — while pressing Enter without choosing one **filters**
 * the whole view to the query. The first is navigation and the second is a
 * lens, and a box that guessed between them would do the wrong one half the
 * time.
 */

const props = defineProps<{
  modelValue: string
  isDark?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  /** Enter with no suggestion chosen: narrow everything to this query. */
  'submit': [query: string]
  /** A suggestion chosen: go to that node. */
  'pick': [nodeId: string]
}>()

const { t } = useI18n()
const uid = useId()

const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const focused = ref(false)
const open = ref(false)
const loading = ref(false)
const suggestions = ref<GraphSuggestItem[]>([])
const activeIndex = ref(-1)

const palette = computed(() => (props.isDark ? GRAPH_THEME_DARK : GRAPH_THEME_LIGHT))

let debounce: ReturnType<typeof setTimeout> | null = null
let requestId = 0

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', value)
  activeIndex.value = -1

  if (debounce) clearTimeout(debounce)
  if (!value.trim()) {
    suggestions.value = []
    open.value = false
    loading.value = false
    return
  }
  loading.value = true
  // 160ms: long enough that a fast typist sends one request per word rather
  // than one per keystroke, short enough that the list feels attached to the
  // keyboard rather than to a timer.
  debounce = setTimeout(() => void fetchSuggestions(value), 160)
}

async function fetchSuggestions(query: string) {
  const id = ++requestId
  try {
    const items = await graphApi.suggest(query, { limit: 8 })
    // Out-of-order responses are the normal case when typing, not an edge:
    // a short query is often slower than the longer one after it.
    if (id !== requestId) return
    suggestions.value = items
    open.value = items.length > 0
  } catch {
    if (id === requestId) {
      suggestions.value = []
      open.value = false
    }
  } finally {
    if (id === requestId) loading.value = false
  }
}

function choose(item: GraphSuggestItem) {
  emit('update:modelValue', item.label)
  open.value = false
  suggestions.value = []
  emit('pick', item.node_id)
}

function onFocus() {
  focused.value = true
  if (suggestions.value.length) open.value = true
}

function clear() {
  emit('update:modelValue', '')
  suggestions.value = []
  open.value = false
  emit('submit', '')
  inputRef.value?.focus()
}

function onKeyDown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
      if (!open.value && suggestions.value.length) {
        open.value = true
        break
      }
      activeIndex.value = Math.min(activeIndex.value + 1, suggestions.value.length - 1)
      break
    case 'ArrowUp':
      activeIndex.value = Math.max(activeIndex.value - 1, -1)
      break
    case 'Enter':
      if (activeIndex.value >= 0 && suggestions.value[activeIndex.value]) {
        choose(suggestions.value[activeIndex.value]!)
      } else {
        open.value = false
        emit('submit', props.modelValue)
      }
      break
    case 'Escape':
      if (open.value) open.value = false
      else clear()
      break
    default:
      return
  }
  event.preventDefault()
}

onBeforeUnmount(() => {
  if (debounce) clearTimeout(debounce)
})

defineExpose({ focus: () => inputRef.value?.focus() })
</script>
