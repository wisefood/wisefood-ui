import { ref, computed } from 'vue'
import articlesApi from '~/services/articlesApi'
import type {
  Article,
  ArticleSearchParams,
  ArticleListResponse,
  CreateArticleRequest,
  UpdateArticleRequest
} from '~/services/articlesApi'
import type { ApiError } from '~/services/wisefoodApi'

// Elasticsearch refuses to serve results where offset + limit exceeds its
// result window (default 10000). Clamp the total used for pagination so the UI
// never renders a page button that would request a rejected window. The real
// total is still shown to the user separately.
const DEFAULT_MAX_RESULT_WINDOW = 10000

export function navigableTotal(
  total: number,
  limit: number,
  maxResultWindow: number = DEFAULT_MAX_RESULT_WINDOW
): number {
  if (!total || total <= 0) return 0
  const window = maxResultWindow > 0 ? maxResultWindow : DEFAULT_MAX_RESULT_WINDOW
  if (limit <= 0) return Math.min(total, window)
  // The last fully-reachable page starts at an offset < window. Round the window
  // down to a whole number of pages so the final page never spills past it.
  const reachable = Math.floor(window / limit) * limit
  return Math.min(total, reachable)
}

export function useArticles() {
  const articles = ref<Article[]>([])
  const currentArticle = ref<Article | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalResults = ref(0)
  const totalPages = ref(0)
  const currentPage = ref(1)
  // Largest offset+limit the backend will serve. Defaults to ES's standard
  // 10000 window until a response tells us otherwise.
  const maxResultWindow = ref(10000)

  /**
   * Fetch articles with optional search/filter parameters
   */
  const fetchArticles = async (params?: ArticleSearchParams) => {
    loading.value = true
    error.value = null

    try {
      const response: ArticleListResponse = await articlesApi.getArticles(params)
      articles.value = response.result.results
      totalResults.value = response.result.total
      maxResultWindow.value = response.result.max_result_window ?? maxResultWindow.value

      // Calculate pages based on limit/offset, clamped to the navigable window.
      const limit = params?.limit || 10
      totalPages.value = Math.ceil(navigableTotal(response.result.total, limit) / limit)
      currentPage.value = Math.floor((params?.offset || 0) / limit) + 1

      return response
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch articles'
      console.error('Error fetching articles:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch a single article by URN
   */
  const fetchArticle = async (urn: string) => {
    loading.value = true
    error.value = null

    try {
      const article = await articlesApi.getArticle(urn)
      currentArticle.value = article
      return article
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch article'
      console.error('Error fetching article:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Search articles using POST /api/v1/articles/search
   */
  const searchArticles = async (searchParams: ArticleSearchParams) => {
    loading.value = true
    error.value = null

    try {
      const response = await articlesApi.searchArticles(searchParams)
      articles.value = response.result.results
      totalResults.value = response.result.total
      maxResultWindow.value = response.result.max_result_window ?? maxResultWindow.value

      // Calculate pages based on limit/offset, clamped to the navigable window.
      const limit = searchParams.limit || 10
      totalPages.value = Math.ceil(navigableTotal(response.result.total, limit) / limit)
      currentPage.value = Math.floor((searchParams.offset || 0) / limit) + 1

      return response
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to search articles'
      console.error('Error searching articles:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new article
   */
  const createArticle = async (article: CreateArticleRequest) => {
    loading.value = true
    error.value = null

    try {
      const newArticle = await articlesApi.createArticle(article)
      currentArticle.value = newArticle
      return newArticle
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to create article'
      console.error('Error creating article:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an article by URN
   */
  const updateArticle = async (urn: string, updates: UpdateArticleRequest) => {
    loading.value = true
    error.value = null

    try {
      const updatedArticle = await articlesApi.updateArticle(urn, updates)
      currentArticle.value = updatedArticle
      return updatedArticle
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to update article'
      console.error('Error updating article:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete an article by URN
   */
  const deleteArticle = async (urn: string) => {
    loading.value = true
    error.value = null

    try {
      await articlesApi.deleteArticle(urn)
      currentArticle.value = null
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to delete article'
      console.error('Error deleting article:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Enhance an article by URN (AI processing)
   */
  const enhanceArticle = async (urn: string) => {
    loading.value = true
    error.value = null

    try {
      const enhancedArticle = await articlesApi.enhanceArticle(urn)
      currentArticle.value = enhancedArticle
      return enhancedArticle
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to enhance article'
      console.error('Error enhancing article:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Clear error
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Reset state
   */
  const reset = () => {
    articles.value = []
    currentArticle.value = null
    loading.value = false
    error.value = null
    totalResults.value = 0
    totalPages.value = 0
    currentPage.value = 1
  }

  return {
    // State
    articles: computed(() => articles.value),
    currentArticle: computed(() => currentArticle.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    totalResults: computed(() => totalResults.value),
    totalPages: computed(() => totalPages.value),
    currentPage: computed(() => currentPage.value),
    maxResultWindow: computed(() => maxResultWindow.value),

    // Methods
    fetchArticles,
    fetchArticle,
    searchArticles,
    createArticle,
    updateArticle,
    deleteArticle,
    enhanceArticle,
    clearError,
    reset,
  }
}
