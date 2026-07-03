import { defineStore } from 'pinia'
import KeycloakAuthService from '~/services/keycloak'
import { canAccessConsole, includesAnyRole, includesRole } from '~/utils/authRoles'
import { getWisefoodRestApiUrl } from '~/utils/runtimeConfig'

const isDebugEnabled = (): boolean => {
  if (typeof window === 'undefined') return false
  const runtimeConfig = (window as any).__RUNTIME_CONFIG__
  if (runtimeConfig?.keycloakDebug !== undefined) {
    return runtimeConfig.keycloakDebug === true || runtimeConfig.keycloakDebug === 'true'
  }
  return import.meta.env.VITE_KEYCLOAK_DEBUG === 'true'
}

const log = (...args: unknown[]) => {
  if (isDebugEnabled()) {
    console.log(...args)
  }
}

interface User {
  id?: string
  username?: string
  email?: string
  given_name?: string
  family_name?: string
  name?: string
  roles: string[]
}

interface GuestSession {
  accessToken: string
  /** epoch seconds when the access token expires */
  tokenExpiresAt: number
  /** epoch seconds when the guest account itself is reaped server-side */
  guestExpiresAt: number
  userId: string
  username: string
  householdId: string
  memberId: string | null
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  guest: GuestSession | null
  initialized: boolean
  initPromise: Promise<boolean> | null
}

// sessionStorage (not localStorage) so a guest session dies with the tab
// and successive guests on the same machine never see each other's state.
const GUEST_STORAGE_KEY = 'wisefood_guest_session'
const SELECTED_MEMBER_KEY = 'wisefood_selected_member_id'
const HOUSEHOLD_SKIPPED_KEY = 'wisefood_household_setup_skipped'

