import analyticsApi, { type AnalyticsApp, type ClientEvent, type ClientEventType } from '~/services/analyticsApi'
import { touchAnalyticsSession } from '~/composables/useAnalyticsSession'
import { useAuthStore } from '~/stores/auth'

/**
 * Emitting what the browser knows and the server cannot see.
 *
 * Module-level queue and timer, not per-component state: every caller must
 * share one buffer, or a page with three components emitting events would open
 * three of them.
 *
 * Three rules, all of them about never being the reason something breaks:
 * `track()` does no I/O, a failed send is dropped rather than retried, and the
 * queue is bounded so a gateway outage cannot grow it without limit.
 */

const FLUSH_INTERVAL_MS = 5000
const FLUSH_AT = 20
/** Roughly a few minutes of very busy use. Past this the oldest go. */
const QUEUE_MAX = 200

let queue: ClientEvent[] = []
let timer: ReturnType<typeof setTimeout> | null = null
let installed = false

function hasToken(): boolean {
  try {
    return Boolean(useAuthStore().getToken())
  } catch {
    return false
  }
}

function schedule() {
  if (timer !== null) return
  timer = setTimeout(() => {
    timer = null
    void flush()
  }, FLUSH_INTERVAL_MS)
}

/** Send what is queued. Never throws. */
export async function flush({ keepalive = false } = {}): Promise<void> {
  if (!queue.length) return
  const batch = queue
  queue = []
  try {
    await analyticsApi.sendEvents(batch, { keepalive })
  } catch {
    // Dropped, not requeued. A batch the gateway refuses will be refused
    // again, and a retry queue behind a persistent failure grows until the
    // tab is in trouble. Telemetry is never worth that.
  }
}

/**
 * Record something the user did.
 *
 * Returns immediately. The event carries no identity — the session id rides in
 * a header and the user comes from the bearer token, so a caller cannot name
 * someone else even by accident.
 */
export function track(
  type: ClientEventType,
  props: Record<string, unknown> = {},
  app: AnalyticsApp = 'platform',
): void {
  if (typeof window === 'undefined') return
  try {
    // Nothing to send for a visitor with no token: the gateway requires one,
    // so queueing their events only wastes memory and a failed request later.
    if (!hasToken()) return
    // Keeps the session alive while someone is plainly still using the page,
    // even if they are not making API calls.
    touchAnalyticsSession()
    if (queue.length >= QUEUE_MAX) queue.shift()
    queue.push({ type, app, occurred_at: new Date().toISOString(), props })
    if (queue.length >= FLUSH_AT) {
      void flush()
    } else {
      schedule()
    }
  } catch {
    // An analytics bug must not surface as a broken interaction.
  }
}

/** Flush on the way out, once per page lifetime. */
export function installFlushOnHide(): void {
  if (installed || typeof document === 'undefined') return
  installed = true
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush({ keepalive: true })
  })
  window.addEventListener('pagehide', () => { void flush({ keepalive: true }) })
}

export function useTelemetry() {
  return { track, flush }
}
