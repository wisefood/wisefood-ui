// Static import, not `await import()`.
//
// This file is only ever compiled when `@sentry/nuxt/module` is registered —
// nuxt.config gates that — so the dynamic import bought nothing the module
// registration was not already buying, and it cost the build: Nitro bundles
// the server entry with an es2019 target, where top-level await is a hard
// error. And because `isSentryEnabled` defaults to true for any non-dev
// command, that error fired on every `nuxt build` unless someone happened to
// set SENTRY_ENABLED=false.
//
// The runtime check below stays as the inner gate: the module can be on while
// this particular environment has no DSN to send to.
import * as Sentry from '@sentry/nuxt'

const sentryDsn = process.env.NUXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || ''

if (process.env.SENTRY_ENABLED === 'true' && sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.2
  })
}
