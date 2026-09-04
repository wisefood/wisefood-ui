import { ref } from 'vue'
import { track } from '~/composables/useTelemetry'
import foodscholarApi from '~/services/foodscholarApi'
import type {
  QaAskRequest,
  QaAskResult,
  QaReasoningStep
} from '~/services/foodscholarApi'

/**
 * Streaming client for FoodScholar's agentic QA pipeline.
 *
 * `ask()` consumes the SSE stream, keeping three live refs the page renders
 * while the pipeline runs — `steps` (the collapsible reasoning timeline,
 * upserted by id as running→done updates arrive), `streamingAnswer` (the
 * token-by-token markdown), and `streaming` — then resolves with the terminal
 * payload, which is shaped exactly like the classic POST /qa/ask response
 * (including `reasoning_steps`), so existing response handling keeps working.
 *
 * If the gateway does not expose the stream route yet (404/405 before any
 * event), it falls back to the non-streaming call and remembers that for the
 * rest of the session.
 */
export function useFoodScholarQaStream() {
  const streaming = ref(false)
  const streamingAnswer = ref('')
  const steps = ref<QaReasoningStep[]>([])
  const supportsStreaming = ref(true)

  function reset() {
    streamingAnswer.value = ''
    steps.value = []
  }

  function upsertStep(step: QaReasoningStep) {
    const index = steps.value.findIndex(existing => existing.id === step.id)
    if (index >= 0) {
      steps.value.splice(index, 1, step)
    } else {
      steps.value.push(step)
    }
  }

  async function ask(payload: QaAskRequest): Promise<QaAskResult> {
    if (!supportsStreaming.value) {
      return foodscholarApi.askQuestion(payload)
    }

    streaming.value = true
    reset()
    let sawEvent = false
    // Emitted before the answer, not after: a question the user gives up on
    // mid-stream is exactly the one worth knowing about, and an event written
    // only on success would never record it.
    track('qa.ask', {
      question_length: String(payload?.question ?? '').length,
      streaming: true
    }, 'foodscholar')

    try {
      let terminal: QaAskResult | null = null
      for await (const { event, data } of foodscholarApi.askQuestionStream(payload)) {
        sawEvent = true
        if (event === 'step') {
          upsertStep(data as unknown as QaReasoningStep)
        } else if (event === 'answer_delta') {
          streamingAnswer.value += String(data.text ?? '')
        } else if (event === 'done' || event === 'clarification') {
          terminal = data as unknown as QaAskResult
        } else if (event === 'error') {
          throw new Error(String(data.detail || data.title || 'Streaming failed'))
        }
        if (event === 'done' || event === 'clarification') break
      }
      if (!terminal) {
        throw new Error('Stream ended without a final answer')
      }
      return terminal
    } catch (error) {
      const status = (error as { status?: number })?.status
      if (!sawEvent && (status === 404 || status === 405)) {
        // Older gateway without the streaming proxy: degrade gracefully and
        // stop attempting streams for this session.
        supportsStreaming.value = false
        return foodscholarApi.askQuestion(payload)
      }
      throw error
    } finally {
      streaming.value = false
    }
  }

  return { streaming, streamingAnswer, steps, supportsStreaming, ask, reset }
}
