<template>
  <div
    ref="wrapRef"
    class="relative h-full w-full overflow-hidden select-none"
    :style="{ backgroundColor: theme.surface }"
  >
    <canvas
      ref="canvasRef"
      class="block h-full w-full touch-none"
      :class="dragging ? 'cursor-grabbing' : hovered ? 'cursor-pointer' : 'cursor-grab'"
      tabindex="0"
      role="application"
      :aria-label="ariaLabel"
      :aria-describedby="`${uid}-help`"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerLeave"
      @wheel.prevent="onWheel"
      @dblclick.prevent="onDoubleClick"
      @keydown="onKeyDown"
      @focus="keyboardHint = true"
      @blur="keyboardHint = false"
    />

    <!--
      The graph as text. Not a fallback nobody reaches: a canvas is opaque to a
      screen reader and to anyone who cannot use a pointer, and the list below
      is the same nodes in the same order, reachable by tab. It is visually
      hidden rather than absent so the two never drift.
    -->
    <div
      :id="`${uid}-help`"
      class="sr-only"
    >
      {{ t('graph.canvas.help') }}
    </div>
    <ul class="sr-only">
      <li
        v-for="item in accessibleList"
        :key="item.id"
      >
        <button
          type="button"
          @click="emit('select', item.id)"
        >
          {{ item.label }} — {{ t(`graph.kind.${item.kind}`) }},
          {{ t('graph.canvas.evidenceCount', { count: item.weight }) }}
        </button>
      </li>
    </ul>

    <!-- Hover card. HTML rather than drawn, so the text is selectable,
         translatable, and styled by the same tokens as everything else. -->
    <div
      v-if="hovered && !dragging"
      class="pointer-events-none absolute z-20 max-w-xs rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 bg-white/95 dark:bg-zinc-900/95 px-3 py-2 shadow-lg backdrop-blur-sm"
      :style="tooltipStyle"
    >
      <div class="flex items-center gap-1.5">
        <span
          class="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
          :style="{ backgroundColor: theme.kind[hovered.kind] }"
        />
        <span class="text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {{ t(`graph.kind.${hovered.kind}`) }}
        </span>
      </div>
      <p class="mt-1 text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">
        {{ hovered.label }}
      </p>
      <dl class="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.7rem] text-zinc-500 dark:text-zinc-400">
        <div
          v-if="hovered.facet"
          class="flex gap-1"
        >
          <dt>{{ t('graph.inspector.facet') }}</dt>
          <dd class="font-medium text-zinc-700 dark:text-zinc-300">
            {{ t(`graph.facets.${hovered.facet}`) }}
          </dd>
        </div>
        <div class="flex gap-1">
          <dt>{{ t('graph.inspector.evidence') }}</dt>
          <dd class="font-medium text-zinc-700 dark:text-zinc-300">
            {{ hovered.weight.toLocaleString() }}
          </dd>
        </div>
        <div
          v-if="hovered.childCount"
          class="flex gap-1"
        >
          <dt>{{ t('graph.inspector.children') }}</dt>
          <dd class="font-medium text-zinc-700 dark:text-zinc-300">
            {{ hovered.childCount.toLocaleString() }}
          </dd>
        </div>
      </dl>
      <p class="mt-1.5 text-[0.65rem] italic text-zinc-400 dark:text-zinc-500">
        {{ t('graph.canvas.doubleClickToExpand') }}
      </p>
    </div>

    <!-- Viewport controls. Bottom-right, out of the way of the inspector. -->
    <div class="absolute bottom-4 right-4 z-10 flex flex-col gap-1 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 bg-white/85 dark:bg-zinc-900/85 p-1 shadow-sm backdrop-blur-sm">
      <button
        v-for="control in controls"
        :key="control.id"
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
        :aria-label="control.label"
        :title="control.label"
        @click="control.run"
      >
        <UIcon
          :name="control.icon"
          class="h-4 w-4"
        />
      </button>
    </div>

    <!-- Minimap. Only earns its place once the graph is bigger than the
         viewport — below that it shows you what you can already see. -->
    <canvas
      v-show="showMinimap"
      ref="minimapRef"
      class="absolute bottom-4 left-4 z-10 h-24 w-36 cursor-pointer rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 bg-white/85 dark:bg-zinc-900/85 shadow-sm backdrop-blur-sm"
      :aria-label="t('graph.canvas.minimap')"
      @pointerdown="onMinimapJump"
      @pointermove="onMinimapDrag"
    />

    <!-- Zoom readout, so "how far in am I" has an answer other than squinting. -->
    <div
      v-if="nodeCount > 0"
      class="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-zinc-200/70 dark:border-zinc-700/70 bg-white/80 dark:bg-zinc-900/80 px-3 py-1 text-[0.65rem] font-medium text-zinc-500 dark:text-zinc-400 shadow-sm backdrop-blur-sm"
    >
      {{ t('graph.canvas.scale', { percent: Math.round(scale * 100) }) }}
      <span
        v-if="labelsSuppressed"
        class="ml-2 text-zinc-400 dark:text-zinc-500"
      >
        · {{ t('graph.canvas.labelsHidden') }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount, nextTick, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import type { VizEdge, VizNode, GraphNodeKind } from '~/services/graphApi'
import {
  GRAPH_THEME_DARK,
  GRAPH_THEME_LIGHT,
  radiusForWeight,
  shapeForFacet,
  traceShape,
  type FacetShape,
  type GraphTheme
} from '~/utils/graphPalette'

/**
 * The graph, drawn.
 *
 * Canvas rather than SVG or a charting library, for one measurable reason: a
 * wide slice is twenty thousand nodes, and twenty thousand DOM elements is a
 * layout the browser cannot afford at any frame rate. The server already
 * computed the layout — positions arrive on the nodes, from a fixed seed — so
 * there is no simulation to run here either. This file is a renderer and a
 * hit-tester, nothing more.
 *
 * Three things keep it fast:
 *
 *   a draw list      Built once per stream revision, not per frame. Sorting,
 *                    radius and shape resolution happen there.
 *   culling          Only what intersects the viewport is drawn, which is what
 *                    makes zooming in *cheaper* rather than the same cost.
 *   a hit grid       A uniform spatial index, so hover is a lookup in one cell
 *                    rather than a scan of the draw list on every mouse move.
 */

const props = withDefaults(defineProps<{
  /** Raw, non-reactive. Watched through `revision`, never deeply. */
  nodes: Map<string, VizNode>
  edges: VizEdge[]
  revision: number
  selectedId?: string | null
  /** Search hits. Everything else dims, so a result set is visible in place
   *  rather than only in a list beside the graph. */
  highlightIds?: Set<string> | null
  streaming?: boolean
}>(), {
  selectedId: null,
  highlightIds: null,
  streaming: false
})

const emit = defineEmits<{
  select: [nodeId: string]
  expand: [nodeId: string]
  hover: [nodeId: string | null]
  viewport: [state: { scale: number }]
}>()

const { t } = useI18n()
const uid = useId()

const wrapRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const minimapRef = ref<HTMLCanvasElement | null>(null)

// ── the draw list ────────────────────────────────────────────────────────

interface DrawNode {
  id: string
  label: string
  kind: GraphNodeKind
  facet: string | null
  shape: FacetShape
  x: number
  y: number
  r: number
  weight: number
  childCount: number
  hasCard: boolean
}

let draw: DrawNode[] = []
let byId = new Map<string, DrawNode>()
let drawEdges: Array<{ a: DrawNode, b: DrawNode, kind: string }> = []
let bounds = { minX: 0, minY: 0, maxX: 1, maxY: 1 }

/** Hit grid: world space bucketed into fixed cells. */
let grid = new Map<string, DrawNode[]>()
let cellSize = 64

const nodeCount = ref(0)

/**
 * A stable position for a node the projector gave none.
 *
 * Should not happen — the projector lays out every document — but a node
 * dropped at the origin would pile every such node on top of each other and
 * look like a bug in the graph rather than a gap in the data. Hashing the id
 * scatters them deterministically, so the same node lands in the same place
 * every visit, which is the property the fixed layout seed exists to give.
 */
function fallbackPosition(id: string): { x: number, y: number } {
  let hash = 2166136261
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  const angle = ((hash >>> 0) % 3600) / 3600 * Math.PI * 2
  const radius = 400 + ((hash >>> 12) % 600)
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
}

function rebuild() {
  draw = []
  byId = new Map()

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const node of props.nodes.values()) {
    const ax = node.attrs?.x
    const ay = node.attrs?.y
    const pos = (typeof ax === 'number' && typeof ay === 'number')
      ? { x: ax, y: ay }
      : fallbackPosition(node.id)
    const item: DrawNode = {
      id: node.id,
      label: node.label || node.id,
      kind: node.kind,
      facet: node.facet ?? null,
      shape: shapeForFacet(node.facet),
      x: pos.x,
      y: pos.y,
      r: radiusForWeight(node.weight),
      weight: node.weight || 0,
      childCount: node.attrs?.child_count || 0,
      hasCard: !!node.attrs?.has_card
    }
    draw.push(item)
    byId.set(item.id, item)
    if (pos.x < minX) minX = pos.x
    if (pos.y < minY) minY = pos.y
    if (pos.x > maxX) maxX = pos.x
    if (pos.y > maxY) maxY = pos.y
  }

  // Big behind, small in front. Two reasons and they agree: a small node
  // swallowed by a large one is unclickable, and the eye reads the dense
  // middle of a cluster before its outliers.
  draw.sort((a, b) => b.r - a.r)

  if (!draw.length) {
    bounds = { minX: 0, minY: 0, maxX: 1, maxY: 1 }
  } else {
    const padX = Math.max(40, (maxX - minX) * 0.05)
    const padY = Math.max(40, (maxY - minY) * 0.05)
    bounds = { minX: minX - padX, minY: minY - padY, maxX: maxX + padX, maxY: maxY + padY }
  }

  drawEdges = []
  for (const edge of props.edges) {
    const a = byId.get(edge.source)
    const b = byId.get(edge.target)
    // An edge whose endpoints are not both drawn is skipped rather than
    // clamped. The server holds edges back until both ends have been sent, so
    // this only ever catches the tail it reported as `dropped_edges`.
    if (a && b) drawEdges.push({ a, b, kind: edge.kind })
  }

  buildGrid()
  nodeCount.value = draw.length
}

