<template>
  <div>
    <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <UBreadcrumb
        :items="breadcrumbItems"
        class="mb-4"
      />

      <UPageHeader
        title="Control Panel"
        description="Operational overview for Wisefood experts and administrators across curation, content quality, telemetry, and platform health."
        :ui="{
          root: 'relative py-8 border-b-0'
        }"
      />

      <UPageBody class="space-y-8">
        <section>
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <UCard
              v-for="shortcut in quickAccessCards"
              :key="shortcut.title"
              :ui="{ body: 'p-5' }"
              class="group border border-gray-200/70 shadow-sm transition-all duration-200 dark:border-white/10"
              :class="shortcut.available
                ? 'bg-white/95 ring-1 ring-brand-200/70 hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-900/80 dark:ring-brand-500/20'
                : 'bg-gray-100/90 opacity-70 dark:bg-zinc-900/50'"
            >
              <div class="flex items-start justify-between gap-4">
                <div
                  class="rounded-xl p-3"
                  :class="shortcut.iconWrapperClass"
                >
                  <UIcon
                    :name="shortcut.icon"
                    class="h-5 w-5"
                    :class="shortcut.iconClass"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <UBadge
                    v-if="!shortcut.available"
                    color="neutral"
                    variant="outline"
                    size="sm"
                  >
                    INOP
                  </UBadge>
                  <UIcon
                    name="i-lucide-arrow-up-right"
                    class="h-4 w-4 text-gray-400"
                    :class="shortcut.available ? 'transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5' : ''"
                  />
                </div>
              </div>

              <h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                {{ shortcut.title }}
              </h3>
              <p class="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                {{ shortcut.description }}
              </p>

              <div class="mt-4">
                <UButton
                  :to="shortcut.available ? shortcut.to : undefined"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  trailing-icon="i-lucide-arrow-right"
                  :disabled="!shortcut.available"
                >
                  {{ shortcut.available ? 'Open' : 'Unavailable' }}
                </UButton>
              </div>
            </UCard>
          </div>
        </section>

        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <UCard
            v-for="kpi in kpis"
            :key="kpi.label"
            :ui="{ body: 'p-5' }"
            class="border border-gray-200/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
            :class="kpi.available
              ? kpi.cardClass
              : 'bg-gray-100/90 opacity-70 dark:bg-zinc-900/50'"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-3">
                <p
                  class="text-sm font-medium dark:text-gray-300"
                  :class="kpi.available ? kpi.labelClass : 'text-gray-500 dark:text-gray-400'"
                >
                  {{ kpi.label }}
                </p>
                <p
                  class="text-3xl font-semibold tracking-tight"
                  :class="kpi.available ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'"
                >
                  {{ kpi.value }}
                </p>
                <div class="flex flex-wrap items-center gap-2">
                  <UBadge
                    :color="kpi.available ? kpi.deltaColor : 'neutral'"
                    :variant="kpi.available ? 'soft' : 'outline'"
                  >
                    {{ kpi.delta }}
                  </UBadge>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ kpi.hint }}
                  </span>
                </div>
              </div>

              <div class="flex flex-col items-end gap-2">
                <UBadge
                  v-if="!kpi.available"
                  color="neutral"
                  variant="outline"
                  size="sm"
                >
                  INOP
                </UBadge>
                <div
                  class="rounded-xl p-3"
                  :class="kpi.available ? kpi.iconWrapperClass : 'bg-gray-200/80 dark:bg-white/10'"
                >
                  <UIcon
                    :name="kpi.icon"
                    class="h-5 w-5"
                    :class="kpi.available ? kpi.iconClass : 'text-gray-500 dark:text-gray-400'"
                  />
                </div>
              </div>
            </div>
          </UCard>
        </section>
      </UPageBody>
    </UPage>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useConsoleStats } from '~/composables/useConsoleStats'

definePageMeta({
  layout: 'default'
})

const { catalog, recipeCount, obsStatus, llmCost, load } = useConsoleStats()
onMounted(() => {
  void load()
})

