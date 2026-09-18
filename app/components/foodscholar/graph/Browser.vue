<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <!-- ── the graph is not available ───────────────────────────────────── -->
    <div
      v-if="unavailable"
      class="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center"
    >
      <div class="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 px-8 py-10 backdrop-blur-sm">
        <UIcon
          :name="unavailable.icon"
          class="mx-auto h-9 w-9 text-zinc-300 dark:text-zinc-600"
        />
        <h2 class="mt-4 text-base font-semibold text-zinc-800 dark:text-zinc-100">
          {{ unavailable.title }}
        </h2>
        <p class="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {{ unavailable.body }}
        </p>
        <div class="mt-5 flex items-center justify-center gap-2">
          <button
            type="button"
            class="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:border-brand-400 hover:text-brand-600"
            @click="bootstrap"
          >
            {{ t('graph.retry') }}
          </button>
          <!-- Admin only, and gated again on the server: a curator looking at
               "never built" should be able to act on it without leaving. -->
          <button
            v-if="isAdmin && unavailable.canReindex"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-brand-600 disabled:opacity-50"
            :disabled="reindexing"
            @click="reindex"
          >
            <UIcon
              :name="reindexing ? 'i-lucide-loader-circle' : 'i-lucide-refresh-cw'"
              :class="['h-3.5 w-3.5', reindexing && 'animate-spin']"
            />
            {{ reindexing ? t('graph.admin.reindexing') : t('graph.admin.reindex') }}
          </button>
        </div>
        <p
          v-if="reindexNote"
          class="mt-3 text-xs text-zinc-500 dark:text-zinc-400"
        >
          {{ reindexNote }}
        </p>
      </div>
    </div>

    <template v-else>
      <!-- ── control bar ────────────────────────────────────────────────── -->
      <div class="shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <div class="mx-auto flex max-w-[1800px] flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
          <div class="min-w-0 flex-1 basis-64">
            <FoodscholarGraphSearchBox
              v-model="searchQuery"
              :is-dark="isDark"
              @submit="onSearchSubmit"
              @pick="onSearchPick"
            />
          </div>

          <!-- View switcher. Tree and map are peers; split is the default on
               a wide screen because the two answer different questions and
               most sessions use both. -->
          <div
            role="radiogroup"
            :aria-label="t('graph.view.label')"
            class="flex shrink-0 items-center gap-0.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 p-0.5"
          >
            <button
              v-for="option in viewOptions"
              :key="option.value"
              type="button"
              role="radio"
              :aria-checked="view === option.value"
              class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
              :class="view === option.value
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
              :title="option.label"
              @click="view = option.value"
            >
              <UIcon
                :name="option.icon"
                class="h-3.5 w-3.5"
              />
              <span class="hidden sm:inline">{{ option.label }}</span>
            </button>
          </div>

          <button
            type="button"
            class="flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors"
            :class="filtersOpen
              ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
              : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
            :aria-expanded="filtersOpen"
            @click="filtersOpen = !filtersOpen"
          >
            <UIcon
              name="i-lucide-sliders-horizontal"
              class="h-3.5 w-3.5"
            />
            <span class="hidden sm:inline">{{ t('graph.filters.title') }}</span>
            <span
              v-if="activeFilterCount"
              class="rounded-full bg-brand-500 px-1.5 text-[0.6rem] font-semibold text-white"
            >{{ activeFilterCount }}</span>
          </button>
        </div>

        <!-- Status line. Always present rather than a transient toast: what a
             graph view is showing, and how much of it, is part of reading it. -->
        <div class="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-4 gap-y-1 px-3 pb-2 text-[0.7rem] text-zinc-500 dark:text-zinc-400 sm:px-4">
          <span
            v-if="stream.streaming.value"
            class="flex items-center gap-1.5"
          >
            <UIcon
              name="i-lucide-loader-circle"
              class="h-3 w-3 animate-spin"
            />
            {{ t('graph.status.drawing', { nodes: stream.sentNodes.value.toLocaleString(), total: stream.totalNodes.value.toLocaleString() }) }}
          </span>
          <span
            v-else-if="stream.stats.value"
            class="flex items-center gap-1.5"
          >
            <UIcon
              name="i-lucide-check"
              class="h-3 w-3 text-emerald-500"
            />
            {{ t('graph.status.drawn', {
              nodes: stream.stats.value.nodes.toLocaleString(),
              edges: stream.stats.value.edges.toLocaleString(),
              ms: stream.stats.value.elapsedMs.toLocaleString()
            }) }}
          </span>

          <!-- Truncation is stated, not implied. A view that silently stopped
               at a ceiling looks like a small graph. -->
          <span
            v-if="stream.stats.value?.truncated"
            class="flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 text-amber-700 dark:text-amber-300"
          >
            <UIcon
              name="i-lucide-triangle-alert"
              class="h-3 w-3"
            />
            {{ t('graph.status.truncated') }}
          </span>
          <span
            v-if="stream.stats.value?.droppedEdges"
            :title="t('graph.status.droppedEdgesHint')"
          >
            {{ t('graph.status.droppedEdges', { count: stream.stats.value.droppedEdges }) }}
          </span>

          <span
            v-if="searchTotal !== null"
            class="flex items-center gap-1"
          >
            <UIcon
              name="i-lucide-search"
              class="h-3 w-3"
            />
            {{ t('graph.status.matches', { count: searchTotal }) }}
          </span>

          <span
            v-if="summary?.graph_version"
            class="ml-auto font-mono text-[0.65rem] opacity-70"
            :title="t('graph.status.buildHint')"
          >
            {{ t('graph.status.build') }} {{ summary.graph_version.slice(0, 10) }}
          </span>
        </div>
      </div>

      <!-- ── workspace ──────────────────────────────────────────────────── -->
      <div class="relative flex min-h-0 flex-1">
        <!-- Filters, as a column rather than an overlay: a filter panel that
             covers the thing it filters hides the effect of using it. -->
        <div
          v-if="filtersOpen"
          class="w-60 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm"
        >
          <FoodscholarGraphFilters
            v-model="filters"
            :counts="filterCounts"
            :max-depth="maxDepth"
            :scope-label="scopeLabel"
            :is-dark="isDark"
            @reset="resetFilters"
          />
        </div>

        <div
          v-show="view !== 'map'"
          :class="view === 'split' ? 'w-72 shrink-0 border-r border-zinc-200 dark:border-zinc-800' : 'min-w-0 flex-1'"
        >
          <FoodscholarGraphTree
            ref="treeRef"
            :selected-id="selectedId"
            :facets="filters.facet || []"
            :under="filters.under"
            :scope-label="scopeLabel"
            :show-folded="showsFolded"
            :is-dark="isDark"
            @select="onSelect"
          />
        </div>

        <div
          v-show="view !== 'tree'"
          class="relative min-w-0 flex-1"
        >
          <FoodscholarGraphCanvas
            ref="canvasRef"
            :nodes="stream.nodes"
            :edges="stream.edges"
            :revision="stream.revision.value"
            :selected-id="selectedId"
            :highlight-ids="highlightIds"
            @select="onSelect"
            @expand="onExpand"
          />

          <div class="pointer-events-none absolute left-4 top-4 z-10 w-56 max-w-[45%]">
            <div class="pointer-events-auto">
              <FoodscholarGraphLegend :is-dark="isDark" />
            </div>
          </div>

          <!-- A failure inside the stream, over the canvas rather than
               instead of it: whatever was already drawn is still true. -->
          <div
            v-if="stream.failure.value"
            class="absolute inset-x-4 bottom-16 z-20 mx-auto max-w-md rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/95 dark:bg-amber-950/80 p-3 shadow-lg backdrop-blur-sm"
          >
            <p class="text-xs text-amber-900 dark:text-amber-100">
              {{ failureMessage }}
            </p>
            <button
              type="button"
              class="mt-1.5 text-xs font-medium text-amber-900 dark:text-amber-100 underline"
              @click="reload"
            >
              {{ t('graph.retry') }}
            </button>
          </div>
        </div>

        <!-- Inspector. Present whenever something is selected, and on a wide
             screen it stays put so selecting the next node does not reflow
             the whole workspace. -->
        <div
          v-if="selectedId"
          class="absolute inset-y-0 right-0 z-30 w-full max-w-sm shadow-2xl lg:relative lg:z-auto lg:w-80 lg:max-w-none lg:shadow-none xl:w-96"
        >
          <FoodscholarGraphInspector
            :node-id="selectedId"
            :is-dark="isDark"
            @select="onSelect"
            @expand="onExpand"
            @scope="onScope"
            @ask="(question: string) => emit('ask', question)"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import { track } from '~/composables/useTelemetry'
