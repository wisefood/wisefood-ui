import { getWisefoodRestApiUrl } from '~/utils/runtimeConfig'
import wisefoodRestApi from './wisefoodRestApi'

/**
 * The read side of activity analytics — what the Insights console shows.
 *
 * Distinct from `analyticsApi`, which is the write side (client events going
 * out). Everything here is admin/expert only at the gateway; a normal user has
 * no route to any of it.
 *
 * Follows the console's established shape: every call degrades to an empty
 * result rather than throwing, so a page renders its empty state instead of a
 * stack trace when analytics is switched off or the schema is not applied.
 */

const unwrap = <T>(payload: unknown, key: string, fallback: T): T => {
  const envelope = payload as { result?: Record<string, unknown> } | null
  const result = envelope?.result ?? (payload as Record<string, unknown> | null)
  const value = result?.[key]
  return (value ?? fallback) as T
}

const asResult = <T>(payload: unknown, fallback: T): T => {
  const envelope = payload as { result?: unknown } | null
  return ((envelope?.result ?? payload) ?? fallback) as T
}

export interface Window { days: number, since: string, until: string }

export interface PeriodTotals {
  events: number
  active_users: number
  sessions: number
  searches: number
  searches_with_no_results: number
  zero_result_rate: number
  feedback: number
  feedback_negative: number
  negative_feedback_rate: number
  cost_usd: number
}

export interface Overview extends Window {
  /** The same figures for the period before this one, so a number can be
   *  read as a direction rather than a total. */
  previous: PeriodTotals
  events: number
  active_users: number
  sessions: number
  guest_sessions: number
  /** Why the per-person figures may read zero. Under opt-in, activity is
   *  counted but nobody is named until they agree, so a healthy session count
   *  beside zero identified users is the setting working, not a fault. */
  consent: {
    mode: string
    consented_users: number
  }
  events_by_app: Array<{ app: string, events: number }>
  daily: Array<{ day: string, events: number, active_users: number }>
  searches: number
  searches_with_no_results: number
  zero_result_rate: number
  feedback: number
  feedback_new: number
  feedback_negative: number
  negative_feedback_rate: number
  llm_calls: number
  total_tokens: number
  cost_usd: number
}

export interface AttentionItem {
  key: string
  severity: 'error' | 'warning' | 'info'
  count: number
  title: string
  detail: string
  action: string
  to: string
}

export interface TrendingRow {
  query: string
  query_hash: string
  searches: number
  sessions: number
  zero_result: number
  previous: number
  /** Null when the query is new this window — "no previous data" is not "+100%". */
  change_pct: number | null
  is_new: boolean
}

export interface ZeroResultRow {
  query: string
  searches: number
  sessions: number
  last_seen: string | null
  surface: string
}

export interface UserRow {
  user_id: string
  events: number
  sessions: number
  first_seen: string | null
  last_seen: string | null
  questions_asked: number
  searches: number
  chat_turns: number
  total_tokens: number
  cost_usd: number
}

export interface UsageRow {
  calls: number
  total_tokens: number
  cost_usd: number
  /** Reported apart as well as together: output tokens cost several times
   *  input on every provider here, so a single total is the one number from
   *  which cost cannot be reconstructed. */
  input_tokens: number
  output_tokens: number
  /** Calls whose model has no known rate. Their tokens count; their cost does
   *  not, so any spend figure containing them is a floor. */
  unpriced_calls: number
  p95_ms: number | null
  model?: string
  app?: string
  feature?: string
  user_id?: string
  provider?: string
}

/** How much of the spend figure is actually grounded in a known rate. */
export interface PricingCoverage {
  calls: number
  unpriced_calls: number
  priced_share: number
  unpriced_tokens: number
  unpriced_models: Array<{ model: string | null, calls: number }>
  /** The date the built-in rate table was taken from the providers' pricing
   *  pages. These are list prices, not an invoice. */
  rates_as_of: string
}

export interface FeedbackRow {
  id: number
  occurred_at: string
  request_id: string | null
  user_id: string | null
  member_id: string | null
  app: string
  target_type: string
  target_id: string | null
  rating_kind: string
  rating_value: string | null
  rating_value_num: number | null
  reason: string | null
  comment: string | null
  source: string
  status: 'new' | 'triaged' | 'resolved'
  /** The session the complaint came out of, so a rating leads to what the
   *  person was actually doing when they gave it. */
  client_session_id: string | null
}

