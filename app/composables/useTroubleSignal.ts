import { readonly, shallowRef } from 'vue'
import { isRumUrl } from '~/services/rumApi'
import { currentRoutePattern } from '~/composables/useRumPath'
import { urlPathOnly } from '~/utils/rum'

/**
 * "Something broke, and it was us."
 *
 * The floating dock offers a bug report the moment the platform fails in a
 * way the person could not have caused and cannot fix: a server error, a
 * refusal that survived the token refresh, a request that never came back, a
 * script that threw. Everything else stays quiet. A recipe photo that 404s, a
 * search with no results, a form the API rejected as invalid — none of those
 * is a bug report, and a bubble that cries wolf gets ignored by the time it
 * matters.
 *
 * This is deliberately separate from `useErrorCapture`. That pipeline records
 * for the console and installs only when the gateway switches `capture.errors`
 * on; this one is for the person in front of the screen and must work on a
 * deployment that records nothing.
 *
 * WHAT COUNTS
 *
 * - HTTP 5xx from our own API: always.
 * - HTTP 401/403 and a request that failed outright: only once they have had
 *   time to recover. The services refresh the token and retry once after a
 *   401, so the first 401 of an expired session is routine; a success on the
 *   same request inside the settle window cancels it. A move to /login does
 *   too — the session ended, and the login page already says so.
 * - An uncaught script error, an unhandled rejection that is not an HTTP
 *   error (those were counted above, or were a 404 nobody needs to hear
 *   about), and an error a Vue component boundary caught.
 *
 * WHAT NEVER DOES
 *
 * Anything not addressed to our own origins, the analytics ingest, the Flows
 * proxy, media files, 4xx other than 401/403, a request the page aborted, a
 * failure while the browser is offline or the page is unloading, and the
 * usual browser noise (ResizeObserver, extension scripts, a stale chunk after
 * a deploy).
 *
 * And it is rationed: one bubble at a time, a quiet spell after each, a
 * longer one once dismissed, and a ceiling per page load.
 */

export type TroubleKind = 'server' | 'auth' | 'network' | 'script'

export interface Trouble {
  kind: TroubleKind
  /** HTTP status, for `server` and `auth`. */
  status?: number
  /** `GET /rest/api/v1/…` — method and path, never a query string. */
  request?: string
  /** The route pattern of the page it happened on. */
  page: string
  at: number
}

/** Long enough for a refresh-and-retry round trip on a slow connection. */
const SETTLE_MS = 4000
/** A cascade of script errors from one fault is one bubble. */
const SCRIPT_DEBOUNCE_MS = 800
const QUIET_AFTER_SHOWN_MS = 2 * 60_000
const QUIET_AFTER_DISMISS_MS = 10 * 60_000
const MAX_PER_LOAD = 3

const MEDIA_PATH = /\.(?:png|jpe?g|gif|webp|avif|svg|ico|mp4|webm|vtt|woff2?|ttf|css|js|map)$/i
const FLOWS_PROXY_PATH = /^\/v2\/sdk\//

const NOISE = [
  /ResizeObserver loop/i,
  /^Script error\.?$/i,
  // A tab left open across a deploy asks for chunks that no longer exist.
  // The fix is a reload, not a bug report.
  /dynamically imported module|Importing a module script failed|Loading chunk [\w-]+ failed|Unable to preload CSS/i,
  // keycloak-js gives up on its silent-check iframe where third-party
  // cookies are blocked; the session carries on without it.
  /3rd party check iframe/i,
  /Avoided redundant navigation|Navigation (?:cancelled|aborted)|NavigationDuplicated/i
]
const EXTENSION_SOURCE = /^(?:chrome|moz|safari(?:-web)?)-extension:\/\//
/**
 * Errors that are about the connection, not the code: an aborted request,
 * and a token refresh that could not reach the sign-in server (see
 * TokenRefreshUnavailableError in services/keycloak.ts).
 */
const QUIET_ERROR_NAMES = new Set(['AbortError', 'TokenRefreshUnavailableError'])

const current = shallowRef<Trouble | null>(null)

let installed = false
let unloading = false
let shownCount = 0
let quietUntil = 0
let scriptTimer: ReturnType<typeof setTimeout> | null = null
const pending = new Map<string, ReturnType<typeof setTimeout>>()
let ownOrigins = new Set<string>()
const ignoredPrefixes: string[] = []

function originOf(url: string | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url, window.location.href).origin
  } catch {
    return null
  }
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

/** Whether a failure of this request is ours to own. */
function isWatched(url: string): boolean {
  if (!url || isRumUrl(url)) return false
  let parsed: URL
  try {
    parsed = new URL(url, window.location.href)
  } catch {
    return false
  }
  if (!ownOrigins.has(parsed.origin)) return false
  if (FLOWS_PROXY_PATH.test(parsed.pathname)) return false
  if (ignoredPrefixes.some(prefix => parsed.href.startsWith(prefix))) return false
  return !MEDIA_PATH.test(parsed.pathname)
}

/**
 * Never offer a report over requests under this URL. For optional content a
 * feature fetches for itself and copes without (the help panel's video
 * manifest): a bucket that refuses it is a missing clip, not a bug.
 */
export function ignoreTroubleUnder(urlPrefix: string): void {
  try {
    if (typeof window === 'undefined' || !urlPrefix) return
    const href = new URL(urlPrefix, window.location.href).href
    if (!ignoredPrefixes.includes(href)) ignoredPrefixes.push(href)
  } catch {
    // An unparseable prefix ignores nothing.
  }
}