function buildGrid() {
  grid = new Map()
  if (!draw.length) return
  const span = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY)
  // Roughly a few nodes per cell whatever the graph's size, so lookup stays
  // constant as the graph grows instead of degenerating to a scan.
  cellSize = Math.max(24, span / Math.max(8, Math.sqrt(draw.length)))
  for (const node of draw) {
    const key = cellKey(node.x, node.y)
    const bucket = grid.get(key)
    if (bucket) bucket.push(node)
    else grid.set(key, [node])
  }
}

function cellKey(x: number, y: number): string {
  return `${Math.floor(x / cellSize)}:${Math.floor(y / cellSize)}`
}

// ── viewport ─────────────────────────────────────────────────────────────

const scale = ref(1)
const tx = ref(0)
const ty = ref(0)
const MIN_SCALE = 0.02
const MAX_SCALE = 8

let width = 0
let height = 0
let dpr = 1

const toScreenX = (x: number) => x * scale.value + tx.value
const toScreenY = (y: number) => y * scale.value + ty.value
const toWorldX = (x: number) => (x - tx.value) / scale.value
const toWorldY = (y: number) => (y - ty.value) / scale.value

function fit(animate = true) {
  if (!draw.length || !width || !height) return
  const bw = Math.max(1, bounds.maxX - bounds.minX)
  const bh = Math.max(1, bounds.maxY - bounds.minY)
  const target = Math.min(width / bw, height / bh)
  const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, target))
  const cx = (bounds.minX + bounds.maxX) / 2
  const cy = (bounds.minY + bounds.maxY) / 2
  setView(next, width / 2 - cx * next, height / 2 - cy * next, animate)
}

