import { computed, onScopeDispose, ref, shallowRef } from 'vue'
import foodscholarEnrichmentApi from '~/services/foodscholarEnrichmentApi'
import type {
  EnrichmentJobStatus,
  EnrichmentWorkerStatus
} from '~/services/foodscholarEnrichmentApi'
import { isEnrichmentActive } from '~/utils/consoleEnrichment'

/** How often to re-poll while at least one job is queued or running. */
const POLL_INTERVAL_MS = 4000

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (error && typeof error === 'object') {
    const data = 'data' in error ? (error as { data?: unknown }).data : null
    if (data && typeof data === 'object' && 'detail' in data) {
      const detail = (data as { detail?: unknown }).detail
      if (typeof detail === 'string' && detail.trim()) return detail
    }

    const message = 'message' in error ? (error as { message?: unknown }).message : null
    if (typeof message === 'string' && message.trim()) return message
  }

  return fallback
}

/**
 * Selective article enrichment state for console pages.
 *
 * Tracks per-article job status for whatever URNs the page cares about and
 * self-polls only while something is actually in flight, so an idle article
 * list makes no background requests.
 */
export function useArticleEnrichment() {
  const statuses = ref<Record<string, EnrichmentJobStatus>>({})
  const workerStatus = shallowRef<EnrichmentWorkerStatus | null>(null)

  const statusLoading = ref(false)
  const workerLoading = ref(false)
  const pausePending = ref(false)
  const restartPending = ref(false)
  const error = ref<string | null>(null)

  /** URNs with an enrich request in flight from this page (for button spinners). */
  const pendingUrns = ref<Set<string>>(new Set())

  let pollTimer: ReturnType<typeof setTimeout> | null = null
  let trackedUrns: string[] = []

  const hasActiveJobs = computed(() =>
    Object.values(statuses.value).some(status => isEnrichmentActive(status))
  )

  const sweeperPaused = computed(() => Boolean(workerStatus.value?.sweeper?.paused))
  const sweeperEnabled = computed(() => Boolean(workerStatus.value?.sweeper?.enabled))
  const sweeperRunning = computed(
    () => sweeperEnabled.value && Boolean(workerStatus.value?.sweeper?.running) && !sweeperPaused.value
  )
  const pendingJobs = computed(() => workerStatus.value?.jobs?.pending_jobs ?? 0)

  function statusFor(urn: string): EnrichmentJobStatus | undefined {
    return statuses.value[urn]
  }

  function isPending(urn: string): boolean {
    return pendingUrns.value.has(urn)
  }

  function mergeStatuses(incoming: EnrichmentJobStatus[]) {
    const next = { ...statuses.value }
    incoming.forEach((status) => {
      next[status.urn] = status
    })
    statuses.value = next
  }

  function stopPolling() {
    if (pollTimer) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
  }

  function schedulePoll() {
    stopPolling()
    if (!hasActiveJobs.value || !trackedUrns.length) return

    pollTimer = setTimeout(() => {
      void loadStatuses(trackedUrns, { silent: true })
    }, POLL_INTERVAL_MS)
  }

  /**
   * Fetch status for a set of URNs. Pass `silent` for background polls so the
   * table does not flash a loading state every few seconds.
   */
  async function loadStatuses(urns: string[], options: { silent?: boolean } = {}) {
    trackedUrns = urns.filter(Boolean)
    if (!trackedUrns.length) {
      stopPolling()
      return
    }

    if (!options.silent) statusLoading.value = true

    try {
      const response = await foodscholarEnrichmentApi.getArticleStatuses(trackedUrns)
      mergeStatuses(response.jobs || [])
      error.value = null
    } catch (err) {
      // A polling failure should not blank out the badges we already have.
      if (!options.silent) {
        error.value = resolveErrorMessage(err, 'Failed to load enrichment status')
      }
    } finally {
      if (!options.silent) statusLoading.value = false
      schedulePoll()
    }
  }

  async function loadArticleStatus(urn: string, options: { silent?: boolean } = {}) {
    return loadStatuses([urn], options)
  }

  async function loadWorkerStatus(options: { silent?: boolean } = {}) {
    if (!options.silent) workerLoading.value = true

    try {
      workerStatus.value = await foodscholarEnrichmentApi.getWorkerStatus()
      return workerStatus.value
    } catch (err) {
      if (!options.silent) {
        error.value = resolveErrorMessage(err, 'Failed to load enrichment worker status')
      }
      return null
    } finally {
      if (!options.silent) workerLoading.value = false
    }
  }

  async function setSweeperPaused(paused: boolean) {
    pausePending.value = true
    try {
      workerStatus.value = await foodscholarEnrichmentApi.setSweeperPaused(paused)
      error.value = null
      return workerStatus.value
    } catch (err) {
      error.value = resolveErrorMessage(
        err,
        paused ? 'Failed to pause the enrichment sweeper' : 'Failed to resume the enrichment sweeper'
      )
      throw err
    } finally {
      pausePending.value = false
    }
  }

  /**
   * Force the workers back into a running state.
   *
   * Distinct from resume: it also rebuilds a thread that died. `start()` on the
   * worker short-circuits on its own `running` flag, which survives the thread,
   * so a crashed worker cannot be revived by pause/resume alone.
   */
  async function restartWorkers(
    options: { sweeper?: boolean, jobs?: boolean, resume?: boolean } = {}
  ) {
    restartPending.value = true
    try {
      const response = await foodscholarEnrichmentApi.restartWorkers(options)
      workerStatus.value = response.status
      error.value = null
      return response
    } catch (err) {
      error.value = resolveErrorMessage(err, 'Failed to restart the enrichment workers')
      throw err
    } finally {
      restartPending.value = false
    }
  }

  function markPending(urns: string[], pending: boolean) {
    const next = new Set(pendingUrns.value)
    urns.forEach(urn => (pending ? next.add(urn) : next.delete(urn)))
    pendingUrns.value = next
  }

  /** Queue one article and immediately reflect the returned job state. */
  async function enrichArticle(urn: string, force = false) {
    markPending([urn], true)
    try {
      const job = await foodscholarEnrichmentApi.enrichArticle(urn, force)
      mergeStatuses([job])
      if (!trackedUrns.includes(urn)) trackedUrns = [...trackedUrns, urn]
      error.value = null
      schedulePoll()
      return job
    } catch (err) {
      error.value = resolveErrorMessage(err, 'Failed to queue enrichment')
      throw err
    } finally {
      markPending([urn], false)
    }
  }

  /** Queue several articles in one request. */
  async function enrichArticles(urns: string[], force = false) {
    const targets = Array.from(new Set(urns.filter(Boolean)))
    if (!targets.length) return { total: 0, jobs: [] }

    markPending(targets, true)
    try {
      const response = await foodscholarEnrichmentApi.enrichArticles(targets, force)
      mergeStatuses(response.jobs || [])
      targets.forEach((urn) => {
        if (!trackedUrns.includes(urn)) trackedUrns = [...trackedUrns, urn]
      })
      error.value = null
      schedulePoll()
      return response
    } catch (err) {
      error.value = resolveErrorMessage(err, 'Failed to queue enrichment')
      throw err
    } finally {
      markPending(targets, false)
    }
  }

  /** Clear sweeper bookkeeping so the article is eligible for another pass. */
  async function resetArticle(urn: string) {
    markPending([urn], true)
    try {
      const result = await foodscholarEnrichmentApi.resetArticle(urn)
      await loadArticleStatus(urn, { silent: true })
      error.value = null
      return result
    } catch (err) {
      error.value = resolveErrorMessage(err, 'Failed to reset enrichment state')
      throw err
    } finally {
      markPending([urn], false)
    }
  }

  onScopeDispose(stopPolling)

  return {
    statuses,
    workerStatus,
    statusLoading,
    workerLoading,
    pausePending,
    restartPending,
    error,
    hasActiveJobs,
    sweeperPaused,
    sweeperEnabled,
    sweeperRunning,
    pendingJobs,
    statusFor,
    isPending,
    loadStatuses,
    loadArticleStatus,
    loadWorkerStatus,
    setSweeperPaused,
    restartWorkers,
    enrichArticle,
    enrichArticles,
    resetArticle,
    stopPolling
  }
}
