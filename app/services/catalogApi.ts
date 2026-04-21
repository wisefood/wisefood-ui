import wisefoodApi from './wisefoodApi'

type UnknownRecord = Record<string, unknown>

export type CatalogStatus = 'active' | 'draft' | 'archived' | 'deleted' | 'deprecated'
export type CatalogReviewStatus = 'unreviewed' | 'pending_review' | 'in_review' | 'verified' | 'changes_requested' | 'rejected'
export type CatalogVisibility = 'internal' | 'public'
export type CatalogApplicabilityStatus = 'current' | 'expired' | 'superseded' | 'withdrawn' | 'unknown'
export type CatalogGuidelineActionType = 'eat' | 'drink' | 'use' | 'do' | 'avoid' | 'prepare' | 'limit' | 'choose' | 'increase' | 'reduce'

export type CatalogGuidelineTargetPopulation = 'general_population' | 'infants' | 'under_5_years' | 'ages_5_to_18' | 'adults' | 'elderly' | 'pregnant_people' | 'lactating_people' | 'other'

export type CatalogGuidelineFoodGroup = 'none' | 'fruits' | 'vegetables' | 'grains' | 'dairy' | 'protein_foods' | 'fats_and_oils' | 'beverages' | 'salt' | 'sugars_and_sweets' | 'mixed' | 'other'

export type CatalogGuidelineFrequency = 'per_meal' | 'daily' | 'weekly' | 'monthly' | 'occasional'
export type CatalogQuantityOperator = 'lt' | 'lte' | 'eq' | 'gte' | 'gt' | 'approx'

export interface CatalogArtifact {
  id: string
  parent_urn: string
  title: string
  description: string | null
  creator: string | null
  created_at: string | null
  updated_at: string | null
  file_url: string
  file_s3_url: string | null
  file_type: string
  file_size: number | null
  language: string | null
}

export interface CatalogGuideIdentifier {
  scheme: string
  value: string
  url: string | null
}

export interface CatalogGuideRevision {
  previous_guide_urn: string | null
  previous_guide_label: string | null
  previous_publication_year: number | null
}

export interface CatalogGuide {
  id: string | null
  urn: string
  title: string
  description: string
  tags: string[]
  status: CatalogStatus | null
  url: string
  license: string | null
  region: string | null
  organization_urn: string | null
  publication_date: string | null
  content: string
  topic: string | null
  audience: string | null
  language: string | null
  short_title: string | null
  issuing_authority: string | null
  responsible_ministry: string | null
  document_type: string | null
  legal_status: string | null
  target_audiences: string[]
  graphical_model: string | null
  evidence_basis: string | null
  notes: string | null
  review_status: CatalogReviewStatus | null
  visibility: CatalogVisibility | null
  applicability_status: CatalogApplicabilityStatus | null
  applicability_start_date: string | null
  applicability_end_date: string | null
  publication_year: number | null
  revision: CatalogGuideRevision | null
  identifiers: CatalogGuideIdentifier[]
  artifacts: CatalogArtifact[]
  creator: string | null
  created_at: string | null
  updated_at: string | null
}

export interface CatalogGuidelineQuantity {
  operator: CatalogQuantityOperator
  value: number
  unit: string
  period: string | null
  raw_text: string | null
}

export interface CatalogGuidelineSourceReference {
  artifact_id: string | null
  page_start: number
  page_end: number | null
  section_label: string | null
}

export interface CatalogGuideline {
  id: string
  guide_urn: string
  guide_title: string | null
  title: string | null
  rule_text: string
  sequence_no: number | null
  page_no: number | null
  action_type: CatalogGuidelineActionType | null
  target_populations: CatalogGuidelineTargetPopulation[]
  frequency: CatalogGuidelineFrequency | null
  quantity: CatalogGuidelineQuantity | null
  food_groups: CatalogGuidelineFoodGroup[]
  source_refs: CatalogGuidelineSourceReference[]
  notes: string | null
  status: CatalogStatus | null
  review_status: CatalogReviewStatus | null
  visibility: CatalogVisibility | null
  applicability_status: CatalogApplicabilityStatus | null
  applicability_start_date: string | null
  applicability_end_date: string | null
  region: string | null
  publication_year: number | null
  topic: string | null
  audience: string | null
  tags: string[]
  creator: string | null
  created_at: string | null
  updated_at: string | null
}

