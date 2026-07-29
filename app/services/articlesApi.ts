import wisefoodApi from './wisefoodApi'
import type { CatalogArtifact } from './catalogApi'

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

/**
 * Which readers an article reaches. Distinct from `visibility`, which gates
 * staff/API access — this is about the end reader.
 *
 * Articles indexed before the field existed return it as undefined, which every
 * consumer must treat as 'public'.
 */
export type ReaderVisibility = 'public' | 'expert_only' | 'hidden'

/**
 * Retrieval priority. 'prime' is above anything the enrichment agent can assign,
 * so it always means a deliberate editorial promotion; 'do_not_index' keeps the
 * article in the catalog but out of retrieval.
 */
export type IndexingTier
  = | 'prime'
    | 'core'
    | 'supportive'
    | 'specialized'
    | 'archive_only'
    | 'do_not_index'

export const READER_VISIBILITIES: ReaderVisibility[] = ['public', 'expert_only', 'hidden']

export const INDEXING_TIERS: IndexingTier[] = [
  'prime',
  'core',
  'supportive',
  'specialized',
  'archive_only',
  'do_not_index'
]

export const READER_VISIBILITY_LABELS: Record<ReaderVisibility, string> = {
  public: 'All readers',
  expert_only: 'Experts only',
  hidden: 'Hidden'
}

export const READER_VISIBILITY_HINTS: Record<ReaderVisibility, string> = {
  public: 'Everyone can read this article and it can be cited in any answer.',
  expert_only:
    'Hidden from beginner and intermediate readers, and never cited in their answers. Experts still see it.',
  hidden: 'Hidden from every reader. Still visible here in the console.'
}

export const INDEXING_TIER_LABELS: Record<IndexingTier, string> = {
  prime: 'Prime',
  core: 'Core',
  supportive: 'Supportive',
  specialized: 'Specialized',
  archive_only: 'Archive only',
  do_not_index: 'Do not index'
}

export const INDEXING_TIER_HINTS: Record<IndexingTier, string> = {
  prime: 'Influential work — surfaced ahead of better-matching but ordinary articles.',
  core: 'Strong evidence, favoured in retrieval.',
  supportive: 'Neutral: ranked purely on relevance.',
  specialized: 'Narrow relevance, slightly de-prioritised.',
  archive_only: 'Kept for completeness, rarely surfaced.',
  do_not_index: 'Never used as evidence.'
}

/** An absent reader_visibility means the article predates the field. */
export function effectiveReaderVisibility(article: Partial<Article>): ReaderVisibility {
  return article.reader_visibility ?? 'public'
}

/** The editor's tier wins; otherwise the agent's proposal, if any. */
export function effectiveIndexingTier(article: Partial<Article>): IndexingTier | null {
  return article.indexing_tier ?? article.ai_indexing_tier ?? null
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
  visibility?: string | null
  review_status?: string | null
  applicability_status?: string | null
  applicability_start_date?: string | null
  applicability_end_date?: string | null

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

  // Editorial controls (human-authoritative, set from the console)
  // Undefined on articles indexed before these fields existed: treat
  // reader_visibility as 'public' and indexing_tier as unset.
  reader_visibility?: ReaderVisibility | null
  indexing_tier?: IndexingTier | null

  // AI-derived classification (read-only)
  ai_tags: string[]
  ai_category?: string | null
  ai_indexing_tier?: IndexingTier | null
  key_takeaways: string[]
  ai_key_takeaways: string[]

  // Extras field with enriched metadata
  extras?: ArticleExtras
  artifacts?: CatalogArtifact[] | null

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
    // Largest offset+limit the backend will serve (ES result window). Used to
    // clamp pagination so the UI never requests a page the API rejects.
    max_result_window?: number
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
  urn: string
  title: string
  content: string
  venue: string
  authors: string[]
  organization_urn?: string
  abstract?: string
  description?: string
  publication_year?: string
  url?: string
  external_id?: string
  doi?: string
  keywords?: string[]
  reader_group?: string
  age_group?: string
  population_group?: string
  geographic_context?: GeographicContext | null
  biological_model?: string
  topics?: string[]
  study_type?: string
  hard_exclusion_flags?: string[]
  annotation_confidence?: number | null
  extras?: ArticleExtras | Record<string, unknown> | null
  tags?: string[]
  category?: string
  region?: string
  language?: string
  license?: string
  open_access?: boolean | null
  citation_count?: number | null
  reference_count?: number | null
  influential_citation_count?: number | null
  type?: string | null
  key_takeaways?: string[]
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
  url?: string
  external_id?: string
  doi?: string
  keywords?: string[]
  reader_group?: string | null
  age_group?: string | null
  population_group?: string | null
  geographic_context?: GeographicContext | null
  biological_model?: string | null
  topics?: string[]
  study_type?: string | null
  hard_exclusion_flags?: string[]
  annotation_confidence?: number | null
  extras?: ArticleExtras | Record<string, unknown> | null
  tags?: string[]
  key_takeaways?: string[]
  category?: string
  region?: string
  language?: string
  license?: string | null
  open_access?: boolean | null
  citation_count?: number | null
  reference_count?: number | null
  influential_citation_count?: number | null
  type?: string | null
  reader_visibility?: ReaderVisibility | null
  indexing_tier?: IndexingTier | null
}