/** Centre one node without changing how far in you are. */
function centerOn(nodeId: string, animate = true) {
  const node = byId.get(nodeId)
  if (!node || !width) return
  setView(scale.value, width / 2 - node.x * scale.value, height / 2 - node.y * scale.value, animate)
}

let animation: number | null = null
const prefersReducedMotion = () =>
  typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function setView(nextScale: number, nextTx: number, nextTy: number, animate: boolean) {
  if (animation) {
    cancelAnimationFrame(animation)
    animation = null
  }
  if (!animate || prefersReducedMotion()) {
    scale.value = nextScale
    tx.value = nextTx
    ty.value = nextTy
    requestDraw()
    emit('viewport', { scale: scale.value })
    return
  }
  const from = { s: scale.value, x: tx.value, y: ty.value }
  const start = performance.now()
  const duration = 280
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / duration)
    // easeOutCubic: fast commitment, soft arrival. A linear pan reads as a
    // jump cut and loses the sense that it is the same graph.
    const e = 1 - Math.pow(1 - p, 3)
    scale.value = from.s + (nextScale - from.s) * e
    tx.value = from.x + (nextTx - from.x) * e
    ty.value = from.y + (nextTy - from.y) * e
    requestDraw()
    if (p < 1) animation = requestAnimationFrame(step)
    else {
      animation = null
      emit('viewport', { scale: scale.value })
    }
  }
  animation = requestAnimationFrame(step)
}