export interface GuideUpdatePayload {
  title?: string | null
  description?: string | null
  tags?: string[] | null
  status?: CatalogStatus | null
  url?: string | null
  license?: string | null
  region?: string | null
  content?: string | null
  topic?: string | null
  audience?: string | null
  language?: string | null
  artifacts?: CatalogArtifact[] | null
  short_title?: string | null
  issuing_authority?: string | null
  responsible_ministry?: string | null
  document_type?: string | null
  legal_status?: string | null
  target_audiences?: string[] | null
  graphical_model?: string | null
  evidence_basis?: string | null
  notes?: string | null
  review_status?: CatalogReviewStatus | null
  visibility?: CatalogVisibility | null
  applicability_status?: CatalogApplicabilityStatus | null
  applicability_start_date?: string | null
  applicability_end_date?: string | null
  publication_year?: number | null
  revision?: CatalogGuideRevision | null
  identifiers?: CatalogGuideIdentifier[] | null
  organization_urn?: string | null
  publication_date?: string | null
}

export interface GuideCreatePayload {
  urn: string
  title: string
  description: string
  tags?: string[] | null
  status?: CatalogStatus | null
  url: string
  license: string
  region?: string | null
  organization_urn?: string | null
  publication_date?: string | null
  content: string
  topic?: string | null
  audience?: string | null
  language?: string | null
  short_title?: string | null
  issuing_authority?: string | null
  responsible_ministry?: string | null
  document_type?: string | null
  legal_status?: string | null
  target_audiences?: string[] | null
  graphical_model?: string | null
  evidence_basis?: string | null
  notes?: string | null
  review_status?: CatalogReviewStatus | null
  visibility?: CatalogVisibility | null
  applicability_status?: CatalogApplicabilityStatus | null
  applicability_start_date?: string | null
  applicability_end_date?: string | null
  publication_year?: number | null
  revision?: CatalogGuideRevision | null
  identifiers?: CatalogGuideIdentifier[] | null
  artifacts?: CatalogArtifact[] | null
}

export interface GuidelineUpdatePayload {
  title?: string | null
  rule_text?: string | null
  sequence_no?: number | null
  action_type?: CatalogGuidelineActionType | null
  target_populations?: CatalogGuidelineTargetPopulation[] | null
  frequency?: CatalogGuidelineFrequency | null
  quantity?: CatalogGuidelineQuantity | null
  food_groups?: CatalogGuidelineFoodGroup[] | null
  source_refs?: CatalogGuidelineSourceReference[] | null
  notes?: string | null
  status?: CatalogStatus | null
  review_status?: CatalogReviewStatus | null
  visibility?: CatalogVisibility | null
  applicability_status?: CatalogApplicabilityStatus | null
  applicability_start_date?: string | null
  applicability_end_date?: string | null
}

export interface GuidelineCreatePayload {
  guide_urn: string
  title?: string | null
  rule_text: string
  sequence_no: number
  action_type: CatalogGuidelineActionType
  target_populations?: CatalogGuidelineTargetPopulation[] | null
  frequency?: CatalogGuidelineFrequency | null
  quantity?: CatalogGuidelineQuantity | null
  food_groups?: CatalogGuidelineFoodGroup[] | null
  source_refs?: CatalogGuidelineSourceReference[] | null
  notes?: string | null
  status?: CatalogStatus | null
  review_status?: CatalogReviewStatus | null
  visibility?: CatalogVisibility | null
  applicability_status?: CatalogApplicabilityStatus | null
  applicability_start_date?: string | null
  applicability_end_date?: string | null
}

export interface ArtifactUpdatePayload {
  file_type: string
  title?: string | null
  description?: string | null
}

export interface CatalogCollectionParams {
  limit?: number
  offset?: number
}

export interface CatalogFacetBucket {
  value: string
  count: number
}