export interface QaRequestRow {
  request_id: string
  question: string
  mode: string
  model: string
  language: string
  created_at: string
  user_id: string | null
  member_id: string | null
  correlation_id: string | null
  confidence: string | null
  articles_consulted: number
  cache_hit: boolean
  has_feedback: boolean
  feedback_count: number
  has_negative_feedback: boolean
  answer_preview: string | null
}

export interface QaRequestDetail extends QaRequestRow {
  primary_answer: Record<string, unknown> | null
  secondary_answer: Record<string, unknown> | null
  retrieved_article_urns: string[]
  pipeline_meta: Record<string, unknown> | null
  feedback: Array<Record<string, unknown>>
}

export interface ReviewRow {
  id: number
  created_at: string
  reviewer_id: string
  reviewer_name: string | null
  target_type: string
  target_id: string
  verdict: string
  notes: string | null
  tags: string[]
}

export interface SessionSummary {
  session_id: string
  started_at: string | null
  ended_at: string | null
  events: number
  events_by_type: Record<string, number>
  questions_asked: number
  chat_turns: number
  meal_plans_generated: number
  meal_plans_saved: number
  recipes_viewed: number
  searches: number
  searches_with_no_results: number
  feedback_given: number
  /** The feedback rows themselves, not just the count. */
  feedback: FeedbackRow[]
  /** Every search this session ran, with the outcome of each. */
  searches_performed: Array<{
    occurred_at: string | null
    surface: string | null
    query: string | null
    results: number | null
    zero_result: boolean
    relaxed: boolean
    lexical_fallback: boolean
    latency_ms: number | null
  }>
  llm_calls: number
  total_tokens: number
  cost_usd: number
  /** The individual model calls, so a costly session can be explained rather
   *  than only totalled. `cost_usd` is null where the model has no known
   *  rate — render that as unpriced, never as $0.00. */
  llm_calls_detail: Array<{
    occurred_at: string | null
    app: string | null
    feature: string | null
    model: string | null
    input_tokens: number | null
    output_tokens: number | null
    total_tokens: number | null
    cost_usd: number | null
    latency_ms: number | null
    trace_id: string | null
  }>
  /** Who the session belonged to. Usually empty under opt-in consent; the
   *  counts above hold either way, because none of them needed an identity. */
  users: Array<{ user_id: string | null, member_id: string | null, events: number }>
  apps: Array<{ app: string, events: number }>
  duration_seconds: number | null
  errors: number
  server_errors: number
  slowest_request_ms: number | null
  /** Distinct people the session could be attributed to — zero when nobody in
   *  it had consented to being named. The counts above hold either way. */
  identified_users: number
  timeline: Array<{
    occurred_at: string | null
    event_type: string
    app: string
    route: string | null
    status: number | null
    duration_ms: number | null
    /** Seconds of silence before this action. Null on the first one. */
    gap_seconds: number | null
    props: Record<string, unknown>
  }>
  timeline_truncated: boolean
  /** Actions in the whole session, so the page can say "100 of 4,312" rather
   *  than a silent "truncated" note with no way to reach action 101. */
  timeline_total: number
  timeline_offset: number
  timeline_limit: number
}

export interface RoutePerfRow {
  route: string
  app: string
  requests: number
  errors: number
  server_errors: number
  error_rate: number
  p50_ms: number | null
  p95_ms: number | null
  max_ms: number | null
}

export interface RoutePerformance extends Window {
  routes: RoutePerfRow[]
  slowest: RoutePerfRow[]
  most_errors: RoutePerfRow[]
  by_status: Array<{ status: number | null, count: number }>
}

export interface SurfaceQuality {
  surface: string
  searches: number
  zero_result: number
  zero_result_rate: number
  relaxed: number
  p95_ms: number | null
}

export interface SearchQuality extends Window {
  searches: number
  zero_result: number
  zero_result_rate: number
  relaxed: number
  relaxed_rate: number
  lexical_fallback: number
  p50_ms: number | null
  p95_ms: number | null
  by_surface: SurfaceQuality[]
  /** Queries that only returned anything because constraints were loosened —
   *  a near-miss in the catalogue, not a success. */
  rescued_by_relaxing: Array<{ query: string, searches: number }>
}

export interface FeedbackTargetRow {
  target_type: string
  target_id: string
  app: string
  feedback: number
  negative: number
  negative_rate: number
  last_seen: string | null
}

export interface FunnelStage {
  stage: string
  events: number
  sessions: number
  rate: number
}

