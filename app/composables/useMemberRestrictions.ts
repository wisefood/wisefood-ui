import { useHouseholdStore } from '~/stores/household'
import { normalizeAllergens } from '~/utils/allergens'

export type AdaptationDiet = 'vegan' | 'vegetarian' | 'pescatarian'

export interface MemberRestrictions {
  allergens: string[]
  diet: AdaptationDiet | null
}

const NONE: MemberRestrictions = { allergens: [], diet: null }

// Most restrictive first; omnivore and flexitarian restrict nothing.
const DIET_ORDER: AdaptationDiet[] = ['vegan', 'vegetarian', 'pescatarian']

// Per member, for the page's lifetime: a profile edit made elsewhere shows up
// on the next full load, which is soon enough for a suggestion.
const cache = new Map<string, MemberRestrictions>()

/**
 * The current member's allergies and diet, in the shape the adaptation route
 * takes. Best-effort: no member, or a profile that will not load, means no
 * restrictions rather than a blocked suggestion.
 */
export function useMemberRestrictions() {
  const householdStore = useHouseholdStore()

  const loadRestrictions = async (): Promise<MemberRestrictions> => {
    const memberId = householdStore.currentMember?.id
    if (!memberId) return NONE
    const hit = cache.get(memberId)
    if (hit) return hit
    try {
      const profile = await householdStore.getMemberProfile(memberId)
      const groups = (Array.isArray(profile?.dietary_groups) ? profile.dietary_groups : []) as string[]
      const restrictions: MemberRestrictions = {
        allergens: normalizeAllergens(Array.isArray(profile?.allergies) ? profile.allergies : []),
        diet: DIET_ORDER.find(diet => groups.includes(diet)) ?? null
      }
      cache.set(memberId, restrictions)
      return restrictions
    } catch {
      return NONE
    }
  }

  return { loadRestrictions }
}
