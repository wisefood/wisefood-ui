/**
 * The buffer every capture stream sits behind.
 *
 * Three rules, all of them about never being the reason a page is slow or
 * broken, and all of them borrowed from `useTelemetry` because they were right
 * there too: recording does no I/O, a failed send is dropped rather than
 * retried, and the queue is bounded so a page in a loop cannot grow it without
 * limit.
 *
 * One timer and one pair of unload listeners are shared by every stream. Three
 * separate 5-second timers would wake the tab three times as often and post
 * three requests where one round of them will do.
 */

export interface RumStream<T> {
  /** Buffer one event. Returns immediately, never throws. */
  push: (event: T) => void
  /** Send what is buffered. Never throws. */
  flush: (options?: { keepalive?: boolean }) => Promise<void>
  /** How many events the cap has thrown away over the life of the page. */
  dropped: () => number
  size: () => number
}

interface StreamOptions<T> {
  /** Hard cap on the buffer. Past this the oldest event goes. */
  limit: number
  /** Send early once this many are waiting. */
  flushAt: number
  /** Events per request. The gateway refuses a bigger batch, so the remainder
   *  stays queued for the next flush rather than being thrown away. */
  batchMax?: number
  send: (events: T[], options: { keepalive: boolean }) => Promise<boolean>
  /** Run before every flush — a stream with a half-finished event (a click
   *  cluster still gathering, a scroll depth not yet final) uses this to close
   *  it out rather than lose it on the way off the page. */
  beforeFlush?: () => void
}

const FLUSH_INTERVAL_MS = 5000
/** Matches the gateway's own cap on an ingest batch. */
const DEFAULT_BATCH_MAX = 50

const registry: Array<(options?: { keepalive?: boolean }) => Promise<void>> = []
let timer: ReturnType<typeof setTimeout> | null = null
let unloadInstalled = false

function schedule(): void {
  if (timer !== null || typeof window === 'undefined') return
  timer = setTimeout(() => {
    timer = null
    void flushAllStreams()
  }, FLUSH_INTERVAL_MS)
}

/** Flush every stream that has something waiting. Never throws. */
export async function flushAllStreams(options: { keepalive?: boolean } = {}): Promise<void> {
  await Promise.all(registry.map(async (flush) => {
    try {
      await flush(options)
    } catch {
      // A stream's own flush already swallows everything; this is the belt
      // for the braces, because these run from a page-lifecycle listener.
    }
  }))
}

/**
 * Flush on the way out, once per page lifetime.
 *
 * `visibilitychange` to hidden is the reliable one — on mobile a tab is very
 * often never "unloaded" at all, it is backgrounded and then killed. `pagehide`
 * covers the desktop close and the back/forward cache.
 */
export function installRumUnloadFlush(): void {
  if (unloadInstalled || typeof document === 'undefined') return
  unloadInstalled = true
  try {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void flushAllStreams({ keepalive: true })
    })
    window.addEventListener('pagehide', () => {
      void flushAllStreams({ keepalive: true })
    })
  } catch {
    // Nothing to do: the timer still flushes while the page is alive.
  }
}

export function createRumStream<T>(options: StreamOptions<T>): RumStream<T> {
  const queue: T[] = []
  let drops = 0
  let sending = false

  const flush = async ({ keepalive = false } = {}): Promise<void> => {
    try {
      options.beforeFlush?.()
    } catch {
      // A stream that cannot close out its pending event still sends the rest.
    }
    if (!queue.length || sending) return
    const batch = queue.splice(0, options.batchMax ?? DEFAULT_BATCH_MAX)
    sending = true
    try {
      await options.send(batch, { keepalive })
    } catch {
      // Dropped, not requeued. See the header.
    } finally {
      sending = false
    }
    // More than one batch is waiting. On the way out there is no time for a
    // second request, so the rest goes; while the page is alive it does not.
    if (queue.length && !keepalive) schedule()
  }

  const stream: RumStream<T> = {
    push(event: T) {
      try {
        if (queue.length >= options.limit) {
          queue.shift()
          drops += 1
        }
        queue.push(event)
        if (queue.length >= options.flushAt) {
          void flush()
        } else {
          schedule()
        }
      } catch {
        // Capture must never surface as a broken interaction.
      }
    },
    flush,
    dropped: () => drops,
    size: () => queue.length
  }

  registry.push(flush)
  return stream
}
