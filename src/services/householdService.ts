import { api } from '@/lib/api'

const PATH = '/households'

export type Household = {
  id: string
  name: string
  owner_id: string
  region: string
  member_count: number
  created_at: string
  updated_at: string
  metadata: {
    primary_goal: string
    allergies_present: boolean
    preferred_cuisine: string
    meal_plan_start_date: string
  }
  members: HouseholdMember[]
}

export type HouseholdMember = {
  id: string
  name: string
  email?: string
  role?: string
  created_at?: string
  updated_at?: string
}

/**
 * All functions accept an optional AbortSignal to allow the caller
 * (component/composable) to cancel the request on unmount.
 */

export async function getUserHousehold(signal?: AbortSignal) {
  return api.get<Household>(`${PATH}/me`, { signal })
}

export async function getHouseholdMembers(household_id: string, signal?: AbortSignal) {
  const id = encodeURIComponent(household_id)
  return api.get<HouseholdMember[]>(`${PATH}/${id}/members`, { signal })
}

export async function getHouseholdMember(household_id: string, member_id: string, signal?: AbortSignal) {
  const hid = encodeURIComponent(household_id)
  const mid = encodeURIComponent(member_id)
  return api.get<HouseholdMember>(`${PATH}/${hid}/members/${mid}`, { signal })
}

export type CreateHouseholdPayload = {
  name: string
  region: string
  member_count?: number
  metadata?: Record<string, unknown>
  members?: Array<{
    name: string
    age_group: string
    image_url?: string
    profile?: {
      nutritional_preferences?: Record<string, unknown>
      dietary_groups?: string[]
    }
  }>
}

/**
 * Create a new household record for the current user (POST /households)
 */
export async function createHousehold(payload: CreateHouseholdPayload, signal?: AbortSignal) {
  return api.post<Household>(PATH, payload, { signal })
}

export type CreateHouseholdMemberPayload = {
  name: string
  age_group: string
  image_url?: string
  profile: {
    nutritional_preferences: Record<string, unknown>
    dietary_groups: string[]
  }
}

export async function createHouseholdMember(household_id: string, payload: CreateHouseholdMemberPayload, signal?: AbortSignal) {
  const id = encodeURIComponent(household_id)
  return api.post<HouseholdMember>(`${PATH}/${id}/members`, payload, { signal })
}