export interface CatalogSearchParams {
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

export interface CatalogGuideSearchResult {
  guides: CatalogGuide[]
  total: number
  facets: Record<string, CatalogFacetBucket[]>
}

export interface CatalogGuidelineSearchResult {
  guidelines: CatalogGuideline[]
  total: number
  facets: Record<string, CatalogFacetBucket[]>
}

interface CatalogGuideSearchApiResponse {
  help?: string
  success?: boolean
  result?: {
    results?: unknown[]
    facets?: Record<string, unknown>
    total?: number
  }
}

const DEFAULT_LIMIT = 100

const asRecord = (value: unknown): UnknownRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as UnknownRecord
}

const asString = (value: unknown): string | null => typeof value === 'string' ? value : null
const asNumber = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string')
}

const unwrapEntity = (value: unknown, keys: string[]): unknown => {
  let current = value
  let changed = true

  while (changed) {
    changed = false

    const record = asRecord(current)
    if (!record) {
      return current
    }

    for (const key of keys) {
      if (key in record && record[key] !== undefined) {
        current = record[key]
        changed = true
        break
      }
    }
  }

  return current
}

const extractCollection = (value: unknown, keys: string[]): unknown[] => {
  const unwrapped = unwrapEntity(value, ['result', 'data'])

  if (Array.isArray(unwrapped)) {
    return unwrapped
  }

  const record = asRecord(unwrapped)
  if (!record) {
    return []
  }

  for (const key of keys) {
    if (Array.isArray(record[key])) {
      return record[key] as unknown[]
    }
  }

  return []
}

const extractSearchResultRecord = (value: unknown): UnknownRecord | null => {
  return asRecord(unwrapEntity(value, ['result', 'data']))
}

const extractSearchCollection = (value: unknown): unknown[] => {
  const record = extractSearchResultRecord(value)
  if (!record) {
    return []
  }

  for (const key of ['results', 'guides', 'guidelines', 'items', 'docs']) {
    if (Array.isArray(record[key])) {
      return record[key] as unknown[]
    }
  }

  const responseRecord = asRecord(record['response'])
  if (!responseRecord) {
    return []
  }

  for (const key of ['docs', 'results', 'guidelines', 'items']) {
    if (Array.isArray(responseRecord[key])) {
      return responseRecord[key] as unknown[]
    }
  }

  return []
}

const extractSearchTotal = (value: unknown, fallbackCount: number): number => {
  const record = extractSearchResultRecord(value)
  if (!record) {
    return fallbackCount
  }

  for (const key of ['total', 'count', 'numFound', 'total_hits']) {
    const parsed = asNumber(record[key])
    if (parsed !== null) {
      return parsed
    }
  }

  const responseRecord = asRecord(record['response'])
  if (!responseRecord) {
    return fallbackCount
  }

  for (const key of ['numFound', 'total', 'count']) {
    const parsed = asNumber(responseRecord[key])
    if (parsed !== null) {
      return parsed
    }
  }

  return fallbackCount
}

const normalizeFacetBuckets = (value: unknown): CatalogFacetBucket[] => {
  if (Array.isArray(value)) {
    if (value.every(item => asRecord(item)?.['value'] !== undefined && asRecord(item)?.['count'] !== undefined)) {
      return value
        .map((item) => {
          const record = asRecord(item) || {}
          const facetValue = record['value']
          const count = asNumber(record['count'])

          if ((typeof facetValue !== 'string' && typeof facetValue !== 'number') || count === null) {
            return null
          }

          return {
            value: String(facetValue),
            count
          }
        })
        .filter((item): item is CatalogFacetBucket => Boolean(item))
    }

    if (value.every((item, index) => index % 2 === 0 ? typeof item === 'string' || typeof item === 'number' : typeof item === 'number')) {
      const buckets: CatalogFacetBucket[] = []

      for (let index = 0; index < value.length; index += 2) {
        const facetValue = value[index]
        const count = asNumber(value[index + 1])

        if ((typeof facetValue === 'string' || typeof facetValue === 'number') && count !== null) {
          buckets.push({
            value: String(facetValue),
            count
          })
        }
      }

      return buckets
    }

    return []
  }

  const record = asRecord(value)
  if (!record) {
    return []
  }

  if (Array.isArray(record['buckets'])) {
    return normalizeFacetBuckets(record['buckets'])
  }

  return Object.entries(record)
    .map(([facetValue, count]) => {
      const parsedCount = asNumber(count)
      if (parsedCount === null) {
        return null
      }

      return {
        value: facetValue,
        count: parsedCount
      }
    })
    .filter((item): item is CatalogFacetBucket => Boolean(item))
}

