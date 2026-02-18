import { ref, computed } from 'vue'
import recipeApi from '~/services/recipeApi'
import type {
  Recipe,
  RecipeSearchResult,
  RecipeSearchParams,
  RecipeParamSearchParams,
  ApiError
} from '~/services/recipeApi'

/**
 * Composable for managing recipe data and operations
 * Provides reactive state, loading indicators, and error handling
 */
export function useRecipes() {
  // ============================================================================
  // State
  // ============================================================================
  const recipes = ref<RecipeSearchResult[]>([])
  const currentRecipe = ref<Recipe | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastSearchQuery = ref<string>('')
  const totalResults = ref(0)

  // ============================================================================
  // Computed Properties
  // ============================================================================
  const allRecipes = computed(() => recipes.value)
  const hasRecipes = computed(() => recipes.value.length > 0)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)
  const recipeDetails = computed(() => currentRecipe.value)

  // ============================================================================
  // Methods
  // ============================================================================

  const hydrateImageUrls = async (results: RecipeSearchResult[], maxToHydrate: number = 20) => {
    if (!import.meta.client) return

    const missing = results.filter(r => !r.image_url).slice(0, maxToHydrate)
    if (missing.length === 0) return

    const { useRecipeStore } = await import('~/stores/recipe')
    const recipeStore = useRecipeStore()

    // Limit concurrency to avoid spamming the backend.
    const maxConcurrent = Math.min(4, missing.length)
    let nextIndex = 0

    const worker = async () => {
      while (true) {
        const index = nextIndex
        nextIndex += 1
        if (index >= missing.length) return

        const recipeStub = missing[index]
        try {
          const cached = recipeStore.getCachedRecipe(recipeStub.recipe_id)
          if (cached?.image_url) {
            recipeStub.image_url = cached.image_url
            continue
          }

          const full = await recipeApi.getRecipe(recipeStub.recipe_id)
          recipeStore.cacheRecipe(full)
          if (full.image_url) {
            recipeStub.image_url = full.image_url
          }
        } catch {
          // Best-effort only: leave placeholder if a given image can't be hydrated.
        }
      }
    }

    await Promise.all(Array.from({ length: maxConcurrent }, () => worker()))

    // Ensure the UI updates even if nested mutation doesn't trigger for some reason.
    recipes.value = [...recipes.value]
  }

  const normalizeList = (values?: string[]): string[] => {
    if (!values || values.length === 0) return []
    return values
      .map(value => value.trim())
      .filter(value => value.length > 0)
      .sort()
  }

  const buildParamSearchCacheKey = (params: RecipeParamSearchParams): string => {
    return JSON.stringify({
      include_ingredients: normalizeList(params.include_ingredients),
      exclude_ingredients: normalizeList(params.exclude_ingredients),
      exclude_allergens: normalizeList(params.exclude_allergens),
      diet_tags: normalizeList(params.diet_tags),
      max_duration_minutes: params.max_duration_minutes,
      limit: params.limit ?? 20
    })
  }

  /**
   * Search for recipes using natural language query
   */
  const searchRecipes = async (params: RecipeSearchParams, useCache = true) => {
    error.value = null
    lastSearchQuery.value = params.question

    // Check cache first if enabled
    if (useCache && import.meta.client) {
      const { useRecipeStore } = await import('~/stores/recipe')
      const recipeStore = useRecipeStore()
      const cachedResults = recipeStore.getCachedSearch(
        params.question,
        params.exclude_allergens || []
      )

      if (cachedResults) {
        recipes.value = cachedResults
        totalResults.value = cachedResults.length
        return cachedResults
      }
    }

    loading.value = true

    try {
      const results = await recipeApi.searchRecipes(params)
      recipes.value = results
      totalResults.value = results.length
      void hydrateImageUrls(results)

      // Cache the results
      if (import.meta.client) {
        const { useRecipeStore } = await import('~/stores/recipe')
        const recipeStore = useRecipeStore()
        recipeStore.cacheSearchResults(
          params.question,
          params.exclude_allergens || [],
          results
        )
      }

      return results
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to search recipes'
      recipes.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Search recipes using deterministic parameter filters
   */
  const searchRecipesByParams = async (params: RecipeParamSearchParams, useCache = true) => {
    error.value = null
    lastSearchQuery.value = ''

    const normalizedAllergens = normalizeList(params.exclude_allergens)
    const cacheKey = `param:${buildParamSearchCacheKey(params)}`

    if (useCache && import.meta.client) {
      const { useRecipeStore } = await import('~/stores/recipe')
      const recipeStore = useRecipeStore()
      const cachedResults = recipeStore.getCachedSearch(cacheKey, normalizedAllergens)

      if (cachedResults) {
        recipes.value = cachedResults
        totalResults.value = cachedResults.length
        return cachedResults
      }
    }

    loading.value = true

    try {
      const results = await recipeApi.searchRecipesByParams(params)
      recipes.value = results
      totalResults.value = results.length
      void hydrateImageUrls(results, params.limit ?? 20)

      if (import.meta.client) {
        const { useRecipeStore } = await import('~/stores/recipe')
        const recipeStore = useRecipeStore()
        recipeStore.cacheSearchResults(cacheKey, normalizedAllergens, results)
      }

      return results
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to search recipes with filters'
      recipes.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch a single recipe by ID with full details
   */
  const fetchRecipe = async (recipeId: string) => {
    loading.value = true
    error.value = null

    try {
      const recipe = await recipeApi.getRecipe(recipeId)
      currentRecipe.value = recipe
      return recipe
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch recipe details'
      currentRecipe.value = null
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get recipes by category
   */
  const fetchRecipesByCategory = async (
    category: string,
    excludeAllergens?: string[],
    useCache = true
  ) => {
    error.value = null
    const query = `${category} recipes`
    lastSearchQuery.value = query

    // Check cache first if enabled
    if (useCache && import.meta.client) {
      const { useRecipeStore } = await import('~/stores/recipe')
      const recipeStore = useRecipeStore()
      const cachedResults = recipeStore.getCachedSearch(query, excludeAllergens || [])

      if (cachedResults) {
        recipes.value = cachedResults
        totalResults.value = cachedResults.length
        return cachedResults
      }
    }

    loading.value = true

    try {
      const results = await recipeApi.getRecipesByCategory(category, excludeAllergens)
      recipes.value = results
      totalResults.value = results.length
      void hydrateImageUrls(results)

      // Cache the results
      if (import.meta.client) {
        const { useRecipeStore } = await import('~/stores/recipe')
        const recipeStore = useRecipeStore()
        recipeStore.cacheSearchResults(query, excludeAllergens || [], results)
      }

      return results
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch recipes by category'
      recipes.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get recipes by ingredient
   */
  const fetchRecipesByIngredient = async (
    ingredient: string,
    excludeAllergens?: string[]
  ) => {
    error.value = null
    const query = `recipes with ${ingredient}`
    lastSearchQuery.value = query
    loading.value = true

    try {
      const results = await recipeApi.getRecipesByIngredient(ingredient, excludeAllergens)
      recipes.value = results
      totalResults.value = results.length
      void hydrateImageUrls(results)
      return results
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch recipes by ingredient'
      recipes.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get quick recipes (under specified duration)
   */
  const fetchQuickRecipes = async (
    maxDuration: number = 30,
    excludeAllergens?: string[]
  ) => {
    error.value = null
    const query = `quick recipes under ${maxDuration} minutes`
    lastSearchQuery.value = query
    loading.value = true

    try {
      const results = await recipeApi.getQuickRecipes(maxDuration, excludeAllergens)
      recipes.value = results
      totalResults.value = results.length
      void hydrateImageUrls(results)
      return results
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch quick recipes'
      recipes.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Clear current error
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Clear all recipe data
   */
  const clearRecipes = () => {
    recipes.value = []
    currentRecipe.value = null
    totalResults.value = 0
    lastSearchQuery.value = ''
    error.value = null
  }

  /**
   * Clear current recipe details
   */
  const clearCurrentRecipe = () => {
    currentRecipe.value = null
  }

  // ============================================================================
  // Return API
  // ============================================================================
  return {
    // State (readonly computed)
    recipes: allRecipes,
    currentRecipe: recipeDetails,
    loading: isLoading,
    error: computed(() => error.value),
    hasRecipes,
    hasError,
    lastSearchQuery: computed(() => lastSearchQuery.value),
    totalResults: computed(() => totalResults.value),

    // Methods
    searchRecipes,
    searchRecipesByParams,
    fetchRecipe,
    fetchRecipesByCategory,
    fetchRecipesByIngredient,
    fetchQuickRecipes,
    clearError,
    clearRecipes,
    clearCurrentRecipe
  }
}
