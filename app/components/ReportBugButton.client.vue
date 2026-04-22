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
import * as Sentry from '@sentry/nuxt'
import { sentryFeedbackOptions } from '~/utils/sentryFeedback'
import { getSentryDsn } from '~/utils/runtimeConfig'

const colorMode = useColorMode()
const sentryEnabled = computed(() => Boolean(getSentryDsn()))

let dialog: { appendToDom: () => void, open: () => void } | null = null

async function openFeedback() {
  if (!sentryEnabled.value) {
    return
  }

  const feedback = getOrCreateFeedback()
  if (!feedback) {
    return
  }

  syncFeedbackTheme()

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

function getOrCreateFeedback() {
  if (!sentryEnabled.value) {
    return null
  }

  let feedback = getFeedbackSafely()

  if (!feedback) {
    try {
      Sentry.addIntegration(
        Sentry.feedbackIntegration(sentryFeedbackOptions)
      )
      feedback = getFeedbackSafely()
    } catch {
      return null
    }
  }

  return feedback
}

function getFeedbackSafely() {
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

function syncFeedbackTheme() {
  if (!sentryEnabled.value) {
    return
  }

  try {
    getFeedbackSafely()?.setTheme(getFeedbackColorScheme())
  } catch {
    // Sentry feedback is optional; never block the app on theme sync.
  }
}

watchEffect(syncFeedbackTheme)
</script>
