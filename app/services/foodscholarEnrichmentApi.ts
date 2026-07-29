import wisefoodRestApi from './wisefoodRestApi'

/**
 * Selective article enrichment (FoodScholar).
 *
 * FoodScholar runs two workers: a catalog *sweeper* that walks every article in
 * cursor order, and an on-demand *job worker* that serves per-article requests
 * from this console. The job worker is independent, so the sweeper can be paused
 * while selective enrichment keeps working.
 */

export type EnrichmentJobStatusValue
  = | 'queued'
    | 'running'
    | 'succeeded'
    | 'failed'
    | 'not_found'

export interface EnrichmentJobResult {
  enriched_at?: string
  enhanced?: boolean
  study_type?: string | null
  keywords?: string[]
  tags?: string[]
  topics?: string[]
  ai_tags?: string[]
  ai_key_takeaways?: string[]
  annotation_confidence?: number | null
}

export interface EnrichmentJobStatus {
  urn: string
  status: EnrichmentJobStatusValue
  job_id?: string | null
  enqueued_at?: string | null
  started_at?: string | null
  completed_at?: string | null
  error?: string | null
  result?: EnrichmentJobResult | null
  processed: boolean
  permanently_failed: boolean
}

export interface EnrichmentBatchResponse {
  total: number
  jobs: EnrichmentJobStatus[]
}

export interface EnrichmentResetResponse {
  urn: string
  cleared_processed: boolean
  cleared_failed: boolean
}

export interface EnrichmentSweeperStatus {
  enabled: boolean
  running?: boolean
  paused?: boolean | null
  processed?: number
  failed?: number
  skipped?: number
  cursor?: number | null
  started_at?: string | null
  uptime_seconds?: number
}

export interface EnrichmentJobWorkerStatus {
  enabled: boolean
  running?: boolean
  pending_jobs?: number | null
  processed?: number
  failed?: number
  skipped?: number
  started_at?: string | null
  uptime_seconds?: number
}

export interface EnrichmentWorkerStatus {
  sweeper: EnrichmentSweeperStatus
  jobs: EnrichmentJobWorkerStatus
}

class FoodScholarEnrichmentApiService {
  private readonly basePath = '/foodscholar/enrich'

  /** Queue enrichment for one article. `force` re-enriches an already-processed one. */
  async enrichArticle(urn: string, force = false): Promise<EnrichmentJobStatus> {
    return wisefoodRestApi.post<EnrichmentJobStatus, { force: boolean }>(
      `${this.basePath}/articles/${encodeURIComponent(urn)}`,
      { force }
    )
  }

  /** Queue enrichment for a set of articles in one call. */
  async enrichArticles(urns: string[], force = false): Promise<EnrichmentBatchResponse> {
    return wisefoodRestApi.post<EnrichmentBatchResponse, { urns: string[], force: boolean }>(
      `${this.basePath}/articles`,
      { urns, force }
    )
  }

  async getArticleStatus(urn: string): Promise<EnrichmentJobStatus> {
    return wisefoodRestApi.get<EnrichmentJobStatus>(
      `${this.basePath}/articles/${encodeURIComponent(urn)}`
    )
  }

  /**
   * Status for many articles at once. The backend expects `urns` repeated once
   * per value, which the shared params helper cannot express — build the query
   * string directly.
   */
  async getArticleStatuses(urns: string[]): Promise<EnrichmentBatchResponse> {
    if (!urns.length) {
      return { total: 0, jobs: [] }
    }

    const query = urns.map(urn => `urns=${encodeURIComponent(urn)}`).join('&')
    return wisefoodRestApi.get<EnrichmentBatchResponse>(`${this.basePath}/jobs?${query}`)
  }

  /** Clear sweeper bookkeeping so the article becomes eligible again. */
  async resetArticle(urn: string): Promise<EnrichmentResetResponse> {
    return wisefoodRestApi.delete<EnrichmentResetResponse>(
      `${this.basePath}/articles/${encodeURIComponent(urn)}`
    )
  }

  async getWorkerStatus(): Promise<EnrichmentWorkerStatus> {
    return wisefoodRestApi.get<EnrichmentWorkerStatus>(`${this.basePath}/worker`)
  }

  /** Pause or resume the catalog sweeper across every API replica. */
  async setSweeperPaused(paused: boolean): Promise<EnrichmentWorkerStatus> {
    return wisefoodRestApi.post<EnrichmentWorkerStatus, { paused: boolean }>(
      `${this.basePath}/worker/pause`,
      { paused }
    )
  }
}

export default new FoodScholarEnrichmentApiService()
