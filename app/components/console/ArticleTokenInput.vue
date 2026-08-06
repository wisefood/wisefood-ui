<template>
  <div>
    <div class="flex gap-2">
      <UInputMenu
        v-if="suggestions.length"
        v-model="draft"
        :items="availableSuggestions"
        value-key="value"
        label-key="label"
        :placeholder="placeholder"
        :disabled="disabled"
        create-item="always"
        class="flex-1"
        @create="commit(String($event))"
        @update:model-value="onSuggestionPicked"
        @keydown.enter.prevent="commit(draft)"
      />
      <UInput
        v-else
        v-model="draft"
        :placeholder="placeholder"
        :disabled="disabled"
        class="flex-1"
        @keydown.enter.prevent="commit(draft)"
        @paste="onPaste"
      />
      <UButton
        icon="i-lucide-plus"
        color="neutral"
        variant="outline"
        :disabled="disabled || !draft.trim()"
        :aria-label="`Add ${label ?? 'item'}`"
        @click="commit(draft)"
      />
    </div>

    <div
      v-if="modelValue.length"
      class="mt-2 flex flex-wrap gap-1.5"
    >
      <span
        v-for="(item, index) in modelValue"
        :key="`${item}-${index}`"
        class="inline-flex items-center gap-1 rounded-full bg-gray-100 py-1 pl-2.5 pr-1 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-200"
      >
        <span
          v-if="ordered"
          class="tabular-nums text-[10px] text-gray-400 dark:text-gray-500"
        >{{ index + 1 }}</span>
        {{ item }}
        <button
          type="button"
          class="rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-100"
          :aria-label="`Remove ${item}`"
          :disabled="disabled"
          @click="removeAt(index)"
        >
          <UIcon
            name="i-lucide-x"
            class="h-3 w-3"
          />
        </button>
      </span>
    </div>

    <p
      v-else
      class="mt-2 text-xs text-gray-400 dark:text-gray-500"
    >
      {{ emptyText }}
    </p>

    <p
      v-if="limitReached"
      class="mt-1 text-xs text-amber-600 dark:text-amber-400"
    >
      Maximum of {{ max }} reached.
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * Chip editor for the article fields the API types as `string[]`.
 *
 * These were textareas asking for "comma-separated or one per line", which put
 * the burden of the wire format on the editor and silently produced wrong
 * arrays when a value legitimately contained a comma. Here each value is a
 * discrete token, so what the editor sees is exactly what gets posted.
 *
 * Pasting a comma- or newline-separated list still works — that is how people
 * move author lists in from elsewhere — but it is a convenience on input, not
 * the storage format.
 */
import { computed, ref } from 'vue'
import type { ArticleSelectOption } from '~/utils/consoleArticleVocabulary'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    placeholder?: string
    label?: string
    /** Optional suggestions; with none, the control is a plain text input. */
    suggestions?: Array<ArticleSelectOption & { count?: number }>
    /** Show a position number on each chip, for order-significant lists. */
    ordered?: boolean
    /** Backend cap, e.g. 50 tags, 10 key takeaways. */
    max?: number
    disabled?: boolean
    emptyText?: string
  }>(),
  {
    placeholder: 'Type and press Enter',
    suggestions: () => [],
    ordered: false,
    disabled: false,
    emptyText: 'None added yet.'
  }
)

const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

const draft = ref('')

const limitReached = computed(
  () => typeof props.max === 'number' && props.modelValue.length >= props.max
)

// Never suggest something already chosen.
const availableSuggestions = computed(() =>
  props.suggestions.filter(
    option => !props.modelValue.some(
      value => value.toLowerCase() === option.value.toLowerCase()
    )
  )
)

function addValues(values: string[]) {
  const next = [...props.modelValue]
  for (const raw of values) {
    const value = raw.trim()
    if (!value) continue
    // Case-insensitive dedupe: the API rejects tags that differ only by case.
    if (next.some(existing => existing.toLowerCase() === value.toLowerCase())) continue
    if (typeof props.max === 'number' && next.length >= props.max) break
    next.push(value)
  }
  if (next.length !== props.modelValue.length) emit('update:modelValue', next)
}

function commit(raw: string) {
  if (props.disabled) return
  addValues(String(raw ?? '').split(/[\n,]/))
  draft.value = ''
}

function onSuggestionPicked(value: unknown) {
  if (typeof value === 'string' && value.trim()) commit(value)
}

function onPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  if (!/[\n,]/.test(text)) return
  event.preventDefault()
  commit(text)
}

function removeAt(index: number) {
  if (props.disabled) return
  const next = [...props.modelValue]
  next.splice(index, 1)
  emit('update:modelValue', next)
}
</script>
