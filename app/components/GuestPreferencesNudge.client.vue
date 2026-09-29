<!--
  The invitation a guest gets, once, to say what they like.

  A guest arrives with an empty profile, so everything the platform suggests
  is generic until they say otherwise — and most never find the profile page.
  This is a small card at the foot of the screen, offered after their first
  page rather than on it: the first page is where they are still finding
  their feet, and a prompt there is one more thing in the way.

  It shows once per guest session and never again after "Not now", after the
  wizard is saved, or when the profile already has preferences on it (some
  guests do go to the profile page). Session storage, like the guest session
  itself, so the next visitor at the same booth gets a fresh start. Waits
  for the consent bar to be answered — two decisions stacked at the bottom of
  a phone is a wall.
-->
<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-4 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-4 opacity-0"
  >
    <!-- Below `lg` the floating dock is one button in the bottom-left corner
         (left 1.25rem, 3rem wide); the card starts to its right so the two
         never sit on top of each other. -->
    <div
      v-if="visible"
      class="fixed inset-x-0 bottom-0 z-[110] pl-[4.75rem] pr-3 lg:px-4 pb-[max(0.75rem,var(--wf-safe-bottom))] pointer-events-none"
    >
      <div
        class="pointer-events-auto mx-auto max-w-xl rounded-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur ring-1 ring-gray-200 dark:ring-gray-800 shadow-lg px-4 py-3"
        role="dialog"
        aria-live="polite"
        aria-labelledby="guest-preferences-nudge-title"
      >
        <div class="flex items-start gap-3">
          <div class="shrink-0 w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
            <UIcon
              name="i-lucide-sparkles"
              class="w-5 h-5 text-brand-500"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p
              id="guest-preferences-nudge-title"
              class="text-sm font-medium text-gray-900 dark:text-white"
            >
              {{ t('preferencesWizard.nudge.title') }}
            </p>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {{ t('preferencesWizard.nudge.body') }}
            </p>
          </div>
        </div>
        <div class="mt-3 flex items-center justify-end gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            class="cursor-pointer pointer-coarse:min-h-11"
            data-flows="guest-preferences-not-now"
            @click="dismiss"
          >
            {{ t('preferencesWizard.nudge.notNow') }}
          </UButton>
          <UButton
            color="primary"
            size="sm"
            icon="i-lucide-sparkles"
            class="cursor-pointer font-semibold pointer-coarse:min-h-11"
            data-flows="guest-preferences-start"
            @click="start"
          >
            {{ t('preferencesWizard.nudge.start') }}
          </UButton>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Rendered beside the card rather than inside the `v-if`, so it stays
       mounted while the card hides behind it. -->
  <ProfileFoodPreferencesWizard
    v-if="memberId"
    v-model:open="wizardOpen"
    :member-id="memberId"
    source="nudge"
    @complete="onComplete"
    @dismiss="onWizardDismissed"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useConsentStore } from '@/stores/consent'
import { useHouseholdStore } from '@/stores/household'
import { track } from '~/composables/useTelemetry'
import householdsApi from '~/services/householdsApi'

const STORAGE_KEY = 'wisefood_guest_preferences_nudge'

/** Pages a guest actually uses the product on. Only these count as an encounter. */
const APP_PATHS = ['/dashboard', '/foodchat', '/recipe-wrangler', '/foodscholar', '/library', '/my-profile']

interface NudgeState {
  /** Distinct app pages this guest has opened, in order. */
  seen: string[]
  outcome: 'open' | 'dismissed' | 'done'
}

function loadState(): NudgeState {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<NudgeState>
      return {
        seen: Array.isArray(parsed.seen) ? parsed.seen.filter(p => typeof p === 'string') : [],
        outcome: parsed.outcome === 'dismissed' || parsed.outcome === 'done' ? parsed.outcome : 'open'
      }
    }
  } catch {
    // Private mode or blocked storage: the nudge still works for this page.
  }
  return { seen: [], outcome: 'open' }
}

function persist(state: NudgeState) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Same as above — a lost record means at worst one extra nudge.
  }
}

const { t } = useI18n()
const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()
const consentStore = useConsentStore()
const householdStore = useHouseholdStore()

const state = ref<NudgeState>(loadState())
/** null until the profile has been looked at. */
const hasPreferences = ref<boolean | null>(null)
const wizardOpen = ref(false)

const memberId = computed(() => authStore.guestMemberId ?? householdStore.currentMember?.id ?? null)
const isAppPage = computed(() => APP_PATHS.some(p => route.path === p || route.path.startsWith(`${p}/`)))

// "After the first encounter" is the second distinct app page. The first is
// wherever they landed, and they are still working out what it is.
watch(() => route.path, (path) => {
  if (!authStore.isGuest || !isAppPage.value) return
  if (!state.value.seen.includes(path)) {
    state.value = { ...state.value, seen: [...state.value.seen, path].slice(-20) }
    persist(state.value)
  }
}, { immediate: true })

const eligible = computed(() =>
  authStore.isGuest
  && !!memberId.value
  && state.value.outcome === 'open'
  && state.value.seen.length >= 2
  && isAppPage.value
  && consentStore.loaded
  && !consentStore.needsConsent
)

// Only once it is worth asking, look at the profile. A guest who already
// filled things in from the profile page is not asked to do it again.
watch(eligible, async (yes) => {
  if (!yes || hasPreferences.value !== null || !memberId.value) return
  try {
    const response = await householdsApi.getMemberProfile(memberId.value)
    const profile = response.result
    const prefs = profile?.nutritional_preferences
    hasPreferences.value = (profile?.allergies?.length ?? 0) > 0
      || (prefs?.food_likes?.length ?? 0) > 0
      || (prefs?.food_dislikes?.length ?? 0) > 0
  } catch {
    // No profile row yet: nothing is set, which is exactly who this is for.
    hasPreferences.value = false
  }
  if (hasPreferences.value) setOutcome('done')
}, { immediate: true })

const visible = computed(() => eligible.value && hasPreferences.value === false && !wizardOpen.value)

function setOutcome(outcome: NudgeState['outcome']) {
  state.value = { ...state.value, outcome }
  persist(state.value)
}

function dismiss() {
  setOutcome('dismissed')
  track('preferences.dismissed', { source: 'nudge', pages: state.value.seen.length })
}

function start() {
  wizardOpen.value = true
}

// Closing the wizard unsaved is "not now" too; it is not offered again.
function onWizardDismissed() {
  if (state.value.outcome !== 'open') return
  setOutcome('dismissed')
  track('preferences.dismissed', { source: 'wizard', pages: state.value.seen.length })
}

function onComplete() {
  setOutcome('done')
  toast.add({
    title: t('preferencesWizard.savedTitle'),
    description: t('preferencesWizard.savedBody'),
    color: 'success',
    icon: 'i-lucide-check'
  })
}
</script>
