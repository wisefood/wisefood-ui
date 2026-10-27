import wisefoodRestApi from './wisefoodRestApi'

/**
 * User Consent API Service
 * Endpoints: /users/me/consent
 * Tracks the user's consent to service-provision data processing.
 */

/**
 * Bump this in one place when the privacy terms change.
 *
 * 2.0 is one consent for everything: running the service, naming the person
 * on their activity, and using their conversations — identifying details
 * removed — to test WiseFood. Everybody who accepted 1.0 is asked again,
 * because 1.0 never mentioned the third.
 */
export const CONSENT_VERSION = '2.0'
export const SERVICE_DATA_PROCESSING = 'service_data_processing'

export interface ConsentStatus {
  granted: boolean
  consent_type: string
  version: string | null
  granted_at: string | null
}

export interface ConsentReceipt {
  consent_type: string
  version: string
  granted_at: string
  ip_address: string
}

export interface AnalyticsConsentStatus {
  /** Whether this user's activity may be recorded under their name. */
  enabled: boolean
  /** False means they have never been asked, which is different from "no". */
  decided: boolean
  decided_at: string | null
  /** `opt_in` or `opt_out` — how the platform reads never having answered. */
  mode: string
}

/** One purpose of the consent, which can be withdrawn on its own. */
export interface ConsentPurposeStatus {
  enabled: boolean
  /** False means never answered, which is different from "no". */
  decided: boolean
  decided_at: string | null
}

/** Everything one person has agreed to, from `/users/me/consents`. */
export interface ConsentsStatus {
  current_version: string
  terms: {
    granted: boolean
    version: string | null
    granted_at: string | null
    /** The accepted terms cover everything asked today. */
    current: boolean
  }
  purposes: {
    analytics: ConsentPurposeStatus & { mode: string }
    /** `available` is false for a guest, whose data is promised to expire. */
    research: ConsentPurposeStatus & { available: boolean }
  }
}

export type ConsentPurpose = 'analytics' | 'research'

const isNotFound = (error: unknown) => (error as { status?: number } | null)?.status === 404

class ConsentApiService {
  /**
   * Get the current user's latest consent status for a consent type
   */
  async getConsent(consentType: string = SERVICE_DATA_PROCESSING): Promise<ConsentStatus> {
    return wisefoodRestApi.get<ConsentStatus>('/users/me/consent', {
      params: { consent_type: consentType }
    })
  }

  /**
   * Record the current user's consent for the given version
   */
  async recordConsent(
    consentType: string = SERVICE_DATA_PROCESSING,
    version: string = CONSENT_VERSION
  ): Promise<ConsentReceipt> {
    return wisefoodRestApi.post<ConsentReceipt>('/users/me/consent', {
      consent_type: consentType,
      version
    })
  }

  /**
   * Erase the signed-in account and everything hanging off it: the household
   * and its members, their profiles and memories, meal plans, favorites, saved
   * items and chat conversations. Irreversible.
   *
   * The consent ledger is deliberately retained — it records that a lawful
   * basis existed for processing that already happened, and it no longer
   * resolves to a person once the account is gone. `retained` names what
   * survived so the UI can tell the truth rather than promise a clean slate.
   */
  async deleteAccount(): Promise<AccountErasureReceipt> {
    return wisefoodRestApi.delete<AccountErasureReceipt>('/users/me')
  }

  /**
   * Whether this user's activity may be recorded under their name.
   *
   * Separate from service-provision consent: that one is about running the
   * service at all, this one is only about attaching an identity to usage
   * records. Declining still leaves the platform counting what happened — it
   * just stops recording who it was.
   */
  async getAnalyticsConsent(): Promise<AnalyticsConsentStatus> {
    return wisefoodRestApi.get<AnalyticsConsentStatus>('/users/me/analytics-consent')
  }

  /** Allow or withdraw. Takes effect on the next recorded action. */
  async setAnalyticsConsent(enabled: boolean): Promise<AnalyticsConsentStatus> {
    return wisefoodRestApi.put<AnalyticsConsentStatus>('/users/me/analytics-consent', {
      enabled,
      version: CONSENT_VERSION
    })
  }

  /**
   * Everything this person has agreed to, in one answer. Null from a gateway
   * older than the single consent, so the caller can fall back to asking the
   * two questions the old way.
   */
  async getConsents(): Promise<ConsentsStatus | null> {
    try {
      return await wisefoodRestApi.get<ConsentsStatus>('/users/me/consents')
    } catch (error) {
      if (isNotFound(error)) return null
      throw error
    }
  }

  /**
   * Accept the current terms, and with them every purpose they name, in one
   * call and one transaction. On a gateway older than the single consent the
   * two halves it knows about are recorded the old way; research is not,
   * because that gateway cannot store it.
   */
  async acceptAll(version: string = CONSENT_VERSION): Promise<ConsentsStatus | null> {
    try {
      return await wisefoodRestApi.post<ConsentsStatus>('/users/me/consents', { version })
    } catch (error) {
      if (!isNotFound(error)) throw error
      await this.recordConsent(SERVICE_DATA_PROCESSING, version)
      await this.setAnalyticsConsent(true)
      return null
    }
  }

  /** Withdraw, or give again, one purpose. Takes effect on the next action. */
  async setPurpose(purpose: ConsentPurpose, enabled: boolean): Promise<ConsentsStatus> {
    return wisefoodRestApi.put<ConsentsStatus>(`/users/me/consents/${purpose}`, {
      enabled,
      version: CONSENT_VERSION
    })
  }
}

export interface AccountErasureReceipt {
  erased: boolean
  households_deleted: number
  members_deleted: number
  chat_sessions_deleted: number
  retained: string[]
}

export default new ConsentApiService()
