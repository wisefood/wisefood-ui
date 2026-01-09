import Keycloak from 'keycloak-js'
import type { KeycloakConfig } from 'keycloak-js'

class KeycloakAuthService {
  private keycloak: Keycloak | null = null
  private initPromise: Promise<boolean> | null = null
  
  private getKeycloak(): Keycloak {
    if (!this.keycloak) {
      const config = this.getConfig()
      this.keycloak = new Keycloak(config)
    }
    return this.keycloak
  }

  private getConfig(): KeycloakConfig {
    const config = useRuntimeConfig().public
    return {
      url: config.keycloakUrl as string,
      realm: config.keycloakRealm as string,
      clientId: config.keycloakClientId as string,
    }
  }

  private hasWebCrypto(): boolean {
    return typeof window !== 'undefined' && !!window.crypto && !!window.crypto.subtle
  }

  // Helper to create absolute URL
  private getAbsoluteUrl(path: string): string {
    if (typeof window === 'undefined') return path
    
    // If it's already absolute, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }
    
    // Make it absolute
    const origin = window.location.origin
    const fullPath = path.startsWith('/') ? path : `/${path}`
    return `${origin}${fullPath}`
  }

  async init(): Promise<boolean> {
    // If already initialized and authenticated, verify token is still valid
    if (this.initPromise && this.keycloak?.authenticated) {
      try {
        // Try to refresh token to ensure it's still valid
        await this.keycloak.updateToken(5)
        console.log('[Keycloak] Already initialized and authenticated')
        return true
      } catch (error) {
        console.warn('[Keycloak] Token validation failed, re-initializing:', error)
        // Reset and re-initialize
        this.keycloak = null
        this.initPromise = null
      }
    }

    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      try {
        const kc = this.getKeycloak()

        console.log('[Keycloak] Starting initialization...')

        const authenticated = await kc.init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: this.getAbsoluteUrl('/silent-check-sso.html'),
          pkceMethod: this.hasWebCrypto() ? 'S256' : undefined,
          checkLoginIframe: false,
          enableLogging: true,
        })

        console.log('[Keycloak] Initialization complete. Authenticated:', authenticated)

        if (authenticated) {
          console.log('[Keycloak] User info:', this.getUserInfo())
          console.log('[Keycloak] Token expires in:', kc.tokenParsed?.exp ?
            new Date(kc.tokenParsed.exp * 1000).toLocaleString() : 'unknown')
          this.setupTokenRefresh()
        } else {
          console.log('[Keycloak] Not authenticated - no valid SSO session found')
        }

        return authenticated
      } catch (error) {
        console.error('[Keycloak] Init failed:', error)
        return false
      }
    })()

    return this.initPromise
  }

  private setupTokenRefresh(): void {
    const kc = this.getKeycloak()
    const interval = setInterval(async () => {
      try {
        const refreshed = await kc.updateToken(70)
        if (!refreshed) console.warn('[Keycloak] Token not refreshed')
      } catch (error) {
        console.error('[Keycloak] Token refresh failed:', error)
        clearInterval(interval)
        this.logout()
      }
    }, 60_000)
  }

  login(redirectUri?: string): void {
    const absoluteUrl = redirectUri 
      ? this.getAbsoluteUrl(redirectUri) 
      : this.getAbsoluteUrl('/dashboard')
    
    console.log('[Keycloak] Login with redirect:', absoluteUrl)
    
    this.getKeycloak().login({
      redirectUri: absoluteUrl,
    })
  }

  logout(redirectUri?: string): void {
    const absoluteUrl = redirectUri 
      ? this.getAbsoluteUrl(redirectUri) 
      : this.getAbsoluteUrl('/login')
    
    console.log('[Keycloak] Logout with redirect:', absoluteUrl)
    
    this.getKeycloak().logout({
      redirectUri: absoluteUrl,
    })
  }

  register(redirectUri?: string): void {
    const absoluteUrl = redirectUri 
      ? this.getAbsoluteUrl(redirectUri) 
      : this.getAbsoluteUrl('/dashboard')
    
    console.log('[Keycloak] Register with redirect:', absoluteUrl)
    
    const kc = this.getKeycloak()
    kc.register({
      redirectUri: absoluteUrl,
    })
  }

  refreshToken(): Promise<boolean> {
    return this.getKeycloak().updateToken(70)
      .catch((err) => { console.error(err); return false })
  }

  isAuthenticated(): boolean {
    return this.keycloak?.authenticated ?? false
  }

  getToken(): string | undefined {
    return this.keycloak?.token
  }

  getRefreshToken(): string | undefined {
    return this.keycloak?.refreshToken
  }

  getTokenParsed(): Keycloak.KeycloakTokenParsed | undefined {
    return this.keycloak?.tokenParsed
  }

  getUserInfo(): { id: string; username?: string; email?: string; name?: string; roles: string[] } | null {
    const parsed = this.keycloak?.tokenParsed
    if (!parsed) return null
    return {
      id: parsed.sub || '',
      username: parsed.preferred_username,
      email: parsed.email,
      name: parsed.name,
      roles: parsed.realm_access?.roles ?? [],
    }
  }
}

export default new KeycloakAuthService()