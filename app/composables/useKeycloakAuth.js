export const useKeycloakAuth = () => {
  const authStore = useAuthStore()
  
  return {
    user: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    isLoggedIn: computed(() => authStore.isLoggedIn),
    hasRole: (role: string) => authStore.hasRole(role),
    login: (redirectUri?: string) => authStore.login(redirectUri),
    logout: (redirectUri?: string) => authStore.logout(redirectUri),
    getToken: () => authStore.getToken(),
    refreshToken: () => authStore.refreshToken(),
  }
}