<template>
  <div class="fixed bottom-5 right-5 z-50">
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

const colorMode = useColorMode()

let dialog: { appendToDom: () => void, open: () => void } | null = null

async function openFeedback() {
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
  let feedback = Sentry.getFeedback()

  if (!feedback) {
    Sentry.addIntegration(
      Sentry.feedbackIntegration(sentryFeedbackOptions)
    )
    feedback = Sentry.getFeedback()
  }

  return feedback
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
  Sentry.getFeedback()?.setTheme(getFeedbackColorScheme())
}

watchEffect(syncFeedbackTheme)
</script>
