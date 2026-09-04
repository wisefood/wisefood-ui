<template>
  <div>
    <!--
      A picture, and named as one. The density is only readable by eye, so the
      same facts are said in words: how many clicks, where the hottest spots
      are, and how many of them were somebody stuck. Without this the grid is a
      few hundred empty divs to a screen reader.
    -->
    <div
      class="relative w-full overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 dark:border-white/15 dark:bg-zinc-900/60"
      style="aspect-ratio: 3 / 4"
      role="img"
      :aria-label="summary"
    >
      <!-- Tenths of the page box, so a cell reads as a position rather than
           as a floating blob. -->
      <div
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

      <div
        v-if="!cells.length"
        class="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-gray-400 dark:text-gray-500"
      >
        No positioned clicks on this page in this period.
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

    <p class="mt-2 text-xs text-gray-400 dark:text-gray-500">
      A density map over the route pattern <span class="font-mono">{{ path }}</span>, not a
      screenshot overlay. Positions are recorded as a fraction of the page box and pooled across
      every visit and every screen size, so the box above is a page-shaped canvas and nothing is
      drawn underneath it.
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
import { computed } from 'vue'
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
const props = defineProps<{
  cells: HeatmapCell[]
  grid: number
  peak: number
  path: string
}>()

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
