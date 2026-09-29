<!--
  The preferences wizard, opened by itself when a guest lands on the dashboard.

  A guest arrives as "Guest" with an empty profile, so the greeting is
  nobody's and everything the platform suggests is generic until they say
  otherwise — and most never find the profile page.
  So the dashboard, the one page every guest lands on, opens the wizard for
  them: once per guest session, only while the profile is still empty, and
  before the consent bar, which holds back until this is answered (two things
  asking at once is a wall, and this is the one worth answering first).
  "Skip for now" closes it for the session; Quick setup on My Profile brings
  it back. Session storage, like the guest session itself, so the next
  visitor at the same booth gets a fresh start.
-->
<template>
  <ProfileFoodPreferencesWizard
    v-if="memberId"
    v-model:open="wizardOpen"
    :member-id="memberId"
    source="auto"
    skippable
    ask-name
    @complete="onComplete"
    @dismiss="onDismiss"
  />
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useHouseholdStore } from '@/stores/household'
import { track } from '~/composables/useTelemetry'
import { useGuestPromptPending } from '~/composables/useGuestPromptPending'
import householdsApi from '~/services/householdsApi'

const STORAGE_KEY = 'wisefood_guest_preferences_prompt'

type Outcome = 'open' | 'dismissed' | 'done'

function loadOutcome(): Outcome {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw === 'dismissed' || raw === 'done' ? raw : 'open'
  } catch {
    // Private mode or blocked storage: at worst the wizard is offered again.
    return 'open'
  }
}

function saveOutcome(outcome: Outcome) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, outcome)
  } catch {
    // Same as above.
  }
}

const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()
const householdStore = useHouseholdStore()
const promptPending = useGuestPromptPending()

const outcome = ref<Outcome>(loadOutcome())
/** null until the profile has been looked at. */
const hasPreferences = ref<boolean | null>(null)
const wizardOpen = ref(false)
let openTimer: ReturnType<typeof setTimeout> | undefined

const memberId = computed(() => authStore.guestMemberId ?? householdStore.currentMember?.id ?? null)

const eligible = computed(() =>
  authStore.isGuest
  && !!memberId.value
  && outcome.value === 'open'
)

// The consent bar waits on this: from "will open" until answered or found
// unnecessary. Cleared on the way out, so leaving the dashboard mid-wizard
// does not leave the bar held back on the next page.
watchEffect(() => {
  promptPending.value = eligible.value && hasPreferences.value !== true
})

watch(eligible, async (yes) => {
  if (!yes || !memberId.value) return

  // A guest who already filled things in from the profile page is not asked
  // to do it again. A member with no profile row yet gets a 404, which is
  // exactly the "nothing set" this is for.
  if (hasPreferences.value === null) {
    try {
      const response = await householdsApi.getMemberProfile(memberId.value)
      const profile = response.result
      const prefs = profile?.nutritional_preferences
      hasPreferences.value = (profile?.allergies?.length ?? 0) > 0
        || (prefs?.food_likes?.length ?? 0) > 0
        || (prefs?.food_dislikes?.length ?? 0) > 0
    } catch {
      hasPreferences.value = false
    }
  }
  if (hasPreferences.value) {
    setOutcome('done')
    return
  }

  // Let the dashboard paint first: a dialog that beats the page it sits on
  // is disorienting, and the eligibility may have changed by then.
  if (openTimer) clearTimeout(openTimer)
  openTimer = setTimeout(() => {
    if (eligible.value) wizardOpen.value = true
  }, 400)
}, { immediate: true })

onUnmounted(() => {
  if (openTimer) clearTimeout(openTimer)
  promptPending.value = false
})

function setOutcome(next: Outcome) {
  outcome.value = next
  saveOutcome(next)
}

function onDismiss() {
  if (outcome.value !== 'open') return
  setOutcome('dismissed')
  track('preferences.dismissed', { source: 'auto' })
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