function zoomBy(factor: number, originX?: number, originY?: number) {
  const ox = originX ?? width / 2
  const oy = originY ?? height / 2
  const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale.value * factor))
  if (next === scale.value) return
  // Keep the point under the cursor fixed — the difference between zooming
  // toward what you are looking at and zooming toward the middle.
  const wx = toWorldX(ox)
  const wy = toWorldY(oy)
  setView(next, ox - wx * next, oy - wy * next, false)
}

// ── drawing ──────────────────────────────────────────────────────────────

const isDark = ref(false)
const theme = computed<GraphTheme>(() => (isDark.value ? GRAPH_THEME_DARK : GRAPH_THEME_LIGHT))

const hovered = shallowRef<DrawNode | null>(null)
const hoverScreen = ref({ x: 0, y: 0 })
const dragging = ref(false)
const keyboardHint = ref(false)
const labelsSuppressed = ref(false)

let pending = false
function requestDraw() {
  if (pending) return
  pending = true
  requestAnimationFrame(() => {
    pending = false
    render()
  })
}

/** Edges are the expensive part; past this many on screen they go translucent
 *  and hairline rather than being drawn as structure. */
const EDGE_DETAIL_LIMIT = 6000
/** Labels cost a text measure each. Past this many candidates, only the
 *  biggest get one — which is also the only readable outcome. */
const LABEL_LIMIT = 160

