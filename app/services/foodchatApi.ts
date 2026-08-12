import { useAuthStore } from '~/stores/auth'
import { getWisefoodRestApiUrl } from '~/utils/runtimeConfig'

// ============================================================================
// Timeout Configuration
// ============================================================================
const DEFAULT_TIMEOUT = 30000
const MESSAGE_TIMEOUT = 180000 // 3 minutes for AI responses

// ============================================================================
// Type Definitions
// ============================================================================

export interface ChatSession {
  session_id: string
  member_id: string
  state: string
  message_count: number
  title?: string
  created_at: string
  updated_at?: string
}

/** A plan the member saved — it outlives the conversation that made it. */
export interface SavedPlan {
  plan_id: string
  session_id: string
  plan_type: 'daily' | 'weekly'
  saved_title?: string | null
  saved_at?: string | null
  created_at?: string | null
  plan: Record<string, unknown>
}

export interface AttributionCitation {
  title: string
  source_type: 'article' | 'guideline'
  url?: string | null
  label?: string | null
}

/** Attribution metadata for answers routed through FoodScholar */
export interface ChatAttribution {
  source: string
  confidence?: 'high' | 'medium' | 'low' | null
  citations: AttributionCitation[]
  /** UI-relative path, e.g. "/foodscholar?q=..." */
  learn_more_url?: string | null
}

/** A single memory nudge the assistant proposes to remember about the member */
export interface MemorySuggestion {
  id: string
  kind: 'like' | 'dislike' | 'cuisine' | 'constraint' | 'allergy_hint' | 'standing_seed' | string
  value: string
  statement: string
}

export interface MemoryDecisionRequest {
  member_id: string
  decision: 'accept' | 'decline'
  suggestion: MemorySuggestion
}

export interface MemoryDecisionResponse {
  applied: boolean
}

export interface SessionDinersResponse {
  cooking_for: string[]
  cooking_for_names: string[]
}

/** One knob on the interactive plan-parameter card */
export interface PlanParameterOption {
  value: string
  label: string
}

export interface PlanParameter {
  key: string
  label: string
  kind: 'scale' | 'choice'
  min?: number | null
  max?: number | null
  step?: number | null
  unit?: string | null
  options?: PlanParameterOption[] | null
  default?: number | string | null
  /** Currently applied value, if the member has set this knob before */
  value?: number | string | null
}

/** Optional slider card attached to fresh plans — replaces the old textual
 *  questions about time budget / difficulty / goal. `plan_type` is the
 *  card's address: echo it back on apply so the values refine the plan the
 *  card was rendered with, not whichever canvas is newest by then. */
export interface PlanParameterCard {
  parameters: PlanParameter[]
  plan_type?: 'daily' | 'weekly'
}

export type PlanParameterValues = Record<string, number | string>

export interface PlanParametersRequest {
  member_id: string
  values: PlanParameterValues
  plan_type?: 'daily' | 'weekly'
}

/** One hand-picked recipe on the manual-mode canvas */
export interface ComposePick {
  meal_type: 'breakfast' | 'lunch' | 'dinner'
  recipe_id: string
  title?: string
  /** 1-7, weekly plans only */
  day?: number | null
}

export interface ComposeRequest {
  member_id: string
  picks: ComposePick[]
  plan_type?: 'daily' | 'weekly'
  /** Optional chat text sent alongside ("fill out the rest, keep it light") */
  message?: string | null
}

export interface ChatMessage {
  id?: number
  role: 'user' | 'assistant'
  content: string
  intent?: string
  timestamp: string
  /** FoodScholar provenance — persisted server-side, present on reloads too */
  attribution?: ChatAttribution
  /** Client-side only — grafted from the live response like attribution */
  memory_suggestions?: MemorySuggestion[]
  /** Client-side only — grafted from the live response like attribution */
  changed_slots?: ChangedSlot[]
  /** Client-side only — grafted from the live response like attribution */
  plan_parameters?: PlanParameterCard
}

