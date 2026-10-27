<template>
  <div>
    <!-- Which page to draw on. Only shown when there is a choice to make. -->
    <div
      v-if="examples.length"
      class="mb-3 flex flex-wrap items-center gap-2 text-xs"
    >
      <span class="text-gray-500 dark:text-gray-400">Shown over</span>
      <USelectMenu
        v-if="examples.length > 1"
        v-model="chosen"
        :items="examples"
        size="xs"
        class="min-w-64 font-mono"
        aria-label="Which page to draw the map over"
      />
      <span
        v-else
        class="font-mono text-gray-600 dark:text-gray-300"
      >{{ chosen }}</span>
      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-lucide-external-link"
        :to="chosen"
        target="_blank"
      >
        Open
      </UButton>
      <USwitch
        v-model="showPage"
        size="xs"
        label="Show the page"
      />
      <span
        v-if="showPage && layout === 'loading'"
        class="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500"
        role="status"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="h-3.5 w-3.5 animate-spin"
        />
        Laying out the page…
      </span>
    </div>

    <UAlert
      v-if="pageStateDiffers"
      color="info"
      variant="subtle"
      icon="i-lucide-layers"
      class="mb-3"
      title="Most of these clicks were on parts of the page that only appear while it is used"
      description="A conversation, an open plan — the page as it loads does not have them, so the
        heat is drawn on a blank page instead of over the wrong one. Read where the clicks went
        by area and in the list of controls."
    >
      <template #actions>
        <UButton
          v-if="!showPage"
          size="xs"
          color="neutral"
          variant="outline"
          @click="showPage = true"
        >
          Show the page as it loads anyway
        </UButton>
      </template>
    </UAlert>

    <!--
      The page box is a whole scrolled page, not a viewport, so at any readable
      width it is far taller than the card wants to be. The true shape is kept,
      because the positions are fractions of it and squashing them would put
      the heat in the wrong place; what is capped is how much of it is shown
      at once, and the rest scrolls.
    -->
    <div class="relative max-h-[40rem] overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white dark:border-white/15 dark:bg-zinc-900">
      <div
        ref="frame"
        class="relative mx-auto w-full overflow-hidden"
        :style="{ aspectRatio: `${frameWidth} / ${boxHeight}`, maxWidth: `${frameWidth}px` }"
        role="img"
        :aria-label="summary"
      >
        <!--
        The page itself, underneath.

        Rendered live from the same origin rather than stored as a screenshot:
        nothing to capture on a schedule, nothing to keep, and never out of
        date with the build being looked at. It is laid out at the width of
        the window the clicks were made in and stretched to the page's own
        height, so a click recorded as a fraction of somebody's page lands on
        the same thing here. The frame's name puts the app in backdrop mode:
        it records nothing and offers nothing, it only lays the page out.
      -->
        <iframe
          v-if="showPage && chosen"
          ref="iframe"
          :key="frameKey"
          :src="chosen"
          :name="frameName"
          class="pointer-events-none absolute left-0 top-0 origin-top-left border-0 bg-white"
          :style="pageStyle"
          :title="`${path} rendered behind the click map`"
          tabindex="-1"
          aria-hidden="true"
          scrolling="no"
          @load="onFrameLoad"
        />
        <div
          v-if="showPage && chosen"
          class="pointer-events-none absolute inset-0 bg-white/40 dark:bg-black/50"
        />

        <!-- Tenths of the page box, so a cell reads as a position rather than
           as a floating blob. Only when there is no page to read against. -->
        <div
          v-if="!showPage || !chosen"
          class="pointer-events-none absolute inset-0"
          :style="rulerStyle"
        />

        <!-- Two layers over the same grid: heat is softened so neighbouring
           cells read as one region, markers stay crisp so a single rage cell
           is not blurred into the background. -->
        <div
          class="pointer-events-none absolute inset-0 grid blur-[3px]"
          :style="gridStyle"
        >
          <div
            v-for="cell in cells"
            :key="`heat-${cell.x}-${cell.y}`"
            :style="{ ...place(cell), backgroundColor: heat(cell) }"
          />
        </div>

        <div
          class="absolute inset-0 grid"
          :style="gridStyle"
        >
          <div
            v-for="cell in cells"
            :key="`mark-${cell.x}-${cell.y}`"
            class="relative"
            :style="place(cell)"
            :title="describe(cell)"
          >
            <span
              v-if="cell.rage"
              class="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-fuchsia-500 ring-1 ring-white/80 dark:ring-black/50"
            />
            <span
              v-else-if="cell.dead"
              class="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400 bg-white/60 dark:bg-black/40"
            />
          </div>
        </div>

        <!-- The control a pin stands for, outlined where it really is on the
             page, while that pin is picked. -->
        <div
          v-if="activeOutline"
          class="pointer-events-none absolute rounded ring-2 ring-brand-500 ring-offset-1"
          :style="activeOutline"
        />

        <!--
        One numbered pin per control, keyed to the list below.

        Numbers, not names: the names are long and the hotspots sit on top of
        each other, so labels drawn at their own coordinates pile into an
        unreadable heap. A pin sits on the control itself when the page drawn
        underneath still has it, and at the average of its clicks otherwise.
      -->
        <div class="pointer-events-none absolute inset-0">
          <button
            v-for="(e, i) in pins"
            :key="`pin-${e.element_key}`"
            type="button"
            class="pointer-events-auto absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[0.625rem] font-semibold tabular-nums shadow ring-2 ring-white transition-transform hover:scale-125 dark:ring-black/70"
            :class="[pinTone(e), anchors[e.element_key || ''] ? '' : 'border border-dashed border-white/80']"
            :style="pinStyle(e)"
            :title="pinTitle(e, i)"
            @click="active = active === e.element_key ? null : e.element_key"
          >
            {{ i + 1 }}
          </button>
        </div>

        <div
          v-if="!cells.length"
          class="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-gray-400 dark:text-gray-500"
        >
          No positioned clicks on this page in this period.
        </div>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
      <span class="inline-flex items-center gap-2">
        Fewer
        <span
          class="h-2.5 w-24 rounded-full"
          :style="{ backgroundImage: `linear-gradient(to right, ${ramp(0.05)}, ${ramp(0.5)}, ${ramp(1)})` }"
        />
        More
      </span>
      <span class="inline-flex items-center gap-1.5">
        <span class="h-2 w-2 rotate-45 bg-fuchsia-500" />
        Rage clicks
      </span>
      <span class="inline-flex items-center gap-1.5">
        <span class="h-2 w-2 rounded-full border-2 border-cyan-400" />
        Dead clicks
      </span>
      <span
        v-if="peak"
        class="tabular-nums"
      >Busiest cell: {{ peak.toLocaleString() }} clicks</span>
    </div>

    <!-- The pins, in words. This is the part a curator acts on. -->
    <ol
      v-if="pins.length"
      class="mt-4 space-y-1"
    >
      <li
        v-for="(e, i) in pins"
        :key="`row-${e.element_key}`"
      >
        <button
          type="button"
          class="flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-white/5"
          :class="active === e.element_key ? 'bg-gray-100 dark:bg-white/5' : ''"
          :aria-pressed="active === e.element_key"
          @click="active = active === e.element_key ? null : e.element_key"
        >
          <span
            class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.625rem] font-semibold tabular-nums ring-1 ring-inset"
            :class="pinTone(e)"
          >{{ i + 1 }}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm text-gray-900 dark:text-white">
              {{ nameOf(e) }}
            </span>
            <span class="block text-xs text-gray-500 dark:text-gray-400">
              {{ countsOf(e) }}<template v-if="showPage && layout === 'ready' && !anchors[e.element_key || '']"> · not found on this page, shown where it was clicked</template>
            </span>
          </span>
        </button>
      </li>
    </ol>

    <p class="mt-3 text-xs text-gray-400 dark:text-gray-500">
      <template v-if="showPage && chosen">
        Drawn over one real page for <span class="font-mono">{{ path }}</span>, laid out
        {{ frameWidth }}px wide — {{ widthSource }}. The page is live, so a control that has since
        moved sits under its old heat; its pin follows it.
        <template v-if="layout === 'unreadable'">
          The page could not be measured, so its height is estimated and the heat may sit off its controls.
        </template>
      </template>
      <template v-else>
        Clicks are drawn as a fraction of each visitor's page, on a page-shaped canvas — no page is
        being rendered underneath.
      </template>
    </p>

    <ul class="sr-only">
      <li
        v-for="cell in hottest"
        :key="`sr-${cell.x}-${cell.y}`"
      >
        {{ describe(cell) }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { HeatmapCell } from '~/services/insightsApi'
import { backdropFrameName } from '~/utils/clickmapBackdrop'
import { controlName } from '~/utils/labels'

/**
 * The click map itself.
 *
 * Drawn as an absolutely-positioned CSS grid of `grid` x `grid` cells, one
 * element per cell the server actually returned — a busy page fills a fraction
 * of the grid, and rendering the empty remainder would cost thousands of nodes
 * to draw nothing.
 *
 * Rage and dead clicks get their own hue and their own marker rather than more
 * of the same red. They are the actionable minority and the whole reason to
 * open this page; if "very hot" and "people are angry here" looked alike, the
 * map would hide its own finding.
 *
 * WHERE THE HEAT LANDS. A click is recorded as a fraction of the visitor's
 * whole page, at the width of their window. The map used to be drawn over a
 * fixed 1280 by 1700 box, so on any page that was not exactly that tall the
 * heat sat over the wrong thing — on a long recipe page, a click on the
 * method was drawn over the ingredients — and a phone's clicks were drawn
 * over the desktop layout. The page underneath is now laid out at the width
 * the clicks were made at and stretched to its own measured height, and each
 * numbered pin is placed on the control it names by finding that control in
 * the rendered page.
 */
interface ClickedElement {
  element_key: string | null
  element_label?: string | null
  element_role?: string | null
  area?: string | null
  clicks: number
  sessions?: number
  rage: number
  dead: number
  x_pct: number | null
  y_pct: number | null
}

/** Where a control was found on the rendered page, in percent of the page box. */
interface Anchor {
  left: number
  top: number
  width: number
  height: number
}

const props = withDefaults(defineProps<{
  cells: HeatmapCell[]
  grid: number
  peak: number
  path: string
  /** The controls that were clicked, with where they sit. */
  elements?: ClickedElement[]
  /** Real addresses for this route pattern; the first is drawn behind the map. */
  examplePaths?: string[]
  /** The screen size selected: phone, tablet, desktop, or '' for all. */
  deviceType?: string
  /** The median window the clicks were made in, when the API reports it. */
  viewport?: { width: number | null, height: number | null } | null
  /** Rows of the grid; the grid is square when the API does not say. */
  rows?: number
}>(), { elements: () => [], examplePaths: () => [], deviceType: '', viewport: null, rows: 0 })

/*
 * The page's measured shape, for the parent to ask for a grid that fits it:
 * square cells, rather than columns of a page four times taller than wide.
 */
const emit = defineEmits<{ measured: [shape: { width: number, height: number }] }>()

const rowCount = computed(() => props.rows || props.grid)

/** A typical window for each screen size, when the clicks do not say. */
const DEVICE_WINDOW: Record<string, { width: number, height: number }> = {
  phone: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1280, height: 800 }
}

