import { defineNuxtPlugin, navigateTo } from '#app'

import { addFloatingBlocksChangeListener, getCurrentFloatingBlocks, init } from '@flows/js'
import type { ActiveBlock, FlowsOptions, Locale } from '@flows/js'
import { setupJsComponents } from '@flows/js-components'
import * as components from '@flows/js-components/components'
import * as tourComponents from '@flows/js-components/tour-components'
import * as surveyComponents from '@flows/js-components/survey-components'

import '@flows/js-components/index.css'

import { getFlowsApiUrl, getFlowsEnvironment, getFlowsOrgId } from '~/utils/runtimeConfig'
import { markWalkthroughsReady } from '~/composables/useWalkthroughs'
import { isClickmapBackdrop } from '~/utils/clickmapBackdrop'

// Guard so init()/setupJsComponents() never run twice (HMR, re-invocation).
// Double-registration breaks the custom-element rendering.
let flowsInitialized = false

// Tour steps reach the renderer keyed by their tour (tourBlockId), so two
// Tooltip steps in a row reuse one element and only its properties change.
// The built-in Tooltip looks its target up once, when it connects
// (@flows/js-components 2.10.0 through 2.10.6), so every later step kept
// pointing at the first step's element: the text changed, the arrow and the
// highlight stayed where they were. Without tourBlockId the renderer keys each
// step by its own id, so every step mounts a fresh element that finds its own
// target.
function keyStepsByOwnId(blocks: ActiveBlock[]): ActiveBlock[] {
  return blocks.map(block =>
    block.type === 'tour-component' && block.tourBlockId
      ? { ...block, tourBlockId: undefined }
      : block
  )
}

// Tours are written in English (the organisation's default language group)
// and translated into the other UI languages in Flows; a step without a
// translation falls back to English. Same cookie and same locales as
// plugins/i18n.ts, which runs after this plugin.
const TOUR_LANGUAGES: readonly Locale[] = ['en', 'hu', 'sl']

function tourLanguage(locale: unknown): Locale {
  return TOUR_LANGUAGES.find(language => language === locale) ?? 'en'
}

// What this plugin reads of the vue-i18n instance plugins/i18n.ts provides.
// That plugin runs after this one, so its provide is untyped here.
type ProvidedI18n = { global: { locale: { value: string } } }

// Computes Flows user properties describing the selected member's nutrition
// profile, used to target the preferences-setup tour. Returns an empty object
// on any failure so Flows still initializes.
async function resolveNutritionProfileProperties(): Promise<Record<string, boolean>> {
  try {
    const householdStore = useHouseholdStore()
    await householdStore.initialize()

    const member = householdStore.currentMember
    if (!member?.id) return {}

    // A member with no profile row yet returns 404 from GET .../profile, which
    // the API service throws. That 404 IS the "nothing set up" signal, so treat
    // it as an empty profile rather than letting it fall to the catch below
    // (which would set no properties and the start-block targeting nothing).
    let profile
    try {
      profile = await householdStore.getMemberProfile(member.id)
    } catch (err) {
      const status = (err as { status?: number })?.status
      if (status === 404) {
        return { hasDietGroup: false, nutritionProfileComplete: false }
      }
      throw err
    }
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

export default defineNuxtPlugin(async (nuxtApp) => {
  // Read via the runtime-config helper so the org id resolves from the
  // container-injected __RUNTIME_CONFIG__ in production, not just the
  // build-time value baked into the static bundle.
  const organizationId = getFlowsOrgId()

  // No org id configured -> Flows is disabled. Never breaks the app.
  if (!organizationId) return
  // A tour starting inside the click map's backdrop would sit on the map.
  if (isClickmapBackdrop()) return
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

  let options: FlowsOptions = {
    organizationId,
    userId,
    environment: getFlowsEnvironment(),
    userProperties,
    language: tourLanguage(useCookie<string | undefined>('wisefood_locale').value),
    // Route the data API through our own origin (proxy) so privacy browsers
    // (Brave Shields, Firefox ETP) don't block it as a third-party tracker.
    apiUrl: getFlowsApiUrl(),
    onNavigate: (href, event) => {
      event.preventDefault()
      navigateTo(href)
    }
  }
  init(options)

  // Switching language in the header switches the tours too: init() again
  // reconnects and fetches the blocks in the new language, and a tour in
  // progress keeps its step (its state lives in Flows, not here). Not
  // immediate: the cookie above already gave the starting language.
  nuxtApp.hook('app:mounted', () => {
    const i18n = nuxtApp.$i18n as ProvidedI18n
    watch(() => i18n.global.locale.value, (locale) => {
      const language = tourLanguage(locale)
      if (language === options.language) return
      options = { ...options, language }
      init(options)
    })
  })

  setupJsComponents({
    components: { ...components },
    tourComponents: { ...tourComponents },
    surveyComponents: { ...surveyComponents },
    getCurrentFloatingBlocks: () => keyStepsByOwnId(getCurrentFloatingBlocks()),
    addFloatingBlocksChangeListener: listener =>
      addFloatingBlocksChangeListener(blocks => listener(keyStepsByOwnId(blocks)))
  })

  // The help panel's "Show me" buttons start tours from their manual start
  // blocks; they stay hidden until this point.
  markWalkthroughsReady()
})
