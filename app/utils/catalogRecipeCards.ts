/**
 * Catalog documents, rendered as recipe cards.
 *
 * `RecipesRecipeCard` takes a `RecipeSearchResult` — the shape the recipe
 * *search* endpoints return. Surfaces that list recipes straight out of the
 * catalog index get raw index documents instead: the same recipe, but with
 * per-region Nutri-Score keys, `course_types` where the old payload said
 * `dish_types`, and every field optional because `fl` decides what comes back.
 *
 * Both translations live here rather than being re-derived per page, because
 * getting the field list and the mapping out of step is invisible — the card
 * just renders one chip fewer.
 */
import type { RecipeCatalogDocument, RecipeSearchResult } from '~/services/recipeApi'
import { getCostCategory } from '~/utils/costCategory'

/** The UI's region codes against the index's per-region score suffixes. */
const REGION_SUFFIX: Record<string, string> = {
  EU: 'eu',
  IE: 'ie',
  HU: 'hu',
  SI: 'slovenian'
}

/**
 * The fields a card needs, and nothing else.
 *
 * A catalog document carries embeddings, nested ingredients, annotation
 * evidence and the full instruction text. A grid of twenty of them is
 * megabytes of payload to render a title, an image and three chips, so `fl`
 * is always passed and this is what it says.
 */
export const CATALOG_CARD_FIELDS: string[] = [
  'recipe_id',
  'id',
  'title',
  'image_url',
  'duration',
  'serves',
  'cost_category',
  'source',
  'source_name',
  'source_id',
  'collection_urn',
  'course_types',
  'cuisines',
  'moods',
  'flavor_profiles',
  'food_groups',
  ...Object.values(REGION_SUFFIX).map(suffix => `nutri_score_${suffix}`)
]

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null

const asNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

/**
 * One index document as a card.
 *
 * The Nutri-Score is read for the requested region only. The index stores a
 * letter ("Nutriscore_B"), not points, and `getNutriScoreGrade` already
 * accepts both — which is why `nutri_score` on the card is a string here and
 * a number on the search path.
 */
export function catalogDocumentToCard(
  document: RecipeCatalogDocument,
  region = 'EU'
): RecipeSearchResult | null {
  const recipeId = asString(document['recipe_id']) ?? asString(document['id'])
  if (!recipeId) return null

  const suffix = REGION_SUFFIX[String(region).toUpperCase()] ?? REGION_SUFFIX.EU
  const nutriScore = asString(document[`nutri_score_${suffix}`])
    // A recipe scored for one region and not another is normal — the EU table
    // is the one every recipe is profiled against, so it is the fallback.
    ?? asString(document[`nutri_score_${REGION_SUFFIX.EU}`])

  return {
    recipe_id: recipeId,
    title: asString(document['title']) ?? 'Untitled recipe',
    image_url: asString(document['image_url']),
    duration: asNumber(document['duration']),
    serves: asNumber(document['serves']),
    cost_category: getCostCategory(document['cost_category']),
    // `source_name` is the registry's display name ("Food Hero"); `source` is
    // the raw stored value ("foodhero"). The card prints it, so prefer the
    // one written for people.
    source: asString(document['source_name']) ?? asString(document['source']),
    source_id: asString(document['source_id']) ?? asString(document['collection_urn']),
    nutri_score: nutriScore,
    course_types: asStringArray(document['course_types']),
    cuisines: asStringArray(document['cuisines']),
    moods: asStringArray(document['moods']),
    flavor_profiles: asStringArray(document['flavor_profiles']),
    food_groups: asStringArray(document['food_groups'])
  }
}

/** Map a page of documents, dropping any that carry no id to link to. */
export function catalogDocumentsToCards(
  documents: RecipeCatalogDocument[],
  region = 'EU'
): RecipeSearchResult[] {
  return documents
    .map(document => catalogDocumentToCard(document, region))
    .filter((card): card is RecipeSearchResult => card !== null)
}

/**
 * A value as a Lucene phrase term.
 *
 * `fq` is parsed as `query_string`, so an unquoted value containing a hyphen,
 * a colon or a space is not a term — it is syntax. Collection URNs are full
 * of colons and cuisine slugs of hyphens, so every value goes through here.
 */
export function luceneTerm(value: string): string {
  return `"${String(value).replace(/(["\\])/g, '\\$1')}"`
}

/**
 * `field:(a OR b OR c)`, or `null` when there is nothing to match.
 *
 * Returning null rather than an empty clause matters: `field:()` is a parse
 * error, and a filter that silently matched everything would turn "recipes in
 * this collection" into "every recipe".
 */
export function luceneAnyOf(field: string, values: readonly string[]): string | null {
  const terms = [...new Set(values.filter(value => typeof value === 'string' && value.trim().length > 0))]
  if (!terms.length) return null
  return `${field}:(${terms.map(luceneTerm).join(' OR ')})`
}

/** `(a) OR (b)` over clauses that are already valid, skipping the empty ones. */
export function luceneOr(clauses: Array<string | null>): string | null {
  const present = clauses.filter((clause): clause is string => Boolean(clause))
  if (!present.length) return null
  if (present.length === 1) return present[0]!
  return present.map(clause => `(${clause})`).join(' OR ')
}
