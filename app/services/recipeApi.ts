import { useAuthStore } from '~/stores/auth'
import { getWisefoodRestApiUrl } from '~/utils/runtimeConfig'

// ============================================================================
// Timeout Configuration
// ============================================================================
const DEFAULT_TIMEOUT = 30000 // 30 seconds
const SEARCH_TIMEOUT = 60000  // 60 seconds for search operations (can be slow)

/**
 * Creates a timeout wrapper for fetch requests
 */
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeoutMs)
  return controller.signal
}

// ============================================================================
// Type Definitions - Based on API Response Schema
// ============================================================================

export interface RecipeIngredient {
  name: string
  measurement: string
}

export interface Recipe {
  recipe_id: string
  title: string
  image_url: string | null
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
  nutri_score: number
}

export interface RecipeSearchResult {
  recipe_id: string
  title: string
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

type RecipeSearchPayload = { results?: RecipeSearchResult[] } | RecipeSearchResult[]

export interface ApiError {
  message: string
  status?: number
  code?: string
}

// ============================================================================
// RecipeWrangler API Service
// ============================================================================

class RecipeApiService {
  private readonly basePath = '/recipewrangler'

  /**
   * Get a specific recipe by ID
   * @param recipeId - The unique recipe identifier
   * @returns Recipe with full details including nutritional information
   */
  async getRecipe(recipeId: string): Promise<Recipe> {
    try {
      // Use longer timeout for recipe details
      const data = await this.fetchWithTimeout<Recipe>(
        `${this.basePath}/recipes/${recipeId}`,
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
      const data = await this.fetchWithTimeout<RecipeSearchPayload>(
        `${this.basePath}/recipes/search`,
        'POST',
        params,
        SEARCH_TIMEOUT
      )

      if (Array.isArray(data)) {
        return data
      }

      if (data && Array.isArray(data.results)) {
        return data.results
      }

      return []
    } catch (error) {
      throw this.handleError(error, 'Failed to search recipes')
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
   * Fetch with timeout support
   * @private
   */
  private async fetchWithTimeout<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: unknown,
    timeoutMs: number = DEFAULT_TIMEOUT
  ): Promise<T> {
    const baseUrl = getWisefoodRestApiUrl()
    const url = `${baseUrl}${endpoint}`

    // Get auth token
    const authStore = useAuthStore()
    const token = authStore.getToken()

    if (!token) {
      throw new Error('No authentication token available')
    }

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorData: unknown
        try {
          errorData = await response.json()
        } catch {
          errorData = await response.text()
        }

        // Handle 401 authentication errors
        if (response.status === 401) {
          const refreshed = await authStore.refreshToken()
          if (!refreshed && import.meta.client) {
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