// --- Real user monitoring ---------------------------------------------------

export interface ClientSessionRow {
  session_id: string
  started_at: string | null
  last_seen_at: string | null
  user_id: string | null
  member_id: string | null
  is_guest: boolean
  app: string | null
  client: string | null
  release: string | null
  browser: string | null
  browser_version: string | null
  os: string | null
  os_version: string | null
  device_type: string | null
  is_bot: boolean
  screen: string | null
  viewport: string | null
  screen_w: number | null
  screen_h: number | null
  viewport_w: number | null
  viewport_h: number | null
  device_pixel_ratio: number | null
  color_scheme: string | null
  reduced_motion: boolean | null
  /** A network, never an address: IPv4 is truncated to /24 and IPv6 to /48. */
  ip_prefix: string | null
  country: string | null
  timezone: string | null
  connection: string | null
  locale: string | null
  events: number
  errors: number
  pages: number
  failed_requests?: number
  duration_seconds?: number | null
}

export interface SessionBoard extends Window {
  total: number
  /** Crawlers, excluded from every figure here unless explicitly included. */
  bots: number
  offset: number
  limit: number
  sessions: ClientSessionRow[]
  by_device: Array<{ device_type: string, sessions: number, users: number }>
  by_browser: Array<{ browser: string, sessions: number, users: number }>
  by_os: Array<{ os: string, sessions: number, users: number }>
  by_country: Array<{ country: string, sessions: number, users: number }>
  viewports: {
    phone: number, tablet: number, laptop: number, desktop: number
    median_width: number | null
  }
}

export interface SessionBoardFilters {
  days?: number
  limit?: number
  offset?: number
  userId?: string
  deviceType?: string
  browser?: string
  os?: string
  country?: string
  hasErrors?: boolean
  search?: string
  includeBots?: boolean
}

export interface ErrorGroupRow {
  fingerprint: string
  first_seen_at: string | null
  last_seen_at: string | null
  app: string | null
  kind: string | null
  name: string | null
  message: string | null
  culprit: string | null
  occurrences: number
  sessions: number
  users: number
  status: string
  first_release: string | null
  last_release: string | null
  resolved_at: string | null
  resolved_by: string | null
  notes: string | null
}

export interface ClientErrorRow {
  id: number
  occurred_at: string | null
  request_id: string | null
  client_session_id: string | null
  user_id: string | null
  app: string
  release: string | null
  fingerprint: string
  kind: string
  name: string | null
  message: string | null
  culprit: string | null
  stack: string | null
  url_path: string | null
  line_no: number | null
  col_no: number | null
  handled: boolean
  breadcrumbs: Array<Record<string, unknown>>
  context: Record<string, unknown>
  browser: string | null
  os: string | null
  device_type: string | null
}

export interface ErrorReport extends Window {
  total_groups: number
  groups: ErrorGroupRow[]
  occurrences: number
  sessions_affected: number
  distinct_errors: number
  unhandled: number
  unhandled_rate: number
  /** First seen inside this window — the ones that point at a recent deploy. */
  new_groups: number
  daily: Array<{ day: string, errors: number, sessions: number }>
  by_browser: Array<{ browser: string, errors: number }>
}

export interface ErrorDetail {
  group: ErrorGroupRow
  occurrences: ClientErrorRow[]
  by_browser: Array<{ value: string, count: number }>
  by_os: Array<{ value: string, count: number }>
  by_device: Array<{ value: string, count: number }>
  by_path: Array<{ value: string, count: number }>
  by_release: Array<{ value: string, count: number }>
  daily: Array<{ day: string, errors: number }>
}

export interface HeatmapCell {
  x: number
  y: number
  clicks: number
  rage: number
  dead: number
  /** Already divided by the busiest cell, so nothing has to find the max. */
  intensity: number
}

export interface ClickMap extends Window {
  path: string
  grid: number
  clicks: number
  sessions: number
  rage_clicks: number
  dead_clicks: number
  median_scroll_depth: number | null
  peak: number
  cells: HeatmapCell[]
  elements: Array<{
    element_key: string | null
    element_role: string | null
    clicks: number
    sessions: number
    rage: number
    dead: number
  }>
  scroll_depth: {
    measured: number
    reached_25: number
    reached_50: number
    reached_75: number
    reached_bottom: number
  }
}