/**
 * Batch edit of reader visibility and/or indexing tier.
 *
 * Selection uses the same semantics as `searchArticles`, so the console can
 * apply a change to exactly the result set the editor is browsing: pass `urns`
 * for an explicit selection, `q`/`fq` for a query, or both. At least one
 * selector is required — the API rejects a change with no selection rather than
 * applying it to the whole corpus.
 */
export interface ArticlePolicyRequest {
  urns?: string[]
  q?: string | null
  fq?: string[] | null
  reader_visibility?: ReaderVisibility
  indexing_tier?: IndexingTier
  /** Drop the editorial tier so the agent's ai_indexing_tier applies again. */
  clear_indexing_tier?: boolean
  /** Cap on documents to update. The API's hard cap is 10000. */
  max_docs?: number
  /** Report what would change without writing anything. */
  dry_run?: boolean
}

export interface ArticlePolicySample {
  urn: string
  title?: string
  reader_visibility?: ReaderVisibility | null
  indexing_tier?: IndexingTier | null
  ai_indexing_tier?: IndexingTier | null
}

export interface ArticlePolicyResult {
  dry_run: boolean
  /** Articles the selection matched. */
  matched: number
  /** Articles actually changed (0 for a dry run). */
  updated: number
  /** True when `matched` exceeded `max_docs` and the update was truncated. */
  capped: boolean
  max_docs: number
  version_conflicts?: number
  failures?: unknown[]
  /** First page of matched articles, for the confirmation dialog. */
  sample: ArticlePolicySample[]
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
   * POST /api/v1/articles/policy
   * Batch-edit reader visibility and/or indexing tier.
   *
   * Always preview first with `dry_run: true` when selecting by query — the
   * result reports how many articles would change and samples them.
   */
  async setArticlePolicy(request: ArticlePolicyRequest): Promise<ArticlePolicyResult> {
    const response = await wisefoodApi.post<{ result: ArticlePolicyResult }>(
      '/v1/articles/policy',
      request
    )
    return response.result
  }

  /**
   * Convenience: preview a batch policy change without writing.
   */
  async previewArticlePolicy(request: ArticlePolicyRequest): Promise<ArticlePolicyResult> {
    return this.setArticlePolicy({ ...request, dry_run: true })
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

  async autocompleteArticles(q: string, limit = 8): Promise<Array<{ urn: string; title: string; venue?: string | null; ai_category?: string | null }>> {
    const normalized = q.trim()
    if (normalized.length < 2) return []
    const res = await wisefoodApi.get<{ result: Array<{ urn: string; title: string; venue?: string | null; ai_category?: string | null }> }>('/v1/articles/autocomplete', { params: { q: normalized, limit } })
    return Array.isArray(res?.result) ? res.result : []
  }
}

export default new ArticlesApiService()
