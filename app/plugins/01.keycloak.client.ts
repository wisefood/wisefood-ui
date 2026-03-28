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

export default defineNuxtPlugin(async (nuxtApp) => {
  // Provide keycloak service
  nuxtApp.provide('keycloak', KeycloakAuthService)

  // Initialize auth on app load
  // This runs once when the app starts (including new tabs)
  const authStore = useAuthStore()
  log('[KeycloakPlugin] Initializing authentication...')
  await authStore.initialize()
  log('[KeycloakPlugin] Authentication initialized')
})