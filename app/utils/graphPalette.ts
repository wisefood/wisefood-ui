import type { GraphNodeKind } from '~/services/graphApi'

/**
 * The knowledge graph's visual encoding.
 *
 * Colour carries **kind**, not facet, and that is a decision with a reason
 * rather than a preference.
 *
 * A node-link view scatters every category against every other, so a palette
 * here has to survive all-pairs comparison, not just neighbouring-pairs. Run
 * against the all-pairs gate, six facet hues fail it — magenta against orange
 * comes out at ΔE 12.9 for normal vision, below the 15 floor, which means full-
 * colour readers cannot reliably tell two facets apart, before colour-vision
 * deficiency is even considered. No re-stepping fixes six hues in one scatter.
 *
 * Three does pass, in both modes, on every check:
 *
 *   light  worst all-pairs CVD ΔE 9.2, normal-vision ΔE 24.0
 *   dark   worst all-pairs CVD ΔE 9.4, normal-vision ΔE 20.9
 *
 * So kind takes the colour — and kind is the distinction that changes what you
 * can do with a node anyway: a shelf opens, a theme spans, a card reads.
 *
 * Facet keeps its identity two other ways, neither of them colour: a shape per
 * facet, and the facet filter, which makes "show me only health" a state of the
 * view rather than something the eye has to do. The legend names both.
 *
 * The light `card` step sits at 2.7:1 against the light surface, under 3:1. That
 * triggers the relief rule, which is why nodes are always drawn with a surface-
 * coloured ring and why labels are drawn rather than optional.
 */

export interface GraphTheme {
  surface: string
  grid: string
  edge: string
  edgeStrong: string
  text: string
  textMuted: string
  /** Drawn under every node so overlapping marks stay separable. */
  ring: string
  /** Reserved, never a categorical slot: the current selection. */
  selection: string
  /** Reserved: a search hit. */
  highlight: string
  kind: Record<GraphNodeKind, string>
}

export const GRAPH_THEME_LIGHT: GraphTheme = {
  surface: '#fbfaf9',
  grid: 'rgba(24, 24, 27, 0.05)',
  edge: 'rgba(82, 82, 91, 0.22)',
  edgeStrong: 'rgba(82, 82, 91, 0.55)',
  text: '#27272a',
  textMuted: '#71717a',
  ring: '#fbfaf9',
  selection: '#d53355',
  highlight: '#7c3aed',
  kind: {
    shelf: '#2a78d6',
    theme: '#eb6834',
    card: '#1baf7a'
  }
}

export const GRAPH_THEME_DARK: GraphTheme = {
  surface: '#18181b',
  grid: 'rgba(250, 250, 250, 0.05)',
  edge: 'rgba(161, 161, 170, 0.22)',
  edgeStrong: 'rgba(212, 212, 216, 0.6)',
  text: '#f4f4f5',
  textMuted: '#a1a1aa',
  ring: '#18181b',
  selection: '#e68599',
  highlight: '#a78bfa',
  kind: {
    shelf: '#3987e5',
    theme: '#d95926',
    card: '#199e70'
  }
}

/**
 * Facet → shape. The secondary encoding that lets six facets coexist without
 * six hues. Order is fixed: a facet keeps its shape whatever the filter does,
 * because an encoding that repaints when the series count changes is not an
 * encoding.
 */
export const FACET_SHAPES = [
  'circle',
  'square',
  'diamond',
  'triangle',
  'pentagon',
  'hexagon'
] as const

export type FacetShape = (typeof FACET_SHAPES)[number]

const FACET_ORDER = [
  'foods',
  'health',
  'sustainability',
  'dietary_patterns',
  'allergies',
  'nutrients'
]

export function shapeForFacet(facet?: string | null): FacetShape {
  const index = FACET_ORDER.indexOf(String(facet || ''))
  // An unknown facet is a circle rather than a seventh shape: inventing one
  // would claim a distinction the data does not make.
  return index >= 0 ? FACET_SHAPES[index]! : 'circle'
}

/**
 * Trace one node's outline. Canvas has no shape primitives beyond arc and
 * rect, so the polygons are drawn by hand; each is inscribed in the same
 * radius so a square and a circle of equal weight read as equal.
 */
export function traceShape(
  ctx: CanvasRenderingContext2D,
  shape: FacetShape,
  x: number,
  y: number,
  r: number
): void {
  ctx.beginPath()
  switch (shape) {
    case 'circle':
      ctx.arc(x, y, r, 0, Math.PI * 2)
      break
    case 'square': {
      // Inscribed, so its area is comparable to the circle's rather than 27%
      // larger — size means corpus here, and a shape that lies about size
      // would make the encoding wrong.
      const a = r * 0.886
      ctx.rect(x - a, y - a, a * 2, a * 2)
      break
    }
    case 'diamond':
      ctx.moveTo(x, y - r)
      ctx.lineTo(x + r, y)
      ctx.lineTo(x, y + r)
      ctx.lineTo(x - r, y)
      ctx.closePath()
      break
    default: {
      const sides = shape === 'triangle' ? 3 : shape === 'pentagon' ? 5 : 6
      // -90° so every polygon points up; without it a pentagon and a hexagon
      // at small sizes are two indistinguishable blobs.
      const start = -Math.PI / 2
      for (let i = 0; i < sides; i++) {
        const angle = start + (i * 2 * Math.PI) / sides
        const px = x + r * Math.cos(angle)
        const py = y + r * Math.sin(angle)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
    }
  }
}

/**
 * Radius from corpus size.
 *
 * Square root, because a node's *area* is what the eye reads as quantity — a
 * linear radius would make a node with ten times the evidence look a hundred
 * times more important. Floored at 5px so a node with no corpus behind it is
 * still a target you can hit, and ceilinged so one enormous shelf does not
 * become the background.
 */
export function radiusForWeight(weight: number, min = 5, max = 26): number {
  const w = Math.max(0, weight || 0)
  return Math.min(max, min + Math.sqrt(w) * 1.25)
}