import { useGraphStream } from '~/composables/useGraphStream'
import graphApi, { type GraphFilters, type GraphSummary } from '~/services/graphApi'

/**
 * The knowledge graph browser.
 *
 * Two views of one state. The tree answers "where am I" and the map answers
 * "what is near what"; they share a selection, a filter set and a search box,
 * so moving between them never means starting over. Split is the default on a
 * wide screen because most sessions use both within a minute.
 *
 * One state machine, three consumers: the filter set drives the search (which
 * supplies the result highlight and every count in the panel), the stream
 * (which draws the map) and the tree's structural scope. Changing a filter is
 * therefore one debounce and three effects, rather than three controls that
 * can disagree about what is being shown.
 */

const emit = defineEmits<{
  /** Hand a question to the Question Answering tab. */
  ask: [question: string]
}>()

const { t } = useI18n()
const authStore = useAuthStore()
const { isAdmin } = storeToRefs(authStore)

const stream = useGraphStream()

const treeRef = ref<{ reveal: (id: string) => void } | null>(null)
const canvasRef = ref<{ centerOn: (id: string) => void, fit: () => void } | null>(null)

const summary = ref<GraphSummary | null>(null)
const bootError = ref<string | null>(null)
const booting = ref(true)
const reindexing = ref(false)
const reindexNote = ref<string | null>(null)

