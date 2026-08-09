/**
 * Platform operations endpoints.
 *
 * Everything here except `getHealth` is admin-only server-side. The UI gates on
 * the same role so an expert never sees a control that would 403, but the
 * server is the authority — the client gate is for clarity, not security.
 */
import wisefoodApi from './wisefoodApi'

export interface ClusterState {
  reachable: boolean
  cluster_name?: string
  /** Elasticsearch's own green/yellow/red. */
  status?: string
  number_of_nodes?: number
  active_shards?: number
  unassigned_shards?: number
  error?: string
}

export interface IndexState {
  index: string
  exists: boolean
  /** Set when the index is reached through an alias. */
  concrete_index?: string
  doc_count?: number
  deleted_docs?: number
  size_bytes?: number
  mapped_fields?: number
  /**
   * Mapping properties the code defines that the live index lacks. Startup adds
   * these automatically, so a non-empty list means either the API has not been
   * restarted since the field was added, or the type conflicts and a reindex is
   * required.
   */
  missing_fields?: string[]
  max_result_window?: number | null
  expected_max_result_window?: number
  error?: string
}

export interface IndexStateResponse {
  cluster: ClusterState
  indices: IndexState[]
  /** Indices with at least one missing mapping field. */
  drifted: string[]
}

export interface EmbeddingIndexState {
  index: string
  identifier_field: string
  exists: boolean
  total?: number
  embedded?: number
  /** Never embedded. */
  missing?: number
  /**
   * Embedded, but edited since — the stored vector describes older text.
   *
   * Absent means "not measured" rather than zero: the count needs a scripted
   * comparison of two date fields, which is issued as a separate request so a
   * scripting failure costs only this column and not the whole report.
   */
  stale?: number
  /** Embedded and still accurate: `embedded - stale`. */
  current?: number
  coverage?: number | null
  error?: string
}

export interface EmbeddingStateResponse {
  queue: {
    key: string
    /** null means Redis was unreachable — not an empty queue. */
    pending: number | null
  }
  indices: EmbeddingIndexState[]
}

export interface HealthResponse {
  healthy: boolean
  elasticsearch: ClusterState
  redis: { reachable: boolean }
  storage: { healthy: boolean, error?: string, [key: string]: unknown }
}

export interface BackfillResult {
  dry_run: boolean
  queued: number
  failed: number
  max_docs: number
  only_missing: boolean
  guide_urn?: string | null
}

interface Envelope<T> { result: T }

export interface BackfillOptions {
  onlyMissing?: boolean
  maxDocs?: number
  dryRun?: boolean
}

function backfillParams(options: BackfillOptions = {}) {
  const params: Record<string, string | number | boolean | undefined> = {}
  if (options.onlyMissing !== undefined) params.only_missing = options.onlyMissing
  if (options.maxDocs !== undefined) params.max_docs = options.maxDocs
  if (options.dryRun !== undefined) params.dry_run = options.dryRun
  return params
}

class SystemApiService {
  /** Reachability of Elasticsearch, Redis and object storage. Not admin-gated. */
  async getHealth(): Promise<HealthResponse> {
    const response = await wisefoodApi.get<Envelope<HealthResponse>>('/v1/system/health')
    return response.result
  }

  async getIndexState(): Promise<IndexStateResponse> {
    const response = await wisefoodApi.get<Envelope<IndexStateResponse>>('/v1/system/indices')
    return response.result
  }

  async getEmbeddingState(): Promise<EmbeddingStateResponse> {
    const response = await wisefoodApi.get<Envelope<EmbeddingStateResponse>>('/v1/system/embeddings')
    return response.result
  }

  async backfillArticleEmbeddings(options: BackfillOptions = {}): Promise<BackfillResult> {
    const response = await wisefoodApi.post<Envelope<BackfillResult>>(
      '/v1/articles/embeddings/backfill',
      undefined,
      { params: backfillParams(options) }
    )
    return response.result
  }

  async backfillGuidelineEmbeddings(
    options: BackfillOptions & { guideUrn?: string } = {}
  ): Promise<BackfillResult> {
    const params = backfillParams(options)
    if (options.guideUrn) params.guide_urn = options.guideUrn
    const response = await wisefoodApi.post<Envelope<BackfillResult>>(
      '/v1/guidelines/embeddings/backfill',
      undefined,
      { params }
    )
    return response.result
  }
}

export const systemApi = new SystemApiService()
export default systemApi
