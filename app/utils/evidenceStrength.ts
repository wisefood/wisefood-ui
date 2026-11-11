/**
 * "How sure are we?" in words a non-scientist uses.
 *
 * Mirrors FoodScholar's `evidence_grade.grade_source` (same study_type and
 * biological_model vocabulary, same rule that a non-human model overrides an
 * optimistic design), but returns a plain-language level instead of a rank.
 * The level only names a translation key: the words live in the locale files.
 *
 * Most of the corpus has no `study_type`. That is reported as `unknown`, never
 * as weak evidence: not knowing the design says nothing about its quality.
 */

export type EvidenceLevel
  = | 'combined'
    | 'trial'
    | 'intervention'
    | 'observational'
    | 'review'
    | 'qualitative'
    | 'early'
    | 'opinion'
    | 'unknown'

export type StudiedIn = 'people' | 'animals' | 'cells' | 'unknown'

export interface EvidenceStrength {
  level: EvidenceLevel
  /** 0-4 bars on the meter; 0 means "not recorded", not "no evidence". */
  bars: number
  studiedIn: StudiedIn
  icon: string
}

const STUDY_TYPE_LEVEL: Record<string, EvidenceLevel> = {
  'systematic review': 'combined',
  'meta-analysis': 'combined',
  'meta analysis': 'combined',
  'randomized controlled trial': 'trial',
  'randomised controlled trial': 'trial',
  'non-randomized intervention': 'intervention',
  'non-randomised intervention': 'intervention',
  'observational (cohort)': 'observational',
  'observational (case-control)': 'observational',
  'observational (cross-sectional)': 'observational',
  'qualitative study': 'qualitative',
  'narrative review': 'review',
  'animal study': 'early',
  'in vitro / cell study': 'early',
  'in vitro': 'early',
  'methods / protocol': 'opinion'
}

const WEAK_PUBLICATION_TYPES = new Set(['editorial', 'lettersandcomments', 'conference', 'news'])

const LEVEL_BARS: Record<EvidenceLevel, number> = {
  combined: 4,
  trial: 3,
  intervention: 2,
  observational: 2,
  review: 2,
  qualitative: 1,
  early: 1,
  opinion: 1,
  unknown: 0
}

const LEVEL_ICON: Record<EvidenceLevel, string> = {
  combined: 'i-lucide-layers',
  trial: 'i-lucide-scale',
  intervention: 'i-lucide-flask-round',
  observational: 'i-lucide-eye',
  review: 'i-lucide-book-open',
  qualitative: 'i-lucide-message-circle',
  early: 'i-lucide-microscope',
  opinion: 'i-lucide-megaphone',
  unknown: 'i-lucide-circle-help'
}

function norm(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function studiedInFrom(model: string, studyType: string): StudiedIn {
  if (model === 'human' || model === 'mixed') return 'people'
  if (model === 'animal' || studyType === 'animal study') return 'animals'
  if (model.startsWith('in vitro') || model === 'plant' || studyType.startsWith('in vitro')) return 'cells'
  return 'unknown'
}

export function evidenceStrength(source: {
  study_type?: string | null
  biological_model?: string | null
  type?: string | string[] | null
} | null | undefined): EvidenceStrength {
  const studyType = norm(source?.study_type)
  const model = norm(source?.biological_model)
  const studiedIn = studiedInFrom(model, studyType)

  let level: EvidenceLevel = STUDY_TYPE_LEVEL[studyType] ?? 'unknown'

  // An RCT in mice is still an early clue for someone asking about themselves.
  if (studiedIn === 'animals' || studiedIn === 'cells') level = 'early'

  const rawTypes = source?.type
  const types = (Array.isArray(rawTypes) ? rawTypes : rawTypes ? [rawTypes] : []).map(norm)
  if (types.some(t => WEAK_PUBLICATION_TYPES.has(t))) level = 'opinion'

  return { level, bars: LEVEL_BARS[level], studiedIn, icon: LEVEL_ICON[level] }
}

/**
 * The same level from FoodScholar's own `evidence_label` on a retrieved
 * source ("randomised controlled trial", "animal study", ...).
 */
export function evidenceFromLabel(label: string | null | undefined, isHuman?: boolean | null): EvidenceStrength {
  const l = norm(label)
  if (l === 'animal study') return evidenceStrength({ biological_model: 'animal' })
  if (l === 'laboratory study' || l === 'preclinical') return evidenceStrength({ biological_model: 'in vitro' })
  if (l === 'editorial or conference item') return { ...evidenceStrength(null), level: 'opinion', bars: 1, icon: LEVEL_ICON.opinion }
  const map: Record<string, string> = {
    'systematic review': 'systematic review',
    'randomised controlled trial': 'randomised controlled trial',
    'intervention study': 'non-randomised intervention',
    'cohort study': 'observational (cohort)',
    'case-control study': 'observational (case-control)',
    'cross-sectional study': 'observational (cross-sectional)',
    'qualitative study': 'qualitative study',
    'narrative review': 'narrative review'
  }
  return evidenceStrength({
    study_type: map[l] ?? null,
    biological_model: isHuman === true ? 'human' : isHuman === false ? 'animal' : null
  })
}
