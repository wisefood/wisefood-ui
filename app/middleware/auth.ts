export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware for login page to avoid redirect loops
  if (to.path === '/login') {
    return
  }

  const authStore = useAuthStore()

  console.log('[AuthMiddleware] Checking authentication for route:', to.path)
  console.log('[AuthMiddleware] Current auth state - initialized:', authStore.initialized, 'authenticated:', authStore.isAuthenticated, 'initInProgress:', !!authStore.initPromise)

  // Always wait for authentication to be checked/initialized
  // This ensures SSO sessions are properly detected across tabs
  // The initialize method will return the existing promise if one is in progress
  try {
    console.log('[AuthMiddleware] Waiting for authentication check...')
    const isAuthenticated = await authStore.initialize()

    console.log('[AuthMiddleware] Authentication check complete:', isAuthenticated)

    // Only redirect to login if user is truly not authenticated
    // after the full SSO check has completed
    if (!isAuthenticated) {
      console.log('[AuthMiddleware] Not authenticated, redirecting to /login')
      return navigateTo('/login')
    }

    console.log('[AuthMiddleware] User authenticated, allowing access to:', to.path)
  } catch (error) {
    console.error('[AuthMiddleware] Error during authentication check:', error)
    return navigateTo('/login')
  }
})