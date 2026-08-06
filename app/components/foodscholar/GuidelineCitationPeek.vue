<template>
  <div
    v-if="open"
    ref="panelRef"
    class="fixed z-50 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-zinc-900"
    :style="panelStyle"
    role="dialog"
    :aria-label="$t('guidelines.peek.title')"
    @click.stop
  >
    <div v-if="loading" class="flex items-center gap-2 py-2 text-sm text-gray-500 dark:text-gray-400">
      <UIcon name="i-lucide-loader-circle" class="h-4 w-4 animate-spin" />
      {{ $t('guidelines.peek.loading') }}
    </div>

    <div v-else-if="error" class="py-2 text-sm text-gray-500 dark:text-gray-400">
      {{ $t('guidelines.peek.error') }}
    </div>

    <div v-else-if="guideline">
      <div class="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
        <UIcon name="i-lucide-list-checks" class="h-3.5 w-3.5" />
        {{ $t('guidelines.peek.title') }}
      </div>

      <p class="whitespace-pre-line text-sm leading-6 text-gray-800 dark:text-gray-100">
        {{ guideline.rule_text }}
      </p>

      <div v-if="chips.length" class="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          v-for="chip in chips"
          :key="`${chip.field}:${chip.value}`"
          class="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
          :title="chip.aiGenerated ? $t('guidelines.facets.aiSuggested') : chip.label"
        >
          <UIcon :name="chip.icon" class="h-3 w-3 shrink-0 opacity-70" />
          {{ chip.label }}
        </span>
      </div>

      <div
        class="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-white/10"
      >
        <span class="min-w-0 truncate text-xs text-gray-500 dark:text-gray-400">
          {{ provenance }}
        </span>
        <button
          type="button"
          class="shrink-0 text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
          @click="$emit('open')"
        >
          {{ $t('guidelines.peek.openInGuide') }} →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Inline preview of a guideline cited in a FoodScholar answer.
 *
 * Clicking a citation used to open a new tab immediately, which is a heavy
 * move for the common case of "what does that rule actually say?". The peek
 * answers that in place and keeps the full guide one deliberate click away.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CatalogGuideline } from '~/services/catalogApi'
import { guidelineFacetChips } from '~/utils/guidelineFacets'
import { normalizeMeaningfulString } from '~/utils/guidesCatalog'

interface Props {
  open: boolean
  guideline: CatalogGuideline | null
  loading?: boolean
  error?: boolean
  /** Viewport coordinates of the clicked citation anchor. */
  anchorRect: { top: number, left: number, bottom: number, width: number } | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: false
})

const emit = defineEmits<{ close: [], open: [] }>()

const panelRef = ref<HTMLElement | null>(null)

const chips = computed(() =>
  props.guideline ? guidelineFacetChips(props.guideline, { limit: 6 }) : []
)

const provenance = computed(() => {
  if (!props.guideline) return ''
  const parts = [
    normalizeMeaningfulString(props.guideline.guide_title),
    props.guideline.page_no ? `p. ${props.guideline.page_no}` : null
  ].filter(Boolean)
  return parts.join(' · ')
})

/**
 * Position below the anchor, flipping above when there is no room, and always
 * staying inside the viewport horizontally.
 */
const panelStyle = computed(() => {
  const rect = props.anchorRect
  if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

  const PANEL_WIDTH = Math.min(384, window.innerWidth - 32)
  const ESTIMATED_HEIGHT = 220
  const GAP = 8

  const spaceBelow = window.innerHeight - rect.bottom
  const placeAbove = spaceBelow < ESTIMATED_HEIGHT && rect.top > ESTIMATED_HEIGHT

  let left = rect.left + rect.width / 2 - PANEL_WIDTH / 2
  left = Math.max(16, Math.min(left, window.innerWidth - PANEL_WIDTH - 16))

  return placeAbove
    ? { left: `${left}px`, bottom: `${window.innerHeight - rect.top + GAP}px` }
    : { left: `${left}px`, top: `${rect.bottom + GAP}px` }
})

const onDocumentClick = (event: MouseEvent) => {
  if (!props.open) return
  if (panelRef.value?.contains(event.target as Node)) return
  emit('close')
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.open) emit('close')
}

watch(
  () => props.open,
  (isOpen) => {
    if (typeof document === 'undefined') return
    if (isOpen) {
      // Deferred so the click that opened the peek does not immediately close it.
      setTimeout(() => document.addEventListener('click', onDocumentClick), 0)
    } else {
      document.removeEventListener('click', onDocumentClick)
    }
  }
)

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('click', onDocumentClick)
})
</script>
