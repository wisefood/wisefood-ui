import wisefoodRestApi from './wisefoodRestApi'
import type { RecipeIngredient } from './recipeApi'

/**
 * Member Adapted Recipes API Service
 * Endpoints: /members/{member_id}/adapted-recipes[/{recipe_id}]
 *
 * A member's personal adapted version of a recipe (ingredient swap or reduced
 * quantity, produced by the recipe adaptation endpoints). One adaptation per
 * (member, recipe) — saving again replaces it. Strictly owner-scoped on the
 * server; FoodChat uses these as the starting point instead of the originals.
 */

/** Nutrition summary in the shape FoodChat meal cards consume. */
export interface AdaptedRecipeNutrition {
  kcal?: number | null
  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null
  nutri_score_label?: string | null
}

export interface AdaptedRecipePayload {
  mode?: string
  action?: 'swap' | 'reduce'
  original_ingredient?: string
  substitute_ingredient?: string | null
  reduction_pct?: number | null
  /** Full adapted ingredient list (swap/reduce applied). */
  ingredients: RecipeIngredient[]
  nutrition?: AdaptedRecipeNutrition
  /** Free-form context: applied suggestion, simulation result, base image. */
  [key: string]: unknown
}

export interface MemberAdaptedRecipe {
  recipe_id: string
  title: string | null
  payload: AdaptedRecipePayload
  created_at: string
  updated_at: string
}

export interface RemoveAdaptedRecipeResult {
  deleted: boolean
}

class MemberAdaptedRecipesApiService {
  /**
   * List a member's adapted recipes (most recently updated first)
   */
  async listAdaptedRecipes(memberId: string): Promise<MemberAdaptedRecipe[]> {
    const result = await wisefoodRestApi.get<MemberAdaptedRecipe[]>(`/members/${memberId}/adapted-recipes`)
    return Array.isArray(result) ? result : []
  }

  /**
   * Get a member's adaptation of one recipe. Throws (404) when none is saved.
   */
  async getAdaptedRecipe(memberId: string, recipeId: string): Promise<MemberAdaptedRecipe> {
    return wisefoodRestApi.get<MemberAdaptedRecipe>(
      `/members/${memberId}/adapted-recipes/${encodeURIComponent(recipeId)}`
    )
  }

  /**
   * Save (or replace) a member's adapted version of a recipe
   */
  async saveAdaptedRecipe(
    memberId: string,
    recipeId: string,
    title: string | null,
    payload: AdaptedRecipePayload
  ): Promise<MemberAdaptedRecipe> {
    return wisefoodRestApi.put<MemberAdaptedRecipe>(
      `/members/${memberId}/adapted-recipes/${encodeURIComponent(recipeId)}`,
      { title, payload }
    )
  }

  /**
   * Remove a member's adaptation of a recipe (idempotent)
   */
  async removeAdaptedRecipe(memberId: string, recipeId: string): Promise<RemoveAdaptedRecipeResult> {
    return wisefoodRestApi.delete<RemoveAdaptedRecipeResult>(
      `/members/${memberId}/adapted-recipes/${encodeURIComponent(recipeId)}`
    )
  }
}

export default new MemberAdaptedRecipesApiService()
