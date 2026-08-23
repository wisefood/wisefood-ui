<template>
  <div
    v-if="open && citation"
    ref="panelRef"
    class="fixed z-50 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-zinc-900"
    :style="panelStyle"
    role="dialog"
    :aria-label="t('foodScholarHome.qa.passagePeek.title')"
    @click.stop
    @mouseenter="$emit('pointer-enter')"
    @mouseleave="$emit('pointer-leave')"
  >
    <div class="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
      <UIcon
        name="i-lucide-quote"
        class="h-3.5 w-3.5"
      />
      {{ t('foodScholarHome.qa.passagePeek.title') }}
    </div>

    <p class="text-xs font-medium text-gray-900 dark:text-white leading-snug">
      {{ citation.article_title }}
    </p>

    <!-- The exact sentence(s) the answer leaned on — verbatim from the
         source, guaranteed by the backend's quote coercion. -->
    <blockquote
      v-if="citation.quote"
      class="mt-2 border-l-2 border-brand-300 dark:border-brand-700 pl-2.5 text-sm leading-6 text-gray-700 dark:text-gray-200 italic"
    >
      “{{ citation.quote }}”
    </blockquote>
    <p
      v-else
      class="mt-2 text-xs text-gray-500 dark:text-gray-400"
    >
      {{ t('foodScholarHome.qa.passagePeek.noQuote') }}
    </p>

    <div class="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-white/10">
      <span class="min-w-0 truncate text-xs text-gray-500 dark:text-gray-400">
        {{ provenance }}
      </span>
      <button
        type="button"
        class="shrink-0 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
        @click="$emit('open')"
      >
        {{ t('foodScholarHome.qa.passagePeek.openArticle') }} →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Hover preview of the passage an answer's article citation used.
 *
 * The quote travels with the citation (the backend coerces it to an exact
 * substring of the source), so this needs no fetch: hovering answers "what
 * does that citation actually say?" in place, and the full article — with the
 * same passage highlighted via ?hl= — stays one click away.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { QaCitation } from '~/services/foodscholarApi'

const props = withDefaults(defineProps<{
  open: boolean
  citation: QaCitation | null
  /** Viewport coordinates of the hovered citation anchor. */
  anchorRect: { top: number, left: number, bottom: number, width: number } | null
}>(), {})

defineEmits<{ 'open': [], 'pointer-enter': [], 'pointer-leave': [] }>()

const { t } = useI18n()
const panelRef = ref<HTMLElement | null>(null)

const provenance = computed(() => {
  const c = props.citation
  if (!c) return ''
  const authors = c.authors?.length
    ? c.authors[0] + (c.authors.length > 1 ? ' et al.' : '')
    : null
  return [authors, c.year, c.journal].filter(Boolean).join(' · ')
})

/** Below the anchor, flipping above when cramped; clamped to the viewport. */
const panelStyle = computed(() => {
  const rect = props.anchorRect
  if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

  const PANEL_WIDTH = Math.min(384, window.innerWidth - 32)
  const ESTIMATED_HEIGHT = 200
  const GAP = 8

  const spaceBelow = window.innerHeight - rect.bottom
  const placeAbove = spaceBelow < ESTIMATED_HEIGHT && rect.top > ESTIMATED_HEIGHT

  let left = rect.left + rect.width / 2 - PANEL_WIDTH / 2
  left = Math.max(16, Math.min(left, window.innerWidth - PANEL_WIDTH - 16))

  return placeAbove
    ? { left: `${left}px`, bottom: `${window.innerHeight - rect.top + GAP}px` }
    : { left: `${left}px`, top: `${rect.bottom + GAP}px` }
})
</script>
