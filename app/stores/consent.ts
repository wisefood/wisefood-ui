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
   *
   * Only read on a gateway older than the single consent; the current one
   * answers with the terms version alone, which already covers this.
   */
  analyticsDecided: boolean
  /**
   * Whether the gateway knows the single consent. Off on an older gateway,
   * which cannot store research consent, so the banner does not ask for it.
   */
  unified: boolean
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
    analyticsDecided: true,
    unified: true
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
        // The single consent: one answer says which terms were accepted, and
        // the version alone decides whether to ask — 2.0 covers every purpose.
        const all = cachedTerms ? null : await consentApi.getConsents()
        if (all) {
          this.unified = true
          this.grantedVersion = all.terms.current ? CONSENT_VERSION : all.terms.version
          this.analyticsDecided = true
          if (import.meta.client && all.terms.current) {
            window.sessionStorage.setItem(storageKey(userId, CONSENT_VERSION), 'granted')
          }
          this.loaded = true
          this.loadedForUserId = userId
          return
        }

        if (cachedTerms) {
          this.grantedVersion = CONSENT_VERSION
        } else {
          // A gateway older than the single consent.
          this.unified = false
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
     * Accept the current terms — every purpose they name — and hide the bar.
     *
     * One call and one transaction on the gateway: the terms, activity
     * attribution and research use are recorded together, so the ledger never
     * shows a person who accepted the text and only part of what it said. A
     * guest's acceptance leaves research out, and the banner they saw did not
     * mention it. Each purpose is withdrawn on its own from the profile.
     */
    async accept() {
      if (this.accepting) return
      const authStore = useAuthStore()
      const userId = authStore.user?.id

      this.accepting = true
      try {
        await consentApi.acceptAll(CONSENT_VERSION)
        this.grantedVersion = CONSENT_VERSION
        this.analyticsDecided = true
        this.loaded = true
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
