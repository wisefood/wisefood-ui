import { defineEventHandler, getQuery, getRouterParam, proxyRequest } from 'h3'
import { withQuery } from 'ufo'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const base = String(config.public.recipeWranglerApiUrl || 'http://127.0.0.1:8001/api/v1').replace(/\/+$/, '')
  const path = String(getRouterParam(event, 'path') || '').replace(/^\/+/, '')
  const target = withQuery(`${base}/${path}`, getQuery(event))
  return proxyRequest(event, target)
})
