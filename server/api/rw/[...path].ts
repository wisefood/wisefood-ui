import { defineEventHandler, getQuery, getRouterParam, proxyRequest } from 'h3'
import { withQuery } from 'ufo'

/**
 * Dev/Nitro proxy to a local RecipeWrangler.
 *
 * `recipeWranglerApiUrl` points at the `/api/v1` base, which is where almost
 * everything lives. The catalog contract sits on `/api/v2`, and it is the only
 * place the annotation facets (cuisine, mood, flavour, food group) exist — they
 * are Elasticsearch-owned and no v1 route returns them. A path prefixed `v2/`
 * is rewritten onto that surface so both are reachable through one proxy and
 * one env var, rather than adding a second base URL that can drift out of step
 * with the first.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const base = String(config.public.recipeWranglerApiUrl || 'http://127.0.0.1:8001/api/v1').replace(/\/+$/, '')
  const path = String(getRouterParam(event, 'path') || '').replace(/^\/+/, '')

  const versioned = path.startsWith('v2/')
    ? { base: base.replace(/\/api\/v1$/, '/api/v2'), path: path.slice('v2/'.length) }
    : { base, path }

  const target = withQuery(`${versioned.base}/${versioned.path}`, getQuery(event))
  return proxyRequest(event, target)
})
