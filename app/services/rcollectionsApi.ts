import wisefoodRestApi from './wisefoodApi'

export type RCollectionStatus = 'active' | 'draft' | 'archived' | 'deleted' | 'deprecated'
export type RCollectionReviewStatus = 'unreviewed' | 'pending_review' | 'in_review' | 'verified' | 'changes_requested' | 'rejected'
export type RCollectionVisibility = 'internal' | 'public'
export type RCollectionSourceType = 'web_portal' | 'database' | 'book' | 'journal' | 'other'

export interface RecipeCollection {
  urn: string
  id: string
  title: string
  description: string | null
  tags: string[]
  status: RCollectionStatus | null
  creator: string | null
  created_at: string | null
  updated_at: string | null
  url: string | null
  license: string | null
  language: string | null
  version: string | null
  source_type: RCollectionSourceType | null
  image_url: string | null
  organization_urn: string | null
  recipe_count: number | null
  cuisines: string[]
  meal_types: string[]
  dietary_patterns: string[]
  geographic_coverage: string[]
  has_nutritional_data: boolean | null
  has_images: boolean | null
  data_completeness: number | null
  is_curated: boolean | null
  curation_notes: string | null
  review_status: RCollectionReviewStatus | null
  verifier_user_id: string | null
  visibility: RCollectionVisibility | null
  extras: unknown | null
}

export interface RCollectionListParams {
  limit?: number
  offset?: number
}

export interface RCollectionListResult {
  collections: RecipeCollection[]
  total: number
}

type UnknownRecord = Record<string, unknown>

const asRecord = (value: unknown): UnknownRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as UnknownRecord
}

const asString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null

const asNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

const asBoolean = (value: unknown): boolean | null =>
  typeof value === 'boolean' ? value : null

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

const normalizeCollection = (value: unknown): RecipeCollection => {
  const record = asRecord(value) || {}

  return {
    urn: asString(record['urn']) || '',
    id: asString(record['id']) || '',
    title: asString(record['title']) || 'Untitled Collection',
    description: asString(record['description']),
    tags: asStringArray(record['tags']),
    status: asString(record['status']) as RCollectionStatus | null,
    creator: asString(record['creator']),
    created_at: asString(record['created_at']),
    updated_at: asString(record['updated_at']),
    url: asString(record['url']),
    license: asString(record['license']),
    language: asString(record['language']),
    version: asString(record['version']),
    source_type: asString(record['source_type']) as RCollectionSourceType | null,
    image_url: asString(record['image_url']),
    organization_urn: asString(record['organization_urn']),
    recipe_count: asNumber(record['recipe_count']),
    cuisines: asStringArray(record['cuisines']),
    meal_types: asStringArray(record['meal_types']),
    dietary_patterns: asStringArray(record['dietary_patterns']),
    geographic_coverage: asStringArray(record['geographic_coverage']),
    has_nutritional_data: asBoolean(record['has_nutritional_data']),
    has_images: asBoolean(record['has_images']),
    data_completeness: asNumber(record['data_completeness']),
    is_curated: asBoolean(record['is_curated']),
    curation_notes: asString(record['curation_notes']),
    review_status: asString(record['review_status']) as RCollectionReviewStatus | null,
    verifier_user_id: asString(record['verifier_user_id']),
    visibility: asString(record['visibility']) as RCollectionVisibility | null,
    extras: record['extras'] ?? null
  }
}

class RCollectionsApiService {
  private readonly basePath = '/v1/rcollections'

  async getCollection(urn: string): Promise<RecipeCollection> {
    const payload = await wisefoodRestApi.get<unknown>(`${this.basePath}/${encodeURIComponent(urn)}`)
    const record = asRecord(payload)
    const raw = record?.['result'] ?? payload
    return normalizeCollection(raw)
  }

  async listCollections(params: RCollectionListParams = {}): Promise<RCollectionListResult> {
    const payload = await wisefoodRestApi.get<unknown>(this.basePath, {
      params: {
        limit: params.limit ?? 20,
        offset: params.offset ?? 0
      }
    })
    const record = asRecord(payload)
    const result = asRecord(record?.['result']) ?? record ?? {}
    const items = Array.isArray(result['items'])
      ? result['items']
      : Array.isArray(result['rcollections'])
        ? result['rcollections']
        : Array.isArray(payload)
          ? payload as unknown[]
          : []
    return {
      collections: items.map(normalizeCollection),
      total: asNumber(result['total']) ?? items.length
    }
  }

  async autocompleteCollections(q: string, limit = 8): Promise<Array<{ urn: string; title: string }>> {
    if (q.trim().length < 2) return []
    const payload = await wisefoodRestApi.get<unknown>(`${this.basePath}/autocomplete`, {
      params: { q: q.trim(), limit }
    })
    const record = asRecord(payload)
    const items = Array.isArray(record?.['result']) ? record['result'] as unknown[] : []
    return items.map(item => {
      const r = asRecord(item) || {}
      return { urn: asString(r['urn']) || '', title: asString(r['title']) || '' }
    })
  }
}

export default new RCollectionsApiService()
