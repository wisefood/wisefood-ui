import { defineStore } from "pinia";
import KeycloakService from "@/services/keycloak";

interface User {
  id?: string;
  username?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  roles: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  initialized: boolean;
}

export const useAuthStore = defineStore("auth", {
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
      // If already initialized, just return current state
      if (this.initialized) {
        return this.isAuthenticated;
      }

      try {
        const authenticated = await KeycloakService.init();

        if (authenticated) {
          this.isAuthenticated = true;
          this.user = KeycloakService.getUserInfo();
        } else {
          this.isAuthenticated = false;
          this.user = null;
        }

        this.initialized = true;
        return authenticated;
      } catch (error) {
        console.error("Auth initialization failed:", error);
        this.isAuthenticated = false;
        this.user = null;
        this.initialized = true;
        return false;
      }
    },

    login() {
      KeycloakService.login();
    },

    logout() {
      this.isAuthenticated = false;
      this.user = null;
      KeycloakService.logout();
    },

    async refreshToken() {
      try {
        const refreshed = await KeycloakService.refreshToken();
        if (refreshed) {
          this.user = KeycloakService.getUserInfo();
        }
        return refreshed;
      } catch (error) {
        console.error("Token refresh failed:", error);
        return false;
      }
    },

    getToken(): string | undefined {
      return KeycloakService.getToken();
    },
  },
});
