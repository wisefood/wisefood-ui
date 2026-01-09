import type { Article } from '~/services/articlesApi'

/**
 * Calculate estimated read time based on word count
 * Average reading speed: 200-250 words per minute
 */
export function calculateReadTime(content: string, wordsPerMinute: number = 225): number {
  const wordCount = content.trim().split(/\s+/).length
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return Math.max(1, minutes) // Minimum 1 minute
}

/**
 * Format publication year for display
 * Converts ISO date string (YYYY-01-01) to just the year
 */
export function formatPublicationYear(publicationYear?: string | null): string | null {
  if (!publicationYear) return null
  return publicationYear.split('-')[0] // Extract YYYY from YYYY-01-01
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }

  return date.toLocaleDateString('en-US', defaultOptions)
}

/**
 * Format authors list for display
 * Examples:
 * - Single author: "John Doe"
 * - Two authors: "John Doe and Jane Smith"
 * - Three+ authors: "John Doe, Jane Smith, and 2 others"
 */
export function formatAuthors(authors: string[], maxDisplay: number = 2): string {
  if (!authors || authors.length === 0) return 'Unknown Author'

  if (authors.length === 1) {
    return authors[0]
  }

  if (authors.length === 2) {
    return `${authors[0]} and ${authors[1]}`
  }

  if (authors.length <= maxDisplay) {
    const lastAuthor = authors[authors.length - 1]
    const otherAuthors = authors.slice(0, -1).join(', ')
    return `${otherAuthors}, and ${lastAuthor}`
  }

  const displayed = authors.slice(0, maxDisplay).join(', ')
  const remaining = authors.length - maxDisplay
  return `${displayed}, and ${remaining} ${remaining === 1 ? 'other' : 'others'}`
}

/**
 * Get excerpt from article content or abstract
 * Falls back to description if neither is available
 */
export function getExcerpt(article: Article, maxLength: number = 200): string {
  const text = article.abstract || article.description || article.content || ''

  if (text.length <= maxLength) {
    return text
  }

  // Try to cut at a sentence boundary
  const truncated = text.substring(0, maxLength)
  const lastPeriod = truncated.lastIndexOf('.')
  const lastQuestion = truncated.lastIndexOf('?')
  const lastExclamation = truncated.lastIndexOf('!')

  const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation)

  if (lastSentenceEnd > maxLength * 0.7) {
    return text.substring(0, lastSentenceEnd + 1)
  }

  // Cut at word boundary
  const lastSpace = truncated.lastIndexOf(' ')
  return text.substring(0, lastSpace) + '...'
}

/**
 * Get the primary category (use human category if available, otherwise AI category)
 */
export function getPrimaryCategory(article: Article): string | null {
  return article.category || article.ai_category || null
}

/**
 * Get combined tags (human tags take precedence, supplemented by AI tags)
 */
export function getAllTags(article: Article, includeAiTags: boolean = true): string[] {
  const humanTags = article.tags || []

  if (!includeAiTags) {
    return humanTags
  }

  const aiTags = article.ai_tags || []
  // Combine and deduplicate
  return [...new Set([...humanTags, ...aiTags])]
}

/**
 * Get primary tags (prefer human tags, fall back to AI tags if empty)
 */
export function getPrimaryTags(article: Article, maxTags: number = 5): string[] {
  const humanTags = article.tags || []
  if (humanTags.length > 0) {
    return humanTags.slice(0, maxTags)
  }

  const aiTags = article.ai_tags || []
  return aiTags.slice(0, maxTags)
}

/**
 * Get key takeaways (prefer human-reviewed, fall back to AI-generated)
 */
export function getKeyTakeaways(article: Article): string[] {
  const humanTakeaways = article.key_takeaways || []
  if (humanTakeaways.length > 0) {
    return humanTakeaways
  }

  return article.ai_key_takeaways || []
}

/**
 * Check if article has human-reviewed content
 */
