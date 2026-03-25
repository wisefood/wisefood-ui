import type {
  CatalogGuidelineQuantity,
  CatalogQuantityOperator,
  CatalogReviewStatus,
  CatalogStatus
} from '~/services/catalogApi'

export interface ConsoleSelectOption {
  label: string
  value: string
}

export const guideStatusFilterOptions: ConsoleSelectOption[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
  { label: 'Deprecated', value: 'deprecated' }
]

export const guideReviewFilterOptions: ConsoleSelectOption[] = [
  { label: 'All review states', value: 'all' },
  { label: 'Unreviewed', value: 'unreviewed' },
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Verified', value: 'verified' },
  { label: 'Changes Requested', value: 'changes_requested' },
  { label: 'Rejected', value: 'rejected' }
]

export const guideStatusEditOptions: ConsoleSelectOption[] = [
  { label: 'Unspecified', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
  { label: 'Deleted', value: 'deleted' },
  { label: 'Deprecated', value: 'deprecated' }
]

export const guideReviewEditOptions: ConsoleSelectOption[] = [
  { label: 'Unspecified', value: '' },
  { label: 'Unreviewed', value: 'unreviewed' },
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Verified', value: 'verified' },
  { label: 'Changes Requested', value: 'changes_requested' },
  { label: 'Rejected', value: 'rejected' }
]

export const guideVisibilityEditOptions: ConsoleSelectOption[] = [
  { label: 'Unspecified', value: '' },
  { label: 'Internal', value: 'internal' },
  { label: 'Public', value: 'public' }
]

export const guideApplicabilityEditOptions: ConsoleSelectOption[] = [
  { label: 'Unspecified', value: '' },
  { label: 'Current', value: 'current' },
  { label: 'Expired', value: 'expired' },
  { label: 'Superseded', value: 'superseded' },
  { label: 'Withdrawn', value: 'withdrawn' },
  { label: 'Unknown', value: 'unknown' }
]

export const guidelineActionTypeEditOptions: ConsoleSelectOption[] = [
  { label: 'Unspecified', value: '' },
  { label: 'Eat', value: 'eat' },
  { label: 'Drink', value: 'drink' },
  { label: 'Use', value: 'use' },
  { label: 'Do', value: 'do' },
  { label: 'Avoid', value: 'avoid' },
  { label: 'Prepare', value: 'prepare' },
  { label: 'Limit', value: 'limit' },
  { label: 'Choose', value: 'choose' },
  { label: 'Increase', value: 'increase' },
  { label: 'Reduce', value: 'reduce' }
]

export const guidelineFrequencyEditOptions: ConsoleSelectOption[] = [
  { label: 'Unspecified', value: '' },
  { label: 'Per Meal', value: 'per_meal' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Occasional', value: 'occasional' }
]

export const guidelineTargetPopulationEditOptions: ConsoleSelectOption[] = [
  { label: 'General Population', value: 'general_population' },
  { label: 'Infants', value: 'infants' },
  { label: 'Under 5 Years', value: 'under_5_years' },
  { label: 'Ages 5 to 18', value: 'ages_5_to_18' },
  { label: 'Adults', value: 'adults' },
  { label: 'Elderly', value: 'elderly' },
  { label: 'Pregnant People', value: 'pregnant_people' },
  { label: 'Lactating People', value: 'lactating_people' },
  { label: 'Other', value: 'other' }
]

export const guidelineFoodGroupEditOptions: ConsoleSelectOption[] = [
  { label: 'None', value: 'none' },
  { label: 'Fruits', value: 'fruits' },
  { label: 'Vegetables', value: 'vegetables' },
  { label: 'Grains', value: 'grains' },
  { label: 'Dairy', value: 'dairy' },
  { label: 'Protein Foods', value: 'protein_foods' },
  { label: 'Fats and Oils', value: 'fats_and_oils' },
  { label: 'Beverages', value: 'beverages' },
  { label: 'Salt', value: 'salt' },
  { label: 'Sugars and Sweets', value: 'sugars_and_sweets' },
  { label: 'Mixed', value: 'mixed' },
  { label: 'Other', value: 'other' }
]

export const quantityOperatorEditOptions: ConsoleSelectOption[] = [
  { label: 'Unspecified', value: '' },
  { label: '<', value: 'lt' },
  { label: '<=', value: 'lte' },
  { label: '=', value: 'eq' },
  { label: '>=', value: 'gte' },
  { label: '>', value: 'gt' },
  { label: '~', value: 'approx' }
]

export function buildGuideRoutePath(urn: string) {
  return `/console/assets/guides/${encodeURIComponent(urn)}`
}

export function buildGuideReviewRoutePath(urn: string) {
  return `/console/assets/guides/review/${encodeURIComponent(urn)}`
}

export function resolveGuideRouteParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.join('/')
  }

  return typeof value === 'string' ? value : ''
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

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'Not set'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium'
  }).format(parsed)
}

export function formatBytes(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return 'Unknown'
  }

  if (value < 1024) {
    return `${value} B`
  }

  const units = ['KB', 'MB', 'GB']
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

export function formatQuantity(quantity: CatalogGuidelineQuantity) {
  const comparisonMap: Record<CatalogQuantityOperator, string> = {
    lt: '<',
    lte: '<=',
    eq: '=',
    gte: '>=',
    gt: '>',
    approx: '~'
  }

  const comparison = comparisonMap[quantity.operator]
  const suffix = quantity.period ? ` per ${quantity.period}` : ''
  return `${comparison} ${quantity.value} ${quantity.unit}${suffix}`
}

export function statusColor(value: CatalogStatus | null | undefined) {
  switch (value) {
    case 'active':
      return 'success'
    case 'draft':
      return 'warning'
    case 'archived':
      return 'neutral'
    case 'deprecated':
      return 'error'
    case 'deleted':
      return 'error'
    default:
      return 'neutral'
  }
}

export function reviewStatusColor(value: CatalogReviewStatus | null | undefined) {
  switch (value) {
    case 'verified':
      return 'success'
    case 'in_review':
      return 'info'
    case 'pending_review':
      return 'warning'
    case 'changes_requested':
      return 'warning'
    case 'rejected':
      return 'error'
    default:
      return 'neutral'
  }
}
