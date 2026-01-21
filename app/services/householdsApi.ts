import wisefoodRestApi from './wisefoodRestApi'

// Types for Household API
export interface Household {
  id: string
  name: string
  region?: string
  metadata?: Record<string, unknown>
  owner_id?: string
  created_at?: string
  updated_at?: string
}

export interface HouseholdMember {
  id: string
  name: string
  age_group?: 'child' | 'teen' | 'adult' | 'senior'
  image_url?: string
  household_id: string
  created_at?: string
  updated_at?: string
}

export interface MemberProfile {
  nutritional_preferences?: Record<string, unknown>
  dietary_groups?: ('omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'flexitarian')[]
  properties?: Record<string, unknown>
}

export interface HouseholdMemberWithProfile extends HouseholdMember {
  profile?: MemberProfile
}

export interface CreateHouseholdRequest {
  name: string
  region?: string
  metadata?: Record<string, unknown>
}

export interface CreateMemberRequest {
  name: string
  age_group?: 'child' | 'teen' | 'adult' | 'senior'
  image_url?: string
  household_id: string
  profile?: MemberProfile
}

export interface UpdateMemberRequest {
  name?: string
  age_group?: 'child' | 'teen' | 'adult' | 'senior'
  image_url?: string
}

// API Response wrappers
export interface ApiResponse<T> {
  success: boolean
  result?: T
  error?: {
    title: string
    detail: string
    code: string
  }
}

class HouseholdsApiService {
  // Household operations
  async getMyHousehold(): Promise<ApiResponse<Household>> {
    try {
      const result = await wisefoodRestApi.get<Household>('/households/me')
      return { success: true, result }
    } catch (error: unknown) {
      const apiError = error as { data?: ApiResponse<never> }
      if (apiError.data?.error?.code === 'resource/not_found') {
        return { success: false, error: apiError.data.error }
      }
      throw error
    }
  }

  async createHousehold(data: CreateHouseholdRequest): Promise<ApiResponse<Household>> {
    const result = await wisefoodRestApi.post<Household, CreateHouseholdRequest>('/households', data)
    return { success: true, result }
  }

  async getHousehold(householdId: string): Promise<ApiResponse<Household>> {
    const result = await wisefoodRestApi.get<Household>(`/households/${householdId}`)
    return { success: true, result }
  }

  async updateHousehold(householdId: string, data: Partial<CreateHouseholdRequest>): Promise<ApiResponse<Household>> {
    const result = await wisefoodRestApi.patch<Household, Partial<CreateHouseholdRequest>>(`/households/${householdId}`, data)
    return { success: true, result }
  }

  async deleteHousehold(householdId: string): Promise<ApiResponse<void>> {
    await wisefoodRestApi.delete(`/households/${householdId}`)
    return { success: true }
  }

  // Member operations (via /members - requires household_id)
  async getMembers(householdId: string): Promise<ApiResponse<HouseholdMember[]>> {
    const result = await wisefoodRestApi.get<HouseholdMember[]>('/members', {
      params: { household_id: householdId }
    })
    return { success: true, result }
  }

  async createMember(data: CreateMemberRequest): Promise<ApiResponse<HouseholdMember>> {
    const result = await wisefoodRestApi.post<HouseholdMember, CreateMemberRequest>('/members', data)
    return { success: true, result }
  }

  async getMember(memberId: string): Promise<ApiResponse<HouseholdMember>> {
    const result = await wisefoodRestApi.get<HouseholdMember>(`/members/${memberId}`)
    return { success: true, result }
  }

  async updateMember(memberId: string, data: UpdateMemberRequest): Promise<ApiResponse<HouseholdMember>> {
    const result = await wisefoodRestApi.patch<HouseholdMember, UpdateMemberRequest>(`/members/${memberId}`, data)
    return { success: true, result }
  }

  async deleteMember(memberId: string): Promise<ApiResponse<void>> {
    await wisefoodRestApi.delete(`/members/${memberId}`)
    return { success: true }
  }

  // Member profile operations
  async getMemberProfile(memberId: string): Promise<ApiResponse<MemberProfile>> {
    const result = await wisefoodRestApi.get<MemberProfile>(`/members/${memberId}/profile`)
    return { success: true, result }
  }

  async updateMemberProfile(memberId: string, data: MemberProfile): Promise<ApiResponse<MemberProfile>> {
    const result = await wisefoodRestApi.patch<MemberProfile, MemberProfile>(`/members/${memberId}/profile`, data)
    return { success: true, result }
  }

  async deleteMemberProfile(memberId: string): Promise<ApiResponse<void>> {
    await wisefoodRestApi.delete(`/members/${memberId}/profile`)
    return { success: true }
  }

  // Household-scoped member operations (alternative endpoints)
  async getHouseholdMembers(householdId: string): Promise<ApiResponse<HouseholdMember[]>> {
    const result = await wisefoodRestApi.get<HouseholdMember[]>(`/households/${householdId}/members`)
    return { success: true, result }
  }

  async addHouseholdMember(householdId: string, data: Omit<CreateMemberRequest, 'household_id'>): Promise<ApiResponse<HouseholdMember>> {
    const result = await wisefoodRestApi.post<HouseholdMember, Omit<CreateMemberRequest, 'household_id'>>(`/households/${householdId}/members`, data)
    return { success: true, result }
  }
}

export default new HouseholdsApiService()
