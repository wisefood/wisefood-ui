import { useI18n } from 'vue-i18n'
import type { ConstraintApplied } from '~/services/foodchatApi'
import { allergenLabel } from '~/utils/allergens'
import { capitalise } from '~/utils/planLedger'

/**
 * The rows under a plan, said in the reader's language.
 *
 * FoodChat writes each row's name and sentence in English and, beside them, a
 * code with the numbers in it (`name_code`/`name_params`, `code`/`params`).
 * The living labs read these in Hungarian and Slovenian, so the code wins
 * whenever this UI has words for it; a row without one, or with a code added
 * after this was written, falls back to FoodChat's English rather than to
 * nothing.
 */
export function useLedgerText() {
  const { t, te, locale } = useI18n()

  function list(values: readonly unknown[]): string {
    const items = values.map(v => String(v)).filter(Boolean)
    try {
      return new Intl.ListFormat(locale.value, { style: 'long', type: 'conjunction' }).format(items)
    } catch {
      return items.join(', ')
    }
  }

  /** A diet, nutrition claim or goal slug: "high_protein" -> "high protein". */
  function term(value: unknown): string {
    const slug = String(value ?? '').trim().toLowerCase()
    const key = `foodChatHome.ledger.terms.${slug}`
    return te(key) ? t(key) : String(value ?? '').replace(/[_-]+/g, ' ').trim()
  }

  function allergen(value: unknown): string {
    return allergenLabel(value, key => t(key), key => te(key)).toLowerCase()
  }

  /** Each parameter in words; lists joined the way this language joins them. */
  function words(params: Record<string, unknown> = {}): Record<string, string | number> {
    const out: Record<string, string | number> = {}
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        if (key === 'allergens') out[key] = list(value.map(allergen))
        else if (key === 'tags' || key === 'diets' || key === 'values') out[key] = list(value.map(term))
        else if (key === 'slots') out[key] = list(value.map(slot => slotName(String(slot))))
        else if (key === 'hits') {
          // A disliked food on a dish: the member's own word, not a slug.
          out[key] = list(value.map((hit: { dish?: string, dislike?: string }) =>
            `${hit.dish ?? ''} (${hit.dislike ?? ''})`))
        } else if (key === 'found') {
          out[key] = list(value.map((hit: { dish?: string, allergen?: string }) =>
            `${hit.dish ?? ''} (${allergen(hit.allergen)})`))
        } else out[key] = list(value)
      } else if (key === 'allergen' || key === 'backstop') {
        out[key] = allergen(value)
      } else if (key === 'diet' || key === 'goal') {
        out[key] = term(value)
      } else if (key === 'direction') {
        out[key] = t(`foodChatHome.ledger.direction.${value === 'over' ? 'over' : 'under'}`)
      } else if (typeof value === 'number' || typeof value === 'string') {
        out[key] = value
      }
    }
    if ('target' in params && 'own' in params) {
      out.against = t(
        params.own ? 'foodChatHome.ledger.against.own' : 'foodChatHome.ledger.against.reference',
        { target: params.target as number }
      )
    }
    return out
  }

  function slotName(slot: string): string {
    const key = `foodChatHome.meals.${slot}`
    return te(key) ? t(key).toLowerCase() : slot.replace(/_/g, ' ')
  }

  /** The row's name in this language, or null to use the caller's own. */
  function name(row: ConstraintApplied): string | null {
    if (!row.name_code) return null
    const key = `foodChatHome.ledger.name.${row.name_code}`
    if (!te(key)) return null
    return capitalise(t(key, words(row.name_params)))
  }

  /** The row's sentence in this language, else FoodChat's English. */
  function detail(row: ConstraintApplied): string {
    if (!row.code) return row.detail || ''
    const key = `foodChatHome.ledger.detail.${row.code}`
    if (!te(key)) return row.detail || ''
    const params = row.params ?? {}
    const parts = [t(key, words(params))]
    const more = Number(params.more ?? 0)
    if ((row.code === 'allergens.found' || row.code === 'dislikes.found') && more > 0) {
      parts.push(t('foodChatHome.ledger.andMore', { count: more }))
    }
    const heaviest = params.heaviest as { dish?: string, kcal?: number } | undefined
    if (heaviest?.dish) {
      parts.push(t('foodChatHome.ledger.heaviest', { dish: heaviest.dish, kcal: heaviest.kcal ?? '' }))
    }
    if (params.partial === true) parts.push(t('foodChatHome.ledger.floor'))
    return parts.join(' ')
  }

  /** A diet or nutrition tag said in the chat, as a chip: "High protein". */
  function tag(value: unknown): string {
    return capitalise(term(value))
  }

  return { name, detail, tag }
}
