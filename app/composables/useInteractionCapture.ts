import rumApi, { type InteractionKind, type RumInteraction } from '~/services/rumApi'
import { createRumStream } from '~/composables/useRumBuffer'
import { captureEnabled, captureSampleRate } from '~/composables/useCaptureFlags'
import { currentRoutePattern } from '~/composables/useRumPath'
import { analyticsSessionId } from '~/composables/useAnalyticsSession'
import {
  elementKey,
  elementRole,
  interactiveAncestor,
  pageBox,
  pagePercent,
  sampledIn,
  scrollDepthPercent
} from '~/utils/rum'

/**
 * Where people clicked, where they gave up, and how far down they got.
 *
 * Three things this records that a server log cannot: a click that produced
 * nothing, the same click made five times in frustration, and the fact that
 * nobody ever scrolls to the section everyone argued about.
 *
 * WHAT IS NOT RECORDED. No text, ever — not the label on the button, not the
 * value in the field next to it, not the selection. A row says *which control*
 * (`element_key`) and *where on the page* (two integers), and nothing else can
 * be reconstructed from it.
 *
 * COORDINATES are ten-thousandths of the full document box, not of the
 * viewport. A heatmap has to overlay a 1280-wide laptop and a 390-wide phone,
 * and a viewport-relative point moves every time the reader scrolls, which
 * would draw a picture of scrolling rather than of clicking.
 *
 * SAMPLING is decided once per session, not per click, so a sampled-in session
 * yields a whole story instead of a scatter of one click in ten.
 */

const QUEUE_MAX = 200
const FLUSH_AT = 20

/** Clicks this close together, in space and time, are one gesture. */
const RAGE_RADIUS_PX = 40
const RAGE_WINDOW_MS = 1000
const RAGE_MIN_CLICKS = 3
/** How long the page has to react before a click counts as dead. */
const DEAD_WINDOW_MS = 500

const stream = createRumStream<RumInteraction>({
  limit: QUEUE_MAX,
  flushAt: FLUSH_AT,
  send: (events, options) => rumApi.sendInteractions(events, options),
  // A cluster still gathering, or a scroll depth never reported, would be lost
  // on the way off the page — so close both out, but only when the page really
  // is going. Doing it on the routine five-second flush would split a rage
  // cluster mid-gesture and emit a scroll row per flush instead of one per
  // page view.
  beforeFlush: () => {
    if (!pageIsGoing()) return
    finalizeCluster()
    emitScrollDepth()
  }
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

interface Cluster {
  occurredAt: string
  path: string
  key: string
  role: string
  xPage: number
  yPage: number
  xPct: number
  yPct: number
  viewportW: number
  viewportH: number
  repeats: number
  lastAt: number
  /** Nothing interactive under the pointer: a candidate for a dead click. */
  deadCandidate: boolean
  /** The page did something within the window, so it was not dead after all. */
  reacted: boolean
  navAtClick: number
  observer: MutationObserver | null
  timer: ReturnType<typeof setTimeout> | null
}

let cluster: Cluster | null = null
let installed = false
let sampledDecision: { seed: string, rate: number, value: boolean } | null = null

let currentPath = ''
let maxDepth = 0
let lastEmittedDepth = -1
let scrollScheduled = false
/** Bumped on every route change, so "did the page navigate" is one comparison. */
let navCount = 0

/**
 * Is this session recording clicks at all?
 *
 * Memoised against the session id and the rate, so it survives a re-render but
 * is re-decided when the gateway changes the rate or the session rolls over.
 */
function sampled(): boolean {
  const seed = analyticsSessionId()
  if (!seed) return false
  const rate = captureSampleRate()
  if (!sampledDecision || sampledDecision.seed !== seed || sampledDecision.rate !== rate) {
    sampledDecision = { seed, rate, value: sampledIn(`${seed}:interactions`, rate) }
  }
  return sampledDecision.value
}

function recording(): boolean {
  return captureEnabled('interactions') && sampled()
}

function pathNow(): string {
  return currentPath || currentRoutePattern()
}

/**
 * Close the open cluster and buffer exactly one row for it.
 *
 * This is where three angry clicks become a single `rage` row with
 * `repeats: 3` rather than three rows that a report would have to re-cluster
 * later, and where a click that nothing answered becomes `dead`. Rage wins
 * over dead: somebody clicking five times has already told you it did nothing.
 */
export function finalizeCluster(): void {
  const open = cluster
  if (!open) return
  cluster = null
  try {
    if (open.timer !== null) clearTimeout(open.timer)
    open.observer?.disconnect()

    let kind: InteractionKind = 'click'
    if (open.repeats >= RAGE_MIN_CLICKS) {
      kind = 'rage'
    } else if (open.deadCandidate && !open.reacted && navCount === open.navAtClick) {
      kind = 'dead'
    }

    stream.push({
      occurred_at: open.occurredAt,
      path: open.path,
      kind,
      element_key: open.key,
      element_role: open.role,
      x_pct: open.xPct,
      y_pct: open.yPct,
      viewport_w: open.viewportW,
      viewport_h: open.viewportH,
      depth_pct: null,
      repeats: open.repeats
    })
  } catch {
    // A lost row is not worth an exception in a click handler.
  }
}

function scheduleFinalize(open: Cluster): void {
  if (open.timer !== null) clearTimeout(open.timer)
  open.timer = setTimeout(() => {
    // Runs after both windows have passed, so the rage count is settled and
    // the page has had its chance to react.
    if (cluster === open) finalizeCluster()
  }, Math.max(RAGE_WINDOW_MS, DEAD_WINDOW_MS))
}

/**
 * Watch for the page reacting to a click that hit nothing interactive.
 *
 * A dead click is not "no button underneath" on its own — plenty of real
 * controls are a div with a listener attached in script. It is no control
 * *and* no visible consequence, so the DOM gets half a second to change.
 */
function watchForReaction(open: Cluster): void {
  if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') {
    // No way to tell whether anything happened, so do not accuse the page.
    open.reacted = true
    return
  }
  try {
    const observer = new MutationObserver(() => {
      open.reacted = true
      observer.disconnect()
      open.observer = null
    })
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    })
    open.observer = observer
    setTimeout(() => {
      open.observer?.disconnect()
      open.observer = null
    }, DEAD_WINDOW_MS)
  } catch {
    open.reacted = true
  }
}

