<template>
  <div v-if="sentryEnabled" class="fixed bottom-5 right-5 z-50">
    <UButton
      color="primary"
      variant="solid"
      size="lg"
      icon="i-lucide-bug"
      class="rounded-full shadow-lg shadow-brand-500/25 hover:shadow-brand-500/35"
      aria-label="Report a bug"
      @click="openFeedback"
    />
  </div>
</template>

<script setup lang="ts">
import { sentryFeedbackOptions } from '~/utils/sentryFeedback'
import { getSentryDsn, isSentryEnabled } from '~/utils/runtimeConfig'

const colorMode = useColorMode()
const sentryEnabled = computed(() => isSentryEnabled() && Boolean(getSentryDsn()))

interface SentryFeedback {
  createForm: () => Promise<{ appendToDom: () => void, open: () => void }>
  setTheme: (colorScheme: 'light' | 'dark' | 'system') => void
}

interface SentryModule {
  getFeedback: () => SentryFeedback | undefined
  addIntegration: (integration: unknown) => void
  feedbackIntegration: (options: typeof sentryFeedbackOptions) => unknown
}

declare global {
  interface Window {
    __WISEFOOD_SENTRY__?: SentryModule
  }
}

let sentryModule: SentryModule | null = null
let dialog: { appendToDom: () => void, open: () => void } | null = null

async function openFeedback() {
  if (!sentryEnabled.value) {
    return
  }

  const Sentry = await getSentryModule()
  if (!Sentry) {
    return
  }

  const feedback = getOrCreateFeedback(Sentry)
  if (!feedback) {
    return
  }

  syncFeedbackTheme(Sentry)

  if (dialog) {
    dialog.open()
    return
  }

  try {
    dialog = await feedback.createForm()
    dialog.appendToDom()
    dialog.open()
  } catch {
    // feedbackIntegration not available in this build variant
  }
}

async function getSentryModule() {
  if (!sentryEnabled.value) {
    return null
  }

  if (sentryModule) {
    return sentryModule
  }

  sentryModule = window.__WISEFOOD_SENTRY__ || null
  return sentryModule
}

function getOrCreateFeedback(Sentry: SentryModule) {
  let feedback = getFeedbackSafely(Sentry)

  if (!feedback) {
    try {
      Sentry.addIntegration(
        Sentry.feedbackIntegration(sentryFeedbackOptions)
      )
      feedback = getFeedbackSafely(Sentry)
    } catch {
      return null
    }
  }

  return feedback
}

function getFeedbackSafely(Sentry: SentryModule) {
  try {
    return Sentry.getFeedback()
  } catch {
    return undefined
  }
}

function getFeedbackColorScheme() {
  if (colorMode.value === 'dark') {
    return 'dark'
  }

  if (colorMode.value === 'light') {
    return 'light'
  }

  return 'system'
}

function syncFeedbackTheme(Sentry = sentryModule) {
  if (!sentryEnabled.value) {
    return
  }

  try {
    Sentry && getFeedbackSafely(Sentry)?.setTheme(getFeedbackColorScheme())
  } catch {
    // Sentry feedback is optional; never block the app on theme sync.
  }
}

watchEffect(() => syncFeedbackTheme())
</script>
