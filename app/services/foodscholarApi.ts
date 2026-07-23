import wisefoodRestApi from './wisefoodRestApi'

export type QaRetriever = 'rag' | 'linearrag'

export interface QaClarificationResponse {
  question_id: string
  selected_values: string[]
  free_text?: string | null
}

export interface QaAskRequest {
  question: string
  mode?: string
  model?: string
  rag_enabled?: boolean
  retriever?: QaRetriever
  top_k?: number
  expertise_level?: string
  language?: string
  user_id?: string
  member_id?: string
  experience_group?: string
  qa_thread_id?: string
  clarification_response?: QaClarificationResponse | null
}

export interface QaCitation {
  article_urn: string
  article_title: string
  source_type?: 'article' | 'guide' | 'guideline' | null
  authors?: string[] | null
  year?: number | null
  journal?: string | null
  section?: string | null
  quote?: string | null
  confidence?: string | null
  relevance_score?: number | null
}

export interface QaAnswer {
  answer: string
  citations: QaCitation[]
  confidence?: string | null
  model_used?: string | null
  rag_used?: boolean
  articles_consulted?: number | null
}

export interface QaDualAnswerFeedback {
  request_id: string
  answer_a_label?: string | null
  answer_b_label?: string | null
}

export interface QaRetrievedArticle {
  source_type?: 'article' | 'guide' | 'guideline' | null
  urn: string
  title: string
  authors?: string[] | null
  venue?: string | null
  publication_year?: string | null
  category?: string | null
  tags?: string[]
  similarity_score?: number | null
}

export interface QaClarificationOption {
  label: string
  value: string
}

export interface QaClarification {
  id: string
  question: string
  input_type: 'single_choice' | 'multiple_choice' | 'free_text' | 'number' | 'boolean'
  options?: QaClarificationOption[]
  allow_free_text?: boolean
  reason?: string | null
}

export interface QaAskResult {
  question: string
  mode: string
  needs_clarification: boolean
  qa_thread_id?: string | null
  clarification?: QaClarification | null
  primary_answer: QaAnswer
  secondary_answer?: QaAnswer | null
  dual_answer_feedback?: QaDualAnswerFeedback | null
  retrieved_sources?: QaRetrievedArticle[]
  /** @deprecated use retrieved_sources */
  retrieved_articles?: QaRetrievedArticle[]
  follow_up_suggestions?: string[]
  generated_at?: string
  cache_hit?: boolean
  request_id?: string
  memory_suggestions?: QaMemorySuggestion[] | null
}

/** Consent nudge for a durable preference expressed in the question —
 *  same shape as FoodChat's MemorySuggestion so the UI treats both alike. */
export interface QaMemorySuggestion {
  id: string
  kind: 'like' | 'dislike' | 'cuisine' | 'allergy_hint'
  value: string
  statement: string
}

export interface QaQuestionsResult {
  questions: string[]
  generated_at?: string
  cache_hit?: boolean
}

export interface QaTipsResult {
  did_you_know: string[]
  tips: string[]
  did_you_know_detail?: Array<{
    text: string
    evidence?: {
      urn: string
      passage?: string
      title?: string
      publication_year?: string
    }
  }>
  tips_detail?: Array<{
    text: string
    evidence?: {
      urn: string
      passage?: string
      title?: string
      publication_year?: string
    }
  }>
  generated_at?: string
  cache_hit?: boolean
}

export interface QaFeedbackRequest {
  request_id: string
  preferred_answer: 'a' | 'b'
  helpfulness?: string
  target_answer?: string
  reason?: string
}

class FoodScholarApiService {
  private readonly basePath = '/foodscholar/qa'

  async askQuestion(payload: QaAskRequest): Promise<QaAskResult> {
    return wisefoodRestApi.post<QaAskResult, QaAskRequest>(`${this.basePath}/ask`, payload)
  }

  async submitFeedback(payload: QaFeedbackRequest): Promise<string | Record<string, unknown>> {
    return wisefoodRestApi.post<string | Record<string, unknown>, QaFeedbackRequest>(`${this.basePath}/feedback`, payload)
  }

  async listModels(): Promise<string[] | Record<string, unknown>> {
    return wisefoodRestApi.get<string[] | Record<string, unknown>>(`${this.basePath}/models`)
  }

  async listQuestions(language?: string | null): Promise<QaQuestionsResult> {
    // language returns starter questions localized to the user's app locale.
    return wisefoodRestApi.get<QaQuestionsResult>(`${this.basePath}/questions`, {
      params: language ? { language } : undefined
    })
  }

  async submitMemoryDecision(
    memberId: string,
    suggestion: QaMemorySuggestion,
    decision: 'accept' | 'decline'
  ): Promise<{ applied: boolean, decision: string }> {
    return wisefoodRestApi.post(`${this.basePath}/memory`, {
      member_id: memberId,
      suggestion,
      decision
    })
  }

  async listTips(memberId?: string | null): Promise<QaTipsResult> {
    // member_id personalizes tips to the member's accumulated profile;
    // without it FoodScholar serves the shared generic daily tips.
    return wisefoodRestApi.get<QaTipsResult>(`${this.basePath}/tips`, {
      params: memberId ? { member_id: memberId } : undefined
    })
  }
}

export default new FoodScholarApiService()
