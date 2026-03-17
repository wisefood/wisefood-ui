export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt'
  ],

  devtools: {
    enabled: true,

    timeline: {
      enabled: false
    }
  },

  app: {
    baseURL: process.env['NUXT_APP_BASE_URL'] || '/',
    head: {
      title: 'Loading - WiseFood',
      titleTemplate: '%s - WiseFood'
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      keycloakUrl: process.env.VITE_KEYCLOAK_URL,
      keycloakRealm: process.env.VITE_KEYCLOAK_REALM,
      keycloakClientId: process.env.VITE_KEYCLOAK_CLIENT_ID,
      wisefoodApiUrl: process.env.VITE_WISEFOOD_API_URL, // Articles API: https://wisefood.gr/dc/api
      wisefoodRestApiUrl: process.env.VITE_WISEFOOD_REST_API_URL // REST API: https://wisefood.gr/rest/api/v1
    }
  },
  routeRules: {
    '/': { prerender: true },
    '/profiles': { ssr: false },
    '/dashboard': { ssr: false },
    '/console': { ssr: false },
    '/console/**': { ssr: false },
    '/foodscholar/**': { ssr: false },
    '/recipe-wrangler/**': { ssr: false },
    '/foodchat/**': { ssr: false }
  },

  compatibilityDate: '2025-01-15',
  vite: {
    define: {
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true
    }
  },
  debug: false,

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
