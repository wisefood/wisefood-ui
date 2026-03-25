import { fileURLToPath } from 'node:url'

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
      wisefoodApiUrl: process.env.VITE_WISEFOOD_API_URL, // Data Catalog API: https://wisefood.gr/dc/api
      wisefoodRestApiUrl: process.env.VITE_WISEFOOD_REST_API_URL // REST API: https://wisefood.gr/rest/api/v1
    }
  },
  routeRules: {
    '/': { ssr: false },
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
    resolve: {
      alias: [
        {
          find: /^@vueuse\/core$/,
          replacement: fileURLToPath(new URL('./shims/vueuse-core.ts', import.meta.url))
        },
        {
          find: '#vueuse-core-original',
          replacement: fileURLToPath(new URL('./node_modules/.pnpm/@vueuse+core@13.9.0_vue@3.5.23_typescript@5.9.3_/node_modules/@vueuse/core/index.mjs', import.meta.url))
        }
      ],
      dedupe: ['vue', '@vueuse/core', '@vueuse/shared']
    },
    define: {
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true
    },
    optimizeDeps: {
      force: true
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
