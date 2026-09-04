/**
 * Which page an event happened on, expressed as the route pattern.
 *
 * `/recipe-wrangler/[id]`, never `/recipe-wrangler/8f2c…`. One heatmap and one
 * error group then cover every recipe page instead of ten thousand pages
 * holding one row each, and no id nobody asked for lands in an analytics
 * table.
 *
 * The resolver is injected by the plugin, which is the only place with the
 * router in hand — a listener attached to `window` has no Nuxt context to call
 * `useRouter()` from.
 */

let resolver: (() => string) | null = null

export function setRoutePatternResolver(next: () => string): void {
  resolver = next
}

/**
 * The current pattern.
 *
 * The fallback is the raw pathname, which is only reachable before the plugin
 * has run. It is honest about where the user was and it is the one case where
 * a resolved id can appear; the alternative — dropping the event — loses the
 * error that happened during boot, which is the one worth having.
 */
export function currentRoutePattern(): string {
  try {
    const pattern = resolver?.()
    if (pattern) return pattern.slice(0, 255)
  } catch {
    // Router not ready, or torn down mid-navigation.
  }
  try {
    return typeof window === 'undefined' ? '' : window.location.pathname.slice(0, 255)
  } catch {
    return ''
  }
}
