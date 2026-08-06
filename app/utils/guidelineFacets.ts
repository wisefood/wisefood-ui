/**
 * Presentation of the guideline enrichment facets.
 *
 * The facets (life stage, age range, setting, guideline type, nutrients, ...)
 * are written by the post-extraction enrichment pass, so a given rule may carry
 * all of them, some, or none — rules predating enrichment carry none. Every
 * helper here treats an absent facet as normal rather than exceptional.
 *
 * A facet may be machine-written or editor-set. `ai_generated_fields` lists the
 * ones the machine currently owns, and the chip for such a facet is marked so a
 * reader can tell an inferred value from a reviewed one.
 *
 * Vocabularies are owned by the backend; this file only maps them to labels.
 */
import type {
  CatalogGuideline,
  CatalogGuidelineAudience,
  CatalogGuidelineLifeStage,
  CatalogGuidelineSetting,
  CatalogGuidelineType
} from '~/services/catalogApi'

export interface GuidelineFacetChip {
  /** Catalog field this chip came from, e.g. `life_stage`. */
  field: string
  /** Raw catalog value, or a synthesized key for derived chips like the age range. */
  value: string
  label: string
  icon: string
  /** True when the value is currently machine-written and not editor-reviewed. */
  aiGenerated: boolean
}

export const LIFE_STAGE_LABELS: Record<CatalogGuidelineLifeStage, string> = {
  pregnancy: 'Pregnancy',
  lactation: 'Breastfeeding',
  infancy: 'Infancy',
  early_childhood: 'Early childhood',
  school_age: 'School age',
  adolescence: 'Adolescence',
  adulthood: 'Adulthood',
  older_adulthood: 'Older adults'
}

export const SETTING_LABELS: Record<CatalogGuidelineSetting, string> = {
  school: 'School',
  home: 'Home',
  clinical: 'Clinical',
  community: 'Community',
  workplace: 'Workplace',
  retail: 'Retail',
  general: 'General'
}

export const GUIDELINE_TYPE_LABELS: Record<CatalogGuidelineType, string> = {
  food_based: 'Food-based',
  nutrient_based: 'Nutrient-based',
  behavioral: 'Behavioural',
  activity: 'Activity',
  other: 'Other'
}

export const AUDIENCE_LABELS: Record<CatalogGuidelineAudience, string> = {
  caregiver: 'Carers',
  individual: 'Individuals',
  health_professional: 'Health professionals',
  policy_maker: 'Policy makers',
  educator: 'Educators'
}

const FACET_ICONS: Record<string, string> = {
  life_stage: 'i-lucide-baby',
  age_range: 'i-lucide-calendar-range',
  setting: 'i-lucide-map-pin',
  guideline_type: 'i-lucide-shapes',
  nutrients: 'i-lucide-flask-conical',
  health_conditions: 'i-lucide-heart-pulse',
  topics: 'i-lucide-tag',
  audiences: 'i-lucide-users',
  target_populations: 'i-lucide-users',
  food_groups: 'i-lucide-apple'
}