export function hasHumanReview(article: Article): boolean {
  return !!(
    article.category ||
    (article.tags && article.tags.length > 0) ||
    (article.key_takeaways && article.key_takeaways.length > 0)
  )
}

/**
 * Format DOI as a clickable URL
 */
export function formatDoiUrl(doi: string | null | undefined): string | null {
  if (!doi) return null
  // Remove https://doi.org/ prefix if already present
  const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//, '')
  return `https://doi.org/${cleanDoi}`
}

/**
 * Check if article is recently published (within last year)
 */
export function isRecentlyPublished(article: Article): boolean {
  if (!article.publication_year) return false

  const currentYear = new Date().getFullYear()
  const publicationYear = parseInt(article.publication_year.split('-')[0])

  return currentYear - publicationYear <= 1
}

/**
 * Sort articles by multiple criteria
 */
export function sortArticles(
  articles: Article[],
  sortBy: 'created_at' | 'updated_at' | 'publication_year' | 'title',
  sortOrder: 'asc' | 'desc' = 'desc'
): Article[] {
  const sorted = [...articles].sort((a, b) => {
    let compareResult = 0

    switch (sortBy) {
      case 'created_at':
        compareResult = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
      case 'updated_at':
        compareResult = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
        break
      case 'publication_year':
        {
          const yearA = a.publication_year ? parseInt(a.publication_year.split('-')[0]) : 0
          const yearB = b.publication_year ? parseInt(b.publication_year.split('-')[0]) : 0
          compareResult = yearA - yearB
        }
        break
      case 'title':
        compareResult = a.title.localeCompare(b.title)
        break
    }

    return sortOrder === 'asc' ? compareResult : -compareResult
  })

  return sorted
}

/**
 * Filter articles by search query (client-side filtering)
 */
export function filterArticlesByQuery(articles: Article[], query: string): Article[] {
  if (!query.trim()) return articles

  const lowerQuery = query.toLowerCase()

  return articles.filter((article) => {
    return (
      article.title.toLowerCase().includes(lowerQuery) ||
      article.abstract?.toLowerCase().includes(lowerQuery) ||
      article.description?.toLowerCase().includes(lowerQuery) ||
      article.content.toLowerCase().includes(lowerQuery) ||
      article.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      article.ai_tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      article.authors.some((author) => author.toLowerCase().includes(lowerQuery))
    )
  })
}

/**
 * Group articles by category
 */
export function groupArticlesByCategory(articles: Article[]): Record<string, Article[]> {
  return articles.reduce((groups, article) => {
    const category = getPrimaryCategory(article) || 'Uncategorized'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(article)
    return groups
  }, {} as Record<string, Article[]>)
}

/**
 * Get unique values from article field
 */
export function getUniqueValues<T extends keyof Article>(
  articles: Article[],
  field: T
): Array<NonNullable<Article[T]>> {
  const values = articles.map((article) => article[field]).filter((val) => val != null)
  return [...new Set(values)] as Array<NonNullable<Article[T]>>
}

/**
 * Get all unique categories from articles (including AI categories)
 */
export function getUniqueCategories(articles: Article[], includeAiCategories: boolean = true): string[] {
  const categories = new Set<string>()

  articles.forEach((article) => {
    if (article.category) {
      categories.add(article.category)
    }
    if (includeAiCategories && article.ai_category) {
      categories.add(article.ai_category)
    }
  })

  return Array.from(categories).sort()
}

/**
 * Get all unique tags from articles (including AI tags)
 */
export function getUniqueTags(articles: Article[], includeAiTags: boolean = true): string[] {
  const tags = new Set<string>()

  articles.forEach((article) => {
    article.tags.forEach((tag) => tags.add(tag))
    if (includeAiTags) {
      article.ai_tags.forEach((tag) => tags.add(tag))
    }
  })

  return Array.from(tags).sort()
}
