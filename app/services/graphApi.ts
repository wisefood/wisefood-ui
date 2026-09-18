import wisefoodRestApi from './wisefoodRestApi'

/**
 * FoodScholar's knowledge graph, as this app consumes it.
 *
 * The graph is three layers. Shelves (Layer A/B) are the FoodOn-derived
 * hierarchy — a tree, six facet roots deep to whatever the corpus supports.
 * Themes (Layer B) are discovered clusters that sit ON shelves and can span
 * several of them, so the structure is a DAG rather than a tree. Cards (Layer
 * C) are written summaries, one per shelf or theme, each claim citing the
 * chunks it came from.
 *
 * Everything below reads a denormalized browse index, which is why a detail
 * view costs one request rather than five and why the tree never walks parents
 * one level at a time. The one exception is evidence chunks, which live in the
 * corpus index proper.
 */

export const GRAPH_FACETS = [
  'foods',
  'health',
  'sustainability',
  'dietary_patterns',
  'allergies',
  'nutrients'
] as const

export type GraphFacet = (typeof GRAPH_FACETS)[number]

export const GRAPH_KINDS = ['shelf', 'theme', 'card'] as const
export type GraphNodeKind = (typeof GRAPH_KINDS)[number]

export const EVIDENCE_QUALITIES = [
  'high',
  'medium',
  'low',
  'debated',
  'unclear'
] as const
export type EvidenceQuality = (typeof EVIDENCE_QUALITIES)[number]

export interface GraphNodeSummary {
  node_id: string
  kind: GraphNodeKind
  label: string
  facet?: string | null
  depth?: number | null
  chunk_count: number
  has_card: boolean
  child_count: number
  theme_count: number
  /** `active`, or `folded` when the shelf absorbed an intermediary. Shelves only. */
  status?: string | null
}

export interface GraphCard {
  card_id: string
  target_id: string
  target_type: 'shelf' | 'theme'
  title: string
  summary: string
  tip?: string | null
  evidence_quality?: EvidenceQuality | string | null
  controversy_note?: string | null
  confidence_note?: string | null
  cited_chunk_ids: string[]
  /**
   * Set on safety-sensitive facets such as allergies. The API returns it
   * rather than hiding the card, deliberately — presenting it is this app's
   * decision, and the decision is to show the card with the flag visible.
   */
  safety_flagged: boolean
}

export interface GraphShelfDetail extends GraphNodeSummary {
  foodon_id?: string | null
  see_also: string[]
  support_direct: number
  support_lifted: number
  breadcrumb: GraphNodeSummary[]
  children: GraphNodeSummary[]
  themes: GraphNodeSummary[]
  card?: GraphCard | null
}

export interface GraphThemeDetail extends GraphNodeSummary {
  shelf_ids: string[]
  keyword_terms: string[]
  discovered_by?: string | null
  discovery_pass?: string | null
  breadcrumb: GraphNodeSummary[]
  card?: GraphCard | null
}

/** What `GET /graph/nodes/{id}` returns — the kind decides which shape. */
export type GraphNodeDetail = GraphShelfDetail | GraphThemeDetail | GraphCard

export interface GraphChunk {
  chunk_id: string
  text: string
  source_doc_id: string
  source_type?: string | null
  section_type?: string | null
  year?: number | null
  shelf_ids: string[]
  theme_ids: string[]
  foodon_ids: string[]
}

export interface GraphEntity {
  ontology_id: string
  prefix: string
  label: string
  synonyms: string[]
  facet_hint?: string | null
  mention_count: number
  chunk_count: number
}

export interface GraphSuggestItem {
  node_id: string
  kind: GraphNodeKind
  label: string
  facet?: string | null
  chunk_count: number
}

export interface GraphSearchPage {
  items: GraphNodeSummary[]
  total: number
  next_cursor?: string | null
  /** Aggregation buckets, scoped to the filters already applied. */
  facets: Record<string, Record<string, number>>
}

export interface GraphFacetSummary {
  facet: string
  shelf_count: number
  theme_count: number
  card_count: number
}

