import { defineStore } from 'pinia'
import { watch } from 'vue'
import type { Recipe, RecipeDishType, RecipeParamSortBy, RecipeSearchResult, RecipeSource } from '~/services/recipeApi'
import memberFavoritesApi from '~/services/memberFavoritesApi'
import { useHouseholdStore } from '~/stores/household'

const FAVORITES_MIGRATED_KEY = 'recipe-favorites-migrated'

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
    // Member whose favorites are currently loaded (null = local-only fallback)
    favoritesMemberId: null as string | null,
    favoritesLoading: false,
    favoritesSyncStarted: false,
    recentlyViewed: [] as string[],
    searchHistory: [] as string[],
    excludedAllergens: [] as string[],
    selectedSources: [] as RecipeSource[],
    selectedDishTypes: [] as RecipeDishType[],
    selectedDietTags: [] as string[],
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
      if (this.favorites.includes(recipeId)) {
        this.removeFavorite(recipeId)
      } else {
        this.addFavorite(recipeId)
      }
    },

    /**
     * Add recipe to favorites (optimistic — synced to the API when a member is selected)
     */
    addFavorite(recipeId: string) {
      if (this.favorites.includes(recipeId)) return
      this.favorites.push(recipeId)
      this.persistFavorites()
      this.syncFavoriteAdd(recipeId)
    },

    /**
     * Remove recipe from favorites (optimistic — synced to the API when a member is selected)
     */
    removeFavorite(recipeId: string) {
      const index = this.favorites.indexOf(recipeId)
      if (index === -1) return
      this.favorites.splice(index, 1)
      this.persistFavorites()
      this.syncFavoriteRemove(recipeId)
    },

    /**
     * Clear all favorites
     */
    clearFavorites() {
      const removed = [...this.favorites]
      this.favorites = []
      this.persistFavorites()
      removed.forEach(recipeId => this.syncFavoriteRemove(recipeId))
    },

    /**
     * Push an added favorite to the API, reverting local state on failure
     */
    syncFavoriteAdd(recipeId: string) {
      const memberId = this.favoritesMemberId
      if (!memberId) return

      memberFavoritesApi.addFavorite(memberId, recipeId).catch((e) => {
        console.error('[RecipeStore] Failed to add favorite on server, reverting:', e)
        // Revert only if the same member is still active and the entry is still present
        if (this.favoritesMemberId !== memberId) return
        const index = this.favorites.indexOf(recipeId)
        if (index > -1) {
          this.favorites.splice(index, 1)
          this.persistFavorites()
        }
      })
    },

    /**
     * Push a removed favorite to the API, reverting local state on failure
     */
    syncFavoriteRemove(recipeId: string) {
      const memberId = this.favoritesMemberId
      if (!memberId) return

      memberFavoritesApi.removeFavorite(memberId, recipeId).catch((e) => {
        console.error('[RecipeStore] Failed to remove favorite on server, reverting:', e)
        // Revert only if the same member is still active and the entry is still absent
        if (this.favoritesMemberId !== memberId) return
        if (!this.favorites.includes(recipeId)) {
          this.favorites.push(recipeId)
          this.persistFavorites()
        }
      })
    },

    /**
     * Load favorites for a member from the API.
     * Falls back to the localStorage copy on failure so the recipes page keeps working.
     */
    async loadFavoritesFromApi(memberId: string) {
      this.favoritesLoading = true
      try {
        const entries = await memberFavoritesApi.listFavorites(memberId)
        const serverIds = entries.map(entry => entry.recipe_id).filter(Boolean)
        const migratedIds = await this.migrateLocalFavorites(memberId, serverIds)

        // Ignore stale responses if the member changed while loading
        if (this.favoritesMemberId !== memberId) return

        this.favorites = [...new Set([...serverIds, ...migratedIds])]
        this.persistFavorites()
      } catch (e) {
        console.error('[RecipeStore] Failed to load favorites from API, using local fallback:', e)
        this.loadFavorites()
      } finally {
        this.favoritesLoading = false
      }
    },

    /**
     * One-time migration of pre-existing localStorage favorites to the server.
     * PUTs each local favorite missing server-side, then marks localStorage as
     * migrated so it only runs once. Returns the recipe IDs that were migrated.
     */
    async migrateLocalFavorites(memberId: string, serverIds: string[]): Promise<string[]> {
      if (!import.meta.client) return []
      if (localStorage.getItem(FAVORITES_MIGRATED_KEY) === 'true') return []

      let localIds: string[] = []
      const stored = localStorage.getItem('recipe-favorites')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            localIds = parsed.map(item => String(item || '').trim()).filter(Boolean)
          }
        } catch (e) {
          console.error('[RecipeStore] Failed to parse local favorites for migration:', e)
        }
      }

      const missing = localIds.filter(id => !serverIds.includes(id))
      if (missing.length === 0) {
        localStorage.setItem(FAVORITES_MIGRATED_KEY, 'true')
        return []
      }

      const results = await Promise.allSettled(
        missing.map(recipeId => memberFavoritesApi.addFavorite(memberId, recipeId))
      )

      const migrated: string[] = []
      let failures = 0
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          migrated.push(missing[idx]!)
        } else {
          failures++
          console.error('[RecipeStore] Failed to migrate local favorite:', missing[idx], result.reason)
        }
      })

      // Only mark as migrated once every local favorite made it server-side;
      // PUT is idempotent so a retry on the next load is safe.
      if (failures === 0) {
        localStorage.setItem(FAVORITES_MIGRATED_KEY, 'true')
      }

      return migrated
    },

    /**
     * Watch the selected household member and (re)load their favorites from
     * the API. With no member selected, favorites stay localStorage-backed.
     */
    startFavoritesSync() {
      if (this.favoritesSyncStarted || !import.meta.client) return
      this.favoritesSyncStarted = true

      const householdStore = useHouseholdStore()
      watch(
        () => householdStore.currentMember?.id ?? null,
        (memberId) => {
          this.favoritesMemberId = memberId
          if (memberId) {
            this.loadFavoritesFromApi(memberId)
          } else {
            // Unauthenticated / no member selected: local-only behavior
            this.loadFavorites()
          }
        },
        { immediate: true }
      )
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

    toggleDietTag(tag: string) {
      const idx = this.selectedDietTags.indexOf(tag)
      if (idx >= 0) this.selectedDietTags.splice(idx, 1)
      else this.selectedDietTags.push(tag)
      this.persistDietTags()
    },

    clearSourceFilters() {
      this.selectedSources = []
      this.persistSources()
    },

    clearDietTagFilters() {
      this.selectedDietTags = []
      this.persistDietTags()
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
        this.startFavoritesSync()
        this.loadRecentlyViewed()
        this.loadSearchHistory()
        this.loadAllergens()
        this.loadSources()
        this.loadDishTypes()
        this.loadDietTags()
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
      this.favoritesMemberId = null
      this.favoritesLoading = false
      this.recentlyViewed = []
      this.searchHistory = []
      this.excludedAllergens = []
      this.selectedSources = []
      this.selectedDishTypes = []
      this.selectedDietTags = []
      this.viewMode = 'grid'
      this.sortBy = null
      this.compareList = []
      this.recipesCache.clear()
      this.lastSearchResults = []

      if (import.meta.client) {
        localStorage.removeItem('recipe-favorites')
        localStorage.removeItem(FAVORITES_MIGRATED_KEY)
        localStorage.removeItem('recipe-recently-viewed')
        localStorage.removeItem('recipe-search-history')
        localStorage.removeItem('recipe-allergens')
        localStorage.removeItem('recipe-sources')
        localStorage.removeItem('recipe-dish-types')
        localStorage.removeItem('recipe-diet-tags')
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

    persistDietTags() {
      if (import.meta.client) {
        localStorage.setItem('recipe-diet-tags', JSON.stringify(this.selectedDietTags))
      }
    },

    loadDietTags() {
      if (import.meta.client) {
        const stored = localStorage.getItem('recipe-diet-tags')
        if (stored) {
          try { this.selectedDietTags = JSON.parse(stored) } catch { this.selectedDietTags = [] }
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
