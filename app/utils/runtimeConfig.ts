const DEFAULT_WISEFOOD_API_URL = 'https://wisefood.gr/dc/api'
const DEFAULT_WISEFOOD_REST_API_URL = 'https://wisefood.gr/rest/api/v1'

interface RuntimeConfigWindow extends Window {
  __RUNTIME_CONFIG__?: {
    wisefoodApiUrl?: string
    wisefoodRestApiUrl?: string
  }
}

const normalizeBaseUrl = (url: string): string => url.replace(/\/+$/, '')

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
