import { isAdmin } from '~/utils/authRoles'
import systemApi from '~/services/systemApi'

/**
 * Routes that stay reachable while the platform is closed.
 *
 * `/login` because the admin has to be able to get in; `/maintenance` because
 * that is where everyone else is sent, and a guard that redirects its own
 * destination loops.
 */
const OPEN_PATHS = ['/login', '/maintenance']

/**
 * The browser half of maintenance mode.
 *
 * The API refuses non-admins with a 503 the moment the switch is on, so this
 * guard is not what keeps anyone out — it is what turns "every request fails"
 * into a page that says why. It asks `/system/info` once per page load, which
 * is unauthenticated on purpose: a person who has not signed in yet is the one
 * most in need of being told at the door.
 *
 * The answer is cached in `useState` for the life of the app so navigating
 * between pages costs nothing; a full reload asks again, which is how the site
 * reopens for everyone once the admin flips the switch back.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Static assets and Nuxt internals never reach a route middleware, so only
  // pages get here. A page that is itself part of the closed-sign machinery
  // is left alone.
  if (OPEN_PATHS.some(path => to.path === path || to.path.startsWith(`${path}/`))) {
    return
  }

  const closed = useState<boolean | null>('platform-maintenance', () => null)

  if (closed.value === null) {
    try {
      const info = await systemApi.getInfo()
      closed.value = Boolean(info?.maintenance)
    } catch (error) {
      // If we cannot tell, the platform is open: the API's own 503s will say
      // otherwise if it is not. A guard that fails closed turns any blip on
      // `/info` into a site-wide outage page, which is worse than the blip.
      console.warn('[Maintenance] Could not read platform status:', error)
      closed.value = false
    }
  }

  if (!closed.value) {
    return
  }

  const authStore = useAuthStore()
  try {
    const signedIn = await authStore.initialize()
    if (signedIn && isAdmin(authStore.roleList)) {
      return
    }
  } catch (error) {
    console.warn('[Maintenance] Could not establish who is signed in:', error)
  }

  return navigateTo('/maintenance')
})
