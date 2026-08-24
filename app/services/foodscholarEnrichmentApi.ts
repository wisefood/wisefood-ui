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
  /** Whether the worker thread is actually alive. `running` is bookkeeping and
   *  can outlive the thread; a running-but-not-alive worker has died. */
  alive?: boolean
  stalled?: boolean
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
  alive?: boolean
  stalled?: boolean
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

export interface EnrichmentWorkerRestartOutcome {
  restarted: boolean
  reason?: string
  thread_was_alive?: boolean
  pause_switch_was_set?: boolean | null
  resumed?: boolean
  running?: boolean
}

export interface EnrichmentWorkerRestartResponse {
  sweeper: EnrichmentWorkerRestartOutcome | null
  jobs: EnrichmentWorkerRestartOutcome | null
  status: EnrichmentWorkerStatus
}

export interface VenueEnrichmentStatus {
  venue: string
  total: number
  enriched: number
  pending: number
}

export interface EnrichmentOverview {
  total: number
  enriched: number
  pending: number
  queue_depth?: number | null
  sweeper_paused: boolean
  venues: VenueEnrichmentStatus[]
}

export interface EnrichmentBatchProgress {
  total: number
  done: number
  percent: number
  queued: number
  running: number
  succeeded: number
  failed: number
  unknown: number
}

export interface EnrichmentBatchSummary {
  batch_id: string
  criteria: {
    venue?: string | null
    only_missing?: boolean
    force?: boolean
    limit?: number
  }
  requested_by?: string | null
  created_at: string
  selected: number
  already_active?: number
  queued?: number | null
  progress?: EnrichmentBatchProgress | null
  failures?: Array<{ urn: string, error?: string | null }>
}

export interface EnrichmentCriteriaBatchRequest {
  venue?: string | null
  only_missing?: boolean
  force?: boolean
  limit?: number
}

class FoodScholarEnrichmentApiService {
  private readonly basePath = '/foodscholar/enrich'

  /** Corpus-wide enrichment coverage with per-journal breakdown. */
  async getOverview(): Promise<EnrichmentOverview> {
    return wisefoodRestApi.get<EnrichmentOverview>(`${this.basePath}/overview`)
  }

  /** Queue a batch by criteria (journal, missing-only, limit). Idempotent
   *  across runs: re-running the same criteria continues where it stopped. */
  async enqueueBatch(criteria: EnrichmentCriteriaBatchRequest): Promise<EnrichmentBatchSummary> {
    return wisefoodRestApi.post<EnrichmentBatchSummary, EnrichmentCriteriaBatchRequest>(
      `${this.basePath}/batches`,
      criteria
    )
  }

  async listBatches(): Promise<EnrichmentBatchSummary[]> {
    return wisefoodRestApi.get<EnrichmentBatchSummary[]>(`${this.basePath}/batches`)
  }

  async getBatch(batchId: string): Promise<EnrichmentBatchSummary> {
    return wisefoodRestApi.get<EnrichmentBatchSummary>(
      `${this.basePath}/batches/${encodeURIComponent(batchId)}`
    )
  }

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

  /**
   * Force the workers back into a running state.
   *
   * Resume alone is not always enough: the pause switch has no expiry so it
   * survives deploys, and a thread that died leaves `running: true` behind,
   * which makes the worker refuse to start again. Admin-only.
   */
  async restartWorkers(
    options: { sweeper?: boolean, jobs?: boolean, resume?: boolean } = {}
  ): Promise<EnrichmentWorkerRestartResponse> {
    return wisefoodRestApi.post<
      EnrichmentWorkerRestartResponse,
      { sweeper: boolean, jobs: boolean, resume: boolean }
    >(`${this.basePath}/worker/restart`, {
      sweeper: options.sweeper ?? true,
      jobs: options.jobs ?? true,
      resume: options.resume ?? true
    })
  }
}

export default new FoodScholarEnrichmentApiService()