export interface InteractionOverview extends Window {
  pages: Array<{
    path: string
    clicks: number
    sessions: number
    rage: number
    dead: number
    median_scroll_depth: number | null
  }>
  frustration: Array<{
    path: string
    element_key: string | null
    kind: string
    count: number
    sessions: number
  }>
}

export interface VitalSummary {
  samples: number
  p50: number | null
  /** The figure the web-vitals standard is judged on. */
  p75: number | null
  p95: number | null
  good_rate: number
  poor_rate: number
}

export interface VitalsReport extends Window {
  by_metric: Array<VitalSummary & { metric: string }>
  by_device: Array<VitalSummary & { metric: string, device_type: string }>
  by_path: Array<VitalSummary & { path: string, metric: string }>
}

export interface SessionDevice {
  device: ClientSessionRow | null
  errors: ClientErrorRow[]
  vitals: Array<{ metric: string, path: string, value: number, rating: string | null }>
  /** Rage and dead clicks: the clearest frustration signal recorded. */
  frustration: Array<{ kind: string, path: string, element_key: string | null, clicks: number }>
}

export interface EngagementPatterns extends Window {
  by_hour: Array<{ hour: number, events: number, sessions: number }>
  by_weekday: Array<{ weekday: number, label: string, events: number, sessions: number }>
  busiest_hour: number | null
  session_depth: {
    sessions: number
    median_actions: number | null
    p90_actions: number | null
    max_actions: number | null
    buckets: Array<{ label: string, sessions: number }>
    bounce_rate: number
  }
  retention: {
    identified_users: number
    new_users: number
    returning_users: number
    returning_rate: number
  }
}

export interface ContentReport extends Window {
  qa: {
    asked: number
    answered: number
    unanswered: number
    answer_rate: number
    persist_failed: number
    cache_hits: number
    cache_hit_rate: number
    with_retrieval: number
    retrieval_rate: number
    avg_confidence: number | null
    avg_articles: number | null
    by_mode: Array<{ value: string, count: number }>
    by_language: Array<{ value: string, count: number }>
    by_model: Array<{ value: string, count: number }>
  }
  chat: {
    turns: number
    by_intent: Array<{ value: string, count: number }>
    p50_ms: number | null
    p95_ms: number | null
  }
  pages: Array<{ path: string, views: number, sessions: number }>
  entry_pages: Array<{ path: string, sessions: number }>
  search_cache: { searches: number, from_cache: number, cache_hit_rate: number }
}

export interface FeedbackQuality extends Window {
  by_kind: Array<{
    rating_kind: string
    feedback: number
    negative: number
    negative_rate: number
    /** False for A/B preference, where neither answer is a complaint. */
    can_be_negative: boolean
    avg_score: number | null
  }>
  reasons: Array<{ reason: string, count: number, negative: number }>
  by_source: Array<{ source: string, count: number }>
  daily: Array<{ day: string, feedback: number, negative: number, avg_score: number | null }>
  score: { responses: number, mean: number | null, median: number | null, scale: string }
  backlog: Array<{ status: string, count: number }>
  oldest_untriaged: string | null
}

export interface SearchFilterReport extends Window {
  facets: Array<{
    facet: string
    searches: number
    zero_result: number
    zero_result_rate: number
  }>
  searches: number
  unfiltered: number
  filtered_rate: number
  avg_facets_when_filtered: number | null
  recovery: {
    empty_first_pass: number
    rescued: number
    recovery_rate: number
    true_misses: number
  }
  empty_combinations: Array<{ filters: string, searches: number }>
}

export interface AudienceReport extends Window {
  by_client: Array<{ value: string, events: number, sessions: number }>
  by_locale: Array<{ value: string, events: number, sessions: number }>
  by_role: Array<{ role: string, users: number, events: number }>
  guest_events: number
  signed_in_events: number
  households: number
  clock_skew: { events_over_5min: number, worst_seconds: number | null }
}

export interface ReviewSummary extends Window {
  reviews: number
  by_verdict: Array<{ verdict: string, count: number, share: number }>
  by_reviewer: Array<{
    reviewer_id: string
    reviewer_name: string | null
    reviews: number
    targets: number
    last_review: string | null
  }>
  by_target_type: Array<{ target_type: string, reviews: number, targets: number }>
  tags: Array<{ tag: string, count: number }>
  agreement: {
    targets_reviewed: number
    reviewed_more_than_once: number
    disagreements: number
    disagreement_rate: number
  }
}

