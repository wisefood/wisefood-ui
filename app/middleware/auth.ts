export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()
  
  // Wait for initialization if not done yet
  if (!authStore.initialized) {
    await authStore.initialize()
  }
  
  // If not authenticated, redirect to login
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})