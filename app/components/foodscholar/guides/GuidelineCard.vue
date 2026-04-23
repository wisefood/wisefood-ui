<template>
  <UCard
    :ui="{ body: compact ? 'p-4' : 'p-5' }"
    class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
  >
    <p class="whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-200">
      {{ guideline.rule_text }}
    </p>
  </UCard>
</template>

<script setup lang="ts">
import type { CatalogGuideline } from '~/services/catalogApi'

interface Props {
  guideline: CatalogGuideline
  guideTitle?: string | null
  guideTo?: string | null
  showGuideLink?: boolean
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  guideTitle: null,
  guideTo: null,
  showGuideLink: true,
  compact: false
})
</script>
