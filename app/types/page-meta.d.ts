/**
 * How the floating dock (accessibility, feedback, bug report) behaves on a page.
 *
 * - `default`: bottom corner.
 * - `raised`: lifted clear of a composer or action bar that owns the bottom edge.
 * - `raised-tall`: lifted clear of a full-size composer (text above its own
 *   toolbar), such as FoodScholar's docked question box.
 * - `hidden`: not shown at all.
 */
type DockMode = 'default' | 'raised' | 'raised-tall' | 'hidden'

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
