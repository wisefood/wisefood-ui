import wisefoodRestApi from './wisefoodRestApi'

/**
 * Member Recipe Favorites API Service
 * Endpoints: /members/{member_id}/favorites
 * Favorites are stored per household member (profiles are per-member).
 */
export interface MemberFavorite {
  recipe_id: string
  created_at: string
}

export interface RemoveFavoriteResult {
  deleted: boolean
}

class MemberFavoritesApiService {
  /**
   * List a member's favorite recipes (newest first)
   */
  async listFavorites(memberId: string): Promise<MemberFavorite[]> {
    const result = await wisefoodRestApi.get<MemberFavorite[]>(`/members/${memberId}/favorites`)
    return Array.isArray(result) ? result : []
  }

  /**
   * Add a recipe to a member's favorites (idempotent)
   */
  async addFavorite(memberId: string, recipeId: string): Promise<MemberFavorite> {
    return wisefoodRestApi.put<MemberFavorite>(
      `/members/${memberId}/favorites/${encodeURIComponent(recipeId)}`
    )
  }

  /**
   * Remove a recipe from a member's favorites (idempotent)
   */
  async removeFavorite(memberId: string, recipeId: string): Promise<RemoveFavoriteResult> {
    return wisefoodRestApi.delete<RemoveFavoriteResult>(
      `/members/${memberId}/favorites/${encodeURIComponent(recipeId)}`
    )
  }
}

export default new MemberFavoritesApiService()
