import rumApi, { type RumVital } from '~/services/rumApi'
import { createRumStream } from '~/composables/useRumBuffer'
import { captureEnabled, captureSampleRate } from '~/composables/useCaptureFlags'
import { currentRoutePattern } from '~/composables/useRumPath'
import { analyticsSessionId } from '~/composables/useAnalyticsSession'
import { sampledIn, vitalRating, type VitalMetric } from '~/utils/rum'

/**
 * How fast it felt.
 *
 * The gateway already records how long each route took to answer, and it is
 * not the same question: a route that returns in 80ms can still leave a page
 * four seconds from being usable, and only the browser can say so.
 *
 * WHY NOT `web-vitals`. It is not a dependency of this app and this is not a
 * good enough reason to add one — the five metrics below are four
 * `PerformanceObserver` registrations and about a hundred lines. The
 * approximations are called out where they exist (INP in particular is the
 * simplified estimate, not the library's exact percentile).
 *
 * Sampled per session like interactions, and off until the gateway says
 * otherwise.
 */

const QUEUE_MAX = 30
const FLUSH_AT = 10

/** CLS is scored over "session windows": shifts within a second of each other,
 *  capped at five seconds, and the worst window wins. */
const CLS_GAP_MS = 1000
const CLS_WINDOW_MS = 5000
/** Ignore interactions shorter than this; the standard's own floor. */
const INP_DURATION_THRESHOLD = 40

interface LayoutShiftEntry extends PerformanceEntry {
  value: number
  hadRecentInput: boolean
}

interface InteractionEntry extends PerformanceEntry {
  interactionId?: number
  duration: number
}

const stream = createRumStream<RumVital>({
  limit: QUEUE_MAX,
  flushAt: FLUSH_AT,
  send: (events, options) => rumApi.sendVitals(events, options),
  // The held metrics are only produced at the very end, and the shared unload
  // flush may well have registered its listener before this module's. Closing
  // them out here means they are in the queue whichever listener runs first —
  // and only when the page really is going, because finalizing on a routine
  // five-second flush would disconnect the observers and stop collection.
  beforeFlush: () => { if (pageIsGoing()) finalizeVitals() }
})

let unloading = false

function pageIsGoing(): boolean {
  if (unloading) return true
  try {
    return typeof document !== 'undefined' && document.visibilityState === 'hidden'
  } catch {
    return false
  }
}

const observers: PerformanceObserver[] = []
let installed = false
let finalized = false
let sampledDecision: { seed: string, rate: number, value: boolean } | null = null

let lcpValue = 0
let lcpPath = ''
let clsValue = 0
let clsPath = ''
let clsWindowValue = 0
let clsWindowFirst = 0
let clsWindowLast = 0
const interactions = new Map<number, number>()
let worstInteraction = 0
let inpPath = ''

function sampled(): boolean {
  const seed = analyticsSessionId()
  if (!seed) return false
  const rate = captureSampleRate()
  if (!sampledDecision || sampledDecision.seed !== seed || sampledDecision.rate !== rate) {
    sampledDecision = { seed, rate, value: sampledIn(`${seed}:vitals`, rate) }
  }
  return sampledDecision.value
}

function recording(): boolean {
  return captureEnabled('vitals') && sampled()
}

function navigationEntry(): PerformanceNavigationTiming | null {
  try {
    const entries = performance.getEntriesByType('navigation')
    return (entries[0] as PerformanceNavigationTiming) || null
  } catch {
    return null
  }
}

function navigationType(): string {
  return String(navigationEntry()?.type || '').slice(0, 16)
}

function emit(metric: VitalMetric, value: number, path: string): void {
  try {
    if (!recording()) return
    if (!Number.isFinite(value) || value < 0) return
    // CLS is unitless and small; everything else is milliseconds, where a
    // fraction of one is noise.
    const rounded = metric === 'CLS' ? Math.round(value * 10000) / 10000 : Math.round(value)
    stream.push({
      occurred_at: new Date().toISOString(),
      path: path || currentRoutePattern(),
      metric,
      value: rounded,
      rating: vitalRating(metric, value),
      navigation_type: navigationType()
    })
  } catch {
    // A missing metric is not worth an exception.
  }
}

