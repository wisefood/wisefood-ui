import { ref, watch, type Ref } from 'vue'

/**
 * The reporting period a page opens on, and where it goes when you leave.
 *
 * Six pages defaulted to seven days and three to thirty, so flipping between
 * them changed the window without anybody noticing — a number read on one page
 * could not be compared with the next. The fix is not one hard-coded default
 * for everything: it is remembering the choice. A range picked on any page is
 * the range the next page opens on, until it is changed again.
 *
 * Precedence: the URL (a link somebody sent wins), then the remembered choice,
 * then the page's own default.
 */
export interface Range {
  days: number
  since?: string
  until?: string
}

const STORAGE_KEY = 'wisefood-insights-range'

function remembered(): Range | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Range
    return typeof parsed.days === 'number' ? parsed : null
  } catch {
    return null
  }
}

function remember(range: Range) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(range))
  } catch {
    // A private window or a blocked store: the choice simply is not kept.
  }
}

export function useInsightsRange(defaultDays = 7): Ref<Range> {
  const route = useRoute()
  const router = useRouter()

  const fromUrl: Range | null = route.query.days || route.query.since || route.query.until
    ? {
        days: Number(route.query.days) || defaultDays,
        since: typeof route.query.since === 'string' ? route.query.since : undefined,
        until: typeof route.query.until === 'string' ? route.query.until : undefined
      }
    : null

  const range = ref<Range>(fromUrl ?? remembered() ?? { days: defaultDays })

  watch(range, (next) => {
    remember(next)
    // Mirror into the URL so the view stays linkable. Other query params on
    // the page (filters, paths) are left alone.
    const query = { ...route.query }
    delete query.days
    delete query.since
    delete query.until
    if (next.since || next.until) {
      if (next.since) query.since = next.since
      if (next.until) query.until = next.until
    } else if (next.days !== defaultDays) {
      query.days = String(next.days)
    }
    void router.replace({ query })
  }, { deep: true })

  return range
}
