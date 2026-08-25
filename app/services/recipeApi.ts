import { useAuthStore } from '~/stores/auth'
import { getRecipeWranglerMode, getWisefoodApiUrl, getWisefoodRestApiUrl } from '~/utils/runtimeConfig'

// ============================================================================
// Timeout Configuration
// ============================================================================
const DEFAULT_TIMEOUT = 30000 // 30 seconds
const SEARCH_TIMEOUT = 60000 // 60 seconds for search operations (can be slow)
const PROFILE_TIMEOUT = 120000 // 120 seconds for profiling pipeline
const BULK_STATUS_TIMEOUT = 60000 // by-query disable returns 202 after ID resolution; the work itself runs server-side

// ============================================================================
// Type Definitions - Based on API Response Schema
// ============================================================================

export interface RecipeIngredient {
  name: string
  measurement: string
}

export interface RecipeNutrient {
  nutrient_name?: string
  nutrient_code?: string
  amount_per_serving?: number | string | null
  unit_name?: string | null
}

export interface RecipeNutritionProfilingDetail {
  ingredient?: string
  measurement_raw?: string | null
  parsed_quantity?: string | null
  parsed_unit?: string | null
  weight_g?: number | string | null
  weight_source?: string | null
  weight_match?: string | null
  matched_nutritional_ingredient?: string | null
  nutrition_source?: string | null
  nutrition_match_source?: string | null
  canonical_food_id?: string | null
  similarity?: number | string | null
}

export type RecipeStatus = 'active' | 'disabled'

export interface Recipe {
  recipe_id: string
  title: string
  source?: string | null
  source_id?: string | null
  expert_recipe?: boolean | null
  status?: RecipeStatus | string | null
  disabled_reason?: string | null
  region?: string | null
  image_url: string | null
  tags?: Array<string | null> | null
  dish_types?: string[] | null
  /**
   * Annotation facets, mirroring `RecipeSearchResult`.
   *
   * These are Elasticsearch-owned fields (`ES_OWNED_FIELDS` in the backend's
   * catalog projection); the recipe detail record itself is read from Neo4j,
   * which has never held them. They are optional here because the detail
   * endpoint only carries them once it enriches from the catalog index — every
   * surface that renders them must degrade to showing nothing.
   */
  cuisines?: string[] | null
  moods?: string[] | null
  flavor_profiles?: string[] | null
  food_groups?: string[] | null
  allergens?: Array<string | null> | null
  ingredients: RecipeIngredient[]
  instructions: string[]
  duration: number | null
  serves: number | null
  total_kcal_per_serving: number | null
  total_protein_g_per_serving: number | null
  total_carbs_g_per_serving: number | null
  total_fat_g_per_serving: number | null
  total_fiber_g_per_serving: number | null
  total_sugar_g_per_serving: number | null
  total_sodium_mg_per_serving: number | null
  total_cholesterol_mg_per_serving: number | null
  total_nutrients?: Record<string, unknown> | null
  total_nutrients_per_serving?: Record<string, unknown> | null
  nutri_score: number | null
  nutri_score_raw?: string | null
  /** Authoritative letter grade from the backend (e.g. "Nutriscore_B" or "B").
   *  Prefer this over the numeric nutri_score, whose scale is ambiguous. */
  nutri_score_label?: string | null
  nutri_score_breakdown?: Record<string, unknown> | null
  nutrition_source?: string | null
  /** Carbon footprint: kg CO2e for the whole recipe / per serving / per kg of food. */
  total_sustainability?: number | null
  total_sustainability_per_serving?: number | null
  sustainability_per_kg?: number | null
  nutrients?: RecipeNutrient[] | null
  nutrition_profiling_details?: RecipeNutritionProfilingDetail[] | null
  nutrition_profiling_debug?: Record<string, unknown> | null
  /** "pending" while the backend is still computing the nutrition profile
   *  in the background; nutrition fields are null until it completes. */
  profiling_status?: string | null
}

export interface RecipeSearchResult {
  recipe_id?: string
  id?: string
  title: string
  source?: string | null
  source_id?: string | null
  image_url: string | null
  duration?: number | null
  serves?: number | null
  nutri_score?: number | null
  nutri_score_color?: string | null
  sust_score?: number | null
  expert_recipe?: boolean | null
  status?: RecipeStatus | string | null
  dish_types?: string[] | null
  course_types?: string[] | null
  /**
   * Annotation facets carried on the card, so a result can show what matched.
   * Absent or empty on recipes the annotation pass has not reached.
   */
  cuisines?: string[] | null
  moods?: string[] | null
  flavor_profiles?: string[] | null
  food_groups?: string[] | null
}

export interface RecipeSearchParams {
  question: string
  exclude_allergens?: string[]
  /** Member dietary groups (e.g. ['vegan']) — soft ranking boosts, never hard filters. */
  diet_tags?: string[]
  /** Soft preference boosts — reorder results, never filter them out. */
  preferred_ingredients?: string[]
  /** Region whose nutri-score the result cards carry: US, IE, HU. */
  region?: string
  /**
   * Sidebar facet selections, sent alongside the question.
   *
   * Hard filters, and the backend gives them precedence over anything it infers
   * from the question text. Sending them is what makes the filter panel work
   * while a search term is active — previously the question path dropped every
   * filter but allergens.
   */
  dish_types?: RecipeDishType[]
  sources?: RecipeSource[]
  cuisines?: string[]
  moods?: string[]
  flavor_profiles?: string[]
  food_groups?: string[]
  /**
   * Diet groups the recipe must carry. Distinct from `diet_tags` above, which
   * are the member's profile preferences and only reorder results.
   */
  require_diet_tags?: string[]
  /**
   * Paging. Accepted by the question path exactly as by `param_search`; omit
   * both to take the backend's own default page size.
   */
  limit?: number
  offset?: number
}

export type RecipeParamSortBy = 'title_asc' | 'title_desc' | 'time_asc' | 'time_desc' | 'random'
export type RecipeSource = 'healthyfoods' | 'foodhero' | 'myplate' | 'irish_safefood' | 'irish_heart_foundation' | 'supervalu' | 'hungarian' | 'best_of_hungary' | 'the_hungary_soul' | 'slovenian' | 'slovenian_kitchen'

// The regions the backend accepts as a nutrition-source selector. IE/HU/SI
// double as ISO country codes, so a household's country maps straight through;
// EU is the global composition table and therefore the fallback for every
// country without one of its own.
//
// 'US' is deliberately absent. The v4 regional API dropped USDA as a nutrition
// source (it survives only for portion weights, server-side), so sending 'US'
// is now a 422 rather than the silent fallback it used to be.
export const RECIPE_REGIONS = ['IE', 'HU', 'EU', 'SI'] as const
export type RecipeRegion = typeof RECIPE_REGIONS[number]