/** The page box drawn before the real page has been measured. */
const FALLBACK_RATIO = 1700 / 1280

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const typical = computed(() => DEVICE_WINDOW[props.deviceType] ?? DEVICE_WINDOW.desktop!)

const frameWidth = computed(() =>
  Math.round(clamp(props.viewport?.width || typical.value.width, 320, 1920))
)
const windowHeight = computed(() =>
  Math.round(clamp(props.viewport?.height || typical.value.height, 480, 1400))
)
const widthSource = computed(() =>
  props.viewport?.width
    ? 'the median window these clicks were made in'
    : `a typical ${props.deviceType || 'desktop'} window`
)

const examples = computed(() => props.examplePaths.filter(Boolean))
const chosen = ref<string>('')
const showPage = ref(true)
const active = ref<string | null>(null)

watch(
  examples,
  (next) => {
    if (!next.includes(chosen.value)) chosen.value = next[0] ?? ''
  },
  { immediate: true }
)

// ------------------------------------------------------------ the page box --

/** The rendered page's own height, once measured. */
const pageHeight = ref<number | null>(null)
/** Where each control was found, keyed by element key. */
const anchors = ref<Record<string, Anchor>>({})
/** idle → loading → ready, or unreadable when the frame cannot be measured. */
const layout = ref<'idle' | 'loading' | 'ready' | 'unreadable'>('idle')