const selectedId = ref<string | null>(null)
const searchQuery = ref('')
const searchTotal = ref<number | null>(null)
const highlightIds = ref<Set<string> | null>(null)
const filterCounts = ref<Record<string, Record<string, number>>>({})
const scopeLabel = ref<string | null>(null)

const filtersOpen = ref(false)
const view = ref<'tree' | 'map' | 'split'>('split')
const isDark = ref(false)

/**
 * The starting filter set.
 *
 * `depthMax: 2` rather than nothing. Unfiltered, the stream walks the whole
 * graph, and the server applies the same default when none is given — stating
 * it here means the depth slider shows the truth on first paint instead of
 * claiming the view is unlimited when it is not.
 */
function initialFilters(): GraphFilters {
  return {
    q: null,
    kind: [],
    facet: [],
    status: [],
    under: null,
    depthMax: 2,
    minChunks: null,
    discoveredBy: [],
    evidenceQuality: [],
    hasCard: null
  }
}

const filters = ref<GraphFilters>(initialFilters())

const showsFolded = computed(() => (filters.value.status || []).includes('folded'))

const maxDepth = computed(() => {
  const depths = Object.keys(filterCounts.value.by_depth || {}).map(Number).filter(n => !Number.isNaN(n))
  // 6 rather than 0 as the floor: a slider whose maximum is its minimum is a
  // control that cannot be moved, and the counts are empty on first paint.
  return depths.length ? Math.max(6, ...depths) : 6
})

const activeFilterCount = computed(() => {
  const f = filters.value
  let n = 0
  if (f.kind?.length) n++
  if (f.facet?.length) n++
  if (f.under) n++
  if (f.depthMax !== null && f.depthMax !== undefined && f.depthMax < maxDepth.value) n++
  if (f.minChunks) n++
  if (f.discoveredBy?.length) n++
  if (f.evidenceQuality?.length) n++
  if (f.hasCard !== null && f.hasCard !== undefined) n++
  if (showsFolded.value) n++
  return n
})

const viewOptions = computed(() => ([
  { value: 'tree' as const, icon: 'i-lucide-list-tree', label: t('graph.view.tree') },
  { value: 'split' as const, icon: 'i-lucide-columns-2', label: t('graph.view.split') },
  { value: 'map' as const, icon: 'i-lucide-waypoints', label: t('graph.view.map') }
]))

/**
 * The blocking states, each with its own words.
 *
 * "Switched off in this deployment", "built but never projected" and "you are
 * not allowed" are three different situations, and a single "unavailable"
 * message would send two thirds of the people who see it looking for the
 * wrong fix.
 */
const unavailable = computed(() => {
  if (booting.value) return null
  const failure = stream.failure.value
  const kind = bootError.value ?? failure?.kind
  if (summary.value?.built && !bootError.value && kind !== 'disabled') return null

  switch (kind) {
    case 'disabled':
      return {
        icon: 'i-lucide-power-off',
        title: t('graph.unavailable.disabledTitle'),
        body: t('graph.unavailable.disabledBody'),
        canReindex: false
      }
    case 'forbidden':
      return {
        icon: 'i-lucide-lock',
        title: t('graph.unavailable.forbiddenTitle'),
        body: t('graph.unavailable.forbiddenBody'),
        canReindex: false
      }
    case 'not-built':
      return {
        icon: 'i-lucide-database',
        title: t('graph.unavailable.notBuiltTitle'),
        body: t('graph.unavailable.notBuiltBody'),
        canReindex: true
      }
    default:
      if (summary.value && !summary.value.built) {
        return {
          icon: 'i-lucide-database',
          title: t('graph.unavailable.notBuiltTitle'),
          body: t('graph.unavailable.notBuiltBody'),
          canReindex: true
        }
      }
      return null
  }
})

const failureMessage = computed(() => {
  const failure = stream.failure.value
  if (!failure) return ''
  return failure.kind === 'error' ? failure.detail : t('graph.unavailable.notBuiltTitle')
})

// ── loading ───────────────────────────────────────────────────────────────

