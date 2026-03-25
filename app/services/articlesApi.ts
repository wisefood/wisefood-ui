import wisefoodApi from './wisefoodApi'
import type { RequestOptions } from './wisefoodApi'

// Glossary term definition
export interface GlossaryTerm {
  term: string
  definition: string
  rationale?: string
}

// Q&A item for different audience levels
export interface QAItem {
  question: string
  answer: string
  grounding?: string
}

// Article evaluation metrics
export interface ArticleEvaluation {
  safety_sensitivity?: string
  actionability_score?: number
  user_value_score?: number
  verdict?: string[]
  recommended_user_framing?: string
}

// Article annotations (AI-generated insights)
export interface ArticleAnnotations {
  glosary?: GlossaryTerm[]  // Note: API has typo "glosary"
  abstract?: string  // Simplified abstract
  original_abstract?: string
  user_qa?: QAItem[]
  practitioner_qa?: QAItem[]
  expert_qa?: QAItem[]
}

// Article extras containing enriched metadata
export interface ArticleExtras {
  // Legacy (some environments still return these inside extras)
  population_group?: string
  study_type?: string
  reader_group?: string

  evaluation?: ArticleEvaluation
  annotations?: ArticleAnnotations
  enriched_at?: string
  enhance_agent?: string
  enhance_fields?: {
    ai_tags?: string[]
    ai_category?: string
    ai_key_takeaways?: string[]
  }
}

export interface GeographicContext {
  country_or_region?: string | null
  income_setting?: string | null
}

export interface Article {
  // Base fields (from BaseSchema)
  id: string | number // Backend id may be UUID string
  urn: string // URN identifier (used in API paths)
  title: string
  created_at: string
  updated_at: string

  // System / embedding
  embedded_at?: string | null
  type?: string | string[] | null

  // Bibliographic & content
  status?: string | null
  creator?: string | null
  url?: string | null
  license?: string | null
  open_access?: boolean | null
  version?: string | null

  organization_urn?: string | null
  abstract?: string | null
  description?: string | null
  content: string
  authors: string[]
  venue?: string | null
  publication_year?: string | null // ISO date string (YYYY-01-01)
  external_id?: string | null
  doi?: string | null
  citation_count?: number | null
  reference_count?: number | null
  influential_citation_count?: number | null
  keywords?: string[] | null

  // Human-authoritative classification
  tags: string[]
  category?: string | null
  region?: string | null
  language?: string | null
  reader_group?: string | null
  age_group?: string | null
  population_group?: string | null
  geographic_context?: GeographicContext | null
  biological_model?: string | null
  topics?: string[] | null
  study_type?: string | null
  hard_exclusion_flags?: string[] | null
  annotation_confidence?: number | null

  // AI-derived classification (read-only)
  ai_tags: string[]
  ai_category?: string | null
  key_takeaways: string[]
  ai_key_takeaways: string[]

  // Extras field with enriched metadata
  extras?: ArticleExtras

  // Optional computed/frontend fields (not from backend schema)
  readTime?: number
  reactions?: {
    helpful: number
    insightful: number
    interesting: number
  }
  citations?: number
}

export interface ArticleListResponse {
  help: string
  success: boolean
  result: {
    results: Article[]
    facets: Record<string, any>
    total: number
  }
}

export interface ArticleResponse {
  help: string
  success: boolean
  result: Article
}

export interface ArticleSearchParams {
  // Full-text search query
  q?: string | null

  // Pagination
  limit?: number // Maximum number of results (1-1000), default 10
  offset?: number // Number of results to skip, default 0

  // Field list (fields to include in response)
  fl?: string[] | null // e.g., ['urn', 'title', 'authors', 'tags']

  // Filter queries
  fq?: string[] | null // e.g., ['status:active', 'category:Health']

  // Sorting
  sort?: string | null // e.g., 'created_at desc', 'publication_year asc'

  // Faceting (aggregation fields)
  fields?: string[] | null // Fields to aggregate for faceting

  // Facet settings
  facet_limit?: number // Max facet buckets per field (1-1000), default 50

  // Highlighting
  highlight?: boolean // Whether to return highlighted snippets, default false
  highlight_fields?: string[] | null // Fields to highlight
  highlight_pre_tag?: string // Prefix for highlights, default "<em>"
  highlight_post_tag?: string // Suffix for highlights, default "</em>"
}

