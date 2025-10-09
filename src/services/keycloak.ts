import Keycloak from "keycloak-js";
import type { KeycloakConfig } from "keycloak-js";

const options: KeycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
};

class KeycloakAuthService {
  private keycloak: Keycloak | null = null;
  private initPromise: Promise<boolean> | null = null;

  private getKeycloak(): Keycloak {
    if (!this.keycloak) {
      this.keycloak = new Keycloak(options);
    }
    return this.keycloak;
  }

  private hasWebCrypto(): boolean {
    return typeof window !== "undefined" && !!window.crypto && !!window.crypto.subtle;
  }

  /** Initialize Keycloak */
  async init(): Promise<boolean> {
    if (this.initPromise && this.keycloak) {
      return this.keycloak.authenticated || false;
    }

    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const kc = this.getKeycloak();

        const authenticated = await kc.init({
          onLoad: "check-sso",
          silentCheckSsoRedirectUri: `${window.location.origin}/app/silent-check-sso.html`,
          pkceMethod: this.hasWebCrypto() ? "S256" : undefined,
          checkLoginIframe: false,
        });

        if (authenticated) this.setupTokenRefresh();

        return authenticated;
      } catch (error) {
        console.error("[Keycloak] Init failed:", error);
        return false;
      }
    })();

    return this.initPromise;
  }

  /** Setup automatic token refresh */
  private setupTokenRefresh(): void {
    const kc = this.getKeycloak();

    const interval = setInterval(async () => {
      try {
        const refreshed = await kc.updateToken(70);
        if (!refreshed) {
          console.warn("[Keycloak] Token not refreshed, may be expired.");
        }
      } catch (error) {
        console.error("[Keycloak] Token refresh failed:", error);
        clearInterval(interval);
        this.logout();
      }
    }, 60000); // every 60 seconds
  }

  /** Redirect to login page */
  login(redirectUri?: string): void {
    const kc = this.getKeycloak();
    kc.login({
      redirectUri: redirectUri || window.location.origin + "/dashboard",
    });
  }

  /** Redirect to registration page */
  register(redirectUri?: string): void {
    const kc = this.getKeycloak();
    kc.register({
      redirectUri: redirectUri || window.location.origin + "/dashboard",
    });
  }

  /** Logout and redirect */
  logout(redirectUri?: string): void {
    const kc = this.getKeycloak();
    kc.logout({
      redirectUri: redirectUri || window.location.origin + "/login",
    });
  }

  /** Force token refresh manually */
  async refreshToken(): Promise<boolean> {
    try {
      const kc = this.getKeycloak();
      return await kc.updateToken(70);
    } catch (error) {
      console.error("[Keycloak] Failed to refresh token:", error);
      return false;
    }
  }

  /** Check authentication */
  isAuthenticated(): boolean {
    return this.keycloak?.authenticated ?? false;
  }

  /** Get access token */
  getToken(): string | undefined {
    return this.keycloak?.token;
  }

  /** Get refresh token */
  getRefreshToken(): string | undefined {
    return this.keycloak?.refreshToken;
  }

  /** Get parsed token info */
  getTokenParsed(): any {
    return this.keycloak?.tokenParsed;
  }

  /** Get basic user info */
  getUserInfo() {
    const parsed = this.keycloak?.tokenParsed;
    if (!parsed) return null;

    return {
      id: parsed.sub,
      username: parsed.preferred_username,
      email: parsed.email,
      given_name: parsed.given_name,
      family_name: parsed.family_name,
      name: parsed.name,
      roles: parsed.realm_access?.roles || [],
    };
  }
}

export default new KeycloakAuthService();