const boxHeight = computed(() => pageHeight.value ?? Math.round(frameWidth.value * FALLBACK_RATIO))

// A new address or a new window size is a new page: reload the frame and
// forget the old measurements, or the heat would be drawn over the last one.
const frameName = computed(() => backdropFrameName(windowHeight.value))
const frameKey = computed(() => `${chosen.value}|${frameWidth.value}|${windowHeight.value}`)
watch(frameKey, () => {
  pageHeight.value = null
  anchors.value = {}
  layout.value = 'idle'
  autoHidden.value = false
})

/*
 * A page that changes as it is used cannot be drawn as it was clicked.
 *
 * FoodChat's clicks happen in a conversation and an open plan; rendered on its
 * own, the page is its empty start screen, and the heat floated over nothing
 * while seven of eight pins said "not found". When most of the pinned controls
 * are missing from the rendered page, the page is the wrong picture: it is
 * hidden, and the reader is told why and pointed at the areas and the list.
 */
const autoHidden = ref(false)
const pinnedMissing = computed(() => {
  const positioned = props.elements.filter(e => e.x_pct !== null && e.y_pct !== null).slice(0, 8)
  if (layout.value !== 'ready' || positioned.length < 3) return 0
  return positioned.filter(e => !anchors.value[e.element_key || '']).length / positioned.length
})
const pageStateDiffers = computed(() => pinnedMissing.value >= 0.5)
watch(pageStateDiffers, (differs) => {
  if (differs && !autoHidden.value) {
    autoHidden.value = true
    showPage.value = false
  }
})

