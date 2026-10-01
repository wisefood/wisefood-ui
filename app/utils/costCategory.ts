/**
 * The catalog's price band for a recipe, as the UI shows it.
 *
 * `cost_category` is a keyword the backend writes as `low` / `medium` /
 * `high`, and for most recipes it is null — the detail payload carries one
 * for a fraction of the catalog until the pending restore lands. Every
 * surface therefore renders nothing for an absent band: an "unknown" chip on
 * nearly every card would describe the backfill, not the recipe. A value
 * outside the three known bands is treated the same way rather than printed
 * verbatim.
 */
import type { CostCategory } from '~/services/recipeApi'

export type CostLevel = {
  key: CostCategory
  /** The compact marker: one coin per band, the way price guides print it. */
  symbol: string
  textClass: string
}

const COST_CATEGORIES: readonly CostCategory[] = ['low', 'medium', 'high']

// The same ramp as the sustainability bar on the detail page, so the two
// bands read as one system: brand green is the good end, red the dear one.
const COST_LEVELS: Record<CostCategory, CostLevel> = {
  low: { key: 'low', symbol: '€', textClass: 'text-brandg-600 dark:text-brandg-400' },
  medium: { key: 'medium', symbol: '€€', textClass: 'text-amber-600 dark:text-amber-400' },
  high: { key: 'high', symbol: '€€€', textClass: 'text-red-600 dark:text-red-400' }
}

/** The band a raw payload value names, or null when it names none. */
export const getCostCategory = (value: unknown): CostCategory | null => {
  if (typeof value !== 'string') return null
  const key = value.trim().toLowerCase()
  return (COST_CATEGORIES as readonly string[]).includes(key) ? key as CostCategory : null
}

/** The band with its presentation, or null — callers `v-if` on the result. */
export const getCostLevel = (value: unknown): CostLevel | null => {
  const key = getCostCategory(value)
  return key ? COST_LEVELS[key] : null
}
