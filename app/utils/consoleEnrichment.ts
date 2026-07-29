import type {
  EnrichmentJobStatus,
  EnrichmentJobStatusValue
} from '~/services/foodscholarEnrichmentApi'

export interface EnrichmentBadge {
  label: string
  color: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  icon: string
  /** Whether the job is still moving — drives whether the UI keeps polling. */
  active: boolean
}

const BADGES: Record<EnrichmentJobStatusValue, EnrichmentBadge> = {
  queued: { label: 'Queued', color: 'info', icon: 'i-lucide-clock', active: true },
  running: { label: 'Enriching', color: 'warning', icon: 'i-lucide-loader', active: true },
  succeeded: { label: 'Enriched', color: 'success', icon: 'i-lucide-sparkles', active: false },
  failed: { label: 'Failed', color: 'error', icon: 'i-lucide-triangle-alert', active: false },
  not_found: { label: 'Not enriched', color: 'neutral', icon: 'i-lucide-minus', active: false }
}

export function enrichmentBadge(status: EnrichmentJobStatusValue | undefined | null): EnrichmentBadge {
  return BADGES[status || 'not_found'] || BADGES.not_found
}

export function isEnrichmentActive(status: EnrichmentJobStatus | undefined | null): boolean {
  return enrichmentBadge(status?.status).active
}

/**
 * Whether an article has enrichment on record.
 *
 * `extras.enriched_at` is the catalog's own evidence, and survives Redis being
 * flushed; the job record is the live view. Either one counts.
 */
export function hasEnrichmentOnRecord(
  status: EnrichmentJobStatus | undefined | null,
  enrichedAt: string | undefined | null
): boolean {
  return Boolean(enrichedAt) || status?.status === 'succeeded' || Boolean(status?.processed)
}

export function formatEnrichmentTimestamp(value: string | null | undefined): string {
  if (!value) return '—'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatWorkerUptime(seconds: number | undefined | null): string {
  if (!seconds || seconds <= 0) return '—'

  const total = Math.floor(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)

  if (hours) return `${hours}h ${minutes}m`
  if (minutes) return `${minutes}m`
  return `${total}s`
}
