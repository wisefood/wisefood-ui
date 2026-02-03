import { ref, computed } from 'vue'
import recipeApi from '~/services/recipeApi'
import type {
  Recipe,
  RecipeSearchResult,
  RecipeSearchParams,
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
    fetchRecipe,
    fetchRecipesByCategory,
    fetchRecipesByIngredient,
    fetchQuickRecipes,
    clearError,
    clearRecipes,
    clearCurrentRecipe
  }
}
