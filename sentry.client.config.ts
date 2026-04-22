import { sentryFeedbackOptions } from './app/utils/sentryFeedback'
import { getSentryDsn, isSentryEnabled } from './app/utils/runtimeConfig'

const sentryDsn = getSentryDsn()

if (isSentryEnabled() && sentryDsn) {
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
