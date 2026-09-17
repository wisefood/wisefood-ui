/**
 * Vocabulary shared by every integrator surface — the proposal table, the
 * proposal card, the drawer. One place, so a licence reads the same in a
 * row as it does in the detail somebody opens from that row.
 */
import type { Proposal, SourceKind } from '~/services/integratorApi'

export const KIND_LABELS: Record<SourceKind, string> = {
  guide: 'Dietary guide',
  article: 'Article',
  textbook: 'Textbook',
  fctable: 'Food composition table',
  rcollection: 'Recipe collection'
}

/** For a table cell, where "Food composition table" is the whole column. */
export const KIND_SHORT: Record<SourceKind, string> = {
  guide: 'Guide',
  article: 'Article',
  textbook: 'Textbook',
  fctable: 'FCT',
  rcollection: 'Recipes'
}

/*
 * Which licences allow the content itself to be brought in. The server is the
 * authority — this only decides how things read, so a curator is not
 * surprised by a refusal after clicking approve.
 */
const CONTENT_OK = new Set([
  'CC-BY-4.0', 'CC-BY-SA-4.0', 'CCBY', 'CCBYSA', 'CCBYNC', 'CCBYNCSA',
  'CC0', 'public-domain', 'MIT', 'Apache-2.0', 'GPL-3.0'
])

export type LicenceState = 'permitted' | 'restricted' | 'unknown'

export function licenceState(licence: string | null | undefined): LicenceState {
  if (!licence) return 'unknown'
  return CONTENT_OK.has(licence) ? 'permitted' : 'restricted'
}

interface LicenceCopy {
  short: string
  long: (licence: string | null) => string
  icon: string
  badge: 'success' | 'warning' | 'neutral'
}

export const LICENCE_STATE: Record<LicenceState, LicenceCopy> = {
  permitted: {
    short: 'Content OK',
    long: licence => `${licence} — content may be brought in`,
    icon: 'i-lucide-check-circle-2',
    badge: 'success'
  },
  restricted: {
    short: 'Pointer only',
    long: licence => `${licence} — pointer only, content may not be copied`,
    icon: 'i-lucide-alert-triangle',
    badge: 'warning'
  },
  unknown: {
    short: 'Undetermined',
    long: () => 'Licence undetermined',
    icon: 'i-lucide-help-circle',
    badge: 'neutral'
  }
}

/**
 * Where a proposal is in the review. Statuses are the server's; stages are
 * what a curator is actually asking — is this waiting on me, waiting on a
 * run, or finished?
 */
export type Stage = 'review' | 'integrate' | 'done' | 'dropped'

export function stageOf(proposal: Pick<Proposal, 'status'>): Stage {
  switch (proposal.status) {
    case 'proposed': case 'researching': return 'review'
    case 'approved': case 'running': case 'failed': return 'integrate'
    case 'imported': return 'done'
    default: return 'dropped'
  }
}

/** Sort weight: what needs a decision first, what is finished last. */
export const STAGE_ORDER: Record<Stage, number> = {
  review: 0, integrate: 1, done: 2, dropped: 3
}

export const STATUS_LABELS: Record<string, string> = {
  proposed: 'To review',
  researching: 'To review',
  approved: 'Approved',
  running: 'Integrating',
  failed: 'Failed',
  imported: 'In catalog',
  rejected: 'Rejected'
}

export function statusTone(status: string): 'success' | 'error' | 'info' | 'primary' | 'neutral' {
  switch (status) {
    case 'imported': return 'success'
    case 'approved': return 'primary'
    case 'running': return 'info'
    case 'rejected': case 'failed': return 'error'
    default: return 'neutral'
  }
}
