// plugins/keycloak.client.ts
import { defineNuxtPlugin } from '#app'
import Keycloak from 'keycloak-js'
import type { KeycloakConfig, KeycloakInstance } from 'keycloak-js'

class KeycloakAuthService {
  private keycloak: KeycloakInstance | null = null
  private initPromise: Promise<boolean> | null = null

  private getKeycloak(): KeycloakInstance {
    if (!this.keycloak) {
      const config = this.getConfig()
      this.keycloak = new Keycloak(config)
    }
    return this.keycloak
  }

  private getConfig(): KeycloakConfig {
    const config = useRuntimeConfig().public
    return {
      url: config.keycloakUrl,
      realm: config.keycloakRealm,
      clientId: config.keycloakClientId,
    }
  }

  private hasWebCrypto(): boolean {
    return typeof window !== 'undefined' && !!window.crypto && !!window.crypto.subtle
  }

  /** Initialize Keycloak */
  async init(): Promise<boolean> {
    if (this.initPromise && this.keycloak) {
      return this.keycloak.authenticated || false
    }
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      try {
        const kc = this.getKeycloak()
        const authenticated = await kc.init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
          pkceMethod: this.hasWebCrypto() ? 'S256' : undefined,
          checkLoginIframe: false,
        })

        if (authenticated) this.setupTokenRefresh()

        return authenticated
      } catch (error) {
        console.error('[Keycloak] Init failed:', error)
        return false
      }
    })()

    return this.initPromise
  }

  /** Automatic token refresh */
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
    this.getKeycloak().login({
      redirectUri: redirectUri || window.location.origin + '/dashboard',
    })
  }

  logout(redirectUri?: string): void {
    this.getKeycloak().logout({
      redirectUri: redirectUri || window.location.origin + '/login',
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
      id: parsed.sub,
      username: parsed.preferred_username,
      email: parsed.email,
      name: parsed.name,
      roles: parsed.realm_access?.roles ?? [],
    }
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const keycloakService = new KeycloakAuthService()
  nuxtApp.provide('keycloak', keycloakService)
})
