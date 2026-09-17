import wisefoodRestApi from './wisefoodApi'

/**
 * Food composition tables.
 *
 * A registered *reference to* a table, not a copy of one: there is no
 * row-level store behind this entity anywhere in the platform, so everything
 * here is descriptive. The figures — entries, nutrient coverage, completeness
 * — are measured from the source file by the Source Integrator, or typed by a
 * curator for tables that predate it.
 */

export type FCTableStatus = 'active' | 'draft' | 'archived' | 'deleted' | 'deprecated'

export interface FCTable {
  urn: string
  id: string
  title: string
  description: string | null
  status: FCTableStatus | null
  type: string | null
  compiling_institution: string | null
  database_name: string | null
  classification_schemes: string[]
  standardization_schemes: string[]
  measurement_units: string[]
  reference_portions: string[]
  completeness_percent: number | null
  completeness_description: string | null
  nutrient_coverage: string[]
  data_formats: string[]
  tasks_supported: string[]
  number_of_entries: number | null
  min_nutrients_per_item: number | null
  max_nutrients_per_item: number | null
  url: string | null
  license: string | null
  external_id: string | null
  language: string | null
  region: string | null
  organization_urn: string | null
  tags: string[]
  creator: string | null
  created_at: string | null
  updated_at: string | null
  extras: unknown | null
}

/** What the table shows, and therefore what the wire carries. */
export const FCTABLE_TABLE_FIELDS = [
  'urn', 'id', 'title', 'status', 'license', 'language', 'region',
  'compiling_institution', 'database_name', 'number_of_entries',
  'completeness_percent', 'nutrient_coverage', 'updated_at'
]

/** Aggregated into buckets by the same request; these become the filters. */
export const FCTABLE_FACET_FIELDS = [
  'status', 'license', 'language', 'region', 'compiling_institution'
]

export interface FCTableSearchParams {
  q?: string
  limit?: number
  offset?: number
  fl?: string[]
  fq?: string[]
  sort?: string
  fields?: string[]
  facet_limit?: number
}

export type Facets = Record<string, Record<string, number>>

export interface FCTableSearchResult {
  /**
   * The deepest offset+limit the backend will serve. Paging past it is a
   * rejected request, not an empty page, so the pages clamp against it.
   */
  maxResultWindow: number
  tables: FCTable[]
  total: number
  facets: Facets
}

type UnknownRecord = Record<string, unknown>

const asRecord = (value: unknown): UnknownRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as UnknownRecord
}

const asString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null

const asNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value)
  }
  return null
}

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []

/** `{field: {value: count}}`, whichever shape the store returned. */
export function normalizeFacets(value: unknown): Facets {
  const source = asRecord(value)
  if (!source) return {}
  const out: Facets = {}
  for (const [field, raw] of Object.entries(source)) {
    const counts: Record<string, number> = {}
    if (Array.isArray(raw)) {
      for (const bucket of raw) {
        const b = asRecord(bucket)
        const key = asString(b?.['value']) ?? asString(b?.['key'])
        const count = asNumber(b?.['count']) ?? asNumber(b?.['doc_count'])
        if (key) counts[key] = count ?? 0
      }
    } else {
      const map = asRecord(raw)
      if (map) {
        for (const [key, count] of Object.entries(map)) {
          const n = asNumber(count)
          if (n !== null) counts[key] = n
        }
      }
    }
    if (Object.keys(counts).length) out[field] = counts
  }
  return out
}

export function normalizeFCTable(value: unknown): FCTable {
  const record = asRecord(value) || {}
  return {
    urn: asString(record['urn']) || asString(record['id']) || '',
    id: asString(record['id']) || '',
    title: asString(record['title']) || '',
    description: asString(record['description']),
    status: asString(record['status']) as FCTableStatus | null,
    type: asString(record['type']),
    compiling_institution: asString(record['compiling_institution']),
    database_name: asString(record['database_name']),
    classification_schemes: asStringArray(record['classification_schemes']),
    standardization_schemes: asStringArray(record['standardization_schemes']),
    measurement_units: asStringArray(record['measurement_units']),
    reference_portions: asStringArray(record['reference_portions']),
    completeness_percent: asNumber(record['completeness_percent']),
    completeness_description: asString(record['completeness_description']),
    nutrient_coverage: asStringArray(record['nutrient_coverage']),
    data_formats: asStringArray(record['data_formats']),
    tasks_supported: asStringArray(record['tasks_supported']),
    number_of_entries: asNumber(record['number_of_entries']),
    min_nutrients_per_item: asNumber(record['min_nutrients_per_item']),
    max_nutrients_per_item: asNumber(record['max_nutrients_per_item']),
    url: asString(record['url']),
    license: asString(record['license']),
    external_id: asString(record['external_id']),
    language: asString(record['language']),
    region: asString(record['region']),
    organization_urn: asString(record['organization_urn']),
    tags: asStringArray(record['tags']),
    creator: asString(record['creator']),
    created_at: asString(record['created_at']),
    updated_at: asString(record['updated_at']),
    extras: record['extras'] ?? null
  }
}

class FCTablesApiService {
  private readonly basePath = '/v1/fctables'

  async getTable(urn: string): Promise<FCTable> {
    const payload = await wisefoodRestApi.get<unknown>(`${this.basePath}/${encodeURIComponent(urn)}`)
    return normalizeFCTable(asRecord(payload)?.['result'] ?? payload)
  }

  /**
   * The catalog's uniform search contract. `fl` keeps the response to the
   * columns the table draws, and `fields` returns the facet buckets that
   * become its filters — in the same round trip, not a second query.
   */
  async searchTables(params: FCTableSearchParams = {}): Promise<FCTableSearchResult> {
    const payload = await wisefoodRestApi.post<unknown>(`${this.basePath}/search`, {
      q: params.q?.trim() || null,
      limit: params.limit ?? 25,
      offset: params.offset ?? 0,
      fl: params.fl ?? FCTABLE_TABLE_FIELDS,
      fq: params.fq?.length ? params.fq : undefined,
      sort: params.sort ?? 'updated_at desc',
      fields: params.fields ?? FCTABLE_FACET_FIELDS,
      facet_limit: params.facet_limit ?? 50
    })
    const result = asRecord(asRecord(payload)?.['result']) ?? asRecord(payload) ?? {}
    const items = Array.isArray(result['results']) ? result['results'] as unknown[] : []
    return {
      tables: items.map(normalizeFCTable),
      total: asNumber(result['total']) ?? items.length,
      facets: normalizeFacets(result['facets']),
      maxResultWindow: asNumber(result['max_result_window']) ?? 10000
    }
  }

  async createTable(payload: Partial<FCTable>): Promise<FCTable> {
    const res = await wisefoodRestApi.post<unknown>(this.basePath, payload)
    return normalizeFCTable(asRecord(res)?.['result'] ?? res)
  }

  async updateTable(urn: string, payload: Partial<FCTable>): Promise<FCTable> {
    const res = await wisefoodRestApi.patch<unknown>(
      `${this.basePath}/${encodeURIComponent(urn)}`, payload
    )
    return normalizeFCTable(asRecord(res)?.['result'] ?? res)
  }

  async deleteTable(urn: string): Promise<void> {
    await wisefoodRestApi.delete(`${this.basePath}/${encodeURIComponent(urn)}`)
  }
}

export const fctablesApi = new FCTablesApiService()
export default fctablesApi
