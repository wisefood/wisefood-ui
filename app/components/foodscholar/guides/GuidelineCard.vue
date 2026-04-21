<template>
  <UCard
    :ui="{ body: compact ? 'p-4' : 'p-5' }"
    class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
  >
    <div class="space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-if="guideline.action_type"
            color="primary"
            variant="soft"
          >
            {{ formatEnumLabel(guideline.action_type) }}
          </UBadge>
          <UBadge
            v-if="pageLabel"
            color="neutral"
            variant="outline"
          >
            {{ pageLabel }}
          </UBadge>
        </div>

        <span v-if="sequenceLabel" class="text-xs font-medium uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
          {{ sequenceLabel }}
        </span>
      </div>

      <div class="space-y-2">
        <h3 v-if="guideline.title" class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ guideline.title }}
        </h3>
        <p class="whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-200">
          {{ guideline.rule_text }}
        </p>
      </div>

      <div v-if="metaItems.length" class="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-300">
        <span
          v-for="item in metaItems"
          :key="item"
          class="inline-flex items-center gap-1.5"
        >
          <UIcon name="i-lucide-dot" class="h-3 w-3 text-brandg-500" />
          {{ item }}
        </span>
      </div>

      <div v-if="topicChips.length || audienceChips.length" class="flex flex-wrap gap-2">
        <UBadge
          v-for="chip in topicChips.slice(0, compact ? 3 : 5)"
          :key="`${guideline.id}-${chip}`"
          color="neutral"
          variant="outline"
          class="max-w-full truncate"
        >
          {{ chip }}
        </UBadge>
        <UBadge
          v-for="chip in audienceChips.slice(0, 2)"
          :key="`${guideline.id}-aud-${chip}`"
          color="success"
          variant="soft"
          class="max-w-full truncate"
        >
          {{ chip }}
        </UBadge>
      </div>

      <div v-if="resolvedGuideTitle || (showGuideLink && guideTo)" class="flex items-center justify-between gap-3 border-t border-gray-200/70 pt-4 text-sm dark:border-white/10">
        <div class="min-w-0 text-gray-600 dark:text-gray-300">
          <span class="font-medium text-gray-900 dark:text-white">Source:</span>
          <span class="ml-1 truncate">{{ resolvedGuideTitle || guideline.guide_urn }}</span>
        </div>

        <UButton
          v-if="showGuideLink && guideTo"
          :to="guideTo"
          color="neutral"
          variant="ghost"
          size="sm"
          trailing-icon="i-lucide-arrow-right"
        >
          Open guide
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogGuideline } from '~/services/catalogApi'
import {
  formatEnumLabel,
  formatGuidelineQuantity,
  getGuidelineAudienceChips,
  getGuidelinePageReferences,
  getGuidelineTopicChips
} from '~/utils/guidesCatalog'

interface Props {
  guideline: CatalogGuideline
  guideTitle?: string | null
  guideTo?: string | null
  showGuideLink?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  guideTitle: null,
  guideTo: null,
  showGuideLink: true,
  compact: false
})

const resolvedGuideTitle = computed(() => props.guideTitle || props.guideline.guide_title)
const topicChips = computed(() => getGuidelineTopicChips(props.guideline))
const audienceChips = computed(() => getGuidelineAudienceChips(props.guideline))
const pageReferences = computed(() => getGuidelinePageReferences(props.guideline))
const pageLabel = computed(() => {
  if (!pageReferences.value.length) {
    return null
  }

  return pageReferences.value.length === 1
    ? `Page ${pageReferences.value[0]}`
    : `Pages ${pageReferences.value.join(', ')}`
})
const sequenceLabel = computed(() => {
  if (props.guideline.sequence_no === null || props.guideline.sequence_no === undefined) {
    return null
  }

  return `Rule ${props.guideline.sequence_no}`
})
const metaItems = computed(() => {
  const quantityLabel = formatGuidelineQuantity(props.guideline.quantity)

  return [
    quantityLabel,
    props.guideline.frequency ? formatEnumLabel(props.guideline.frequency) : null,
    props.guideline.notes || null
  ].filter((item): item is string => Boolean(item))
})
</script>
