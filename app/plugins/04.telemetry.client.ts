import { defineNuxtPlugin, useRouter } from '#imports'
import { installFlushOnHide, track } from '~/composables/useTelemetry'
import { touchAnalyticsSession } from '~/composables/useAnalyticsSession'

/**
 * Page views, and the session they belong to.
 *
 * Ordered after `01.keycloak.client.ts` so the signed-in user is known before
 * the first session is minted — a session that started as anonymous and then
 * saw a user appear would be discarded and replaced on the very next event.
 *
 * Only page views live here. Everything semantic — a search performed, a plan
 * generated, a result clicked — is emitted from the composable or store that
 * already knows it happened, because a router hook cannot tell the difference
 * between a search that returned nothing and one that was never run.
 */
export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return

  touchAnalyticsSession()
  installFlushOnHide()

  const router = useRouter()
  let previousPath: string | null = null

  router.afterEach((to) => {
    // The route's pattern, not the resolved URL: `/recipe-wrangler/[id]` says
    // which page was viewed without putting an id nobody asked for into an
    // events table.
    const pattern = to.matched[to.matched.length - 1]?.path ?? to.path
    track('page.view', { path: pattern, from: previousPath }, 'platform')
    previousPath = pattern
  })
})
