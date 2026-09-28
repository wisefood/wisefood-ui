import { sentryFeedbackOptions } from '~/utils/sentryFeedback'
import { getSentryDsn, isSentryEnabled } from '~/utils/runtimeConfig'

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

/**
 * The Sentry bug-report form, opened on demand.
 *
 * The form is created lazily on the first request and reused after that;
 * its colour scheme follows the app's. `enabled` is false when Sentry is off
 * for this build, and every call is then a no-op.
 */
export function useSentryFeedback() {
  const colorMode = useColorMode()
  const enabled = computed(() => isSentryEnabled() && Boolean(getSentryDsn()))

  function getSentryModule() {
    if (!enabled.value) return null
    if (sentryModule) return sentryModule
    sentryModule = window.__WISEFOOD_SENTRY__ || null
    return sentryModule
  }

  function getFeedbackSafely(Sentry: SentryModule) {
    try {
      return Sentry.getFeedback()
    } catch {
      return undefined
    }
  }

  function getOrCreateFeedback(Sentry: SentryModule) {
    let feedback = getFeedbackSafely(Sentry)
    if (!feedback) {
      try {
        Sentry.addIntegration(Sentry.feedbackIntegration(sentryFeedbackOptions))
        feedback = getFeedbackSafely(Sentry)
      } catch {
        return null
      }
    }
    return feedback
  }

  function getFeedbackColorScheme() {
    if (colorMode.value === 'dark') return 'dark'
    if (colorMode.value === 'light') return 'light'
    return 'system'
  }

  function syncFeedbackTheme(Sentry = sentryModule) {
    if (!enabled.value) return
    try {
      if (Sentry) getFeedbackSafely(Sentry)?.setTheme(getFeedbackColorScheme())
    } catch {
      // Sentry feedback is optional; never block the app on theme sync.
    }
  }

  async function open() {
    if (!enabled.value) return

    const Sentry = getSentryModule()
    if (!Sentry) return

    const feedback = getOrCreateFeedback(Sentry)
    if (!feedback) return

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

  watchEffect(() => syncFeedbackTheme())

  return { enabled, open }
}
