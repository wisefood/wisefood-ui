import wisefoodRestApi from './wisefoodRestApi'

/**
 * Member Saved Items (Library) API Service
 * Endpoints: /members/{member_id}/saved-items
 *
 * The typed library. Recipe favourites still have their own dedicated client
 * (memberFavoritesApi) preserving the legacy contract; this covers the other
 * asset types — articles, guides, textbooks — that a member can save.
 */
export type SavedItemType = 'recipe' | 'article' | 'guide' | 'textbook'

export interface MemberSavedItem {
  item_type: SavedItemType
  item_ref: string
  created_at: string
}

interface SavedItemListEnvelope {
  member_id: string
  count: number
  saved_items: MemberSavedItem[]
}

export interface RemoveSavedItemResult {
  deleted: boolean
}

class MemberSavedItemsApiService {
  /**
   * List a member's saved items (newest first), optionally filtered by type.
   */
  async listSavedItems(
    memberId: string,
    itemType?: SavedItemType
  ): Promise<MemberSavedItem[]> {
    const query = itemType ? `?item_type=${encodeURIComponent(itemType)}` : ''
    const result = await wisefoodRestApi.get<SavedItemListEnvelope>(
      `/members/${memberId}/saved-items${query}`
    )
    return result?.saved_items ?? []
  }

  /**
   * Save an item to a member's library (idempotent). item_ref is an opaque
   * recipe id or a urn:<type>:<slug>; it is path-encoded so URNs survive.
   */
  async addSavedItem(
    memberId: string,
    itemType: SavedItemType,
    itemRef: string
  ): Promise<MemberSavedItem> {
    return wisefoodRestApi.put<MemberSavedItem>(
      `/members/${memberId}/saved-items/${encodeURIComponent(itemType)}/${encodeURIComponent(itemRef)}`
    )
  }

  /**
   * Remove an item from a member's library (idempotent).
   */
  async removeSavedItem(
    memberId: string,
    itemType: SavedItemType,
    itemRef: string
  ): Promise<RemoveSavedItemResult> {
    return wisefoodRestApi.delete<RemoveSavedItemResult>(
      `/members/${memberId}/saved-items/${encodeURIComponent(itemType)}/${encodeURIComponent(itemRef)}`
    )
  }
}

export default new MemberSavedItemsApiService()
