import { ref, shallowRef, computed, onScopeDispose } from 'vue'
import graphApi from '~/services/graphApi'
import type {
  GraphFilters,
  GraphStreamDone,
  GraphStreamMeta,
  VizEdge,
  VizNode
} from '~/services/graphApi'

/**
 * Consume a knowledge graph SSE stream into something a canvas can draw.
 *
 * The one rule this file exists to enforce: **the graph is not reactive**.
 *
 * A wide slice is twenty thousand nodes and rather more edges. Handing those
 * to Vue's reactivity means a proxy per node, a dependency per property read,
 * and a re-render storm on every one of the eighty frames the server sends.
 * The first version of this did exactly that and spent about nine seconds of
 * main thread on a graph the canvas draws in four milliseconds.
 *
 * So nodes and edges live in plain, non-reactive structures, and `revision` —
 * one integer — is the only reactive thing that changes as they arrive. The
 * canvas watches `revision`, reads the raw structures, and redraws. Everything
 * a template needs to *count* (progress, totals, truncation) is its own small
 * ref, updated once per frame rather than derived from the data.
 */

export interface GraphStreamStats {
  nodes: number
  edges: number
  /** Edges whose other endpoint was filtered out or fell past the ceiling.
   *  Reported by the server rather than dropped silently, so a sparse view is
   *  distinguishable from a broken one. */
  droppedEdges: number
  truncated: boolean
  elapsedMs: number
}

/** Why a stream ended without drawing anything. Each wants different words. */
export type GraphStreamFailure
  = | { kind: 'disabled' }
    | { kind: 'not-built' }
    | { kind: 'forbidden' }
    | { kind: 'error', detail: string }

