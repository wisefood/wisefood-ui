/**
 * The rows under a plan, sorted by what they are to the person eating it.
 *
 * FoodChat sends one list, `constraints_applied`, and three different things
 * arrive in it:
 *
 *   rule       something from a profile or the conversation: an allergy, a
 *              diet, a dislike, a goal. What the plan is built AROUND.
 *   check      a measurement taken on the finished plan ("measured on the
 *              plan"): did the calories land, are the dishes tagged high
 *              protein. Its name is a backend word ("claims"); its `detail` is
 *              the sentence a person can read.
 *   guideline  a rule from the member's dietary guidelines.
 *
 * The canvas showed all three as one row of chips, so a red "claims" sat
 * beside "omnivore" with nothing to say what either meant. Sorting them is
 * what lets the plan say what it is built around in one line, raise only what
 * was not met, and fold the rest into "Why this plan".
 */

import type { ConstraintApplied } from '~/services/foodchatApi'

export type LedgerGroup = 'rule' | 'check' | 'guideline'

export function isGuidelineRow(row: ConstraintApplied): boolean {
  if (row.kind) return row.kind === 'guideline'
  return row.type === 'soft' && /guid/i.test(row.source || '')
}

/** The verifier's rows say where they came from in their source. */
export function isCheckRow(row: ConstraintApplied): boolean {
  return /measured/i.test(row.source || '')
}

export function ledgerGroup(row: ConstraintApplied): LedgerGroup {
  if (isGuidelineRow(row)) return 'guideline'
  if (isCheckRow(row)) return 'check'
  return 'rule'
}

export function rowsOf(rows: ConstraintApplied[] | null | undefined, group: LedgerGroup): ConstraintApplied[] {
  return (rows ?? []).filter(row => ledgerGroup(row) === group)
}

/** Not met, or only partly: the two states worth raising above the meals. */
export function isUnmet(row: ConstraintApplied): boolean {
  return row.status === 'violated' || row.status === 'relaxed'
}

/**
 * The i18n key under `foodChatHome.why.checks` for a verifier row.
 *
 * The verifier names its checks in the backend's words; these are the ones it
 * writes today. A name it adds later has no key and falls back to the row's
 * own text, capitalised, which is no worse than before.
 */
const CHECK_KEYS: Record<string, string> = {
  'allergens': 'allergens',
  'diet': 'diet',
  'claims': 'claims',
  'calories': 'calories',
  'cooking time': 'cookingTime',
  'nutri-score': 'nutriScore',
  'pantry': 'pantry',
  'your picks': 'picks',
  'taste preferences': 'tastes'
}

export function checkKey(name: string): string | null {
  const normalised = String(name || '').trim().toLowerCase()
  // Measured against a population reference rather than the member's own
  // target, and named for the number ("a 2000 kcal daily reference").
  if (/kcal daily reference/.test(normalised)) return 'calorieReference'
  return CHECK_KEYS[normalised] ?? null
}

/** Rule sources FoodChat writes, mapped to `foodChatHome.why.sources`. */
const SOURCE_KEYS: Record<string, string> = {
  'dietary group': 'diet',
  'allergy': 'allergy',
  'preferences': 'dislikes',
  'your feedback': 'feedback',
  'your goal': 'goal',
  'goal': 'goal',
  'household': 'household'
}

export function sourceKey(source: string | null | undefined): string | null {
  return SOURCE_KEYS[String(source || '').trim().toLowerCase()] ?? null
}

/** "avoiding mushrooms" -> "Avoiding mushrooms". */
export function capitalise(text: string): string {
  const value = String(text || '').replace(/[_]+/g, ' ').trim()
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : ''
}

/**
 * The rules worth naming in the "Built around" line.
 *
 * `unsupported` rows are left out: a rule FoodChat could not apply is not
 * something the plan was built around, and saying so is the job of "Why this
 * plan". The goal rows are left out when the member set a goal for this
 * session, because the line already names that one.
 */
export function builtAroundRules(
  rows: ConstraintApplied[] | null | undefined,
  options: { sessionGoalSet?: boolean } = {}
): ConstraintApplied[] {
  return rowsOf(rows, 'rule').filter((row) => {
    if (row.status === 'unsupported') return false
    if (options.sessionGoalSet && sourceKey(row.source) === 'goal') return false
    return true
  })
}