/** Per-course nutrition summary (M4 transparency) */
export interface MealNutrition {
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  /** Fourth macro-donut segment. Absent on plans built before it was carried. */
  fiber_g?: number | null
  nutri_score_label: string
}

export type MatchReasonKind =
  | 'pinned'
  | 'favorite'
  | 'memory'
  | 'profile'
  | 'feedback'
  | 'diner'
  | 'guideline'

/** Why a course was selected for this member (M4 transparency) */
export interface MatchReason {
  kind: MatchReasonKind
  label: string
}

export interface MealRecipe {
  recipe_id: string
  title: string
  ingredients: string
  directions: string
  /** Which plate of its meal this is: main | side | dessert | drink. */
  role?: string | null
  nutrition?: MealNutrition | null
  image_url?: string | null
  match_reasons?: MatchReason[]
}

/** A constraint the planner applied when building a plan. Daily rows only
 *  ever say "satisfied"; weekly rows are MEASURED and may say "relaxed" or
 *  "violated", with an optional detail string ("3 of 3 meat meals used"). */
export interface ConstraintApplied {
  constraint: string
  type: 'hard' | 'soft'
  status: string
  source: string
  detail?: string | null
  /**
   * The diners this row is there for — empty on a solo plan. A household row
   * names the member it protects rather than the whole table, so one member's
   * goal or allergy can be seen for what it is.
   */
  members?: string[]
}

/** Counts of personalization signals used to build a plan */
export interface PersonalizationSummary {
  memories_used: number
  favorites_used: number
  feedback_signals: number
  diners: number
}

/** Proof of an edit applied by a refine turn (M4 transparency) */
export interface ChangedSlot {
  meal_type: string
  day: number | null
  old: { title: string; kcal: number | null }
  new: { title: string; kcal: number | null }
  directive: string
  verified: boolean
}

/**
 * One meal, as FoodChat serialises it: a slot and its ordered plates.
 *
 * This mirrors the backend's `Meal` dataclass exactly (`meal_type` + `plates`),
 * because the shape on the wire is the shape the session store persists. An
 * invented client-side shape would have to be translated somewhere, and that
 * somewhere is where a plate goes missing.
 *
 * `meal_type` is a free string, not a union: the slot vocabulary is
 * backend-owned and grows without a frontend release, so a slot the UI has no
 * label for renders as its own name rather than disappearing.
 */
export interface PlanMeal {
  meal_type: string
  plates: MealRecipe[]
}

/** One day of a plan. Present only on multi-day or multi-plate plans. */
export interface PlanDay {
  day: number
  meals: PlanMeal[]
}

/** Per-day macro totals, summed server-side across every plate. */
export interface PlanNutritionTotal {
  calories?: number | null
  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null
  fiber_g?: number | null
  /** False when a plate contributed nothing — the total omits a meal. */
  complete?: boolean
}

export interface MealPlan {
  id: string
  created_at: string
  version?: number
  parent_id?: string
  /**
   * The three original fields. Kept because every stored plan and every
   * current backend response uses them, and dropping them would strand plan
   * history. `planMeals()` below reads either shape.
   */
  breakfast?: MealRecipe
  lunch?: MealRecipe
  dinner?: MealRecipe
  /**
   * The flexible shape: any days, any meals, any plates per meal.
   *
   * Additive — a legacy plan omits it entirely, so its payload is unchanged.
   * When present it wins over the three scalar fields, which the backend still
   * populates from day 1's main plates for readers that address them by name.
   */
  days?: PlanDay[] | null
  nutrition_total?: PlanNutritionTotal | null
  reasoning?: string
  llm_score?: number
  llm_reasoning?: string
  fvs_count?: number
  fvs_reasoning?: string
  diversity_llm_score?: number
  diversity_llm_reasoning?: string
  guideline_adherence_score?: number
  guideline_adherence_reasoning?: string
  constraints_applied?: ConstraintApplied[]
  personalization_summary?: PersonalizationSummary | null
}

