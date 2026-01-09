import { defineNuxtPlugin } from '#app'
import KeycloakAuthService from '~/services/keycloak'

export default defineNuxtPlugin(async (nuxtApp) => {
  // Provide keycloak service
  nuxtApp.provide('keycloak', KeycloakAuthService)

  // Initialize auth on app load
  // This runs once when the app starts (including new tabs)
  const authStore = useAuthStore()
  console.log('[KeycloakPlugin] Initializing authentication...')
  await authStore.initialize()
  console.log('[KeycloakPlugin] Authentication initialized')
})