/** Turn a snake_case vocabulary value into readable text. */
export function humanizeFacetValue(value: string): string {
  const text = String(value || '').replace(/_/g, ' ').trim()
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function labelFor(field: string, value: string): string {
  switch (field) {
    case 'life_stage':
      return LIFE_STAGE_LABELS[value as CatalogGuidelineLifeStage] ?? humanizeFacetValue(value)
    case 'setting':
      return SETTING_LABELS[value as CatalogGuidelineSetting] ?? humanizeFacetValue(value)
    case 'guideline_type':
      return GUIDELINE_TYPE_LABELS[value as CatalogGuidelineType] ?? humanizeFacetValue(value)
    case 'audiences':
      return AUDIENCE_LABELS[value as CatalogGuidelineAudience] ?? humanizeFacetValue(value)
    default:
      return humanizeFacetValue(value)
  }
}

export function facetIcon(field: string): string {
  return FACET_ICONS[field] ?? 'i-lucide-tag'
}

export function facetLabel(field: string, value: string): string {
  return labelFor(field, value)
}

/**
 * Render an age range in the unit that reads naturally.
 *
 * Guides state ages in months for infants and in years thereafter, and the
 * catalog stores months throughout, so "12–48 months" has to come back out as
 * "1–4 years" to match how the guide itself puts it.
 */
export function formatAgeRange(
  minMonths?: number | null,
  maxMonths?: number | null
): string | null {
  const hasMin = typeof minMonths === 'number' && minMonths >= 0
  const hasMax = typeof maxMonths === 'number' && maxMonths >= 0
  if (!hasMin && !hasMax) return null

  const useYears = (hasMin ? minMonths! >= 24 : true) && (hasMax ? maxMonths! >= 24 : true)

  const format = (months: number): string => {
    if (!useYears) return `${months} mo`
    const years = months / 12
    return Number.isInteger(years) ? `${years} yr` : `${years.toFixed(1)} yr`
  }

  if (hasMin && hasMax) {
    if (minMonths === maxMonths) return format(minMonths!)
    return useYears
      ? `${minMonths! / 12}–${format(maxMonths!)}`
      : `${minMonths}–${format(maxMonths!)}`
  }
  if (hasMin) return `${format(minMonths!)}+`
  return `Up to ${format(maxMonths!)}`
}

function isAiGenerated(guideline: CatalogGuideline, field: string): boolean {
  return Boolean(guideline.ai_generated_fields?.includes(field))
}

interface FacetChipOptions {
  /** Cap the chip count; the caller decides how much room a card has. */
  limit?: number
  /** Facet fields to render, in order. Defaults to the standard card set. */
  fields?: string[]
}

const DEFAULT_CHIP_FIELDS = [
  'life_stage',
  'age_range',
  'setting',
  'guideline_type',
  'nutrients',
  'health_conditions',
  'topics'
]

/**
 * Build the chip list for a guideline.
 *
 * Returns an empty array when a rule carries no facets, which is the expected
 * state for anything not yet enriched — callers should render nothing rather
 * than an empty chip row.
 */
export function guidelineFacetChips(
  guideline: CatalogGuideline,
  options: FacetChipOptions = {}
): GuidelineFacetChip[] {
  const fields = options.fields ?? DEFAULT_CHIP_FIELDS
  const chips: GuidelineFacetChip[] = []

  for (const field of fields) {
    if (field === 'age_range') {
      const range = formatAgeRange(guideline.age_min_months, guideline.age_max_months)
      if (range) {
        chips.push({
          field: 'age_range',
          value: range,
          label: range,
          icon: facetIcon('age_range'),
          aiGenerated:
            isAiGenerated(guideline, 'age_min_months')
            || isAiGenerated(guideline, 'age_max_months')
        })
      }
      continue
    }

    if (field === 'guideline_type') {
      const value = guideline.guideline_type
      if (value) {
        chips.push({
          field,
          value,
          label: labelFor(field, value),
          icon: facetIcon(field),
          aiGenerated: isAiGenerated(guideline, field)
        })
      }
      continue
    }

    const values = (guideline as unknown as Record<string, unknown>)[field]
    if (!Array.isArray(values)) continue

    for (const value of values) {
      if (typeof value !== 'string' || !value.trim()) continue
      chips.push({
        field,
        value,
        label: labelFor(field, value),
        icon: facetIcon(field),
        aiGenerated: isAiGenerated(guideline, field)
      })
    }
  }

  return typeof options.limit === 'number' ? chips.slice(0, options.limit) : chips
}

/** Whether a guideline carries any facet worth rendering. */
export function hasGuidelineFacets(guideline: CatalogGuideline): boolean {
  return guidelineFacetChips(guideline).length > 0
}

/**
 * Facet fields the catalog can aggregate on, paired with how to present them.
 * Drives the multi-select filter sections.
 */
export interface GuidelineFacetDefinition {
  field: string
  title: string
  icon: string
}

export const GUIDELINE_FILTER_FACETS: GuidelineFacetDefinition[] = [
  { field: 'life_stage', title: 'Life stage', icon: facetIcon('life_stage') },
  { field: 'setting', title: 'Setting', icon: facetIcon('setting') },
  { field: 'guideline_type', title: 'Guidance type', icon: facetIcon('guideline_type') },
  { field: 'target_populations', title: 'Population', icon: facetIcon('target_populations') },
  { field: 'food_groups', title: 'Food group', icon: facetIcon('food_groups') },
  { field: 'nutrients', title: 'Nutrient', icon: facetIcon('nutrients') }
]

/** 90 years. Beyond this a month-granularity slider stops being usable. */
export const AGE_SLIDER_MAX_MONTHS = 1080

export interface GuidelineAgeRange {
  minMonths: number
  maxMonths: number
}

/** Months rendered in the unit a reader thinks in at that scale. */
export function formatAgeMonths(months: number): string {
  if (months < 24) return `${months} mo`
  const years = months / 12
  return Number.isInteger(years) ? `${years} yr` : `${years.toFixed(1)} yr`
}

/**
 * Filter clauses for "rules that apply to someone in this age band".
 *
 * A rule matches when its stated span overlaps the selected band — not when it
 * sits inside it. A rule for 1–4 year olds is relevant to someone asking about
 * 2–3 year olds, and a containment test would miss it.
 *
 * `includeUnstated` decides what happens to rules with no age on them at all.
 * Enrichment omits an age rather than guessing one, so absent means "not
 * stated", which for general-population guidance means it does apply — hence
 * the default is to include them. Turning it off is how a reader narrows to
 * rules that were explicitly scoped to an age.
 */
export function buildGuidelineAgeFilter(
  range: GuidelineAgeRange | null,
  includeUnstated = true
): string[] {
  if (!range) return []

  const { minMonths, maxMonths } = range
  // Overlap: the rule starts at or before the band ends, and ends at or after
  // the band starts.
  const startsBeforeBandEnds = `age_min_months:[* TO ${maxMonths}]`
  const endsAfterBandStarts = `age_max_months:[${minMonths} TO *]`

  if (!includeUnstated) {
    return [
      `(${startsBeforeBandEnds})`,
      `(${endsAfterBandStarts})`,
      '_exists_:age_min_months'
    ]
  }

  return [
    `(${startsBeforeBandEnds} OR (*:* NOT _exists_:age_min_months))`,
    `(${endsAfterBandStarts} OR (*:* NOT _exists_:age_max_months))`
  ]
}

/**
 * Build the `fq` clauses for a set of selected facet values.
 *
 * Values within one facet are OR-ed (a rule for either life stage matches);
 * separate facets are AND-ed by being separate clauses.
 */
export function buildGuidelineFacetFilters(
  selections: Record<string, string[]>
): string[] {
  const clauses: string[] = []
  for (const [field, values] of Object.entries(selections)) {
    const cleaned = (values || []).filter(value => typeof value === 'string' && value.trim())
    if (!cleaned.length) continue
    const escaped = cleaned.map(value => `"${value.replace(/"/g, '\\"')}"`)
    clauses.push(
      escaped.length === 1
        ? `${field}:${escaped[0]}`
        : `${field}:(${escaped.join(' OR ')})`
    )
  }
  return clauses
}
