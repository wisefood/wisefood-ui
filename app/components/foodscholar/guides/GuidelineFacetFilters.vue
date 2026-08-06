<template>
  <div
    v-if="sections.length || showAgeFilter"
    class="divide-y divide-gray-100 dark:divide-zinc-800"
  >
    <!-- Header -->
    <div class="flex items-center justify-between gap-2 pb-3">
      <div>
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ $t('guidelines.filters.title') }}
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ $t('guidelines.filters.subtitle') }}
          <span v-if="activeCount"> · {{ activeCount }} {{ $t('guidelines.filters.active') }}</span>
        </p>
      </div>
      <button
        v-if="activeCount"
        type="button"
        class="text-xs text-brand-600 hover:underline dark:text-brand-400"
        @click="$emit('clear')"
      >
        {{ $t('guidelines.filters.clear') }}
      </button>
    </div>

    <!-- Age range.
         A two-thumb range rather than fixed presets: guidance boundaries are
         irregular (6 months, 1-4 years, 5-18), so any preset list misrepresents
         some guide. The histogram shows where the corpus actually has coverage,
         which is what makes an unfamiliar range legible. -->
    <div
      v-if="showAgeFilter"
      class="py-3"
    >
      <div class="mb-2 flex items-center justify-between gap-2">
        <label class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
          <UIcon
            name="i-lucide-calendar-range"
            class="h-3.5 w-3.5"
          />
          {{ $t('guidelines.filters.age') }}
        </label>
        <button
          v-if="ageRange"
          type="button"
          class="text-xs text-brand-600 hover:underline dark:text-brand-400"
          @click="$emit('age-range', null)"
        >
          {{ $t('guidelines.filters.clearOne') }}
        </button>
      </div>

      <div class="rounded-lg border border-gray-200 p-2 dark:border-zinc-800">
        <div class="flex h-10 items-end gap-[2px]">
          <div
            v-for="(bin, index) in ageHistogramBins"
            :key="`age-bin-${index}`"
            class="flex-1 rounded-sm transition-colors"
            :class="bin.active ? 'bg-brand-500/70 dark:bg-brand-400/70' : 'bg-gray-300 dark:bg-zinc-700'"
            :style="{ height: `${bin.heightPct}%` }"
            :title="bin.label"
          />
        </div>

        <USlider
          v-model="ageSlider"
          :min="0"
          :max="AGE_SLIDER_MAX_MONTHS"
          :step="1"
          :min-steps-between-thumbs="0"
          class="mt-3"
        />

        <div class="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <span>{{ $t('guidelines.filters.birth') }}</span>
          <span class="font-medium text-gray-700 dark:text-gray-300">{{ ageRangeLabel }}</span>
          <span>{{ formatAgeMonths(AGE_SLIDER_MAX_MONTHS) }}+</span>
        </div>

        <label class="mt-2 flex cursor-pointer items-start gap-2 text-[11px] leading-4 text-gray-500 dark:text-gray-400">
          <UCheckbox
            :model-value="includeUnstatedAge"
            @update:model-value="$emit('include-unstated-age', Boolean($event))"
          />
          <span>{{ $t('guidelines.filters.includeUnstatedAge') }}</span>
        </label>
      </div>
    </div>

    <!-- Term facets -->
    <div
      v-for="section in sections"
      :key="section.field"
      class="py-3"
    >
      <div class="mb-2 flex items-center justify-between gap-2">
        <label class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
          <UIcon
            :name="section.icon"
            class="h-3.5 w-3.5"
          />
          {{ section.title }}
        </label>
        <button
          v-if="section.selectedCount"
          type="button"
          class="text-xs text-brand-600 hover:underline dark:text-brand-400"
          @click="$emit('clear-field', section.field)"
        >
          {{ $t('guidelines.filters.clearOne') }}
        </button>
      </div>

      <div class="space-y-1">
        <label
          v-for="option in visibleOptions(section)"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
        >
          <UCheckbox
            :model-value="option.selected"
            @update:model-value="$emit('toggle', section.field, option.value)"
          />
          <span class="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-200">
            {{ option.label }}
          </span>
          <span class="shrink-0 text-xs tabular-nums text-gray-400 dark:text-gray-500">
            {{ option.count }}
          </span>
        </label>

        <button
          v-if="section.options.length > collapsedLimit"
          type="button"
          class="mt-1 text-xs text-brand-600 hover:underline dark:text-brand-400"
          @click="toggleExpanded(section.field)"
        >
          {{
            expanded[section.field]
              ? $t('guidelines.filters.showLess')
              : $t('guidelines.filters.showMore', { count: section.options.length - collapsedLimit })
          }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Filter panel for guideline rules.
 *
 * Built on the same vocabulary as the article catalog's filter sidebar —
 * sectioned rows, per-section Clear, tick-boxes with counts, histogram-backed
 * range — so a reader who has filtered articles does not have to learn a second
 * pattern for rules.
 *
 * Two behaviours worth stating:
 *
 * - A selected value stays visible even at count zero, so the box a reader just
 *   ticked cannot vanish before they can untick it.
 * - A facet with no buckets renders nothing. Enrichment fills these in over
 *   time, and an empty "Life stage" section reads as broken rather than as
 *   "nothing here yet".
 */
import { computed, ref } from 'vue'
import type { CatalogFacetBucket } from '~/services/catalogApi'
import {
  AGE_SLIDER_MAX_MONTHS,
  GUIDELINE_FILTER_FACETS,
  type GuidelineAgeRange,
  facetLabel,
  formatAgeMonths
} from '~/utils/guidelineFacets'

interface FacetOption {
  value: string
  label: string
  count: number
  selected: boolean
}

interface FacetSection {
  field: string
  title: string
  icon: string
  options: FacetOption[]
  selectedCount: number
}

const AGE_HISTOGRAM_BINS = 24

const props = withDefaults(
  defineProps<{
    /** Facet buckets from the catalog search response, keyed by field. */
    facets: Record<string, CatalogFacetBucket[]>
    /** Selected values per facet field. */
    selections: Record<string, string[]>
    collapsedLimit?: number
    /** Selected age band in months, or null for no age filter. */
    ageRange?: GuidelineAgeRange | null
    /** Whether rules that state no age range are kept in the results. */
    includeUnstatedAge?: boolean
    showAgeFilter?: boolean
    /** Rule age spans, used to draw the coverage histogram. */
    ageSpans?: Array<{ min: number | null, max: number | null }>
  }>(),
  {
    collapsedLimit: 8,
    ageRange: null,
    includeUnstatedAge: true,
    showAgeFilter: true,
    ageSpans: () => []
  }
)

const emit = defineEmits<{
  'toggle': [field: string, value: string]
  'clear': []
  'clear-field': [field: string]
  'age-range': [range: GuidelineAgeRange | null]
  'include-unstated-age': [include: boolean]
}>()

const expanded = ref<Record<string, boolean>>({})

function toggleExpanded(field: string) {
  expanded.value = { ...expanded.value, [field]: !expanded.value[field] }
}

const ageSlider = computed({
  get: (): [number, number] => [
    props.ageRange?.minMonths ?? 0,
    props.ageRange?.maxMonths ?? AGE_SLIDER_MAX_MONTHS
  ],
  set: (value: [number, number]) => {
    const [min, max] = value
    // The full span is "no filter" rather than a filter that happens to match
    // everything — it keeps the URL and the active count honest.
    if (min <= 0 && max >= AGE_SLIDER_MAX_MONTHS) {
      emit('age-range', null)
      return
    }
    emit('age-range', { minMonths: min, maxMonths: max })
  }
})

const ageRangeLabel = computed(() => {
  if (!props.ageRange) return 'Any age'
  const { minMonths, maxMonths } = props.ageRange
  if (maxMonths >= AGE_SLIDER_MAX_MONTHS) return `${formatAgeMonths(minMonths)}+`
  return `${formatAgeMonths(minMonths)} – ${formatAgeMonths(maxMonths)}`
})

/**
 * Coverage histogram over the rules' own age spans.
 *
 * A rule spanning 12–48 months contributes to every bin it overlaps, not just
 * its start — otherwise a corpus of broad rules would look empty everywhere but
 * the left edge.
 */
const ageHistogramBins = computed(() => {
  const binWidth = AGE_SLIDER_MAX_MONTHS / AGE_HISTOGRAM_BINS
  const counts: number[] = new Array(AGE_HISTOGRAM_BINS).fill(0)

  for (const span of props.ageSpans) {
    const from = span.min ?? 0
    const to = span.max ?? AGE_SLIDER_MAX_MONTHS
    const firstBin = Math.max(0, Math.floor(from / binWidth))
    const lastBin = Math.min(AGE_HISTOGRAM_BINS - 1, Math.floor(to / binWidth))
    for (let index = firstBin; index <= lastBin; index += 1) {
      counts[index] = (counts[index] ?? 0) + 1
    }
  }

  const peak = Math.max(...counts, 1)
  const [selectedMin, selectedMax] = ageSlider.value

  return counts.map((count, index) => {
    const from = Math.round(index * binWidth)
    const to = Math.round((index + 1) * binWidth)
    return {
      count,
      heightPct: count ? Math.max(8, Math.round((count / peak) * 100)) : 4,
      active: to >= selectedMin && from <= selectedMax,
      label: `${formatAgeMonths(from)}–${formatAgeMonths(to)}: ${count}`
    }
  })
})

const sections = computed<FacetSection[]>(() => {
  const result: FacetSection[] = []

  for (const facet of GUIDELINE_FILTER_FACETS) {
    const buckets = props.facets[facet.field] || []
    const selected = props.selections[facet.field] || []
    if (!buckets.length && !selected.length) continue

    const counts = new Map<string, number>()
    for (const bucket of buckets) {
      if (bucket?.value) counts.set(bucket.value, bucket.count)
    }
    // A ticked box must survive its count dropping to zero.
    for (const value of selected) {
      if (!counts.has(value)) counts.set(value, 0)
    }

    const options: FacetOption[] = [...counts.entries()]
      .map(([value, count]) => ({
        value,
        label: facetLabel(facet.field, value),
        count,
        selected: selected.includes(value)
      }))
      .sort((a, b) => {
        if (a.selected !== b.selected) return a.selected ? -1 : 1
        return b.count - a.count
      })

    result.push({
      field: facet.field,
      title: facet.title,
      icon: facet.icon,
      options,
      selectedCount: selected.length
    })
  }

  return result
})

const activeCount = computed(
  () =>
    Object.values(props.selections).reduce(
      (sum, values) => sum + (values?.length || 0),
      0
    ) + (props.ageRange ? 1 : 0)
)

function visibleOptions(section: FacetSection): FacetOption[] {
  return expanded.value[section.field]
    ? section.options
    : section.options.slice(0, props.collapsedLimit)
}
</script>
