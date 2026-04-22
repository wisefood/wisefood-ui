import wisefoodApi from './wisefoodApi'

export type TextbookStatus = 'active' | 'draft' | 'archived' | 'deleted' | 'deprecated'
export type TextbookReviewStatus = 'unreviewed' | 'pending_review' | 'in_review' | 'verified' | 'changes_requested' | 'rejected'
export type TextbookVisibility = 'internal' | 'public'
export type TextbookApplicabilityStatus = 'current' | 'expired' | 'superseded' | 'withdrawn' | 'unknown'

export interface TextbookArtifact {
  id: string
  parent_urn: string
  title: string
  description: string | null
  type: string
  creator: string | null
  created_at: string | null
  updated_at: string | null
  file_url: string
  file_s3_url: string | null
  file_type: string
  file_size: number | null
  language: string | null
}

export interface Textbook {
  id: string
  urn: string
  title: string
  description: string | null
  subtitle: string | null
  tags: string[]
  status: TextbookStatus | null
  creator: string | null
  created_at: string | null
  updated_at: string | null
  url: string | null
  license: string | null
  language: string | null
  version: string | null
  organization_urn: string | null
  authors: string[]
  editors: string[]
  publisher: string | null
  edition: string | null
  isbn10: string | null
  isbn13: string | null
  doi: string | null
  topics: string[]
  keywords: string[]
  audience: string | null
  region: string | null
  review_status: TextbookReviewStatus | null
  verifier_user_id: string | null
  visibility: TextbookVisibility | null
  applicability_status: TextbookApplicabilityStatus | null
  applicability_start_date: string | null
  applicability_end_date: string | null
  publication_date: string | null
  publication_year: number | null
  page_count: number | null
  structure_tree: unknown | null
  artifacts: TextbookArtifact[]
}