function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const th = theme.value
  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = th.surface
  ctx.fillRect(0, 0, width, height)

  const highlight = props.highlightIds
  const dimming = !!highlight && highlight.size > 0
  const selected = props.selectedId ? byId.get(props.selectedId) : null

  // Neighbours of the selection, so selecting a node explains its position
  // instead of just marking it.
  const related = new Set<string>()
  if (selected) {
    related.add(selected.id)
    for (const edge of drawEdges) {
      if (edge.a.id === selected.id) related.add(edge.b.id)
      else if (edge.b.id === selected.id) related.add(edge.a.id)
    }
  }

  const margin = 64
  const visible = (n: DrawNode) => {
    const sx = toScreenX(n.x)
    const sy = toScreenY(n.y)
    return sx > -margin && sx < width + margin && sy > -margin && sy < height + margin
  }

  // ── edges ──
  const detailed = drawEdges.length <= EDGE_DETAIL_LIMIT
  ctx.lineWidth = detailed ? 1.25 : 0.6
  ctx.strokeStyle = th.edge
  ctx.globalAlpha = detailed ? 1 : 0.5
  ctx.beginPath()
  for (const edge of drawEdges) {
    if (!visible(edge.a) && !visible(edge.b)) continue
    if (selected && (related.has(edge.a.id) || related.has(edge.b.id))) continue
    ctx.moveTo(toScreenX(edge.a.x), toScreenY(edge.a.y))
    ctx.lineTo(toScreenX(edge.b.x), toScreenY(edge.b.y))
  }
  ctx.stroke()

  // Edges touching the selection, drawn again on top and opaque.
  if (selected) {
    ctx.globalAlpha = 1
    ctx.strokeStyle = th.edgeStrong
    ctx.lineWidth = 1.75
    ctx.beginPath()
    for (const edge of drawEdges) {
      if (edge.a.id !== selected.id && edge.b.id !== selected.id) continue
      ctx.moveTo(toScreenX(edge.a.x), toScreenY(edge.a.y))
      ctx.lineTo(toScreenX(edge.b.x), toScreenY(edge.b.y))
    }
    ctx.stroke()
  }

  // ── nodes ──
  const labelCandidates: DrawNode[] = []
  for (const node of draw) {
    if (!visible(node)) continue
    const sx = toScreenX(node.x)
    const sy = toScreenY(node.y)
    const sr = Math.max(2.5, node.r * Math.sqrt(scale.value))

    let alpha = 1
    if (dimming && !highlight!.has(node.id)) alpha = 0.12
    else if (selected && !related.has(node.id)) alpha = 0.22

    ctx.globalAlpha = alpha
    traceShape(ctx, node.shape, sx, sy, sr)
    ctx.fillStyle = th.kind[node.kind]
    ctx.fill()

    // The surface ring. Not decoration: the light `card` step sits under 3:1
    // against the surface, and overlapping marks of the same hue merge into
    // one blob without it.
    if (sr > 3.5) {
      ctx.lineWidth = Math.min(2, sr * 0.22)
      ctx.strokeStyle = th.ring
      ctx.stroke()
    }

    if (dimming && highlight!.has(node.id)) {
      ctx.globalAlpha = 1
      ctx.lineWidth = 2
      ctx.strokeStyle = th.highlight
      traceShape(ctx, node.shape, sx, sy, sr + 3)
      ctx.stroke()
    }

    if (sr >= 9 && alpha > 0.5) labelCandidates.push(node)
  }

  // ── selection and hover rings ──
  ctx.globalAlpha = 1
  for (const [node, color, width_] of [
    [selected, th.selection, 2.5],
    [hovered.value, th.text, 1.5]
  ] as Array<[DrawNode | null, string, number]>) {
    if (!node || !visible(node)) continue
    const sr = Math.max(2.5, node.r * Math.sqrt(scale.value))
    ctx.lineWidth = width_
    ctx.strokeStyle = color
    traceShape(ctx, node.shape, toScreenX(node.x), toScreenY(node.y), sr + 5)
    ctx.stroke()
  }

  // ── labels ──
  labelsSuppressed.value = labelCandidates.length > LABEL_LIMIT
  labelCandidates.sort((a, b) => b.r - a.r)
  const shown = labelCandidates.slice(0, LABEL_LIMIT)

  ctx.font = '500 12px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const occupied: Array<[number, number, number, number]> = []
  for (const node of shown) {
    const sr = Math.max(2.5, node.r * Math.sqrt(scale.value))
    const sx = toScreenX(node.x)
    const sy = toScreenY(node.y) + sr + 4
    const text = node.label.length > 34 ? `${node.label.slice(0, 33)}…` : node.label
    const w = ctx.measureText(text).width
    const box: [number, number, number, number] = [sx - w / 2 - 2, sy - 2, w + 4, 16]
    // Greedy, biggest first. A label that would sit on another is dropped
    // rather than nudged: nudged labels stop pointing at their own node.
    if (occupied.some(o => !(box[0] > o[0] + o[2] || box[0] + box[2] < o[0] || box[1] > o[1] + o[3] || box[1] + box[3] < o[1]))) {
      continue
    }
    occupied.push(box)

    // Drawn twice: a surface-coloured halo under the ink, so a label crossing
    // an edge or another node stays readable without a solid plate behind it.
    ctx.lineWidth = 3
    ctx.strokeStyle = th.surface
    ctx.strokeText(text, sx, sy)
    ctx.fillStyle = node.id === props.selectedId ? th.selection : th.text
    ctx.fillText(text, sx, sy)
  }

  ctx.restore()
  renderMinimap()
}

