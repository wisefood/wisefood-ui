<template>
  <div class="flex h-full flex-col bg-white/60 dark:bg-zinc-900/60">
    <div class="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 px-3 py-2">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {{ scopeLabel ? t('graph.tree.scopedTitle', { label: scopeLabel }) : t('graph.tree.title') }}
      </h3>
      <div class="flex items-center gap-0.5">
        <button
          type="button"
          class="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200"
          :aria-label="t('graph.tree.collapseAll')"
          :title="t('graph.tree.collapseAll')"
          @click="collapseAll"
        >
          <UIcon
            name="i-lucide-chevrons-down-up"
            class="h-3.5 w-3.5"
          />
        </button>
      </div>
    </div>

    <div
      ref="scrollRef"
      class="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5"
      role="tree"
      :aria-label="t('graph.tree.title')"
      @keydown="onKeyDown"
    >
      <div
        v-for="row in rows"
        :key="row.key"
        :ref="el => registerRow(row.key, el as HTMLElement | null)"
        role="treeitem"
        :aria-level="row.level + 1"
        :aria-expanded="row.expandable ? expanded.has(row.key) : undefined"
        :aria-selected="row.nodeId === selectedId"
        :tabindex="row.key === focusedKey ? 0 : -1"
        class="group flex cursor-pointer items-center gap-1 rounded-lg py-1 pr-2 transition-colors"
        :class="row.nodeId === selectedId
          ? 'bg-brand-50 dark:bg-brand-900/30'
          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/70'"
        :style="{ paddingLeft: `${row.level * 14 + 4}px` }"
        @click="onRowClick(row)"
        @focus="focusedKey = row.key"
      >
        <!-- Chevron. A fixed-width slot even when there is nothing to
             expand, so labels at the same level start at the same x. -->
        <button
          v-if="row.expandable"
          type="button"
          class="flex h-4 w-4 shrink-0 items-center justify-center rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          :aria-label="expanded.has(row.key) ? t('graph.tree.collapse') : t('graph.tree.expand')"
          tabindex="-1"
          @click.stop="toggle(row)"
        >
          <UIcon
            v-if="loadingKeys.has(row.key)"
            name="i-lucide-loader-circle"
            class="h-3 w-3 animate-spin"
          />
          <UIcon
            v-else
            name="i-lucide-chevron-right"
            class="h-3.5 w-3.5 transition-transform"
            :class="{ 'rotate-90': expanded.has(row.key) }"
          />
        </button>
        <span
          v-else
          class="h-4 w-4 shrink-0"
        />

        <!-- Facet groups read as headings; nodes carry their kind colour. -->
        <template v-if="row.type === 'facet'">
          <FoodscholarGraphShapeGlyph
            :facet="row.facet"
            :size="12"
            class="shrink-0 text-zinc-500 dark:text-zinc-400"
          />
          <span class="min-w-0 flex-1 truncate text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            {{ t(`graph.facets.${row.facet}`) }}
          </span>
        </template>
        <template v-else>
          <span
            class="h-2 w-2 shrink-0 rounded-sm"
            :style="{ backgroundColor: palette.kind[row.node!.kind] }"
            :title="t(`graph.kind.${row.node!.kind}`)"
          />
          <span
            class="min-w-0 flex-1 truncate text-xs"
            :class="row.nodeId === selectedId
              ? 'font-medium text-brand-700 dark:text-brand-300'
              : 'text-zinc-700 dark:text-zinc-200'"
            :title="row.label"
          >{{ row.label }}</span>
          <UIcon
            v-if="row.node!.has_card"
            name="i-lucide-file-text"
            class="h-3 w-3 shrink-0 text-emerald-500 dark:text-emerald-400"
            :title="t('graph.tree.hasCard')"
          />
          <span
            v-if="row.node!.status === 'folded'"
            class="shrink-0 rounded bg-zinc-100 dark:bg-zinc-800 px-1 text-[0.55rem] font-medium uppercase text-zinc-400 dark:text-zinc-500"
            :title="t('graph.inspector.foldedHint')"
          >{{ t('graph.inspector.folded') }}</span>
        </template>

        <span class="shrink-0 text-[0.65rem] tabular-nums text-zinc-400 dark:text-zinc-500">
          {{ formatCount(row.count) }}
        </span>
      </div>

      <div
        v-if="!rows.length && !loadingRoots"
        class="px-3 py-6 text-center"
      >
        <p class="text-xs text-zinc-500 dark:text-zinc-400">
          {{ t('graph.tree.empty') }}
        </p>
      </div>
      <div
        v-if="loadingRoots"
        class="space-y-1.5 p-2"
      >
        <div
          v-for="i in 6"
          :key="i"
          class="h-5 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import graphApi, { GRAPH_FACETS, type GraphNodeSummary } from '~/services/graphApi'
import { GRAPH_THEME_DARK, GRAPH_THEME_LIGHT } from '~/utils/graphPalette'

