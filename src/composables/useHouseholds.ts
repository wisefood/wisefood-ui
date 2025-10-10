import { ref, onMounted, onBeforeUnmount, watch, unref, type Ref } from 'vue'
import type { Household, HouseholdMember } from '@/services/householdService'
import { getUserHousehold, getHouseholdMembers, getHouseholdMember } from '@/services/householdService'

/**
 * Generic options for the composables below.
 */
export type UseRequestOptions = {
  /**
   * Run the request automatically on mount / when inputs become available.
   * @default true
   */
  immediate?: boolean
}

/** Common state shape for all composables */
export type UseRequestState<T> = {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<unknown | null>
  /** Trigger the request again, canceling any in-flight one */
  refresh: () => Promise<void>
  /** Abort the current in-flight request (if any) */
  abort: () => void
}

function createAbortableFetcher<T>(
  doFetch: (signal: AbortSignal) => Promise<T>
): UseRequestState<T> {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<unknown | null>(null)

  let controller: AbortController | null = null

  const abort = () => {
    if (controller) {
      controller.abort()
      controller = null
    }
  }

  const refresh = async () => {
    abort()
    controller = new AbortController()
    loading.value = true
    error.value = null
    try {
      const result = await doFetch(controller.signal)
      data.value = result
    } catch (e: any) {
      // Ignore AbortError; surface other errors
      if (e?.name !== 'AbortError') error.value = e
    } finally {
      loading.value = false
    }
  }

  onBeforeUnmount(abort)

  return { data, loading, error, refresh, abort }
}

/**
 * Fetch the current user's household (GET /households/me)
 */
export function useUserHousehold(options: UseRequestOptions = {}): UseRequestState<Household> {
  const state = createAbortableFetcher<Household>((signal) => getUserHousehold(signal))

  onMounted(() => {
    if (options.immediate !== false) state.refresh()
  })

  return state
}

/**
 * Fetch members of a household (GET /households/:id/members)
 *
 * @param householdId A string or a Ref<string | undefined>. When it changes, the list is re-fetched.
 */
export function useHouseholdMembers(
  householdId: string | Ref<string | undefined>,
  options: UseRequestOptions = {}
): UseRequestState<HouseholdMember[]> {
  const state = createAbortableFetcher<HouseholdMember[]>((signal) => {
    const id = unref(householdId)
    if (!id) return Promise.resolve([])
    return getHouseholdMembers(id, signal)
  })

  const maybeFetch = () => {
    if (options.immediate !== false && unref(householdId)) state.refresh()
  }

  onMounted(maybeFetch)

  watch(
    () => unref(householdId),
    (val, oldVal) => {
      if (val !== oldVal) state.refresh()
    }
  )

  return state
}

/**
 * Fetch a single household member (GET /households/:hid/members/:mid)
 *
 * @param householdId A string or Ref<string | undefined>
 * @param memberId A string or Ref<string | undefined>
 */
export function useHouseholdMember(
  householdId: string | Ref<string | undefined>,
  memberId: string | Ref<string | undefined>,
  options: UseRequestOptions = {}
): UseRequestState<HouseholdMember> {
  const state = createAbortableFetcher<HouseholdMember>((signal) => {
    const hid = unref(householdId)
    const mid = unref(memberId)
    if (!hid || !mid) return Promise.reject(new Error('householdId and memberId are required'))
    return getHouseholdMember(hid, mid, signal)
  })

  const maybeFetch = () => {
    if (options.immediate !== false && unref(householdId) && unref(memberId)) state.refresh()
  }

  onMounted(maybeFetch)

  watch([() => unref(householdId), () => unref(memberId)], () => {
    // Only refresh when both are available
    if (unref(householdId) && unref(memberId)) state.refresh()
  })

  return state
}

/**
 * Convenience aggregator to access all three in one place.
 */
export function useHouseholds() {
  return {
    useUserHousehold,
    useHouseholdMembers,
    useHouseholdMember,
  }
}
