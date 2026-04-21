import type { Article } from '~/services/articlesApi'

export interface ConsoleFacetBucket {
  value: string
  count: number
}

export interface ConsoleArticleSelectOption {
  label: string
  value: string
}

export const articleSortOptions: ConsoleArticleSelectOption[] = [
  { label: 'Recently updated', value: 'updated_at desc' },
  { label: 'Newest created', value: 'created_at desc' },
  { label: 'Newest published', value: 'publication_year desc' },
  { label: 'Title A-Z', value: 'title asc' }
]

export function buildArticleRoutePath(urn: string) {
  return `/console/assets/articles/${encodeURIComponent(urn)}`
}

export function resolveArticleRouteParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.join('/')
  }

  return typeof value === 'string' ? value : ''
}

export function slugifyArticleUrn(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'new-article'
}

export function formatConsolePublicationYear(value: string | null | undefined) {
  if (!value) {
    return 'Year unknown'
  }

  const match = value.match(/^(\d{4})/)
  if (match) {
    return match[1]
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return String(parsed.getUTCFullYear())
}

export function getDisplayArticleCategory(article: Pick<Article, 'category' | 'ai_category'>) {
  return article.category || article.ai_category || 'Unclassified'
}

export function normalizeFacetBuckets(entries: Array<{ value: unknown, count: unknown }> | undefined | null): ConsoleFacetBucket[] {
  return (entries || [])
    .map((entry) => {
      const value = `${entry?.value ?? ''}`.trim()
      const count = Number(entry?.count ?? 0)
      return {
        value,
        count: Number.isFinite(count) ? count : 0
      }
    })
    .filter(entry => entry.value.length > 0)
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value))
}

export function mergeFacetBuckets(...groups: Array<Array<{ value: unknown, count: unknown }> | undefined | null>) {
  const merged = new Map<string, number>()

  groups.forEach((group) => {
    normalizeFacetBuckets(group).forEach((entry) => {
      merged.set(entry.value, (merged.get(entry.value) || 0) + entry.count)
    })
  })

  return Array.from(merged.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value))
}
