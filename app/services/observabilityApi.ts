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
}

export default new ObservabilityApiService()