const fmt = (n: number | null | undefined): string => {
  if (n === null || n === undefined || n < 0) return '—'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

useHead({
  title: 'Console'
})

useSeoMeta({
  description: 'Wisefood Control Panel Console for expert and admin operations'
})

const breadcrumbItems = [
  {
    label: 'Console',
    icon: 'i-lucide-panel-top',
    to: '/console'
  },
  {
    label: 'Overview',
    icon: 'i-lucide-layout-dashboard'
  }
]

const kpis = computed(() => [
  {
    label: 'Total Catalog Assets',
    value: fmt(catalog.value?.totalAssets),
    delta: `${catalog.value?.entities.filter(e => e.total >= 0).length ?? 0} content types`,
    deltaColor: 'success' as const,
    hint: 'Guides, guidelines, articles, textbooks, collections, FC tables',
    icon: 'i-lucide-database',
    available: true,
    cardClass: 'border-t-2 border-t-brand-400 dark:border-t-brand-500/70',
    labelClass: 'text-brand-700 dark:text-brand-300',
    iconWrapperClass: 'bg-brand-50 dark:bg-brand-500/10',
    iconClass: 'text-brand-600 dark:text-brand-300'
  },
  {
    label: 'Pending Curation Reviews',
    value: fmt(catalog.value?.pendingReviews),
    delta: 'Awaiting verification',
    deltaColor: 'warning' as const,
    hint: 'Non-verified review states across catalog',
    icon: 'i-lucide-clipboard-check',
    available: true,
    cardClass: 'border-t-2 border-t-brandg-400 dark:border-t-brandg-500/70',
    labelClass: 'text-brandg-700 dark:text-brandg-300',
    iconWrapperClass: 'bg-brandg-50 dark:bg-brandg-500/10',
    iconClass: 'text-brandg-600 dark:text-brandg-300'
  },
  {
    label: 'Recipes',
    value: fmt(recipeCount.value),
    delta: 'In the recipe graph',
    deltaColor: 'info' as const,
    hint: 'Total RecipeWrangler recipes',
    icon: 'i-lucide-chef-hat',
    available: true,
    cardClass: 'border-t-2 border-t-brandp-300 dark:border-t-brandp-400/70',
    labelClass: 'text-brandp-600 dark:text-brandp-300',
    iconWrapperClass: 'bg-brandp-50 dark:bg-brandp-500/15',
    iconClass: 'text-brandp-500 dark:text-brandp-300'
  },
  {
    label: 'LLM Cost (7d)',
    value: llmCost.value != null ? `$${llmCost.value.toFixed(2)}` : (obsStatus.value?.enabled ? '$0.00' : '—'),
    delta: obsStatus.value?.enabled ? 'Across all models' : 'Not configured',
    deltaColor: 'primary' as const,
    hint: 'Last 7 days · open Analytics for detail',
    icon: 'i-lucide-sparkles',
    available: Boolean(obsStatus.value?.enabled),
    cardClass: 'border-t-2 border-t-brand-400 dark:border-t-brand-500/70',
    labelClass: 'text-brand-700 dark:text-brand-300',
    iconWrapperClass: 'bg-brand-50 dark:bg-brand-500/10',
    iconClass: 'text-brand-500 dark:text-brand-300'
  }
])

const quickAccessCards = [
  {
    title: 'Asset Manager',
    description: 'Browse and curate articles, dietary guidelines, and knowledge assets.',
    icon: 'i-lucide-folder-open',
    to: '/console/assets',
    available: true,
    iconWrapperClass: 'bg-brand-50 dark:bg-brand-500/10',
    iconClass: 'text-brand-600 dark:text-brand-300'
  },
  {
    title: 'Prompt / LLM Controls',
    description: 'Inspect prompt variants, telemetry, and operational controls for generative features.',
    icon: 'i-lucide-sliders-horizontal',
    to: '/console/operations?tab=observability',
    available: true,
    iconWrapperClass: 'bg-brand-50 dark:bg-brand-500/10',
    iconClass: 'text-brand-600 dark:text-brand-300'
  },
  {
    title: 'Analytics Reports',
    description: 'Open performance summaries, observability snapshots, and expert operations reports.',
    icon: 'i-lucide-chart-column',
    to: '/console/operations',
    available: true,
    iconWrapperClass: 'bg-brand-50 dark:bg-brand-500/10',
    iconClass: 'text-brand-600 dark:text-brand-300'
  }
]
</script>