export interface WeeklyMealEntry {
  day: number
  meal_idx: number
  meal_type: string
  recipe: Record<string, unknown>
  reward: number
}

/** One weekly guideline frequency rule, checked against the final plan */
export interface WeeklyGuidelineCheck {
  rule: string
  target: string
  actual: number
  met: boolean
}

/** Per-day justification row from the weekly explainability metrics */
export interface WeeklyDayBreakdown {
  day: number
  name: string
  summary: string
  kcal: number | null
  meals_with_data: number
  highlights: string[]
}

/** Deterministic weekly explainability metrics (empty for pre-M7 plans) */
export interface WeeklyPlanMetrics {
  variety?: {
    distinct_recipes: number
    total_meals: number
    unique_ingredients: number
    category_distribution: Record<string, number>
    reasoning: string
  }
  guideline_checklist?: WeeklyGuidelineCheck[]
  nutrition?: {
    weekly_totals: Record<string, number>
    daily_average_kcal: number | null
    weekly_targets: Record<string, number>
    budget_used_pct: number | null
    coverage: { meals_with_data: number, total_meals: number }
    note: string
  }
  days?: WeeklyDayBreakdown[]
  selection_events?: unknown[]
}

export interface WeeklyMealPlan {
  id: string
  created_at: string
  version?: number
  parent_id?: string
  entries: WeeklyMealEntry[]
  /** {day (1-7) → headline}; JSON round-trips keys as strings */
  day_summaries?: Record<string | number, string>
  constraints_applied?: ConstraintApplied[]
  personalization_summary?: PersonalizationSummary | null
  metrics?: WeeklyPlanMetrics
  reasoning?: string
}

/** Latest saved plan canvases for a member across all their sessions.
 *  FoodChat plans are versioned canvases (daily/weekly), not date-scheduled
 *  entries — this is what the dashboard renders as "Recent Meal Plans". */
export interface MemberCurrentPlans {
  session_id: string | null
  plan_type: 'daily' | 'weekly' | null
  meal_plan: MealPlan | null
  weekly_meal_plan: WeeklyMealPlan | null
  cooking_for: string[]
}

export interface UnifiedChatRequest {
  content: string
  member_id: string
}

export interface UnifiedChatResponse {
  role: string
  content: string
  intent?: string
  needs_clarification: boolean
  meal_plan?: MealPlan
  weekly_meal_plan?: WeeklyMealPlan
  at_message_limit: boolean
  plan_version?: number
  plan_parent_id?: string
  attribution?: ChatAttribution
  memory_suggestions?: MemorySuggestion[]
  changed_slots?: ChangedSlot[]
  plan_parameters?: PlanParameterCard
}

export interface ConversationResponse {
  messages: ChatMessage[]
  has_more: boolean
  next_before_id: number | null
}

export interface MessageFeedbackRequest {
  member_id: string
  rating: 'up' | 'down'
  comment?: string
}

export interface FoodChatStatus {
  status: string
  version?: string
}

export interface ApiError {
  message: string
  status?: number
  code?: string
}

// ============================================================================
// FoodChat API Service
// ============================================================================

class FoodChatApiService {
  private readonly basePath = '/foodchat'

  async getStatus(): Promise<FoodChatStatus> {
    return this.fetchWithTimeout<FoodChatStatus>(`${this.basePath}/status`, 'GET')
  }

  async createSession(memberId: string, cookingFor?: string[]): Promise<ChatSession> {
    return this.fetchWithTimeout<ChatSession>(
      `${this.basePath}/sessions`,
      'POST',
      cookingFor?.length ? { member_id: memberId, cooking_for: cookingFor } : { member_id: memberId }
    )
  }

  async getSessions(memberId: string): Promise<ChatSession[]> {
    return this.fetchWithTimeout<ChatSession[]>(
      `${this.basePath}/members/${memberId}/sessions`,
      'GET'
    )
  }

