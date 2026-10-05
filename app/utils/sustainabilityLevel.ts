/**
 * The meal-footprint band a kg CO₂e-per-serving figure falls in, as the UI
 * shows it.
 *
 * Bands: under 0.5 excellent, under 1 good, under 2 moderate, otherwise high.
 * The bar fill reads as "more = better", so the greener bands fill further.
 * The ramp is the one the cost band uses (see costCategory.ts) so the two read
 * as one system: brand green is the good end, red the dear one. The detail
 * page and the analyzer both grade from here, so a recipe lands in the same
 * band before and after it is saved.
 */
export type SustainabilityLevelKey = 'excellent' | 'good' | 'moderate' | 'high'

export type SustainabilityLevel = {
  key: SustainabilityLevelKey
  /** Bar fill, in percent. */
  pct: number
  barClass: string
  textClass: string
}

const GREEN = {
  barClass: 'from-brandg-400 to-brandg-600',
  textClass: 'text-brandg-600 dark:text-brandg-400'
}

/** The band for a per-serving footprint, or null when there is no figure. */
export const getSustainabilityLevel = (
  kgPerServing: number | null | undefined
): SustainabilityLevel | null => {
  if (typeof kgPerServing !== 'number' || !Number.isFinite(kgPerServing)) return null
  if (kgPerServing < 0.5) return { key: 'excellent', pct: 90, ...GREEN }
  if (kgPerServing < 1.0) return { key: 'good', pct: 70, ...GREEN }
  if (kgPerServing < 2.0) {
    return {
      key: 'moderate',
      pct: 45,
      barClass: 'from-amber-400 to-amber-500',
      textClass: 'text-amber-600 dark:text-amber-400'
    }
  }
  return {
    key: 'high',
    pct: 20,
    barClass: 'from-red-400 to-red-500',
    textClass: 'text-red-600 dark:text-red-400'
  }
}
