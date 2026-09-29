/**
 * A message a person can act on, from whatever an API client threw.
 *
 * The REST clients throw a plain `{ message, status, data }` object, not an
 * `Error`, so the idiom on every console page —
 * `caught instanceof Error ? caught.message : fallback` — shows the fallback
 * for every server rejection. A 422 that named the two missing fields reached
 * the editor as "Could not create that collection."; the fields it named were
 * in the network tab.
 *
 * The catalog's envelope is `{ error: { detail, errors: [{ loc, msg }] } }`.
 * A validation error is reported field by field; anything else falls back to
 * its `detail`, then to the thrown message, then to the caller's fallback.
 */
export function apiErrorMessage(caught: unknown, fallback: string): string {
  if (typeof caught === 'string') return caught.trim() || fallback
  if (caught instanceof Error) return caught.message.trim() || fallback
  if (!caught || typeof caught !== 'object') return fallback

  const thrown = caught as { message?: unknown, data?: unknown }
  const envelope = asRecord(thrown.data)?.['error']
  const error = asRecord(envelope)

  const fieldErrors = Array.isArray(error?.['errors']) ? error['errors'] as unknown[] : []
  const lines = fieldErrors.flatMap((item) => {
    const entry = asRecord(item)
    const msg = entry?.['msg']
    if (typeof msg !== 'string') return []
    const loc = Array.isArray(entry?.['loc']) ? entry['loc'] as unknown[] : []
    // `body.urn` is where the API looked; `urn` is what the editor calls it.
    const path = loc.filter(part => part !== 'body' && part !== 'query').join('.')
    return [path ? `${path}: ${msg}` : msg]
  })
  if (lines.length) return lines.join(' · ')

  const detail = error?.['detail']
  if (typeof detail === 'string' && detail.trim()) return detail
  if (typeof thrown.message === 'string' && thrown.message.trim()) return thrown.message
  return fallback
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}
