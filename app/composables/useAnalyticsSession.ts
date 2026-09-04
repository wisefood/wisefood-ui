import { computed, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import {
  SESSION_STORAGE_KEY,
  newSessionId,
  resolveSession,
  sessionAgeMinutes,
  type StoredSession
} from '~/utils/analyticsSession'

/**
 * The session id shown in the footer, and the headers that tie a request to it.
 *
 * Module-level state rather than per-component: every HTTP client asks for the
 * same id, and a ref created inside the composable would give each caller its
 * own.
 *
 * Storage is `sessionStorage`, so the id dies with the tab. Every read and
 * write is guarded — Safari in private mode throws on access, and an
 * analytics nicety must never be the reason a page fails to render.
 */

const current = ref<StoredSession | null>(null)

function readStored(): unknown {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStored(session: StoredSession): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Private browsing, or storage full. The id still works for this page
    // load; it just will not survive a reload.
  }
}

/** Who the session belongs to right now, or null when nobody is signed in. */
function currentOwner(): string | null {
  try {
    const auth = useAuthStore()
    return auth.user?.id ?? auth.guest?.userId ?? null
  } catch {
    // Called before Pinia is active (SSR, or a very early plugin).
    return null
  }
}

/**
 * The session in effect, refreshing its idle timer.
 *
 * Called on every outbound request, which is what keeps an active session from
 * expiring while someone is plainly still using the page.
 */
export function touchAnalyticsSession(): StoredSession | null {
  if (typeof window === 'undefined') return null
  const resolved = resolveSession(
    Date.now(),
    currentOwner(),
    current.value ?? readStored(),
    () => newSessionId()
  )
  current.value = resolved.session
  writeStored(resolved.session)
  return resolved.session
}

/** The id alone, for a header. Empty string when there cannot be one. */
export function analyticsSessionId(): string {
  return touchAnalyticsSession()?.id ?? ''
}

/**
 * Correlation id for one request.
 *
 * Minted per request, not per session: the gateway echoes it, forwards it to
 * every downstream service and stamps it on their log lines, so one action can
 * be followed across five services. `crypto.randomUUID` where available.
 */
export function newRequestId(): string {
  try {
    const cryptoRef = globalThis.crypto
    if (cryptoRef?.randomUUID) return cryptoRef.randomUUID().replace(/-/g, '')
  } catch {
    // fall through
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
}

/**
 * Headers every request to the platform should carry.
 *
 * Identity is deliberately absent — the bearer token is the only thing allowed
 * to say who the caller is. These say *which visit* and *which client*, nothing
 * more.
 */
export function analyticsHeaders(clientVersion = '1'): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Request-Id': newRequestId(),
    'X-Client': `wisefood-ui/${clientVersion}`
  }
  const sessionId = analyticsSessionId()
  if (sessionId) headers['X-Client-Session'] = sessionId
  const locale = currentLocale()
  if (locale) headers['X-Locale'] = locale
  return headers
}

/**
 * The language the interface is actually in.
 *
 * Read from the cookie rather than from `useI18n()`, because this function is
 * called from plain service modules with no component instance to hook into.
 * Accept-Language is not a substitute: it says what the device prefers, and
 * this product lets people switch language independently of that.
 */
function currentLocale(): string | null {
  if (typeof document === 'undefined') return null
  try {
    const match = document.cookie.match(/(?:^|;\s*)wisefood_locale=([^;]*)/)
    const value = match?.[1] ? decodeURIComponent(match[1]).trim() : ''
    // Narrow on purpose: anything that is not a plain language tag is dropped
    // rather than sent, so a tampered cookie cannot reach a header.
    return /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/i.test(value) ? value : null
  } catch {
    return null
  }
}

/** Start a new session immediately, e.g. on sign-out. */
export function resetAnalyticsSession(): void {
  current.value = null
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // nothing to do
  }
}

/** Reactive access, for the footer. */
export function useAnalyticsSession() {
  if (typeof window !== 'undefined' && current.value === null) touchAnalyticsSession()

  return {
    session: computed(() => current.value),
    sessionId: computed(() => current.value?.id ?? ''),
    ageMinutes: computed(() =>
      current.value ? sessionAgeMinutes(current.value, Date.now()) : 0
    ),
    touch: touchAnalyticsSession,
    reset: resetAnalyticsSession
  }
}