// ── minimap ──────────────────────────────────────────────────────────────

const showMinimap = computed(() => nodeCount.value > 200)

function renderMinimap() {
  const canvas = minimapRef.value
  if (!canvas || !showMinimap.value) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const mw = canvas.width
  const mh = canvas.height
  const th = theme.value
  ctx.clearRect(0, 0, mw, mh)

  const bw = Math.max(1, bounds.maxX - bounds.minX)
  const bh = Math.max(1, bounds.maxY - bounds.minY)
  const k = Math.min(mw / bw, mh / bh)
  const ox = (mw - bw * k) / 2 - bounds.minX * k
  const oy = (mh - bh * k) / 2 - bounds.minY * k

  // One pixel per node, biggest last so the dense parts stay visible. Every
  // node, not the culled set — the whole point is showing what is off screen.
  for (const node of draw) {
    ctx.fillStyle = th.kind[node.kind]
    ctx.globalAlpha = 0.65
    ctx.fillRect(node.x * k + ox, node.y * k + oy, 1.5, 1.5)
  }

  ctx.globalAlpha = 1
  ctx.strokeStyle = th.selection
  ctx.lineWidth = 1
  ctx.strokeRect(
    toWorldX(0) * k + ox,
    toWorldY(0) * k + oy,
    (width / scale.value) * k,
    (height / scale.value) * k
  )
}

function minimapToWorld(event: PointerEvent) {
  const canvas = minimapRef.value!
  const rect = canvas.getBoundingClientRect()
  const bw = Math.max(1, bounds.maxX - bounds.minX)
  const bh = Math.max(1, bounds.maxY - bounds.minY)
  const k = Math.min(canvas.width / bw, canvas.height / bh)
  const ox = (canvas.width - bw * k) / 2 - bounds.minX * k
  const oy = (canvas.height - bh * k) / 2 - bounds.minY * k
  const mx = (event.clientX - rect.left) * (canvas.width / rect.width)
  const my = (event.clientY - rect.top) * (canvas.height / rect.height)
  return { x: (mx - ox) / k, y: (my - oy) / k }
}

function onMinimapJump(event: PointerEvent) {
  const { x, y } = minimapToWorld(event)
  setView(scale.value, width / 2 - x * scale.value, height / 2 - y * scale.value, true)
  ;(event.target as HTMLElement).setPointerCapture?.(event.pointerId)
}

function onMinimapDrag(event: PointerEvent) {
  if (!event.buttons) return
  const { x, y } = minimapToWorld(event)
  setView(scale.value, width / 2 - x * scale.value, height / 2 - y * scale.value, false)
}

// ── hit testing ──────────────────────────────────────────────────────────

