/**
 * The session id shown in the page footer.
 *
 * One id ties together everything a person does in one sitting — the searches
 * they ran, the questions they asked, the meal plans they generated — so that
 * "it gave me a strange answer earlier" becomes a thing someone can actually
 * look up. The user sees the id; only admins and experts can read the activity
 * behind it.
 *
 * What it is NOT: an identity. It lives in `sessionStorage`, so it dies with
 * the browser tab; it resets after a period of inactivity; and it resets when
 * the signed-in user changes, so one id can never span two accounts.
 *
 * The logic here is deliberately pure — `resolveSession` takes the clock, the
 * current user and the stored value and returns what the session should be —
 * so the rules can be reasoned about and exercised without a browser.
 */

/** sessionStorage key, following the `wisefood_` prefix the auth and household
 *  stores use. (The recipe store predates that convention and uses `recipe-`.) */
export const SESSION_STORAGE_KEY = 'wisefood_analytics_session'

/** A gap longer than this starts a new session. Matches the usual analytics
 *  convention, and means an id left open overnight does not merge yesterday's
 *  activity into today's. */
export const SESSION_IDLE_MS = 30 * 60 * 1000

/**
 * Deliberately excludes 0/1/i/l/o. The whole point of this id is that someone
 * reads it off the screen and types it into a support form or says it out
 * loud, and those five characters are where that goes wrong.
 */
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'
const GROUPS = 3
const GROUP_LENGTH = 4

export interface StoredSession {
  /** The id shown in the footer, e.g. `k3f9-2xa7-lm4q`. */
  id: string
  /** Epoch ms the session began. */
  startedAt: number
  /** Epoch ms of the last recorded activity, used for the idle cutoff. */
  lastSeenAt: number
  /** Keycloak subject at the time, or null for anonymous/guest. */
  owner: string | null
}

type RandomBytes = (length: number) => Uint8Array

const defaultRandomBytes: RandomBytes = (length) => {
  const bytes = new Uint8Array(length)
  const cryptoRef = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined
  if (cryptoRef?.getRandomValues) {
    cryptoRef.getRandomValues(bytes)
    return bytes
  }
  // No crypto (very old browser, or SSR without webcrypto). Still unique
  // enough for grouping one person's own actions; this is not a secret.
  for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  return bytes
}

/** A fresh id, grouped for legibility: `k3f9-2xa7-lm4q`. */
export function newSessionId(randomBytes: RandomBytes = defaultRandomBytes): string {
  const total = GROUPS * GROUP_LENGTH
  const bytes = randomBytes(total)
  let out = ''
  for (let i = 0; i < total; i += 1) {
    if (i > 0 && i % GROUP_LENGTH === 0) out += '-'
    out += ALPHABET[(bytes[i] ?? 0) % ALPHABET.length]
  }
  return out
}

/** Whether a stored value is a session this code wrote. */
export function isStoredSession(value: unknown): value is StoredSession {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<StoredSession>
  return (
    typeof candidate.id === 'string'
    && candidate.id.length > 0
    && typeof candidate.startedAt === 'number'
    && typeof candidate.lastSeenAt === 'number'
    && (candidate.owner === null || typeof candidate.owner === 'string')
  )
}

export interface ResolveResult {
  session: StoredSession
  /** True when a new session was started rather than an existing one continued. */
  started: boolean
  /** Why a new one was started — useful when explaining a changed id. */
  reason?: 'no-session' | 'idle' | 'user-changed' | 'corrupt'
}

/**
 * The session that should be in effect, given what is stored.
 *
 * Pure: no storage, no clock, no randomness of its own. Every rule the footer
 * depends on is decided here.
 */
export function resolveSession(
  now: number,
  owner: string | null,
  stored: unknown,
  mintId: () => string = () => newSessionId(),
): ResolveResult {
  const fresh = (reason: ResolveResult['reason']): ResolveResult => ({
    session: { id: mintId(), startedAt: now, lastSeenAt: now, owner },
    started: true,
    reason,
  })

  if (stored === null || stored === undefined) return fresh('no-session')
  if (!isStoredSession(stored)) return fresh('corrupt')
  // Signing in, out, or switching accounts starts a new session: an id that
  // spanned two accounts would link them to each other.
  if ((stored.owner ?? null) !== (owner ?? null)) return fresh('user-changed')
  if (now - stored.lastSeenAt > SESSION_IDLE_MS) return fresh('idle')
  // A clock that jumped backwards should not extend a session indefinitely.
  if (now < stored.startedAt) return fresh('corrupt')

  return {
    session: { ...stored, lastSeenAt: now, owner },
    started: false,
  }
}

/** How long the session has been going, in whole minutes. */
export function sessionAgeMinutes(session: StoredSession, now: number): number {
  return Math.max(0, Math.floor((now - session.startedAt) / 60000))
}
