/**
 * The sessions the list was showing, so a session page can step to the next.
 *
 * Reviewing is reading one session after another from a filtered list — "the
 * ones rated down this week" — and going back to the list between each one
 * lost the place and the filters. The list writes its rows here in order; the
 * session page reads them for previous / next and for the way back.
 *
 * Shared state for navigation inside the app, mirrored to sessionStorage so a
 * reload of a session page keeps its neighbours. Storage can throw (private
 * windows, blocked site data); the page then simply has no neighbours.
 */

interface Trail {
  ids: string[]
  /** The list's own query, so "Back to the list" returns to the same filters. */
  query: Record<string, string>
}

const STORAGE_KEY = 'wf-insights-session-trail'

function readStored(): Trail {
  if (import.meta.server) return { ids: [], query: {} }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed && Array.isArray(parsed.ids)) {
      return { ids: parsed.ids.filter((id: unknown) => typeof id === 'string'), query: parsed.query ?? {} }
    }
  } catch { /* no neighbours, then */ }
  return { ids: [], query: {} }
}

export function useSessionTrail() {
  const trail = useState<Trail>('insights-session-trail', readStored)

  function remember(ids: string[], query: Record<string, string>) {
    trail.value = { ids: [...ids], query: { ...query } }
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trail.value))
    } catch { /* kept for this tab's navigation only */ }
  }

  function neighbours(sessionId: string) {
    const ids = trail.value.ids
    const index = ids.indexOf(sessionId)
    return {
      position: index >= 0 ? index + 1 : null,
      total: ids.length,
      previous: index > 0 ? ids[index - 1] : null,
      next: index >= 0 && index < ids.length - 1 ? ids[index + 1] : null
    }
  }

  return { trail, remember, neighbours }
}
