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
    return (
      typeof window !== "undefined" &&
      !!window.crypto &&
      !!window.crypto.subtle
    );
  }

  async init(): Promise<boolean> {
    // If already initialized and authenticated, return the cached result
    if (this.initPromise && this.keycloak) {
      return this.keycloak.authenticated || false;
    }

    // Only initialize once
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        const kc = this.getKeycloak();

        const authenticated = await kc.init({
          onLoad: "check-sso",
          silentCheckSsoRedirectUri: `${window.location.origin}/app/silent-check-sso.html`,
          pkceMethod: this.hasWebCrypto() ? "S256" : undefined,
          checkLoginIframe: false,
        });

        // Setup token refresh if authenticated
        if (authenticated) {
          this.setupTokenRefresh();
        }

        return authenticated;
      } catch (error) {
        console.error("Keycloak init failed:", error);
        return false;
      }
    })();

    return this.initPromise;
  }

  private setupTokenRefresh(): void {
    const kc = this.getKeycloak();

    // Refresh token every 60 seconds
    setInterval(async () => {
      try {
        await kc.updateToken(70);
      } catch (error) {
        console.error("Token refresh failed:", error);
        this.logout();
      }
    }, 60000);
  }

  login(): void {
    const kc = this.getKeycloak();
    const redirectUri = window.location.origin + "/dashboard";
    console.log('[Keycloak] Redirecting to login. Redirect URI:', redirectUri);
    kc.login({
      redirectUri: redirectUri,
    });
  }

  logout(): void {
    const kc = this.getKeycloak();
    kc.logout({
      redirectUri: window.location.origin + "/login",
    });
  }

  async refreshToken(): Promise<boolean> {
    try {
      const kc = this.getKeycloak();
      return await kc.updateToken(70);
    } catch (error) {
      console.error("Failed to refresh token:", error);
      return false;
    }
  }

  isAuthenticated(): boolean {
    return this.keycloak?.authenticated ?? false;
  }

  getToken(): string | undefined {
    return this.keycloak?.token;
  }

  getRefreshToken(): string | undefined {
    return this.keycloak?.refreshToken;
  }

  getTokenParsed(): any {
    return this.keycloak?.tokenParsed;
  }

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
