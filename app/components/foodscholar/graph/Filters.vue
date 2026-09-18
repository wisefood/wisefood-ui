<template>
  <div class="flex h-full flex-col">
    <div class="flex shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-2.5">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {{ t('graph.filters.title') }}
      </h3>
      <button
        v-if="activeCount"
        type="button"
        class="text-[0.7rem] font-medium text-brand-600 dark:text-brand-400 hover:underline"
        @click="emit('reset')"
      >
        {{ t('graph.filters.clear', { count: activeCount }) }}
      </button>
    </div>

    <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      <!--
        Scope. Shown first because it is the filter that changes the most: it
        is set by clicking a node, not by opening this panel, so it needs to
        be visible and removable from here.
      -->
      <section v-if="scopeLabel">
        <h4 class="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {{ t('graph.filters.scope') }}
        </h4>
        <div class="flex items-center gap-2 rounded-lg border border-brand-200 dark:border-brand-900/60 bg-brand-50 dark:bg-brand-950/30 px-2.5 py-1.5">
          <UIcon
            name="i-lucide-scan-search"
            class="h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400"
          />
          <span
            class="min-w-0 flex-1 truncate text-xs text-zinc-700 dark:text-zinc-200"
            :title="scopeLabel"
          >
            {{ scopeLabel }}
          </span>
          <button
            type="button"
            class="shrink-0 rounded p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            :aria-label="t('graph.filters.clearScope')"
            @click="update({ under: null })"
          >
            <UIcon
              name="i-lucide-x"
              class="h-3.5 w-3.5"
            />
          </button>
        </div>
      </section>

      <!-- Facets. The one filter most sessions actually use, so it is not
           behind a disclosure and its counts are always visible. -->
      <fieldset>
        <legend class="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {{ t('graph.filters.facet') }}
        </legend>
        <div class="space-y-0.5">
          <label
            v-for="facet in GRAPH_FACETS"
            :key="facet"
            class="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            :class="{ 'opacity-40': countFor('by_facet', facet) === 0 && !isChecked('facet', facet) }"
          >
            <input
              type="checkbox"
              class="h-3.5 w-3.5 rounded border-zinc-300 dark:border-zinc-600 text-brand-500 focus:ring-brand-500"
              :checked="isChecked('facet', facet)"
              @change="toggle('facet', facet)"
            >
            <FoodscholarGraphShapeGlyph
              :facet="facet"
              class="shrink-0 text-zinc-500 dark:text-zinc-400"
            />
            <span class="min-w-0 flex-1 truncate text-xs text-zinc-700 dark:text-zinc-200">
              {{ t(`graph.facets.${facet}`) }}
            </span>
            <span class="shrink-0 text-[0.65rem] tabular-nums text-zinc-400 dark:text-zinc-500">
              {{ formatCount(countFor('by_facet', facet)) }}
            </span>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend class="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {{ t('graph.filters.kind') }}
        </legend>
        <div class="space-y-0.5">
          <label
            v-for="kind in GRAPH_KINDS"
            :key="kind"
            class="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <input
              type="checkbox"
              class="h-3.5 w-3.5 rounded border-zinc-300 dark:border-zinc-600 text-brand-500 focus:ring-brand-500"
              :checked="isChecked('kind', kind)"
              @change="toggle('kind', kind)"
            >
            <span
              class="h-2.5 w-2.5 shrink-0 rounded-sm"
              :style="{ backgroundColor: palette.kind[kind] }"
            />
            <span class="min-w-0 flex-1 truncate text-xs text-zinc-700 dark:text-zinc-200">
              {{ t(`graph.kind.${kind}`) }}
            </span>
            <span class="shrink-0 text-[0.65rem] tabular-nums text-zinc-400 dark:text-zinc-500">
              {{ formatCount(countFor('by_kind', kind)) }}
            </span>
          </label>
        </div>
      </fieldset>

      <!-- Evidence quality. Only offered when cards are in scope: filtering
           on a card property while cards are excluded is a control that can
           only ever return nothing. -->
      <fieldset v-if="qualityOptions.length">
        <legend class="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {{ t('graph.filters.evidenceQuality') }}
        </legend>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="quality in qualityOptions"
            :key="quality"
            type="button"
            class="rounded-full border px-2 py-0.5 text-[0.7rem] font-medium transition-colors"
            :class="isChecked('evidenceQuality', quality)
              ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
              : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400'"
            @click="toggle('evidenceQuality', quality)"
          >
            {{ t(`graph.quality.${quality}`, quality) }}
            <span class="ml-1 tabular-nums opacity-60">{{ formatCount(countFor('by_evidence_quality', quality)) }}</span>
          </button>
        </div>
      </fieldset>

      <fieldset v-if="discoveryOptions.length">
        <legend class="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {{ t('graph.filters.discoveredBy') }}
        </legend>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="method in discoveryOptions"
            :key="method"
            type="button"
            class="rounded-full border px-2 py-0.5 text-[0.7rem] font-medium transition-colors"
            :class="isChecked('discoveredBy', method)
              ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
              : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400'"
            @click="toggle('discoveredBy', method)"
          >
            {{ method }}
            <span class="ml-1 tabular-nums opacity-60">{{ formatCount(countFor('by_discovered_by', method)) }}</span>
          </button>
        </div>
      </fieldset>

      <!-- Depth. The single most effective control over how much arrives, so
           it is a slider rather than a number field: the cost of the next
           level is something you want to feel. -->
      <div>
        <label class="mb-1 flex items-center justify-between">
          <span class="text-[0.6rem] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {{ t('graph.filters.depth') }}
          </span>
          <span class="text-[0.7rem] tabular-nums text-zinc-600 dark:text-zinc-300">
            {{ modelValue.depthMax ?? maxDepth }}
          </span>
        </label>
        <input
          type="range"
          class="w-full accent-brand-500"
          min="0"
          :max="maxDepth"
          :value="modelValue.depthMax ?? maxDepth"
          @change="update({ depthMax: Number(($event.target as HTMLInputElement).value) })"
        >
        <p class="mt-0.5 text-[0.65rem] leading-tight text-zinc-400 dark:text-zinc-500">
          {{ t('graph.filters.depthHint') }}
        </p>
      </div>

      <div>
        <label class="mb-1 flex items-center justify-between">
          <span class="text-[0.6rem] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {{ t('graph.filters.minEvidence') }}
          </span>
          <span class="text-[0.7rem] tabular-nums text-zinc-600 dark:text-zinc-300">
            {{ modelValue.minChunks || 0 }}
          </span>
        </label>
        <input
          type="range"
          class="w-full accent-brand-500"
          min="0"
          max="100"
          step="5"
          :value="modelValue.minChunks || 0"
          @change="update({ minChunks: Number(($event.target as HTMLInputElement).value) || null })"
        >
      </div>

      <div class="space-y-1.5 border-t border-zinc-200 dark:border-zinc-800 pt-3">
        <label class="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            class="h-3.5 w-3.5 rounded border-zinc-300 dark:border-zinc-600 text-brand-500 focus:ring-brand-500"
            :checked="modelValue.hasCard === true"
            @change="update({ hasCard: ($event.target as HTMLInputElement).checked ? true : null })"
          >
          <span class="text-xs text-zinc-700 dark:text-zinc-200">{{ t('graph.filters.onlyWithCard') }}</span>
        </label>
        <label class="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            class="h-3.5 w-3.5 rounded border-zinc-300 dark:border-zinc-600 text-brand-500 focus:ring-brand-500"
            :checked="showsFolded"
            @change="toggleFolded(($event.target as HTMLInputElement).checked)"
          >
          <span class="text-xs text-zinc-700 dark:text-zinc-200">{{ t('graph.filters.showFolded') }}</span>
        </label>
        <p class="pl-5 text-[0.65rem] leading-tight text-zinc-400 dark:text-zinc-500">
          {{ t('graph.filters.foldedHint') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  GRAPH_FACETS,
  GRAPH_KINDS,
  EVIDENCE_QUALITIES,
  type GraphFilters
} from '~/services/graphApi'
import { GRAPH_THEME_DARK, GRAPH_THEME_LIGHT } from '~/utils/graphPalette'

/**
 * The filter panel.
 *
 * Counts come from the same request as the results and are scoped to the
 * filters already applied, so every number answers "what would narrowing
 * further actually give me" rather than "how big is the graph". A zero here
 * is real information: it means that combination is empty, and the option
 * dims rather than disappearing, because an option that vanishes when it hits
 * zero cannot be un-selected.
 */

const props = defineProps<{
  modelValue: GraphFilters
  /** Aggregation buckets from the last search, keyed as the API returns them. */
  counts: Record<string, Record<string, number>>
  maxDepth: number
  /** Label of the node the view is scoped to, if any. */
  scopeLabel?: string | null
  isDark?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [filters: GraphFilters]
  'reset': []
}>()

const { t } = useI18n()

const palette = computed(() => (props.isDark ? GRAPH_THEME_DARK : GRAPH_THEME_LIGHT))

/** Options are driven by what the data has, not by the enum, except for the
 *  qualities — those are a closed vocabulary and a missing one is meaningful
 *  ("nothing here is debated" reads differently from "debated is not an
 *  option"). Discovery methods are open-ended, so they come from the counts. */
const qualityOptions = computed(() => {
  const buckets = props.counts.by_evidence_quality || {}
  const present = EVIDENCE_QUALITIES.filter(q => buckets[q] !== undefined)
  return present.length ? present : []
})

const discoveryOptions = computed(() => Object.keys(props.counts.by_discovered_by || {}).sort())

const showsFolded = computed(() => (props.modelValue.status || []).includes('folded'))

const activeCount = computed(() => {
  const f = props.modelValue
  let n = 0
  if (f.q?.trim()) n++
  if (f.kind?.length) n++
  if (f.facet?.length) n++
  if (f.under) n++
  if (f.depthMax !== null && f.depthMax !== undefined && f.depthMax < props.maxDepth) n++
  if (f.minChunks) n++
  if (f.discoveredBy?.length) n++
  if (f.evidenceQuality?.length) n++
  if (f.hasCard !== null && f.hasCard !== undefined) n++
  if (showsFolded.value) n++
  return n
})

function countFor(bucket: string, key: string): number {
  return props.counts[bucket]?.[key] ?? 0
}

function formatCount(value: number): string {
  if (!value) return '0'
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return String(value)
}

type ArrayKey = 'kind' | 'facet' | 'status' | 'discoveredBy' | 'evidenceQuality'

function isChecked(key: ArrayKey, value: string): boolean {
  return (props.modelValue[key] as string[] | undefined)?.includes(value) ?? false
}

function update(patch: Partial<GraphFilters>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

function toggle(key: ArrayKey, value: string) {
  const current = (props.modelValue[key] as string[] | undefined) || []
  const next = current.includes(value)
    ? current.filter(v => v !== value)
    : [...current, value]
  update({ [key]: next } as Partial<GraphFilters>)
}

/**
 * Folded shelves absorbed an intermediary and are kept so no FoodOn id is
 * lost, not because anyone wants to navigate them. So the control is "show
 * folded" rather than a status picker: the default is the useful view, and
 * turning it off means asking for `active` explicitly, not asking for nothing.
 */
function toggleFolded(show: boolean) {
  update({ status: show ? ['active', 'folded'] : [] })
}
</script>