async function bootstrap() {
  booting.value = true
  bootError.value = null
  stream.clear()
  try {
    summary.value = await graphApi.summary()
    if (summary.value.built) {
      await Promise.all([refreshSearch(), reload()])
    }
  } catch (error) {
    const status = (error as { status?: number })?.status
    const title = String((error as { data?: { title?: string } })?.data?.title || '')
    bootError.value = status === 403
      ? 'forbidden'
      : title === 'KnowledgeGraphDisabled'
        ? 'disabled'
        : status === 503 ? 'not-built' : 'error'
  } finally {
    booting.value = false
  }
}

async function reload() {
  if (view.value === 'tree') return // nothing is drawing the map; do not pay for it
  await stream.load(filters.value)
}

/**
 * Search and counts in one call.
 *
 * The search response carries the aggregation buckets for the whole filter
 * panel, scoped to what is already applied, so this is one request rather than
 * one for results and one for counts — and the two can never disagree.
 */
async function refreshSearch() {
  try {
    // 100 is the route's ceiling, not a preference. The hits drive the search
    // highlight, so more would be nicer — but the counts, which drive the whole
    // filter panel, are aggregations over the entire match set and do not
    // depend on how many hits come back.
    const page = await graphApi.search(filters.value, { limit: 100 })
    filterCounts.value = page.facets || {}
    if (filters.value.q?.trim()) {
      searchTotal.value = page.total
      highlightIds.value = new Set(page.items.map(item => item.node_id))
    } else {
      searchTotal.value = null
      highlightIds.value = null
    }
  } catch {
    // A failed count leaves the last good numbers in place. Zeroing them
    // would claim the graph is empty, which is a worse lie than a stale one.
  }
}

let debounce: ReturnType<typeof setTimeout> | null = null
watch(filters, () => {
  if (debounce) clearTimeout(debounce)
  // Long enough to absorb a slider drag, which otherwise opens a stream per
  // pixel of travel.
  debounce = setTimeout(() => {
    void refreshSearch()
    void reload()
  }, 350)
}, { deep: true })

watch(view, (next, previous) => {
  // Coming back to the map after it was never drawn, or was abandoned.
  if (next !== 'tree' && previous === 'tree' && !stream.nodes.size) void reload()
})

// ── interactions ──────────────────────────────────────────────────────────

function onSelect(nodeId: string) {
  selectedId.value = nodeId || null
  if (nodeId) {
    track('graph.select', { node_id: nodeId, view: view.value }, 'foodscholar')
  }
}

async function onExpand(nodeId: string) {
  track('graph.expand', { node_id: nodeId }, 'foodscholar')
  await stream.expand(nodeId)
  canvasRef.value?.centerOn(nodeId)
}

/** Narrow everything to one node's subtree — the strongest filter there is,
 *  and one term lookup server-side because the ancestor chain is materialised. */
async function onScope(nodeId: string) {
  try {
    const node = await graphApi.node(nodeId)
    scopeLabel.value = (node as { label?: string }).label ?? nodeId
  } catch {
    scopeLabel.value = nodeId
  }
  filters.value = { ...filters.value, under: nodeId }
  track('graph.scope', { node_id: nodeId }, 'foodscholar')
}

function onSearchSubmit(query: string) {
  filters.value = { ...filters.value, q: query.trim() || null }
  track('graph.search', { length: query.trim().length }, 'foodscholar')
}

function onSearchPick(nodeId: string) {
  onSelect(nodeId)
  treeRef.value?.reveal(nodeId)
  // Only useful if the node is already drawn; expanding first means the map
  // has somewhere to move to.
  if (view.value !== 'tree') {
    if (stream.nodes.has(nodeId)) canvasRef.value?.centerOn(nodeId)
    else void onExpand(nodeId)
  }
}

function resetFilters() {
  scopeLabel.value = null
  searchQuery.value = ''
  filters.value = initialFilters()
}

watch(() => filters.value.under, (under) => {
  if (!under) scopeLabel.value = null
})

async function reindex() {
  reindexing.value = true
  reindexNote.value = t('graph.admin.reindexRunning')
  try {
    const result = await graphApi.reindex()
    reindexNote.value = t('graph.admin.reindexDone', {
      documents: (result as { documents?: number })?.documents ?? 0
    })
    await bootstrap()
  } catch (error) {
    reindexNote.value = (error as { data?: { detail?: string } })?.data?.detail
      || t('graph.admin.reindexFailed')
  } finally {
    reindexing.value = false
  }
}

function syncTheme() {
  isDark.value = document.documentElement.classList.contains('dark')
}

let themeObserver: MutationObserver | null = null

onMounted(() => {
  syncTheme()
  themeObserver = new MutationObserver(syncTheme)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  // Narrow screens have no room for two panes; start on the tree, which is
  // the view that works at that width.
  if (window.innerWidth < 1024) view.value = 'tree'
  void bootstrap()
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  if (debounce) clearTimeout(debounce)
})
</script>