export interface GraphSummary {
  /**
   * Whether this deployment serves the graph at all.
   *
   * Distinct from `built`, and it has to be: the browse routes read an
   * Elasticsearch index, not the source stores, so they would happily serve an
   * index left behind by a deployment that has since switched the graph off.
   * Without this the interface cannot tell "not enabled here" from "nobody has
   * run the projector", and would send people looking for a button that does
   * not exist.
   */
  enabled?: boolean
  built: boolean
  alias?: string | null
  documents: number
  graph_version?: string | null
  counts: Record<string, number>
  facets: GraphFacetSummary[]
}

/**
 * The filter panel as a value. Every field narrows; none widens.
 *
 * Kept as arrays here and flattened to comma-separated strings on the wire,
 * because that is what the API parses and because an array is what a checkbox
 * list actually binds to.
 */
export interface GraphFilters {
  q?: string | null
  kind?: GraphNodeKind[]
  facet?: string[]
  status?: string[]
  /** Restrict to the subtree below this node. One term lookup server-side. */
  under?: string | null
  depthMax?: number | null
  minChunks?: number | null
  discoveredBy?: string[]
  evidenceQuality?: string[]
  hasCard?: boolean | null
}

type QueryValue = string | number | boolean | undefined

/**
 * Filters as query parameters.
 *
 * Empty is omitted rather than sent blank: `q=` is a query for the empty
 * string, which matches nothing, and `kind=` is an empty `terms` clause, which
 * matches nothing either. Both are easy to produce by clearing a control, and
 * both look like a broken graph rather than an unfiltered one.
 */
export function filtersToParams(filters: GraphFilters = {}): Record<string, QueryValue> {
  const params: Record<string, QueryValue> = {}
  const csv = (values?: string[] | null) =>
    values && values.length ? values.join(',') : undefined

  if (filters.q && filters.q.trim()) params.q = filters.q.trim()
  if (csv(filters.kind)) params.kind = csv(filters.kind)
  if (csv(filters.facet)) params.facet = csv(filters.facet)
  if (csv(filters.status)) params.status = csv(filters.status)
  if (filters.under) params.under = filters.under
  if (filters.depthMax !== null && filters.depthMax !== undefined) {
    params.depth_max = filters.depthMax
  }
  if (filters.minChunks !== null && filters.minChunks !== undefined && filters.minChunks > 0) {
    params.min_chunks = filters.minChunks
  }
  if (csv(filters.discoveredBy)) params.discovered_by = csv(filters.discoveredBy)
  if (csv(filters.evidenceQuality)) params.evidence_quality = csv(filters.evidenceQuality)
  if (filters.hasCard !== null && filters.hasCard !== undefined) {
    params.has_card = filters.hasCard
  }
  return params
}

/** True when a filter set would narrow anything at all. */
export function hasActiveFilters(filters: GraphFilters = {}): boolean {
  return Object.keys(filtersToParams(filters)).length > 0
}

// ── the visual graph, as streamed ────────────────────────────────────────

export interface VizNode {
  id: string
  label: string
  kind: GraphNodeKind
  /** Corpus behind the node. The honest measure of how much it matters. */
  weight: number
  facet?: string | null
  attrs: {
    /** Layout computed once, server-side, with a fixed seed: the map a
     *  person learns is the same map next week. No force simulation here. */
    x?: number | null
    y?: number | null
    depth?: number | null
    chunk_count?: number | null
    degree?: number | null
    has_card?: boolean | null
    status?: string | null
    child_count?: number | null
    theme_count?: number | null
  }
}

export interface VizEdge {
  source: string
  target: string
  kind: 'parent_of' | 'has_theme' | 'describes'
  weight: number
  attrs: Record<string, unknown>
}

export interface GraphStreamMeta {
  seq: number
  title: string
  level: string
  total_nodes: number
  max_depth: number
  graph_version?: string | null
  truncated: boolean
  batch_size: number
  anchor?: string
}

export interface GraphStreamDone {
  seq: number
  nodes: number
  edges: number
  /** Edges whose other endpoint was filtered out or fell past the ceiling. */
  dropped_edges: number
  truncated: boolean
  elapsed_ms: number
}

export type GraphStreamEvent
  = | { event: 'meta', data: GraphStreamMeta }
    | { event: 'nodes', data: { seq: number, level: number, nodes: VizNode[] } }
    | { event: 'edges', data: { seq: number, level: number, edges: VizEdge[] } }
    | { event: 'progress', data: { seq: number, sent_nodes: number, sent_edges: number } }
    | { event: 'done', data: GraphStreamDone }
    | { event: 'error', data: { seq?: number, title?: string, detail?: string, cause?: string } }

