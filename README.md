<div align="center">

# WiseFood UI

**AI-powered food and nutrition insights — the WiseFood web client.**

[![Nuxt](https://img.shields.io/badge/Nuxt-4.2-00DC82?logo=nuxt&logoColor=white&labelColor=020420)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org)
[![Nuxt UI](https://img.shields.io/badge/Nuxt%20UI-4-00DC82?logo=nuxt&logoColor=white&labelColor=020420)](https://ui.nuxt.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Pinia](https://img.shields.io/badge/Pinia-3-FFD859?logo=vuedotjs&logoColor=black)](https://pinia.vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![pnpm](https://img.shields.io/badge/pnpm-10.23-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)
[![Node](https://img.shields.io/badge/Node-22-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Keycloak](https://img.shields.io/badge/Auth-Keycloak-4D4D4D?logo=keycloak&logoColor=white)](https://www.keycloak.org)
[![Sentry](https://img.shields.io/badge/Monitoring-Sentry-362D59?logo=sentry&logoColor=white)](https://sentry.io)
[![License](https://img.shields.io/badge/License-Apache%202.0-D22128?logo=apache&logoColor=white)](LICENSE)

</div>

---

## Overview

WiseFood UI is a [Nuxt 4](https://nuxt.com) single-page application that delivers
the WiseFood platform's food, recipe, and nutrition experiences. It is a
client-rendered SPA (SSR disabled for application routes), authenticated through
Keycloak, internationalised in four languages, and shipped as a static bundle
served by nginx behind a runtime-configuration layer so a single build can be
promoted across environments.

### Key features

- **Authentication** — Keycloak (OIDC) via `keycloak-js`, with a Pinia auth
  store, route middleware, and silent token refresh.
- **Console** — operations dashboard with content and observability analytics
  (catalog KPIs plus Langfuse-backed metrics, traces, and prompts).
- **FoodScholar** — catalog, guides, and textbook browsing.
- **Recipe Wrangler** — recipe collections, with a switchable local/REST backend.
- **FoodChat** — conversational food assistant.
- **Profiles & dashboard** — user profile management and household data.
- **Interactive walkthroughs** — [Flows.js](https://flows.sh) product tours and surveys.
- **Internationalisation** — English, Greek, Slovenian, and Hungarian.
- **Observability** — Sentry error reporting (client and server).

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Nuxt 4 · Vue 3.5 |
| UI | Nuxt UI 4 · Tailwind CSS 4 · Iconify (Lucide, Simple Icons) |
| State | Pinia |
| Auth | Keycloak (`keycloak-js`) |
| i18n | `vue-i18n` |
| Content | `marked` · `dompurify` · `pdfjs-dist` · `vue-pdf-embed` |
| Walkthroughs | `@flows/js` · `@flows/js-components` |
| Monitoring | Sentry (`@sentry/nuxt`) |
| Tooling | TypeScript · ESLint (`@nuxt/eslint`) · `vue-tsc` |
| Runtime | Node 22 · pnpm 10.23 |

## Prerequisites

- **Node.js 22+**
- **pnpm 10.23+** (the repo pins `pnpm@10.23.0` via `packageManager`;
  `corepack enable` will provision the correct version automatically)

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Configure your environment
cp .env.example .env
#    then edit .env for your environment

# 3. Start the development server (http://localhost:3000)
pnpm dev
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server on `http://localhost:3000`. |
| `pnpm build` | Build the application for production. |
| `pnpm preview` | Locally preview the production build. |
| `pnpm generate` | Pre-render the application as a static site. |
| `pnpm lint` | Run ESLint over the project. |
| `pnpm typecheck` | Type-check with `vue-tsc`. |

## Configuration

All runtime configuration is supplied through environment variables. Copy
[`.env.example`](.env.example) to `.env` and adjust the values — it documents
every variable the application reads.

Browser-facing values (`VITE_*`, `NUXT_PUBLIC_*`) must **never** contain
secrets. The only build-time secret is `SENTRY_AUTH_TOKEN`, used solely for
source-map upload.

### Environment variables

| Variable | Required | Default | Description |
| --- | :---: | --- | --- |
| `VITE_KEYCLOAK_URL` | ✓ | — | Keycloak server base URL. |
| `VITE_KEYCLOAK_REALM` | ✓ | — | Keycloak realm. |
| `VITE_KEYCLOAK_CLIENT_ID` | ✓ | — | Keycloak client id. |
| `VITE_KEYCLOAK_DEBUG` | | `false` | Log auth debug output to the console. |
| `VITE_WISEFOOD_API_URL` | ✓ | `…/dc/api` | Data Catalog API base URL. |
| `VITE_WISEFOOD_REST_API_URL` | ✓ | `…/rest/api/v1` | REST API (v1) base URL. |
| `VITE_RECIPE_WRANGLER_API_URL` | | — | Recipe Wrangler API base URL. |
| `VITE_RECIPE_WRANGLER_MODE` | | `auto` | Backend selection: `auto` · `local` · `rest`. |
| `VITE_FLOWS_ORG_ID` | | _empty_ | Flows.js organization id. Empty disables Flows. |
| `VITE_FLOWS_ENVIRONMENT` | | `production` | Flows.js environment key. |
| `NUXT_PUBLIC_SENTRY_DSN` | | _empty_ | Sentry DSN. Empty disables Sentry. |
| `SENTRY_ENABLED` | | _enabled except `dev`_ | Force-enable/disable Sentry (`true`/`false`). |
| `SENTRY_ORG` | | — | Sentry org (source-map upload). |
| `SENTRY_PROJECT` | | — | Sentry project (source-map upload). |
| `SENTRY_AUTH_TOKEN` | | — | **Secret.** Sentry token for source-map upload. |
| `NUXT_APP_BASE_URL` | | `/` | Base URL / context path the app is served under. |
| `NUXT_DEVTOOLS` | | `false` | Enable Nuxt Devtools. |

### Runtime configuration in production

The Docker image is a static bundle served by nginx. On container start,
[`docker-entrypoint.sh`](docker-entrypoint.sh) reads the environment and injects
the public values as `window.__RUNTIME_CONFIG__` into `index.html`. The
application prefers these runtime values and falls back to the build-time
config, so **the same image can be deployed to any environment without
rebuilding** — see [`app/utils/runtimeConfig.ts`](app/utils/runtimeConfig.ts).

> **Note:** Because production reads configuration at runtime, environment
> variables that must work in the container (Keycloak, the WiseFood APIs, Flows,
> Sentry) need to be present both in `.env` for local development **and** wired
> into the runtime-config injection. Flows, for example, stays inert until
> `VITE_FLOWS_ORG_ID` is provided.

## Project structure

```
app/
├── components/      # Vue components (incl. console/ analytics widgets)
├── composables/     # Reusable composition functions
├── i18n/            # vue-i18n setup and locale files (en, el, sl, hu)
├── layouts/         # auth, dashboard, default
├── middleware/      # auth, console, profile route guards
├── pages/           # Routed pages (console, foodscholar, recipe-wrangler, …)
├── plugins/         # Keycloak (01) and Flows (02) client plugins
├── services/        # API clients (Keycloak, observability)
├── stores/          # Pinia stores (auth, household)
└── utils/           # Helpers, incl. runtime-config resolution
docs/                # Design specs and implementation plans
server/              # Nitro server routes
Dockerfile           # Multi-stage build → nginx static serve
docker-entrypoint.sh # Runtime configuration injection
nginx.conf.template  # nginx configuration
```

## Internationalisation

The UI ships with four locales — English (`en`), Greek (`el`), Slovenian (`sl`),
and Hungarian (`hu`) — under [`app/i18n/locales`](app/i18n/locales). User-facing
strings should be added to every locale file and resolved through `vue-i18n`
rather than hard-coded.

## Deployment

The application is containerised with a multi-stage [`Dockerfile`](Dockerfile)
(Node 22 build → nginx 1.25 static serve, exposing port `80`).

```bash
# Build and push the image (see Makefile)
make build
make push
```

Runtime configuration is injected at container start; see
[Runtime configuration in production](#runtime-configuration-in-production).

## License

Licensed under the [Apache License 2.0](LICENSE). © 2025–2026 WiseFood.
