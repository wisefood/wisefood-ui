import { defineNuxtPlugin } from '#imports'
import { installTroubleWatch, noteVueTrouble } from '~/composables/useTroubleSignal'
import { getWisefoodApiUrl, getWisefoodRestApiUrl } from '~/utils/runtimeConfig'
import { isClickmapBackdrop } from '~/utils/clickmapBackdrop'

/**
 * Watch for the failures worth offering a bug report over.
 *
 * Unconditional, unlike the RUM streams in `05.rum.client.ts`: this records
 * nothing and sends nothing, it only decides when the floating dock should
 * offer the report form. The origins are resolved here because the fetch
 * wrapper runs outside any Nuxt context.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (typeof window === 'undefined') return
  // Nobody is there to be offered a bug report.
  if (isClickmapBackdrop()) return

  let recipeWranglerApiUrl: string | undefined
  try {
    recipeWranglerApiUrl = (window as Window & { __RUNTIME_CONFIG__?: { recipeWranglerApiUrl?: string } })
      .__RUNTIME_CONFIG__?.recipeWranglerApiUrl
  } catch {
    recipeWranglerApiUrl = undefined
  }

  installTroubleWatch([getWisefoodApiUrl(), getWisefoodRestApiUrl(), recipeWranglerApiUrl])

  nuxtApp.hook('vue:error', (error) => {
    noteVueTrouble(error)
  })
  nuxtApp.hook('app:error', (error) => {
    noteVueTrouble(error)
  })
})
