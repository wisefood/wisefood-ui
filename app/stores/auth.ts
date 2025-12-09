import { defineStore } from 'pinia'
import { useNuxtApp } from '#app'

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
    /** Initialize auth state */
    async initialize() {
      if (this.initialized) return this.isAuthenticated

      const { $keycloak } = useNuxtApp()
      try {
        const authenticated = await $keycloak.init()
        if (authenticated) {
          this.isAuthenticated = true
          this.user = $keycloak.getUserInfo() ?? { roles: [] }
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

    /** Login */
    async login(redirectUri?: string) {
      const { $keycloak } = useNuxtApp()
      await $keycloak.login(redirectUri)
    },

    /** Logout */
    async logout(redirectUri?: string) {
      const { $keycloak } = useNuxtApp()
      this.isAuthenticated = false
      this.user = null
      await $keycloak.logout(redirectUri)
    },

    /** Refresh access token */
    async refreshToken() {
      const { $keycloak } = useNuxtApp()
      try {
        const refreshed = await $keycloak.refreshToken()
        if (refreshed) {
          this.user = $keycloak.getUserInfo() ?? { roles: [] }
        }
        return refreshed
      } catch (err) {
        console.error('[AuthStore] Token refresh failed:', err)
        return false
      }
    },

    /** Get access token */
    getToken(): string | undefined {
      const { $keycloak } = useNuxtApp()
      return $keycloak.getToken()
    },
  },
})
