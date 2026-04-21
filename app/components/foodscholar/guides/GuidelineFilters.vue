<template>
  <UCard
    :ui="{ body: 'p-4 sm:p-5' }"
    class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
  >
      <div class="space-y-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <UInput
          v-if="showQueryInput"
          :model-value="query"
          icon="i-lucide-search"
          placeholder="Search guideline text"
          class="w-full lg:flex-1"
          :disabled="disabled"
          @update:model-value="emit('update:query', String($event ?? ''))"
        />

        <div class="flex flex-wrap gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="disabled || !hasActiveFilters"
            @click="emit('reset')"
          >
            Reset
          </UButton>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <USelectMenu
          v-if="topicOptions.length > 1"
          :model-value="topic"
          :items="topicOptions"
          value-key="value"
          label-key="label"
          leading-icon="i-lucide-compass"
          class="w-full"
          :disabled="disabled"
          @update:model-value="emit('update:topic', String($event ?? 'all'))"
        />

        <USelectMenu
          v-if="audienceOptions.length > 1"
          :model-value="audience"
          :items="audienceOptions"
          value-key="value"
          label-key="label"
          leading-icon="i-lucide-users"
          class="w-full"
          :disabled="disabled"
          @update:model-value="emit('update:audience', String($event ?? 'all'))"
        />

        <USelectMenu
          v-if="showGuideFilter && guideOptions.length > 1"
          :model-value="guide"
          :items="guideOptions"
          value-key="value"
          label-key="label"
          leading-icon="i-lucide-book-open"
          class="w-full"
          :disabled="disabled"
          @update:model-value="emit('update:guide', String($event ?? 'all'))"
        />

        <USelectMenu
          v-if="showYearFilter && yearOptions.length > 1"
          :model-value="year"
          :items="yearOptions"
          value-key="value"
          label-key="label"
          leading-icon="i-lucide-calendar"
          class="w-full"
          :disabled="disabled"
          @update:model-value="emit('update:year', String($event ?? 'all'))"
        />

        <USelectMenu
          v-if="showPageFilter && pageOptions.length > 1"
          :model-value="pageRef"
          :items="pageOptions"
          value-key="value"
          label-key="label"
          leading-icon="i-lucide-file-text"
          class="w-full"
          :disabled="disabled"
          @update:model-value="emit('update:pageRef', String($event ?? 'all'))"
        />

        <USelectMenu
          v-if="sortOptions.length > 1"
          :model-value="sort"
          :items="sortOptions"
          value-key="value"
          label-key="label"
          leading-icon="i-lucide-arrow-up-down"
          class="w-full"
          :disabled="disabled"
          @update:model-value="emit('update:sort', String($event ?? ''))"
        />

        <USelectMenu
          v-if="showViewToggle && viewOptions.length > 1"
          :model-value="view"
          :items="viewOptions"
          value-key="value"
          label-key="label"
          leading-icon="i-lucide-panels-top-left"
          class="w-full"
          :disabled="disabled"
          @update:model-value="emit('update:view', String($event ?? 'list'))"
        />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GuidesCatalogSelectOption } from '~/utils/guidesCatalog'

interface Props {
  query?: string
  topic?: string
  audience?: string
  guide?: string
  year?: string
  sort?: string
  view?: string
  pageRef?: string
  topicOptions?: GuidesCatalogSelectOption[]
  audienceOptions?: GuidesCatalogSelectOption[]
  guideOptions?: GuidesCatalogSelectOption[]
  yearOptions?: GuidesCatalogSelectOption[]
  sortOptions?: GuidesCatalogSelectOption[]
  viewOptions?: GuidesCatalogSelectOption[]
  pageOptions?: GuidesCatalogSelectOption[]
  showGuideFilter?: boolean
  showQueryInput?: boolean
  showYearFilter?: boolean
  showViewToggle?: boolean
  showPageFilter?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  query: '',
  topic: 'all',
  audience: 'all',
  guide: 'all',
  year: 'all',
  sort: '',
  view: 'list',
  pageRef: 'all',
  topicOptions: () => [],
  audienceOptions: () => [],
  guideOptions: () => [],
  yearOptions: () => [],
  sortOptions: () => [],
  viewOptions: () => [],
  pageOptions: () => [],
  showGuideFilter: false,
  showQueryInput: true,
  showYearFilter: false,
  showViewToggle: false,
  showPageFilter: false,
  disabled: false
})

const emit = defineEmits<{
  (event: 'update:query', value: string): void
  (event: 'update:topic', value: string): void
  (event: 'update:audience', value: string): void
  (event: 'update:guide', value: string): void
  (event: 'update:year', value: string): void
  (event: 'update:sort', value: string): void
  (event: 'update:view', value: string): void
  (event: 'update:pageRef', value: string): void
  (event: 'reset'): void
}>()

const hasActiveFilters = computed(() => {
  return Boolean(
    props.query.trim()
    || props.topic !== 'all'
    || props.audience !== 'all'
    || props.guide !== 'all'
    || props.year !== 'all'
    || props.pageRef !== 'all'
    || props.view !== 'list'
  )
})
</script>
