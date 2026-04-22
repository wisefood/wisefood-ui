const sentryDsn = process.env.NUXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || ''

if (process.env.SENTRY_ENABLED === 'true' && sentryDsn) {
  const Sentry = await import('@sentry/nuxt')

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.2
  })
}
