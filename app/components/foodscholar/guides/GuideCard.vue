<template>
  <NuxtLink :to="to" class="group block h-full">
    <UCard
      :ui="{ body: compact ? 'p-4' : 'p-5 sm:p-6' }"
      class="h-full border border-gray-200/70 bg-white/95 shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md dark:border-white/10 dark:bg-zinc-900/80"
    >
      <div class="flex h-full flex-col gap-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-if="showRegion && regionPresentation.value"
              color="neutral"
              variant="outline"
            >
              {{ [regionPresentation.value.flag, regionPresentation.value.label].filter(Boolean).join(' ') }}
            </UBadge>
            <UBadge
              v-if="guide.document_type"
              color="primary"
              variant="soft"
            >
              {{ guide.document_type }}
            </UBadge>
          </div>

          <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <UIcon name="i-lucide-file-text" class="h-4 w-4" />
            <span>{{ guide.artifacts.length }} artifact{{ guide.artifacts.length === 1 ? '' : 's' }}</span>
          </div>
        </div>

        <div class="space-y-2">
          <h3 class="text-lg font-semibold leading-7 text-gray-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-300">
            {{ guide.title }}
          </h3>
          <p class="line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
            {{ guide.description || 'Explore metadata, source artifacts, and structured guideline rules for this publication.' }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
          <span v-if="publisher" class="inline-flex items-center gap-1.5">
            <UIcon name="i-lucide-building-2" class="h-4 w-4 text-brand-500" />
            {{ publisher }}
          </span>
          <span v-if="publicationLabel" class="inline-flex items-center gap-1.5">
            <UIcon name="i-lucide-calendar" class="h-4 w-4 text-brand-500" />
            {{ publicationLabel }}
          </span>
          <span v-if="audience" class="inline-flex items-center gap-1.5">
            <UIcon name="i-lucide-users" class="h-4 w-4 text-brand-500" />
            {{ audience }}
          </span>
        </div>

        <div v-if="topics.length" class="flex flex-wrap gap-2">
          <UBadge
            v-for="topic in topics.slice(0, compact ? 3 : 4)"
            :key="`${guide.urn}-${topic}`"
            color="neutral"
            variant="outline"
            class="max-w-full truncate"
          >
            {{ topic }}
          </UBadge>
        </div>

        <div class="mt-auto flex items-center justify-between gap-3 border-t border-gray-200/70 pt-4 text-sm dark:border-white/10">
          <div class="flex flex-wrap gap-3 text-gray-600 dark:text-gray-300">
            <span v-if="guidelineCount !== null && guidelineCount !== undefined" class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-list-checks" class="h-4 w-4 text-brandg-600 dark:text-brandg-300" />
              {{ guidelineCount }} guideline{{ guidelineCount === 1 ? '' : 's' }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <UIcon :name="hasPdf ? 'i-lucide-file-text' : 'i-lucide-folder-open'" class="h-4 w-4 text-brandg-600 dark:text-brandg-300" />
              {{ hasPdf ? 'PDF available' : 'Metadata only' }}
            </span>
          </div>

          <span class="inline-flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-300">
            Open guide
            <UIcon name="i-lucide-arrow-right" class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </UCard>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogGuide } from '~/services/catalogApi'
import {
  getGuideAudience,
  getGuidePublicationLabel,
  getGuidePublisher,
  getGuideTopics,
  getRegionPresentation,
  isPdfArtifact
} from '~/utils/guidesCatalog'

interface Props {
  guide: CatalogGuide
  to: string
  guidelineCount?: number | null
  compact?: boolean
  showRegion?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  guidelineCount: null,
  compact: false,
  showRegion: false
})

const publisher = computed(() => getGuidePublisher(props.guide))
const publicationLabel = computed(() => getGuidePublicationLabel(props.guide))
const audience = computed(() => getGuideAudience(props.guide))
const topics = computed(() => getGuideTopics(props.guide))
const regionPresentation = computed(() => props.showRegion ? getRegionPresentation(props.guide.region) : null)
const hasPdf = computed(() => props.guide.artifacts.some(artifact => isPdfArtifact(artifact)))
</script>