  async getMemberCurrentPlans(memberId: string): Promise<MemberCurrentPlans> {
    return this.fetchWithTimeout<MemberCurrentPlans>(
      `${this.basePath}/members/${memberId}/current-plans`,
      'GET'
    )
  }

  async getSession(sessionId: string, memberId: string): Promise<ChatSession> {
    const params = new URLSearchParams({ member_id: memberId })
    return this.fetchWithTimeout<ChatSession>(
      `${this.basePath}/sessions/${sessionId}?${params}`,
      'GET'
    )
  }

  async deleteSession(sessionId: string): Promise<void> {
    return this.fetchWithTimeout<void>(
      `${this.basePath}/sessions/${sessionId}`,
      'DELETE'
    )
  }

  async renameSession(sessionId: string, memberId: string, title: string): Promise<ChatSession> {
    return this.fetchWithTimeout<ChatSession>(
      `${this.basePath}/sessions/${sessionId}`,
      'PATCH',
      { member_id: memberId, title }
    )
  }

  /** Save (or unsave) a plan so it outlives its conversation. */
  async savePlan(
    sessionId: string,
    planId: string,
    memberId: string,
    saved: boolean,
    title?: string
  ): Promise<void> {
    return this.fetchWithTimeout<void>(
      `${this.basePath}/sessions/${sessionId}/meal-plans/${planId}/save`,
      'POST',
      { member_id: memberId, saved, title }
    )
  }

  async getSavedPlans(memberId: string): Promise<SavedPlan[]> {
    return this.fetchWithTimeout<SavedPlan[]>(
      `${this.basePath}/members/${memberId}/saved-plans`,
      'GET'
    )
  }

  /** Unified chat endpoint — routes by intent */
  async unifiedChat(sessionId: string, req: UnifiedChatRequest): Promise<UnifiedChatResponse> {
    return this.fetchWithTimeout<UnifiedChatResponse>(
      `${this.basePath}/sessions/${sessionId}/chat`,
      'POST',
      req,
      MESSAGE_TIMEOUT
    )
  }

  /** Cursor-paginated conversation history */
  async getConversation(
    sessionId: string,
    memberId: string,
    beforeId?: number | null,
    limit = 20
  ): Promise<ConversationResponse> {
    const params = new URLSearchParams({ member_id: memberId, limit: String(limit) })
    if (beforeId != null) params.set('before_id', String(beforeId))
    return this.fetchWithTimeout<ConversationResponse>(
      `${this.basePath}/sessions/${sessionId}/conversation?${params}`,
      'GET'
    )
  }

  async getMealPlans(sessionId: string, memberId: string): Promise<MealPlan[]> {
    const params = new URLSearchParams({ member_id: memberId })
    return this.fetchWithTimeout<MealPlan[]>(
      `${this.basePath}/sessions/${sessionId}/meal-plans?${params}`,
      'GET'
    )
  }

  async getCurrentMealPlan(sessionId: string, memberId: string): Promise<MealPlan | null> {
    try {
      const params = new URLSearchParams({ member_id: memberId })
      return await this.fetchWithTimeout<MealPlan>(
        `${this.basePath}/sessions/${sessionId}/meal-plans/current?${params}`,
        'GET'
      )
    } catch {
      return null
    }
  }

  async getWeeklyMealPlans(sessionId: string, memberId: string): Promise<WeeklyMealPlan[]> {
    const params = new URLSearchParams({ member_id: memberId })
    return this.fetchWithTimeout<WeeklyMealPlan[]>(
      `${this.basePath}/sessions/${sessionId}/weekly-meal-plans?${params}`,
      'GET'
    )
  }

  async getCurrentWeeklyMealPlan(sessionId: string, memberId: string): Promise<WeeklyMealPlan | null> {
    try {
      const params = new URLSearchParams({ member_id: memberId })
      return await this.fetchWithTimeout<WeeklyMealPlan>(
        `${this.basePath}/sessions/${sessionId}/weekly-meal-plans/current?${params}`,
        'GET'
      )
    } catch {
      return null
    }
  }

