import wisefoodRestApi from './wisefoodRestApi'
import type { MealPlan, MealRecipe } from './foodchatApi'

export interface StoreMemberMealPlanRequest {
  date: string
  applies_to_member_ids: string[]
  meal_plan: MealPlan
  foodchat_response?: Record<string, unknown>
}

export type MemberMealPlanResponse = Record<string, unknown> | string | null

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

const asString = (value: unknown): string | undefined => {
  return typeof value === 'string' ? value : undefined
}

const unwrapResultRecord = (value: unknown): Record<string, unknown> | null => {
  const record = asRecord(value)
  if (!record) return null

  const nestedResult = asRecord(record.result)
  if (nestedResult) return nestedResult

  return record
}

const normalizeRecipe = (value: unknown): MealRecipe | undefined => {
  const record = asRecord(value)
  if (!record) return undefined

  const recipeId = asString(record.recipe_id)
  const title = asString(record.title)
  const ingredients = asString(record.ingredients)
  const directions = asString(record.directions)

  if (!recipeId && !title && !ingredients && !directions) return undefined

  return {
    recipe_id: recipeId || '',
    title: title || '',
    ingredients: ingredients || '',
    directions: directions || ''
  }
}

export const normalizeMealPlan = (value: unknown): MealPlan | null => {
  const record = asRecord(value)
  if (!record) return null

  const mealPlanId = asString(record.id) || asString(record.meal_plan_id) || 'member-meal-plan'
  const createdAt = asString(record.created_at) || new Date().toISOString()
  const breakfast = normalizeRecipe(record.breakfast)
  const lunch = normalizeRecipe(record.lunch)
  const dinner = normalizeRecipe(record.dinner)
  const reasoning = asString(record.reasoning)

  if (!breakfast && !lunch && !dinner && !reasoning) return null

  return {
    id: mealPlanId,
    created_at: createdAt,
    breakfast,
    lunch,
    dinner,
    reasoning
  }
}

export const extractMealPlanFromMemberMealPlanResponse = (value: unknown): MealPlan | null => {
  const record = unwrapResultRecord(value)
  if (!record) return null

  const nestedMealPlan = normalizeMealPlan(record.meal_plan)
  if (nestedMealPlan) return nestedMealPlan

  return normalizeMealPlan(record)
}

export const extractStoredMealPlanIdFromMemberMealPlanResponse = (value: unknown): string | null => {
  const record = unwrapResultRecord(value)
  if (!record) return null

  const nestedMealPlan = asRecord(record.meal_plan)

  return asString(record.id)
    || asString(record.meal_plan_id)
    || asString(nestedMealPlan?.id)
    || asString(nestedMealPlan?.meal_plan_id)
    || null
}

export const extractSourceMealPlanIdFromMemberMealPlanResponse = (value: unknown): string | null => {
  const record = unwrapResultRecord(value)
  if (!record) return null

  const nestedMealPlan = asRecord(record.meal_plan)

  return asString(record.source_meal_plan_id)
    || asString(nestedMealPlan?.source_meal_plan_id)
    || null
}

class MemberMealPlansApiService {
  async storeMealPlan(memberId: string, data: StoreMemberMealPlanRequest): Promise<MemberMealPlanResponse> {
    return wisefoodRestApi.post<MemberMealPlanResponse, StoreMemberMealPlanRequest>(
      `/members/${memberId}/meal-plans`,
      data
    )
  }

  async getMealPlan(memberId: string, date?: string): Promise<MemberMealPlanResponse> {
    return wisefoodRestApi.get<MemberMealPlanResponse>(`/members/${memberId}/meal-plans`, {
      params: {
        date
      }
    })
  }

  async revokeMealPlan(
    memberId: string,
    mealPlanId: string,
    revokeForAllMembers: boolean = false
  ): Promise<MemberMealPlanResponse> {
    return wisefoodRestApi.delete<MemberMealPlanResponse>(`/members/${memberId}/meal-plans/${mealPlanId}`, {
      params: {
        revoke_for_all_members: revokeForAllMembers
      }
    })
  }
}

export default new MemberMealPlansApiService()
