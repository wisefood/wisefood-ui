/**
 * Controlled vocabularies for article editing.
 *
 * Two kinds of field live here and they behave differently:
 *
 * - **Closed enums** (`license`) — the API validates against a fixed list, so a
 *   value outside it is a 422. These carry an explicit `value` distinct from the
 *   label, and free text must not be allowed.
 * - **Open vocabularies** (category, study type, reader group, …) — the API
 *   accepts any string. The lists below are suggestions that keep the corpus
 *   consistent; an editor can still type something new.
 *
 * These were previously duplicated as bare string arrays inside the article
 * edit page, which meant the create form and the edit form disagreed about what
 * the options even were, and the license list shipped labels the API rejects.
 */

export interface ArticleSelectOption {
  label: string
  value: string
}

const toOptions = (values: readonly string[]): ArticleSelectOption[] =>
  values.map(value => ({ label: value, value }))

/**
 * Licences the API accepts. **Closed enum** — `value` must match the backend's
 * `LicenseId` exactly. The labels are the human forms of the same identifiers;
 * sending a label ("CC BY 4.0") is a 422.
 */
export const licenseOptions: ArticleSelectOption[] = [
  { label: 'CC BY 4.0', value: 'CC-BY-4.0' },
  { label: 'CC BY-SA 4.0', value: 'CC-BY-SA-4.0' },
  { label: 'CC BY', value: 'CCBY' },
  { label: 'CC BY-SA', value: 'CCBYSA' },
  { label: 'CC BY-NC', value: 'CCBYNC' },
  { label: 'CC BY-NC-SA', value: 'CCBYNCSA' },
  { label: 'CC BY-NC-ND', value: 'CCBYNCND' },
  { label: 'CC0 / public domain dedication', value: 'CC0' },
  { label: 'Public domain', value: 'public-domain' },
  { label: 'Open access (publisher-specific)', value: 'publisher-specific-oa' },
  { label: 'Open access (unspecified)', value: 'unspecified-oa' },
  { label: 'Open access (other)', value: 'other-oa' },
  { label: 'Open access (implied)', value: 'implied-oa' },
  { label: 'Author manuscript (publisher-specific)', value: 'publisher-specific, author manuscript' },
  { label: 'Elsevier OA user licence', value: 'elsevier-specific: oa user license' },
  { label: 'Proprietary / all rights reserved', value: 'Proprietary' },
  { label: 'MIT', value: 'MIT' },
  { label: 'Apache 2.0', value: 'Apache-2.0' },
  { label: 'GPL 3.0', value: 'GPL-3.0' }
]

export const languageOptions: ArticleSelectOption[] = [
  { label: 'English (en)', value: 'en' },
  { label: 'Greek (el)', value: 'el' },
  { label: 'German (de)', value: 'de' },
  { label: 'French (fr)', value: 'fr' },
  { label: 'Spanish (es)', value: 'es' },
  { label: 'Italian (it)', value: 'it' },
  { label: 'Portuguese (pt)', value: 'pt' },
  { label: 'Dutch (nl)', value: 'nl' },
  { label: 'Slovenian (sl)', value: 'sl' },
  { label: 'Hungarian (hu)', value: 'hu' }
]

export const openAccessOptions: ArticleSelectOption[] = [
  { label: 'Unknown', value: 'unknown' },
  { label: 'Open access', value: 'true' },
  { label: 'Closed access', value: 'false' }
]

// --- Open vocabularies: suggestions, not constraints -----------------------

export const articleTypeOptions = toOptions([
  'Review',
  'Systematic review',
  'Meta-analysis',
  'Randomized controlled trial',
  'Clinical trial',
  'Cohort study',
  'Case-control study',
  'Cross-sectional study',
  'Guideline',
  'Consensus statement',
  'Narrative review',
  'Umbrella review',
  'Position paper',
  'Preprint'
])