export interface RecorderHealth {
  enabled: boolean
  running: boolean
  queue_depth: number
  queue_max: number
  settings: Record<string, unknown>
  stats: Record<string, unknown>
}

const emptyWindow = (days: number): Window => ({ days, since: '', until: '' })

const emptyTotals = (): PeriodTotals => ({
  events: 0, active_users: 0, sessions: 0, searches: 0,
  searches_with_no_results: 0, zero_result_rate: 0,
  feedback: 0, feedback_negative: 0, negative_feedback_rate: 0, cost_usd: 0
})

export const emptyOverview = (days = 7): Overview => ({
  ...emptyWindow(days),
  previous: emptyTotals(),
  consent: { mode: 'opt_in', consented_users: 0 },
  events: 0, active_users: 0, sessions: 0, guest_sessions: 0,
  events_by_app: [], daily: [],
  searches: 0, searches_with_no_results: 0, zero_result_rate: 0,
  feedback: 0, feedback_new: 0, feedback_negative: 0, negative_feedback_rate: 0,
  llm_calls: 0, total_tokens: 0, cost_usd: 0
})

class InsightsApiService {
  private readonly basePath = '/analytics'

  async getOverview(days = 7): Promise<Overview> {
    try {
      const payload = await wisefoodRestApi.get<unknown>(`${this.basePath}/overview?days=${days}`)
      return asResult<Overview>(payload, emptyOverview(days))
    } catch {
      return emptyOverview(days)
    }
  }

  /** What is worth acting on, with the page that acts on it. */
  async getAttention(days = 7): Promise<AttentionItem[]> {
    try {
      const payload = await wisefoodRestApi.get<unknown>(`${this.basePath}/attention?days=${days}`)
      return unwrap<AttentionItem[]>(payload, 'items', [])
    } catch {
      return []
    }
  }

  async getTrending(days = 7, limit = 20): Promise<{ top: TrendingRow[], rising: TrendingRow[] }> {
    try {
      const payload = await wisefoodRestApi.get<unknown>(
        `${this.basePath}/queries/trending?days=${days}&limit=${limit}`
      )
      return {
        top: unwrap<TrendingRow[]>(payload, 'top', []),
        rising: unwrap<TrendingRow[]>(payload, 'rising', [])
      }
    } catch {
      return { top: [], rising: [] }
    }
  }

  async getZeroResult(days = 7, limit = 20): Promise<ZeroResultRow[]> {
    try {
      const payload = await wisefoodRestApi.get<unknown>(
        `${this.basePath}/queries/zero-result?days=${days}&limit=${limit}`
      )
      return unwrap<ZeroResultRow[]>(payload, 'queries', [])
    } catch {
      return []
    }
  }

  async getUsers(days = 30, limit = 50): Promise<UserRow[]> {
    try {
      const payload = await wisefoodRestApi.get<unknown>(
        `${this.basePath}/users?days=${days}&limit=${limit}`
      )
      return unwrap<UserRow[]>(payload, 'users', [])
    } catch {
      return []
    }
  }

  async getLlmUsage(days = 30): Promise<{
    by_model: UsageRow[]
    by_app: UsageRow[]
    by_feature: UsageRow[]
    by_user: UsageRow[]
    by_provider: UsageRow[]
    pricing: PricingCoverage | null
    daily: Array<{ day: string, total_tokens: number, cost_usd: number }>
  }> {
    const empty = {
      by_model: [], by_app: [], by_feature: [], by_user: [], by_provider: [],
      pricing: null, daily: []
    }
    try {
      const payload = await wisefoodRestApi.get<unknown>(`${this.basePath}/llm-usage?days=${days}`)
      return {
        by_model: unwrap(payload, 'by_model', []),
        by_app: unwrap(payload, 'by_app', []),
        by_feature: unwrap(payload, 'by_feature', []),
        by_user: unwrap(payload, 'by_user', []),
        by_provider: unwrap(payload, 'by_provider', []),
        pricing: unwrap<PricingCoverage | null>(payload, 'pricing', null),
        daily: unwrap(payload, 'daily', [])
      }
    } catch {
      return empty
    }
  }

