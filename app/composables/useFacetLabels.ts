import { useI18n } from 'vue-i18n'
import { capitalise } from '~/utils/planLedger'

/**
 * A taste facet ("mediterranean", "light", "poultry") in the interface language.
 *
 * FoodChat sends facets as the recipe corpus's own vocabulary codes (its
 * `/vocabularies`: cuisines, moods, flavour profiles, food groups), and the
 * chips showed them capitalised, so a Hungarian plan was "built around"
 * Fehérjedús, Mediterranean, Light and Meat. A value the locale files do not
 * know yet still shows, capitalised, rather than disappearing.
 */
export function useFacetLabels() {
  const { t, te } = useI18n()
  function label(value: unknown): string {
    const code = String(value ?? '').trim()
    const key = `foodChatHome.facets.${code.toLowerCase()}`
    return code && te(key) ? t(key) : capitalise(code)
  }
  return { label }
}