/**
 * One SSE frame into an event, or null for a frame that carries nothing.
 *
 * Comment lines (`: keep-alive`) are the common case for null: the server
 * sends them during quiet stretches so an idle proxy does not close the
 * stream, and they are not events.
 */
function parseFrame(frame: string): GraphStreamEvent | null {
  const lines = frame.split('\n')
  let name = 'message'
  const dataLines: string[] = []
  for (const line of lines) {
    if (line.startsWith(':')) continue
    if (line.startsWith('event:')) name = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart())
  }
  if (!dataLines.length) return null
  try {
    return { event: name, data: JSON.parse(dataLines.join('\n')) } as GraphStreamEvent
  } catch {
    return null
  }
}

async function* readSse(response: Response): AsyncGenerator<GraphStreamEvent> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let frameEnd = buffer.indexOf('\n\n')
      while (frameEnd >= 0) {
        const parsed = parseFrame(buffer.slice(0, frameEnd))
        buffer = buffer.slice(frameEnd + 2)
        if (parsed) yield parsed
        frameEnd = buffer.indexOf('\n\n')
      }
    }
    const tail = parseFrame(buffer)
    if (tail) yield tail
  } finally {
    reader.releaseLock()
  }
}

class GraphApiService {
  private readonly basePath = '/foodscholar/graph'

  /** Size, facets and which build is being served. `built: false` is a real
   *  answer, not an error: it means the projector has never run. */
  async summary(): Promise<GraphSummary> {
    return wisefoodRestApi.get<GraphSummary>(`${this.basePath}/summary`)
  }

  async facets(): Promise<GraphFacetSummary[]> {
    return wisefoodRestApi.get<GraphFacetSummary[]>(`${this.basePath}/facets`)
  }

  /**
   * Top-level shelves of one facet — where a browse session starts.
   *
   * Defaults to active shelves. A folded shelf absorbed an intermediary and is
   * kept so no FoodOn id is lost, not because anyone wants to navigate it.
   */
  async facetRoots(facet: string, options: { status?: string, limit?: number } = {}): Promise<GraphNodeSummary[]> {
    return wisefoodRestApi.get<GraphNodeSummary[]>(
      `${this.basePath}/facets/${encodeURIComponent(facet)}/roots`,
      { params: { status: options.status ?? 'active', limit: options.limit ?? 100 } }
    )
  }

  /** One node with everything its detail panel needs, in a single response. */
  async node(nodeId: string): Promise<GraphNodeDetail> {
    return wisefoodRestApi.get<GraphNodeDetail>(
      `${this.basePath}/nodes/${encodeURIComponent(nodeId)}`
    )
  }

  async children(nodeId: string, options: { limit?: number, cursor?: string | null } = {}): Promise<GraphSearchPage> {
    return wisefoodRestApi.get<GraphSearchPage>(
      `${this.basePath}/nodes/${encodeURIComponent(nodeId)}/children`,
      { params: { limit: options.limit ?? 100, cursor: options.cursor ?? undefined } }
    )
  }

  async themes(nodeId: string, options: { limit?: number, cursor?: string | null } = {}): Promise<GraphSearchPage> {
    return wisefoodRestApi.get<GraphSearchPage>(
      `${this.basePath}/nodes/${encodeURIComponent(nodeId)}/themes`,
      { params: { limit: options.limit ?? 100, cursor: options.cursor ?? undefined } }
    )
  }

  async breadcrumb(nodeId: string): Promise<GraphNodeSummary[]> {
    return wisefoodRestApi.get<GraphNodeSummary[]>(
      `${this.basePath}/nodes/${encodeURIComponent(nodeId)}/breadcrumb`
    )
  }

  /** Evidence passages attached to a shelf or theme. */
  async chunks(nodeId: string, options: { limit?: number, offset?: number } = {}): Promise<GraphChunk[]> {
    return wisefoodRestApi.get<GraphChunk[]>(
      `${this.basePath}/nodes/${encodeURIComponent(nodeId)}/chunks`,
      { params: { limit: options.limit ?? 20, offset: options.offset ?? 0 } }
    )
  }

