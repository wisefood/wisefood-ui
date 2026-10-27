/**
 * The page a click map is drawn over.
 *
 * The console renders the real page in a frame behind the map, which means a
 * full copy of the app boots in there: it records a visit, captures clicks and
 * vitals, offers the consent banner, starts a guided tour and replays the
 * session to Sentry — all of it filed as activity on whatever page an expert
 * happened to be looking at a map of. In this mode it does none of that and
 * only lays the page out.
 *
 * Recognised by the frame's name rather than a query parameter: a name
 * survives the app's own redirects and reloads inside the frame, and it adds
 * nothing to the route a page might read. The name also carries the height of
 * the window the clicks were made in, which the frame itself no longer has
 * once it is stretched to the full page.
 */

export const BACKDROP_FRAME_NAME = 'wf-clickmap-backdrop'

/** What the backdrop calls itself to the API, so the gateway can skip it. */
export const BACKDROP_CLIENT = 'wisefood-ui-backdrop'

let decided: boolean | null = null

export function isClickmapBackdrop(): boolean {
  if (decided !== null) return decided
  decided = false
  try {
    if (typeof window === 'undefined') return false
    // Only ever inside a frame: a tab somebody named this by accident is
    // still a real visit.
    decided = window.self !== window.top && window.name.startsWith(BACKDROP_FRAME_NAME)
  } catch {
    // A cross-origin parent throws on `top`; that is not the console.
    decided = false
  }
  return decided
}

/** The frame name for a backdrop that should lay out as a window this tall. */
export function backdropFrameName(viewportHeight: number): string {
  return `${BACKDROP_FRAME_NAME}:${Math.round(viewportHeight)}`
}

/** The window height the backdrop should lay out for, from its frame name. */
export function backdropViewportHeight(): number | null {
  if (!isClickmapBackdrop()) return null
  const value = Number(window.name.slice(BACKDROP_FRAME_NAME.length + 1))
  return Number.isFinite(value) && value > 0 ? value : null
}