const extractSearchFacets = (value: unknown): Record<string, CatalogFacetBucket[]> => {
  const record = extractSearchResultRecord(value)
  if (!record) {
    return {}
  }

  const rawFacets
    = asRecord(record['facets'])
      || asRecord(record['facet_fields'])
      || asRecord(asRecord(record['facet_counts'])?.['facet_fields'])
      || {}

  return Object.entries(rawFacets).reduce<Record<string, CatalogFacetBucket[]>>((accumulator, [key, facetValue]) => {
    const buckets = normalizeFacetBuckets(facetValue)
    if (buckets.length) {
      accumulator[key] = buckets
    }
    return accumulator
  }, {})
}

const normalizeArtifact = (value: unknown): CatalogArtifact => {
  const record = asRecord(value) || {}

  return {
    id: asString(record['id']) || '',
    parent_urn: asString(record['parent_urn']) || '',
    title: asString(record['title']) || 'Untitled artifact',
    description: asString(record['description']),
    creator: asString(record['creator']),
    created_at: asString(record['created_at']),
    updated_at: asString(record['updated_at']),
    file_url: asString(record['file_url']) || '',
    file_s3_url: asString(record['file_s3_url']),
    file_type: asString(record['file_type']) || 'application/octet-stream',
    file_size: asNumber(record['file_size']),
    language: asString(record['language'])
  }
}

const normalizeGuideIdentifier = (value: unknown): CatalogGuideIdentifier => {
  const record = asRecord(value) || {}

  return {
    scheme: asString(record['scheme']) || '',
    value: asString(record['value']) || '',
    url: asString(record['url'])
  }
}

const normalizeGuideRevision = (value: unknown): CatalogGuideRevision | null => {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  return {
    previous_guide_urn: asString(record['previous_guide_urn']),
    previous_guide_label: asString(record['previous_guide_label']),
    previous_publication_year: asNumber(record['previous_publication_year'])
  }
}

const normalizeGuide = (value: unknown): CatalogGuide => {
  const record = asRecord(unwrapEntity(value, ['guide', 'item'])) || {}

  return {
    id: asString(record['id']),
    urn: asString(record['urn']) || '',
    title: asString(record['title']) || 'Untitled guide',
    description: asString(record['description']) || '',
    tags: asStringArray(record['tags']),
    status: asString(record['status']) as CatalogStatus | null,
    url: asString(record['url']) || '',
    license: asString(record['license']),
    region: asString(record['region']),
    organization_urn: asString(record['organization_urn']),
    publication_date: asString(record['publication_date']),
    content: asString(record['content']) || '',
    topic: asString(record['topic']),
    audience: asString(record['audience']),
    language: asString(record['language']),
    short_title: asString(record['short_title']),
    issuing_authority: asString(record['issuing_authority']),
    responsible_ministry: asString(record['responsible_ministry']),
    document_type: asString(record['document_type']),
    legal_status: asString(record['legal_status']),
    target_audiences: asStringArray(record['target_audiences']),
    graphical_model: asString(record['graphical_model']),
    evidence_basis: asString(record['evidence_basis']),
    notes: asString(record['notes']),
    review_status: asString(record['review_status']) as CatalogReviewStatus | null,
    visibility: asString(record['visibility']) as CatalogVisibility | null,
    applicability_status: asString(record['applicability_status']) as CatalogApplicabilityStatus | null,
    applicability_start_date: asString(record['applicability_start_date']),
    applicability_end_date: asString(record['applicability_end_date']),
    publication_year: asNumber(record['publication_year']),
    revision: normalizeGuideRevision(record['revision']),
    identifiers: Array.isArray(record['identifiers'])
      ? record['identifiers'].map(normalizeGuideIdentifier)
      : [],
    artifacts: Array.isArray(record['artifacts'])
      ? record['artifacts'].map(normalizeArtifact)
      : [],
    creator: asString(record['creator']),
    created_at: asString(record['created_at']),
    updated_at: asString(record['updated_at'])
  }
}