/*
 * An iframe cannot be told "lay out as 1280 wide but occupy 700 pixels", so it
 * is given the real page width and scaled down with a transform. The factor
 * needs the container's actual width, which only the browser knows, so it is
 * measured.
 */
const frame = ref<HTMLElement | null>(null)
const iframe = ref<HTMLIFrameElement | null>(null)
const scale = ref(1)
let observer: ResizeObserver | null = null
let layoutRun = 0

onMounted(() => {
  if (!frame.value || typeof ResizeObserver === 'undefined') return
  observer = new ResizeObserver(([entry]) => {
    const width = entry?.contentRect.width ?? 0
    if (width > 0) scale.value = width / frameWidth.value
  })
  observer.observe(frame.value)
})

watch(frameWidth, () => {
  const width = frame.value?.getBoundingClientRect().width ?? 0
  if (width > 0) scale.value = width / frameWidth.value
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  layoutRun += 1
})

const pageStyle = computed(() => ({
  width: `${frameWidth.value}px`,
  // The window height until the page is measured: that is the window the
  // clicks were made in, so the page's first layout is the one they saw.
  height: `${pageHeight.value ?? windowHeight.value}px`,
  transform: `scale(${scale.value})`
}))

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function frameDocument(): Document | null {
  try {
    return iframe.value?.contentDocument ?? null
  } catch {
    return null
  }
}

function documentHeight(doc: Document): number {
  return Math.max(doc.documentElement?.scrollHeight ?? 0, doc.body?.scrollHeight ?? 0)
}

/**
 * Wait for the page to finish arriving, then report its height.
 *
 * The frame's `load` fires before the app has mounted, signed in or fetched
 * what it shows, and a page measured then is a header and a spinner. So the
 * height is polled until the app has rendered and the height has held still
 * for a second — with a ceiling, because a page that never settles must
 * still get a map.
 */
async function settledHeight(doc: Document, run: number): Promise<number> {
  const started = Date.now()
  let last = -1
  let steady = 0
  while (Date.now() - started < 20_000) {
    if (run !== layoutRun) return last
    const mounted = (doc.getElementById('__nuxt')?.childElementCount ?? 0) > 0
    const height = documentHeight(doc)
    steady = height === last ? steady + 1 : 0
    last = height
    if (mounted && steady >= 4 && Date.now() - started > 1200) return height
    await wait(250)
  }
  return last
}

async function onFrameLoad() {
  const run = ++layoutRun
  const doc = frameDocument()
  if (!doc) {
    layout.value = 'unreadable'
    return
  }
  layout.value = 'loading'
  try {
    let height = await settledHeight(doc, run)
    if (run !== layoutRun) return
    // Stretching the frame can move things — a lazy image comes into view, a
    // footer pinned to the window drops — so the page is measured again after
    // each stretch, a bounded number of times.
    for (let pass = 0; pass < 3 && height > 0; pass += 1) {
      pageHeight.value = Math.max(height, windowHeight.value)
      await nextTick()
      await wait(600)
      if (run !== layoutRun) return
      const next = documentHeight(doc)
      if (Math.abs(next - (pageHeight.value ?? 0)) < 4) break
      height = next
    }
    anchors.value = findControls(doc)
    layout.value = 'ready'
    if (pageHeight.value) emit('measured', { width: frameWidth.value, height: pageHeight.value })
  } catch {
    layout.value = 'unreadable'
  }
}

