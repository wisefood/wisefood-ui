import { fileURLToPath } from 'node:url'

const sentryDsn = process.env.NUXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || ''
const sentryEnabledSetting = process.env.SENTRY_ENABLED
const isDevCommand = process.env.npm_lifecycle_event === 'dev' || process.argv.includes('dev')
const isSentryEnabled = sentryEnabledSetting === 'true' || (sentryEnabledSetting !== 'false' && !isDevCommand)
const canUploadSentrySourceMaps = Boolean(
  sentryDsn
    && process.env.SENTRY_ORG
    && process.env.SENTRY_PROJECT
    && process.env.SENTRY_AUTH_TOKEN
)
const optimizeDepsInclude = [
  '@internationalized/date',
  'dompurify',
  'keycloak-js',
  'marked',
  'vue-i18n'
]

if (isSentryEnabled) {
  optimizeDepsInclude.push('@sentry/nuxt')
}

export default defineNuxtConfig({
  modules: [
    ...(isSentryEnabled ? ['@sentry/nuxt/module'] : []),
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt'
  ],

  sentry: {
    enabled: isSentryEnabled,
    dsn: sentryDsn,
    sourceMapsUploadOptions: {
      enabled: canUploadSentrySourceMaps,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN
    }
  },

  devtools: {
    enabled: process.env.NUXT_DEVTOOLS === 'true',

    timeline: {
      enabled: false
    }
  },

  ui: {
    fonts: false
  },

  icon: {
    collections: ['lucide', 'simple-icons'],
    serverBundle: {
      collections: ['lucide', 'simple-icons']
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
      sentryDsn,
      sentryEnabled: isSentryEnabled,
      keycloakUrl: process.env.VITE_KEYCLOAK_URL,
      keycloakRealm: process.env.VITE_KEYCLOAK_REALM,
      keycloakClientId: process.env.VITE_KEYCLOAK_CLIENT_ID,
      wisefoodApiUrl: process.env.VITE_WISEFOOD_API_URL, // Data Catalog API: https://wisefood.gr/dc/api
      wisefoodRestApiUrl: process.env.VITE_WISEFOOD_REST_API_URL, // REST API: https://wisefood.gr/rest/api/v1
      recipeWranglerApiUrl: process.env.VITE_RECIPE_WRANGLER_API_URL,
      recipeWranglerMode: process.env.VITE_RECIPE_WRANGLER_MODE
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
      include: optimizeDepsInclude
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


