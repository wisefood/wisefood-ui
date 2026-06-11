import { defineNuxtPlugin, navigateTo } from '#app'

import { init } from '@flows/js'
import { setupJsComponents } from '@flows/js-components'
import * as components from '@flows/js-components/components'
import * as tourComponents from '@flows/js-components/tour-components'
import * as surveyComponents from '@flows/js-components/survey-components'

import '@flows/js-components/index.css'

import { getFlowsEnvironment, getFlowsOrgId } from '~/utils/runtimeConfig'

// Guard so init()/setupJsComponents() never run twice (HMR, re-invocation).
// Double-registration breaks the custom-element rendering.
let flowsInitialized = false

export default defineNuxtPlugin(async () => {
  // Read via the runtime-config helper so the org id resolves from the
  // container-injected __RUNTIME_CONFIG__ in production, not just the
  // build-time value baked into the static bundle.
  const organizationId = getFlowsOrgId()

  // No org id configured -> Flows is disabled. Never breaks the app.
  if (!organizationId) return
  if (flowsInitialized) return

  // 01.keycloak.client.ts already awaited initialize(); this is idempotent
  // and just guarantees the user is resolved before we identify them to Flows.
  const authStore = useAuthStore()
  await authStore.initialize()

  // Only run walkthroughs for authenticated users (per design).
  if (!authStore.isAuthenticated) return

  const userId = authStore.user?.id
  if (!userId) return

  flowsInitialized = true

  init({
    organizationId,
    userId,
    environment: getFlowsEnvironment(),
    onNavigate: (href, event) => {
      event.preventDefault()
      navigateTo(href)
    }
  })

  setupJsComponents({
    components: { ...components },
    tourComponents: { ...tourComponents },
    surveyComponents: { ...surveyComponents }
  })
})
