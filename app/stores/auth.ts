import { defineStore } from 'pinia'
import KeycloakAuthService from '~/services/keycloak'

interface User {
  id?: string
  username?: string
  email?: string
  given_name?: string
  family_name?: string
  name?: string
  roles: string[]
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  initialized: boolean
  initPromise: Promise<boolean> | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isAuthenticated: false,
    user: null,
    initialized: false,
    initPromise: null,
  }),

  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated,
    hasRole: (state) => (role: string) => state.user?.roles.includes(role) ?? false,
  },

  actions: {
    async initialize(forceRecheck = false) {
      // If there's already an initialization in progress, wait for it
      if (this.initPromise && !forceRecheck) {
        console.log('[AuthStore] Initialization already in progress, waiting...')
        return this.initPromise
      }

      // If already initialized and authenticated, we can skip re-initialization
      // UNLESS we're forcing a recheck
      if (this.initialized && this.isAuthenticated && !forceRecheck) {
        console.log('[AuthStore] Already initialized and authenticated:', this.user?.username)
        return this.isAuthenticated
      }

      // If initialized but NOT authenticated, don't skip - we should recheck
      // because the user might have logged in on another tab
      console.log('[AuthStore] Initializing auth store (initialized:', this.initialized, ', authenticated:', this.isAuthenticated, ')')

      // Create and store the initialization promise
      this.initPromise = (async () => {
        try {
          const authenticated = await KeycloakAuthService.init()
          if (authenticated) {
            this.isAuthenticated = true
            this.user = KeycloakAuthService.getUserInfo() ?? { roles: [] }
            console.log('[AuthStore] User authenticated:', this.user?.username)
            await this.refreshToken()
          } else {
            this.isAuthenticated = false
            this.user = null
            console.log('[AuthStore] User not authenticated')
          }
          this.initialized = true
          this.initPromise = null  // Clear the promise once done
          return authenticated
        } catch (err) {
          console.error('[AuthStore] Initialization failed:', err)
          this.isAuthenticated = false
          this.user = null
          this.initialized = true
          this.initPromise = null  // Clear the promise on error
          return false
        }
      })()

      return this.initPromise
    },

    // Accept both relative and absolute paths
    async login(redirectUri: string = '/dashboard') {
      await KeycloakAuthService.login(redirectUri)
    },

    async logout(redirectUri: string = '/login') {
      this.isAuthenticated = false
      this.user = null
      await KeycloakAuthService.logout(redirectUri)
    },

    async refreshToken() {
      try {
        const refreshed = await KeycloakAuthService.refreshToken()
        if (refreshed) {
          this.user = KeycloakAuthService.getUserInfo() ?? { roles: [] }
        }
        return refreshed
      } catch (err) {
        console.error('[AuthStore] Token refresh failed:', err)
        return false
      }
    },

    getToken(): string | undefined {
      return KeycloakAuthService.getToken()
    },
  },
})