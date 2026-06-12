import wisefoodRestApi from './wisefoodRestApi'

export interface ObservabilityStatus {
  enabled: boolean
  langfuse_reachable: boolean
}

export interface MetricRow {
  label: string
  value: number
}

export interface ObservabilityMetrics {
  rows: MetricRow[]
  enabled: boolean
}

export interface TraceRow {
  id?: string
  name?: string
  timestamp?: string
  latency?: number
  totalCost?: number
  tags?: string[]
  [k: string]: unknown
}

export interface PromptSummary {
  name: string
  // Langfuse v2 prompts list returns `versions` (array) and `lastUpdatedAt`.
  versions?: number[]
  labels?: string[]
  tags?: string[]
  lastUpdatedAt?: string
  [k: string]: unknown
}

export interface PromptDetail {
  name: string
  version?: number
  type?: string
  // `prompt` is a string for text prompts, or an array of chat messages.
  prompt?: string | Array<{ role?: string, content?: string }>
  labels?: string[]
  tags?: string[]
  config?: Record<string, unknown>
  commitMessage?: string | null
  [k: string]: unknown
}

export interface TimeBucket {
  bucket: string
  value: number
}

export interface DashboardData {
  enabled: boolean
  requestsOverTime: TimeBucket[]
  costOverTime: TimeBucket[]
  tokensOverTime: TimeBucket[]
  requestsByModel: MetricRow[]
  costByModel: MetricRow[]
  tokensByModel: MetricRow[]
  latencyByModel: { p50: MetricRow[], p95: MetricRow[], p99: MetricRow[] }
  requestsByFeature: MetricRow[]
  traces: TraceRow[]
  prompts: PromptSummary[]
}

export type DashboardRange = '24h' | '7d' | '30d'

const unwrap = <T>(payload: unknown, key: string, fallback: T): T => {
  const envelope = payload as { result?: Record<string, unknown> } | null
  const result = envelope?.result ?? (payload as Record<string, unknown> | null)
  const value = result?.[key]
  return (value ?? fallback) as T
}

class ObservabilityApiService {
  // The observability endpoints live on wisefood-api (CONTEXT_PATH=/rest), reached
  // via wisefoodRestApi whose base already includes /rest/api/v1 — NOT the /dc/api
  // Data API that backs catalogApi.
  private readonly basePath = '/observability'

  async getStatus(): Promise<ObservabilityStatus> {
    try {
      const payload = await wisefoodRestApi.get<unknown>(`${this.basePath}/status`)
      return {
        enabled: Boolean(unwrap(payload, 'enabled', false)),
        langfuse_reachable: Boolean(unwrap(payload, 'langfuse_reachable', false))
      }
    } catch {
      return { enabled: false, langfuse_reachable: false }
    }
  }

  async getMetrics(params: {
    from: string
    to: string
    view?: string
    measure?: string
    aggregation?: string
    dimension?: string
    granularity?: string
  }): Promise<ObservabilityMetrics> {
    try {
      const query = new URLSearchParams({ from: params.from, to: params.to })
      if (params.view) query.set('view', params.view)
      if (params.measure) query.set('measure', params.measure)
      if (params.aggregation) query.set('aggregation', params.aggregation)
      if (params.dimension) query.set('dimension', params.dimension)
      if (params.granularity) query.set('granularity', params.granularity)
      const payload = await wisefoodRestApi.get<unknown>(`${this.basePath}/metrics?${query.toString()}`)
      return {
        rows: unwrap<MetricRow[]>(payload, 'rows', []),
        enabled: Boolean(unwrap(payload, 'enabled', false))
      }
    } catch {
      return { rows: [], enabled: false }
    }
  }

  async getTraces(limit = 50, tag?: string): Promise<TraceRow[]> {
    try {
      const query = new URLSearchParams({ limit: String(limit) })
      if (tag) query.set('tag', tag)
      const payload = await wisefoodRestApi.get<unknown>(`${this.basePath}/traces?${query.toString()}`)
      return unwrap<TraceRow[]>(payload, 'traces', [])
    } catch {
      return []
    }
  }