const decodeJwtPayload = (token: string): Record<string, any> | null => {
  try {
    const base64 = token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

let guestLoginInFlight: Promise<boolean> | null = null

const loadGuestSession = (): GuestSession | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(GUEST_STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as GuestSession
    const now = Math.floor(Date.now() / 1000)
    if (session.tokenExpiresAt <= now || session.guestExpiresAt <= now) {
      window.sessionStorage.removeItem(GUEST_STORAGE_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

const AUTH_INIT_TIMEOUT_MS = 8000

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> => {
  return await Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), timeoutMs))
  ])
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isAuthenticated: false,
    user: null,
    guest: null,
    initialized: false,
    initPromise: null,
  }),

  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated,
    isGuest: (state) => state.guest !== null,
    guestExpiresAt: (state) => state.guest?.guestExpiresAt ?? null,
    guestMemberId: (state) => state.guest?.memberId ?? null,
    roleList: (state) => state.user?.roles ?? [],
    hasRole: (state) => (role: string) => includesRole(state.user?.roles, role),
    hasAnyRole: (state) => (roles: string[]) => includesAnyRole(state.user?.roles, roles),
    canAccessConsole: (state) => canAccessConsole(state.user?.roles),
  },

  actions: {
    async initialize(forceRecheck = false) {
      // A live guest session short-circuits Keycloak entirely.
      if (!this.isAuthenticated) {
        const guestSession = loadGuestSession()
        if (guestSession) {
          this.applyGuestSession(guestSession)
          this.initialized = true
          log('[AuthStore] Restored guest session:', guestSession.username)
          return true
        }
      }

      // If there's already an initialization in progress, wait for it
      if (this.initPromise && !forceRecheck) {
        log('[AuthStore] Initialization already in progress, waiting...')
        return this.initPromise
      }

      // If already initialized and authenticated, we can skip re-initialization
      // UNLESS we're forcing a recheck
      if (this.initialized && this.isAuthenticated && !forceRecheck) {
        log('[AuthStore] Already initialized and authenticated:', this.user?.username)
        return this.isAuthenticated
      }

      // If initialized but NOT authenticated, don't skip - we should recheck
      // because the user might have logged in on another tab
      log('[AuthStore] Initializing auth store (initialized:', this.initialized, ', authenticated:', this.isAuthenticated, ')')

      // Create and store the initialization promise
      this.initPromise = (async () => {
        try {
          const authenticated = await withTimeout(
            KeycloakAuthService.init(),
            AUTH_INIT_TIMEOUT_MS,
            false
          )
          if (authenticated) {
            this.isAuthenticated = true
            this.user = KeycloakAuthService.getUserInfo() ?? { roles: [] }
            log('[AuthStore] User authenticated:', this.user?.username)
            await this.refreshToken()
          } else {
            this.isAuthenticated = false
            this.user = null
            log('[AuthStore] User not authenticated')
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
    async login(redirectUri: string = '/profiles') {
      log('[AuthStore] Login requested with redirect:', redirectUri)
      await KeycloakAuthService.login(redirectUri)
    },

    applyGuestSession(session: GuestSession) {
      this.guest = session
      this.isAuthenticated = true
      this.user = {
        id: session.userId,
        username: session.username,
        name: 'Guest',
        roles: ['guest'],
      }
    },

    /**
     * Create an ephemeral guest account on the backend and enter guest mode.
     * The guest gets a pre-provisioned household + member; everything is
     * deleted server-side when the guest TTL expires.
     */
    async loginAsGuest() {
      // Concurrent calls (double click, remount) share one request so we
      // never mint two guest accounts.
      if (guestLoginInFlight) {
        return guestLoginInFlight
      }
      guestLoginInFlight = this.doGuestLogin().finally(() => {
        guestLoginInFlight = null
      })
      return guestLoginInFlight
    },

    async doGuestLogin() {
      // Base URL already includes the /api/v1 prefix.
      const baseUrl = getWisefoodRestApiUrl()
      const response = await fetch(`${baseUrl}/system/guest`, {
        method: 'POST',
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        const detail = body?.error?.detail ?? body?.detail
        throw new Error(detail ?? `Guest login failed (${response.status})`)
      }
      const envelope = await response.json()
      const result = envelope?.result ?? envelope
      const accessToken: string = result.token.access_token
      const claims = decodeJwtPayload(accessToken)

      const session: GuestSession = {
        accessToken,
        tokenExpiresAt:
          claims?.exp ?? Math.floor(Date.now() / 1000) + (result.token.expires_in ?? 3600),
        guestExpiresAt: result.guest.expires_at,
        userId: result.guest.user_id,
        username: result.guest.username,
        householdId: result.guest.household_id,
        memberId: result.guest.member_id ?? null,
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(session))
        // Fresh sandbox: never inherit another user's member selection.
        window.localStorage.removeItem(SELECTED_MEMBER_KEY)
        window.localStorage.removeItem(HOUSEHOLD_SKIPPED_KEY)
        if (session.memberId) {
          window.localStorage.setItem(SELECTED_MEMBER_KEY, session.memberId)
        }
      }

      this.applyGuestSession(session)
      this.initialized = true
      log('[AuthStore] Guest session started:', session.username)
      return true
    },

    clearGuestSession() {
      this.guest = null
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(GUEST_STORAGE_KEY)
        window.localStorage.removeItem(SELECTED_MEMBER_KEY)
        window.localStorage.removeItem(HOUSEHOLD_SKIPPED_KEY)
      }
    },

    async logout(redirectUri: string = '/login') {
      if (this.guest) {
        this.clearGuestSession()
        this.isAuthenticated = false
        this.user = null
        if (typeof window !== 'undefined') {
          window.location.href = redirectUri
        }
        return
      }
      this.isAuthenticated = false
      this.user = null
      await KeycloakAuthService.logout(redirectUri)
    },

    async refreshToken() {
      if (this.guest) {
        // Guest tokens are not refreshable from the browser; when the token
        // (or the guest account) expires, the session ends.
        const now = Math.floor(Date.now() / 1000)
        if (this.guest.tokenExpiresAt <= now || this.guest.guestExpiresAt <= now) {
          log('[AuthStore] Guest session expired')
          return false
        }
        return true
      }
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
      if (this.guest) {
        return this.guest.accessToken
      }
      return KeycloakAuthService.getToken()
    },
  },
})
