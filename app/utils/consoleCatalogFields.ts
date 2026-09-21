/**
 * Legality checks for the catalog fields a console form can get wrong.
 *
 * Each of these has a form the API enforces and the console previously did
 * not: an ISBN carries a check digit, a DOI has a registrant prefix, a year is
 * bounded. Every one of them was a free-text box, so the first thing that told
 * an editor their input was wrong was a 422 after the save — or worse, nothing,
 * and a record that reads fine and resolves to nothing.
 *
 * Checking here puts the message beside the field while it is still being
 * typed, and keeps the create form and the edit form agreeing about what the
 * rule even is. They did not: the textbook create form bounded the publication
 * year and the edit form accepted any four digits.
 */

/** Printing predates this, catalogued textbooks effectively do not. */
export const PUBLICATION_YEAR_MIN = 1500

/** Next year, because a book is routinely dated ahead of its printing. */
export const publicationYearMax = (): number => new Date().getFullYear() + 1

export function publicationYearError(value: number | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined
  if (!Number.isInteger(value)) return 'Enter a whole year.'
  const max = publicationYearMax()
  if (value < PUBLICATION_YEAR_MIN || value > max) {
    return `Enter a year between ${PUBLICATION_YEAR_MIN} and ${max}.`
  }
  return undefined
}

/** ISBNs are written with spaces and dashes; the wire form carries neither. */
export function normalizeIsbn(raw: string | null | undefined): string {
  return String(raw ?? '').replace(/[\s-]/g, '').toUpperCase()
}

/**
 * ISBN-13 check digit: digits weighted 1,3,1,3,… sum to a multiple of ten.
 *
 * Length alone accepts a transposed pair, which is the typo people actually
 * make and the one that silently points at a different book.
 */
export function isbn13Error(raw: string | null | undefined): string | undefined {
  const value = normalizeIsbn(raw)
  if (!value) return undefined
  if (!/^\d{13}$/.test(value)) return 'An ISBN-13 has 13 digits.'
  const sum = value
    .split('')
    .slice(0, 12)
    .reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0)
  const check = (10 - (sum % 10)) % 10
  return check === Number(value[12])
    ? undefined
    : 'That ISBN-13 check digit does not match — one digit is likely wrong.'
}

/**
 * ISBN-10 check digit: digits weighted 10…1 sum to a multiple of eleven. The
 * final position carries X for a remainder of ten.
 */
export function isbn10Error(raw: string | null | undefined): string | undefined {
  const value = normalizeIsbn(raw)
  if (!value) return undefined
  if (!/^\d{9}[\dX]$/.test(value)) return 'An ISBN-10 has 10 characters, the last of which may be X.'
  const sum = value
    .split('')
    .reduce((total, char, index) => total + (char === 'X' ? 10 : Number(char)) * (10 - index), 0)
  return sum % 11 === 0
    ? undefined
    : 'That ISBN-10 check digit does not match — one character is likely wrong.'
}

/**
 * Accept a DOI however it was copied. People paste the resolver URL far more
 * often than the bare identifier, and storing the URL breaks every consumer
 * that builds its own link.
 */
export function normalizeDoi(raw: string | null | undefined): string {
  return String(raw ?? '')
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
}

export function doiError(raw: string | null | undefined): string | undefined {
  const value = normalizeDoi(raw)
  if (!value) return undefined
  return /^10\.\d{4,9}\/\S+$/.test(value)
    ? undefined
    : 'A DOI looks like 10.1234/abcd — the resolver prefix is optional.'
}

/**
 * A source URL is followed by a reader and, for a collection, is where its
 * licence terms are read. A bare domain or a stray "www." is not something a
 * browser can be handed.
 */
export function httpUrlError(raw: string | null | undefined): string | undefined {
  const value = String(raw ?? '').trim()
  if (!value) return undefined
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return 'Enter a full URL, including https://'
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    ? undefined
    : 'Only http:// and https:// links can be opened.'
}

export interface CatalogSelectOption {
  label: string
  value: string
}

/**
 * Keep the held value selectable even when it is not one of the offered
 * options.
 *
 * These controls resolve what they display by looking the value up among their
 * items and fall back to an empty string, so a value absent from the list
 * renders as a blank field that still holds it. That happens two ways: a record
 * whose licence or language predates the current list, and a value the editor
 * has just typed into an open vocabulary — which would otherwise vanish from
 * the box the moment it was accepted.
 */
export function withCurrentOption(
  options: readonly CatalogSelectOption[],
  current: string | null | undefined
): CatalogSelectOption[] {
  const value = String(current ?? '').trim()
  if (!value || options.some(option => option.value === value)) return [...options]
  return [...options, { label: value, value }]
}

/**
 * Suggestions drawn from what the corpus already contains, then from the
 * curated list. Values in use come first so the form teaches the vocabulary
 * that exists rather than the one somebody once guessed at.
 */
export function suggestionsFromFacet(
  buckets: ReadonlyArray<{ value: string | number, count: number }> | undefined,
  extra: readonly CatalogSelectOption[] = []
): CatalogSelectOption[] {
  const seen = new Map<string, CatalogSelectOption>()
  for (const bucket of buckets ?? []) {
    const value = String(bucket.value ?? '').trim()
    if (value) seen.set(value.toLowerCase(), { label: value, value })
  }
  for (const option of extra) {
    if (!seen.has(option.value.toLowerCase())) seen.set(option.value.toLowerCase(), { ...option })
  }
  return [...seen.values()]
}
