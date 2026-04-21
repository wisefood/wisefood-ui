<template>
  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <NuxtLink
      v-for="region in regions"
      :key="region.region"
      :to="buildGuidesRegionPath(region.region)"
      class="group block h-full"
    >
      <UCard
        :ui="{ body: 'p-5 sm:p-6' }"
        class="h-full border border-gray-200/70 bg-white/95 shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md dark:border-white/10 dark:bg-zinc-900/80"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-xl ring-1 ring-brand-200/60 dark:bg-brand-500/10 dark:ring-brand-500/20">
                <span>{{ region.flag || '🌍' }}</span>
              </div>
              <div>
                <p class="text-xs font-medium uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                  Country / Region
                </p>
                <h3 class="text-lg font-semibold text-gray-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-300">
                  {{ region.label }}
                </h3>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="rounded-xl border border-gray-200/70 bg-gray-50/80 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                <p class="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                  Guides
                </p>
                <p class="mt-1 font-semibold text-gray-900 dark:text-white">
                  {{ region.guideCount.toLocaleString() }}
                </p>
              </div>

              <div class="rounded-xl border border-gray-200/70 bg-gray-50/80 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                <p class="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                  Rules
                </p>
                <p class="mt-1 font-semibold text-gray-900 dark:text-white">
                  {{ region.guidelineCount === null ? 'Explore' : region.guidelineCount.toLocaleString() }}
                </p>
              </div>
            </div>

            <div v-if="region.topics.length" class="flex flex-wrap gap-2">
              <UBadge
                v-for="topic in region.topics"
                :key="`${region.region}-${topic}`"
                color="neutral"
                variant="outline"
                class="max-w-full truncate"
              >
                {{ topic }}
              </UBadge>
            </div>
          </div>

          <div class="flex flex-col items-end gap-2 text-right">
            <span class="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-200/70 dark:bg-brand-500/10 dark:text-brand-200 dark:ring-brand-500/20">
              {{ region.latestPublicationYear ? `Latest ${region.latestPublicationYear}` : `${region.artifactCount} artifact${region.artifactCount === 1 ? '' : 's'}` }}
            </span>
            <UIcon
              name="i-lucide-arrow-up-right"
              class="h-5 w-5 text-gray-400 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </div>
        </div>
      </UCard>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { GuidesCatalogRegionSummary } from '~/utils/guidesCatalog'
import { buildGuidesRegionPath } from '~/utils/guidesCatalog'

defineProps<{
  regions: GuidesCatalogRegionSummary[]
}>()
</script>