export interface TextbookPassage {
  id: string
  textbook_urn: string
  title: string | null
  content: string
  chapter: string | null
  section: string | null
  page_start: number | null
  page_end: number | null
  sequence_no: number | null
  tags: string[]
  topics: string[]
  language: string | null
  creator: string | null
  created_at: string | null
  updated_at: string | null
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

export interface TextbookListParams {
  limit?: number
  offset?: number
}

export interface FacetBucket {
  value: string | number
  count: number
}

export interface TextbookSearchResult {
  textbooks: Textbook[]
  total: number
  facets: Record<string, FacetBucket[]>
}

type UnknownRecord = Record<string, unknown>

const asRecord = (v: unknown): UnknownRecord | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? v as UnknownRecord : null

const asString = (v: unknown): string | null => typeof v === 'string' ? v : null
const asNumber = (v: unknown): number | null => typeof v === 'number' && Number.isFinite(v) ? v : null
const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((item): item is string => typeof item === 'string') : []

const normalizeArtifact = (v: unknown): TextbookArtifact => {
  const r = asRecord(v) || {}
  return {
    id: asString(r['id']) || '',
    parent_urn: asString(r['parent_urn']) || '',
    title: asString(r['title']) || '',
    description: asString(r['description']),
    type: asString(r['type']) || 'artifact',
    creator: asString(r['creator']),
    created_at: asString(r['created_at']),
    updated_at: asString(r['updated_at']),
    file_url: asString(r['file_url']) || '',
    file_s3_url: asString(r['file_s3_url']),
    file_type: asString(r['file_type']) || '',
    file_size: asNumber(r['file_size']),
    language: asString(r['language'])
  }
}

const normalizeTextbook = (v: unknown): Textbook => {
  const r = asRecord(v) || {}
  return {
    id: asString(r['id']) || '',
    urn: asString(r['urn']) || '',
    title: asString(r['title']) || 'Untitled',
    description: asString(r['description']),
    subtitle: asString(r['subtitle']),
    tags: asStringArray(r['tags']),
    status: asString(r['status']) as TextbookStatus | null,
    creator: asString(r['creator']),
    created_at: asString(r['created_at']),
    updated_at: asString(r['updated_at']),
    url: asString(r['url']),
    license: asString(r['license']),
    language: asString(r['language']),
    version: asString(r['version']),
    organization_urn: asString(r['organization_urn']),
    authors: asStringArray(r['authors']),
    editors: asStringArray(r['editors']),
    publisher: asString(r['publisher']),
    edition: asString(r['edition']),
    isbn10: asString(r['isbn10']),
    isbn13: asString(r['isbn13']),
    doi: asString(r['doi']),
    topics: asStringArray(r['topics']),
    keywords: asStringArray(r['keywords']),
    audience: asString(r['audience']),
    region: asString(r['region']),
    review_status: asString(r['review_status']) as TextbookReviewStatus | null,
    verifier_user_id: asString(r['verifier_user_id']),
    visibility: asString(r['visibility']) as TextbookVisibility | null,
    applicability_status: asString(r['applicability_status']) as TextbookApplicabilityStatus | null,
    applicability_start_date: asString(r['applicability_start_date']),
    applicability_end_date: asString(r['applicability_end_date']),
    publication_date: asString(r['publication_date']),
    publication_year: asNumber(r['publication_year']),
    page_count: asNumber(r['page_count']),
    structure_tree: r['structure_tree'] ?? null,
    artifacts: Array.isArray(r['artifacts']) ? r['artifacts'].map(normalizeArtifact) : []
  }
}

const normalizePassage = (v: unknown): TextbookPassage => {
  const r = asRecord(v) || {}
  return {
    id: asString(r['id']) || '',
    textbook_urn: asString(r['textbook_urn']) || '',
    title: asString(r['title']),
    content: asString(r['content']) || '',
    chapter: asString(r['chapter']),
    section: asString(r['section']),
    page_start: asNumber(r['page_start']),
    page_end: asNumber(r['page_end']),
    sequence_no: asNumber(r['sequence_no']),
    tags: asStringArray(r['tags']),
    topics: asStringArray(r['topics']),
    language: asString(r['language']),
    creator: asString(r['creator']),
    created_at: asString(r['created_at']),
    updated_at: asString(r['updated_at'])
  }
}

const extractTextbookList = (payload: unknown): Textbook[] => {
  const r = asRecord(payload)
  const result = asRecord(r?.['result']) ?? r ?? {}
  const items: unknown[] = Array.isArray(result['textbooks'])
    ? result['textbooks'] as unknown[]
    : Array.isArray(result['items'])
      ? result['items'] as unknown[]
      : Array.isArray(payload)
        ? payload as unknown[]
        : []
  return items.map(normalizeTextbook)
}

const extractTotal = (payload: unknown, fallback: number): number => {
  const r = asRecord(payload)
  const result = asRecord(r?.['result']) ?? r ?? {}
  return asNumber(result['total']) ?? fallback
}

const extractFacets = (payload: unknown): Record<string, FacetBucket[]> => {
  const r = asRecord(payload)
  const result = asRecord(r?.['result']) ?? r ?? {}
  const raw = asRecord(result['facets']) ?? {}
  const out: Record<string, FacetBucket[]> = {}
  for (const [key, val] of Object.entries(raw)) {
    if (Array.isArray(val)) {
      out[key] = val.map(item => {
        const ir = asRecord(item) ?? {}
        return { value: (ir['value'] as string | number) ?? '', count: asNumber(ir['count']) ?? 0 }
      })
    }
  }
  return out
}

const textbooksApi = {
  async getTextbook(urn: string): Promise<Textbook> {
    const payload = await wisefoodApi.get<unknown>(`/v1/textbooks/${encodeURIComponent(urn)}`)
    const r = asRecord(payload)
    return normalizeTextbook(r?.['result'] ?? payload)
  },

  async fetchTextbooks(params: TextbookListParams = {}): Promise<Textbook[]> {
    const payload = await wisefoodApi.get<unknown>('/v1/textbooks/fetch', {
      params: { limit: params.limit ?? 20, offset: params.offset ?? 0 }
    })
    return extractTextbookList(payload)
  },

  async searchTextbooks(params: TextbookSearchParams = {}): Promise<TextbookSearchResult> {
    const payload = await wisefoodApi.post<unknown, TextbookSearchParams>('/v1/textbooks/search', {
      q: params.q ?? null,
      limit: params.limit ?? 10,
      offset: params.offset ?? 0,
      fl: params.fl,
      fq: params.fq,
      sort: params.sort ?? 'updated_at desc',
      fields: params.fields,
      facet_limit: params.facet_limit ?? 200,
      highlight: params.highlight ?? false,
      highlight_fields: params.highlight_fields,
      highlight_pre_tag: params.highlight_pre_tag,
      highlight_post_tag: params.highlight_post_tag
    })
    const r = asRecord(payload)
    const result = asRecord(r?.['result']) ?? r ?? {}
    const items: unknown[] = Array.isArray(result['textbooks'])
      ? result['textbooks'] as unknown[]
      : Array.isArray(result['results'])
        ? result['results'] as unknown[]
        : []
    return {
      textbooks: items.map(normalizeTextbook),
      total: asNumber(result['total']) ?? extractTotal(payload, items.length),
      facets: extractFacets(payload)
    }
  },

  async autocompleteTextbooks(q: string, limit = 8): Promise<TextbookSuggestion[]> {
    const normalized = q.trim()
    if (normalized.length < 2) return []
    const res = await wisefoodApi.get<{ result: TextbookSuggestion[] }>('/v1/textbooks/autocomplete', {
      params: { q: normalized, limit }
    })
    return Array.isArray(res?.result) ? res.result : []
  },

  async fetchPassages(textbookUrn: string, params: TextbookListParams = {}): Promise<TextbookPassage[]> {
    const payload = await wisefoodApi.get<unknown>(
      `/v1/textbook-passages/by-textbook/${encodeURIComponent(textbookUrn)}`,
      { params: { limit: params.limit ?? 50, offset: params.offset ?? 0 } }
    )
    const r = asRecord(payload)
    const result = asRecord(r?.['result']) ?? r ?? {}
    const items: unknown[] = Array.isArray(result['passages'])
      ? result['passages'] as unknown[]
      : Array.isArray(result['items'])
        ? result['items'] as unknown[]
        : Array.isArray(payload)
          ? payload as unknown[]
          : []
    return items.map(normalizePassage)
  }
}

export default textbooksApi