export interface CreateArticleRequest {
  title: string
  content: string
  organization_urn?: string
  abstract?: string
  description?: string
  authors?: string[]
  venue?: string
  publication_year?: string
  external_id?: string
  doi?: string
  tags?: string[]
  category?: string
  region?: string
  language?: string
}

export interface UpdateArticleRequest {
  title?: string
  content?: string
  organization_urn?: string
  abstract?: string
  description?: string
  authors?: string[]
  venue?: string
  publication_year?: string
  external_id?: string
  doi?: string
  tags?: string[]
  category?: string
  region?: string
  language?: string
}

class ArticlesApiService {
  /**
   * GET /api/v1/articles
   * List articles with optional query parameters
   */
  async getArticles(params?: ArticleSearchParams): Promise<ArticleListResponse> {
    return wisefoodApi.get<ArticleListResponse>('/v1/articles', { params: params as any })
  }

  /**
   * POST /api/v1/articles
   * Create a new article
   */
  async createArticle(article: CreateArticleRequest): Promise<Article> {
    const response = await wisefoodApi.post<ArticleResponse>('/v1/articles', article)
    return response.result
  }

  /**
   * GET /api/v1/articles/fetch
   * Fetch articles (specialized endpoint, adjust params as needed based on backend)
   */
  async fetchArticles(params?: ArticleSearchParams): Promise<ArticleListResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {}

    if (params) {
      if (params.limit !== undefined) queryParams.limit = params.limit
      if (params.offset !== undefined) queryParams.offset = params.offset
      // Add other relevant params as needed
    }

    return wisefoodApi.get<ArticleListResponse>('/v1/articles/fetch', { params: queryParams })
  }

  /**
   * GET /api/v1/articles/{urn}
   * Get article details by URN
   */
  async getArticle(urn: string): Promise<Article> {
    const response = await wisefoodApi.get<ArticleResponse>(`/v1/articles/${urn}`)
    return response.result
  }

  /**
   * PATCH /api/v1/articles/{urn}
   * Update article details
   */
  async updateArticle(urn: string, updates: UpdateArticleRequest): Promise<Article> {
    const response = await wisefoodApi.patch<ArticleResponse>(`/v1/articles/${urn}`, updates)
    return response.result
  }

  /**
   * DELETE /api/v1/articles/{urn}
   * Delete an article
   */
  async deleteArticle(urn: string): Promise<void> {
    return wisefoodApi.delete<void>(`/v1/articles/${urn}`)
  }

  /**
   * POST /api/v1/articles/search
   * Search articles using POST method with Solr parameters
   */
  async searchArticles(searchParams: ArticleSearchParams): Promise<ArticleListResponse> {
    return wisefoodApi.post<ArticleListResponse>('/v1/articles/search', searchParams)
  }

  /**
   * PATCH /api/v1/articles/{urn}/enhance
   * Enhance an article (AI processing)
   */
  async enhanceArticle(urn: string): Promise<Article> {
    const response = await wisefoodApi.patch<ArticleResponse>(`/v1/articles/${urn}/enhance`)
    return response.result
  }

  /**
   * Convenience method: Get articles by category using filter query
   */
  async getArticlesByCategory(category: string, params?: ArticleSearchParams): Promise<ArticleListResponse> {
    const fq = params?.fq || []
    return this.searchArticles({ ...params, fq: [...fq, `category:${category}`] })
  }

  /**
   * Convenience method: Get articles by tags using filter query
   */
  async getArticlesByTags(tags: string[], params?: ArticleSearchParams): Promise<ArticleListResponse> {
    const fq = params?.fq || []
    const tagFilters = tags.map(tag => `tags:${tag}`)
    return this.searchArticles({ ...params, fq: [...fq, ...tagFilters] })
  }

  /**
   * Convenience method: Get articles by author using filter query
   */
  async getArticlesByAuthor(author: string, params?: ArticleSearchParams): Promise<ArticleListResponse> {
    const fq = params?.fq || []
    return this.searchArticles({ ...params, fq: [...fq, `authors:${author}`] })
  }
}

export default new ArticlesApiService()
