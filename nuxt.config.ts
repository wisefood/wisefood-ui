export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
  ],
  devtools: {
    enabled: true
  },
  debug: true,
  vite: {
    define: {
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true
    }
  },

  runtimeConfig: {
    public: {
      keycloakUrl: process.env.VITE_KEYCLOAK_URL,
      keycloakRealm: process.env.VITE_KEYCLOAK_REALM,
      keycloakClientId: process.env.VITE_KEYCLOAK_CLIENT_ID,
    }
  },  

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})