import wisefoodRestApi from './wisefoodRestApi'

/**
 * The Source Integrator — research, propose, approve.
 *
 * Endpoints: /foodscholar/integrator/*, all admin-or-expert at the gateway.
 *
 * The identity is never sent from here. The gateway takes the caller's `sub`
 * from their token and passes it on; a client that could name its own subject
 * could read another curator's conversation.
 */

export type ProposalStatus = 'researching' | 'proposed' | 'approved'
  | 'running' | 'imported' | 'rejected' | 'failed'

export type SourceKind = 'guide' | 'article' | 'textbook' | 'fctable' | 'rcollection'

export interface IntegratorSession {
  id: string
  title: string | null
  status: string
  created_at: string | null
  updated_at: string | null
}

export interface IntegratorMessage {
  seq: number
  role: 'user' | 'assistant' | 'tool' | 'system'
  content: string | null
  /** Set on tool turns — which tool produced this. */
  tool_name: string | null
  created_at: string | null
}

export interface LicenceEvidence {
  where?: string
  quote?: string
  url?: string
  licence?: string | null
  [k: string]: unknown
}

export interface Proposal {
  id: string
  session_id: string | null
  kind: SourceKind
  title: string
  source_url: string | null
  status: ProposalStatus
  country: string | null
  language: string | null
  population_group: string | null
  licence: string | null
  licence_confidence: number | null
  licence_evidence: LicenceEvidence[]
  licence_override_reason: string | null
  /** What the agent scored it. */
  proposed_rank: number | null
  /** Where a curator dragged it. Kept beside the agent's, never over it. */
  expert_rank: number | null
  rationale: string | null
  plan: string[]
  metadata: Record<string, unknown>
  approved_by: string | null
  approved_at: string | null
  created_at: string | null
  result: Record<string, unknown>
}

export interface ChatTurn {
  session_id: string
  reply: string
  /** 'completed', or why the run stopped early — a step or token ceiling. */
  stop_reason: string
  steps: number
  tokens: number
  model: string
}

export interface BacklogItem {
  id: string
  kind: SourceKind
  title: string
  url: string | null
  country: string | null
  language: string | null
  population_group: string | null
  status: string
  attributes: Record<string, string>
  source_sheet: string | null
}

export interface ToolCall {
  id: number
  tool: string
  write: boolean
  ok: boolean
  arguments: Record<string, unknown> | null
  error: { code?: string, message?: string } | null
  duration_ms: number | null
  created_at: string | null
}

const unwrap = <T>(payload: unknown, fallback: T): T => {
  const envelope = payload as { result?: unknown } | null
  return ((envelope?.result ?? payload) ?? fallback) as T
}

/** The message a failed call should show, rather than "Request failed". */
export const failureText = (error: unknown, fallback: string): string => {
  const detail = (error as { data?: { error?: { detail?: string } } })?.data?.error?.detail
  return detail || fallback
}

class IntegratorApiService {
  private readonly base = '/foodscholar/integrator'

  async createSession(title?: string): Promise<IntegratorSession> {
    return unwrap(
      await wisefoodRestApi.post<unknown>(`${this.base}/sessions`, { title: title || null }),
      {} as IntegratorSession
    )
  }

  async listSessions(): Promise<IntegratorSession[]> {
    try {
      const payload = await wisefoodRestApi.get<unknown>(`${this.base}/sessions`)
      return unwrap<{ sessions: IntegratorSession[] }>(payload, { sessions: [] }).sessions ?? []
    } catch {
      return []
    }
  }

  async history(sessionId: string): Promise<IntegratorMessage[]> {
    try {
      const payload = await wisefoodRestApi.get<unknown>(
        `${this.base}/sessions/${encodeURIComponent(sessionId)}/history`
      )
      return unwrap<{ messages: IntegratorMessage[] }>(payload, { messages: [] }).messages ?? []
    } catch {
      return []
    }
  }

  /**
   * One turn. Slow by nature — the agent may search the web and read several
   * pages before it answers — so callers should show that it is working
   * rather than assume a hung request.
   */
  async chat(sessionId: string, message: string): Promise<ChatTurn> {
    return unwrap(
      await wisefoodRestApi.post<unknown>(
        `${this.base}/sessions/${encodeURIComponent(sessionId)}/chat`, { message }
      ),
      {} as ChatTurn
    )
  }

  async listProposals(params: { sessionId?: string, status?: ProposalStatus } = {}): Promise<Proposal[]> {
    try {
      const query = new URLSearchParams()
      if (params.sessionId) query.set('session_id', params.sessionId)
      if (params.status) query.set('status', params.status)
      const suffix = query.size ? `?${query.toString()}` : ''
      const payload = await wisefoodRestApi.get<unknown>(`${this.base}/proposals${suffix}`)
      return unwrap<{ proposals: Proposal[] }>(payload, { proposals: [] }).proposals ?? []
    } catch {
      return []
    }
  }

  /**
   * Approve a proposal for integration.
   *
   * `overrideReason` is required when the licence could not be determined —
   * the server refuses otherwise, and records the reason with the approval.
   */
  async approve(proposalId: string, overrideReason?: string): Promise<Proposal> {
    return unwrap(
      await wisefoodRestApi.post<unknown>(
        `${this.base}/proposals/${encodeURIComponent(proposalId)}/approve`,
        { override_reason: overrideReason || null }
      ),
      {} as Proposal
    )
  }

  async reject(proposalId: string, reason = ''): Promise<Proposal> {
    return unwrap(
      await wisefoodRestApi.post<unknown>(
        `${this.base}/proposals/${encodeURIComponent(proposalId)}/reject`, { reason }
      ),
      {} as Proposal
    )
  }

  /** The curator's order, by proposal id, best first. */
  async rerank(order: string[]): Promise<Proposal[]> {
    const payload = await wisefoodRestApi.post<unknown>(
      `${this.base}/proposals/rerank`, { order }
    )
    return unwrap<{ proposals: Proposal[] }>(payload, { proposals: [] }).proposals ?? []
  }

  async backlog(
    params: { kind?: SourceKind, status?: string, limit?: number, offset?: number } = {}
  ): Promise<{ total: number, offset: number, items: BacklogItem[] }> {
    const empty = { total: 0, offset: 0, items: [] }
    try {
      const query = new URLSearchParams({
        limit: String(params.limit ?? 50), offset: String(params.offset ?? 0)
      })
      if (params.kind) query.set('kind', params.kind)
      if (params.status) query.set('status', params.status)
      return unwrap(
        await wisefoodRestApi.get<unknown>(`${this.base}/backlog?${query.toString()}`), empty
      )
    } catch {
      return empty
    }
  }

  /** What the agent actually did — every tool call, newest first. */
  async audit(params: { sessionId?: string, proposalId?: string } = {}): Promise<ToolCall[]> {
    try {
      const query = new URLSearchParams()
      if (params.sessionId) query.set('session_id', params.sessionId)
      if (params.proposalId) query.set('proposal_id', params.proposalId)
      const suffix = query.size ? `?${query.toString()}` : ''
      const payload = await wisefoodRestApi.get<unknown>(`${this.base}/audit${suffix}`)
      return unwrap<{ tool_calls: ToolCall[] }>(payload, { tool_calls: [] }).tool_calls ?? []
    } catch {
      return []
    }
  }
}

export const integratorApi = new IntegratorApiService()
export default integratorApi