  async getFeedback(params: {
    limit?: number, offset?: number, status?: string, app?: string, negativeOnly?: boolean
  } = {}): Promise<{ total: number, items: FeedbackRow[] }> {
    try {
      const query = new URLSearchParams({
        limit: String(params.limit ?? 50),
        offset: String(params.offset ?? 0)
      })
      if (params.status) query.set('status', params.status)
      if (params.app) query.set('app', params.app)
      if (params.negativeOnly) query.set('negative_only', 'true')
      const payload = await wisefoodRestApi.get<unknown>(
        `${this.basePath}/feedback/inbox?${query.toString()}`
      )
      return {
        total: unwrap<number>(payload, 'total', 0),
        items: unwrap<FeedbackRow[]>(payload, 'items', [])
      }
    } catch {
      return { total: 0, items: [] }
    }
  }

  /** Move one item through new -> triaged -> resolved. Returns success. */
  async setFeedbackStatus(id: number, status: string): Promise<boolean> {
    try {
      await wisefoodRestApi.patch(`${this.basePath}/feedback/${id}/status`, { status })
      return true
    } catch {
      return false
    }
  }

  async getExpertActivity(days = 30, limit = 100): Promise<{
    by_actor: Array<{ user_id: string | null, action: string, count: number, last_seen: string | null }>
    recent: Array<Record<string, unknown>>
  }> {
    try {
      const payload = await wisefoodRestApi.get<unknown>(
        `${this.basePath}/expert-activity?days=${days}&limit=${limit}`
      )
      return {
        by_actor: unwrap(payload, 'by_actor', []),
        recent: unwrap(payload, 'recent', [])
      }
    } catch {
      return { by_actor: [], recent: [] }
    }
  }

  async getSession(
    sessionId: string,
    timeline: { limit?: number, offset?: number } = {}
  ): Promise<SessionSummary | null> {
    try {
      const query = new URLSearchParams({
        timeline_limit: String(timeline.limit ?? 100),
        timeline_offset: String(timeline.offset ?? 0)
      })
      const payload = await wisefoodRestApi.get<unknown>(
        `${this.basePath}/sessions/${encodeURIComponent(sessionId)}?${query.toString()}`
      )
      return asResult<SessionSummary | null>(payload, null)
    } catch {
      return null
    }
  }

  async getRecentSessions(limit = 50, days = 30): Promise<Array<{
    session_id: string, started_at: string | null, ended_at: string | null
    events: number, user_id: string | null
  }>> {
    try {
      const payload = await wisefoodRestApi.get<unknown>(
        `${this.basePath}/sessions?limit=${limit}&days=${days}`
      )
      return unwrap(payload, 'sessions', [])
    } catch {
      return []
    }
  }

  /** Latency and error rate per route. The operational half of the console. */
  async getPerformance(days = 7, limit = 25): Promise<RoutePerformance | null> {
    try {
      const payload = await wisefoodRestApi.get<unknown>(
        `${this.basePath}/performance?days=${days}&limit=${limit}`
      )
      return asResult<RoutePerformance | null>(payload, null)
    } catch {
      return null
    }
  }

  async getSearchQuality(days = 7): Promise<SearchQuality | null> {
    try {
      const payload = await wisefoodRestApi.get<unknown>(
        `${this.basePath}/search-quality?days=${days}`
      )
      return asResult<SearchQuality | null>(payload, null)
    } catch {
      return null
    }
  }

  async getFunnel(days = 7): Promise<FunnelStage[]> {
    try {
      const payload = await wisefoodRestApi.get<unknown>(`${this.basePath}/funnel?days=${days}`)
      return unwrap<FunnelStage[]>(payload, 'stages', [])
    } catch {
      return []
    }
  }

  /** Which specific recipes, articles and answers draw complaints. */
  async getFeedbackTargets(days = 30, limit = 25): Promise<FeedbackTargetRow[]> {
    try {
      const payload = await wisefoodRestApi.get<unknown>(
        `${this.basePath}/feedback/targets?days=${days}&limit=${limit}`
      )
      return unwrap<FeedbackTargetRow[]>(payload, 'targets', [])
    } catch {
      return []
    }
  }

  // --- Real user monitoring ------------------------------------------------

  /** Sessions with the device each ran on. Every column is filterable. */
  async getSessionBoard(filters: SessionBoardFilters = {}): Promise<SessionBoard | null> {
    try {
      const query = new URLSearchParams({
        days: String(filters.days ?? 7),
        limit: String(filters.limit ?? 50),
        offset: String(filters.offset ?? 0)
      })
      if (filters.userId) query.set('user_id', filters.userId)
      if (filters.deviceType) query.set('device_type', filters.deviceType)
      if (filters.browser) query.set('browser', filters.browser)
      if (filters.os) query.set('os', filters.os)
      if (filters.country) query.set('country', filters.country)
      if (filters.hasErrors !== undefined) query.set('has_errors', String(filters.hasErrors))
      if (filters.search) query.set('search', filters.search)
      if (filters.includeBots) query.set('include_bots', 'true')
      return asResult<SessionBoard | null>(
        await wisefoodRestApi.get<unknown>(`${this.basePath}/board?${query.toString()}`), null
      )
    } catch {
      return null
    }
  }

