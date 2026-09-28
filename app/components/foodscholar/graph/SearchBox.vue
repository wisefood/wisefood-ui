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
        @blur="onBlur"
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
    <p
      v-else-if="open && !loading && modelValue.trim()"
      class="absolute left-0 right-0 top-full z-40 mt-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 shadow-xl"
    >
      {{ t('graph.search.noResults') }}
    </p>
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
 * It navigates: choosing a suggestion goes to that node — selects it and
 * reveals it in the tree — and Enter without choosing one goes to the top
 * suggestion, so pressing it always does something visible.
 */

const props = defineProps<{
  modelValue: string
  isDark?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
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
    // Open even when empty, so "no matches" is said rather than implied — but
    // not for an answer that arrives after the box was left.
    open.value = focused.value
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

// Closed on leaving the box, or the list would stay over the tree after a
// click elsewhere. Choosing an option does not blur: it is `mousedown.prevent`.
function onBlur() {
  focused.value = false
  open.value = false
}

function clear() {
  emit('update:modelValue', '')
  suggestions.value = []
  open.value = false
  inputRef.value?.focus()
}

/**
 * Enter with nothing highlighted: go to the top suggestion.
 *
 * Enter can land before the debounced lookup has answered, or while an older
 * list is still showing, so this asks for the current text now rather than
 * choosing from whatever happens to be on screen.
 */
async function goToTopSuggestion() {
  const query = props.modelValue.trim()
  if (!query) return
  if (debounce) clearTimeout(debounce)
  loading.value = true
  await fetchSuggestions(query)
  const top = suggestions.value[0]
  if (top && props.modelValue.trim() === query) choose(top)
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
      } else if (suggestions.value.length && !loading.value) {
        choose(suggestions.value[0]!)
      } else {
        void goToTopSuggestion()
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
