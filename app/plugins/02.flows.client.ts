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

// Computes Flows user properties describing the selected member's nutrition
// profile, used to target the preferences-setup tour. Returns an empty object
// on any failure so Flows still initializes.
async function resolveNutritionProfileProperties(): Promise<Record<string, boolean>> {
  try {
    const householdStore = useHouseholdStore()
    await householdStore.initialize()

    const member = householdStore.currentMember
    if (!member?.id) return {}

    const profile = await householdStore.getMemberProfile(member.id)
    if (!profile) {
      // No profile row yet => nothing set up.
      return { hasDietGroup: false, nutritionProfileComplete: false }
    }

    const hasDietGroup = (profile.dietary_groups?.length ?? 0) > 0
    const prefs = profile.nutritional_preferences
    const hasPreferences =
      (profile.allergies?.length ?? 0) > 0 ||
      (prefs?.food_likes?.length ?? 0) > 0 ||
      (prefs?.food_dislikes?.length ?? 0) > 0

    return {
      hasDietGroup,
      // "Complete enough" to not re-prompt: the user has added at least one
      // allergy, like, or dislike. The tour targets hasDietGroup && !complete.
      nutritionProfileComplete: hasPreferences
    }
  } catch (err) {
    console.warn('[Flows] Could not resolve nutrition-profile properties:', err)
    return {}
  }
}

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

  // Derive nutrition-profile targeting properties for the selected member.
  // The "set up your preferences" tour targets members who have a diet group
  // but no other preferences yet; these flags let the workflow start block
  // target the right users and stop replaying once preferences are filled.
  // Best-effort only: any failure here must never block Flows init.
  const userProperties = await resolveNutritionProfileProperties()

  init({
    organizationId,
    userId,
    environment: getFlowsEnvironment(),
    userProperties,
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
