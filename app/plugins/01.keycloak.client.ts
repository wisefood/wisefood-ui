import { defineNuxtPlugin } from '#app'
import KeycloakAuthService from '~/services/keycloak'

const isDebugEnabled = (): boolean => {
  if (typeof window === 'undefined') return false
  const runtimeConfig = (window as any).__RUNTIME_CONFIG__
  if (runtimeConfig?.keycloakDebug !== undefined) {
    return runtimeConfig.keycloakDebug === true || runtimeConfig.keycloakDebug === 'true'
  }
  return import.meta.env.VITE_KEYCLOAK_DEBUG === 'true'
}

const log = (...args: unknown[]) => {
  if (isDebugEnabled()) {
    console.log(...args)
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  // Provide keycloak service
  nuxtApp.provide('keycloak', KeycloakAuthService)

  // Initialize auth on app load, but do not block app mount/hydration.
  // Route middleware/pages handle auth-gated flows explicitly.
  const authStore = useAuthStore()
  log('[KeycloakPlugin] Initializing authentication...')
  void authStore.initialize()
    .then(() => {
      log('[KeycloakPlugin] Authentication initialized')
    })
    .catch((error) => {
      console.error('[KeycloakPlugin] Authentication initialization failed:', error)
    })
})
