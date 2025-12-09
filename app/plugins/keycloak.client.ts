import { defineNuxtPlugin } from '#app'
import KeycloakAuthService from '~/services/keycloak'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('keycloak', KeycloakAuthService)
})
