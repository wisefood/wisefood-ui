import { useAuthStore } from '~/stores/auth'

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
  source?: string
  image_url: string | null
  tags?: string[]
  ingredients: RecipeIngredient[]
  instructions: string[]
  duration: number | null
  serves: number | null
  total_kcal_per_serving: number
  total_protein_g_per_serving: number
  total_carbs_g_per_serving: number
  total_fat_g_per_serving: number
  total_fiber_g_per_serving: number
  total_sugar_g_per_serving: number
  total_sodium_mg_per_serving: number
  total_cholesterol_mg_per_serving: number
  total_nutrients?: Record<string, unknown> | null
  total_nutrients_per_serving?: Record<string, unknown> | null
  nutri_score: number
  nutri_score_breakdown?: Record<string, unknown> | null
  nutrients?: RecipeNutrient[]
  nutrition_profiling_details?: RecipeNutritionProfilingDetail[]
  nutrition_profiling_debug?: Record<string, unknown>
}

export interface RecipeSearchResult {
  recipe_id?: string
  id?: string
  title: string
  source?: string
  image_url: string | null
  duration?: number
  serves?: number
  nutri_score?: number
}

export interface RecipeSearchParams {
  question: string
  exclude_allergens?: string[]
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

// ============================================================================
// RecipeWrangler API Service
// ============================================================================

class RecipeApiService {
  private readonly basePath = '/recipes'

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

  private getRecipeWranglerBaseUrl(): string {
    // In local dev, use Nuxt proxy so browser only needs port 3000.
    if (import.meta.client && import.meta.dev) {
      return '/api/rw'
    }

    const config = useRuntimeConfig()
    const runtimeConfig = import.meta.client ? (window as any).__RUNTIME_CONFIG__ : undefined
    return (runtimeConfig?.recipeWranglerApiUrl as string) ||
      (config.public.recipeWranglerApiUrl as string) ||
      'http://127.0.0.1:8001/api/v1'
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
      // Use longer timeout for recipe details
      const data = await this.fetchWithTimeout<Recipe>(
        `${this.basePath}/by-id?recipe_id=${encodeURIComponent(normalizedId)}`,
        'GET',
        undefined,
        DEFAULT_TIMEOUT
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
      // Use extended timeout for search (AI processing can be slow)
      const data = await this.fetchWithTimeout<{ results: RecipeSearchResult[] }>(
        `${this.basePath}/search`,
        'POST',
        params,
        SEARCH_TIMEOUT
      )
      // Extract the results array from the response
      return data.results || []
    } catch (error) {
      throw this.handleError(error, 'Failed to search recipes')
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
      const data = await this.fetchWithTimeout<RecipeAutocompleteResponse>(
        `${this.basePath}/autocomplete?q=${encodeURIComponent(normalizedQuery)}&limit=${safeLimit}`,
        'GET',
        undefined,
        DEFAULT_TIMEOUT
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
      return await this.fetchWithTimeout<RecipeProfileResult>(
        `${this.basePath}/profile`,
        'POST',
        { raw_recipe: rawRecipe, region: safeRegion },
        PROFILE_TIMEOUT
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
    timeoutMs: number = DEFAULT_TIMEOUT
  ): Promise<T> {
    const baseUrl = this.getRecipeWranglerBaseUrl()
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

    } catch (error: any) {
      clearTimeout(timeoutId)

      // Handle abort/timeout errors
      if (error.name === 'AbortError') {
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
  private handleError(error: any, defaultMessage: string): ApiError {
    const apiError: ApiError = {
      message: defaultMessage,
      status: error?.status || 500
    }

    if (error?.message) {
      apiError.message = error.message
    }

    if (error?.code) {
      apiError.code = error.code
    }

    return apiError
  }
}

// Export singleton instance
export default new RecipeApiService()
