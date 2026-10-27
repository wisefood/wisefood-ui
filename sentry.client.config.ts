import { sentryFeedbackOptions } from './app/utils/sentryFeedback'
import { getSentryDsn, isSentryEnabled } from './app/utils/runtimeConfig'
import { isClickmapBackdrop } from './app/utils/clickmapBackdrop'

const sentryDsn = getSentryDsn()

// Not behind a click map: it would replay an expert's look at a map as a
// visitor's session on that page.
if (isSentryEnabled() && sentryDsn && !isClickmapBackdrop()) {
  const Sentry = await import('@sentry/nuxt')

  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false
      }),
      Sentry.feedbackIntegration(sentryFeedbackOptions)
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    sendDefaultPii: true
  })

  ;(window as Window & { __WISEFOOD_SENTRY__?: unknown }).__WISEFOOD_SENTRY__ = Sentry
}
