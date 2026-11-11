/**
 * "Check a claim" inside FoodScholar's Q&A.
 *
 * A claim is sent with `intent: 'claim_check'` and FoodScholar returns its
 * verdict as `claim_verdict` on the result. Should an answer still open with
 * a "VERDICT:" line (an older FoodScholar, or a model that ignored the
 * instruction), splitVerdict reads it and keeps it out of the shown text.
 */

export type ClaimVerdict = 'supported' | 'partly' | 'not_supported' | 'unclear'

/** The short lists under FoodScholar's question box. */
export type ComposerTool = 'claim' | 'everyday'

const VERDICT_LINE = /^[\s>*_#-]*verdict\s*[:\-–]?\s*\**\s*([a-z _-]+)/i

function verdictFromWord(raw: string): ClaimVerdict | null {
  const v = raw.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (v.startsWith('not_supported') || v.startsWith('myth') || v.startsWith('false')) return 'not_supported'
  if (v.startsWith('partly') || v.startsWith('partially') || v.startsWith('mixed')) return 'partly'
  if (v.startsWith('unclear') || v.startsWith('not_enough') || v.startsWith('insufficient')) return 'unclear'
  if (v.startsWith('supported') || v.startsWith('true') || v.startsWith('fact')) return 'supported'
  return null
}

/** Split a (possibly still streaming) answer into its verdict and the rest. */
export function splitVerdict(text: string): { verdict: ClaimVerdict | null, body: string } {
  if (!text) return { verdict: null, body: '' }
  const lines = text.split('\n')
  // The verdict is asked for on the first line; allow a blank line or a
  // heading before it, but never search the whole answer.
  for (let i = 0; i < Math.min(lines.length, 3); i++) {
    const line = lines[i] ?? ''
    if (!line.trim()) continue
    const match = line.match(VERDICT_LINE)
    if (match) {
      const body = [...lines.slice(0, i), ...lines.slice(i + 1)].join('\n').replace(/^\s+/, '')
      return { verdict: verdictFromWord(match[1] ?? ''), body }
    }
    // Mid-stream the line may not have reached "verdict:" yet.
    if (i === lines.length - 1 && /^[\s>*_#-]*v(e(r(d(i(ct?)?)?)?)?)?$/i.test(line)) {
      return { verdict: null, body: '' }
    }
    break
  }
  return { verdict: null, body: text }
}

/** A backend verdict, when the result carries one (future `claim_verdict`). */
export function verdictFromResult(result: unknown): ClaimVerdict | null {
  const raw = (result as { claim_verdict?: { verdict?: unknown } | string | null } | null)?.claim_verdict
  const word = typeof raw === 'string' ? raw : raw?.verdict
  return typeof word === 'string' ? verdictFromWord(word) : null
}

export const VERDICT_STYLE: Record<ClaimVerdict, { icon: string, row: string, iconClass: string }> = {
  supported: {
    icon: 'i-lucide-circle-check-big',
    row: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100',
    iconClass: 'text-emerald-600 dark:text-emerald-400'
  },
  partly: {
    icon: 'i-lucide-circle-slash',
    row: 'bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100',
    iconClass: 'text-amber-600 dark:text-amber-400'
  },
  not_supported: {
    icon: 'i-lucide-circle-x',
    row: 'bg-rose-50 text-rose-900 dark:bg-rose-900/20 dark:text-rose-100',
    iconClass: 'text-rose-600 dark:text-rose-400'
  },
  unclear: {
    icon: 'i-lucide-circle-help',
    row: 'bg-sky-50 text-sky-900 dark:bg-sky-900/20 dark:text-sky-100',
    iconClass: 'text-sky-600 dark:text-sky-400'
  }
}

/** How the sources split: guidelines, studies in people, in animals or cells. */
export function sourceMix(sources: Array<{ source_type?: string | null, is_human_evidence?: boolean | null }> | null | undefined) {
  const list = sources ?? []
  let guidelines = 0
  let people = 0
  let lab = 0
  for (const s of list) {
    if (s.source_type === 'guideline' || s.source_type === 'guide') guidelines++
    else if (s.is_human_evidence === true) people++
    else if (s.is_human_evidence === false) lab++
  }
  return { total: list.length, guidelines, people, lab }
}