/**
 * The graph as a tree.
 *
 * The map answers "what is near what". This answers "where am I", which is a
 * different question and the one people ask more often. Both are first-class:
 * neither is a sidebar for the other.
 *
 * Structure only. A shelf's children and the themes on it are loaded when the
 * row opens and cached afterwards, so re-opening a branch costs nothing and
 * the whole hierarchy is never fetched.
 *
 * The filters this view honours are the *structural* ones — facet, scope,
 * and whether folded shelves show. Evidence quality and the rest describe
 * cards, and hiding a shelf because its card is unrated would misrepresent the
 * hierarchy rather than filter it; those narrow the map and the result list,
 * where they mean what they say.
 */

const props = withDefaults(defineProps<{
  selectedId?: string | null
  /** Facet names to show. Empty means all six. */
  facets?: string[]
  /** Root the tree at this node instead of at the facets. */
  under?: string | null
  scopeLabel?: string | null
  showFolded?: boolean
  isDark?: boolean
}>(), {
  selectedId: null,
  facets: () => [],
  under: null,
  scopeLabel: null,
  showFolded: false,
  isDark: false
})

const emit = defineEmits<{ select: [nodeId: string] }>()

const { t } = useI18n()

const palette = computed(() => (props.isDark ? GRAPH_THEME_DARK : GRAPH_THEME_LIGHT))

interface Row {
  /** Unique per position in the tree, not per node: a theme sits on several
   *  shelves, so the same node appears under each and needs its own row
   *  identity for expand state to make sense. */
  key: string
  type: 'facet' | 'node'
  level: number
  facet?: string
  nodeId?: string
  node?: GraphNodeSummary
  label: string
  count: number
  expandable: boolean
}

const expanded = ref(new Set<string>())
const loadingKeys = ref(new Set<string>())
const loadingRoots = ref(false)
const focusedKey = ref<string | null>(null)

/** key → the children loaded under it. Cached: re-opening is free. */
const childrenByKey = ref(new Map<string, GraphNodeSummary[]>())
/** Roots when the tree is scoped to one node rather than to the facets. */
const scopedRoots = ref<GraphNodeSummary[] | null>(null)

const scrollRef = ref<HTMLElement | null>(null)
const rowEls = new Map<string, HTMLElement>()
function registerRow(key: string, el: HTMLElement | null) {
  if (el) rowEls.set(key, el)
  else rowEls.delete(key)
}

const visibleFacets = computed(() =>
  props.facets.length ? GRAPH_FACETS.filter(f => props.facets.includes(f)) : [...GRAPH_FACETS]
)

function formatCount(value: number): string {
  if (!value) return ''
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return String(value)
}

/**
 * The flattened list of what is on screen.
 *
 * Recomputed from expand state rather than kept as a mutable tree, because a
 * tree that is both the data and the view drifts the first time a branch is
 * reloaded. Flat is also what keyboard navigation needs: next and previous
 * are array indices.
 */
const rows = computed<Row[]>(() => {
  const out: Row[] = []

  const pushNodes = (nodes: GraphNodeSummary[], level: number, parentKey: string) => {
    for (const node of nodes) {
      if (!props.showFolded && node.status === 'folded') continue
      const key = `${parentKey}/${node.node_id}`
      const expandable = node.child_count > 0 || node.theme_count > 0
      out.push({
        key,
        type: 'node',
        level,
        nodeId: node.node_id,
        node,
        label: node.label,
        count: node.chunk_count,
        expandable
      })
      if (expandable && expanded.value.has(key)) {
        pushNodes(childrenByKey.value.get(key) || [], level + 1, key)
      }
    }
  }

  if (props.under) {
    pushNodes(scopedRoots.value || [], 0, 'scope')
    return out
  }

  for (const facet of visibleFacets.value) {
    const key = `facet:${facet}`
    out.push({
      key,
      type: 'facet',
      level: 0,
      facet,
      label: facet,
      count: 0,
      expandable: true
    })
    if (expanded.value.has(key)) {
      pushNodes(childrenByKey.value.get(key) || [], 1, key)
    }
  }
  return out
})

async function loadChildren(row: Row): Promise<void> {
  if (childrenByKey.value.has(row.key)) return
  loadingKeys.value = new Set(loadingKeys.value).add(row.key)
  try {
    let items: GraphNodeSummary[]
    if (row.type === 'facet') {
      items = await graphApi.facetRoots(row.facet!, {
        status: props.showFolded ? 'active,folded' : 'active',
        limit: 200
      })
    } else {
      // Children and themes in parallel: they are independent reads and a
      // sequential pair doubles the wait on every single expand.
      const [children, themes] = await Promise.all([
        row.node!.child_count > 0
          ? graphApi.children(row.nodeId!, { limit: 200 })
          : Promise.resolve({ items: [] as GraphNodeSummary[], total: 0, facets: {} }),
        row.node!.theme_count > 0
          ? graphApi.themes(row.nodeId!, { limit: 200 })
          : Promise.resolve({ items: [] as GraphNodeSummary[], total: 0, facets: {} })
      ])
      // Shelves before themes: a shelf continues the hierarchy and a theme
      // hangs off it, so interleaving them by size would hide the structure
      // this view exists to show.
      items = [...children.items, ...themes.items]
    }
    childrenByKey.value = new Map(childrenByKey.value).set(row.key, items)
  } catch {
    childrenByKey.value = new Map(childrenByKey.value).set(row.key, [])
  } finally {
    const next = new Set(loadingKeys.value)
    next.delete(row.key)
    loadingKeys.value = next
  }
}

