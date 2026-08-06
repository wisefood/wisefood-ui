<template>
  <UCard
    :ui="{ body: compact ? 'p-4' : 'p-5' }"
    class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
  >
    <p class="whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-200">
      {{ guideline.rule_text }}
    </p>

    <div v-if="facetChips.length" class="mt-3 flex flex-wrap items-center gap-1.5">
      <span
        v-for="chip in facetChips"
        :key="`${chip.field}:${chip.value}`"
        class="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
        :title="chip.aiGenerated ? $t('guidelines.facets.aiSuggested') : chip.label"
      >
        <UIcon :name="chip.icon" class="h-3 w-3 shrink-0 opacity-70" />
        {{ chip.label }}
        <span
          v-if="chip.aiGenerated"
          class="h-1 w-1 rounded-full bg-primary-400"
          :aria-label="$t('guidelines.facets.aiSuggested')"
        />
      </span>
    </div>

    <UCollapsible
      v-if="guideline.page_summary"
      class="mt-3"
    >
      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        trailing-icon="i-lucide-chevron-down"
        class="-ml-2"
      >
        {{ $t('guidelines.context.show') }}
      </UButton>

      <template #content>
        <div class="mt-2 rounded-lg bg-gray-50 p-3 dark:bg-white/5">
          <p
            v-if="guideline.section_label"
            class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
          >
            {{ guideline.section_label }}
          </p>
          <p class="text-xs leading-5 text-gray-600 dark:text-gray-300">
            {{ guideline.page_summary }}
          </p>
        </div>
      </template>
    </UCollapsible>

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
import { guidelineFacetChips } from '~/utils/guidelineFacets'

interface Props {
  guideline: CatalogGuideline
  /** Full source guide record, used to resolve issuing organization and publication year. */
  guide?: CatalogGuide | null
  guideTitle?: string | null
  guideTo?: string | null
  showGuideLink?: boolean
  compact?: boolean
  /** Hide the facet chip row, e.g. in dense list contexts. */
  hideFacets?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  guide: null,
  guideTitle: null,
  guideTo: null,
  showGuideLink: true,
  compact: false,
  hideFacets: false
})

// A compact card gets fewer chips so the rule text stays the focus. Rules that
// predate enrichment carry no facets and render no row at all.
const facetChips = computed(() =>
  props.hideFacets
    ? []
    : guidelineFacetChips(props.guideline, { limit: props.compact ? 3 : 6 })
)

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