  async card(targetId: string): Promise<GraphCard> {
    return wisefoodRestApi.get<GraphCard>(
      `${this.basePath}/cards/${encodeURIComponent(targetId)}`
    )
  }

  /** Autocomplete over node labels. Matches inside a label, not only at the
   *  start, so "olive" surfaces "extra virgin olive oil". */
  async suggest(q: string, options: { kind?: GraphNodeKind[], facet?: string[], limit?: number } = {}): Promise<GraphSuggestItem[]> {
    return wisefoodRestApi.get<GraphSuggestItem[]>(`${this.basePath}/suggest`, {
      params: {
        q,
        kind: options.kind?.length ? options.kind.join(',') : undefined,
        facet: options.facet?.length ? options.facet.join(',') : undefined,
        limit: options.limit ?? 10
      }
    })
  }

  async search(filters: GraphFilters, options: { limit?: number, cursor?: string | null } = {}): Promise<GraphSearchPage> {
    return wisefoodRestApi.get<GraphSearchPage>(`${this.basePath}/search`, {
      params: {
        ...filtersToParams(filters),
        limit: options.limit ?? 25,
        cursor: options.cursor ?? undefined
      }
    })
  }

  /** Counts for the filter panel, scoped to the filters already applied — so
   *  the numbers describe what narrowing further would actually yield. */
  async filterCounts(filters: GraphFilters): Promise<Record<string, Record<string, number>>> {
    return wisefoodRestApi.get<Record<string, Record<string, number>>>(
      `${this.basePath}/filters`,
      { params: filtersToParams(filters) }
    )
  }

  async entities(options: { q?: string | null, prefix?: string | null, limit?: number } = {}): Promise<GraphEntity[]> {
    return wisefoodRestApi.get<GraphEntity[]>(`${this.basePath}/entities`, {
      params: {
        q: options.q || undefined,
        prefix: options.prefix || undefined,
        limit: options.limit ?? 25
      }
    })
  }

  async entity(ontologyId: string): Promise<GraphEntity> {
    return wisefoodRestApi.get<GraphEntity>(
      `${this.basePath}/entities/${encodeURIComponent(ontologyId)}`
    )
  }

  async entityChunks(ontologyId: string, limit = 25): Promise<GraphChunk[]> {
    return wisefoodRestApi.get<GraphChunk[]>(
      `${this.basePath}/entities/${encodeURIComponent(ontologyId)}/chunks`,
      { params: { limit } }
    )
  }

  /**
   * Rebuild the browse index from the graph. Admin only, and gated on the
   * server — the control is hidden for everyone else, but hiding a button is
   * not access control.
   *
   * Slow by nature: it reads the whole graph. Held by a lock upstream, so a
   * second call while one is running is a conflict rather than a second pass.
   */
  async reindex(dropOld = true): Promise<Record<string, unknown>> {
    return wisefoodRestApi.post<Record<string, unknown>>(
      `${this.basePath}/reindex`,
      undefined,
      { params: { drop_old: dropOld } }
    )
  }

  /**
   * The filtered graph, streamed for drawing.
   *
   * Frames arrive breadth-first by depth, so roots render immediately and the
   * graph grows outward. An edge is never sent before both its endpoints, so a
   * consumer never has to buffer or drop a dangling one.
   */
  async* stream(
    filters: GraphFilters,
    options: { maxNodes?: number, signal?: AbortSignal } = {}
  ): AsyncGenerator<GraphStreamEvent> {
    const response = await wisefoodRestApi.getStream(`${this.basePath}/stream`, {
      params: { ...filtersToParams(filters), max_nodes: options.maxNodes },
      signal: options.signal
    })
    yield* readSse(response)
  }

  /**
   * One node's neighborhood — parent, children, themes, card.
   *
   * A fresh short stream rather than a message on the open one, because SSE
   * only runs server to client: a client cannot ask an existing stream for
   * more, it opens another.
   */
  async* expand(
    nodeId: string,
    options: { signal?: AbortSignal } = {}
  ): AsyncGenerator<GraphStreamEvent> {
    const response = await wisefoodRestApi.getStream(`${this.basePath}/stream/expand`, {
      params: { node: nodeId },
      signal: options.signal
    })
    yield* readSse(response)
  }
}

export default new GraphApiService()
