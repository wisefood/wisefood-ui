import { defineStore } from 'pinia'
import householdsApi, {
  type Household,
  type HouseholdMember,
  type CreateHouseholdRequest,
  type CreateMemberRequest,
  type UpdateMemberRequest,
  type MemberProfile
} from '~/services/householdsApi'

interface HouseholdState {
  household: Household | null
  members: HouseholdMember[]
  selectedMember: HouseholdMember | null
  loading: boolean
  error: string | null
  initialized: boolean
  hasHousehold: boolean | null  // null = not checked yet, false = no household, true = has household
  setupSkipped: boolean  // Track if user skipped household setup
}

const SELECTED_MEMBER_KEY = 'wisefood_selected_member_id'
const SETUP_SKIPPED_KEY = 'wisefood_household_setup_skipped'

export const useHouseholdStore = defineStore('household', {
  state: (): HouseholdState => ({
    household: null,
    members: [],
    selectedMember: null,
    loading: false,
    error: null,
    initialized: false,
    hasHousehold: null,
    setupSkipped: false
  }),

  getters: {
    currentHousehold: (state) => state.household,
    householdMembers: (state) => state.members,
    currentMember: (state) => state.selectedMember,
    isLoading: (state) => state.loading,
    hasError: (state) => !!state.error,
    needsHouseholdSetup: (state) => state.hasHousehold === false && !state.setupSkipped,
    needsProfileSelection: (state) => state.hasHousehold === true && !state.selectedMember && state.members.length > 0
  },

  actions: {
    async initialize() {
      if (this.initialized) return

      // Check if setup was previously skipped
      if (import.meta.client) {
        this.setupSkipped = localStorage.getItem(SETUP_SKIPPED_KEY) === 'true'
      }

      await this.fetchHousehold()
      this.initialized = true
    },

    async fetchHousehold() {
      this.loading = true
      this.error = null

      try {
        const response = await householdsApi.getMyHousehold()

        if (response.success && response.result) {
          this.household = response.result
          this.hasHousehold = true
          // Also fetch members
          await this.fetchMembers()
          // Restore selected member from localStorage
          this.restoreSelectedMember()
        } else if (response.error?.code === 'resource/not_found') {
          this.household = null
          this.hasHousehold = false
          this.members = []
        }
      } catch (err) {
        console.error('[HouseholdStore] Failed to fetch household:', err)
        this.error = 'Failed to load household data'
        this.hasHousehold = false
      } finally {
        this.loading = false
      }
    },

    async fetchMembers() {
      if (!this.household?.id) return

      try {
        const response = await householdsApi.getMembers(this.household.id)
        if (response.success && response.result) {
          this.members = response.result
        }
      } catch (err) {
        console.error('[HouseholdStore] Failed to fetch members:', err)
      }
    },

    async createHousehold(data: CreateHouseholdRequest) {
      this.loading = true
      this.error = null

      try {
        const response = await householdsApi.createHousehold(data)
        console.log('[HouseholdStore] Create household response:', response)
        if (response.success && response.result) {
          this.household = response.result
          console.log('[HouseholdStore] Household set with id:', this.household.id)
          this.hasHousehold = true
          this.setupSkipped = false
          if (import.meta.client) {
            localStorage.removeItem(SETUP_SKIPPED_KEY)
          }
          return response.result
        }
      } catch (err) {
        console.error('[HouseholdStore] Failed to create household:', err)
        this.error = 'Failed to create household'
        throw err
      } finally {
        this.loading = false
      }
    },

    async createMember(data: Omit<CreateMemberRequest, 'household_id'>) {
      if (!this.household) {
        throw new Error('No household exists')
      }

      if (!this.household.id) {
        console.error('[HouseholdStore] Household exists but has no id:', this.household)
        throw new Error('Household has no id')
      }

      this.loading = true
      this.error = null

      try {
        const fullData: CreateMemberRequest = {
          ...data,
          household_id: this.household.id
        }
        console.log('[HouseholdStore] Creating member with data:', fullData)
        const response = await householdsApi.createMember(fullData)
        if (response.success && response.result) {
          this.members.push(response.result)
          return response.result
        }
      } catch (err) {
        console.error('[HouseholdStore] Failed to create member:', err)
        this.error = 'Failed to create member'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateMember(memberId: string, data: UpdateMemberRequest) {
      this.loading = true
      this.error = null

      try {
        const response = await householdsApi.updateMember(memberId, data)
        if (response.success && response.result) {
          const index = this.members.findIndex(m => m.id === memberId)
          if (index !== -1) {
            this.members[index] = response.result
          }
          if (this.selectedMember?.id === memberId) {
            this.selectedMember = response.result
          }
          return response.result
        }
      } catch (err) {
        console.error('[HouseholdStore] Failed to update member:', err)
        this.error = 'Failed to update member'
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteMember(memberId: string) {
      this.loading = true
      this.error = null

      try {
        await householdsApi.deleteMember(memberId)
        this.members = this.members.filter(m => m.id !== memberId)
        if (this.selectedMember?.id === memberId) {
          this.selectedMember = null
          if (import.meta.client) {
            localStorage.removeItem(SELECTED_MEMBER_KEY)
          }
        }
      } catch (err) {
        console.error('[HouseholdStore] Failed to delete member:', err)
        this.error = 'Failed to delete member'
        throw err
      } finally {
        this.loading = false
      }
    },

    async getMemberProfile(memberId: string) {
      this.loading = true
      this.error = null

      try {
        const response = await householdsApi.getMemberProfile(memberId)
        if (response.success) {
          return response.result
        }
      } catch (err) {
        console.error('[HouseholdStore] Failed to get member profile:', err)
        this.error = 'Failed to load profile'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateMemberProfile(memberId: string, profile: MemberProfile) {
      this.loading = true
      this.error = null

      try {
        const response = await householdsApi.updateMemberProfile(memberId, profile)
        if (response.success) {
          return response.result
        }
      } catch (err) {
        console.error('[HouseholdStore] Failed to update member profile:', err)
        this.error = 'Failed to update profile'
        throw err
      } finally {
        this.loading = false
      }
    },

    selectMember(member: HouseholdMember) {
      this.selectedMember = member
      if (import.meta.client) {
        localStorage.setItem(SELECTED_MEMBER_KEY, member.id)
      }
    },

    restoreSelectedMember() {
      if (!import.meta.client) return

      const savedMemberId = localStorage.getItem(SELECTED_MEMBER_KEY)
      if (savedMemberId && this.members.length > 0) {
        const member = this.members.find(m => m.id === savedMemberId)
        if (member) {
          this.selectedMember = member
        }
      }
    },

    clearSelectedMember() {
      this.selectedMember = null
      if (import.meta.client) {
        localStorage.removeItem(SELECTED_MEMBER_KEY)
      }
    },

    skipSetup() {
      this.setupSkipped = true
      if (import.meta.client) {
        localStorage.setItem(SETUP_SKIPPED_KEY, 'true')
      }
    },

    resetSkip() {
      this.setupSkipped = false
      if (import.meta.client) {
        localStorage.removeItem(SETUP_SKIPPED_KEY)
      }
    },

    reset() {
      this.household = null
      this.members = []
      this.selectedMember = null
      this.loading = false
      this.error = null
      this.initialized = false
      this.hasHousehold = null
      this.setupSkipped = false
      if (import.meta.client) {
        localStorage.removeItem(SELECTED_MEMBER_KEY)
        localStorage.removeItem(SETUP_SKIPPED_KEY)
      }
    }
  }
})
