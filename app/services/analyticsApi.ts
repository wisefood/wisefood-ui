import { useAuthStore } from '~/stores/auth'
import { getWisefoodRestApiUrl } from '~/utils/runtimeConfig'
import { analyticsHeaders } from '~/composables/useAnalyticsSession'

/**
 * Client-observed events.
 *
 * The gateway records what it can see: which route was called, by whom, how
 * long it took. It cannot see a page view that never hit the API, which search
 * result someone clicked, or a streamed answer they abandoned halfway. Those
 * come from here.
 *
 * Batched, because a request per page view would meaningfully increase the
 * traffic the gateway serves for no analytical gain.
 */

/** Event types the gateway accepts from a browser. Anything else is refused
 *  with a 422 — the server keeps an allowlist so a client cannot invent
 *  unbounded event types and make the console's own filters useless. */
export type ClientEventType =
  | 'session.start'
  | 'page.view'
  | 'feature.used'
  | 'recipe.search'
  | 'recipe.autocomplete'
  | 'recipe.result_click'
  | 'recipe.view'
  | 'recipe.compare'
  | 'qa.ask'
  | 'qa.stream_abandoned'
  | 'qa.citation_opened'
  | 'chat.message'
  | 'chat.plan_generated'
  | 'chat.plan_saved'
  | 'chat.tool_invoked'
  | 'library.save'
  | 'library.remove'
  | 'favorite.add'
  | 'favorite.remove'
  | 'catalog.view'
  | 'console.view'

export type AnalyticsApp =
  | 'foodchat'
  | 'foodscholar'
  | 'recipewrangler'
  | 'catalog'
  | 'console'
  | 'platform'

export interface ClientEvent {
  type: ClientEventType
  app?: AnalyticsApp
  /** When it happened on this device. Batches are buffered, so this can
   *  predate arrival by a few seconds. */
  occurred_at?: string
  props?: Record<string, unknown>
}

/** The gateway caps a batch at 50. */
export const MAX_BATCH = 50

class AnalyticsApiService {
  /**
   * Deliberately NOT the shared client. Its 401 handling refreshes the token
   * and, failing that, logs the user out and redirects to /login — the right
   * thing for a request the user made, and exactly the wrong thing for a
   * background batch of page views. A signed-in user sitting on the privacy
   * page, or a guest whose token quietly expired, was being bounced to the
   * login screen by analytics. Here a 401 is just a dropped batch.
   *
   * `keepalive` lets the final flush from `pagehide` survive the page going
   * away, which a plain fetch routinely does not.
   */
  async sendEvents(events: ClientEvent[], { keepalive = false } = {}): Promise<void> {
    if (!events.length) return
    const token = useAuthStore().getToken()
    if (!token) return
    const url = `${getWisefoodRestApiUrl()}/analytics/events`
    const response = await fetch(url, {
      method: 'POST',
      keepalive,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...analyticsHeaders()
      },
      body: JSON.stringify({ events: events.slice(0, MAX_BATCH) })
    })
    if (!response.ok) {
      throw new Error(`analytics ingest failed with status ${response.status}`)
    }
  }
}

export default new AnalyticsApiService()
