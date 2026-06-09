import { defineStore } from 'pinia'
import type { QaAskResult } from '~/services/foodscholarApi'

// How long a saved QA thread stays restorable after the user navigates away.
const TTL_MS = 30 * 60 * 1000

interface FoodScholarQaState {
  question: string
  result: QaAskResult | null
  expertiseLevel: string
  savedAt: number | null
}

interface SavedThread {
  question: string
  result: QaAskResult
  expertiseLevel: string
}

export const useFoodScholarQaStore = defineStore('foodscholarQa', {
  state: (): FoodScholarQaState => ({
    question: '',
    result: null,
    expertiseLevel: 'beginner',
    savedAt: null
  }),

  actions: {
    save(thread: SavedThread) {
      this.question = thread.question
      this.result = thread.result
      this.expertiseLevel = thread.expertiseLevel
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
        expertiseLevel: this.expertiseLevel
      }
    },

    clear() {
      this.question = ''
      this.result = null
      this.savedAt = null
    }
  }
})
