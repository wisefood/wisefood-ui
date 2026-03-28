import { useAuthStore } from '~/stores/auth'
import { getRecipeWranglerMode, getWisefoodRestApiUrl } from '~/utils/runtimeConfig'

// ============================================================================
// Timeout Configuration
// ============================================================================
const DEFAULT_TIMEOUT = 30000 // 30 seconds
const SEARCH_TIMEOUT = 60000 // 60 seconds for search operations (can be slow)
const PROFILE_TIMEOUT = 120000 // 120 seconds for profiling pipeline

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

export interface Recipe {
  recipe_id: string
  title: string
  source?: string | null
  image_url: string | null
  tags?: Array<string | null> | null
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
  nutri_score_breakdown?: Record<string, unknown> | null
  nutrition_source?: string | null
  nutrients?: RecipeNutrient[] | null
  nutrition_profiling_details?: RecipeNutritionProfilingDetail[] | null
  nutrition_profiling_debug?: Record<string, unknown> | null
}

export interface RecipeSearchResult {
  recipe_id?: string
  id?: string
  title: string
  source?: string | null
  image_url: string | null
  duration?: number | null
  serves?: number | null
  nutri_score?: number | null
}

export interface RecipeSearchParams {
  question: string
  exclude_allergens?: string[]
}

export interface RecipeParamSearchParams {
  include_ingredients?: string[]
  exclude_ingredients?: string[]
  exclude_allergens?: string[]
  diet_tags?: string[]
  max_duration_minutes?: number
  limit?: number
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

export interface RecipeAutocompleteResponse {
  suggestions: string[]
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
}

type RecipeSearchPayload = RecipeSearchResult[] | { results?: RecipeSearchResult[] } | null | undefined
type RecipeApiTransport = 'local-proxy' | 'wisefood-rest'

// ============================================================================
// RecipeWrangler API Service
// ============================================================================

class RecipeApiService {
  private readonly localBasePath = '/recipes'
  private readonly restBasePath = '/recipewrangler/recipes'

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

  private getRecipeEndpoint(recipeId: string, transport: RecipeApiTransport): string {
    if (transport === 'local-proxy') {
      return `${this.localBasePath}/by-id?recipe_id=${encodeURIComponent(recipeId)}`
    }

    return `${this.restBasePath}/${encodeURIComponent(recipeId)}`
  }

  /**
   * Get a specific recipe by ID
   * @param recipeId - The unique recipe identifier
   * @returns Recipe with full details including nutritional information
   */
  async getRecipe(recipeId: string): Promise<Recipe> {
    try {
      const rawId = String(recipeId || '')
      let normalizedId = rawId
      try {
        normalizedId = decodeURIComponent(rawId)
      } catch {
        normalizedId = rawId
      }
      const transport = this.resolveTransport()
      // Use longer timeout for recipe details
      const data = await this.fetchWithTimeout<Recipe>(
        this.getRecipeEndpoint(normalizedId, transport),
        'GET',
        undefined,
        DEFAULT_TIMEOUT,
        transport
      )
      return data
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch recipe')
    }
  }

  /**
   * Search for recipes using natural language query
   * @param params - Search parameters including question and allergen exclusions
   * @returns List of matching recipes
   */
  async searchRecipes(params: RecipeSearchParams): Promise<RecipeSearchResult[]> {
    try {
      const normalizedQuestion = String(params.question || '').trim()

      if (normalizedQuestion.length === 0) {
        const paramSearchParams: RecipeParamSearchParams = {}
        if (params.exclude_allergens?.length) {
          paramSearchParams.exclude_allergens = params.exclude_allergens
        }
        return await this.searchRecipesByParams(paramSearchParams)
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

      return this.normalizeSearchResults(data)
    } catch (error) {
      throw this.handleError(error, 'Failed to search recipes')
    }
  }

  /**
   * Search for recipes using deterministic filters
   */
  async searchRecipesByParams(params: RecipeParamSearchParams): Promise<RecipeSearchResult[]> {
    try {
      const transport = this.resolveTransport()
      const data = await this.fetchWithTimeout<RecipeSearchPayload>(
        `${this.getRecipeBasePath(transport)}/param_search`,
        'POST',
        params,
        SEARCH_TIMEOUT,
        transport
      )

      return this.normalizeSearchResults(data)
    } catch (error) {
      throw this.handleError(error, 'Failed to search recipes with filters')
    }
  }

  /**
   * Fetch recipe title autocomplete suggestions from Elasticsearch.
   */
  async autocompleteRecipes(query: string, limit: number = 8): Promise<string[]> {
    const normalizedQuery = query.trim()
    if (normalizedQuery.length < 2) return []

    try {
      const safeLimit = Math.min(20, Math.max(1, limit))
      const transport = this.resolveTransport()
      const data = await this.fetchWithTimeout<RecipeAutocompleteResponse>(
        `${this.getRecipeBasePath(transport)}/autocomplete?q=${encodeURIComponent(normalizedQuery)}&limit=${safeLimit}`,
        'GET',
        undefined,
        DEFAULT_TIMEOUT,
        transport
      )
      return Array.isArray(data?.suggestions) ? data.suggestions : []
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch autocomplete suggestions')
    }
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
    return this.searchRecipes({
      question: `${category} recipes`,
      exclude_allergens: excludeAllergens
    })
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
    return this.searchRecipes({
      question: `recipes with ${ingredient}`,
      exclude_allergens: excludeAllergens
    })
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
    return this.searchRecipes({
      question: `quick recipes under ${maxDuration} minutes`,
      exclude_allergens: excludeAllergens
    })
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

  /**
   * Analyze raw recipe text through parsing + profiling chain
   */
  async analyzeRecipe(rawRecipe: string, region: string = 'IE'): Promise<RecipeProfileResult> {
    if (!rawRecipe || !rawRecipe.trim()) {
      throw new Error('Recipe text is required for analysis')
    }
    const normalizedRegion = String(region || 'IE').trim().toUpperCase()
    const safeRegion = (normalizedRegion === 'IE' || normalizedRegion === 'US')
      ? normalizedRegion
      : 'US'
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
   * Fetch with timeout support
   * @private
   */
  private async fetchWithTimeout<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
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
          errorData = await response.json()
        } catch {
          errorData = await response.text()
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
