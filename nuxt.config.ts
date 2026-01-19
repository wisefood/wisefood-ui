export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
  ],

  app: {
    baseURL: process.env['NUXT_APP_BASE_URL'] || '/',
    head: {
      title: 'Loading - WiseFood',
      titleTemplate: '%s - WiseFood',
    }
  },

  devtools: {
    enabled: true,

    timeline: {
      enabled: true
    }
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
      wisefoodApiUrl: process.env.VITE_WISEFOOD_API_URL,
    }
  },  

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true },
    '/dashboard': { ssr: false },
    '/foodscholar/**': { ssr: false },
    '/recipe-wrangler/**': { ssr: false },
    '/foodchat/**': { ssr: false },
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