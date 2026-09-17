import wisefoodRestApi from './wisefoodRestApi'
import { getWisefoodRestApiUrl } from '~/utils/runtimeConfig'

/**
 * Keeping a guest account, and sharing what it made.
 *
 * Endpoints: /users/me/claim, /shares, /shares/public/{token}
 *
 * `readShare` is the odd one: it is the only call in this app that must work
 * with no token at all, because the person opening a shared link has no
 * account. It therefore goes through a plain `fetch` rather than the shared
 * client, which attaches Authorization and signs the user out on a 401.
 */

export interface ClaimResult {
  user_id: string
  email: string
  email_verified: boolean
  /** Whether Keycloak accepted the job of sending the verification mail. */
  verification_sent: boolean
}

export interface ShareSummary {
  token: string
  kind: string
  title: string | null
  created_at: string | null
  expires_at: string | null
  revoked: boolean
  /** Neither revoked nor past its expiry — the only state that still opens. */
  live: boolean
  view_count: number
  last_viewed_at: string | null
}

export interface SharedDish {
  recipe_id?: string
  title?: string
  ingredients?: string
  directions?: string
  role?: string | null
  nutrition?: Record<string, unknown> | null
  image_url?: string | null
}

export interface SharedPlan {
  kind: string
  title: string | null
  created_at: string | null
  payload: {
    date?: string
    /** A slot holds one dish, or several — main, side, dessert. */
    meals?: Record<string, SharedDish | SharedDish[]>
    /** A weekly share carries days instead; each holds the same slot map. */
    days?: Array<{
      day: number
      summary?: string
      meals: Record<string, SharedDish | SharedDish[]>
    }>
  }
}

const unwrap = <T>(payload: unknown, fallback: T): T => {
  const envelope = payload as { result?: unknown } | null
  return ((envelope?.result ?? payload) ?? fallback) as T
}

/** The message a failed call should show, rather than "Request failed". */
export const failureText = (error: unknown, fallback: string): string => {
  const detail = (error as { data?: { error?: { detail?: string } } })?.data?.error?.detail
  return detail || fallback
}

class SharingApiService {
  /**
   * Turn the current guest session into a permanent account.
   *
   * Nothing moves server-side, so there is nothing to reload afterwards
   * except the identity itself — the caller refreshes the token to pick up
   * the dropped `guest` role.
   */
  async claimAccount(body: {
    email: string
    password: string
    first_name?: string
    last_name?: string
  }): Promise<ClaimResult> {
    return unwrap<ClaimResult>(
      await wisefoodRestApi.post<unknown>('/users/me/claim', body),
      {} as ClaimResult
    )
  }

  async createShare(body: {
    kind: 'meal_plan' | 'saved_meal_plan' | 'weekly_meal_plan'
    id: string
    /** Required for a weekly plan: it lives in FoodChat and is reachable
     *  only as a given member's current plan. */
    member_id?: string
    title?: string
    expires_in_days?: number | null
  }): Promise<{ token: string, title: string | null, expires_at: string | null }> {
    return unwrap(
      await wisefoodRestApi.post<unknown>('/shares', body),
      { token: '', title: null, expires_at: null }
    )
  }

  async listShares(): Promise<ShareSummary[]> {
    try {
      const payload = await wisefoodRestApi.get<unknown>('/shares')
      return unwrap<{ shares: ShareSummary[] }>(payload, { shares: [] }).shares ?? []
    } catch {
      return []
    }
  }

  async revokeShare(token: string): Promise<boolean> {
    try {
      await wisefoodRestApi.delete(`/shares/${encodeURIComponent(token)}`)
      return true
    } catch {
      return false
    }
  }

  async emailShare(token: string, to?: string): Promise<{ sent: boolean, to: string }> {
    return unwrap(
      await wisefoodRestApi.post<unknown>(
        `/shares/${encodeURIComponent(token)}/email`,
        { to: to || null }
      ),
      { sent: false, to: '' }
    )
  }

  /**
   * Read a shared plan with no account.
   *
   * Returns null for unknown, revoked and expired alike — the server does not
   * distinguish them on purpose, so neither does this.
   */
  async readShare(token: string): Promise<SharedPlan | null> {
    try {
      const response = await fetch(
        `${getWisefoodRestApiUrl()}/shares/public/${encodeURIComponent(token)}`,
        { headers: { Accept: 'application/json' }, referrerPolicy: 'no-referrer' }
      )
      if (!response.ok) return null
      const body = await response.json() as { result?: SharedPlan }
      return body?.result ?? null
    } catch {
      return null
    }
  }

  /** Where a share is read. Used for the copy-link button and the email body. */
  shareUrl(token: string): string {
    if (typeof window === 'undefined') return `/shared/${token}`
    return `${window.location.origin}${useRuntimeConfig().app.baseURL}shared/${token}`
      .replace(/([^:]\/)\/+/g, '$1')
  }
}

export const sharingApi = new SharingApiService()
export default sharingApi