export function useGraphStream() {
  // ── the graph itself, deliberately outside reactivity ──────────────────
  const nodes = new Map<string, VizNode>()
  const edges: VizEdge[] = []
  /** Adjacency, built as edges land. The inspector and the canvas both need
   *  "what touches this node" and neither should scan the edge list for it. */
  const neighbors = new Map<string, Set<string>>()

  // ── what the interface watches ─────────────────────────────────────────
  const revision = ref(0)
  const streaming = ref(false)
  const meta = shallowRef<GraphStreamMeta | null>(null)
  const stats = shallowRef<GraphStreamStats | null>(null)
  const failure = shallowRef<GraphStreamFailure | null>(null)
  const sentNodes = ref(0)
  const sentEdges = ref(0)
  const totalNodes = ref(0)
  const maxDepth = ref(0)
  const currentLevel = ref(0)

  /** How far along, 0–1. Server totals are pre-ceiling, so this is clamped:
   *  a truncated stream would otherwise report 30% and then stop. */
  const progress = computed(() => {
    if (!totalNodes.value) return streaming.value ? 0 : 1
    return Math.min(1, sentNodes.value / totalNodes.value)
  })

  let controller: AbortController | null = null
  /** Guards against a late frame from an aborted stream landing in the graph
   *  that replaced it. Abort is not instantaneous — a batch already decoded
   *  will still be yielded — so every frame checks the run it belongs to. */
  let runId = 0

  function clear() {
    nodes.clear()
    edges.length = 0
    neighbors.clear()
    sentNodes.value = 0
    sentEdges.value = 0
    totalNodes.value = 0
    maxDepth.value = 0
    currentLevel.value = 0
    meta.value = null
    stats.value = null
    failure.value = null
    revision.value++
  }

  function stop() {
    runId++
    controller?.abort()
    controller = null
    streaming.value = false
  }

  function link(edge: VizEdge) {
    let out = neighbors.get(edge.source)
    if (!out) neighbors.set(edge.source, (out = new Set()))
    out.add(edge.target)
    let back = neighbors.get(edge.target)
    if (!back) neighbors.set(edge.target, (back = new Set()))
    back.add(edge.source)
  }

  /**
   * Classify a failure so the interface can say something true about it.
   *
   * `503` is two different situations and they need different words: the graph
   * is switched off in this deployment, or it is on but has never been
   * projected. The API distinguishes them in the payload's title, and telling
   * a user "not built yet" when the feature is simply off would send them
   * looking for a button that will not help.
   */
  function classify(error: unknown): GraphStreamFailure {
    const status = (error as { status?: number })?.status
    const data = (error as { data?: { detail?: string, title?: string } })?.data
    const title = String(data?.title || '')
    const detail = String(data?.detail || (error as Error)?.message || '')

    if (status === 403) return { kind: 'forbidden' }
    if (status === 503 || title.startsWith('KnowledgeGraph') || title === 'BrowseIndexMissing') {
      if (title === 'BrowseIndexMissing' || /has not been built/i.test(detail)) {
        return { kind: 'not-built' }
      }
      if (title === 'KnowledgeGraphDisabled' || /not enabled/i.test(detail)) {
        return { kind: 'disabled' }
      }
      return { kind: 'not-built' }
    }
    return { kind: 'error', detail }
  }

  async function consume(
    events: AsyncGenerator<import('~/services/graphApi').GraphStreamEvent>,
    run: number,
    { replace }: { replace: boolean }
  ) {
    let sawFrame = false
    try {
      for await (const frame of events) {
        if (run !== runId) return
        sawFrame = true
        switch (frame.event) {
          case 'meta':
            meta.value = frame.data
            if (replace) {
              totalNodes.value = frame.data.total_nodes || 0
              maxDepth.value = frame.data.max_depth || 0
            }
            break
          case 'nodes': {
            currentLevel.value = frame.data.level
            for (const node of frame.data.nodes) nodes.set(node.id, node)
            sentNodes.value = nodes.size
            revision.value++
            break
          }
          case 'edges': {
            for (const edge of frame.data.edges) {
              edges.push(edge)
              link(edge)
            }
            sentEdges.value = edges.length
            revision.value++
            break
          }
          case 'progress':
            // Ignored on purpose. It carries the server's running totals, and
            // ours are the ones the canvas can actually draw: expanding a node
            // re-sends nodes the main stream already had, so the server counts
            // them twice and the map counts them once. Showing the server's
            // number would mean a progress bar that overshoots its own total.
            break
          case 'done':
            stats.value = {
              nodes: nodes.size,
              edges: edges.length,
              droppedEdges: (frame.data as GraphStreamDone).dropped_edges || 0,
              truncated: !!(frame.data as GraphStreamDone).truncated,
              elapsedMs: (frame.data as GraphStreamDone).elapsed_ms || 0
            }
            return
          case 'error':
            failure.value = {
              kind: 'error',
              detail: String(frame.data.detail || frame.data.title || 'The graph stream ended early.')
            }
            return
        }
      }
      // A stream that ended without a terminal frame was cut, not finished.
      if (run === runId && sawFrame && !stats.value) {
        failure.value = { kind: 'error', detail: 'The graph stream ended before it finished.' }
      }
    } catch (error) {
      if ((error as Error)?.name === 'AbortError' || run !== runId) return
      failure.value = classify(error)
    }
  }

  /**
   * Draw the graph these filters describe.
   *
   * Replaces whatever was on screen. Any stream still running is aborted
   * first: two streams drawing different graphs into one canvas is not a race
   * worth winning.
   */
  async function load(filters: GraphFilters, options: { maxNodes?: number } = {}) {
    stop()
    clear()
    const run = ++runId
    controller = new AbortController()
    streaming.value = true
    try {
      await consume(
        graphApi.stream(filters, { maxNodes: options.maxNodes, signal: controller.signal }),
        run,
        { replace: true }
      )
    } finally {
      if (run === runId) streaming.value = false
    }
  }

  /**
   * Add one node's neighborhood to what is already drawn.
   *
   * Additive on purpose — expanding is how a shallow default view becomes the
   * part of the graph someone actually cares about, and losing the context
   * they expanded *from* would defeat it. Nodes are keyed by id, so a node
   * arriving twice updates rather than duplicates.
   */
  async function expand(nodeId: string) {
    // Not `stop()`: aborting the main stream to expand would leave the graph
    // half-drawn. A short expand alongside a long stream is fine — both write
    // into the same keyed map.
    const run = runId
    const local = new AbortController()
    try {
      await consume(graphApi.expand(nodeId, { signal: local.signal }), run, { replace: false })
    } finally {
      local.abort()
    }
  }

  /** Edge list for one node, without scanning. */
  function neighborsOf(nodeId: string): string[] {
    return Array.from(neighbors.get(nodeId) || [])
  }

  onScopeDispose(stop)

  return {
    // raw, non-reactive — read these after watching `revision`
    nodes,
    edges,
    neighborsOf,
    // reactive
    revision,
    streaming,
    meta,
    stats,
    failure,
    progress,
    sentNodes,
    sentEdges,
    totalNodes,
    maxDepth,
    currentLevel,
    // actions
    load,
    expand,
    stop,
    clear
  }
}
