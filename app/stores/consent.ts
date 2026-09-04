import { defineStore } from 'pinia'
import consentApi, { CONSENT_VERSION } from '~/services/consentApi'
import { useAuthStore } from '~/stores/auth'

interface ConsentState {
  /** true once the consent status is known (server or session cache) */
  loaded: boolean
  loading: boolean
  accepting: boolean
  /** version the user has granted, or null if never granted */
  grantedVersion: string | null
  /** user id the current state was loaded for (guards against user switches) */
  loadedForUserId: string | null
  /**
   * Whether this person has ever answered the analytics question.
   *
   * Distinct from "answered no". Somebody who accepted the banner before
   * analytics attribution was part of it has never been asked, and under
   * opt-in their activity is counted but never attributed — so the console
   * shows sessions beside zero named people. Asking them once fixes that.
   * Somebody who turned it off in their profile HAS answered, and asking
   * again would be nagging them out of a decision they made.
   */
  analyticsDecided: boolean
}

// sessionStorage cache so navigations within a session don't refetch or
// flicker the bar; keyed by user id + version so the server stays the
// source of truth on fresh sessions and after a version bump.
const storageKey = (userId: string, version: string) =>
  `wisefood_consent_${userId}_${version}`

export const useConsentStore = defineStore('consent', {
  state: (): ConsentState => ({
    loaded: false,
    loading: false,
    accepting: false,
    grantedVersion: null,
    loadedForUserId: null,
    // Assumed answered until we learn otherwise, so a failed lookup never
    // produces a banner somebody has already dealt with.
    analyticsDecided: true
  }),

  getters: {
    /**
     * Show the consent bar.
     *
     * Two reasons: the current terms are not granted, or the terms are granted
     * but the analytics question has never been put to this person — which is
     * everybody who accepted before attribution was part of the banner.
     */
    needsConsent: state => state.loaded
      && (state.grantedVersion !== CONSENT_VERSION || !state.analyticsDecided)
  },

  actions: {
    /**
     * Load the consent status for the current user (once per user/session).
     * Safe to call repeatedly; only fetches when the state is stale.
     */
    async initialize() {
      const authStore = useAuthStore()
      const userId = authStore.user?.id
      if (!authStore.isAuthenticated || !userId) return
      if (this.loading) return
      if (this.loaded && this.loadedForUserId === userId) return

      // Fast path: already accepted this version earlier in this session
      // The session cache covers the terms only. It deliberately does not
      // short-circuit the analytics check: the cache was written before that
      // question existed, so trusting it here would hide the bar from exactly
      // the people who still need to see it.
      const cachedTerms = import.meta.client
        && window.sessionStorage.getItem(storageKey(userId, CONSENT_VERSION)) === 'granted'

      this.loading = true
      try {
        if (cachedTerms) {
          this.grantedVersion = CONSENT_VERSION
        } else {
          const status = await consentApi.getConsent()
          this.grantedVersion = status.granted ? status.version : null
          if (import.meta.client && status.granted && status.version === CONSENT_VERSION) {
            window.sessionStorage.setItem(storageKey(userId, CONSENT_VERSION), 'granted')
          }
        }

        // Only under opt-in. Under opt-out an unanswered question already
        // means "attribute me", so there is nothing to ask about.
        try {
          const analytics = await consentApi.getAnalyticsConsent()
          this.analyticsDecided = analytics.mode !== 'opt_in' || analytics.decided
        } catch {
          // Unreachable or not deployed: assume answered rather than show a
          // banner we cannot resolve.
          this.analyticsDecided = true
        }

        this.loaded = true
        this.loadedForUserId = userId
      } catch (err) {
        // Keep loaded=false: on transient errors we hide the bar rather than
        // nag a user who may already have consented.
        console.error('[ConsentStore] Failed to load consent status:', err)
      } finally {
        this.loading = false
      }
    },

    /**
     * Record consent for the current version and hide the bar.
     */
    async accept() {
      if (this.accepting) return
      const authStore = useAuthStore()
      const userId = authStore.user?.id

      this.accepting = true
      try {
        await consentApi.recordConsent()
        this.grantedVersion = CONSENT_VERSION
        this.loaded = true

        /*
         * Accepting here also turns analytics attribution on.
         *
         * The platform reads silence as "do not name me" (opt-in), so without
         * this every per-person view stays empty however many people accept
         * the banner — the console shows healthy session counts beside zero
         * identified users, which reads as a fault rather than as a setting.
         *
         * It is a second, separate purpose, so the banner says so rather than
         * folding it in quietly, and the profile toggle remains the way to
         * withdraw it on its own. Recorded after the primary consent and
         * never allowed to fail the accept: a person who clicked Accept has
         * consented whether or not this second call succeeded, and blocking
         * the banner on it would leave them unable to use the site.
         */
        try {
          await consentApi.setAnalyticsConsent(true)
          this.analyticsDecided = true
        } catch (err) {
          // Left undecided on failure, so the question is put again next time
          // rather than silently lost.
          console.warn('[ConsentStore] Analytics consent not recorded:', err)
        }
        if (userId) {
          this.loadedForUserId = userId
          if (import.meta.client) {
            window.sessionStorage.setItem(storageKey(userId, CONSENT_VERSION), 'granted')
          }
        }
      } catch (err) {
        console.error('[ConsentStore] Failed to record consent:', err)
        throw err
      } finally {
        this.accepting = false
      }
    },

    reset() {
      this.loaded = false
      this.loading = false
      this.accepting = false
      this.grantedVersion = null
      this.loadedForUserId = null
    }
  }
})
