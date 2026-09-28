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
      <!-- ── control bar ────────────────────────────────────────────────────
           `relative z-40`, because the bar blurs what is behind it and a
           backdrop filter makes it a stacking context of its own. Without a
           z-index that context sits below the workspace that follows it, and
           the search suggestions — whatever their own z-index — are painted
           under the tree. -->
      <div class="relative z-40 shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2 sm:px-6">
          <div class="min-w-0 flex-1 basis-64">
            <FoodscholarGraphSearchBox
              v-model="searchQuery"
              :is-dark="isDark"
              @pick="onSearchPick"
            />
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

          <span
            v-if="summary?.graph_version"
            class="hidden shrink-0 font-mono text-[0.65rem] text-zinc-500 dark:text-zinc-400 opacity-70 sm:inline"
            :title="t('graph.status.buildHint')"
          >
            {{ t('graph.status.build') }} {{ summary.graph_version.slice(0, 10) }}
          </span>
        </div>
      </div>

      <!-- ── workspace ──────────────────────────────────────────────────────
           The width of the page header rather than of the screen: a tree is a
           column of short labels, and stretched edge to edge it puts each one
           a monitor's width away from its count. -->
      <div class="mx-auto flex min-h-0 w-full max-w-7xl flex-1 sm:px-6">
        <div class="relative flex min-h-0 min-w-0 flex-1 sm:border-x border-zinc-200 dark:border-zinc-800">
          <!-- Filters, as a column rather than an overlay: a filter panel that
               covers the thing it filters hides the effect of using it. -->
          <div
            v-if="filtersOpen && !isCompact"
            class="w-60 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm"
          >
            <FoodscholarGraphFilters
              v-model="filters"
              :counts="filterCounts"
              :scope-label="scopeLabel"
              @reset="resetFilters"
            />
          </div>

          <!-- A fixed width on a wide screen, so the details beside it get the
               rest and their paragraphs keep a readable line length. -->
          <div class="min-w-0 flex-1 lg:w-[28rem] lg:flex-none xl:w-[32rem]">
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

          <!-- Details. Always there on a wide screen — prompting for a
               selection until there is one — so choosing the first node does
               not reflow the tree. -->
          <div
            v-if="!isCompact"
            class="relative flex min-w-0 flex-1"
          >
            <FoodscholarGraphInspector
              :node-id="selectedId"
              :is-dark="isDark"
              @select="onSelect"
              @scope="onScope"
              @ask="(question: string) => emit('ask', question)"
            />
          </div>
        </div>
      </div>

      <!-- Below lg there is no room beside the tree for either panel, so each
           opens over it: the filters from the left, the details from the
           right once something is selected. Slideovers rather than the bare
           overlay this was, for the backdrop, the focus trap and Escape. -->
      <USlideover
        :open="isCompact && filtersOpen"
        side="left"
        :title="t('graph.filters.title')"
        :ui="{ content: 'max-w-xs', body: 'p-0 sm:p-0 flex flex-col' }"
        @update:open="filtersOpen = $event"
      >
        <template #body>
          <FoodscholarGraphFilters
            v-model="filters"
            :counts="filterCounts"
            :scope-label="scopeLabel"
            hide-header
            @reset="resetFilters"
          />
        </template>
        <template #footer>
          <button
            v-if="activeFilterCount"
            type="button"
            class="rounded-lg px-3 py-2 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
            @click="resetFilters"
          >
            {{ t('graph.filters.clear', { count: activeFilterCount }) }}
          </button>
          <button
            type="button"
            class="ml-auto rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-600"
            @click="filtersOpen = false"
          >
            {{ t('graph.filters.done') }}
          </button>
        </template>
      </USlideover>

      <USlideover
        :open="isCompact && !!selectedId"
        side="right"
        :title="t('graph.inspector.title')"
        :ui="{ content: 'max-w-md' }"
        @update:open="(open: boolean) => { if (!open) onSelect('') }"
      >
        <template #content>
          <FoodscholarGraphInspector
            :node-id="selectedId"
            :is-dark="isDark"
            @select="onSelect"
            @scope="onScope"
            @ask="(question: string) => emit('ask', question)"
          />
        </template>
      </USlideover>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import { track } from '~/composables/useTelemetry'
import graphApi, { type GraphFilters, type GraphSummary } from '~/services/graphApi'

/**
 * The knowledge graph browser: the hierarchy as a tree, and the details of
 * whatever is selected in it.
 *
 * The tree, the details and the search box share one selection, so a node
 * found by any of them is shown by all of them. The filter set scopes the
 * tree and drives the counts in the filter panel.
 */

