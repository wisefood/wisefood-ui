import type {
  CatalogArtifact,
  CatalogFacetBucket,
  CatalogGuide,
  CatalogGuideline,
  CatalogGuidelineQuantity
} from '~/services/catalogApi'
import { getCountryByCode, getCountryByName } from '~/utils/countries'

export interface GuidesCatalogSelectOption {
  label: string
  value: string
}

export interface GuidesCatalogRegionSummary {
  region: string
  slug: string
  label: string
  flag: string | null
  guideCount: number
  guidelineCount: number | null
  artifactCount: number
  latestPublicationYear: number | null
  topics: string[]
}

const PLACEHOLDER_VALUES = new Set([
  'n/a',
  'na',
  'none',
  'not stated',
  'not set',
  'null',
  'unknown',
  'unspecified'
])

export function firstQueryValue(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : ''
  }

  return typeof value === 'string' ? value : ''
}

export function parsePositivePageQuery(value: string | string[] | null | undefined, fallback = 1) {
  const parsed = Number(firstQueryValue(value))
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function quoteCatalogFilterValue(value: string) {
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return /[\s:]/.test(escaped) ? `"${escaped}"` : escaped
}

export function slugifySegment(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeMeaningfulString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  if (PLACEHOLDER_VALUES.has(normalized.toLowerCase())) {
    return null
  }

  return normalized
}

export function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.map(value => normalizeMeaningfulString(value)).filter((value): value is string => Boolean(value)))]
}

export function formatEnumLabel(value: string | null | undefined) {
  if (!value) {
    return 'Unspecified'
  }

  return value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatCatalogDate(value: string | null | undefined) {
  if (!value) {
    return 'Not set'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(parsed)
}

export function formatBytes(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return 'Unknown'
  }

  if (value < 1024) {
    return `${value} B`
  }

  const units = ['KB', 'MB', 'GB', 'TB']
  let current = value / 1024
  let unit = units[0]

  for (const nextUnit of units.slice(1)) {
    if (current < 1024) {
      break
    }

    current /= 1024
    unit = nextUnit
  }

  return `${current.toFixed(current >= 100 ? 0 : 1)} ${unit}`
}

export function formatGuidelineQuantity(quantity: CatalogGuidelineQuantity | null | undefined) {
  if (!quantity) {
    return null
  }

  const comparisonMap = {
    lt: '<',
    lte: '<=',
    eq: '=',
    gte: '>=',
    gt: '>',
    approx: '~'
  } as const

  const comparison = comparisonMap[quantity.operator]
  const suffix = quantity.period ? ` per ${quantity.period}` : ''
  return `${comparison} ${quantity.value} ${quantity.unit}${suffix}`
}

export function getRegionPresentation(region: string | null | undefined) {
  const normalized = normalizeMeaningfulString(region)

  if (!normalized) {
    return {
      value: '',
      label: 'Unspecified region',
      shortLabel: 'Unspecified region',
      flag: null,
      slug: 'unspecified-region'
    }
  }

  const country = getCountryByCode(normalized.toUpperCase()) || getCountryByName(normalized)
  if (country) {
    return {
      value: country.code,
      label: country.name,
      shortLabel: country.name,
      flag: country.flag,
      slug: slugifySegment(country.name)
    }
  }

  return {
    value: normalized,
    label: normalized,
    shortLabel: normalized,
    flag: null,
    slug: slugifySegment(normalized)
  }
}

export function resolveRegionFromParam(param: string, regions: string[]) {
  const normalizedParam = slugifySegment(decodeURIComponent(param))

  return regions.find((region) => {
    const presentation = getRegionPresentation(region)
    const candidates = new Set([
      presentation.slug,
      slugifySegment(region),
      region.toLowerCase(),
      presentation.value.toLowerCase()
    ])

    return candidates.has(normalizedParam)
  }) || null
}

export function buildGuidesCatalogPath() {
  return '/foodscholar/guides'
}

export function buildGuidesRegionPath(region: string | null | undefined) {
  return `${buildGuidesCatalogPath()}/${getRegionPresentation(region).slug}`
}

export function buildGuideDetailPath(region: string | null | undefined, guideId: string) {
  return `${buildGuidesRegionPath(region)}/guides/${encodeURIComponent(guideId)}`
}

export function buildFacetSelectOptions(
  label: string,
  buckets: CatalogFacetBucket[] = [],
  selectedValue = 'all',
  labelResolver?: (value: string) => string
) {
  const items = buckets
    .slice()
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value))
    .map(bucket => ({
      label: `${labelResolver ? labelResolver(bucket.value) : bucket.value} (${bucket.count})`,
      value: bucket.value
    }))

  if (selectedValue !== 'all' && selectedValue && !items.some(item => item.value === selectedValue)) {
    items.unshift({
      label: labelResolver ? labelResolver(selectedValue) : selectedValue,
      value: selectedValue
    })
  }

  return [
    { label, value: 'all' },
    ...items
  ]
}

export function getGuidePublisher(guide: CatalogGuide) {
  return normalizeMeaningfulString(guide.issuing_authority)
    || normalizeMeaningfulString(guide.responsible_ministry)
    || normalizeMeaningfulString(guide.organization_urn)
}

export function getGuideAudience(guide: CatalogGuide) {
  return normalizeMeaningfulString(guide.audience)
    || uniqueStrings(guide.target_audiences).join(', ')
    || null
}

export function getGuideTopics(guide: CatalogGuide) {
  return uniqueStrings([
    guide.topic,
    ...guide.tags
  ])
}