export const resolveRecipeRegion = (raw: string | null | undefined): RecipeRegion => {
  const upper = String(raw || '').trim().toUpperCase() as RecipeRegion
  return RECIPE_REGIONS.includes(upper) ? upper : 'EU'
}
// Backend-owned taxonomy — treat as an open string set so newly emitted
// values (e.g. "side-dish") don't require a frontend type bump.
export type RecipeDishType = string

export interface RecipeParamSearchParams {
  include_ingredients?: string[]
  exclude_ingredients?: string[]
  exclude_allergens?: string[]
  diet_tags?: string[]
  sources?: RecipeSource[]
  dish_types?: RecipeDishType[]
  /**
   * Annotation facets. Closed vocabularies owned by the backend
   * (`catalog/vocabularies.py`); the UI only ever sends values it received in
   * a facet, so it cannot ask for one the corpus does not classify.
   */
  cuisines?: string[]
  moods?: string[]
  flavor_profiles?: string[]
  food_groups?: string[]
  max_duration_minutes?: number
  limit?: number
  offset?: number
  sort_by?: RecipeParamSortBy
  include_facets?: boolean
  /** Console/admin only — surfaces disabled (soft-deleted) recipes. */
  include_disabled?: boolean
}

export interface RecipeStatusResult {
  status: RecipeStatus
  requested: number
  updated: number
  recipe_ids: string[]
  es_sync: Record<string, Record<string, number>>
  message: string
}

/** Slim recipe card returned by the batch `/details` endpoint. */
export interface RecipeCardDetails {
  recipe_id: string
  title?: string | null
  image_url?: string | null
  duration?: number | null
  tags?: string[]
  dish_types?: string[]
  allergens?: string[]
  kcal_per_serving?: number | null
  protein_g_per_serving?: number | null
  carbs_g_per_serving?: number | null
  fat_g_per_serving?: number | null
  nutri_score_label?: string | null
}

export interface CreateRecipeRequest {
  title: string
  ingredients: string[]
  instructions: string[]
  duration: number
  serves: number
  region: string
  image_url?: string
  source_id?: string
  expert_recipe?: boolean
  tags?: string[]
  allergens?: string[]
  protein_g?: number
  carbohydrate_g?: number
  fat_g?: number
  energy_kcal?: number
  sugar_g?: number
  saturated_fat_g?: number
  sodium_mg?: number
  fibre_g?: number
}

export interface UpdateRecipeRequest {
  instructions?: string[]
  image_url?: string
  source_id?: string
  expert_recipe?: boolean
  title?: string
  allergens?: string[]
  tags?: string[]
  duration?: number
}

export interface RecipeCollectionSuggestion {
  urn: string
  title: string
  source_type?: string | null
  recipe_count?: number | null
}

export interface GetRecipeOptions {
  region?: RecipeRegion
  slim?: boolean
  /** Console/admin only — resolve the recipe even if disabled. */
  include_disabled?: boolean
}

export interface UploadedRecipeImage {
  image_id: string | null
  image_url: string
  raw_value: string
}

export interface RecipeResponse {
  help: string
  success: boolean
  result: Recipe
}

export interface RecipeSearchResponse {
  help: string
  success: boolean
  result: {
    results: RecipeSearchResult[]
  }
}

export type RecipeFacetMap = Record<string, Record<string, number>>

export interface RecipeParamSearchResult {
  results: RecipeSearchResult[]
  facets: RecipeFacetMap
  total: number
}

/**
 * The four annotation facets a catalog document carries.
 *
 * Elasticsearch-owned fields: the Neo4j-backed recipe endpoints have never
 * held them, so this is the only shape they arrive in.
 */
export interface RecipeAnnotations {
  cuisines: string[]
  moods: string[]
  flavor_profiles: string[]
  food_groups: string[]
}

/**
 * A raw catalog document. Deliberately loose — the catalog contract returns
 * the whole indexed document and its field set grows with the index, so
 * naming every field here would mean editing this type each time the
 * annotation pipeline learns something new.
 */
export type RecipeCatalogDocument = Record<string, unknown>

/**
 * Read a string list off a catalog document.
 *
 * Values are filtered to non-empty strings: an unclassified field comes back
 * as `[]`, but a partially projected document can carry nulls, and a blank
 * chip is indistinguishable from a rendering bug.
 */
const readStringArray = (document: RecipeCatalogDocument | null, key: string): string[] => {
  const raw = document?.[key]
  if (!Array.isArray(raw)) return []
  return raw.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
}

export interface RecipeCatalogSearchParams {
  q?: string
  fq?: string[]
  fl?: string[]
  sort?: string[]
  facets?: string[]
  facet_limit?: number
  limit?: number
  offset?: number
  include_inactive?: boolean
  highlight?: string[]
}

export interface RecipeCatalogSearchResult {
  results: RecipeCatalogDocument[]
  facets: RecipeFacetMap
  total: number
  max_result_window?: number
}

export interface RecipeAutocompleteResponse {
  suggestions?: string[] | Record<string, string> | null
}

export interface RecipeAutocompleteSuggestion {
  recipe_id: string | null
  title: string
}

export interface ApiError {
  message: string
  status?: number
  code?: string
}

interface RecipeRequestErrorLike {
  name?: string
  message?: string
  status?: number
  code?: string
}

export interface PipelineTraceWeightDetail {
  name?: string
  measurement_raw?: string
  parsed_quantity?: string | null
  parsed_unit?: string | null
  quantity_inferred?: boolean
  unit_inferred?: boolean
  usda_id?: string | null
  match_type?: string | null
  weight_grams?: number | null
  error?: string | null
}

export interface PipelineTrace {
  parser?: Record<string, unknown>
  weight_calculation?: {
    weights?: number[]
    details?: PipelineTraceWeightDetail[]
    matched_count?: number
    unmatched_count?: number
  }
  profiling?: {
    source?: string
    source_key?: string
    totals?: Record<string, number>
    ingredients?: Array<Record<string, unknown>>
  }
}

export interface RecipeProfileResult {
  title: string
  ingredient_names: string[]
  measurements: string[]
  weights: number[]
  ingredients: Array<Record<string, unknown>>
  instructions?: string[]
  directions?: string[]
  profiling_totals: Record<string, number>
  pipeline_trace?: PipelineTrace
  nutri_score?: {
    score?: number
    nutri_score?: string
    color?: string
  }
  nutri_score_color?: string
  nutri_score_source?: string
  serves?: number
  message?: string
  tags?: string[]
  allergens?: string[]
}

export type RecipeAdaptMode = 'nutrition' | 'sustainability' | 'reduce_quantity'

export interface RecipeAdaptExplanation {
  headline: string
  reason: string
  warning?: string | null
}

