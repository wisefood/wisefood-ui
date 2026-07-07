import wisefoodRestApi from './wisefoodRestApi'

/**
 * User Consent API Service
 * Endpoints: /users/me/consent
 * Tracks the user's consent to service-provision data processing.
 */

/** Bump this in one place when the privacy terms change. */
export const CONSENT_VERSION = '1.0'
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
}

export default new ConsentApiService()
