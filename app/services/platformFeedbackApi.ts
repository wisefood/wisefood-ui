import wisefoodRestApi from './wisefoodRestApi'

/**
 * Feedback on anything, from anywhere.
 *
 * The floating satisfaction widget, a rating on a recipe, a reaction to an
 * article — all of it lands in one place the expert console can read, instead
 * of the four unjoinable stores it used to be spread across (and, for the
 * satisfaction widget, the browser console).
 */

export type FeedbackTargetType =
  | 'qa_answer'
  | 'chat_message'
  | 'recipe'
  | 'guide'
  | 'article'
  | 'textbook'
  | 'platform'

export interface PlatformFeedback {
  target_type?: FeedbackTargetType
  /** What was rated: a recipe id, an article urn, or a page path. */
  target_id?: string
  rating_kind?: 'thumbs' | 'likert5' | 'ab' | 'helpful'
  /** The rating as the UI names it, e.g. `great` or `down`. */
  rating_value?: string
  /** The same rating as a number, when there is a meaningful scale. */
  rating_value_num?: number
  reason?: string
  comment?: string
  /** Which surface it is about. Defaults to the platform as a whole. */
  app?: string
}

export interface PlatformFeedbackReceipt {
  recorded: boolean
  /** False when the platform is not currently collecting; the call still
   *  succeeds, because a client should never have to care. */
  collecting: boolean
}

class PlatformFeedbackApiService {
  async submit(feedback: PlatformFeedback): Promise<PlatformFeedbackReceipt> {
    return wisefoodRestApi.post<PlatformFeedbackReceipt>('/analytics/feedback', feedback)
  }
}

export default new PlatformFeedbackApiService()
