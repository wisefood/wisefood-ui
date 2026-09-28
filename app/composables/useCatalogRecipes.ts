/**
 * Recipe lists read straight from the catalog index.
 *
 * The recipe *search* endpoints answer "what did this person ask for".
 * These answer "what else belongs next to what is already on screen" — the
 * recipes inside a collection, the ones like the one being read. That is a
 * filter over the index rather than a search, and `searchCatalog` is the
 * contract for it: `fq` filters, `fl` keeps the payload to what a card draws.
 */
import { computed, ref } from 'vue'
import recipeApi from '~/services/recipeApi'
import type { RecipeSearchResult } from '~/services/recipeApi'
import {
  CATALOG_CARD_FIELDS,
  catalogDocumentsToCards,
  luceneAnyOf,
  luceneOr,
  luceneTerm
} from '~/utils/catalogRecipeCards'

const DEFAULT_PAGE_SIZE = 12

export interface CatalogRecipeListSpec {
  /** Lucene filters. The backend ANDs them. */
  fq: string[]
  /**
   * Free text. It ranks, but it also narrows: the backend puts it in `must`,
   * so a list that has to stay complete leaves it out.
   */
  q?: string
  /** `field:direction` pairs. Omit for relevance order. */
  sort?: string[]
  /** Which region's Nutri-Score the cards should show. */
  region?: string
  /** Recipe ids to drop, typically the page doing the asking. */
  exclude?: string[]
}

/**
 * A paged list of catalog recipes.
 *
 * `fetchedCount` is deliberately separate from `recipes.length`: excluded ids
 * are dropped after the page comes back, and paging off the kept count would
 * re-request whatever was dropped, forever.
 */
export function useCatalogRecipeList(pageSize: number = DEFAULT_PAGE_SIZE) {
  const recipes = ref<RecipeSearchResult[]>([])
  const total = ref(0)
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref<string | null>(null)
  const fetchedCount = ref(0)
  /** The deepest offset the index will serve; paging past it is a 4xx. */
  const maxResultWindow = ref(10000)

  let spec: CatalogRecipeListSpec | null = null
  let token = 0

  const hasMore = computed(() =>
    fetchedCount.value > 0
    && fetchedCount.value < Math.min(total.value, maxResultWindow.value))

  async function fetchPage(offset: number, mine: number): Promise<void> {
    const active = spec
    if (!active) return

    const result = await recipeApi.searchCatalog({
      ...(active.q ? { q: active.q } : {}),
      fq: active.fq,
      fl: CATALOG_CARD_FIELDS,
      ...(active.sort?.length ? { sort: active.sort } : {}),
      limit: pageSize,
      offset
    })
    if (mine !== token) return

    const excluded = new Set(active.exclude ?? [])
    const page = catalogDocumentsToCards(result.results, active.region)
      .filter(card => !excluded.has(card.recipe_id ?? ''))

    recipes.value = offset === 0 ? page : [...recipes.value, ...page]
    fetchedCount.value = offset + result.results.length
    total.value = result.total
    if (typeof result.max_result_window === 'number') {
      maxResultWindow.value = result.max_result_window
    }
  }

  /** Run a new query, replacing whatever is on screen. */
  async function load(next: CatalogRecipeListSpec): Promise<void> {
    spec = next
    const mine = ++token
    loading.value = true
    error.value = null
    recipes.value = []
    total.value = 0
    fetchedCount.value = 0
    try {
      await fetchPage(0, mine)
    } catch (caught) {
      if (mine !== token) return
      error.value = caught instanceof Error ? caught.message : 'Could not load recipes.'
    } finally {
      if (mine === token) loading.value = false
    }
  }

  /** Append the next page. A no-op while a load is already in flight. */
  async function loadMore(): Promise<void> {
    if (!spec || loading.value || loadingMore.value || !hasMore.value) return
    const mine = token
    loadingMore.value = true
    error.value = null
    try {
      await fetchPage(fetchedCount.value, mine)
    } catch (caught) {
      if (mine !== token) return
      error.value = caught instanceof Error ? caught.message : 'Could not load more recipes.'
    } finally {
      if (mine === token) loadingMore.value = false
    }
  }

  /** Re-run the current query from the first page. */
  async function retry(): Promise<void> {
    if (spec) await load(spec)
  }

  return { recipes, total, loading, loadingMore, error, hasMore, load, loadMore, retry }
}

