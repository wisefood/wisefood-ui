/**
 * Which registered composition table backs a region's nutrition figures.
 *
 * The recipe page has always named the table in prose ("Based on the Irish
 * Food Composition Table"). The tables are also registered catalog entities
 * with their own pages, and nothing connected the two, so the attribution
 * pointed nowhere.
 *
 * The connection is the table's `region`, which is free text a curator typed:
 * one table says "IE", the next "Ireland". Matching is therefore done against
 * a list of accepted spellings, case-insensitively, rather than by filtering
 * the index on a value that has to be guessed exactly right.
 */
import type { FCTable } from '~/services/fctablesApi'
import type { RecipeRegion } from '~/services/recipeApi'
import type { CatalogSelectOption } from '~/utils/consoleCatalogFields'
import { countries } from '~/utils/countries'

/** Accepted spellings per region, lower-cased at comparison time. */
export const REGION_ALIASES: Record<RecipeRegion, string[]> = {
  IE: ['ie', 'irl', 'ireland', 'irish'],
  HU: ['hu', 'hun', 'hungary', 'hungarian'],
  SI: ['si', 'svn', 'slovenia', 'slovenian'],
  EU: ['eu', 'europe', 'european', 'european union']
}

/**
 * The table registered for a region, or null.
 *
 * Null is a normal answer: a region whose table nobody has registered yet
 * keeps the plain prose attribution it has today.
 */
export function findTableForRegion(tables: FCTable[], region: RecipeRegion): FCTable | null {
  const aliases = REGION_ALIASES[region] ?? []
  if (!aliases.length) return null
  return tables.find((table) => {
    const value = String(table.region || '').trim().toLowerCase()
    return value.length > 0 && aliases.includes(value)
  }) ?? null
}

/**
 * What the console offers for a table's `region`.
 *
 * The country list alone was not enough: a composite table such as Ciqual
 * stands in for the whole Union, and the recipe pages already resolve the
 * `EU` region to a table. Without this entry a curator had to type the code
 * by hand and hope it matched an alias above.
 */
export const COMPOSITION_TABLE_REGION_OPTIONS: readonly CatalogSelectOption[] = [
  { label: '🇪🇺 European Union (EU)', value: 'EU' },
  ...countries.map(country => ({
    label: `${country.label} (${country.code})`,
    value: country.code
  }))
]