export function getGuidePublicationLabel(guide: CatalogGuide) {
  if (guide.publication_year) {
    return String(guide.publication_year)
  }

  return normalizeMeaningfulString(guide.publication_date) ? formatCatalogDate(guide.publication_date) : null
}

export function isPdfArtifact(artifact: CatalogArtifact) {
  const candidateValues = [
    artifact.file_type,
    artifact.file_url,
    artifact.file_s3_url,
    artifact.title
  ].filter((value): value is string => typeof value === 'string' && Boolean(value))

  return candidateValues.some(value => value.toLowerCase().includes('pdf'))
}

export function getArtifactTypeLabel(artifact: CatalogArtifact) {
  if (isPdfArtifact(artifact)) {
    return 'PDF'
  }

  const mimeType = normalizeMeaningfulString(artifact.file_type)
  if (!mimeType) {
    return 'File'
  }

  const shortType = mimeType.split('/')[1] || mimeType
  return shortType.toUpperCase()
}

export function getGuidelineTopicChips(guideline: CatalogGuideline) {
  const denormalizedTopics = uniqueStrings([guideline.topic, ...guideline.tags])
  if (denormalizedTopics.length) {
    return denormalizedTopics
  }

  return uniqueStrings(guideline.food_groups.map(group => formatEnumLabel(group)))
}

export function getGuidelineAudienceChips(guideline: CatalogGuideline) {
  const denormalizedAudience = normalizeMeaningfulString(guideline.audience)
  if (denormalizedAudience) {
    return [denormalizedAudience]
  }

  return uniqueStrings(guideline.target_populations.map(population => formatEnumLabel(population)))
}

export function getGuidelinePageReferences(guideline: CatalogGuideline) {
  const pageNumbers = new Set<number>()

  if (typeof guideline.page_no === 'number') {
    pageNumbers.add(guideline.page_no)
  }

  for (const sourceRef of guideline.source_refs) {
    pageNumbers.add(sourceRef.page_start)
    if (typeof sourceRef.page_end === 'number') {
      pageNumbers.add(sourceRef.page_end)
    }
  }

  return [...pageNumbers].sort((left, right) => left - right)
}

export function hasGuidePageAssociations(guidelines: CatalogGuideline[]) {
  return guidelines.some(guideline => getGuidelinePageReferences(guideline).length > 0)
}

export function groupGuidelinesByPage(guidelines: CatalogGuideline[]) {
  const groups = new Map<string, { key: string, label: string, sortOrder: number, guidelines: CatalogGuideline[] }>()

  for (const guideline of guidelines) {
    const pageRefs = getGuidelinePageReferences(guideline)

    if (!pageRefs.length) {
      const fallback = groups.get('unassigned') || {
        key: 'unassigned',
        label: 'Source page not available',
        sortOrder: Number.MAX_SAFE_INTEGER,
        guidelines: []
      }

      fallback.guidelines.push(guideline)
      groups.set('unassigned', fallback)
      continue
    }

    const primaryPage = pageRefs[0]
    const key = `page-${primaryPage}`
    const entry = groups.get(key) || {
      key,
      label: `Page ${primaryPage}`,
      sortOrder: primaryPage,
      guidelines: []
    }

    entry.guidelines.push(guideline)
    groups.set(key, entry)
  }

  return [...groups.values()]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(group => ({
      ...group,
      guidelines: group.guidelines.slice().sort((left, right) => {
        return (left.sequence_no || Number.MAX_SAFE_INTEGER) - (right.sequence_no || Number.MAX_SAFE_INTEGER)
      })
    }))
}

export function collectThemeBucketsFromGuides(guides: CatalogGuide[]) {
  const counts = new Map<string, number>()

  for (const guide of guides) {
    for (const topic of getGuideTopics(guide)) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value))
}

export function buildRegionSummaries(
  guides: CatalogGuide[],
  regionBuckets: CatalogFacetBucket[] = [],
  guidelineBuckets: CatalogFacetBucket[] = []
) {
  const byRegion = new Map<string, CatalogGuide[]>()
  const guideCountLookup = new Map(regionBuckets.map(bucket => [bucket.value, bucket.count]))
  const guidelineCountLookup = new Map(guidelineBuckets.map(bucket => [bucket.value, bucket.count]))

  for (const guide of guides) {
    const region = normalizeMeaningfulString(guide.region)
    if (!region) {
      continue
    }

    const items = byRegion.get(region) || []
    items.push(guide)
    byRegion.set(region, items)
  }

  return [...byRegion.entries()]
    .map(([region, regionGuides]): GuidesCatalogRegionSummary => {
      const presentation = getRegionPresentation(region)
      const artifactCount = regionGuides.reduce((sum, guide) => sum + guide.artifacts.length, 0)
      const latestPublicationYear = regionGuides.reduce<number | null>((latest, guide) => {
        if (!guide.publication_year) {
          return latest
        }

        return latest === null ? guide.publication_year : Math.max(latest, guide.publication_year)
      }, null)

      return {
        region,
        slug: presentation.slug,
        label: presentation.label,
        flag: presentation.flag,
        guideCount: guideCountLookup.get(region) ?? regionGuides.length,
        guidelineCount: guidelineCountLookup.get(region) ?? null,
        artifactCount,
        latestPublicationYear,
        topics: collectThemeBucketsFromGuides(regionGuides).slice(0, 4).map(bucket => bucket.value)
      }
    })
    .sort((left, right) => left.label.localeCompare(right.label))
}