async function toggle(row: Row) {
  const next = new Set(expanded.value)
  if (next.has(row.key)) {
    next.delete(row.key)
    expanded.value = next
    return
  }
  next.add(row.key)
  expanded.value = next
  await loadChildren(row)
}

function onRowClick(row: Row) {
  focusedKey.value = row.key
  if (row.type === 'node') emit('select', row.nodeId!)
  else toggle(row)
}

function collapseAll() {
  expanded.value = new Set()
}

// ── keyboard, per the treeview pattern ────────────────────────────────────

function onKeyDown(event: KeyboardEvent) {
  const list = rows.value
  if (!list.length) return
  const index = Math.max(0, list.findIndex(r => r.key === focusedKey.value))
  const row = list[index]!

  const focusAt = (i: number) => {
    const target = list[Math.max(0, Math.min(list.length - 1, i))]
    if (!target) return
    focusedKey.value = target.key
    nextTick(() => rowEls.get(target.key)?.focus())
  }

  switch (event.key) {
    case 'ArrowDown':
      focusAt(index + 1)
      break
    case 'ArrowUp':
      focusAt(index - 1)
      break
    case 'ArrowRight':
      if (row.expandable && !expanded.value.has(row.key)) toggle(row)
      else focusAt(index + 1)
      break
    case 'ArrowLeft':
      if (row.expandable && expanded.value.has(row.key)) toggle(row)
      else {
        // Up to the parent, which in a flat list is the nearest preceding row
        // one level shallower.
        for (let i = index - 1; i >= 0; i--) {
          if (list[i]!.level < row.level) {
            focusAt(i)
            break
          }
        }
      }
      break
    case 'Home':
      focusAt(0)
      break
    case 'End':
      focusAt(list.length - 1)
      break
    case 'Enter': case ' ':
      onRowClick(row)
      break
    default: return
  }
  event.preventDefault()
}

// ── revealing a node the user found elsewhere ─────────────────────────────

/**
 * Open the tree to a node and scroll it into view.
 *
 * What makes a search result or a click on the map land somewhere in the
 * hierarchy rather than just changing the inspector. The breadcrumb comes back
 * in one request — the server materialised the ancestor chain — so this walks
 * a known path rather than discovering it a level at a time.
 */
async function reveal(nodeId: string) {
  try {
    const trail = await graphApi.breadcrumb(nodeId)
    const node = trail.length ? trail[0]! : await graphApi.node(nodeId) as GraphNodeSummary
    const facet = node.facet
    if (!facet && !props.under) return

    let key = props.under ? 'scope' : `facet:${facet}`
    if (!props.under) {
      const facetRow: Row = {
        key, type: 'facet', level: 0, facet, label: facet!, count: 0, expandable: true
      }
      expanded.value = new Set(expanded.value).add(key)
      await loadChildren(facetRow)
    }

    for (const crumb of trail) {
      const childKey = `${key}/${crumb.node_id}`
      const loaded = childrenByKey.value.get(key) || []
      const summary = loaded.find(n => n.node_id === crumb.node_id) || crumb
      expanded.value = new Set(expanded.value).add(childKey)
      await loadChildren({
        key: childKey, type: 'node', level: 0, nodeId: crumb.node_id,
        node: summary, label: summary.label, count: summary.chunk_count, expandable: true
      })
      key = childKey
    }

    const targetKey = `${key}/${nodeId}`
    focusedKey.value = targetKey
    await nextTick()
    rowEls.get(targetKey)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  } catch {
    // A node the tree cannot place is not an error worth interrupting for —
    // the inspector still opened, which is what the click was for.
  }
}

async function loadScopedRoots() {
  if (!props.under) {
    scopedRoots.value = null
    return
  }
  loadingRoots.value = true
  try {
    const node = await graphApi.node(props.under)
    scopedRoots.value = [node as GraphNodeSummary]
    expanded.value = new Set([`scope/${props.under}`])
    await loadChildren({
      key: `scope/${props.under}`,
      type: 'node',
      level: 0,
      nodeId: props.under,
      node: node as GraphNodeSummary,
      label: (node as GraphNodeSummary).label,
      count: (node as GraphNodeSummary).chunk_count,
      expandable: true
    })
  } catch {
    scopedRoots.value = []
  } finally {
    loadingRoots.value = false
  }
}

watch(() => props.under, loadScopedRoots, { immediate: true })

// Folded shelves change what a branch contains, so the cache is not reusable.
watch(() => props.showFolded, () => {
  childrenByKey.value = new Map()
})

defineExpose({ reveal, collapseAll })
</script>