/**
 * Find each clicked control on the rendered page.
 *
 * The key is either a `data-track` name or a short CSS path built when the
 * click was recorded. A path can match several elements — every card's button
 * on a list page — so the one nearest where the clicks actually were wins.
 * A control that is not on this page at all (a different recipe has no third
 * step) keeps its recorded position, and its pin says so.
 */
function findControls(doc: Document): Record<string, Anchor> {
  const found: Record<string, Anchor> = {}
  const width = Math.max(doc.documentElement?.scrollWidth ?? 0, frameWidth.value)
  const height = pageHeight.value ?? documentHeight(doc)
  if (!width || !height) return found
  const scrollY = doc.defaultView?.scrollY ?? 0
  const scrollX = doc.defaultView?.scrollX ?? 0
  const escape = (value: string) =>
    typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : value.replace(/["\\]/g, '\\$&')

  for (const element of props.elements.slice(0, 30)) {
    const key = element.element_key
    if (!key) continue
    let matches: Element[] = []
    try {
      matches = Array.from(doc.querySelectorAll(`[data-track="${escape(key)}"]`))
    } catch {
      matches = []
    }
    if (!matches.length) {
      try {
        matches = Array.from(doc.querySelectorAll(key))
      } catch {
        // A key cut from the left to fit its column is not a valid selector.
        matches = []
      }
    }
    const targetX = element.x_pct !== null ? (element.x_pct / 10000) * width : null
    const targetY = element.y_pct !== null ? (element.y_pct / 10000) * height : null
    let best: { rect: DOMRect, distance: number } | null = null
    for (const match of matches) {
      // Per line box, not the bounding box: a link that wraps onto a second
      // line has a bounding box the width of the paragraph, and its centre is
      // a word nobody clicked.
      for (const rect of Array.from(match.getClientRects())) {
        if (rect.width <= 0 || rect.height <= 0) continue
        const cx = rect.left + scrollX + rect.width / 2
        const cy = rect.top + scrollY + rect.height / 2
        const distance = targetX === null || targetY === null
          ? 0
          : Math.hypot(cx - targetX, cy - targetY)
        if (!best || distance < best.distance) best = { rect, distance }
      }
    }
    if (!best) continue
    found[key] = {
      left: ((best.rect.left + scrollX) / width) * 100,
      top: ((best.rect.top + scrollY) / height) * 100,
      width: (best.rect.width / width) * 100,
      height: (best.rect.height / height) * 100
    }
  }
  return found
}

// --------------------------------------------------------------- drawing --

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.grid}, 1fr)`,
  gridTemplateRows: `repeat(${rowCount.value}, 1fr)`
}))

const rulerStyle = {
  backgroundImage:
    'linear-gradient(to right, rgba(148,163,184,0.18) 1px, transparent 1px),'
    + 'linear-gradient(to bottom, rgba(148,163,184,0.18) 1px, transparent 1px)',
  backgroundSize: '10% 10%'
}

const place = (cell: HeatmapCell) => ({
  gridColumn: String(cell.x + 1),
  gridRow: String(cell.y + 1)
})

/** The controls worth pinning: found on the page or positioned, most-clicked first. */
const pins = computed(() =>
  props.elements
    .filter(e => anchors.value[e.element_key || ''] || (e.x_pct !== null && e.y_pct !== null))
    .slice(0, 8)
)

const pinStyle = (e: ClickedElement) => {
  const anchor = anchors.value[e.element_key || '']
  if (anchor) {
    return {
      left: `${anchor.left + anchor.width / 2}%`,
      top: `${anchor.top + anchor.height / 2}%`
    }
  }
  return {
    left: `${(e.x_pct ?? 0) / 100}%`,
    top: `${(e.y_pct ?? 0) / 100}%`
  }
}

const activeOutline = computed(() => {
  const anchor = active.value ? anchors.value[active.value] : null
  if (!anchor) return null
  return {
    left: `${anchor.left}%`,
    top: `${anchor.top}%`,
    width: `${anchor.width}%`,
    height: `${anchor.height}%`
  }
})

const pinTone = (e: ClickedElement) => {
  if (e.rage) return 'bg-fuchsia-500 text-white ring-fuchsia-200 dark:ring-fuchsia-900'
  if (e.dead) return 'bg-cyan-500 text-white ring-cyan-200 dark:ring-cyan-900'
  return 'bg-gray-800 text-white ring-gray-200 dark:bg-gray-100 dark:text-gray-900 dark:ring-white/20'
}

/**
 * What to call a control.
 *
 * Its own words where the browser could read them. Where it could not — an
 * icon with no accessible name, or a click recorded before labels were
 * captured — the CSS path is all there is, and saying so plainly beats
 * printing `div.flex.items-center>button.px-3.py-1` as though it were a name.
 */
function nameOf(e: ClickedElement): string {
  return controlName(e)
}

function countsOf(e: ClickedElement): string {
  const parts = [`${e.clicks.toLocaleString()} click${e.clicks === 1 ? '' : 's'}`]
  if (e.sessions) parts.push(`${e.sessions} session${e.sessions === 1 ? '' : 's'}`)
  if (e.rage) parts.push(`${e.rage} rage`)
  if (e.dead) parts.push(`${e.dead} dead`)
  return parts.join(' · ')
}

const pinTitle = (e: ClickedElement, i: number) => `${i + 1}. ${nameOf(e)} — ${countsOf(e)}`

/*
 * Clicks are heavy-tailed: one navigation cell can hold ten times what the
 * rest of the page sees, and a linear ramp against it paints everything else
 * invisible. The square root keeps the peak the brightest cell while leaving
 * the quiet two-thirds of the page legible.
 */
const curve = (intensity: number) => Math.sqrt(Math.min(1, Math.max(0, intensity)))

// Amber through red for ordinary heat, which leaves violet and cyan free to
// mean something else. Both ends stay visible on a light and a dark ground.
const ramp = (intensity: number) => {
  const t = curve(intensity)
  return `hsla(${Math.round(45 - 45 * t)}, 92%, ${Math.round(58 - 6 * t)}%, ${(0.2 + 0.65 * t).toFixed(3)})`
}

function heat(cell: HeatmapCell): string {
  const t = curve(cell.intensity)
  if (cell.rage) return `rgba(217, 70, 239, ${(0.35 + 0.5 * t).toFixed(3)})`
  if (cell.dead) return `rgba(34, 211, 238, ${(0.3 + 0.5 * t).toFixed(3)})`
  return ramp(cell.intensity)
}

function describe(cell: HeatmapCell): string {
  const parts = [`${cell.clicks.toLocaleString()} clicks`]
  if (cell.rage) parts.push(`${cell.rage} rage`)
  if (cell.dead) parts.push(`${cell.dead} dead`)
  const x = Math.round(((cell.x + 0.5) / props.grid) * 100)
  const y = Math.round(((cell.y + 0.5) / rowCount.value) * 100)
  return `${parts.join(' · ')} — ${x}% across, ${y}% down`
}

/*
 * The spoken version of the picture. The eye reads density from colour;
 * this reads it as a sentence, then lists the handful of cells that carry
 * most of it — which is exactly what a sighted reader looks at first.
 */
const hottest = computed(() =>
  [...props.cells].sort((a, b) => b.clicks - a.clicks).slice(0, 8)
)

const summary = computed(() => {
  const total = props.cells.reduce((n, c) => n + c.clicks, 0)
  const rage = props.cells.reduce((n, c) => n + c.rage, 0)
  const dead = props.cells.reduce((n, c) => n + c.dead, 0)
  if (!total) return `Click map of ${props.path}: no clicks recorded`
  const trouble = [
    rage ? `${rage} rage click${rage === 1 ? '' : 's'}` : '',
    dead ? `${dead} dead click${dead === 1 ? '' : 's'}` : ''
  ].filter(Boolean).join(' and ')
  return `Click map of ${props.path}: ${total.toLocaleString()} clicks across `
    + `${props.cells.length} areas, busiest area ${props.peak} clicks`
    + (trouble ? `, ${trouble}` : '')
})
</script>
