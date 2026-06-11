import { useRuntimeConfig } from '#imports'

const DEFAULT_WISEFOOD_API_URL = 'https://demo.wisefood-project.eu/dc/api'
const DEFAULT_WISEFOOD_REST_API_URL = 'https://demo.wisefood-project.eu/rest/api/v1'
const DEFAULT_RECIPE_WRANGLER_MODE = 'auto'
const DEFAULT_FLOWS_ENVIRONMENT = 'production'

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
