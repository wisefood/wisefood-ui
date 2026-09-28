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
