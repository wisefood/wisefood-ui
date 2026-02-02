import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    // If there's a saved position (e.g., from browser back/forward), use it
    if (savedPosition) {
      return savedPosition
    }

    // If the hash looks like a Keycloak callback (contains state= or session_state=),
    // don't try to scroll to it as it's not a valid CSS selector
    if (to.hash && (to.hash.includes('state=') || to.hash.includes('session_state=') || to.hash.includes('code='))) {
      return { top: 0 }
    }

    // If there's a valid hash (anchor link), try to scroll to it
    if (to.hash) {
      try {
        // Check if it's a valid selector before attempting to use it
        const escapedHash = CSS.escape(to.hash.slice(1))
        const element = document.querySelector(`#${escapedHash}`)
        if (element) {
          return { el: `#${escapedHash}`, behavior: 'smooth' }
        }
      } catch {
        // If the selector is invalid, just scroll to top
        return { top: 0 }
      }
    }

    // Default: scroll to top
    return { top: 0 }
  }
}
