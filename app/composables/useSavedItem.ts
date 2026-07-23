import { ref, computed, watch, type Ref } from 'vue'
import { useHouseholdStore } from '~/stores/household'
import memberSavedItemsApi, { type SavedItemType } from '~/services/memberSavedItemsApi'

/**
 * Save/unsave a single library item (recipe or literature) for the current
 * household member.
 *
 * The asset type is derived from the URN prefix — urn:article: / urn:guide: /
 * urn:textbook: — so any literature page can save its asset just by handing us
 * its urn. Recipes pass an explicit type since they use an opaque id, not a urn.
 *
 * Encapsulates: which types are saveable, the live "is it saved?" check, and an
 * optimistic toggle that reverts on failure. Shared by SaveToLibraryButton and
 * any page that wants the raw state.
 */

// urn segment -> saved item type. Recipes are handled via the explicit override.
const URN_TYPE_MAP: Record<string, SavedItemType> = {
  article: 'article',
  guide: 'guide',
  textbook: 'textbook'
}

export function useSavedItem(
  itemRef: Ref<string | undefined | null>,
  explicitType?: Ref<SavedItemType | undefined> | SavedItemType
) {
  const householdStore = useHouseholdStore()

  const resolvedType = computed<SavedItemType | null>(() => {
    const forced = typeof explicitType === 'string' ? explicitType : explicitType?.value
    if (forced) return forced
    const value = itemRef.value
    const segment = typeof value === 'string' ? value.split(':')[1] : undefined
    return (segment && URN_TYPE_MAP[segment]) || null
  })

  const isSaved = ref(false)
  const loading = ref(false)

  // Whether saving is even possible here: a saveable type and a selected member.
  const canSave = computed(
    () => !!resolvedType.value && !!itemRef.value && !!householdStore.currentMember
  )
  const savedItemType = resolvedType

  const refresh = async () => {
    const memberId = householdStore.currentMember?.id
    const type = resolvedType.value
    const ref_ = itemRef.value
    if (!memberId || !type || !ref_) {
      isSaved.value = false
      return
    }
    try {
      const items = await memberSavedItemsApi.listSavedItems(memberId, type)
      isSaved.value = items.some(i => i.item_ref === ref_)
    } catch (e) {
      console.error('[useSavedItem] Failed to check saved state:', e)
    }
  }

  const toggle = async () => {
    const memberId = householdStore.currentMember?.id
    const type = resolvedType.value
    const ref_ = itemRef.value
    if (!memberId || !type || !ref_) return

    loading.value = true
    const wasSaved = isSaved.value
    isSaved.value = !wasSaved // optimistic
    try {
      if (wasSaved) {
        await memberSavedItemsApi.removeSavedItem(memberId, type, ref_)
      } else {
        await memberSavedItemsApi.addSavedItem(memberId, type, ref_)
      }
    } catch (e) {
      console.error('[useSavedItem] Failed to toggle saved item:', e)
      isSaved.value = wasSaved // revert
    } finally {
      loading.value = false
    }
  }

  // Re-check whenever the asset or the selected member changes.
  watch(
    [itemRef, () => householdStore.currentMember?.id],
    () => { refresh() },
    { immediate: true }
  )

  return { isSaved, loading, canSave, savedItemType, toggle, refresh }
}
