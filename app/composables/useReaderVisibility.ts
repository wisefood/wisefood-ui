import { computed } from 'vue'
import {
  effectiveReaderVisibility,
  type Article,
  type ReaderVisibility
} from '~/services/articlesApi'
import { useFoodscholarQaStore } from '~/stores/foodscholarQa'

/**
 * Reader-facing enforcement of an article's `reader_visibility`.
 *
 * Editors set the field in the console; this is the side that honours it, so an
 * `expert_only` article stays out of the catalog a lay reader browses and an
 * `hidden` one stays out of everyone's.
 *
 * IMPORTANT — this is a presentation control, not a security boundary. The
 * reader's expertise level is a self-declared UI preference, so anyone can set
 * themselves to "expert" and see `expert_only` articles. Use it to keep material
 * that is easy to misread away from readers who did not ask for it; do not use
 * it for anything that must not be disclosed. A real boundary would have to key
 * on a Keycloak role and be enforced server-side.
 */

const EXPERT_LEVELS = new Set(['expert'])

export function isExpertReader(level: string | null | undefined): boolean {
  if (!level) return false
  return EXPERT_LEVELS.has(level.trim().toLowerCase())
}

/**
 * The `fq` clause that hides articles this reader should not see.
 *
 * Phrased as an exclusion on purpose: articles indexed before
 * `reader_visibility` existed have no value for it, and a positive clause
 * (`reader_visibility:public`) would drop the entire legacy corpus.
 */
export function readerVisibilityFilter(level: string | null | undefined): string {
  return isExpertReader(level)
    ? 'NOT reader_visibility:hidden'
    : 'NOT reader_visibility:(expert_only OR hidden)'
}

/** True when this reader may open the article. Absent field means public. */
export function isArticleVisibleToReader(
  article: Partial<Article> | null | undefined,
  level: string | null | undefined
): boolean {
  if (!article) return false
  const visibility: ReaderVisibility = effectiveReaderVisibility(article)
  if (visibility === 'hidden') return false
  if (visibility === 'expert_only') return isExpertReader(level)
  return true
}

export function useReaderVisibility() {
  const qaStore = useFoodscholarQaStore()

  const readerLevel = computed(() => qaStore.expertiseLevel || 'beginner')
  const isExpert = computed(() => isExpertReader(readerLevel.value))

  /** Append the reader clause to an existing fq list, without duplicating it. */
  const withReaderFilter = (fq?: string[] | null): string[] => {
    const clause = readerVisibilityFilter(readerLevel.value)
    const existing = fq ?? []
    return existing.includes(clause) ? [...existing] : [...existing, clause]
  }

  const canRead = (article: Partial<Article> | null | undefined) =>
    isArticleVisibleToReader(article, readerLevel.value)

  return { readerLevel, isExpert, withReaderFilter, canRead }
}