  /** Manual mode: pin hand-picked recipes and let FoodChat fill the rest —
   *  generates like a chat turn */
  async composePlan(
    sessionId: string,
    req: ComposeRequest
  ): Promise<UnifiedChatResponse> {
    return this.fetchWithTimeout<UnifiedChatResponse>(
      `${this.basePath}/sessions/${sessionId}/compose`,
      'POST',
      req,
      MESSAGE_TIMEOUT
    )
  }

  /** Apply values from the interactive plan-parameter card — refines the
   *  active daily plan (or generates a fresh one), like a chat turn */
  async applyPlanParameters(
    sessionId: string,
    req: PlanParametersRequest
  ): Promise<UnifiedChatResponse> {
    return this.fetchWithTimeout<UnifiedChatResponse>(
      `${this.basePath}/sessions/${sessionId}/plan-parameters`,
      'POST',
      req,
      MESSAGE_TIMEOUT
    )
  }

  /** Accept or decline a memory suggestion surfaced in a chat response */
  async submitMemoryDecision(
    sessionId: string,
    req: MemoryDecisionRequest
  ): Promise<MemoryDecisionResponse> {
    return this.fetchWithTimeout<MemoryDecisionResponse>(
      `${this.basePath}/sessions/${sessionId}/memory`,
      'POST',
      req
    )
  }

  /** Update who this session is cooking for (household member ids) */
  async updateSessionDiners(
    sessionId: string,
    memberId: string,
    cookingFor: string[]
  ): Promise<SessionDinersResponse> {
    return this.fetchWithTimeout<SessionDinersResponse>(
      `${this.basePath}/sessions/${sessionId}/diners`,
      'PUT',
      { member_id: memberId, cooking_for: cookingFor }
    )
  }

  async submitMessageFeedback(
    sessionId: string,
    messageId: number,
    req: MessageFeedbackRequest
  ): Promise<void> {
    return this.fetchWithTimeout<void>(
      `${this.basePath}/sessions/${sessionId}/messages/${messageId}/feedback`,
      'POST',
      req
    )
  }

  // ============================================================================
  // Private helpers
  // ============================================================================

  private async fetchWithTimeout<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: unknown,
    timeoutMs: number = DEFAULT_TIMEOUT
  ): Promise<T> {
    const baseUrl = getWisefoodRestApiUrl()
    const url = `${baseUrl}${endpoint}`

    const authStore = useAuthStore()
    const token = authStore.getToken()
    if (!token) throw new Error('No authentication token available')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Read the body ONCE as text, then try to parse it. Calling
        // response.json() first and falling back to response.text() double-reads
        // a locked stream — non-JSON errors (a 504 nginx page) then surface as a
        // misleading "body stream already read" TypeError instead of the real status.
        const bodyText = await response.text().catch(() => '')
        let errorData: unknown = bodyText
        try {
          errorData = bodyText ? JSON.parse(bodyText) : null
        } catch {
          // Non-JSON body (e.g. an nginx 504 page) — keep the raw text
        }

        if (response.status === 401) {
          const refreshed = await authStore.refreshToken()
          if (!refreshed && import.meta.client) await authStore.logout()
          throw new Error('Authentication failed. Please log in again.')
        }

        const gatewayTimeout = response.status === 502 || response.status === 503 || response.status === 504
        const message = gatewayTimeout
          ? 'The plan is taking longer than usual to generate. Please try again in a moment.'
          : `API request failed with status ${response.status}`
        throw { message, status: response.status, data: errorData }
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) return undefined as T

      const json = await response.json()
      if (json && typeof json === 'object' && 'result' in json) return json.result as T
      return json as T
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw { message: `Request timeout after ${timeoutMs / 1000}s. Please try again.`, status: 408, code: 'TIMEOUT' }
      }
      throw error
    }
  }
}

export default new FoodChatApiService()