const emit = defineEmits<{
  /** Hand a question to the Question Answering tab. */
  ask: [question: string]
}>()

const { t } = useI18n()
const { isCompact } = useViewport()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { isAdmin } = storeToRefs(authStore)

const treeRef = ref<{ reveal: (id: string) => void } | null>(null)

const summary = ref<GraphSummary | null>(null)
const bootError = ref<string | null>(null)
const booting = ref(true)
const reindexing = ref(false)
const reindexNote = ref<string | null>(null)

const selectedId = ref<string | null>(null)
const searchQuery = ref('')
const filterCounts = ref<Record<string, Record<string, number>>>({})
const scopeLabel = ref<string | null>(null)

const filtersOpen = ref(false)
const isDark = ref(false)

/**
 * The starting filter set.
 *
 * No depth cap: the tree loads one level at a time on its own, so a cap here
 * would only make the facet counts describe the top of the graph while the
 * tree shows all of it.
 */
function initialFilters(): GraphFilters {
  return {
    q: null,
    kind: [],
    facet: [],
    status: [],
    under: null,
    depthMax: null,
    minChunks: null,
    discoveredBy: [],
    evidenceQuality: [],
    hasCard: null
  }
}

const filters = ref<GraphFilters>(initialFilters())

const showsFolded = computed(() => (filters.value.status || []).includes('folded'))

/** Only the filters the panel offers — the ones the tree honours. */
const activeFilterCount = computed(() => {
  const f = filters.value
  let n = 0
  if (f.facet?.length) n++
  if (f.under) n++
  if (showsFolded.value) n++
  return n
})

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
  // The summary is the authority on "switched off": it is the only response
  // that knows, because every other browse route reads the projected index and
  // cannot tell.
  const kind = summary.value?.enabled === false
    ? 'disabled'
    : bootError.value
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

// ── loading ───────────────────────────────────────────────────────────────

async function bootstrap() {
  booting.value = true
  bootError.value = null
  try {
    summary.value = await graphApi.summary()
    if (summary.value.built) {
      await refreshCounts()
      hydrateFromQuery()
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

/**
 * The counts behind the filter panel.
 *
 * The search response carries the aggregation buckets for the whole panel,
 * scoped to what is already applied, so the numbers answer "what would
 * narrowing further give me". Only those are read here; the buckets cover the
 * entire match set however few hits come back, hence the limit of one.
 */
async function refreshCounts() {
  try {
    const page = await graphApi.search(filters.value, { limit: 1 })
    filterCounts.value = page.facets || {}
  } catch {
    // A failed count leaves the last good numbers in place. Zeroing them
    // would claim the graph is empty, which is a worse lie than a stale one.
  }
}

let debounce: ReturnType<typeof setTimeout> | null = null
watch(filters, () => {
  if (debounce) clearTimeout(debounce)
  // Absorbs a quick run of checkbox clicks into one request.
  debounce = setTimeout(() => void refreshCounts(), 350)
}, { deep: true })

// ── interactions ──────────────────────────────────────────────────────────

function onSelect(nodeId: string) {
  selectedId.value = nodeId || null
  if (nodeId) {
    track('graph.select', { node_id: nodeId }, 'foodscholar')
  }
}

/**
 * The selection, in the URL.
 *
 * The thing people do with a graph browser is find something and send it to
 * someone. Without this, the link they send opens an empty tree and the finding
 * has to be described in prose. `replace` rather than `push`, because clicking
 * through twenty nodes should not mean pressing Back twenty times to leave.
 */
function syncQuery() {
  const query: Record<string, string> = { ...(route.query as Record<string, string>) }
  if (selectedId.value) query.node = selectedId.value
  else delete query.node
  // Links from when the page also drew a map name a view; there is one now.
  delete query.view
  router.replace({ query })
}

watch(selectedId, syncQuery)

/**
 * Open on the node a link named.
 *
 * Runs after the summary is known: a node link that arrives while the graph is
 * switched off should land on the message that says so, not on a spinner that
 * never resolves.
 */
function hydrateFromQuery() {
  if (route.query.view) syncQuery()
  const node = route.query.node
  if (typeof node !== 'string' || !node) return
  onSelect(node)
  treeRef.value?.reveal(node)
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

function onSearchPick(nodeId: string) {
  onSelect(nodeId)
  treeRef.value?.reveal(nodeId)
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
  void bootstrap()
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  if (debounce) clearTimeout(debounce)
})
</script>
