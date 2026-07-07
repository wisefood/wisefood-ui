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
    loadedForUserId: null
  }),

  getters: {
    /** Show the consent bar: status is known and the current version isn't granted */
    needsConsent: (state) => state.loaded && state.grantedVersion !== CONSENT_VERSION
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
      if (
        import.meta.client
        && window.sessionStorage.getItem(storageKey(userId, CONSENT_VERSION)) === 'granted'
      ) {
        this.grantedVersion = CONSENT_VERSION
        this.loaded = true
        this.loadedForUserId = userId
        return
      }

      this.loading = true
      try {
        const status = await consentApi.getConsent()
        this.grantedVersion = status.granted ? status.version : null
        this.loaded = true
        this.loadedForUserId = userId
        if (import.meta.client && status.granted && status.version === CONSENT_VERSION) {
          window.sessionStorage.setItem(storageKey(userId, CONSENT_VERSION), 'granted')
        }
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
