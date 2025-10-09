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
  return api.get<{ result: Household }>(`${PATH}/me`, { signal }).then(res => res.result)
}

export async function getHouseholdMembers(household_id: string, signal?: AbortSignal) {
  const id = encodeURIComponent(household_id)
  return api.get<{ result: HouseholdMember[] }>(`${PATH}/${id}/members`, { signal }).then(res => res.result)
}

export async function getHouseholdMember(household_id: string, member_id: string, signal?: AbortSignal) {
  const hid = encodeURIComponent(household_id)
  const mid = encodeURIComponent(member_id)
  return api.get<{ result: HouseholdMember }>(`${PATH}/${hid}/members/${mid}`, { signal }).then(res => res.result)
}