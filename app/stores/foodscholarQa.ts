import { defineStore } from 'pinia'
import type { QaAskResult } from '~/services/foodscholarApi'

// How long a saved QA thread stays restorable. A day, matching the backend's
// conversation-memory horizon: a thread resumed after lunch or the next
// morning still knows itself.
const TTL_MS = 24 * 60 * 60 * 1000

// Mirrored to localStorage so a page reload resumes the thread instead of
// silently orphaning it (the backend still held the context; the UI lost the
// thread id — the worst of both worlds).
const STORAGE_KEY = 'wisefood-foodscholar-qa-thread'

export interface QaThreadTurn {
  question: string
  result: QaAskResult
}

interface FoodScholarQaState {
  question: string
  result: QaAskResult | null
  expertiseLevel: string
  // Active conversation thread id, so free-form follow-ups keep their context
  // across navigation (backend carries a running summary keyed by this id).
  qaThreadId: string | null
  // Earlier answered exchanges of this thread (the visible sliding window).
  turns: QaThreadTurn[]
  savedAt: number | null
}

interface SavedThread {
  question: string
  result: QaAskResult
  expertiseLevel: string
  qaThreadId?: string | null
  turns?: QaThreadTurn[]
}

function readStorage(): FoodScholarQaState | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FoodScholarQaState
    if (!parsed || !parsed.result || !parsed.savedAt) return null
    return parsed
  } catch {
    return null
  }
}

function writeStorage(state: FoodScholarQaState | null) {
  if (typeof localStorage === 'undefined') return
  try {
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Quota/privacy-mode failures degrade to in-memory-only persistence.
  }
}

export const useFoodScholarQaStore = defineStore('foodscholarQa', {
  state: (): FoodScholarQaState => ({
    question: '',
    result: null,
    expertiseLevel: 'beginner',
    qaThreadId: null,
    turns: [],
    savedAt: null
  }),

  actions: {
    save(thread: SavedThread) {
      this.question = thread.question
      this.result = thread.result
      this.expertiseLevel = thread.expertiseLevel
      this.qaThreadId = thread.qaThreadId ?? null
      this.turns = thread.turns ?? []
      this.savedAt = Date.now()
      writeStorage(this.$state)
    },

    // Returns the saved thread only if it is still within the TTL window;
    // otherwise clears stale state and returns null. Falls back to
    // localStorage so the thread survives a reload.
    restore(): SavedThread | null {
      if (!this.savedAt || !this.result) {
        const stored = readStorage()
        if (stored) this.$patch(stored)
      }
      if (!this.savedAt || !this.result) return null
      if (Date.now() - this.savedAt >= TTL_MS) {
        this.clear()
        return null
      }
      return {
        question: this.question,
        result: this.result,
        expertiseLevel: this.expertiseLevel,
        qaThreadId: this.qaThreadId,
        turns: this.turns
      }
    },

    clear() {
      this.question = ''
      this.result = null
      this.qaThreadId = null
      this.turns = []
      this.savedAt = null
      writeStorage(null)
    }
  }
})
