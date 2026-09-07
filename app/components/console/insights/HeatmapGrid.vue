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
    </div>

    <!--
      A picture, and named as one. The density is only readable by eye, so the
      same facts are said in words: how many clicks, where the hottest spots
      are, and how many of them were somebody stuck. Without this the grid is a
      few hundred empty divs to a screen reader.
    -->
    <!--
      The page box is a scrolled page, not a viewport, so at any readable width
      it is roughly twice as tall as the card wants to be — a metre of mostly
      empty canvas that pushed everything else off the screen. The true shape
      is kept, because the positions are fractions of it and squashing them
      would put the heat in the wrong place; what is capped is how much of it
      is shown at once, and the rest scrolls.
    -->
    <div class="relative max-h-[32rem] overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white dark:border-white/15 dark:bg-zinc-900">
      <div
        ref="frame"
        class="relative w-full overflow-hidden"
        :style="{ aspectRatio: `${PAGE_W} / ${PAGE_H}` }"
        role="img"
        :aria-label="summary"
      >
        <!--
        The page itself, underneath.

        Rendered live from the same origin rather than stored as a screenshot:
        nothing to capture on a schedule, nothing to keep, and it is never out
        of date with the build being looked at. Inert and non-interactive — it
        is a backdrop, not a second copy of the app to click around in — and
        drawn at a fixed desktop width scaled to fit, so the percentages the
        clicks were recorded in land in the same places for every reader.
      -->
        <iframe
          v-if="showPage && chosen"
          :key="chosen"
          :src="chosen"
          class="pointer-events-none absolute left-0 top-0 origin-top-left border-0 bg-white"
          :style="pageStyle"
          :title="`${path} rendered behind the click map`"
          loading="lazy"
          tabindex="-1"
          aria-hidden="true"
          scrolling="no"
        />
        <div
          v-if="showPage && chosen"
          class="pointer-events-none absolute inset-0 bg-white/45 dark:bg-black/55"
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

        <!--
        One numbered pin per control, keyed to the list below.

        Numbers, not names: the names are long and the hotspots sit on top of
        each other — three of them within five percent on this platform's
        recipe page — so labels drawn at their own coordinates pile into an
        unreadable heap. A pin is two characters wide and always legible.
      -->
        <div class="pointer-events-none absolute inset-0">
          <button
            v-for="(e, i) in pins"
            :key="`pin-${e.element_key}`"
            type="button"
            class="pointer-events-auto absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums shadow ring-2 ring-white transition-transform hover:scale-125 dark:ring-black/70"
            :class="pinTone(e)"
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
        class="flex items-start gap-3 rounded-lg px-2 py-1.5 transition-colors"
        :class="active === e.element_key ? 'bg-gray-100 dark:bg-white/5' : ''"
      >
        <span
          class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums ring-1 ring-inset"
          :class="pinTone(e)"
        >{{ i + 1 }}</span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm text-gray-900 dark:text-white">
            {{ nameOf(e) }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ countsOf(e) }}
          </p>
        </div>
      </li>
    </ol>

    <p class="mt-3 text-xs text-gray-400 dark:text-gray-500">
      Clicks are pooled across every visit and every screen size as a fraction of the page box,
      then drawn over
      <template v-if="showPage && chosen">
        one real page for <span class="font-mono">{{ path }}</span>. The page is live, so a
        control that has since moved sits under its old heat.
      </template>
      <template v-else>
        a page-shaped canvas — no page is being rendered underneath.
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { HeatmapCell } from '~/services/insightsApi'

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
 */
interface ClickedElement {
  element_key: string | null
  element_label?: string | null
  element_role?: string | null
  clicks: number
  sessions?: number
  rage: number
  dead: number
  x_pct: number | null
  y_pct: number | null
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
}>(), { elements: () => [], examplePaths: () => [] })

/*
 * The backdrop is rendered at a fixed desktop page box and scaled to whatever
 * width the card gives it. Fixed on purpose: clicks are recorded as a fraction
 * of each visitor's own page box and pooled, so there is no single true size —
 * what matters is that every reader sees the same one, and that it is roughly
 * the shape of a scrolled page rather than a viewport.
 */
const PAGE_W = 1280
const PAGE_H = 1700

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

/*
 * An iframe cannot be told "lay out as 1280 wide but occupy 700 pixels", so it
 * is given the real page width and scaled down with a transform. The factor
 * needs the container's actual width, which only the browser knows, so it is
 * measured — a ratio of two lengths is not something `calc` can be relied on
 * to produce.
 */
const frame = ref<HTMLElement | null>(null)
const scale = ref(1)
let observer: ResizeObserver | null = null

onMounted(() => {
  if (!frame.value || typeof ResizeObserver === 'undefined') return
  observer = new ResizeObserver(([entry]) => {
    const width = entry?.contentRect.width ?? 0
    if (width > 0) scale.value = width / PAGE_W
  })
  observer.observe(frame.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

const pageStyle = computed(() => ({
  width: `${PAGE_W}px`,
  height: `${PAGE_H}px`,
  transform: `scale(${scale.value})`
}))

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.grid}, 1fr)`,
  gridTemplateRows: `repeat(${props.grid}, 1fr)`
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

/** The controls worth pinning: positioned, most-clicked first. */
const pins = computed(() =>
  props.elements
    .filter(e => e.x_pct !== null && e.y_pct !== null)
    .slice(0, 8)
)

const pinStyle = (e: ClickedElement) => ({
  left: `${(e.x_pct ?? 0) / 100}%`,
  top: `${(e.y_pct ?? 0) / 100}%`
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
  const label = (e.element_label || '').trim()
  if (label) return label
  const role = (e.element_role || '').trim()
  return role ? `Unnamed ${role}` : 'Unnamed control'
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
  const y = Math.round(((cell.y + 0.5) / props.grid) * 100)
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
