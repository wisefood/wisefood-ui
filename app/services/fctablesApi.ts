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

export interface FCTableListParams {
  limit?: number
  offset?: number
  q?: string
}

export interface FCTableListResult {
  tables: FCTable[]
  total: number
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

  async listTables(params: FCTableListParams = {}): Promise<FCTableListResult> {
    const query: Record<string, unknown> = {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0
    }
    if (params.q?.trim()) query['q'] = params.q.trim()
    const payload = await wisefoodRestApi.get<unknown>(this.basePath, { params: query })
    const record = asRecord(payload)
    const result = asRecord(record?.['result']) ?? record ?? {}
    const items = Array.isArray(result['items'])
      ? result['items']
      : Array.isArray(result['fctables'])
        ? result['fctables']
        : Array.isArray(payload)
          ? payload as unknown[]
          : []
    return {
      tables: items.map(normalizeFCTable),
      total: asNumber(result['total']) ?? items.length
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
