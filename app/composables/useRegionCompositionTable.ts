/**
 * The registered composition table behind the figures on screen.
 *
 * Reads the whole (small) register once and matches in the browser rather
 * than filtering the index by region. The region field is curator-typed free
 * text on a case-sensitive keyword, so a server-side match would have to
 * guess "IE" against "Ireland" exactly; a list of a dozen rows costs less
 * than getting that wrong.
 */
import { ref } from 'vue'
import fctablesApi from '~/services/fctablesApi'
import type { FCTable } from '~/services/fctablesApi'
import type { RecipeRegion } from '~/services/recipeApi'
import { findTableForRegion } from '~/utils/compositionTables'

/** Fields needed to match a region and render a link. */
const LOOKUP_FIELDS = ['urn', 'id', 'title', 'region', 'compiling_institution', 'number_of_entries']

/** Enough for every table anyone has registered, with room to spare. */
const LOOKUP_LIMIT = 100

let cached: Promise<FCTable[]> | null = null

function fetchRegister(): Promise<FCTable[]> {
  if (!cached) {
    cached = fctablesApi
      .searchTables({
        fq: ['NOT status:(deleted OR archived OR deprecated)'],
        fl: LOOKUP_FIELDS,
        fields: [],
        sort: 'updated_at desc',
        limit: LOOKUP_LIMIT
      })
      .then(result => result.tables)
      .catch((error) => {
        // Don't cache a failure: the next recipe view should try again.
        cached = null
        throw error
      })
  }
  return cached
}

export function useRegionCompositionTable() {
  const table = ref<FCTable | null>(null)

  /**
   * Resolve the table for a region.
   *
   * Failures are swallowed on purpose. This decorates an attribution line
   * that already reads correctly without it, so a catalog hiccup should cost
   * the link, not the recipe.
   */
  async function resolve(region: RecipeRegion): Promise<void> {
    try {
      table.value = findTableForRegion(await fetchRegister(), region)
    } catch {
      table.value = null
    }
  }

  return { table, resolve }
}
