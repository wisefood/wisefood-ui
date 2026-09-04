import rumApi, { type CaptureFlags } from '~/services/rumApi'

/**
 * Whether the browser is allowed to capture anything, decided by the gateway.
 *
 * Every stream here is off until the platform says otherwise, and the platform
 * can change its mind at any time. That is not a nicety: this code records what
 * broke and where people clicked, and an operator — or a study participant
 * withdrawing — must be able to stop it inside a minute without a redeploy and
 * without anyone rolling a pod.
 *
 * So: one poll, shared by every stream, refreshed on the same cadence the
 * gateway's own settings cache uses. A request that fails, a body in an
 * unexpected shape, a deployment whose gateway has no such endpoint — all three
 * mean off.
 *
 * Module-level state rather than per-component: three capture modules ask the
 * same question and a ref created inside the composable would give each its own
 * poll.
 */

/** Matches `_SETTINGS_TTL` on the gateway: polling faster only spends requests
 *  on staleness the server already has. */
const POLL_INTERVAL_MS = 30000

/**
 * Used when the gateway is on but says nothing about a rate. Deliberately
 * small — clicks and vitals are the highest-volume things this platform will
 * ever record, and the failure mode of guessing high is a flood.
 */
export const DEFAULT_SAMPLE_RATE = 0.1

export type CaptureStream = 'errors' | 'interactions' | 'vitals'

const OFF: Readonly<Record<CaptureStream, boolean>> = Object.freeze({
  errors: false,
  interactions: false,
  vitals: false
})

let enabled: Record<CaptureStream, boolean> = { ...OFF }
let sampleRate = DEFAULT_SAMPLE_RATE
let vitalsSampleRate = DEFAULT_SAMPLE_RATE
let timer: ReturnType<typeof setInterval> | null = null
let started = false
let inFlight = false
const listeners = new Set<(state: Record<CaptureStream, boolean>) => void>()

/** Read one capture switch out of whichever shape the gateway sent.
 *
 *  `{ capture: { errors: true } }` is what `/analytics/runtime-flags` returns
 *  today; the flat `capture.errors` key is what the settings table calls it.
 *  Accepting both means this does not break the day one is renamed into the
 *  other. Anything that is not exactly `true` is off. */
function readFlag(flags: CaptureFlags, stream: CaptureStream): boolean {
  const nested = flags.capture
  if (nested && typeof nested === 'object') {
    if ((nested as Record<string, unknown>)[stream] === true) return true
  }
  return flags[`capture.${stream}`] === true
}

/**
 * The fraction of a stream to keep.
 *
 * Per stream where the gateway says so, because clicks arrive at a rate
 * nothing else here approaches and holding them to the same fraction as page
 * loads would either flood the database or throw away most of the loads. A
 * bare number is still accepted and applies to everything.
 */
function readSampleRate(flags: CaptureFlags, stream?: CaptureStream): number {
  const raw = flags.sample_rate
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.min(1, Math.max(0, raw))
  }
  if (raw && typeof raw === 'object' && stream) {
    const value = (raw as Record<string, unknown>)[stream]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.min(1, Math.max(0, value))
    }
  }
  return DEFAULT_SAMPLE_RATE
}

function apply(flags: CaptureFlags | null): void {
  const next: Record<CaptureStream, boolean> = { ...OFF }
  // `collecting` is what the client endpoint calls it; `analytics_enabled` is
  // the service endpoint's name for the same fact. Neither being present means
  // an unrecognised body, and an unrecognised body captures nothing.
  const on = flags
    ? flags.collecting !== false && flags.analytics_enabled !== false
    : false
  if (flags && on) {
    next.errors = readFlag(flags, 'errors')
    next.interactions = readFlag(flags, 'interactions')
    next.vitals = readFlag(flags, 'vitals')
  }
  sampleRate = flags ? readSampleRate(flags, 'interactions') : DEFAULT_SAMPLE_RATE
  vitalsSampleRate = flags ? readSampleRate(flags, 'vitals') : DEFAULT_SAMPLE_RATE

  const changed = (Object.keys(next) as CaptureStream[]).some(key => next[key] !== enabled[key])
  enabled = next
  if (!changed) return
  for (const listener of listeners) {
    try {
      listener({ ...enabled })
    } catch {
      // A subscriber that throws must not stop the others being told, and
      // must certainly not bubble out of a timer callback.
    }
  }
}

/** Ask now. Never throws; a failure leaves everything off. */
export async function refreshCaptureFlags(): Promise<void> {
  if (inFlight) return
  inFlight = true
  try {
    apply(await rumApi.getFlags())
  } catch {
    apply(null)
  } finally {
    inFlight = false
  }
}

/**
 * Begin polling. Idempotent, and a no-op outside a browser.
 *
 * Also refreshes when the tab comes back to the foreground: a laptop that was
 * shut for an hour would otherwise act on an hour-old answer for up to the
 * poll interval, which is exactly the window in which someone has just turned
 * collection off.
 */
export function startCaptureFlags(): void {
  if (started || typeof window === 'undefined') return
  started = true
  void refreshCaptureFlags()
  timer = setInterval(() => {
    void refreshCaptureFlags()
  }, POLL_INTERVAL_MS)
  try {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void refreshCaptureFlags()
    })
  } catch {
    // No document, or a browser that refuses the listener. The timer stands.
  }
}

/** For tests and teardown; polling normally lives as long as the tab. */
export function stopCaptureFlags(): void {
  if (timer !== null) clearInterval(timer)
  timer = null
  started = false
  enabled = { ...OFF }
}

export function captureEnabled(stream: CaptureStream): boolean {
  return enabled[stream] === true
}

export function anyCaptureEnabled(): boolean {
  return enabled.errors || enabled.interactions || enabled.vitals
}

/**
 * The fraction of sessions the gateway wants for a high-volume stream.
 *
 * Defaults to the interaction rate, which is the one the callers without an
 * argument are asking about; vitals carry their own because they are an order
 * of magnitude rarer than clicks and rarely need thinning at all.
 */
export function captureSampleRate(stream: CaptureStream = 'interactions'): number {
  return stream === 'vitals' ? vitalsSampleRate : sampleRate
}

/** Called whenever a switch flips, so a stream can install itself late. */
export function onCaptureFlagsChange(listener: (state: Record<CaptureStream, boolean>) => void): void {
  listeners.add(listener)
}

export function useCaptureFlags() {
  return {
    start: startCaptureFlags,
    refresh: refreshCaptureFlags,
    enabled: captureEnabled,
    sampleRate: captureSampleRate,
    onChange: onCaptureFlagsChange
  }
}
