import { useRuntimeConfig } from '#imports'

const DEFAULT_WISEFOOD_API_URL = 'https://demo.wisefood-project.eu/dc/api'
const DEFAULT_WISEFOOD_REST_API_URL = 'https://demo.wisefood-project.eu/rest/api/v1'
const DEFAULT_RECIPE_WRANGLER_MODE = 'auto'
const DEFAULT_FLOWS_ENVIRONMENT = 'production'
// Flows' real data API. The SDK builds requests as `new URL('/v2/sdk/...', apiUrl)`,
// which discards any path on apiUrl — so apiUrl must be an ORIGIN (scheme+host),
// and the proxy must live at the /v2/sdk/* paths the SDK actually requests. When
// no override is set we default apiUrl to our own origin (window.location.origin)
// and reverse-proxy /v2/sdk/* to this upstream. Routing through our own origin
// keeps the requests first-party so Brave Shields / Firefox ETP don't block them
// as a third-party tracker (which left a blur overlay with no content).
const FLOWS_UPSTREAM_ORIGIN = 'https://api.flows-cloud.com'

export type RecipeWranglerMode = 'auto' | 'local' | 'rest'

interface RuntimeConfigWindow extends Window {
  __RUNTIME_CONFIG__?: {
    wisefoodApiUrl?: string
    wisefoodRestApiUrl?: string
    recipeWranglerApiUrl?: string
    recipeWranglerMode?: string
    sentryDsn?: string
    sentryEnabled?: boolean | string
    flowsOrgId?: string
    flowsEnvironment?: string
    flowsApiUrl?: string
  }
}

const normalizeBaseUrl = (url: string): string => url.replace(/\/+$/, '')

const normalizeRecipeWranglerMode = (mode?: string | null): RecipeWranglerMode => {
  const normalized = String(mode || '').trim().toLowerCase()

  if (['local', 'proxy', 'local-proxy'].includes(normalized)) {
    return 'local'
  }

  if (['rest', 'wisefood-rest', 'remote', 'production'].includes(normalized)) {
    return 'rest'
  }

  return 'auto'
}

const getWindowRuntimeConfig = () => {
  if (typeof window === 'undefined') return null
  return (window as RuntimeConfigWindow).__RUNTIME_CONFIG__ || null
}

export const getWisefoodApiUrl = (): string => {
  const runtimeConfig = getWindowRuntimeConfig()
  const config = useRuntimeConfig()
  const url = runtimeConfig?.wisefoodApiUrl || (config.public.wisefoodApiUrl as string) || DEFAULT_WISEFOOD_API_URL
  return normalizeBaseUrl(url)
}

export const getWisefoodRestApiUrl = (): string => {
  const runtimeConfig = getWindowRuntimeConfig()
  const config = useRuntimeConfig()
  const url = runtimeConfig?.wisefoodRestApiUrl || (config.public.wisefoodRestApiUrl as string) || DEFAULT_WISEFOOD_REST_API_URL
  return normalizeBaseUrl(url)
}

export const getRecipeWranglerMode = (): RecipeWranglerMode => {
  const runtimeConfig = getWindowRuntimeConfig()
  const config = useRuntimeConfig()
  const mode = runtimeConfig?.recipeWranglerMode || (config.public.recipeWranglerMode as string) || DEFAULT_RECIPE_WRANGLER_MODE
  return normalizeRecipeWranglerMode(mode)
}

export const getSentryDsn = (): string => {
  const runtimeConfig = getWindowRuntimeConfig()
  const config = useRuntimeConfig()
  return String(runtimeConfig?.sentryDsn || config.public.sentryDsn || '')
}

export const isSentryEnabled = (): boolean => {
  const runtimeConfig = getWindowRuntimeConfig()
  const config = useRuntimeConfig()
  const value = runtimeConfig?.sentryEnabled ?? config.public.sentryEnabled

  return value === true || value === 'true'
}

export const getFlowsOrgId = (): string => {
  const runtimeConfig = getWindowRuntimeConfig()
  const config = useRuntimeConfig()
  return String(runtimeConfig?.flowsOrgId || config.public.flowsOrgId || '').trim()
}

export const getFlowsEnvironment = (): string => {
  const runtimeConfig = getWindowRuntimeConfig()
  const config = useRuntimeConfig()
  const value = String(runtimeConfig?.flowsEnvironment || config.public.flowsEnvironment || '').trim()
  return value || DEFAULT_FLOWS_ENVIRONMENT
}

// URL passed to Flows' init({ apiUrl }). Defaults to our own origin so the SDK's
// /v2/sdk/* requests are same-origin and get reverse-proxied to the real Flows
// API (nginx in prod, Nitro route rule in dev) — keeping them first-party so
// tracker blockers don't break them. Can be overridden to an absolute URL via
// VITE_FLOWS_API_URL (e.g. to hit Flows directly and bypass the proxy).
export const getFlowsApiUrl = (): string => {
  const runtimeConfig = getWindowRuntimeConfig()
  const config = useRuntimeConfig()
  const override = String(runtimeConfig?.flowsApiUrl || config.public.flowsApiUrl || '').trim()
  if (override) return normalizeBaseUrl(override)

  // Same-origin proxy. Must be an absolute origin because the SDK does
  // `new URL('/v2/sdk/...', apiUrl)`, which requires an absolute base.
  if (typeof window !== 'undefined') return window.location.origin

  // SSR/fallback: the plugin is client-only, so this is effectively unused, but
  // return the upstream directly rather than an invalid relative value.
  return FLOWS_UPSTREAM_ORIGIN
}