function nodeAt(screenX: number, screenY: number): DrawNode | null {
  if (!draw.length) return null
  const wx = toWorldX(screenX)
  const wy = toWorldY(screenY)
  const cx = Math.floor(wx / cellSize)
  const cy = Math.floor(wy / cellSize)

  let best: DrawNode | null = null
  let bestDist = Infinity
  // The nine cells around the point: a node whose centre is in a neighbouring
  // cell can still cover this one.
  for (let gx = cx - 1; gx <= cx + 1; gx++) {
    for (let gy = cy - 1; gy <= cy + 1; gy++) {
      const bucket = grid.get(`${gx}:${gy}`)
      if (!bucket) continue
      for (const node of bucket) {
        const sr = Math.max(2.5, node.r * Math.sqrt(scale.value))
        // A generous target: the mark is what you see, but a 3px dot is not
        // something anyone can click, and the nearest-wins tiebreak keeps the
        // slack from stealing clicks from a neighbour.
        const reach = Math.max(sr, 8)
        const dx = toScreenX(node.x) - screenX
        const dy = toScreenY(node.y) - screenY
        const dist = Math.hypot(dx, dy)
        if (dist <= reach && dist < bestDist) {
          best = node
          bestDist = dist
        }
      }
    }
  }
  return best
}

// ── pointer ──────────────────────────────────────────────────────────────

let pointerStart: { x: number, y: number, tx: number, ty: number } | null = null
let moved = 0