function raise(trouble: Trouble): void {
  if (unloading || current.value) return
  if (shownCount >= MAX_PER_LOAD || Date.now() < quietUntil) return
  shownCount += 1
  quietUntil = Date.now() + QUIET_AFTER_SHOWN_MS
  current.value = trouble
}

function settleThenRaise(key: string, trouble: Omit<Trouble, 'page' | 'at'>): void {
  const page = currentRoutePattern()
  const existing = pending.get(key)
  if (existing) clearTimeout(existing)
  pending.set(key, setTimeout(() => {
    pending.delete(key)
    // Sent to sign in while this was settling: the session ended, which the
    // login page explains better than a bug report would.
    if (window.location.pathname.endsWith('/login')) return
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return
    raise({ ...trouble, page, at: Date.now() })
  }, SETTLE_MS))
}

function recovered(key: string): void {
  const timer = pending.get(key)
  if (!timer) return
  clearTimeout(timer)
  pending.delete(key)
}

function noteScriptTrouble(message: unknown, source?: string): void {
  const text = typeof message === 'string' ? message : String((message as { message?: unknown })?.message ?? '')
  if (NOISE.some(pattern => pattern.test(text))) return
  if (source && EXTENSION_SOURCE.test(source)) return
  if (scriptTimer) return
  const page = currentRoutePattern()
  scriptTimer = setTimeout(() => {
    scriptTimer = null
    raise({ kind: 'script', page, at: Date.now() })
  }, SCRIPT_DEBOUNCE_MS)
}

/** Vue's error channel, wired from the plugin where `nuxtApp` exists. */
export function noteVueTrouble(error: unknown): void {
  try {
    const err = error as { name?: string, message?: string, status?: number, statusCode?: number } | null
    // A rejected API call rethrown through a component carries its status,
    // and the fetch wrapper has already decided whether that one counts.
    if (typeof err?.status === 'number' || typeof err?.statusCode === 'number') return
    if (err?.name && QUIET_ERROR_NAMES.has(err.name)) return
    noteScriptTrouble(err?.message ?? error)
  } catch {
    // Watching for errors must never be one.
  }
}

function patchFetch(): void {
  const original = window.fetch.bind(window)

  window.fetch = async function troubleWatchedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let response: Response
    try {
      response = await original(input, init)
    } catch (error) {
      try {
        const url = urlOf(input)
        const aborted = (error as { name?: string })?.name === 'AbortError' || init?.signal?.aborted
        if (!aborted && isWatched(url)) {
          const request = `${methodOf(input, init)} ${urlPathOnly(url)}`
          settleThenRaise(request, { kind: 'network', request })
        }
      } catch {
        // The caller sees exactly what it would have seen without us.
      }
      throw error
    }

    try {
      const url = urlOf(input)
      if (isWatched(url)) {
        const request = `${methodOf(input, init)} ${urlPathOnly(url)}`
        if (response.ok) {
          recovered(request)
        } else if (response.status >= 500) {
          raise({ kind: 'server', status: response.status, request, page: currentRoutePattern(), at: Date.now() })
        } else if (response.status === 401 || response.status === 403) {
          settleThenRaise(request, { kind: 'auth', status: response.status, request })
        }
      }
    } catch {
      // As above.
    }
    return response
  }
}

/**
 * Start watching. Idempotent. The origins are read once, here, because the
 * fetch wrapper runs outside any Nuxt context and cannot ask for them later.
 */
export function installTroubleWatch(apiBases: Array<string | undefined>): void {
  if (installed || typeof window === 'undefined') return
  installed = true

  ownOrigins = new Set([window.location.origin, ...apiBases.map(originOf).filter((o): o is string => Boolean(o))])

  try {
    const leaving = (value: boolean) => () => {
      unloading = value
    }
    window.addEventListener('pagehide', leaving(true))
    window.addEventListener('beforeunload', leaving(true))
    window.addEventListener('pageshow', leaving(false))

    // Not capture phase: a failed <img> fires a non-bubbling error event that
    // only a capturing listener sees, and a missing image is exactly what
    // this must not report.
    window.addEventListener('error', (event: ErrorEvent) => {
      try {
        if (event.target && event.target !== (window as unknown as EventTarget)) return
        noteScriptTrouble(event.message || event.error, event.filename)
      } catch {
        // See noteVueTrouble.
      }
    })

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      try {
        const reason = event.reason as { name?: string, message?: string, status?: number } | string | null
        if (reason && typeof reason === 'object') {
          if ((reason.name && QUIET_ERROR_NAMES.has(reason.name)) || typeof reason.status === 'number') return
          noteScriptTrouble(reason.message ?? reason.name)
          return
        }
        noteScriptTrouble(reason)
      } catch {
        // As above.
      }
    })

    if (typeof window.fetch === 'function') patchFetch()
  } catch {
    // A browser that refuses the listeners just never offers the bubble.
  }
}

/**
 * The trouble currently worth a bubble, and what the person did about it.
 *
 * `report()` and `dismiss()` both clear it; dismissing also buys a longer
 * quiet spell, because "not now" means not now.
 */
export function useTroubleSignal() {
  function clear() {
    current.value = null
  }
  function report() {
    quietUntil = Math.max(quietUntil, Date.now() + QUIET_AFTER_SHOWN_MS)
    clear()
  }
  function dismiss() {
    quietUntil = Math.max(quietUntil, Date.now() + QUIET_AFTER_DISMISS_MS)
    clear()
  }
  return { trouble: readonly(current), report, dismiss, clear }
}