export interface RecipeAdaptSuggestion {
  rank: number
  action: 'swap' | 'reduce'
  original_ingredient: string
  substitute_name?: string | null
  source?: string | null
  category_distance?: string | null
  flavor_similarity?: number | null
  introduces_allergen?: boolean
  new_allergens?: string[]
  explanation: RecipeAdaptExplanation
  llm_justification?: string | null
  reduced_from_weight_g?: number | null
  reduced_to_weight_g?: number | null
  reduction_pct?: number | null
  simulated_nutri_score?: string | null
  nutri_score_points_saved?: number | null
  relative_improvement?: number | null
  nutrient_delta_per_serving?: Record<string, number> | null
  simulated_co2e_per_serving_kg?: number | null
  co2e_reduction_per_serving_kg?: number | null
  co2e_reduction_pct?: number | null
}

export interface RecipeAdaptSuggestionsResult {
  recipe_id: string
  region: string
  mode: RecipeAdaptMode
  /** 'already_optimal': nothing to improve; 'no_suggestions': no viable swap found. Both successes. */
  status?: 'ok' | 'already_optimal' | 'no_suggestions' | string
  message?: string | null
  offending_ingredient?: string | null
  offending_ingredient_contribution_pct?: number | null
  current_nutri_score?: string | null
  target_nutrient?: string | null
  target_nutrient_label?: string | null
  current_co2e_per_serving_kg?: number | null
  suggestions: RecipeAdaptSuggestion[]
  llm_used?: boolean
  llm_model?: string | null
  llm_rejected?: Array<{ substitute_name: string, reason?: string | null }>
}

export interface RecipeAdaptSuggestionsOptions {
  region?: string
  mode?: RecipeAdaptMode
  maxSwaps?: number
  useLlm?: boolean
  /** Member dietary-goal slugs (e.g. 'reduce_fat') biasing the targeted nutrient. */
  goalNutrients?: string[]
}

export interface RecipeAdaptSimulateOptions {
  region?: string
  originalIngredient: string
  substituteIngredient: string
  weightG?: number | null
}

export interface RecipeAdaptSimulateResult {
  recipe_id: string
  region: string
  original_nutri_score?: string | null
  simulated_nutri_score?: string | null
  nutri_score_points_delta?: number | null
  simulated_total_nutrients_per_serving?: Record<string, number>
  original_total_nutrients_per_serving?: Record<string, number>
  simulated_co2e_per_serving_kg?: number | null
  co2e_reduction_per_serving_kg?: number | null
  [key: string]: unknown
}

export interface RecipeSubstituteResult {
  original_ingredient: string
  substitute: string
  substitution_source: 'graph_direct' | 'foodon_taxonomy' | string
  candidates: string[]
  /** Full re-profiled recipe (RecipeProfileResult shape) or a
   *  `{status: 'profiling_unavailable', ...}` fallback when profiling failed. */
  modified_recipe_profile: Record<string, unknown>
}

type RecipeSearchPayload =
  | RecipeSearchResult[]
  | { results?: RecipeSearchResult[]; facets?: RecipeFacetMap; total?: number }
  | null
  | undefined
type RecipeApiTransport = 'local-proxy' | 'wisefood-rest'

// ============================================================================
// RecipeWrangler API Service
// ============================================================================

class RecipeApiService {
  private readonly localBasePath = '/recipes'
  private readonly restBasePath = '/recipewrangler/recipes'

  /**
   * Catalog contract (RecipeWrangler `/api/v2/recipes`, gateway
   * `/recipewrangler/catalog`).
   *
   * Separate from the recipe base paths above because it is a different
   * backing store, not a different route on the same one: the v1 recipe
   * endpoints read Neo4j, the catalog reads Elasticsearch. The annotation
   * facets exist only on the latter.
   *
   * The local path is prefixed `v2/` for the Nuxt proxy to rewrite — see
   * `server/api/rw/[...path].ts`.
   */
  private readonly localCatalogBasePath = '/v2/recipes'
  private readonly restCatalogBasePath = '/recipewrangler/catalog'

  private readonly uploadedImagesBasePath = '/images'

  private async ensureAuthToken(authStore: ReturnType<typeof useAuthStore>): Promise<string> {
    let token = authStore.getToken()
    if (token) return token

    // Hot-reload and route timing can leave Pinia state "authenticated"
    // while Keycloak token is not yet hydrated in memory.
    const initialized = await authStore.initialize(true)
    if (initialized) {
      try {
        await authStore.refreshToken()
      } catch {
        // ignore refresh errors here and validate token below
      }
      token = authStore.getToken()
    }

    if (!token) {
      throw new Error('No authentication token available')
    }
    return token
  }

  private resolveTransport(): RecipeApiTransport {
    const mode = getRecipeWranglerMode()

    if (mode === 'local') {
      return 'local-proxy'
    }

    if (mode === 'rest') {
      return 'wisefood-rest'
    }

    // Default behavior:
    // - local dev uses the Nuxt proxy to reach a local Recipe Wrangler instance
    // - production uses WiseFood REST endpoints
    if (import.meta.dev) {
      return 'local-proxy'
    }

    return 'wisefood-rest'
  }

  private getRecipeApiBaseUrl(transport: RecipeApiTransport): string {
    if (transport === 'local-proxy') {
      return '/api/rw'
    }

    return getWisefoodRestApiUrl()
  }

  private getRecipeBasePath(transport: RecipeApiTransport): string {
    return transport === 'local-proxy' ? this.localBasePath : this.restBasePath
  }

  private getCatalogBasePath(transport: RecipeApiTransport): string {
    return transport === 'local-proxy' ? this.localCatalogBasePath : this.restCatalogBasePath
  }

  private getRecipeEndpoint(recipeId: string, transport: RecipeApiTransport, options?: GetRecipeOptions): string {
    if (transport === 'local-proxy') {
      return `${this.localBasePath}/by-id?recipe_id=${encodeURIComponent(recipeId)}`
    }

    const params = new URLSearchParams()
    if (options?.region) params.set('region', options.region)
    if (options?.slim === true) params.set('slim', 'true')
    if (options?.include_disabled === true) params.set('include_disabled', 'true')
    const qs = params.toString()
    return `${this.restBasePath}/${encodeURIComponent(recipeId)}${qs ? `?${qs}` : ''}`
  }

  private async getRecipeByTransport(recipeId: string, transport: RecipeApiTransport, options?: GetRecipeOptions): Promise<Recipe> {
    const rawId = String(recipeId || '')
    let normalizedId = rawId
    try {
      normalizedId = decodeURIComponent(rawId)
    } catch {
      normalizedId = rawId
    }

    return this.fetchWithTimeout<Recipe>(
      this.getRecipeEndpoint(normalizedId, transport, options),
      'GET',
      undefined,
      DEFAULT_TIMEOUT,
      transport
    )
  }

