import { defineStore } from 'pinia'
import type { Recipe, RecipeDishType, RecipeParamSortBy, RecipeSearchResult, RecipeSource } from '~/services/recipeApi'

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
    selectedSources: [] as RecipeSource[],
    selectedDishTypes: [] as RecipeDishType[],
    compareList: [] as string[], // Recipe IDs for comparison

    // UI preferences
    viewMode: 'grid' as 'grid' | 'list',
    sortBy: null as RecipeParamSortBy | null,

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

    /**
     * Check if recipe is in compare list
     */
    isInCompareList: (state) => (recipeId: string) => {
      return state.compareList.includes(recipeId)
    },

    /**
     * Get compare list count
     */
    compareCount: (state) => state.compareList.length,
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
    setSortBy(sortBy: RecipeParamSortBy | null) {
      this.sortBy = sortBy
      this.persistSortBy()
    },

    toggleSource(source: RecipeSource) {
      const idx = this.selectedSources.indexOf(source)
      if (idx >= 0) this.selectedSources.splice(idx, 1)
      else this.selectedSources.push(source)
      this.persistSources()
    },

    toggleDishType(dishType: RecipeDishType) {
      const idx = this.selectedDishTypes.indexOf(dishType)
      if (idx >= 0) this.selectedDishTypes.splice(idx, 1)
      else this.selectedDishTypes.push(dishType)
      this.persistDishTypes()
    },

    clearSourceFilters() {
      this.selectedSources = []
      this.persistSources()
    },

    clearDishTypeFilters() {
      this.selectedDishTypes = []
      this.persistDishTypes()
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
     * Toggle recipe in compare list (max 4 recipes)
     */
    toggleCompare(recipeId: string) {
      const index = this.compareList.indexOf(recipeId)
      if (index > -1) {
        this.compareList.splice(index, 1)
      } else {
        // Limit to 4 recipes for comparison
        if (this.compareList.length < 4) {
          this.compareList.push(recipeId)
        }
      }
      this.persistCompareList()
    },

    /**
     * Add recipe to compare list
     */
    addToCompare(recipeId: string) {
      if (!this.compareList.includes(recipeId) && this.compareList.length < 4) {
        this.compareList.push(recipeId)
        this.persistCompareList()
      }
    },

    /**
     * Remove recipe from compare list
     */
    removeFromCompare(recipeId: string) {
      const index = this.compareList.indexOf(recipeId)
      if (index > -1) {
        this.compareList.splice(index, 1)
        this.persistCompareList()
      }
    },

    /**
     * Clear compare list
     */
    clearCompareList() {
      this.compareList = []
      this.persistCompareList()
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
        this.loadSources()
        this.loadDishTypes()
        this.loadViewMode()
        this.loadSortBy()
        this.loadCompareList()
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
      this.selectedSources = []
      this.selectedDishTypes = []
      this.viewMode = 'grid'
      this.sortBy = null
      this.compareList = []
      this.recipesCache.clear()
      this.lastSearchResults = []

      if (import.meta.client) {
        localStorage.removeItem('recipe-favorites')
        localStorage.removeItem('recipe-recently-viewed')
        localStorage.removeItem('recipe-search-history')
        localStorage.removeItem('recipe-allergens')
        localStorage.removeItem('recipe-sources')
        localStorage.removeItem('recipe-dish-types')
        localStorage.removeItem('recipe-view-mode')
        localStorage.removeItem('recipe-sort-by')
        localStorage.removeItem('recipe-compare-list')
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
        if (this.sortBy) localStorage.setItem('recipe-sort-by', this.sortBy)
        else localStorage.removeItem('recipe-sort-by')
      }
    },

    loadSortBy() {
      if (import.meta.client) {
        const stored = localStorage.getItem('recipe-sort-by')
        const valid: RecipeParamSortBy[] = ['title_asc', 'title_desc', 'time_asc', 'time_desc', 'random']
        this.sortBy = valid.includes(stored as RecipeParamSortBy) ? (stored as RecipeParamSortBy) : null
      }
    },

    persistSources() {
      if (import.meta.client) {
        localStorage.setItem('recipe-sources', JSON.stringify(this.selectedSources))
      }
    },

    loadSources() {
      if (import.meta.client) {
        const stored = localStorage.getItem('recipe-sources')
        if (stored) {
          try { this.selectedSources = JSON.parse(stored) } catch { this.selectedSources = [] }
        } else {
          this.selectedSources = ['healthyfoods', 'irish_safefood', 'foodhero']
        }
      }
    },

    persistDishTypes() {
      if (import.meta.client) {
        localStorage.setItem('recipe-dish-types', JSON.stringify(this.selectedDishTypes))
      }
    },

    loadDishTypes() {
      if (import.meta.client) {
        const stored = localStorage.getItem('recipe-dish-types')
        if (stored) {
          try { this.selectedDishTypes = JSON.parse(stored) } catch { this.selectedDishTypes = [] }
        }
      }
    },

    persistCompareList() {
      if (import.meta.client) {
        localStorage.setItem('recipe-compare-list', JSON.stringify(this.compareList))
      }
    },

    loadCompareList() {
      if (import.meta.client) {
        const stored = localStorage.getItem('recipe-compare-list')
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed)) {
              const normalized = parsed
                .map(item => String(item || '').trim())
                .filter(item => item.length > 0)
                .slice(0, 4)
              // Do not clobber an in-memory selection with an empty persisted list.
              if (normalized.length > 0 || this.compareList.length === 0) {
                this.compareList = normalized
              }
            }
          } catch (e) {
            console.error('Failed to load compare list:', e)
          }
        }
      }
    },
  }
})
