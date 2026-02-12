import wisefoodRestApi from './wisefoodRestApi'

export interface QaAskRequest {
  question: string
  mode?: string
  model?: string
  rag_enabled?: boolean
  top_k?: number
  expertise_level?: string
  language?: string
  user_id?: string
  member_id?: string
}

export interface QaCitation {
  article_urn: string
  article_title: string
  authors: string[]
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
  urn: string
  title: string
  authors: string[]
  venue?: string | null
  publication_year?: string | null
  category?: string | null
  tags?: string[]
  similarity_score?: number | null
}

export interface QaAskResult {
  question: string
  mode: string
  primary_answer: QaAnswer
  secondary_answer?: QaAnswer | null
  dual_answer_feedback?: QaDualAnswerFeedback | null
  retrieved_articles?: QaRetrievedArticle[]
  follow_up_suggestions?: string[]
  generated_at?: string
  cache_hit?: boolean
  request_id?: string
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
}

export default new FoodScholarApiService()