function onClick(event: MouseEvent): void {
  try {
    if (!recording()) return
    if (typeof document === 'undefined') return
    const box = pageBox(document, window)
    // `pageX` is already document-relative; the fallback reconstructs it for
    // the synthetic events that do not set it.
    const xPage = Number.isFinite(event.pageX) ? event.pageX : event.clientX + window.scrollX
    const yPage = Number.isFinite(event.pageY) ? event.pageY : event.clientY + window.scrollY
    const now = Date.now()

    const open = cluster
    if (
      open
      && now - open.lastAt <= RAGE_WINDOW_MS
      && Math.abs(xPage - open.xPage) <= RAGE_RADIUS_PX
      && Math.abs(yPage - open.yPage) <= RAGE_RADIUS_PX
    ) {
      open.repeats += 1
      open.lastAt = now
      scheduleFinalize(open)
      return
    }

    finalizeCluster()

    const target = (event.target instanceof Element) ? event.target : null
    const next: Cluster = {
      occurredAt: new Date(now).toISOString(),
      path: pathNow(),
      key: elementKey(target),
      role: elementRole(target),
      xPage,
      yPage,
      xPct: pagePercent(xPage, box.width),
      yPct: pagePercent(yPage, box.height),
      viewportW: box.viewportWidth,
      viewportH: box.viewportHeight,
      repeats: 1,
      lastAt: now,
      deadCandidate: interactiveAncestor(target) === null,
      reacted: false,
      navAtClick: navCount,
      observer: null,
      timer: null
    }
    cluster = next
    if (next.deadCandidate) watchForReaction(next)
    scheduleFinalize(next)
  } catch {
    // Never break a click.
  }
}

function onScroll(): void {
  if (scrollScheduled || typeof document === 'undefined') return
  scrollScheduled = true
  const measure = () => {
    scrollScheduled = false
    try {
      if (!recording()) return
      const depth = scrollDepthPercent(pageBox(document, window))
      if (depth > maxDepth) maxDepth = depth
    } catch {
      // Ignore: the depth simply stops advancing.
    }
  }
  try {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(measure)
    else setTimeout(measure, 100)
  } catch {
    measure()
  }
}

/**
 * One scroll row per page view: how far down the reader ever got.
 *
 * Emitted when the view ends — a route change, the tab going away — because
 * that is the only moment the answer is final. Guarded on the depth having
 * actually increased, so a tab hidden and shown three times does not produce
 * three identical rows.
 */
export function emitScrollDepth(path: string = pathNow()): void {
  try {
    if (!recording()) return
    if (!path || maxDepth <= 0 || maxDepth <= lastEmittedDepth) return
    lastEmittedDepth = maxDepth
    const box = typeof document === 'undefined'
      ? { viewportWidth: 0, viewportHeight: 0 }
      : pageBox(document, window)
    stream.push({
      occurred_at: new Date().toISOString(),
      path,
      kind: 'scroll',
      element_key: '',
      element_role: '',
      x_pct: null,
      y_pct: null,
      viewport_w: box.viewportWidth,
      viewport_h: box.viewportHeight,
      depth_pct: maxDepth,
      repeats: 1
    })
  } catch {
    // As everywhere here: a lost row, not a broken page.
  }
}

/**
 * A page view ended and another began.
 *
 * Called from the router hook rather than inferred from the URL, because the
 * row for the page being left has to carry the pattern of the page being left.
 */
export function notePageView(pattern: string): void {
  try {
    // Bumped BEFORE the cluster is closed: a click that navigated is a click
    // that worked, and finalizing it while the counter still matched would
    // record the most effective click on the page as a dead one.
    navCount += 1
    finalizeCluster()
    emitScrollDepth()
    currentPath = pattern
    maxDepth = 0
    lastEmittedDepth = -1
  } catch {
    // Navigation must not fail because analytics did.
  }
}

/** Install the listeners. Idempotent; every handler re-checks the flag. */
export function installInteractionCapture(): void {
  if (installed || typeof window === 'undefined') return
  installed = true
  if (!currentPath) currentPath = currentRoutePattern()
  try {
    // Capture phase: a click that a handler stops from propagating is still a
    // click somebody made, and those are exactly the interesting ones.
    window.addEventListener('click', onClick, { capture: true, passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })

    // The shared unload flush may have registered its listener before this
    // module existed, so the last cluster and the scroll depth are closed out
    // and sent here rather than relying on running first.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'hidden') {
        unloading = false
        return
      }
      unloading = true
      finalizeCluster()
      emitScrollDepth()
      void stream.flush({ keepalive: true })
    })
    window.addEventListener('pagehide', () => {
      unloading = true
      finalizeCluster()
      emitScrollDepth()
      void stream.flush({ keepalive: true })
    })
  } catch {
    // A browser that refuses these records nothing, which is the safe end.
  }
}

export function useInteractionCapture() {
  return {
    install: installInteractionCapture,
    notePageView,
    flush: stream.flush
  }
}
