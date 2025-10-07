import Keycloak from "keycloak-js";
import type { KeycloakConfig } from "keycloak-js";
import { useAuthStore } from "@/stores/authStore";

const options: KeycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
};

let keycloak: Keycloak | null = null;
let authenticated = false;

function getKeycloak() {
  if (!keycloak && typeof window !== "undefined") {
    keycloak = new Keycloak(options);
  }
  return keycloak;
}

function hasWebCrypto(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.crypto &&
    !!window.crypto.subtle
  );
}

// Initialize without PKCE if Web Crypto API is missing
const KeycloakService = {
  async CallInit() {
    const authStore = useAuthStore();

    try {
      const kc = getKeycloak();
      if (!kc) throw new Error("Keycloak instance is not available");

      authenticated = await kc.init({
        onLoad: "check-sso",
        enableLogging: true,
        scope: "openid",
        pkceMethod: hasWebCrypto() ? "S256" : false,
        checkLoginIframe: false,
        token: authStore.token ?? undefined,
        refreshToken: authStore.refreshToken ?? undefined,
      });

      if (authenticated && kc.token) {
        console.log("User is authenticated");
        await this.updateStore();

        // Set up token refresh
        setInterval(async () => {
          try {
            await this.CallTokenRefresh();
          } catch (error) {
            console.error("Token refresh failed in interval");
          }
        }, 60000);
      } else {
        console.log("User is not authenticated");
      }

      return authenticated;
    } catch (error) {
      console.error("Keycloak init failed:", error || "(no error object)");
      throw error;
    }
  },

  async updateStore() {
    const authStore = useAuthStore();
    const kc = getKeycloak();
    if (kc?.token) {
      authStore.setAuth({
        isAuthenticated: true,
        token: kc.token,
        refreshToken: kc.refreshToken,
        tokenParsed: kc.tokenParsed,
        user: {
          username: kc.tokenParsed?.preferred_username,
          email: kc.tokenParsed?.email,
          id: kc.tokenParsed?.sub,
          roles: kc.tokenParsed?.realm_access?.roles || [],
          given_name: kc.tokenParsed?.given_name,
          family_name: kc.tokenParsed?.family_name,
          name: kc.tokenParsed?.name,
        },
      });
      authenticated = true;
    }
  },

  async CallTokenRefresh() {
    try {
      const kc = getKeycloak();
      if (!kc) throw new Error("Keycloak not initialized");

      const refreshed = await kc.updateToken(70);
      if (refreshed) {
        await this.updateStore();
      } else {
        console.error("Token refresh failed");
      }
      return true;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      authenticated = false;
      throw error;
    }
  },

  CallLogout() {
    const authStore = useAuthStore();
    authStore.clearAuth();
    authenticated = false;
    const kc = getKeycloak();
    kc?.logout({
      redirectUri: `${window.location.origin}/login`,
    });
  },

  CallLogin() {
    const kc = getKeycloak();
    kc?.login({
      redirectUri: `${window.location.origin}/dashboard`,
    });
  },

  IsAuthenticated() {
    const authStore = useAuthStore();
    return authenticated && authStore.token != null;
  },
};

export default KeycloakService;
