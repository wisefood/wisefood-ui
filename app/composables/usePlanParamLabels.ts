import { useI18n } from 'vue-i18n'
import type { PlanParameter, PlanParameterCard, PlanParameterOption } from '~/services/foodchatApi'

/**
 * Names for the plan settings FoodChat sends with a plan, in the reader's
 * language, and the settings that are actually in force.
 *
 * "In force" is the card's `value`, never its `default`. FoodChat stores only
 * what the member applied; a setting they never touched is not applied at all
 * (no cooking-time ceiling, no goal), so showing the default as if it were
 * chosen would describe a plan that was not made.
 */
export function usePlanParamLabels() {
  const { t } = useI18n()

  function paramLabel(param: PlanParameter): string {
    const key = `foodChatHome.chat.planParams.params.${param.key}`
    const translated = t(key)
    return translated === key ? param.label : translated
  }

  /**
   * Scoped by parameter first, then the flat key, then what FoodChat sent. An
   * option value is only unique within its parameter: `off` is "Off" under
   * food waste and "All different" under repeat meals.
   */
  function optionLabel(param: PlanParameter, option: PlanParameterOption | string): string {
    const value = typeof option === 'string' ? option : option.value
    const fallback = typeof option === 'string'
      ? (param.options?.find(o => o.value === value)?.label ?? value)
      : option.label
    for (const key of [
      `foodChatHome.chat.planParams.options.${param.key}.${value}`,
      `foodChatHome.chat.planParams.options.${value}`
    ]) {
      const translated = t(key)
      if (translated !== key) return translated
    }
    return fallback
  }

  function param(card: PlanParameterCard | null | undefined, key: string): PlanParameter | undefined {
    return card?.parameters.find(p => p.key === key)
  }

  /** The member's own value for a setting, or undefined when they never set it. */
  function applied(card: PlanParameterCard | null | undefined, key: string): number | string | undefined {
    const value = param(card, key)?.value
    return value == null || value === '' ? undefined : value
  }

  /**
   * The settings in force, as short phrases for the "Built around" line.
   *
   * Values that constrain nothing are left out: "Any recipe" and food waste
   * "Off" are what a plan is without them.
   */
  function appliedPhrases(card: PlanParameterCard | null | undefined): Array<{ key: string, text: string }> {
    if (!card) return []
    const phrases: Array<{ key: string, text: string }> = []
    for (const p of card.parameters) {
      const value = applied(card, p.key)
      if (value === undefined) continue
      if (p.key === 'cooking_time') {
        phrases.push({ key: p.key, text: t('foodChatHome.builtAround.underMinutes', { minutes: value }) })
        continue
      }
      if (p.key === 'difficulty' && value !== 'easy') continue
      if (p.key === 'food_waste' && value === 'off') continue
      phrases.push({ key: p.key, text: optionLabel(p, String(value)) })
    }
    return phrases
  }

  return { paramLabel, optionLabel, param, applied, appliedPhrases }
}
