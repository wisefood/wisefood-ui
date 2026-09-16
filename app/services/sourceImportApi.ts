import wisefoodRestApi from './wisefoodApi'

/**
 * Importing a whole recipe source.
 *
 * Until now this meant writing a script: nine of them live in
 * RecipeWrangler's `scripts/`, each hand-rolling CSS selectors for one site's
 * markup. This drives the generalised path instead — point it at a sitemap or
 * a feed, and every page carrying `schema.org/Recipe` goes through the same
 * create-and-profile chain a single imported URL does.
 *
 * Admin and expert only at the gateway: it writes into the corpus and fetches
 * at length from somebody else's site.
 */

export interface SourceImportRun {
  id: string
  source_slug: string | null
  location: string
  /** `stalled` is computed by the server, not stored — a worker that stopped
   *  reporting looks identical to a working one from the status column. */
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'stalled'
  stage: string | null
  discovered: number
  attempted: number
  imported: number
  failed: number
  skipped: number
  dry_run: boolean
  error: string | null
  detail: {
    discovery?: { kind?: string, considered?: number, truncated?: boolean, documents?: string[] }
    reasons?: Record<string, number>
    samples?: Array<{ url: string, title: string, ingredients: number }>
  }
  started_by: string | null
  created_at: string | null
  heartbeat_at: string | null
  finished_at: string | null
}

export interface RegisteredSource {
  slug: string
  display_name: string
  collection_urn: string | null
  license: string | null
  license_url: string | null
  attribution: string | null
  curated: boolean
  trusted: boolean
  retired: boolean
}

export interface SourceImportRequest {
  location: string
  source_slug?: string
  region?: string
  include?: string
  exclude?: string
  limit?: number
  delay?: number
  respect_robots?: boolean
  dry_run?: boolean
}

export function runIsLive(run: SourceImportRun | null): boolean {
  return run?.status === 'queued' || run?.status === 'running'
}

type UnknownRecord = Record<string, unknown>

const asRecord = (value: unknown): UnknownRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as UnknownRecord
}

/** The gateway wraps RecipeWrangler's own `{message, run}` envelope. */
const unwrap = (payload: unknown): UnknownRecord => {
  const outer = asRecord(payload) || {}
  return asRecord(outer['result']) ?? outer
}

class SourceImportApiService {
  private readonly base = '/v1/recipewrangler/ingest'

  async start(request: SourceImportRequest): Promise<SourceImportRun> {
    const payload = await wisefoodRestApi.post<unknown>(`${this.base}/source`, request)
    return unwrap(payload)['run'] as SourceImportRun
  }

  async run(runId: string): Promise<SourceImportRun | null> {
    try {
      const payload = await wisefoodRestApi.get<unknown>(
        `${this.base}/source/runs/${encodeURIComponent(runId)}`)
      return (unwrap(payload)['run'] as SourceImportRun) ?? null
    } catch {
      return null
    }
  }

  async runs(limit = 20): Promise<SourceImportRun[]> {
    try {
      const payload = await wisefoodRestApi.get<unknown>(
        `${this.base}/source/runs?limit=${limit}`)
      const runs = unwrap(payload)['runs']
      return Array.isArray(runs) ? runs as SourceImportRun[] : []
    } catch {
      return []
    }
  }

  async sources(): Promise<{ sources: RegisteredSource[], undetermined: string[] }> {
    try {
      const payload = unwrap(await wisefoodRestApi.get<unknown>(`${this.base}/sources`))
      return {
        sources: Array.isArray(payload['sources'])
          ? payload['sources'] as RegisteredSource[]
          : [],
        undetermined: Array.isArray(payload['undetermined'])
          ? payload['undetermined'] as string[]
          : []
      }
    } catch {
      return { sources: [], undetermined: [] }
    }
  }
}

export const sourceImportApi = new SourceImportApiService()
export default sourceImportApi