export const categoryOptions = toOptions([
  'Cardiometabolic Health',
  'Gut Health',
  'Nutrition Science',
  'Preventive Health',
  'Public Health',
  'Food Systems',
  'Exercise & Performance',
  'Mental Health',
  "Women's Health",
  'Chronic Disease'
])

export const studyTypeOptions = toOptions([
  'Systematic review',
  'Meta-analysis',
  'Review',
  'Randomized controlled trial',
  'Clinical trial',
  'Cohort study',
  'Case-control study',
  'Cross-sectional study',
  'Guideline',
  'Qualitative study'
])

export const readerGroupOptions = toOptions([
  'General public',
  'Practitioners',
  'Researchers',
  'Policy makers',
  'Students'
])

export const ageGroupOptions = toOptions([
  'Prenatal',
  'Infants',
  'Children',
  'Adolescents',
  'Adults',
  'Older adults',
  'Mixed'
])

export const populationGroupOptions = toOptions([
  'General population',
  'Healthy adults',
  'Adults with obesity',
  'Pregnant individuals',
  'Children',
  'Athletes',
  'Patients with chronic disease'
])

export const biologicalModelOptions = toOptions([
  'Human',
  'Animal',
  'In vitro',
  'Computational',
  'Mixed'
])

export const regionOptions = toOptions([
  'Global',
  'Europe',
  'North America',
  'South America',
  'Asia',
  'Africa',
  'Oceania',
  'Middle East',
  'Multinational'
])

export const incomeSettingOptions = toOptions([
  'High income',
  'Upper-middle income',
  'Lower-middle income',
  'Low income',
  'Mixed'
])

/**
 * Reader visibility and indexing tier. Closed enums, and the labels matter:
 * these decide who sees an article and how strongly it is retrieved, so the
 * option text explains the consequence rather than restating the value.
 */
export const readerVisibilityOptions: ArticleSelectOption[] = [
  { label: 'Public — every reader', value: 'public' },
  { label: 'Expert only — hidden from general readers', value: 'expert_only' },
  { label: 'Hidden — no readers, still in the catalog', value: 'hidden' }
]

export const indexingTierOptions: ArticleSelectOption[] = [
  { label: 'Prime — editorially promoted', value: 'prime' },
  { label: 'Core', value: 'core' },
  { label: 'Supportive', value: 'supportive' },
  { label: 'Specialized', value: 'specialized' },
  { label: 'Archive only', value: 'archive_only' },
  { label: 'Do not index — excluded from retrieval', value: 'do_not_index' }
]

/**
 * Merge a facet bucket into a suggestion list.
 *
 * Values already in the corpus come first with their document counts, then the
 * curated suggestions that have not been used yet. This is what makes the form
 * teach the vocabulary the corpus actually uses instead of a static guess.
 */
export function mergeVocabularyWithFacet(
  suggestions: readonly ArticleSelectOption[],
  buckets: ReadonlyArray<{ value: string, count: number }> | undefined
): Array<ArticleSelectOption & { count?: number }> {
  const seen = new Map<string, ArticleSelectOption & { count?: number }>()

  for (const bucket of buckets ?? []) {
    const value = String(bucket.value ?? '').trim()
    if (!value) continue
    const suggestion = suggestions.find(
      option => option.value.toLowerCase() === value.toLowerCase()
    )
    seen.set(value.toLowerCase(), {
      value,
      label: suggestion?.label ?? value,
      count: bucket.count
    })
  }

  for (const option of suggestions) {
    if (!seen.has(option.value.toLowerCase())) {
      seen.set(option.value.toLowerCase(), { ...option })
    }
  }

  return [...seen.values()]
}

/**
 * Facet fields worth requesting when populating article form dropdowns.
 * `ai_*` variants are merged with their editorial counterparts by the caller.
 */
export const ARTICLE_FORM_FACET_FIELDS = [
  'category',
  'ai_category',
  'tags',
  'ai_tags',
  'topics',
  'study_type',
  'reader_group',
  'age_group',
  'population_group',
  'region',
  'venue',
  'language',
  'type'
]
