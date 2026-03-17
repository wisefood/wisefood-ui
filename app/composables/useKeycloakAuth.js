export const useKeycloakAuth = () => {
  const authStore = useAuthStore()

  return {
    user: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    isLoggedIn: computed(() => authStore.isLoggedIn),
    hasRole: role => authStore.hasRole(role),
    hasAnyRole: roles => authStore.hasAnyRole(roles),
    canAccessConsole: computed(() => authStore.canAccessConsole),
    login: redirectUri => authStore.login(redirectUri),
    logout: redirectUri => authStore.logout(redirectUri),
    getToken: () => authStore.getToken(),
    refreshToken: () => authStore.refreshToken()
  }
}
