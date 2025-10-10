import { defineStore } from 'pinia'
import { getUserHousehold, type Household, type HouseholdMember } from '@/services/householdService'

interface SessionState {
  initialized: boolean
  initializing: boolean
  household: Household | null
  activeMemberId: string | null
}

export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    initialized: false,
    initializing: false,
    household: null,
    activeMemberId: null,
  }),

  getters: {
    householdName: (state): string | null => state.household?.name ?? null,
    members: (state): HouseholdMember[] => state.household?.members ?? [],
    activeMember: (state): HouseholdMember | null => {
      if (!state.household || !state.activeMemberId) return null
      return state.household.members.find(member => member.id === state.activeMemberId) ?? null
    },
  },

  actions: {
    async initialize(force = false) {
      if (this.initializing) return
      if (this.initialized && !force) return

      this.initializing = true

      try {
        const household = await getUserHousehold()
        this.household = household
        if (!this.activeMemberId && household.members?.length) {
          this.activeMemberId = household.members[0].id
        }
        this.initialized = true
      } catch (error) {
        console.error('Failed to initialize session store:', error)
        throw error
      } finally {
        this.initializing = false
      }
    },

    setActiveMember(memberId: string) {
      if (!this.household) return

      const exists = this.household.members.some(member => member.id === memberId)
      if (exists) {
        this.activeMemberId = memberId
      } else {
        console.warn(`Session store: member ${memberId} not found in household`)
      }
    },

    clear() {
      this.initialized = false
      this.initializing = false
      this.household = null
      this.activeMemberId = null
    },
  },
})
