import { useAuthStore } from '~/stores/auth'
import { getWisefoodRestApiUrl } from '~/utils/runtimeConfig'
import { analyticsHeaders } from '~/composables/useAnalyticsSession'

/**
 * Real user monitoring: the device, what broke, where people clicked, how fast
 * it felt.
 *
 * Same shape and the same rules as `analyticsApi`, and for the same reason:
 * deliberately NOT the shared REST client, whose 401 handling refreshes the
 * token and, failing that, logs the user out and redirects to /login. That is
 * right for a request the user made and exactly wrong for a background batch
 * of click coordinates. Here a 401 is a dropped batch and nothing else.
 *
 * Nothing in here retries. A batch the gateway refuses will be refused again,
 * and a retry queue behind a persistent failure grows until the tab is in
 * trouble.
 */

/** The gateway caps a batch the same way it caps activity events. */
export const MAX_RUM_BATCH = 50

export type ErrorKind = 'error' | 'unhandledrejection' | 'vue' | 'http' | 'resource'
export type InteractionKind = 'click' | 'rage' | 'dead' | 'scroll'

export interface RumSession {
  session_id: string
  release: string
  screen_w: number
  screen_h: number
  viewport_w: number
  viewport_h: number
  device_pixel_ratio: number
  color_scheme: string
  reduced_motion: boolean
  timezone: string
  connection: string
  locale: string
}

export interface RumBreadcrumb {
  t: string
  type: string
  /** Never text a user typed — see `useErrorCapture`. */
  data?: Record<string, unknown>
}

export interface RumError {
  occurred_at: string
  kind: ErrorKind
  name: string
  message: string
  stack: string
  url_path: string
  line_no: number | null
  col_no: number | null
  handled: boolean
  breadcrumbs: RumBreadcrumb[]
  context: Record<string, unknown>
  release: string
  app?: string
}

export interface RumInteraction {
  occurred_at: string
  path: string
  kind: InteractionKind
  element_key: string
  element_role: string
  x_pct: number | null
  y_pct: number | null
  viewport_w: number
  viewport_h: number
  depth_pct: number | null
  repeats: number
  app?: string
}

export interface RumVital {
  occurred_at: string
  path: string
  metric: string
  value: number
  rating: string
  navigation_type: string
  app?: string
}

/**
 * What the gateway says may be collected right now.
 *
 * Every field is optional and every default is off. A deployment whose gateway
 * does not serve this yet, a request that fails, a body in a shape nobody
 * expected — all three mean the same thing here, which is that nothing is
 * captured.
 */
export interface CaptureFlags {
  analytics_enabled?: boolean
  collecting?: boolean
  capture?: Record<string, unknown>
  /** A number platform-wide, or a per-stream map. Both shapes are read. */
  sample_rate?: number | Record<string, unknown>
  ttl_seconds?: number
  [key: string]: unknown
}

function currentToken(): string | null {
  try {
    return useAuthStore().getToken() || null
  } catch {
    // Called before Pinia is active, or from a listener with no app context.
    return null
  }
}

let keepaliveSupported: boolean | null = null

function supportsKeepalive(): boolean {
  if (keepaliveSupported !== null) return keepaliveSupported
  try {
    keepaliveSupported = 'keepalive' in new Request('http://x.invalid')
  } catch {
    keepaliveSupported = false
  }
  return keepaliveSupported
}

/** The endpoints this module talks to. The fetch wrapper in `useErrorCapture`
 *  skips them, or a failing ingest would report itself as an error and then
 *  report the report. Anchored at the end so the console's own
 *  `/analytics/sessions/{id}` is not mistaken for the ingest route. */
const RUM_PATH_PATTERN = /\/analytics\/(session|errors|interactions|vitals|client-flags)(?:[?#]|$)/

export function isRumUrl(url: string): boolean {
  try {
    return RUM_PATH_PATTERN.test(url)
  } catch {
    return false
  }
}

class RumApiService {
  private path(endpoint: string): string {
    return `${getWisefoodRestApiUrl()}${endpoint}`
  }

  /**
   * Post one payload. Never throws, never retries, returns whether it left.
   *
   * `fetch` with `keepalive` is the primary route rather than `sendBeacon`,
   * because a beacon cannot carry a header and every one of these endpoints is
   * behind a bearer token. The beacon is the fallback for the browsers whose
   * fetch has no `keepalive`, where a plain fetch from `pagehide` is cancelled
   * outright and a best-effort beacon is strictly better than nothing.
   */
  private async send(endpoint: string, body: unknown, { keepalive = false } = {}): Promise<boolean> {
    const token = currentToken()
    if (!token) return false
    const url = this.path(endpoint)
    const payload = JSON.stringify(body)

    if (keepalive && !supportsKeepalive()) {
      try {
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          return navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }))
        }
      } catch {
        // Beacons throw on some quota conditions. Fall through to the fetch.
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        keepalive,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...analyticsHeaders()
        },
        body: payload
      })
      return response.ok
    } catch {
      // Offline, blocked by an extension, or the page went away mid-flight.
      return false
    }
  }

  /** One row per browser session, re-sent when the viewport changes class. */
  async sendSession(session: RumSession, options?: { keepalive?: boolean }): Promise<boolean> {
    return this.send('/analytics/session', session, options)
  }

  async sendErrors(events: RumError[], options?: { keepalive?: boolean }): Promise<boolean> {
    if (!events.length) return true
    return this.send('/analytics/errors', { events: events.slice(0, MAX_RUM_BATCH) }, options)
  }

  async sendInteractions(events: RumInteraction[], options?: { keepalive?: boolean }): Promise<boolean> {
    if (!events.length) return true
    return this.send('/analytics/interactions', { events: events.slice(0, MAX_RUM_BATCH) }, options)
  }

  async sendVitals(events: RumVital[], options?: { keepalive?: boolean }): Promise<boolean> {
    if (!events.length) return true
    return this.send('/analytics/vitals', { events: events.slice(0, MAX_RUM_BATCH) }, options)
  }

  /**
   * The switches. Null means "could not ask", which is read as off.
   *
   * `client-flags`, not the `runtime-flags` the platform services poll: that
   * one is verified by an HMAC signature a browser cannot produce, and it
   * answers a different question. This one is bearer-authenticated and says
   * only which of the browser's own capture streams to run. Either way an
   * operator turning capture off in the console turns it off here too, within
   * the cache TTL and with no redeploy.
   */
  async getFlags(): Promise<CaptureFlags | null> {
    const token = currentToken()
    if (!token) return null
    try {
      const response = await fetch(this.path('/analytics/client-flags'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          ...analyticsHeaders()
        }
      })
      if (!response.ok) return null
      const payload = await response.json() as unknown
      if (!payload || typeof payload !== 'object') return null
      // The gateway wraps most responses in `{ result: ... }`, and the
      // service-facing flags endpoint does not, so accept both shapes rather
      // than depend on which side of that line this endpoint sits.
      const record = payload as Record<string, unknown>
      const inner = record.result
      if (inner && typeof inner === 'object') return inner as CaptureFlags
      return record as CaptureFlags
    } catch {
      return null
    }
  }
}

export default new RumApiService()