const normalizeGuidelineQuantity = (value: unknown): CatalogGuidelineQuantity | null => {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const operator = asString(record['operator']) as CatalogQuantityOperator | null
  const quantityValue = asNumber(record['value'])
  const unit = asString(record['unit'])

  if (!operator || quantityValue === null || !unit) {
    return null
  }

  return {
    operator,
    value: quantityValue,
    unit,
    period: asString(record['period']),
    raw_text: asString(record['raw_text'])
  }
}

const normalizeGuidelineSourceReference = (value: unknown): CatalogGuidelineSourceReference | null => {
  const record = asRecord(value)
  const pageStart = asNumber(record?.['page_start'])

  if (!record || pageStart === null) {
    return null
  }

  return {
    artifact_id: asString(record['artifact_id']),
    page_start: pageStart,
    page_end: asNumber(record['page_end']),
    section_label: asString(record['section_label'])
  }
}

const normalizeGuideline = (value: unknown): CatalogGuideline => {
  const record = asRecord(unwrapEntity(value, ['guideline', 'item'])) || {}

  return {
    id: asString(record['id']) || '',
    guide_urn: asString(record['guide_urn']) || '',
    guide_title: asString(record['guide_title']) || asString(record['guide_label']) || asString(record['source_guide_title']),
    title: asString(record['title']),
    rule_text: asString(record['rule_text']) || '',
    sequence_no: asNumber(record['sequence_no']),
    page_no: asNumber(record['page_no']),
    action_type: asString(record['action_type']) as CatalogGuidelineActionType | null,
    target_populations: asStringArray(record['target_populations']) as CatalogGuidelineTargetPopulation[],
    frequency: asString(record['frequency']) as CatalogGuidelineFrequency | null,
    quantity: normalizeGuidelineQuantity(record['quantity']),
    food_groups: asStringArray(record['food_groups']) as CatalogGuidelineFoodGroup[],
    source_refs: Array.isArray(record['source_refs'])
      ? record['source_refs'].map(normalizeGuidelineSourceReference).filter(Boolean) as CatalogGuidelineSourceReference[]
      : [],
    notes: asString(record['notes']),
    status: asString(record['status']) as CatalogStatus | null,
    review_status: asString(record['review_status']) as CatalogReviewStatus | null,
    visibility: asString(record['visibility']) as CatalogVisibility | null,
    applicability_status: asString(record['applicability_status']) as CatalogApplicabilityStatus | null,
    applicability_start_date: asString(record['applicability_start_date']),
    applicability_end_date: asString(record['applicability_end_date']),
    region: asString(record['region']),
    publication_year: asNumber(record['publication_year']),
    topic: asString(record['topic']),
    audience: asString(record['audience']),
    tags: asStringArray(record['tags']),
    creator: asString(record['creator']),
    created_at: asString(record['created_at']),
    updated_at: asString(record['updated_at'])
  }
}

class CatalogApiService {
  private readonly basePath = '/v1'

  async fetchGuides(params: CatalogCollectionParams = {}): Promise<CatalogGuide[]> {
    const payload = await wisefoodApi.get<unknown>(`${this.basePath}/guides/fetch`, {
      params: {
        limit: params.limit ?? DEFAULT_LIMIT,
        offset: params.offset ?? 0
      }
    })

    return extractCollection(payload, ['guides', 'items', 'results', 'data']).map(normalizeGuide)
  }

