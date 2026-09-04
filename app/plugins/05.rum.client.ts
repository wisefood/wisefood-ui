import { defineNuxtPlugin, useRouter } from '#imports'
import {
  anyCaptureEnabled,
  onCaptureFlagsChange,
  startCaptureFlags,
  type CaptureStream
} from '~/composables/useCaptureFlags'
import { installRumUnloadFlush } from '~/composables/useRumBuffer'
import { setRoutePatternResolver } from '~/composables/useRumPath'
import { addBreadcrumb, installErrorCapture, reportVueError } from '~/composables/useErrorCapture'
import { installInteractionCapture, notePageView } from '~/composables/useInteractionCapture'
import { installWebVitals } from '~/composables/useWebVitals'
import { installRumSession, reportRumSession } from '~/composables/useRumSession'

/**
 * Real user monitoring: what the machine was, what broke, where people clicked,
 * how fast it felt.
 *
 * Ordered after `04.telemetry.client.ts`, which owns page views and the session
 * id this hangs off — and after `01.keycloak.client.ts`, because every one of
 * these endpoints needs a bearer token.
 *
 * NOTHING IS CAPTURED UNTIL THE GATEWAY SAYS SO. The flags are fetched, not
 * configured here, and each stream waits for its own: `capture.errors`,
 * `capture.interactions`, `capture.vitals`. The cost of that is real and
 * accepted — an error thrown in the first few hundred milliseconds, before the
 * first flag response lands, is not recorded. Being able to stop collection
 * from the console in under a minute is worth more than those, and the vitals
 * observers use `buffered: true` so the metrics from before the flag arrived
 * are not lost.
 *
 * The listeners themselves live in the composables. This file only decides
 * *when* they exist and wires up the two things only a plugin can reach: the
 * router, and Nuxt's own error hooks.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (typeof window === 'undefined') return

  const router = useRouter()

  /** The route's pattern, not the resolved URL — `/recipe-wrangler/[id]`, so
   *  one heatmap covers every recipe page and no id lands in the table. Same
   *  rule the page-view events already follow. */
  const patternOf = (route: { matched?: Array<{ path: string }>, path: string }): string => {
    const matched = route.matched ?? []
    return matched[matched.length - 1]?.path ?? route.path
  }
  setRoutePatternResolver(() => patternOf(router.currentRoute.value))

  installRumUnloadFlush()
  startCaptureFlags()

  /** Install whatever the gateway has just turned on. Installing is one-way
   *  and idempotent: a stream switched off later stops emitting, because every
   *  handler re-checks its flag, but the listeners stay put rather than being
   *  torn down and rebuilt each time an operator flips a switch. */
  const applyFlags = (state: Record<CaptureStream, boolean>) => {
    try {
      if (state.errors) installErrorCapture()
      if (state.interactions) installInteractionCapture()
      if (state.vitals) installWebVitals()
      if (anyCaptureEnabled()) installRumSession()
    } catch {
      // A capture module that cannot install is not a reason to stop the app.
    }
  }
  onCaptureFlagsChange(applyFlags)

  router.afterEach((to) => {
    try {
      const pattern = patternOf(to)
      // Ends the previous page view: closes any open click cluster and emits
      // its scroll depth, both of which belong to the page being left.
      notePageView(pattern)
      addBreadcrumb('nav', { path: pattern })
      // The session id rolls over on idle timeout and on a change of user, so
      // a long visit can need a second device row.
      void reportRumSession()
    } catch {
      // Navigation must never fail because monitoring did.
    }
  })

  // Vue's own channels. An error a component boundary caught never reaches
  // `window.onerror`, and those are most of the ones that break a page.
  nuxtApp.hook('vue:error', (error, _instance, info) => {
    reportVueError(error, info)
  })
  nuxtApp.hook('app:error', (error) => {
    reportVueError(error, 'app:error')
  })
})