  async getSessionDevice(sessionId: string): Promise<SessionDevice | null> {
    try {
      return asResult<SessionDevice | null>(
        await wisefoodRestApi.get<unknown>(
          `${this.basePath}/sessions/${encodeURIComponent(sessionId)}/device`
        ),
        null
      )
    } catch {
      return null
    }
  }

  async getErrors(params: {
    days?: number, limit?: number, status?: string, app?: string
  } = {}): Promise<ErrorReport | null> {
    try {
      const query = new URLSearchParams({
        days: String(params.days ?? 7),
        limit: String(params.limit ?? 50)
      })
      if (params.status) query.set('status', params.status)
      if (params.app) query.set('app', params.app)
      return asResult<ErrorReport | null>(
        await wisefoodRestApi.get<unknown>(`${this.basePath}/errors?${query.toString()}`), null
      )
    } catch {
      return null
    }
  }

  async getError(fingerprint: string, limit = 25): Promise<ErrorDetail | null> {
    try {
      return asResult<ErrorDetail | null>(
        await wisefoodRestApi.get<unknown>(
          `${this.basePath}/errors/${encodeURIComponent(fingerprint)}?limit=${limit}`
        ),
        null
      )
    } catch {
      return null
    }
  }

  /** Move a failure through new -> acknowledged -> resolved. Returns success. */
  async setErrorStatus(fingerprint: string, status: string): Promise<boolean> {
    try {
      await wisefoodRestApi.patch(
        `${this.basePath}/errors/${encodeURIComponent(fingerprint)}/status`, { status }
      )
      return true
    } catch {
      return false
    }
  }

  async getInteractions(days = 30, limit = 25): Promise<InteractionOverview | null> {
    try {
      return asResult<InteractionOverview | null>(
        await wisefoodRestApi.get<unknown>(
          `${this.basePath}/interactions?days=${days}&limit=${limit}`
        ),
        null
      )
    } catch {
      return null
    }
  }

  /** One page's click map. `path` is a route pattern, not a URL. */
  async getHeatmap(params: {
    path: string, days?: number, grid?: number, deviceType?: string
  }): Promise<ClickMap | null> {
    try {
      const query = new URLSearchParams({
        path: params.path,
        days: String(params.days ?? 30),
        grid: String(params.grid ?? 40)
      })
      if (params.deviceType) query.set('device_type', params.deviceType)
      return asResult<ClickMap | null>(
        await wisefoodRestApi.get<unknown>(`${this.basePath}/heatmap?${query.toString()}`), null
      )
    } catch {
      return null
    }
  }

  async getVitals(days = 7, limit = 25): Promise<VitalsReport | null> {
    try {
      return asResult<VitalsReport | null>(
        await wisefoodRestApi.get<unknown>(`${this.basePath}/vitals?days=${days}&limit=${limit}`),
        null
      )
    } catch {
      return null
    }
  }

  async getPatterns(days = 30): Promise<EngagementPatterns | null> {
    try {
      return asResult<EngagementPatterns | null>(
        await wisefoodRestApi.get<unknown>(`${this.basePath}/patterns?days=${days}`), null
      )
    } catch {
      return null
    }
  }

  async getContent(days = 7, limit = 20): Promise<ContentReport | null> {
    try {
      return asResult<ContentReport | null>(
        await wisefoodRestApi.get<unknown>(`${this.basePath}/content?days=${days}&limit=${limit}`),
        null
      )
    } catch {
      return null
    }
  }

  async getFeedbackQuality(days = 30): Promise<FeedbackQuality | null> {
    try {
      return asResult<FeedbackQuality | null>(
        await wisefoodRestApi.get<unknown>(`${this.basePath}/feedback/quality?days=${days}`), null
      )
    } catch {
      return null
    }
  }

  async getSearchFilters(days = 30, limit = 20): Promise<SearchFilterReport | null> {
    try {
      return asResult<SearchFilterReport | null>(
        await wisefoodRestApi.get<unknown>(
          `${this.basePath}/search-filters?days=${days}&limit=${limit}`
        ),
        null
      )
    } catch {
      return null
    }
  }

