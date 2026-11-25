import type { RecipeAdaptation, RecipeAdaptationSwap } from '~/services/recipeApi'
import type { AdaptedRecipePayload } from '~/services/memberAdaptedRecipesApi'
import { getNutriScoreGrade } from '~/utils/nutriScore'

/** `Nutriscore_A` to `A`; anything else passes through, empty becomes ''. */
export const formatAdaptGrade = (raw?: string | null): string =>
  String(raw || '').replace('Nutriscore_', '')

const firstSwap = (adaptation: RecipeAdaptation): RecipeAdaptationSwap | null => {
  const swap = adaptation.swap
  if (Array.isArray(swap)) return swap[0] ?? null
  return swap ?? null
}

/** Only a result that found a change can be saved. */
export const canSaveAdaptation = (adaptation: RecipeAdaptation | null | undefined): boolean =>
  adaptation?.status === 'adapted' && Boolean(adaptation.adapted?.lines?.length)

/** Saved title: the adapted title when the mode renamed the dish, else "<title> (adapted)". */
export const adaptedRecipeTitle = (
  adaptation: RecipeAdaptation,
  baseTitle: string,
  adaptedSuffix: string
): string => {
  const adaptedTitle = String(adaptation.adapted?.title || '').trim()
  const originalTitle = String(adaptation.original?.title || baseTitle || '').trim()
  if (adaptedTitle && adaptedTitle !== originalTitle) return adaptedTitle
  return `${baseTitle} ${adaptedSuffix}`
}

export interface AdaptedRecipeBase {
  title: string
  image_url?: string | null
  nutri_score_label: string | null
}

/**
 * The payload `memberAdaptedRecipesApi.saveAdaptedRecipe` stores for one
 * adaptation. FoodChat only overlays a non-empty `nutrition`, so it carries the
 * new grade for the nutrition mode and nothing for the others.
 */
export const buildAdaptedRecipePayload = (
  adaptation: RecipeAdaptation,
  context: { region: string, base: AdaptedRecipeBase }
): AdaptedRecipePayload => {
  const swap = firstSwap(adaptation)
  const pair = adaptation.benefit?.swap?.[0]
  const grade = getNutriScoreGrade(adaptation.benefit?.metric?.grade_after)
  return {
    mode: adaptation.mode,
    action: swap?.operation,
    original_ingredient: pair?.from || swap?.source_line,
    substitute_ingredient: pair?.to || swap?.candidate_label || null,
    ingredients: (adaptation.adapted?.lines ?? []).map(line => ({ name: line, measurement: '' })),
    nutrition: adaptation.mode === 'nutrition' && grade ? { nutri_score_label: grade } : {},
    region: context.region,
    suggestion: { headline: adaptation.benefit?.tip || '', reason: '' },
    base: context.base
  }
}
