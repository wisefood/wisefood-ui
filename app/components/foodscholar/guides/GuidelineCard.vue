<template>
  <UCard
    :ui="{ body: compact ? 'p-4' : 'p-5' }"
    class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
  >
    <p class="whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-200">
      {{ guideline.rule_text }}
    </p>

    <div
      v-if="hasProvenance"
      class="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400"
    >
      <UIcon name="i-lucide-book-marked" class="h-3.5 w-3.5 shrink-0" />

      <ULink
        v-if="resolvedTitle && showGuideLink && guideTo"
        :to="guideTo"
        class="font-medium text-primary-600 hover:underline dark:text-primary-400"
      >
        {{ resolvedTitle }}
      </ULink>
      <span v-else-if="resolvedTitle" class="font-medium text-gray-700 dark:text-gray-300">
        {{ resolvedTitle }}
      </span>

      <span v-if="publisher" class="flex items-center gap-2">
        <span aria-hidden="true">·</span>
        <span>{{ publisher }}</span>
      </span>

      <span v-if="publicationYear" class="flex items-center gap-2">
        <span aria-hidden="true">·</span>
        <span>{{ publicationYear }}</span>
      </span>

      <span v-if="sourceReference" class="flex items-center gap-2">
        <span aria-hidden="true">·</span>
        <span>{{ sourceReference }}</span>
      </span>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogGuide, CatalogGuideline } from '~/services/catalogApi'
import {
  formatGuidelineSourceReference,
  getGuidePublisher,
  normalizeMeaningfulString
} from '~/utils/guidesCatalog'

interface Props {
  guideline: CatalogGuideline
  /** Full source guide record, used to resolve issuing organization and publication year. */
  guide?: CatalogGuide | null
  guideTitle?: string | null
  guideTo?: string | null
  showGuideLink?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  guide: null,
  guideTitle: null,
  guideTo: null,
  showGuideLink: true,
  compact: false
})

const resolvedTitle = computed(() =>
  normalizeMeaningfulString(props.guideTitle)
  || normalizeMeaningfulString(props.guide?.title)
  || normalizeMeaningfulString(props.guideline.guide_title)
)

const publisher = computed(() => (props.guide ? getGuidePublisher(props.guide) : null))

const publicationYear = computed(() => {
  const year = props.guide?.publication_year ?? props.guideline.publication_year
  return year ? String(year) : null
})

const sourceReference = computed(() => formatGuidelineSourceReference(props.guideline))

const hasProvenance = computed(() =>
  Boolean(resolvedTitle.value || publisher.value || publicationYear.value || sourceReference.value)
)
</script>
