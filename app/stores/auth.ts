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
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isAuthenticated: false,
    user: null,
    initialized: false,
  }),

  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated,
    hasRole: (state) => (role: string) => state.user?.roles.includes(role) ?? false,
  },

  actions: {
    async initialize() {
      if (this.initialized) return this.isAuthenticated

      try {
        const authenticated = await KeycloakAuthService.init()
        if (authenticated) {
          this.isAuthenticated = true
          this.user = KeycloakAuthService.getUserInfo() ?? { roles: [] }
          await this.refreshToken()
        } else {
          this.isAuthenticated = false
          this.user = null
        }
        this.initialized = true
        return authenticated
      } catch (err) {
        console.error('[AuthStore] Initialization failed:', err)
        this.isAuthenticated = false
        this.user = null
        this.initialized = true
        return false
      }
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