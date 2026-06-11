import { ref } from 'vue'
import catalogApi, { type CatalogStats } from '~/services/catalogApi'
import recipeApi from '~/services/recipeApi'
import observabilityApi, { type ObservabilityStatus } from '~/services/observabilityApi'

const CACHE_TTL_MS = 5 * 60 * 1000

let cachedAt = 0
let cachedCatalog: CatalogStats | null = null
let cachedRecipeCount: number | null = null
let cachedObsStatus: ObservabilityStatus | null = null
let cachedLlmCost: number | null = null

export const useConsoleStats = () => {
  const catalog = ref<CatalogStats | null>(cachedCatalog)
  const recipeCount = ref<number | null>(cachedRecipeCount)
  const obsStatus = ref<ObservabilityStatus | null>(cachedObsStatus)
  const llmCost = ref<number | null>(cachedLlmCost)
  const loadingCatalog = ref(false)
  const loadingObs = ref(false)

  const isFresh = () => Date.now() - cachedAt < CACHE_TTL_MS && cachedCatalog !== null

  const load = async (force = false) => {
    if (!force && isFresh()) {
      catalog.value = cachedCatalog
      recipeCount.value = cachedRecipeCount
      obsStatus.value = cachedObsStatus
      llmCost.value = cachedLlmCost
      return
    }

    loadingCatalog.value = true
    loadingObs.value = true

    const [catalogRes, recipeRes, obsRes, costRes] = await Promise.allSettled([
      catalogApi.fetchCatalogStats(),
      recipeApi.getRecipeCount(),
      observabilityApi.getStatus(),
      observabilityApi.getCostSummary(7)
    ])

    cachedCatalog = catalogRes.status === 'fulfilled' ? catalogRes.value : null
    cachedRecipeCount = recipeRes.status === 'fulfilled' ? recipeRes.value : null
    cachedObsStatus = obsRes.status === 'fulfilled' ? obsRes.value : { enabled: false, langfuse_reachable: false }
    cachedLlmCost = costRes.status === 'fulfilled' ? costRes.value : null
    cachedAt = Date.now()

    catalog.value = cachedCatalog
    recipeCount.value = cachedRecipeCount
    obsStatus.value = cachedObsStatus
    llmCost.value = cachedLlmCost
    loadingCatalog.value = false
    loadingObs.value = false
  }

  return { catalog, recipeCount, obsStatus, llmCost, loadingCatalog, loadingObs, load }
}
