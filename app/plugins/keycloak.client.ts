import { defineNuxtPlugin } from '#app'
import KeycloakAuthService from '~/services/keycloak'

export default defineNuxtPlugin(async (nuxtApp) => {
  // Provide keycloak service
  nuxtApp.provide('keycloak', KeycloakAuthService)
  
  // Initialize auth on app load
  const authStore = useAuthStore()
  await authStore.initialize()
})