import { computed, ref, type Ref } from 'vue'
import { lastInsightsFailure } from '~/services/insightsApi'

/**
 * The states between "loaded with data" that the console never had.
 *
 * Every report fetcher degrades to an empty result on failure so a page renders
 * instead of throwing. That is the right default for a console, and it has one
 * cost: on screen, "the API is down" and "nobody used the product this week"
 * were the same pixels. For a page whose whole job is measurement, that is the
 * one confusion it must never allow — and it was the first thing a real user
 * hit ("No content report came back… analytics is off", when the cause was a
 * 404 from an old image).
 *
 * The other gap was the moment before the data arrives. With no loading state,
 * the empty panel rendered "Nothing happened in this period" for the duration
 * of the fetch and then the numbers popped in — a false quiet week flashed on
 * every page view.
 *
 * So: a loader runs under this, and the page gets four states it can render
 * distinctly, a timestamp it can show, and a `reload` it can hang a button on.
 */
export type InsightsStatus = 'loading' | 'ok' | 'empty' | 'failed'

export interface InsightsLoad {
  status: Ref<InsightsStatus>
  /** True while a load is in flight, first or subsequent. */
  loading: Ref<boolean>
  /** True when the last load ended in failure rather than in an empty result. */
  failed: Ref<boolean>
  /** When the data on screen was fetched, or null before the first load. */
  loadedAt: Ref<Date | null>
  /** Run the loader again, keeping what is on screen until it returns. */
  reload: () => Promise<void>
}

/**
 * Wrap a page's `load()`.
 *
 * `isEmpty` tells this composable whether the result, once loaded, has anything
 * in it — the page knows which arrays matter; this does not. Failure is
 * detected by watching the service layer's failure marker across the call,
 * so no fetcher signature had to change and a page that has not adopted this
 * keeps degrading exactly as before.
 */
export function useInsightsLoad(
  loader: () => Promise<void>,
  isEmpty: () => boolean
): InsightsLoad {
  const status = ref<InsightsStatus>('loading')
  const loadedAt = ref<Date | null>(null)

  async function reload() {
    // Keep 'ok'/'empty' on screen during a refresh rather than dropping back
    // to a skeleton: a refresh that blanks the page reads as a reload, and the
    // whole point of a refresh is that it is not one.
    if (status.value !== 'ok' && status.value !== 'empty') status.value = 'loading'
    const failuresBefore = lastInsightsFailure.value
    try {
      await loader()
    } catch {
      // Fetchers do not throw, but a page's own post-processing might.
      status.value = 'failed'
      return
    }
    if (lastInsightsFailure.value !== failuresBefore) {
      status.value = 'failed'
      return
    }
    loadedAt.value = new Date()
    status.value = isEmpty() ? 'empty' : 'ok'
  }

  return {
    status,
    loading: computed(() => status.value === 'loading'),
    failed: computed(() => status.value === 'failed'),
    loadedAt,
    reload
  }
}
