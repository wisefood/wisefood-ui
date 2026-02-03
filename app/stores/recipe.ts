import { defineStore } from 'pinia'
import type { Recipe, RecipeSearchResult } from '~/services/recipeApi'

/**
 * RecipeWrangler Pinia Store
 * Manages global state for favorites, filters, and user preferences
 */
export const useRecipeStore = defineStore('recipe', {
  // ============================================================================
  // State
  // ============================================================================
  state: () => ({
    favorites: [] as string[],
    recentlyViewed: [] as string[],
    searchHistory: [] as string[],
    excludedAllergens: [] as string[],

    // UI preferences
    viewMode: 'grid' as 'grid' | 'list',
    sortBy: 'relevance' as 'relevance' | 'duration' | 'calories' | 'nutri_score',

    // Cache
    recipesCache: new Map<string, Recipe>(),
    lastSearchResults: [] as RecipeSearchResult[],

    // Search results cache - stores results by query hash
    searchCache: new Map<string, {
      results: RecipeSearchResult[]
      timestamp: number
      query: string
      allergens: string[]
    }>(),
    searchCacheTTL: 1000 * 60 * 30, // 30 minutes cache TTL
  }),

  // ============================================================================
  // Getters
  // ============================================================================
  getters: {
    /**
     * Check if a recipe is favorited
     */
    isFavorite: (state) => (recipeId: string) => {
      return state.favorites.includes(recipeId)
    },

    /**
     * Get total number of favorites
     */
    favoritesCount: (state) => state.favorites.length,

    /**
     * Check if a recipe was recently viewed
     */
    wasRecentlyViewed: (state) => (recipeId: string) => {
      return state.recentlyViewed.includes(recipeId)
    },

    /**
     * Get excluded allergens list
     */
    activeAllergenFilters: (state) => state.excludedAllergens,

    /**
     * Get cached recipe by ID
     */
    getCachedRecipe: (state) => (recipeId: string) => {
      return state.recipesCache.get(recipeId)
    },

    /**
     * Check if allergen is excluded
     */
    isAllergenExcluded: (state) => (allergen: string) => {
      return state.excludedAllergens.includes(allergen)
    },

    /**
     * Get recent search queries (max 10)
     */
    recentSearches: (state) => state.searchHistory.slice(0, 10),
  },

  // ============================================================================
  // Actions
  // ============================================================================
  actions: {
    /**
     * Toggle favorite status for a recipe
     */
    toggleFavorite(recipeId: string) {
      const index = this.favorites.indexOf(recipeId)
      if (index > -1) {
        this.favorites.splice(index, 1)
      } else {
        this.favorites.push(recipeId)
      }
      this.persistFavorites()
    },

    /**
     * Add recipe to favorites
     */
    addFavorite(recipeId: string) {
      if (!this.favorites.includes(recipeId)) {
        this.favorites.push(recipeId)
        this.persistFavorites()
      }
    },

    /**
     * Remove recipe from favorites
     */
    removeFavorite(recipeId: string) {
      const index = this.favorites.indexOf(recipeId)
      if (index > -1) {
        this.favorites.splice(index, 1)
        this.persistFavorites()
      }
    },

    /**
     * Clear all favorites
     */
    clearFavorites() {
      this.favorites = []
      this.persistFavorites()
    },

    /**
     * Add recipe to recently viewed (max 20)
     */
    addToRecentlyViewed(recipeId: string) {
      // Remove if already exists
      const index = this.recentlyViewed.indexOf(recipeId)
      if (index > -1) {
        this.recentlyViewed.splice(index, 1)
      }

      // Add to beginning
      this.recentlyViewed.unshift(recipeId)

      // Keep only last 20
      if (this.recentlyViewed.length > 20) {
        this.recentlyViewed = this.recentlyViewed.slice(0, 20)
      }

      this.persistRecentlyViewed()
    },

    /**
     * Add search query to history (max 10)
     */
    addSearchQuery(query: string) {
      if (!query || query.trim().length === 0) return

      const trimmedQuery = query.trim()

      // Remove if already exists
      const index = this.searchHistory.indexOf(trimmedQuery)
      if (index > -1) {
        this.searchHistory.splice(index, 1)
      }

      // Add to beginning
      this.searchHistory.unshift(trimmedQuery)

      // Keep only last 10
      if (this.searchHistory.length > 10) {
        this.searchHistory = this.searchHistory.slice(0, 10)
      }

      this.persistSearchHistory()
    },

    /**
     * Clear search history
     */
    clearSearchHistory() {
      this.searchHistory = []
      this.persistSearchHistory()
    },

    /**
     * Toggle allergen exclusion
     */
    toggleAllergen(allergen: string) {
      const index = this.excludedAllergens.indexOf(allergen)
      if (index > -1) {
        this.excludedAllergens.splice(index, 1)
      } else {
        this.excludedAllergens.push(allergen)
      }
      this.persistAllergens()
    },

    /**
     * Set excluded allergens
     */
    setExcludedAllergens(allergens: string[]) {
      this.excludedAllergens = [...allergens]
      this.persistAllergens()
    },

    /**
     * Clear all allergen filters
     */
    clearAllergenFilters() {
      this.excludedAllergens = []
      this.persistAllergens()
    },

    /**
     * Cache a recipe for faster access
     */
    cacheRecipe(recipe: Recipe) {
      this.recipesCache.set(recipe.recipe_id, recipe)

      // Limit cache size to 50 recipes
      if (this.recipesCache.size > 50) {
        const firstKey = this.recipesCache.keys().next().value
        if (firstKey) {
          this.recipesCache.delete(firstKey)
        }
      }
    },

    /**
     * Set view mode preference
     */
    setViewMode(mode: 'grid' | 'list') {
      this.viewMode = mode
      this.persistViewMode()
    },

    /**
     * Set sort preference
     */
    setSortBy(sortBy: 'relevance' | 'duration' | 'calories' | 'nutri_score') {
      this.sortBy = sortBy
      this.persistSortBy()
    },

    /**
     * Store last search results
     */
    setLastSearchResults(results: RecipeSearchResult[]) {
      this.lastSearchResults = results
    },

    /**
     * Generate a cache key from search parameters
     */
    generateSearchCacheKey(query: string, allergens: string[] = []): string {
      const normalizedQuery = query.toLowerCase().trim()
      const sortedAllergens = [...allergens].sort().join(',')
      return `${normalizedQuery}|${sortedAllergens}`
    },

    /**
     * Get cached search results if available and not expired
     */
    getCachedSearch(query: string, allergens: string[] = []): RecipeSearchResult[] | null {
      const cacheKey = this.generateSearchCacheKey(query, allergens)
      const cached = this.searchCache.get(cacheKey)

      if (!cached) {
        return null
      }

      // Check if cache is expired
      const now = Date.now()
      if (now - cached.timestamp > this.searchCacheTTL) {
        this.searchCache.delete(cacheKey)
        return null
      }

      return cached.results
    },

    /**
     * Cache search results
     */
    cacheSearchResults(query: string, allergens: string[] = [], results: RecipeSearchResult[]) {
      const cacheKey = this.generateSearchCacheKey(query, allergens)

      this.searchCache.set(cacheKey, {
        results,
        timestamp: Date.now(),
        query,
        allergens: [...allergens]
      })

      // Limit cache size to 50 searches
      if (this.searchCache.size > 50) {
        // Remove oldest entry
        const firstKey = this.searchCache.keys().next().value
        if (firstKey) {
          this.searchCache.delete(firstKey)
        }
      }
    },

    /**
     * Clear search cache
     */
    clearSearchCache() {
      this.searchCache.clear()
    },

    /**
     * Clear expired cache entries
     */
    clearExpiredCache() {
      const now = Date.now()
      const keysToDelete: string[] = []

      this.searchCache.forEach((value, key) => {
        if (now - value.timestamp > this.searchCacheTTL) {
          keysToDelete.push(key)
        }
      })

      keysToDelete.forEach(key => this.searchCache.delete(key))
    },

    /**
     * Initialize store from localStorage
     */
    initialize() {
      if (import.meta.client) {
        this.loadFavorites()
        this.loadRecentlyViewed()
        this.loadSearchHistory()
        this.loadAllergens()
        this.loadViewMode()
        this.loadSortBy()
      }
    },

    /**
     * Reset store to initial state
     */
    reset() {
      this.favorites = []
      this.recentlyViewed = []
      this.searchHistory = []
      this.excludedAllergens = []
      this.viewMode = 'grid'
      this.sortBy = 'relevance'
      this.recipesCache.clear()
      this.lastSearchResults = []

      if (import.meta.client) {
        localStorage.removeItem('recipe-favorites')
        localStorage.removeItem('recipe-recently-viewed')
        localStorage.removeItem('recipe-search-history')
        localStorage.removeItem('recipe-allergens')
        localStorage.removeItem('recipe-view-mode')
        localStorage.removeItem('recipe-sort-by')
      }
    },

    // ============================================================================
    // Persistence Helpers
    // ============================================================================

    persistFavorites() {
      if (import.meta.client) {
        localStorage.setItem('recipe-favorites', JSON.stringify(this.favorites))
      }
    },

    loadFavorites() {
      if (import.meta.client) {
        const stored = localStorage.getItem('recipe-favorites')
        if (stored) {
          try {
            this.favorites = JSON.parse(stored)
          } catch (e) {
            console.error('Failed to load favorites:', e)
          }
        }
      }
    },

    persistRecentlyViewed() {
      if (import.meta.client) {
        localStorage.setItem('recipe-recently-viewed', JSON.stringify(this.recentlyViewed))
      }
    },

    loadRecentlyViewed() {
      if (import.meta.client) {
        const stored = localStorage.getItem('recipe-recently-viewed')
        if (stored) {
          try {
            this.recentlyViewed = JSON.parse(stored)
          } catch (e) {
            console.error('Failed to load recently viewed:', e)
          }
        }
      }
    },

    persistSearchHistory() {
      if (import.meta.client) {
        localStorage.setItem('recipe-search-history', JSON.stringify(this.searchHistory))
      }
    },

    loadSearchHistory() {
      if (import.meta.client) {
        const stored = localStorage.getItem('recipe-search-history')
        if (stored) {
          try {
            this.searchHistory = JSON.parse(stored)
          } catch (e) {
            console.error('Failed to load search history:', e)
          }
        }
      }
    },

    persistAllergens() {
      if (import.meta.client) {
        localStorage.setItem('recipe-allergens', JSON.stringify(this.excludedAllergens))
      }
    },

    loadAllergens() {
      if (import.meta.client) {
        const stored = localStorage.getItem('recipe-allergens')
        if (stored) {
          try {
            this.excludedAllergens = JSON.parse(stored)
          } catch (e) {
            console.error('Failed to load allergens:', e)
          }
        }
      }
    },

    persistViewMode() {
      if (import.meta.client) {
        localStorage.setItem('recipe-view-mode', this.viewMode)
      }
    },

    loadViewMode() {
      if (import.meta.client) {
        const stored = localStorage.getItem('recipe-view-mode')
        if (stored === 'grid' || stored === 'list') {
          this.viewMode = stored
        }
      }
    },

    persistSortBy() {
      if (import.meta.client) {
        localStorage.setItem('recipe-sort-by', this.sortBy)
      }
    },

    loadSortBy() {
      if (import.meta.client) {
        const stored = localStorage.getItem('recipe-sort-by')
        if (stored === 'relevance' || stored === 'duration' || stored === 'calories' || stored === 'nutri_score') {
          this.sortBy = stored
        }
      }
    },
  }
})
