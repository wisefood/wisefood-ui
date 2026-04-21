<template>
  <UCard
    :ui="{ body: 'p-5 sm:p-6' }"
    class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
  >
    <div class="space-y-5">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Guide Metadata
        </h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Publication context and structured catalog fields for this dietary guide.
        </p>
      </div>

      <dl class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="item in metadataItems"
          :key="item.label"
          class="rounded-2xl border border-gray-200/70 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/5"
        >
          <dt class="text-xs font-medium uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
            {{ item.label }}
          </dt>
          <dd class="mt-2 text-sm leading-6 text-gray-900 dark:text-white">
            {{ item.value }}
          </dd>
        </div>
      </dl>

      <div v-if="topics.length" class="space-y-2">
        <p class="text-xs font-medium uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
          Topics
        </p>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="topic in topics"
            :key="`${guide.urn}-${topic}`"
            color="neutral"
            variant="outline"
            class="max-w-full truncate"
          >
            {{ topic }}
          </UBadge>
        </div>
      </div>

      <div v-if="guide.identifiers.length" class="space-y-2">
        <p class="text-xs font-medium uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
          Identifiers
        </p>
        <div class="space-y-2">
          <div
            v-for="identifier in guide.identifiers"
            :key="`${identifier.scheme}-${identifier.value}`"
            class="rounded-xl border border-gray-200/70 px-4 py-3 text-sm dark:border-white/10"
          >
            <span class="font-medium text-gray-900 dark:text-white">{{ identifier.scheme }}:</span>
            <span class="ml-2 text-gray-600 dark:text-gray-300">{{ identifier.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogGuide } from '~/services/catalogApi'
import {
  formatCatalogDate,
  getGuideAudience,
  getGuidePublisher,
  getGuideTopics,
  getRegionPresentation
} from '~/utils/guidesCatalog'

const props = defineProps<{
  guide: CatalogGuide
  guidelineCount?: number | null
}>()

const topics = computed(() => getGuideTopics(props.guide))

const metadataItems = computed(() => {
  const region = getRegionPresentation(props.guide.region)

  return [
    { label: 'Country / Region', value: region.label },
    { label: 'Issuing authority', value: getGuidePublisher(props.guide) },
    { label: 'Publication year', value: props.guide.publication_year ? String(props.guide.publication_year) : null },
    { label: 'Publication date', value: props.guide.publication_date ? formatCatalogDate(props.guide.publication_date) : null },
    { label: 'Audience', value: getGuideAudience(props.guide) },
    { label: 'Language', value: props.guide.language?.toUpperCase() || null },
    { label: 'Guideline rules', value: props.guidelineCount !== null && props.guidelineCount !== undefined ? props.guidelineCount.toLocaleString() : null },
    { label: 'Document type', value: props.guide.document_type || null },
    { label: 'Legal status', value: props.guide.legal_status || null },
    { label: 'Graphical model', value: props.guide.graphical_model || null }
  ].filter((item): item is { label: string, value: string } => Boolean(item.value))
})
</script>