function localPoint(event: PointerEvent) {
  const rect = canvasRef.value!.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

function onPointerDown(event: PointerEvent) {
  const { x, y } = localPoint(event)
  pointerStart = { x, y, tx: tx.value, ty: ty.value }
  moved = 0
  canvasRef.value?.setPointerCapture(event.pointerId)
  canvasRef.value?.focus({ preventScroll: true })
}

function onPointerMove(event: PointerEvent) {
  const { x, y } = localPoint(event)
  if (pointerStart && event.buttons) {
    const dx = x - pointerStart.x
    const dy = y - pointerStart.y
    moved = Math.max(moved, Math.hypot(dx, dy))
    // A few pixels of slack: a click with a shaky hand is still a click, and
    // treating it as a drag means nodes that cannot be selected on a trackpad.
    if (moved > 3) {
      dragging.value = true
      tx.value = pointerStart.tx + dx
      ty.value = pointerStart.ty + dy
      requestDraw()
    }
    return
  }
  const hit = nodeAt(x, y)
  if (hit?.id !== hovered.value?.id) {
    hovered.value = hit
    emit('hover', hit?.id ?? null)
    requestDraw()
  }
  hoverScreen.value = { x, y }
}

function onPointerUp(event: PointerEvent) {
  canvasRef.value?.releasePointerCapture?.(event.pointerId)
  const wasDrag = dragging.value
  dragging.value = false
  if (!pointerStart) return
  const { x, y } = localPoint(event)
  pointerStart = null
  if (wasDrag || moved > 3) {
    emit('viewport', { scale: scale.value })
    return
  }
  const hit = nodeAt(x, y)
  // A click on empty canvas clears the selection. Deselecting should not
  // require finding a specific control.
  emit('select', hit?.id ?? '')
}

function onPointerLeave() {
  if (hovered.value) {
    hovered.value = null
    emit('hover', null)
    requestDraw()
  }
}

function onWheel(event: WheelEvent) {
  const { left, top } = canvasRef.value!.getBoundingClientRect()
  // deltaMode 1 is lines, not pixels — Firefox reports it, and treating the
  // two the same makes one browser zoom about forty times faster.
  const unit = event.deltaMode === 1 ? 16 : 1
  zoomBy(Math.exp(-event.deltaY * unit * 0.0015), event.clientX - left, event.clientY - top)
}

function onDoubleClick(event: MouseEvent) {
  const rect = canvasRef.value!.getBoundingClientRect()
  const hit = nodeAt(event.clientX - rect.left, event.clientY - rect.top)
  if (hit) emit('expand', hit.id)
  else zoomBy(1.6, event.clientX - rect.left, event.clientY - rect.top)
}

function onKeyDown(event: KeyboardEvent) {
  const step = event.shiftKey ? 200 : 60
  switch (event.key) {
    case 'ArrowLeft':
      tx.value += step
      break
    case 'ArrowRight':
      tx.value -= step
      break
    case 'ArrowUp':
      ty.value += step
      break
    case 'ArrowDown':
      ty.value -= step
      break
    case '+':
    case '=':
      zoomBy(1.25)
      break
    case '-':
    case '_':
      zoomBy(0.8)
      break
    case '0':
      fit()
      return
    case 'Enter':
      if (props.selectedId) emit('expand', props.selectedId)
      return
    case 'Escape':
      emit('select', '')
      return
    default: return
  }
  event.preventDefault()
  requestDraw()
}

// ── layout plumbing ──────────────────────────────────────────────────────

const tooltipStyle = computed(() => {
  // Flip the card before it runs off the edge rather than letting it clip.
  const flipX = hoverScreen.value.x > width - 260
  const flipY = hoverScreen.value.y > height - 150
  return {
    left: `${hoverScreen.value.x + (flipX ? -12 : 16)}px`,
    top: `${hoverScreen.value.y + (flipY ? -12 : 16)}px`,
    transform: `translate(${flipX ? '-100%' : '0'}, ${flipY ? '-100%' : '0'})`
  }
})

const ariaLabel = computed(() =>
  t('graph.canvas.ariaLabel', { count: nodeCount.value })
)

/** The first slice of the graph as focusable text. Capped: a thousand buttons
 *  is not navigable either, and the search box is the real way in. */
const accessibleList = computed(() => {
  void props.revision
  return draw.slice(0, 50)
})

const controls = computed(() => [
  { id: 'in', icon: 'i-lucide-zoom-in', label: t('graph.canvas.zoomIn'), run: () => zoomBy(1.3) },
  { id: 'out', icon: 'i-lucide-zoom-out', label: t('graph.canvas.zoomOut'), run: () => zoomBy(0.77) },
  { id: 'fit', icon: 'i-lucide-maximize', label: t('graph.canvas.fit'), run: () => fit() }
])

let resizeObserver: ResizeObserver | null = null
let themeObserver: MutationObserver | null = null

function resize() {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  if (!wrap || !canvas) return
  const rect = wrap.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  width = rect.width
  height = rect.height
  // Capped at 2: a 3x display doubles the pixel count again for a difference
  // nobody can see on a scatter of 8px marks, and pays for it in fill rate.
  dpr = Math.min(2, window.devicePixelRatio || 1)
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  const minimap = minimapRef.value
  if (minimap) {
    minimap.width = 144 * dpr
    minimap.height = 96 * dpr
  }
  requestDraw()
}

function syncTheme() {
  isDark.value = document.documentElement.classList.contains('dark')
  requestDraw()
}

onMounted(async () => {
  await nextTick()
  syncTheme()
  resize()
  resizeObserver = new ResizeObserver(resize)
  if (wrapRef.value) resizeObserver.observe(wrapRef.value)
  // Nuxt UI toggles `.dark` on <html>. Watching the class is how the canvas
  // learns about it — there is no CSS cascade reaching into a bitmap.
  themeObserver = new MutationObserver(syncTheme)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  rebuild()
  fit(false)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
  if (animation) cancelAnimationFrame(animation)
})

let hadNodes = false
watch(() => props.revision, () => {
  rebuild()
  // Fit once, when the graph first has something in it. Refitting on every
  // frame of a stream would yank the view out from under anyone who started
  // navigating before it finished.
  if (!hadNodes && draw.length) {
    hadNodes = true
    fit(false)
  }
  if (!draw.length) hadNodes = false
  requestDraw()
})

watch(() => props.selectedId, () => requestDraw())
watch(() => props.highlightIds, () => requestDraw())

defineExpose({ fit, centerOn, zoomBy })
</script>
