<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 16 16"
    aria-hidden="true"
    focusable="false"
    class="inline-block"
  >
    <path
      :d="path"
      :fill="filled ? 'currentColor' : 'none'"
      :stroke="filled ? 'none' : 'currentColor'"
      stroke-width="1.5"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { shapeForFacet, type FacetShape } from '~/utils/graphPalette'

/**
 * A facet's shape, at text size.
 *
 * The same shape the canvas draws, so the legend, the filter list and the
 * tree all say the same thing the map does. Drawn as a path rather than a
 * font glyph or an icon name because the canvas draws paths — two
 * implementations of the same six shapes would drift the first time one
 * changed.
 */

const props = withDefaults(defineProps<{
  facet?: string | null
  shape?: FacetShape | null
  size?: number
  filled?: boolean
}>(), {
  facet: null,
  shape: null,
  size: 11,
  filled: true
})

const resolved = computed<FacetShape>(() => props.shape || shapeForFacet(props.facet))

function polygon(sides: number, r = 7): string {
  const start = -Math.PI / 2
  const points: string[] = []
  for (let i = 0; i < sides; i++) {
    const angle = start + (i * 2 * Math.PI) / sides
    points.push(`${(8 + r * Math.cos(angle)).toFixed(2)},${(8 + r * Math.sin(angle)).toFixed(2)}`)
  }
  return `M${points.join('L')}Z`
}

const path = computed(() => {
  switch (resolved.value) {
    case 'circle':
      // Two arcs: a circle has no polygon form and `<circle>` would need a
      // second element, which the fill/stroke switch above would have to
      // duplicate.
      return 'M1,8 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0'
    case 'square':
      return 'M1.8,1.8 h12.4 v12.4 h-12.4 Z'
    case 'diamond':
      return 'M8,1 L15,8 L8,15 L1,8 Z'
    case 'triangle':
      return polygon(3)
    case 'pentagon':
      return polygon(5)
    default:
      return polygon(6)
  }
})
</script>
