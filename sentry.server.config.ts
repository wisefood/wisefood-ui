import * as Sentry from '@sentry/nuxt'

const sentryDsn = process.env.NUXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || ''

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.2
  })
}
