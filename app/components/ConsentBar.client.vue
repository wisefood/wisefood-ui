<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-4 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-4 opacity-0"
  >
    <div
      v-if="showBar"
      class="fixed left-0 right-(--wf-help-offset) bottom-0 z-[120] px-3 pb-3 sm:px-4 pointer-events-none"
    >
      <!--
        Announced as a dialog, because it asks for a decision. A plain div that
        appears at the foot of the page is invisible to a screen reader until
        the user happens to tab into it — which for a consent request means
        consent was asked for and never heard.
      -->
      <div
        class="pointer-events-auto mx-auto max-w-3xl rounded-xl bg-white/85 dark:bg-gray-900/85 backdrop-blur ring-1 ring-gray-200 dark:ring-gray-800 shadow-lg px-4 py-3"
        role="dialog"
        aria-live="polite"
        aria-labelledby="consent-bar-message"
      >
        <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <p
            id="consent-bar-message"
            class="flex-1 text-sm text-gray-700 dark:text-gray-300"
          >
            <UIcon
              name="i-lucide-cookie"
              class="h-4 w-4 shrink-0 inline-block align-[-2px] mr-1.5 text-gray-500 dark:text-gray-400"
            />
            {{ message }}
            <NuxtLink
              to="/privacy"
              class="underline underline-offset-2 font-medium hover:text-gray-900 dark:hover:text-white"
            >
              {{ t('consent.privacyPolicy') || 'Privacy Policy' }}
            </NuxtLink>
            <!--
              Named here rather than buried, because one Accept covers several
              purposes and all but the first can be withdrawn on their own. A
              consent nobody knew they gave is not a consent.
            -->
            <span class="block text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ note }}
            </span>
          </p>
          <UButton
            color="primary"
            size="sm"
            :loading="consentStore.accepting"
            class="cursor-pointer shrink-0 self-end sm:self-auto font-semibold"
            @click="handleAccept"
          >
            {{ t('consent.accept') || 'Accept' }}
          </UButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useConsentStore } from '@/stores/consent'
import { useI18n } from 'vue-i18n'
import { useGuestPromptPending } from '~/composables/useGuestPromptPending'

const { t } = useI18n()
const authStore = useAuthStore()
const consentStore = useConsentStore()
const guestPromptPending = useGuestPromptPending()

// Fetch the consent status once auth is ready (the keycloak plugin awaits
// authStore.initialize() before the app mounts, so this usually fires
// immediately; the watcher also covers late guest logins).
watch(
  () => (authStore.isAuthenticated ? authStore.user?.id : null),
  (userId) => {
    if (userId) consentStore.initialize()
  },
  { immediate: true }
)

/*
 * One consent for everything, worded for who is asked.
 *
 * A guest is not asked about research: their data is promised to expire, so
 * nothing of theirs may end up in a test set that outlives it — and the
 * gateway records their acceptance without it. An older gateway cannot store
 * research consent at all, so it is not asked for there either.
 */
const asksResearch = computed(() => !authStore.isGuest && consentStore.unified)

const message = computed(() => asksResearch.value
  ? t('consent.message')
  : t('consent.messageGuest'))

const note = computed(() => asksResearch.value
  ? t('consent.purposesNote')
  : t('consent.analyticsNote'))

// A guest's first minute belongs to the preferences wizard; the bar comes
// once that is answered, rather than stacked under a modal's footer.
const showBar = computed(
  () => authStore.isAuthenticated
    && consentStore.loaded
    && consentStore.needsConsent
    && !guestPromptPending.value
)

const handleAccept = async () => {
  try {
    await consentStore.accept()
  } catch {
    // Error already logged in the store; keep the bar visible so the
    // user can retry.
  }
}
</script>
