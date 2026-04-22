import wisefoodApi from './wisefoodApi'

export interface Textbook {
  id: string | number
  urn: string
  title: string
  authors?: string[] | null
  editors?: string[] | null
  publisher?: string | null
  edition?: string | null
  publication_year?: string | number | null
  isbn?: string | null
  language?: string | null
  subject?: string | null
  topics?: string[] | null
  tags?: string[] | null
  ai_tags?: string[] | null
  description?: string | null
  cover_url?: string | null
  status?: string | null
  visibility?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface TextbookSuggestion {
  urn: string
  title: string
  authors?: string[] | null
  publication_year?: string | number | null
}

export interface TextbookSearchParams {
  q?: string | null
  limit?: number
  offset?: number
  fl?: string[] | null
  fq?: string[] | null
  sort?: string | null
  fields?: string[] | null
  facet_limit?: number
  highlight?: boolean
  highlight_fields?: string[] | null
  highlight_pre_tag?: string
  highlight_post_tag?: string
}

export interface TextbookSearchResult {
  textbooks: Textbook[]
  total: number
  facets: Record<string, Array<{ value: string; count: number }>>
}

const textbooksApi = {
  async autocompleteTextbooks(q: string, limit = 8): Promise<TextbookSuggestion[]> {
    const normalized = q.trim()
    if (normalized.length < 2) return []
    const res = await wisefoodApi.get<{ result: TextbookSuggestion[] }>('/v1/textbooks/autocomplete', {
      params: { q: normalized, limit }
    })
    return Array.isArray(res?.result) ? res.result : []
  },

  async searchTextbooks(params: TextbookSearchParams = {}): Promise<TextbookSearchResult> {
    return wisefoodApi.post<TextbookSearchResult>('/v1/textbooks/search', params)
  }
}

export default textbooksApi
