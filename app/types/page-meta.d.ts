/**
 * How the floating dock (accessibility, feedback, bug report) behaves on a page.
 *
 * - `default`: bottom corner.
 * - `raised`: lifted clear of a composer or action bar that owns the bottom edge.
 * - `hidden`: not shown at all.
 */
type DockMode = 'default' | 'raised' | 'hidden'

declare module '#app' {
  interface PageMeta {
    dock?: DockMode
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    dock?: DockMode
  }
}

export {}
