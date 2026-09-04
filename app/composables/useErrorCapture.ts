import rumApi, { isRumUrl, type ErrorKind, type RumBreadcrumb, type RumError } from '~/services/rumApi'
import { createRumStream } from '~/composables/useRumBuffer'
import { captureEnabled } from '~/composables/useCaptureFlags'
import { currentRoutePattern } from '~/composables/useRumPath'
import { getClientRelease } from '~/utils/runtimeConfig'
import { MAX_MESSAGE, elementKey, elementRole, redactStack, redactText, urlPathOnly } from '~/utils/rum'

/**
 * What broke, and the last few things that happened before it.
 *
 * Errors are the one stream here that is never sampled: an error that happens
 * to one person in a thousand is the interesting one, and a sampled crash
 * report is worse than none. It is still gated — `capture.errors` off means
 * nothing is recorded at all.
 *
 * TWO THINGS THIS MUST NEVER DO.
 *
 * It must never leak what somebody typed. A message routinely quotes the value
 * that failed validation and a stack routinely carries the URL it was called
 * with, so everything on the way out goes through `redactText`/`redactStack`.
 *
 * It must never report itself. An exception thrown while building an error row
 * would be caught by the very listener that is running, which builds another
 * row, and the page stops. Hence `reporting`, the URL skip-list on the fetch
 * wrapper, and a per-page cap: the third line of defence is that even a
 * runaway cannot post more than a few dozen rows.
 */

const QUEUE_MAX = 50
const FLUSH_AT = 10
/** Past this, a page in an error loop is told nothing more. */
const MAX_PER_PAGE = 30
/** The same error twice inside this window is one error. */
const DEDUPE_MS = 3000
const BREADCRUMB_MAX = 20

const stream = createRumStream<RumError>({
  limit: QUEUE_MAX,
  flushAt: FLUSH_AT,
  send: (events, options) => rumApi.sendErrors(events, options)
})

let breadcrumbs: RumBreadcrumb[] = []
let reporting = false
let reported = 0
let suppressed = 0
let installed = false
let fetchPatched = false
const recent = new Map<string, number>()

/**
 * Note something that just happened, for the next error to carry.
 *
 * A stack trace says where the page gave up; the breadcrumbs say what the
 * person was doing, which is what makes it reproducible. They are also the
 * riskiest field in this whole pipeline, so the rule is absolute: keys and
 * kinds only, never a value, never text from the page.
 */
export function addBreadcrumb(type: string, data?: Record<string, unknown>): void {
  try {
    const crumb: RumBreadcrumb = { t: new Date().toISOString(), type: String(type).slice(0, 32) }
    if (data) {
      const safe: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined) continue
        safe[key.slice(0, 32)] = typeof value === 'number' || typeof value === 'boolean'
          ? value
          : redactText(value, 120)
      }
      crumb.data = safe
    }
    breadcrumbs.push(crumb)
    if (breadcrumbs.length > BREADCRUMB_MAX) breadcrumbs = breadcrumbs.slice(-BREADCRUMB_MAX)
  } catch {
    // A breadcrumb is never worth an exception.
  }
}

export function currentBreadcrumbs(): RumBreadcrumb[] {
  return breadcrumbs.slice()
}

interface ErrorInput {
  kind: ErrorKind
  name?: unknown
  message?: unknown
  stack?: unknown
  urlPath?: string
  lineNo?: number | null
  colNo?: number | null
  handled?: boolean
  context?: Record<string, unknown>
}

/** Build and buffer one error row. Never throws, and never re-enters. */
export function reportError(input: ErrorInput): void {
  if (reporting) return
  reporting = true
  try {
    if (!captureEnabled('errors')) return
    if (reported >= MAX_PER_PAGE) return

    const name = redactText(input.name || 'Error', 128)
    const message = redactText(input.message, MAX_MESSAGE)
    const key = `${input.kind}|${name}|${message}|${input.lineNo ?? ''}`
    const now = Date.now()
    const last = recent.get(key)
    if (last !== undefined && now - last < DEDUPE_MS) {
      suppressed += 1
      return
    }
    recent.set(key, now)
    if (recent.size > 64) recent.clear()

    const context: Record<string, unknown> = { path: currentRoutePattern(), ...(input.context || {}) }
    const dropped = stream.dropped() + suppressed
    if (dropped) context.dropped = dropped

    stream.push({
      occurred_at: new Date().toISOString(),
      kind: input.kind,
      name,
      message,
      stack: redactStack(input.stack),
      url_path: input.urlPath ?? urlPathOnly(typeof window === 'undefined' ? '' : window.location.href),
      line_no: input.lineNo ?? null,
      col_no: input.colNo ?? null,
      handled: input.handled ?? false,
      breadcrumbs: currentBreadcrumbs(),
      context,
      release: getClientRelease(),
      app: 'platform'
    })
    reported += 1
    addBreadcrumb('error', { kind: input.kind, name })
  } catch {
    // Reporting an error must not become an error.
  } finally {
    reporting = false
  }
}

/** Vue's own error channel, wired from the plugin where `nuxtApp` exists. */
export function reportVueError(error: unknown, info?: string): void {
  const err = error as { name?: string, message?: string, stack?: string } | null
  reportError({
    kind: 'vue',
    name: err?.name || 'VueError',
    message: err?.message ?? error,
    stack: err?.stack,
    handled: true,
    context: info ? { info: redactText(info, 120) } : undefined
  })
}

