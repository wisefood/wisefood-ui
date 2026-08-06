import type { BreadcrumbItem } from '@nuxt/ui'

/**
 * One definition of the console breadcrumb trail.
 *
 * Every console page used to spell its own crumbs out, which drifted: the same
 * ancestor appeared as both "Asset Manager" and "Assets", sections lost their
 * icons on some pages, and long record titles overflowed on the pages that did
 * not truncate. Build the trail from here instead.
 *
 * The rule the labels follow: a crumb is named after the page it points at.
 */

/** Icon used for the crumb of the record a workspace page is editing. */
export const CONSOLE_RECORD_ICON = 'i-lucide-file-pen-line'

const CONSOLE_ROOT: BreadcrumbItem = {
  label: 'Console',
  icon: 'i-lucide-panel-top',
  to: '/console'
}

const ASSET_MANAGER: BreadcrumbItem = {
  label: 'Asset Manager',
  icon: 'i-lucide-folder-open',
  to: '/console/assets'
}

export const consoleAssetSections = {
  guides: {
    label: 'Dietary Guides',
    icon: 'i-lucide-book-open-check',
    to: '/console/assets/guides'
  },
  articles: {
    label: 'Scientific Articles',
    icon: 'i-lucide-flask-conical',
    to: '/console/assets/articles'
  },
  recipes: {
    label: 'Recipes',
    icon: 'i-lucide-utensils-crossed',
    to: '/console/assets/recipes'
  },
  textbooks: {
    label: 'Textbooks',
    icon: 'i-lucide-book-open',
    to: '/console/assets/textbooks'
  }
} satisfies Record<string, BreadcrumbItem>

export type ConsoleAssetSection = keyof typeof consoleAssetSections

/**
 * Prepend the console root and drop the link off the last crumb, since the
 * current page is never a place to navigate to.
 */
export function consoleBreadcrumb(...trail: BreadcrumbItem[]): BreadcrumbItem[] {
  const items = [CONSOLE_ROOT, ...trail]

  return items.map((item, index) =>
    index === items.length - 1 ? { ...item, to: undefined } : item
  )
}

/** Console › Asset Manager › … */
export function assetBreadcrumb(...trail: BreadcrumbItem[]): BreadcrumbItem[] {
  return consoleBreadcrumb(ASSET_MANAGER, ...trail)
}

/**
 * Console › Asset Manager › <section> › …
 *
 * `sectionTo` overrides the section link so a workspace page can return to the
 * library with its filters and paging intact.
 */
export function assetSectionBreadcrumb(
  section: ConsoleAssetSection,
  trail: BreadcrumbItem[] = [],
  sectionTo?: BreadcrumbItem['to']
): BreadcrumbItem[] {
  const sectionCrumb: BreadcrumbItem = sectionTo
    ? { ...consoleAssetSections[section], to: sectionTo }
    : { ...consoleAssetSections[section] }

  return assetBreadcrumb(sectionCrumb, ...trail)
}

/**
 * The crumb for a single record. Titles come from user data and can be long
 * enough to push the trail onto a second line, so they are cut to fit.
 */
export function recordCrumb(title: string | null | undefined, fallback: string, max = 38): BreadcrumbItem {
  const normalized = (title ?? '').trim()

  if (!normalized) {
    return { label: fallback, icon: CONSOLE_RECORD_ICON }
  }

  const label = normalized.length <= max
    ? normalized
    : `${normalized.slice(0, Math.max(0, max - 1)).trimEnd()}…`

  return { label, icon: CONSOLE_RECORD_ICON }
}
