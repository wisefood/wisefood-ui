import { defineStore } from "pinia";

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  tokenParsed: any | null;
  refreshToken: string | null;
  user: {
    username: string | null;
    email: string | null;
    roles: string[] | null;
    given_name: string | null;
    family_name: string | null;
    name: string | null;
    id: string | null;
  } | null;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    isAuthenticated: false,
    user: null,
    token: null,
    tokenParsed: null,
    refreshToken: null,
  }),
  actions: {
    setAuth(authData: any) {
      this.isAuthenticated = authData.isAuthenticated;
      this.token = authData.token;
      this.refreshToken = authData.refreshToken;
      this.tokenParsed = authData.tokenParsed;
      if (authData.user) {
        this.user = authData.user;
      }
    },

    clearAuth() {
      this.isAuthenticated = false;
      this.token = null;
      this.refreshToken = null;
      this.tokenParsed = null;
      this.user = {
        username: null,
        email: null,
        roles: [],
        given_name: null,
        family_name: null,
        name: null,
        id: null,
      };
    },
    getAllAuthData() {
      return {
        isAuthenticated: this.isAuthenticated,
        token: this.token,
        refreshToken: this.refreshToken,
        tokenParsed: this.tokenParsed,
        user: this.user,
      };
    },
  },
});