/** What the related list was actually able to relate on. */
export type RelatedRecipesBasis = 'similar' | 'source'

/** The seed recipe's own facets, as the index spells them. */
interface RelatedSeed {
  cuisines: string[]
  courseTypes: string[]
}

/**
 * Cuisine and course only, and not by accident.
 *
 * Both are `copy_to: all_text`, which is what lets the same values be used as
 * the ranking query below without changing which recipes come back. Food
 * groups are not copied there, so relating on them would mean a filter the
 * ranking query then silently undoes.
 */
const SEED_FIELDS = ['cuisines', 'course_types']

const readStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []

/**
 * Recipes like this one.
 *
 * There is no more-like-this endpoint, so relatedness is facet overlap:
 * recipes sharing this one's cuisine, course or food groups. The seed's
 * facets are read back out of the index rather than off the recipe record,
 * because the index canonicalizes them at write time — a record saying
 * `main_dish` against an index holding `main-dish` matches nothing, and the
 * failure looks exactly like "this recipe has nothing like it".
 */
export function useRelatedRecipes() {
  const recipes = ref<RecipeSearchResult[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const basis = ref<RelatedRecipesBasis | null>(null)

  let token = 0

  async function fetchSeed(recipeId: string): Promise<RelatedSeed> {
    const result = await recipeApi.searchCatalog({
      fq: [`recipe_id:${luceneTerm(recipeId)}`],
      fl: SEED_FIELDS,
      limit: 1
    })
    const document = result.results[0] ?? {}
    return {
      cuisines: readStrings(document['cuisines']),
      courseTypes: readStrings(document['course_types'])
    }
  }

  /**
   * Load the strip for one recipe.
   *
   * `source` is the fallback basis: a recipe the annotation pass has not
   * reached has no facets to relate on, and "more from the same collection"
   * is still a true statement about it.
   */
  async function load(
    recipeId: string,
    options: { limit?: number, region?: string, source?: string | null } = {}
  ): Promise<void> {
    const limit = options.limit ?? 6
    const mine = ++token
    loading.value = true
    error.value = null
    recipes.value = []
    basis.value = null

    try {
      const seed = await fetchSeed(recipeId)
      if (mine !== token) return

      const connection = luceneOr([
        luceneAnyOf('cuisines', seed.cuisines),
        luceneAnyOf('course_types', seed.courseTypes)
      ])
      const nextBasis: RelatedRecipesBasis | null = connection
        ? 'similar'
        : (options.source ? 'source' : null)
      if (!nextBasis) return

      const facetWords = [...seed.cuisines, ...seed.courseTypes].join(' ')
      const result = await recipeApi.searchCatalog({
        fq: [connection ?? `source:${luceneTerm(String(options.source))}`],
        fl: CATALOG_CARD_FIELDS,
        /*
         * The same facet values again, as free text, purely to order the
         * results: a recipe sharing both the cuisine and the course should
         * come above one sharing only the cuisine.
         *
         * It cannot narrow the filter it ranks. `q` does sit in `must`, but
         * every value here is `copy_to: all_text`, so any recipe the filter
         * admits already contains at least one of these words. Adding a
         * facet that is not copied there would break that and quietly turn
         * this into a second filter.
         */
        ...(connection && facetWords ? { q: facetWords } : {}),
        // Source order only where there is no relevance to sort by, so the
        // same-source fallback leads with the curated corpora.
        ...(connection ? {} : { sort: ['source_rank:asc'] }),
        // One extra, because the seed matches every one of its own facets
        // and is about to be dropped.
        limit: limit + 1
      })
      if (mine !== token) return

      recipes.value = catalogDocumentsToCards(result.results, options.region)
        .filter(card => card.recipe_id !== recipeId)
        .slice(0, limit)
      basis.value = recipes.value.length ? nextBasis : null
    } catch (caught) {
      if (mine !== token) return
      error.value = caught instanceof Error ? caught.message : 'Could not load related recipes.'
    } finally {
      if (mine === token) loading.value = false
    }
  }

  return { recipes, loading, error, basis, load }
}
