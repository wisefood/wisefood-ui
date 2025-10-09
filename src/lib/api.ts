import { createApiClient } from '@/lib/apiClient'
const base = (import.meta.env.VITE_WISEFOOD_API_URL || '').replace(/\/+$/, '') + '/api/v1'
export const api = createApiClient(base)