function urlOf(input: RequestInfo | URL): string {
  try {
    if (typeof input === 'string') return input
    if (input instanceof URL) return input.href
    return (input as Request).url || ''
  } catch {
    return ''
  }
}

function methodOf(input: RequestInfo | URL, init?: RequestInit): string {
  try {
    const method = init?.method || (typeof input === 'object' && 'method' in input ? (input as Request).method : '')
    return String(method || 'GET').toUpperCase().slice(0, 8)
  } catch {
    return 'GET'
  }
}

/**
 * A failed API call is an error the user felt, and the page usually swallows
 * it into a toast.
 *
 * Wrapping `fetch` is the only way to see all of them without touching
 * fourteen service modules, and every one of them uses `fetch`. The wrapper
 * always calls through, never changes the result, and skips its own ingest
 * endpoints — a broken analytics endpoint reporting its own failure through
 * itself is an infinite loop with a network hop in it.
 */
function patchFetch(): void {
  if (fetchPatched || typeof window === 'undefined' || typeof window.fetch !== 'function') return
  fetchPatched = true
  const original = window.fetch.bind(window)

  window.fetch = async function patchedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let response: Response
    try {
      response = await original(input, init)
    } catch (error) {
      try {
        const url = urlOf(input)
        if (!isRumUrl(url)) {
          const path = urlPathOnly(url)
          addBreadcrumb('http', { method: methodOf(input, init), path, status: 0 })
          reportError({
            kind: 'http',
            name: 'NetworkError',
            message: `${methodOf(input, init)} ${path} failed`,
            stack: (error as { stack?: string })?.stack,
            urlPath: path,
            handled: true
          })
        }
      } catch {
        // Never let the wrapper change what the caller sees.
      }
      throw error
    }

    try {
      if (!response.ok) {
        const url = urlOf(input)
        if (!isRumUrl(url)) {
          const path = urlPathOnly(url)
          const method = methodOf(input, init)
          addBreadcrumb('http', { method, path, status: response.status })
          reportError({
            kind: 'http',
            name: `HTTP ${response.status}`,
            message: `${method} ${path} -> ${response.status}`,
            urlPath: path,
            handled: true,
            context: { status: response.status }
          })
        }
      }
    } catch {
      // As above: the response is returned whatever happens here.
    }
    return response
  }
}

/**
 * Install the listeners. Idempotent, and safe to call before the flags are
 * known — every handler re-checks `capture.errors` before it records.
 *
 * `addEventListener` rather than assigning `window.onerror`: Sentry is already
 * on this page and the property has one slot. In capture phase, because a
 * failed `<img>` or `<script>` fires an error event that does not bubble.
 */
export function installErrorCapture(): void {
  if (installed || typeof window === 'undefined') return
  installed = true

  try {
    window.addEventListener('error', (event: ErrorEvent) => {
      try {
        const target = event.target as (Element & { src?: string, href?: string }) | null
        if (target && target !== (window as unknown as EventTarget) && target.tagName) {
          const source = target.src || target.href || ''
          reportError({
            kind: 'resource',
            name: `${target.tagName.toLowerCase()} failed to load`,
            message: urlPathOnly(source),
            urlPath: urlPathOnly(source),
            handled: true
          })
          return
        }
        reportError({
          kind: 'error',
          name: (event.error as { name?: string })?.name || 'Error',
          message: event.message || (event.error as { message?: string })?.message,
          stack: (event.error as { stack?: string })?.stack,
          urlPath: urlPathOnly(event.filename),
          lineNo: Number.isFinite(event.lineno) ? event.lineno : null,
          colNo: Number.isFinite(event.colno) ? event.colno : null,
          handled: false
        })
      } catch {
        // See the header: this handler is the one that must never throw.
      }
    }, true)

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      try {
        const reason = event.reason as { name?: string, message?: string, stack?: string } | string | null
        const isObject = reason !== null && typeof reason === 'object'
        reportError({
          kind: 'unhandledrejection',
          name: (isObject ? reason.name : 'UnhandledRejection') || 'UnhandledRejection',
          message: isObject ? reason.message : reason,
          stack: isObject ? reason.stack : undefined,
          handled: false
        })
      } catch {
        // As above.
      }
    })
    // The trail of clicks that led to the error. Only the structural key and
    // the role — never the label, never the value, never the selection. This
    // lives here rather than in the interaction capture so that a deployment
    // recording errors and nothing else still gets a reproduction.
    window.addEventListener('click', (event: MouseEvent) => {
      try {
        if (!captureEnabled('errors')) return
        const target = (event.target instanceof Element) ? event.target : null
        addBreadcrumb('click', { key: elementKey(target), role: elementRole(target) })
      } catch {
        // As above.
      }
    }, { capture: true, passive: true })
  } catch {
    // A browser that refuses the listeners simply reports nothing.
  }

  patchFetch()
}

export function useErrorCapture() {
  return {
    install: installErrorCapture,
    report: reportError,
    reportVueError,
    breadcrumb: addBreadcrumb,
    flush: stream.flush
  }
}
