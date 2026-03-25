export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/console')) {
    return
  }

  const authStore = useAuthStore()

  try {
    const isAuthenticated = await authStore.initialize()

    if (!isAuthenticated) {
      return navigateTo({
        path: '/login',
        query: {
          redirect: to.fullPath
        }
      })
    }

    if (!authStore.canAccessConsole) {
      return navigateTo('/profiles')
    }
  } catch (error) {
    console.error('[ConsoleMiddleware] Error while protecting console route:', error)
    return navigateTo({
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    })
  }
})