  /**
   * Get a specific recipe by ID
   * @param recipeId - The unique recipe identifier
   * @param options - Optional region selector and slim flag
   * @returns Recipe with full details including nutritional information
   */
  async getRecipe(recipeId: string, options?: GetRecipeOptions): Promise<Recipe> {
    try {
      const transport = this.resolveTransport()
      return await this.getRecipeByTransport(recipeId, transport, options)
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch recipe')
    }
  }

  /**
   * Fetch a recipe's catalog document (the Elasticsearch-backed view).
   *
   * Distinct from `getRecipe`, which reads the Neo4j-backed detail record.
   * The two describe the same recipe from different stores and neither is a
   * superset of the other — the catalog carries the annotation facets and
   * review metadata, the detail record carries ingredients and nutrition.
   *
   * Returns `null` rather than throwing when the document is absent or the
   * lookup fails. Every caller so far uses this to *enrich* a recipe it has
   * already loaded, so a catalog outage should cost the annotations, not the
   * page.
   */
  async getCatalogRecipe(recipeId: string): Promise<RecipeCatalogDocument | null> {
    const rawId = String(recipeId || '').trim()
    if (!rawId) return null

    let normalizedId = rawId
    try {
      normalizedId = decodeURIComponent(rawId)
    } catch {
      normalizedId = rawId
    }

    try {
      const transport = this.resolveTransport()
      const data = await this.fetchWithTimeout<unknown>(
        `${this.getCatalogBasePath(transport)}/${encodeURIComponent(normalizedId)}`,
        'GET',
        undefined,
        DEFAULT_TIMEOUT,
        transport
      )
      return this.unwrapCatalogDocument(data)
    } catch {
      return null
    }
  }

  /**
   * Search the catalog index.
   *
   * `q` ranks and `fq` filters — there is no LLM in this request path, unlike
   * `searchRecipes`, where a bare noun can come back with no constraints and
   * match the whole corpus.
   */
  async searchCatalog(params: RecipeCatalogSearchParams = {}): Promise<RecipeCatalogSearchResult> {
    try {
      const transport = this.resolveTransport()
      const data = await this.fetchWithTimeout<Record<string, unknown>>(
        `${this.getCatalogBasePath(transport)}/search`,
        'POST',
        params,
        SEARCH_TIMEOUT,
        transport
      )

      const envelope = (this.unwrapCatalogDocument(data) ?? {}) as Record<string, unknown>
      const results = Array.isArray(envelope['results'])
        ? (envelope['results'] as RecipeCatalogDocument[])
        : []
      return {
        results,
        facets: (envelope['facets'] ?? {}) as RecipeFacetMap,
        // The index reports the true match count; `results.length` is a page.
        total: typeof envelope['total'] === 'number' ? envelope['total'] as number : results.length,
        ...(typeof envelope['max_result_window'] === 'number'
          ? { max_result_window: envelope['max_result_window'] as number }
          : {})
      }
    } catch (error) {
      throw this.handleError(error, 'Failed to search the recipe catalog')
    }
  }

  /**
   * The closed vocabularies the catalog classifies against.
   *
   * Returns `null` on failure: callers use this to label or offer values they
   * can also render without it.
   */
  async getCatalogVocabulary(): Promise<Record<string, unknown> | null> {
    try {
      const transport = this.resolveTransport()
      const data = await this.fetchWithTimeout<unknown>(
        `${this.getCatalogBasePath(transport)}/vocabulary`,
        'GET',
        undefined,
        DEFAULT_TIMEOUT,
        transport
      )
      return this.unwrapCatalogDocument(data)
    } catch {
      return null
    }
  }