function observe(type: string, callback: (entries: PerformanceEntryList) => void, extra: Record<string, unknown> = {}): void {
  try {
    if (typeof PerformanceObserver === 'undefined') return
    const observer = new PerformanceObserver((list) => {
      try {
        callback(list.getEntries())
      } catch {
        // One bad entry must not kill the observer for the rest.
      }
    })
    observer.observe({ type, buffered: true, ...extra } as PerformanceObserverInit)
    observers.push(observer)
  } catch {
    // The browser does not support this entry type. Nothing to report.
  }
}

/**
 * The metrics that are only final when the page is.
 *
 * LCP can be superseded until the user interacts or the page is hidden; CLS
 * and INP accumulate for as long as the page lives. So all three are held and
 * reported once, on the way out — which is also the flush that carries them.
 */
export function finalizeVitals(): void {
  if (finalized) return
  finalized = true
  try {
    for (const observer of observers) {
      try {
        observer.takeRecords()
        observer.disconnect()
      } catch {
        // Already gone.
      }
    }
    if (lcpValue > 0) emit('LCP', lcpValue, lcpPath)
    if (clsValue > 0) emit('CLS', clsValue, clsPath)

    // INP proper is the 98th percentile of interaction latencies. The
    // approximation the standard itself suggests for small samples is the
    // (count / 50)th worst, which is the p98 for anyone with fifty or more
    // interactions and the plain worst for everybody else.
    if (interactions.size) {
      const sorted = Array.from(interactions.values()).sort((a, b) => b - a)
      const index = Math.min(sorted.length - 1, Math.floor(sorted.length / 50))
      const value = sorted[index]
      if (value !== undefined) emit('INP', value, inpPath)
    }
  } catch {
    // Never on the way out of a page.
  }
}

/**
 * Install the observers. Idempotent, and safe before the flags are known —
 * observing is cheap and every emit re-checks `capture.vitals`, so a stream
 * that turns on mid-visit still reports the metrics from before it did.
 */
export function installWebVitals(): void {
  if (installed || typeof window === 'undefined') return
  installed = true

  try {
    // TTFB. Already known at this point on any normal navigation.
    const nav = navigationEntry()
    if (nav && nav.responseStart > 0) emit('TTFB', nav.responseStart, currentRoutePattern())

    observe('paint', (entries) => {
      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') emit('FCP', entry.startTime, currentRoutePattern())
      }
    })

    observe('largest-contentful-paint', (entries) => {
      const last = entries[entries.length - 1]
      if (!last) return
      // Later candidates supersede earlier ones; the last one before the page
      // is hidden is the answer.
      lcpValue = last.startTime
      lcpPath = currentRoutePattern()
    })

    observe('layout-shift', (entries) => {
      for (const raw of entries) {
        const entry = raw as LayoutShiftEntry
        // A shift the user caused by clicking something is not a layout bug.
        if (entry.hadRecentInput) continue
        if (
          clsWindowValue
          && entry.startTime - clsWindowLast < CLS_GAP_MS
          && entry.startTime - clsWindowFirst < CLS_WINDOW_MS
        ) {
          clsWindowValue += entry.value
        } else {
          clsWindowValue = entry.value
          clsWindowFirst = entry.startTime
        }
        clsWindowLast = entry.startTime
        if (clsWindowValue > clsValue) {
          clsValue = clsWindowValue
          clsPath = currentRoutePattern()
        }
      }
    })

    observe('event', (entries) => {
      for (const raw of entries) {
        const entry = raw as InteractionEntry
        const id = entry.interactionId
        if (!id) continue
        const previous = interactions.get(id) || 0
        if (entry.duration <= previous) continue
        interactions.set(id, entry.duration)
        if (entry.duration > worstInteraction) {
          worstInteraction = entry.duration
          inpPath = currentRoutePattern()
        }
        // A page with thousands of interactions does not need all of them to
        // find its worst; the shortest are the ones that can never matter.
        if (interactions.size > 200) {
          let leanestId = id
          let leanest = Number.POSITIVE_INFINITY
          for (const [key, value] of interactions) {
            if (value < leanest) {
              leanest = value
              leanestId = key
            }
          }
          interactions.delete(leanestId)
        }
      }
    }, { durationThreshold: INP_DURATION_THRESHOLD })

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'hidden') return
      unloading = true
      finalizeVitals()
      void stream.flush({ keepalive: true })
    })
    window.addEventListener('pagehide', () => {
      unloading = true
      finalizeVitals()
      void stream.flush({ keepalive: true })
    })
  } catch {
    // No performance API, or a browser that refuses the listeners.
  }
}

export function useWebVitals() {
  return { install: installWebVitals, finalize: finalizeVitals, flush: stream.flush }
}
