import { defineNuxtPlugin } from '#app'
import KeycloakAuthService from '~/services/keycloak'

export default defineNuxtPlugin((nuxtApp) => {
  const keycloakService = KeycloakAuthService
  nuxtApp.provide('keycloak', keycloakService)
})
