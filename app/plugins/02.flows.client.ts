import { defineNuxtPlugin, navigateTo, useRuntimeConfig } from '#app'

import { init } from '@flows/js'
import { setupJsComponents } from '@flows/js-components'
import * as components from '@flows/js-components/components'
import * as tourComponents from '@flows/js-components/tour-components'
import * as surveyComponents from '@flows/js-components/survey-components'

import '@flows/js-components/index.css'

// Guard so init()/setupJsComponents() never run twice (HMR, re-invocation).
// Double-registration breaks the custom-element rendering.
let flowsInitialized = false

export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()
  const organizationId = config.public.flowsOrgId as string | undefined

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
    environment: (config.public.flowsEnvironment as string) || 'production',
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
