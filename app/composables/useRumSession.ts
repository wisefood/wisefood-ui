import rumApi, { type RumSession } from '~/services/rumApi'
import { analyticsSessionId } from '~/composables/useAnalyticsSession'
import { getClientRelease } from '~/utils/runtimeConfig'
import { viewportClass } from '~/utils/rum'
import { anyCaptureEnabled } from '~/composables/useCaptureFlags'

/**
 * The machine, sent once per visit.
 *
 * Every error row and every click row would otherwise have to carry the screen
 * size, the colour scheme and the connection to be readable, which is the same
 * dozen fields repeated across the highest-volume tables the platform has. One
 * row per session, joined on the session id, costs nothing and says the same
 * thing.
 *
 * What is NOT here: the user agent and the IP address. The gateway reads both
 * off the request itself, where they arrive whether this code sends them or
 * not — repeating them in a body would only mean a second copy to get wrong,
 * and the parsing and truncation rules belong on the server where they can be
 * changed without a release.
 */

/** A window nudged wider is not news; a phone rotating is. The row is re-sent
 *  only when the viewport crosses into another class. */
let lastKey = ''
let resizeTimer: ReturnType<typeof setTimeout> | null = null
let installed = false

function localeTag(): string {
  try {
    const match = document.cookie.match(/(?:^|;\s*)wisefood_locale=([^;]*)/)
    const value = match?.[1] ? decodeURIComponent(match[1]).trim() : ''
    if (/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/i.test(value)) return value
  } catch {
    // Cookies unavailable. The browser's own preference is a fair fallback.
  }
  try {
    return (navigator.language || '').slice(0, 16)
  } catch {
    return ''
  }
}

function connectionType(): string {
  try {
    const connection = (navigator as Navigator & {
      connection?: { effectiveType?: string }
    }).connection
    return String(connection?.effectiveType || '').slice(0, 16)
  } catch {
    return ''
  }
}

function matches(query: string): boolean {
  try {
    return typeof window.matchMedia === 'function' && window.matchMedia(query).matches
  } catch {
    return false
  }
}

/** What this device looks like right now. */
export function describeSession(): RumSession | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null
  const sessionId = analyticsSessionId()
  if (!sessionId) return null
  const root = document.documentElement
  return {
    session_id: sessionId,
    release: getClientRelease(),
    screen_w: Math.round(window.screen?.width || 0),
    screen_h: Math.round(window.screen?.height || 0),
    viewport_w: Math.round(window.innerWidth || root?.clientWidth || 0),
    viewport_h: Math.round(window.innerHeight || root?.clientHeight || 0),
    device_pixel_ratio: Math.round((window.devicePixelRatio || 1) * 100) / 100,
    color_scheme: matches('(prefers-color-scheme: dark)') ? 'dark' : 'light',
    reduced_motion: matches('(prefers-reduced-motion: reduce)'),
    timezone: (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || ''
      } catch {
        return ''
      }
    })(),
    connection: connectionType(),
    locale: localeTag()
  }
}

/**
 * Send the session row if it is new, or if the viewport has changed class.
 *
 * Gated on capture being on at all rather than on one stream: this row is the
 * context the other three are read against, and sending it for a session that
 * never records anything else would be collecting device fingerprints for no
 * purpose.
 */
export async function reportRumSession(): Promise<void> {
  try {
    if (!anyCaptureEnabled()) return
    const session = describeSession()
    if (!session) return
    const key = `${session.session_id}:${viewportClass(session.viewport_w)}:${session.color_scheme}`
    if (key === lastKey) return
    lastKey = key
    const sent = await rumApi.sendSession(session)
    // A refused row must not stop the next one being tried: an expired token
    // at page load is the common case and it fixes itself a second later.
    if (!sent) lastKey = ''
  } catch {
    // Never the reason a page fails.
  }
}

/** Watch for the viewport changing class. Idempotent. */
export function installRumSession(): void {
  if (installed || typeof window === 'undefined') return
  installed = true
  void reportRumSession()
  try {
    window.addEventListener('resize', () => {
      if (resizeTimer !== null) clearTimeout(resizeTimer)
      // Debounced hard: a drag-resize fires this fifty times and the answer
      // only changes at the boundaries.
      resizeTimer = setTimeout(() => {
        void reportRumSession()
      }, 750)
    }, { passive: true })
  } catch {
    // Without the listener the first row still stands.
  }
}

export function useRumSession() {
  return { install: installRumSession, report: reportRumSession, describe: describeSession }
}
