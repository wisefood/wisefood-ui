import { defineStore } from 'pinia'
import type { QaAskResult } from '~/services/foodscholarApi'

// How long a saved QA thread stays restorable after the user navigates away.
const TTL_MS = 30 * 60 * 1000

interface FoodScholarQaState {
  question: string
  result: QaAskResult | null
  expertiseLevel: string
  // Active conversation thread id, so free-form follow-ups keep their context
  // across navigation (backend carries a running summary keyed by this id).
  qaThreadId: string | null
  savedAt: number | null
}

interface SavedThread {
  question: string
  result: QaAskResult
  expertiseLevel: string
  qaThreadId?: string | null
}

export const useFoodScholarQaStore = defineStore('foodscholarQa', {
  state: (): FoodScholarQaState => ({
    question: '',
    result: null,
    expertiseLevel: 'beginner',
    qaThreadId: null,
    savedAt: null
  }),

  actions: {
    save(thread: SavedThread) {
      this.question = thread.question
      this.result = thread.result
      this.expertiseLevel = thread.expertiseLevel
      this.qaThreadId = thread.qaThreadId ?? null
      this.savedAt = Date.now()
    },

    // Returns the saved thread only if it is still within the TTL window;
    // otherwise clears stale state and returns null.
    restore(): SavedThread | null {
      if (!this.savedAt || !this.result) return null
      if (Date.now() - this.savedAt >= TTL_MS) {
        this.clear()
        return null
      }
      return {
        question: this.question,
        result: this.result,
        expertiseLevel: this.expertiseLevel,
        qaThreadId: this.qaThreadId
      }
    },

    clear() {
      this.question = ''
      this.result = null
      this.qaThreadId = null
      this.savedAt = null
    }
  }
})