  async getAudience(days = 30): Promise<AudienceReport | null> {
    try {
      return asResult<AudienceReport | null>(
        await wisefoodRestApi.get<unknown>(`${this.basePath}/audience?days=${days}`), null
      )
    } catch {
      return null
    }
  }

  async getReviewSummary(days = 90): Promise<ReviewSummary | null> {
    try {
      return asResult<ReviewSummary | null>(
        await wisefoodRestApi.get<unknown>(`${this.basePath}/reviews/summary?days=${days}`), null
      )
    } catch {
      return null
    }
  }

  /**
   * The URL that downloads one report as a spreadsheet.
   *
   * A URL rather than a fetch: the browser's own download machinery handles
   * the file, the progress and the filename, and pulling a large CSV into
   * memory to re-offer it as a blob would achieve nothing but a memory spike.
   */
  exportUrl(report: string, days = 30, limit = 1000): string {
    const query = new URLSearchParams({
      report, days: String(days), limit: String(limit)
    })
    return `${getWisefoodRestApiUrl()}/analytics/export.csv?${query.toString()}`
  }

  async getHealth(): Promise<RecorderHealth | null> {
    try {
      return asResult<RecorderHealth | null>(
        await wisefoodRestApi.get<unknown>(`${this.basePath}/health`), null
      )
    } catch {
      return null
    }
  }

  async getSettings(): Promise<{
    settings: Record<string, unknown>, defaults: Record<string, unknown>, platform_enabled: boolean
  } | null> {
    try {
      return asResult(await wisefoodRestApi.get<unknown>(`${this.basePath}/settings`), null)
    } catch {
      return null
    }
  }

  /** Change one runtime setting. Returns the error message, or null on success. */
  async setSetting(key: string, value: unknown): Promise<string | null> {
    try {
      await wisefoodRestApi.put(`${this.basePath}/settings/${encodeURIComponent(key)}`, { value })
      return null
    } catch (error) {
      const detail = (error as { data?: { error?: { detail?: string } } })?.data?.error?.detail
      return detail || 'Could not save that setting.'
    }
  }

  // ---- Q&A review (proxied to FoodScholar) --------------------------------
  async getQaRequests(params: {
    limit?: number, offset?: number, negativeOnly?: boolean, hasFeedback?: boolean
    search?: string, userId?: string, language?: string
  } = {}): Promise<{ total: number, items: QaRequestRow[] }> {
    try {
      const query = new URLSearchParams({
        limit: String(params.limit ?? 50),
        offset: String(params.offset ?? 0)
      })
      if (params.negativeOnly) query.set('negative_only', 'true')
      if (params.hasFeedback !== undefined) query.set('has_feedback', String(params.hasFeedback))
      if (params.search) query.set('search', params.search)
      if (params.userId) query.set('user_id', params.userId)
      if (params.language) query.set('language', params.language)
      const payload = await wisefoodRestApi.get<unknown>(
        `/foodscholar/qa/requests?${query.toString()}`
      )
      return {
        total: unwrap<number>(payload, 'total', 0),
        items: unwrap<QaRequestRow[]>(payload, 'items', [])
      }
    } catch {
      return { total: 0, items: [] }
    }
  }

  async getQaRequest(requestId: string): Promise<QaRequestDetail | null> {
    try {
      return asResult<QaRequestDetail | null>(
        await wisefoodRestApi.get<unknown>(
          `/foodscholar/qa/requests/${encodeURIComponent(requestId)}`
        ),
        null
      )
    } catch {
      return null
    }
  }

  async getReviews(targetType: string, targetId: string): Promise<ReviewRow[]> {
    try {
      const query = new URLSearchParams({ target_type: targetType, target_id: targetId })
      const payload = await wisefoodRestApi.get<unknown>(
        `${this.basePath}/reviews?${query.toString()}`
      )
      return unwrap<ReviewRow[]>(payload, 'items', [])
    } catch {
      return []
    }
  }

  /** Record a verdict. The reviewer comes from the token, never the body. */
  async recordReview(review: {
    target_type: string, target_id: string, verdict: string
    notes?: string, tags?: string[], request_id?: string
  }): Promise<boolean> {
    try {
      await wisefoodRestApi.post(`${this.basePath}/reviews`, review)
      return true
    } catch {
      return false
    }
  }
}

export default new InsightsApiService()
