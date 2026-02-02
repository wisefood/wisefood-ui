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

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware for login page to avoid redirect loops
  if (to.path === '/login') {
    return
  }

  const authStore = useAuthStore()

  log('[AuthMiddleware] Checking authentication for route:', to.path)
  log('[AuthMiddleware] Current auth state - initialized:', authStore.initialized, 'authenticated:', authStore.isAuthenticated, 'initInProgress:', !!authStore.initPromise)

  // Always wait for authentication to be checked/initialized
  // This ensures SSO sessions are properly detected across tabs
  // The initialize method will return the existing promise if one is in progress
  try {
    log('[AuthMiddleware] Waiting for authentication check...')
    const isAuthenticated = await authStore.initialize()

    log('[AuthMiddleware] Authentication check complete:', isAuthenticated)

    // Only redirect to login if user is truly not authenticated
    // after the full SSO check has completed
    if (!isAuthenticated) {
      log('[AuthMiddleware] Not authenticated, redirecting to /login')
      return navigateTo('/login')
    }

    log('[AuthMiddleware] User authenticated, allowing access to:', to.path)
  } catch (error) {
    console.error('[AuthMiddleware] Error during authentication check:', error)
    return navigateTo('/login')
  }
})