  async getPrompts(): Promise<PromptSummary[]> {
    try {
      const payload = await wisefoodRestApi.get<unknown>(`${this.basePath}/prompts`)
      return unwrap<PromptSummary[]>(payload, 'prompts', [])
    } catch {
      return []
    }
  }

  /**
   * Fetch a single prompt's detail (template content, labels, tags, config) for
   * the read-only drawer. Prompt names can contain '/', which we keep as-is so
   * the gateway forwards the full path to Langfuse. Returns null on any failure.
   */
  async getPromptDetail(name: string): Promise<PromptDetail | null> {
    try {
      const encoded = name.split('/').map(encodeURIComponent).join('/')
      const payload = await wisefoodRestApi.get<unknown>(`${this.basePath}/prompts/${encoded}`)
      return unwrap<PromptDetail | null>(payload, 'prompt', null)
    } catch {
      return null
    }
  }

  /**
   * Fetch the full observability dashboard in one batched server-side call.
   * `range` controls the time window and bucket granularity.
   */
  async getDashboard(range: DashboardRange = '7d'): Promise<DashboardData> {
    const empty: DashboardData = {
      enabled: false,
      requestsOverTime: [], costOverTime: [], tokensOverTime: [],
      requestsByModel: [], costByModel: [], tokensByModel: [],
      latencyByModel: { p50: [], p95: [], p99: [] },
      requestsByFeature: [], traces: [], prompts: []
    }

    const now = new Date()
    const spanMs = range === '24h' ? 24 * 3600e3 : range === '30d' ? 30 * 24 * 3600e3 : 7 * 24 * 3600e3
    const granularity = range === '24h' ? 'hour' : 'day'
    const query = new URLSearchParams({
      from: new Date(now.getTime() - spanMs).toISOString(),
      to: now.toISOString(),
      granularity
    })

    try {
      const payload = await wisefoodRestApi.get<unknown>(`${this.basePath}/dashboard?${query.toString()}`)
      const get = <T>(key: string, fallback: T): T => unwrap<T>(payload, key, fallback)
      if (!unwrap(payload, 'enabled', false)) return empty
      const latency = get<{ p50?: MetricRow[], p95?: MetricRow[], p99?: MetricRow[] }>('latency_by_model', {})
      return {
        enabled: true,
        requestsOverTime: get<TimeBucket[]>('requests_over_time', []),
        costOverTime: get<TimeBucket[]>('cost_over_time', []),
        tokensOverTime: get<TimeBucket[]>('tokens_over_time', []),
        requestsByModel: get<MetricRow[]>('requests_by_model', []),
        costByModel: get<MetricRow[]>('cost_by_model', []),
        tokensByModel: get<MetricRow[]>('tokens_by_model', []),
        latencyByModel: { p50: latency.p50 ?? [], p95: latency.p95 ?? [], p99: latency.p99 ?? [] },
        requestsByFeature: get<MetricRow[]>('requests_by_feature', []),
        traces: get<TraceRow[]>('traces', []),
        prompts: get<PromptSummary[]>('prompts', [])
      }
    } catch {
      return empty
    }
  }

  /**
   * Total LLM cost (USD) over the last `days`, summed across all models — used for
   * the console KPI tile. Returns null when observability is disabled/unavailable.
   */
  async getCostSummary(days = 7): Promise<number | null> {
    const to = new Date()
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)
    const { rows, enabled } = await this.getMetrics({
      from: from.toISOString(),
      to: to.toISOString(),
      view: 'observations',
      measure: 'totalCost',
      aggregation: 'sum',
      dimension: 'providedModelName'
    })
    if (!enabled) return null
    return rows.reduce((sum, r) => sum + (Number.isFinite(r.value) ? r.value : 0), 0)
  }
}

export default new ObservabilityApiService()
