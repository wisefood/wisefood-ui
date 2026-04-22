import * as Sentry from '@sentry/nuxt'
import { sentryFeedbackOptions } from './app/utils/sentryFeedback'
import { getSentryDsn } from './app/utils/runtimeConfig'

const sentryDsn = getSentryDsn()

if (sentryDsn) {
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
}