  async searchGuides(params: CatalogSearchParams = {}): Promise<CatalogGuideSearchResult> {
    const preserveNullable = <T>(value: T | undefined) => value === undefined ? undefined : value

    const payload = await wisefoodApi.post<CatalogGuideSearchApiResponse | unknown, CatalogSearchParams>(`${this.basePath}/guides/search`, {
      q: params.q ?? null,
      limit: params.limit ?? 10,
      offset: params.offset ?? 0,
      fl: preserveNullable(params.fl),
      fq: preserveNullable(params.fq),
      sort: params.sort ?? 'updated_at desc',
      fields: preserveNullable(params.fields),
      facet_limit: params.facet_limit ?? undefined,
      highlight: params.highlight ?? false,
      highlight_fields: preserveNullable(params.highlight_fields),
      highlight_pre_tag: params.highlight_pre_tag ?? undefined,
      highlight_post_tag: params.highlight_post_tag ?? undefined
    })

    const directResult = asRecord(asRecord(payload)?.['result'])
    const directResults = Array.isArray(directResult?.['results'])
      ? directResult['results'] as unknown[]
      : Array.isArray(directResult?.['guidelines'])
        ? directResult['guidelines'] as unknown[]
        : null
    const results = directResults || extractSearchCollection(payload)
    const directTotal = asNumber(directResult?.['total'])
    const directFacets = asRecord(directResult?.['facets'])

    return {
      guides: results.map(normalizeGuide),
      total: directTotal ?? extractSearchTotal(payload, results.length),
      facets: directFacets ? extractSearchFacets({ result: { facets: directFacets } }) : extractSearchFacets(payload)
    }
  }

  async getGuide(urn: string): Promise<CatalogGuide> {
    const payload = await wisefoodApi.get<unknown>(`${this.basePath}/guides/${encodeURIComponent(urn)}`)
    return normalizeGuide(unwrapEntity(payload, ['guide', 'item', 'result', 'data']))
  }

  async createGuide(data: GuideCreatePayload): Promise<CatalogGuide> {
    const payload = await wisefoodApi.post<unknown, GuideCreatePayload>(`${this.basePath}/guides`, data)
    return normalizeGuide(unwrapEntity(payload, ['guide', 'item', 'result', 'data']))
  }

  async updateGuide(urn: string, data: GuideUpdatePayload): Promise<CatalogGuide> {
    const payload = await wisefoodApi.patch<unknown, GuideUpdatePayload>(`${this.basePath}/guides/${encodeURIComponent(urn)}`, data)
    return normalizeGuide(unwrapEntity(payload, ['guide', 'item', 'result', 'data']))
  }

  async deleteGuide(urn: string): Promise<void> {
    await wisefoodApi.delete<undefined>(`${this.basePath}/guides/${encodeURIComponent(urn)}`)
  }

  async fetchGuidelines(params: CatalogCollectionParams = {}): Promise<CatalogGuideline[]> {
    const payload = await wisefoodApi.get<unknown>(`${this.basePath}/guidelines/fetch`, {
      params: {
        limit: params.limit ?? DEFAULT_LIMIT,
        offset: params.offset ?? 0
      }
    })

    return extractCollection(payload, ['guidelines', 'items', 'results', 'data']).map(normalizeGuideline)
  }

  async fetchGuidelinesByGuide(guideUrn: string, params: CatalogCollectionParams = {}): Promise<CatalogGuideline[]> {
    const payload = await wisefoodApi.get<unknown>(`${this.basePath}/guidelines/by-guide/${encodeURIComponent(guideUrn)}`, {
      params: {
        limit: params.limit ?? 1000,
        offset: params.offset ?? 0
      }
    })

    return extractCollection(payload, ['guidelines', 'items', 'results', 'data']).map(normalizeGuideline)
  }

  async searchGuidelines(params: CatalogSearchParams = {}): Promise<CatalogGuidelineSearchResult> {
    const preserveNullable = <T>(value: T | undefined) => value === undefined ? undefined : value

    const payload = await wisefoodApi.post<unknown, CatalogSearchParams>(`${this.basePath}/guidelines/search`, {
      q: params.q ?? null,
      limit: params.limit ?? 10,
      offset: params.offset ?? 0,
      fl: preserveNullable(params.fl),
      fq: preserveNullable(params.fq),
      sort: params.sort ?? 'updated_at desc',
      fields: preserveNullable(params.fields),
      facet_limit: params.facet_limit ?? undefined,
      highlight: params.highlight ?? false,
      highlight_fields: preserveNullable(params.highlight_fields),
      highlight_pre_tag: params.highlight_pre_tag ?? undefined,
      highlight_post_tag: params.highlight_post_tag ?? undefined
    })

    const directResult = asRecord(asRecord(payload)?.['result'])
    const directResults = Array.isArray(directResult?.['results'])
      ? directResult['results'] as unknown[]
      : Array.isArray(directResult?.['guidelines'])
        ? directResult['guidelines'] as unknown[]
        : null
    const results = directResults || extractSearchCollection(payload)
    const directTotal = asNumber(directResult?.['total'])
    const directFacets = asRecord(directResult?.['facets'])

    return {
      guidelines: results.map(normalizeGuideline),
      total: directTotal ?? extractSearchTotal(payload, results.length),
      facets: directFacets ? extractSearchFacets({ result: { facets: directFacets } }) : extractSearchFacets(payload)
    }
  }