  /**
   * The gateway wraps responses in `{help, success, result}`; a direct
   * RecipeWrangler call does not. Unwrapping here keeps both transports
   * returning the same shape to callers.
   */
  private unwrapCatalogDocument(payload: unknown): RecipeCatalogDocument | null {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
    const record = payload as Record<string, unknown>
    const result = record['result']
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      return result as RecipeCatalogDocument
    }
    return record
  }

  /**
   * Pull the annotation facets out of a catalog document.
   */
  extractAnnotations(document: RecipeCatalogDocument | null): RecipeAnnotations {
    return {
      cuisines: readStringArray(document, 'cuisines'),
      moods: readStringArray(document, 'moods'),
      flavor_profiles: readStringArray(document, 'flavor_profiles'),
      food_groups: readStringArray(document, 'food_groups')
    }
  }

  /**
   * The recipe's course classification, from the catalog document.
   *
   * The catalog owns this field (`course_types` is an ES-owned field, like the
   * annotation facets). Neo4j's `dish-type` tags are the older path and the one
   * the detail endpoint reads — but `RecipeDetailResponse` does not declare
   * `dish_types`, so the value it computes is dropped in serialization and the
   * course survives only inside the generic `tags` array. Reading it here goes
   * to the owner rather than working around that.
   *
   * `dish_types` is accepted as a fallback because the two names are the same
   * concept under different indices (recipes_v2 vs. the catalog alias), and
   * which one a document carries depends on what is behind the alias.
   */
  extractCourseTypes(document: RecipeCatalogDocument | null): string[] {
    const courseTypes = readStringArray(document, 'course_types')
    return courseTypes.length ? courseTypes : readStringArray(document, 'dish_types')
  }

  /**
   * Get a specific recipe from the WiseFood REST API for internal management flows.
   * @param options - Optional region selector and slim flag
   */
  async getManagedRecipe(recipeId: string, options?: GetRecipeOptions): Promise<Recipe> {
    try {
      return await this.getRecipeByTransport(recipeId, 'wisefood-rest', options)
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch recipe')
    }
  }

  /**
   * Search for recipes using natural language query
   * @param params - Search parameters including question and allergen exclusions
   * @returns List of matching recipes
   */
  /**
   * Natural-language recipe search.
   *
   * Returns the full `{results, facets, total}` envelope rather than a bare
   * array, matching `searchRecipesByParams`. The facets are what let the filter
   * panel show counts for the *current* result set: before this, a question
   * search left the chips displaying whatever the last parameter search
   * produced, so "Italian 1175" could return nine recipes when clicked.
   */
  async searchRecipes(params: RecipeSearchParams): Promise<RecipeParamSearchResult> {
    try {
      const normalizedQuestion = String(params.question || '').trim()

      if (normalizedQuestion.length === 0) {
        const paramSearchParams: RecipeParamSearchParams = {}
        if (params.exclude_allergens?.length) {
          paramSearchParams.exclude_allergens = params.exclude_allergens
        }
        return await this.searchRecipesByParams({ ...paramSearchParams, limit: paramSearchParams.limit ?? 12 })
      }

      const transport = this.resolveTransport()
      // Use extended timeout for search (AI processing can be slow)
      const data = await this.fetchWithTimeout<RecipeSearchPayload>(
        `${this.getRecipeBasePath(transport)}/search`,
        'POST',
        {
          ...params,
          question: normalizedQuestion
        },
        SEARCH_TIMEOUT,
        transport
      )

      return this.normalizeParamSearchResult(data)
    } catch (error) {
      throw this.handleError(error, 'Failed to search recipes')
    }
  }

  /**
   * Search for recipes using deterministic filters.
   * Always requests facets so the UI gets an accurate filtered `total` for pagination.
   */
  async searchRecipesByParams(params: RecipeParamSearchParams): Promise<RecipeParamSearchResult> {
    try {
      const transport = this.resolveTransport()
      const data = await this.fetchWithTimeout<RecipeSearchPayload>(
        `${this.getRecipeBasePath(transport)}/param_search`,
        'POST',
        { include_facets: true, ...params },
        SEARCH_TIMEOUT,
        transport
      )

      return this.normalizeParamSearchResult(data)
    } catch (error) {
      throw this.handleError(error, 'Failed to search recipes with filters')
    }
  }

  /**
   * Search recipes against the WiseFood REST API for console management.
   *
   * Both branches now return the full `{ results, facets, total }` shape — the
   * natural-language path gained a filtered total and aggregations, so the
   * console's counts and facet chips no longer go blank the moment someone
   * types in the search box.
   */
  async searchManagedRecipes(
    query: string,
    limit: number = 25,
    offset: number = 0,
    filters: Pick<
      RecipeParamSearchParams,
      'exclude_allergens' | 'sources' | 'dish_types' | 'sort_by' | 'include_disabled'
      | 'diet_tags' | 'cuisines' | 'moods' | 'flavor_profiles' | 'food_groups'
    > = {}
  ): Promise<RecipeParamSearchResult> {
    const safeLimit = Math.max(1, Math.trunc(limit || 25))
    const safeOffset = Math.max(0, Math.trunc(offset || 0))
    const normalizedQuery = String(query || '').trim()

    const filterPayload: Partial<RecipeParamSearchParams> = {}
    if (filters.exclude_allergens?.length) filterPayload.exclude_allergens = filters.exclude_allergens
    if (filters.sources?.length) filterPayload.sources = filters.sources
    if (filters.dish_types?.length) filterPayload.dish_types = filters.dish_types
    if (filters.diet_tags?.length) filterPayload.diet_tags = filters.diet_tags
    if (filters.cuisines?.length) filterPayload.cuisines = filters.cuisines
    if (filters.moods?.length) filterPayload.moods = filters.moods
    if (filters.flavor_profiles?.length) filterPayload.flavor_profiles = filters.flavor_profiles
    if (filters.food_groups?.length) filterPayload.food_groups = filters.food_groups
    if (filters.sort_by) filterPayload.sort_by = filters.sort_by
    if (filters.include_disabled) filterPayload.include_disabled = true

    try {
      if (!normalizedQuery) {
        const data = await this.fetchWithTimeout<RecipeSearchPayload>(
          `${this.getRecipeBasePath('wisefood-rest')}/param_search`,
          'POST',
          { include_facets: true, ...filterPayload, limit: safeLimit, offset: safeOffset },
          SEARCH_TIMEOUT,
          'wisefood-rest'
        )

        return this.normalizeParamSearchResult(data)
      }

      const data = await this.fetchWithTimeout<RecipeSearchPayload>(
        `${this.getRecipeBasePath('wisefood-rest')}/search`,
        'POST',
        {
          question: normalizedQuery,
          // Paging, same as the param_search branch above. These were missing
          // entirely, so a question search was pinned to the downstream default
          // of 10 rows and every page past the first re-served the first.
          limit: safeLimit,
          offset: safeOffset,
          ...(filterPayload.exclude_allergens ? { exclude_allergens: filterPayload.exclude_allergens } : {}),
          // The question path accepts the same filters as param_search, so the
          // console's sidebar keeps working once a query is typed. `diet_tags`
          // maps to `require_diet_tags` because on this endpoint `diet_tags`
          // means soft preference boosts, not a filter.
          ...(filterPayload.dish_types ? { dish_types: filterPayload.dish_types } : {}),
          ...(filterPayload.sources ? { sources: filterPayload.sources } : {}),
          ...(filterPayload.cuisines ? { cuisines: filterPayload.cuisines } : {}),
          ...(filterPayload.moods ? { moods: filterPayload.moods } : {}),
          ...(filterPayload.flavor_profiles ? { flavor_profiles: filterPayload.flavor_profiles } : {}),
          ...(filterPayload.food_groups ? { food_groups: filterPayload.food_groups } : {}),
          ...(filterPayload.diet_tags ? { require_diet_tags: filterPayload.diet_tags } : {}),
          // Without this an expert could not find a withdrawn recipe by name —
          // only by browsing the unfiltered list until it appeared.
          ...(filterPayload.include_disabled ? { include_disabled: true } : {})
        },
        SEARCH_TIMEOUT,
        'wisefood-rest'
      )

      return this.normalizeParamSearchResult(data)
    } catch (error) {
      throw this.handleError(error, 'Failed to search recipes')
    }
  }

  /**
   * Batch-fetch slim recipe cards by id via `/details`.
   * The endpoint accepts at most 30 ids per call, so larger sets are chunked.
   * Unknown ids are simply absent from the returned map.
   */
  async getRecipeDetailsBatch(recipeIds: string[], region?: string): Promise<Record<string, RecipeCardDetails>> {
    const ids = [...new Set(recipeIds.filter(Boolean))]
    if (ids.length === 0) return {}

    const transport = this.resolveTransport()
    const chunks: string[][] = []
    for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30))

    try {
      const responses = await Promise.all(chunks.map(chunk =>
        this.fetchWithTimeout<{ results?: Record<string, RecipeCardDetails> }>(
          `${this.getRecipeBasePath(transport)}/details`,
          'POST',
          { recipe_ids: chunk, ...(region ? { region } : {}) },
          SEARCH_TIMEOUT,
          transport
        )
      ))
      const merged: Record<string, RecipeCardDetails> = {}
      for (const response of responses) Object.assign(merged, response?.results ?? {})
      return merged
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch recipe details')
    }
  }

  /**
   * Return the total number of recipes in the graph.
   */
  async getRecipeCount(): Promise<number> {
    try {
      const transport = this.resolveTransport()
      const data = await this.fetchWithTimeout<{ count: number }>(
        `${this.getRecipeBasePath(transport)}/count`,
        'GET',
        undefined,
        10000,
        transport
      )
      return data.count ?? 0
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch recipe count')
    }
  }

  /**
   * Fetch recipe title autocomplete suggestions from Elasticsearch.
   */
  async autocompleteRecipes(query: string, limit: number = 8): Promise<RecipeAutocompleteSuggestion[]> {
    const normalizedQuery = query.trim()
    if (normalizedQuery.length < 2) return []

    try {
      const safeLimit = Math.min(20, Math.max(1, limit))
      const transport = this.resolveTransport()
      return await this.autocompleteRecipesByTransport(normalizedQuery, safeLimit, transport)
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch autocomplete suggestions')
    }
  }

  /**
   * Fetch recipe title autocomplete suggestions from the WiseFood REST API.
   */
  async autocompleteManagedRecipes(query: string, limit: number = 8): Promise<RecipeAutocompleteSuggestion[]> {
    const normalizedQuery = query.trim()
    if (normalizedQuery.length < 2) return []

    try {
      const safeLimit = Math.min(20, Math.max(1, limit))
      return await this.autocompleteRecipesByTransport(normalizedQuery, safeLimit, 'wisefood-rest')
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch autocomplete suggestions')
    }
  }

  private async autocompleteRecipesByTransport(
    normalizedQuery: string,
    safeLimit: number,
    transport: RecipeApiTransport
  ): Promise<RecipeAutocompleteSuggestion[]> {
    const data = await this.fetchWithTimeout<RecipeAutocompleteResponse>(
      `${this.getRecipeBasePath(transport)}/autocomplete?q=${encodeURIComponent(normalizedQuery)}&limit=${safeLimit}`,
      'GET',
      undefined,
      DEFAULT_TIMEOUT,
      transport
    )

    return this.normalizeAutocompleteSuggestions(data?.suggestions)
  }

  private normalizeAutocompleteSuggestions(
    suggestions: RecipeAutocompleteResponse['suggestions']
  ): RecipeAutocompleteSuggestion[] {
    if (Array.isArray(suggestions)) {
      return suggestions
        .map(item => ({
          recipe_id: null,
          title: String(item || '').trim()
        }))
        .filter(item => Boolean(item.title))
    }

    if (suggestions && typeof suggestions === 'object') {
      return Object.entries(suggestions)
        .map(([recipeId, title]) => ({
          recipe_id: recipeId.trim() || null,
          title: String(title || '').trim()
        }))
        .filter(item => Boolean(item.title))
    }

    return []
  }

  /**
   * Get recipes by category (convenience method)
   * @param category - Recipe category (e.g., 'pasta', 'salad', 'soup')
   * @param excludeAllergens - Optional allergens to exclude
   */
  async getRecipesByCategory(
    category: string,
    excludeAllergens?: string[]
  ): Promise<RecipeSearchResult[]> {
    const { results } = await this.searchRecipes({
      question: `${category} recipes`,
      exclude_allergens: excludeAllergens
    })
    return results
  }

  /**
   * Get recipes by ingredient
   * @param ingredient - Main ingredient to search for
   * @param excludeAllergens - Optional allergens to exclude
   */
  async getRecipesByIngredient(
    ingredient: string,
    excludeAllergens?: string[]
  ): Promise<RecipeSearchResult[]> {
    const { results } = await this.searchRecipes({
      question: `recipes with ${ingredient}`,
      exclude_allergens: excludeAllergens
    })
    return results
  }

  /**
   * Get quick and easy recipes
   * @param maxDuration - Maximum duration in minutes
   * @param excludeAllergens - Optional allergens to exclude
   */
  async getQuickRecipes(
    maxDuration: number = 30,
    excludeAllergens?: string[]
  ): Promise<RecipeSearchResult[]> {
    const { results } = await this.searchRecipes({
      question: `quick recipes under ${maxDuration} minutes`,
      exclude_allergens: excludeAllergens
    })
    return results
  }

  private normalizeSearchResults(data: RecipeSearchPayload): RecipeSearchResult[] {
    if (Array.isArray(data)) {
      return data
    }

    if (data && Array.isArray(data.results)) {
      return data.results
    }

    return []
  }

  private normalizeParamSearchResult(data: RecipeSearchPayload): RecipeParamSearchResult {
    const results = this.normalizeSearchResults(data)

    if (Array.isArray(data) || !data) {
      return { results, facets: {}, total: results.length }
    }

    const rawFacets = (data.facets ?? {}) as RecipeFacetMap
    const rawTotal = data.total
    const total = typeof rawTotal === 'number' && Number.isFinite(rawTotal) && rawTotal >= 0
      ? Math.trunc(rawTotal)
      : results.length

    return { results, facets: rawFacets, total }
  }

  /**
   * Analyze raw recipe text through parsing + profiling chain
   */
  async analyzeRecipe(rawRecipe: string, region: string = 'EU'): Promise<RecipeProfileResult> {
    if (!rawRecipe || !rawRecipe.trim()) {
      throw new Error('Recipe text is required for analysis')
    }
    const safeRegion = resolveRecipeRegion(region)
    try {
      const transport = this.resolveTransport()
      return await this.fetchWithTimeout<RecipeProfileResult>(
        `${this.getRecipeBasePath(transport)}/profile`,
        'POST',
        { raw_recipe: rawRecipe, region: safeRegion },
        PROFILE_TIMEOUT,
        transport
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to analyze recipe')
    }
  }

  /**
   * Find the best substitute for an ingredient in a recipe and re-profile the result.
   */
  async substituteIngredient(
    recipeId: string,
    ingredient: string,
    region: string = 'EU'
  ): Promise<RecipeSubstituteResult> {
    const name = String(ingredient || '').trim()
    if (!name) {
      throw new Error('Ingredient name is required for substitution')
    }
    const safeRegion = resolveRecipeRegion(region)
    try {
      const transport = this.resolveTransport()
      return await this.fetchWithTimeout<RecipeSubstituteResult>(
        `${this.getRecipeBasePath(transport)}/${encodeURIComponent(recipeId)}/substitute`,
        'POST',
        { ingredient: name, region: safeRegion },
        PROFILE_TIMEOUT,
        transport
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to find a substitute for this ingredient')
    }
  }

  /**
   * Get ranked ingredient-swap suggestions to improve a recipe's Nutri-Score,
   * carbon footprint, or portion size of its worst contributor.
   */
  async getAdaptSuggestions(
    recipeId: string,
    options: RecipeAdaptSuggestionsOptions = {}
  ): Promise<RecipeAdaptSuggestionsResult> {
    const safeRegion = resolveRecipeRegion(options.region)
    try {
      const transport = this.resolveTransport()
      return await this.fetchWithTimeout<RecipeAdaptSuggestionsResult>(
        `${this.getRecipeBasePath(transport)}/${encodeURIComponent(recipeId)}/adapt/suggestions`,
        'POST',
        {
          region: safeRegion,
          mode: options.mode || 'nutrition',
          max_swaps: Math.min(Math.max(options.maxSwaps ?? 3, 1), 3),
          use_llm: options.useLlm ?? true,
          ...(options.goalNutrients?.length ? { goal_nutrients: options.goalNutrients } : {})
        },
        PROFILE_TIMEOUT,
        transport
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to load improvement suggestions')
    }
  }

  /**
   * Simulate one specific ingredient swap and return the full nutrition deltas.
   */
  async adaptSimulate(
    recipeId: string,
    options: RecipeAdaptSimulateOptions
  ): Promise<RecipeAdaptSimulateResult> {
    const original = String(options.originalIngredient || '').trim()
    const substitute = String(options.substituteIngredient || '').trim()
    if (!original || !substitute) {
      throw new Error('Both the original and substitute ingredients are required')
    }
    const safeRegion = resolveRecipeRegion(options.region)
    try {
      const transport = this.resolveTransport()
      return await this.fetchWithTimeout<RecipeAdaptSimulateResult>(
        `${this.getRecipeBasePath(transport)}/${encodeURIComponent(recipeId)}/adapt/simulate`,
        'POST',
        {
          region: safeRegion,
          swap: {
            original_ingredient: original,
            substitute_ingredient: substitute,
            weight_g: options.weightG ?? null
          }
        },
        PROFILE_TIMEOUT,
        transport
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to simulate the ingredient swap')
    }
  }

  /**
   * Create a new structured recipe through the WiseFood REST API.
   */
  async createManagedRecipe(recipe: CreateRecipeRequest): Promise<Recipe> {
    try {
      return await this.fetchWithTimeout<Recipe>(
        `${this.restBasePath}/`,
        'POST',
        recipe,
        DEFAULT_TIMEOUT,
        'wisefood-rest'
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to create recipe')
    }
  }

  /**
   * Update recipe instructions and/or image URL through the WiseFood REST API.
   */
  async updateManagedRecipe(recipeId: string, updates: UpdateRecipeRequest): Promise<Recipe> {
    try {
      await this.fetchWithTimeout<unknown>(
        `${this.restBasePath}/${encodeURIComponent(recipeId)}`,
        'PATCH',
        updates,
        DEFAULT_TIMEOUT,
        'wisefood-rest'
      )
      // Console flow: the refetch must also resolve disabled recipes.
      return await this.getManagedRecipe(recipeId, { include_disabled: true })
    } catch (error) {
      throw this.handleError(error, 'Failed to update recipe')
    }
  }

  /**
   * Disable (soft-delete) a recipe so it stops being served everywhere.
   * Reversible via enableManagedRecipe. Admin/expert only.
   */
  async disableManagedRecipe(recipeId: string, reason?: string): Promise<RecipeStatusResult> {
    try {
      return await this.fetchWithTimeout<RecipeStatusResult>(
        `${this.restBasePath}/${encodeURIComponent(recipeId)}/disable`,
        'POST',
        { reason: reason?.trim() || null },
        DEFAULT_TIMEOUT,
        'wisefood-rest'
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to disable recipe')
    }
  }

  /**
   * Re-enable a previously disabled recipe. Admin/expert only.
   */
  async enableManagedRecipe(recipeId: string): Promise<RecipeStatusResult> {
    try {
      return await this.fetchWithTimeout<RecipeStatusResult>(
        `${this.restBasePath}/${encodeURIComponent(recipeId)}/enable`,
        'POST',
        {},
        DEFAULT_TIMEOUT,
        'wisefood-rest'
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to enable recipe')
    }
  }

  /**
   * Bulk disable recipes by explicit IDs. Admin/expert only.
   */
  async disableManagedRecipes(recipeIds: string[], reason?: string): Promise<RecipeStatusResult> {
    try {
      return await this.fetchWithTimeout<RecipeStatusResult>(
        `${this.restBasePath}/disable`,
        'POST',
        { recipe_ids: recipeIds, reason: reason?.trim() || null },
        SEARCH_TIMEOUT,
        'wisefood-rest'
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to disable recipes')
    }
  }

  /**
   * Bulk re-enable recipes by explicit IDs. Admin/expert only.
   */
  async enableManagedRecipes(recipeIds: string[]): Promise<RecipeStatusResult> {
    try {
      return await this.fetchWithTimeout<RecipeStatusResult>(
        `${this.restBasePath}/enable`,
        'POST',
        { recipe_ids: recipeIds },
        SEARCH_TIMEOUT,
        'wisefood-rest'
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to enable recipes')
    }
  }

  /**
   * Bulk disable every recipe matching the given param_search filters.
   * The backend refuses an unconstrained query, so pass at least one filter.
   * Returns 202 immediately: `requested` is the matched count and the actual
   * disabling runs server-side in the background — poll the list to watch
   * the count drain. Admin/expert only.
   */
  async disableManagedRecipesByQuery(
    filters: Pick<RecipeParamSearchParams, 'include_ingredients' | 'exclude_ingredients' | 'exclude_allergens' | 'diet_tags' | 'sources' | 'dish_types' | 'max_duration_minutes'>,
    reason?: string
  ): Promise<RecipeStatusResult> {
    try {
      return await this.fetchWithTimeout<RecipeStatusResult>(
        `${this.restBasePath}/disable-by-query`,
        'POST',
        { ...filters, reason: reason?.trim() || null },
        BULK_STATUS_TIMEOUT,
        'wisefood-rest'
      )
    } catch (error) {
      throw this.handleError(error, 'Failed to disable matching recipes')
    }
  }

  /**
   * Autocomplete recipe collections by title prefix.
   */
  async autocompleteCollections(q: string, limit = 15): Promise<RecipeCollectionSuggestion[]> {
    try {
      const baseUrl = getWisefoodApiUrl()
      const url = new URL(`${baseUrl}/v1/rcollections/autocomplete`)
      url.searchParams.set('q', q)
      url.searchParams.set('limit', String(limit))

      const authStore = useAuthStore()
      const token = await this.ensureAuthToken(authStore)

      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return Array.isArray(data) ? data : (data.result ?? data.results ?? [])
    } catch (error) {
      throw this.handleError(error, 'Failed to autocomplete collections')
    }
  }

  /**
   * Upload a recipe image to the WiseFood REST API and return a recipe-ready image URL.
   */
  async uploadManagedRecipeImage(file: File): Promise<UploadedRecipeImage> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await this.fetchResponseWithTimeout(
        this.uploadedImagesBasePath,
        {
          method: 'POST',
          body: formData
        },
        DEFAULT_TIMEOUT,
        'wisefood-rest'
      )

      const rawPayload = await this.parseUnknownResponse(response)
      const rawValue = this.extractUploadedImageValue(rawPayload)
      const imageUrl = this.resolveUploadedImageUrl(rawValue)
      const imageId = this.extractUploadedImageId(rawValue)

      return {
        image_id: imageId,
        image_url: imageUrl,
        raw_value: rawValue
      }
    } catch (error) {
      throw this.handleError(error, 'Failed to upload recipe image')
    }
  }

  private async parseUnknownResponse(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      return response.json()
    }

    return response.text()
  }

  private extractUploadedImageValue(payload: unknown): string {
    if (typeof payload === 'string' && payload.trim()) {
      return payload.trim()
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Image upload did not return a usable image reference.')
    }

    const record = payload as Record<string, unknown>

    for (const key of ['result', 'data']) {
      if (record[key] !== undefined) {
        return this.extractUploadedImageValue(record[key])
      }
    }

    for (const key of ['image_url', 'url', 'image_id', 'id']) {
      const candidate = record[key]
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim()
      }
    }

    throw new Error('Image upload did not return a usable image reference.')
  }

  private extractUploadedImageId(value: string): string | null {
    const normalized = value.trim()
    if (!normalized || normalized.includes('/')) {
      return null
    }

    return normalized
  }

  private resolveUploadedImageUrl(value: string): string {
    const normalized = value.trim()
    if (!normalized) {
      throw new Error('Image upload did not return a usable image reference.')
    }

    if (normalized.startsWith('http://')) {
      return `https://${normalized.slice('http://'.length)}`
    }

    if (/^(https:\/\/|data:|blob:)/i.test(normalized) || normalized.startsWith('/')) {
      return normalized
    }

    const restBaseUrl = getWisefoodRestApiUrl()
    const restOrigin = new URL(restBaseUrl).origin

    if (normalized.startsWith('api/') || normalized.startsWith('rest/')) {
      return new URL(`/${normalized.replace(/^\/+/, '')}`, `${restOrigin}/`).toString()
    }

    if (normalized.startsWith('v1/') || normalized.startsWith('images/')) {
      return new URL(normalized.replace(/^\/+/, ''), `${restBaseUrl}/`).toString()
    }

    return `${restBaseUrl}/images/${encodeURIComponent(normalized)}`
  }

  private async fetchResponseWithTimeout(
    endpoint: string,
    requestInit: RequestInit,
    timeoutMs: number = DEFAULT_TIMEOUT,
    transport: RecipeApiTransport = this.resolveTransport()
  ): Promise<Response> {
    const baseUrl = this.getRecipeApiBaseUrl(transport)
    const url = `${baseUrl}${endpoint}`

    const authStore = useAuthStore()
    let token = await this.ensureAuthToken(authStore)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const doRequest = async (authToken: string) => {
        const headers = new Headers(requestInit.headers || {})
        headers.set('Authorization', `Bearer ${authToken}`)

        return fetch(url, {
          ...requestInit,
          headers,
          signal: controller.signal
        })
      }

      let response = await doRequest(token)

      if (response.status === 401) {
        try {
          await authStore.refreshToken()
          token = await this.ensureAuthToken(authStore)
          response = await doRequest(token)
        } catch {
          // Let the shared error handling run below.
        }
      }

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorData: unknown
        try {
          // Read the body once as text, then attempt JSON — calling .text()
          // after a failed .json() throws "body stream already read".
          const rawBody = await response.text()
          try {
            errorData = JSON.parse(rawBody)
          } catch {
            errorData = rawBody
          }
        } catch {
          errorData = null
        }

        if (response.status === 401) {
          if (import.meta.client) {
            await authStore.logout()
          }
          throw new Error('Authentication failed. Please log in again.')
        }

        throw {
          message: `API request failed with status ${response.status}`,
          status: response.status,
          data: errorData
        }
      }

      return response
    } catch (error: unknown) {
      clearTimeout(timeoutId)
      const requestError = error as RecipeRequestErrorLike

      if (requestError.name === 'AbortError') {
        throw {
          message: `Request timeout after ${timeoutMs / 1000} seconds. Please try again.`,
          status: 408,
          code: 'TIMEOUT'
        }
      }

      throw error
    }
  }

  /**
   * Fetch with timeout support
   * @private
   */
  private async fetchWithTimeout<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    data?: unknown,
    timeoutMs: number = DEFAULT_TIMEOUT,
    transport: RecipeApiTransport = this.resolveTransport()
  ): Promise<T> {
    const baseUrl = this.getRecipeApiBaseUrl(transport)
    const url = `${baseUrl}${endpoint}`

    const authStore = useAuthStore()
    let token = await this.ensureAuthToken(authStore)

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const doRequest = async (authToken: string) => {
        return fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal
        })
      }

      let response = await doRequest(token)

      // Retry once after token refresh to avoid false-empty compare/search failures.
      if (response.status === 401) {
        try {
          await authStore.refreshToken()
          token = await this.ensureAuthToken(authStore)
          response = await doRequest(token)
        } catch {
          // Let normal error handling below run.
        }
      }

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorData: unknown
        try {
          // Read the body once as text, then attempt JSON — calling .text()
          // after a failed .json() throws "body stream already read".
          const rawBody = await response.text()
          try {
            errorData = JSON.parse(rawBody)
          } catch {
            errorData = rawBody
          }
        } catch {
          errorData = null
        }

        // Handle 401 authentication errors (after retry attempt above)
        if (response.status === 401) {
          if (import.meta.client) {
            await authStore.logout()
          }
          throw new Error('Authentication failed. Please log in again.')
        }

        throw {
          message: `API request failed with status ${response.status}`,
          status: response.status,
          data: errorData
        }
      }

      // Handle response
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        return undefined as T
      }

      // API returns { help, success, result } wrapper - extract result
      const json = await response.json()
      if (json && typeof json === 'object' && 'result' in json) {
        return json.result as T
      }
      return json as T
    } catch (error: unknown) {
      clearTimeout(timeoutId)
      const requestError = error as RecipeRequestErrorLike

      // Handle abort/timeout errors
      if (requestError.name === 'AbortError') {
        throw {
          message: `Request timeout after ${timeoutMs / 1000} seconds. The search is taking longer than expected. Please try again or simplify your query.`,
          status: 408,
          code: 'TIMEOUT'
        }
      }

      throw error
    }
  }

  /**
   * Error handler with consistent error formatting
   */
  private handleError(error: unknown, defaultMessage: string): ApiError {
    const requestError = error as RecipeRequestErrorLike
    const apiError: ApiError = {
      message: defaultMessage,
      status: requestError.status || 500
    }

    if (requestError.message) {
      apiError.message = requestError.message
    }

    if (requestError.code) {
      apiError.code = requestError.code
    }

    return apiError
  }
}

// Export singleton instance
export default new RecipeApiService()
