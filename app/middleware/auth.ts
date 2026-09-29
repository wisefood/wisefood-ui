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
      return navigateTo({
        path: '/login',
        query: {
          redirect: to.fullPath
        }
      })
    }

    /*
     * A guest who kept their account signs in to a household that still
     * carries the guest placeholders — the gateway flagged it at claim time.
     * Whatever page they were heading for, the setup wizard comes first, and
     * only once: resolving it writes the flag back. Guests themselves never
     * carry the flag, and the profiles page is where the wizard lives.
     */
    if (!authStore.isGuest && to.path !== '/profiles') {
      const householdStore = useHouseholdStore()
      if (!householdStore.initialized) {
        await householdStore.initialize()
      }
      if (householdStore.needsClaimSetup) {
        log('[AuthMiddleware] Household setup pending after a claim, redirecting to /profiles')
        return navigateTo('/profiles')
      }
    }

    log('[AuthMiddleware] User authenticated, allowing access to:', to.path)
  } catch (error) {
    console.error('[AuthMiddleware] Error during authentication check:', error)
    return navigateTo({
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    })
  }
})
