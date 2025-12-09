import KeycloakAuthService from '~/services/keycloak'

declare module '#app' {
  interface NuxtApp {
    $keycloak: KeycloakAuthService
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $keycloak: KeycloakAuthService
  }
}
