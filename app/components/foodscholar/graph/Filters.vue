<template>
  <div class="flex h-full flex-col">
    <div
      v-if="!hideHeader"
      class="flex shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-2.5"
    >
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

      <div class="space-y-1.5 border-t border-zinc-200 dark:border-zinc-800 pt-3">
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
import { GRAPH_FACETS, type GraphFilters } from '~/services/graphApi'

/**
 * The filter panel.
 *
 * Counts come from the same request as the results and are scoped to the
 * filters already applied, so every number answers "what would narrowing
 * further actually give me" rather than "how big is the graph". A zero here
 * is real information: it means that combination is empty, and the option
 * dims rather than disappearing, because an option that vanishes when it hits
 * zero cannot be un-selected.
 *
 * Only the filters the tree honours are offered — scope, facet and folded
 * shelves. The graph API takes more (kind, depth, evidence and the like), but
 * they narrowed a map this page no longer draws, and a control that changes
 * nothing on screen reads as a broken one.
 */

const props = defineProps<{
  modelValue: GraphFilters
  /** Aggregation buckets from the last search, keyed as the API returns them. */
  counts: Record<string, Record<string, number>>
  /** Label of the node the view is scoped to, if any. */
  scopeLabel?: string | null
  /**
   * Leave out the title row. Set when the panel sits in a slideover that
   * already has a title and a close button, so the title is not shown twice
   * and Clear moves to the slideover's footer.
   */
  hideHeader?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [filters: GraphFilters]
  'reset': []
}>()

const { t } = useI18n()

const showsFolded = computed(() => (props.modelValue.status || []).includes('folded'))

const activeCount = computed(() => {
  const f = props.modelValue
  let n = 0
  if (f.facet?.length) n++
  if (f.under) n++
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

type ArrayKey = 'facet'

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