  async searchGuidelinesByGuide(guideUrn: string, params: CatalogSearchParams = {}): Promise<CatalogGuidelineSearchResult> {
    const preserveNullable = <T>(value: T | undefined) => value === undefined ? undefined : value

    const payload = await wisefoodApi.post<unknown, CatalogSearchParams>(`${this.basePath}/guidelines/by-guide/${encodeURIComponent(guideUrn)}/search`, {
      q: params.q ?? null,
      limit: params.limit ?? 10,
      offset: params.offset ?? 0,
      fl: preserveNullable(params.fl),
      fq: preserveNullable(params.fq),
      sort: params.sort ?? 'sequence_no asc',
      fields: preserveNullable(params.fields),
      facet_limit: params.facet_limit ?? undefined,
      highlight: params.highlight ?? false,
      highlight_fields: preserveNullable(params.highlight_fields),
      highlight_pre_tag: params.highlight_pre_tag ?? undefined,
      highlight_post_tag: params.highlight_post_tag ?? undefined
    })

    const directResult = asRecord(asRecord(payload)?.['result'])
    const directResults = Array.isArray(directResult?.['results']) ? directResult['results'] as unknown[] : null
    const results = directResults || extractSearchCollection(payload)
    const directTotal = asNumber(directResult?.['total'])
    const directFacets = asRecord(directResult?.['facets'])

    return {
      guidelines: results.map(normalizeGuideline),
      total: directTotal ?? extractSearchTotal(payload, results.length),
      facets: directFacets ? extractSearchFacets({ result: { facets: directFacets } }) : extractSearchFacets(payload)
    }
  }

  async getGuideline(id: string): Promise<CatalogGuideline> {
    const payload = await wisefoodApi.get<unknown>(`${this.basePath}/guidelines/${encodeURIComponent(id)}`)
    return normalizeGuideline(unwrapEntity(payload, ['guideline', 'item', 'result', 'data']))
  }

  async createGuideline(data: GuidelineCreatePayload): Promise<CatalogGuideline> {
    const payload = await wisefoodApi.post<unknown, GuidelineCreatePayload>(`${this.basePath}/guidelines`, data)
    return normalizeGuideline(unwrapEntity(payload, ['guideline', 'item', 'result', 'data']))
  }

  async updateGuideline(id: string, data: GuidelineUpdatePayload): Promise<CatalogGuideline> {
    const payload = await wisefoodApi.patch<unknown, GuidelineUpdatePayload>(`${this.basePath}/guidelines/${encodeURIComponent(id)}`, data)
    return normalizeGuideline(unwrapEntity(payload, ['guideline', 'item', 'result', 'data']))
  }

  async deleteGuideline(id: string): Promise<void> {
    await wisefoodApi.delete<undefined>(`${this.basePath}/guidelines/${encodeURIComponent(id)}`)
  }

  async getArtifact(id: string): Promise<CatalogArtifact> {
    const payload = await wisefoodApi.get<unknown>(`${this.basePath}/artifacts/${encodeURIComponent(id)}`)
    return normalizeArtifact(unwrapEntity(payload, ['artifact', 'item', 'result', 'data']))
  }

  async updateArtifact(id: string, data: ArtifactUpdatePayload): Promise<CatalogArtifact> {
    const payload = await wisefoodApi.patch<unknown, ArtifactUpdatePayload>(`${this.basePath}/artifacts/${encodeURIComponent(id)}`, data)
    return normalizeArtifact(unwrapEntity(payload, ['artifact', 'item', 'result', 'data']))
  }
}

export default new CatalogApiService()
