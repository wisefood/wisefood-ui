/**
 * What a code is called when a person reads it.
 *
 * The console stores events as `expert.feedback_context_read`, reasons as
 * `wrong_quantities` and services as `recipewrangler`, and until now it showed
 * them that way. Those are identifiers for machines: stable, greppable, and
 * the right thing to record. They are the wrong thing to put in front of an
 * expert who is trying to understand what a person did — a reviewer should not
 * have to translate a key into a sentence in their head forty times a page.
 *
 * One dictionary per vocabulary, and a fallback that makes any unknown code
 * readable rather than raw, so a new event type shows up as "Feedback context
 * read" the day it ships instead of waiting for someone to name it here.
 */

const EVENT_TYPES: Record<string, string> = {
  // The browser
  'page.view': 'Viewed a page',
  'session.start': 'Started a session',
  'console.view': 'Opened the console',
  'feature.used': 'Used a feature',
  'recipe.search': 'Searched recipes',
  'recipe.autocomplete': 'Used search suggestions',
  'recipe.result_click': 'Opened a search result',
  'recipe.view': 'Viewed a recipe',
  'recipe.compare': 'Compared recipes',
  'favorite.add': 'Added a favourite',
  'favorite.remove': 'Removed a favourite',
  'library.save': 'Saved to library',
  'library.remove': 'Removed from library',
  'catalog.view': 'Opened a catalogue entry',
  // Questions and answers
  'qa.ask': 'Asked a question',
  'qa.answered': 'Received an answer',
  'qa.persisted': 'Answer saved',
  'qa.persist_failed': 'Answer could not be saved',
  'qa.search_report_failed': 'Search report failed',
  'qa.citation_opened': 'Opened a source',
  'qa.stream_abandoned': 'Left before the answer finished',
  // Chat and meal plans
  'chat.turn': 'Chat message',
  'chat.message': 'Chat message',
  'chat.plan_generated': 'Generated a meal plan',
  'chat.plan_saved': 'Saved a meal plan',
  'chat.tool_invoked': 'Chat used a tool',
  // The gateway
  'http.request': 'Request',
  // Experts and admins in the console
  'expert.qa_reviewed': 'Reviewed Q&A',
  'expert.feedback_reviewed': 'Read the feedback inbox',
  'expert.feedback_triaged': 'Triaged feedback',
  'expert.feedback_context_read': 'Opened a feedback exchange',
  'expert.review_recorded': 'Recorded a verdict',
  'expert.session_reviewed': 'Opened a session',
  'expert.sessions_reviewed': 'Browsed the session board',
  'expert.users_reviewed': 'Browsed people',
  'expert.error_triaged': 'Triaged an error',
  'expert.report_exported': 'Exported a report',
  'admin.settings_changed': 'Changed a setting',
  'admin.traces_read': 'Read traces'
}

const APPS: Record<string, string> = {
  foodchat: 'FoodChat',
  foodscholar: 'FoodScholar',
  recipewrangler: 'RecipeWrangler',
  catalog: 'Catalogue',
  console: 'Console',
  platform: 'Platform',
  ui: 'Browser',
  sdk: 'SDK',
  agent: 'Agent',
  internal: 'Internal'
}

const TARGET_TYPES: Record<string, string> = {
  qa_answer: 'an answer',
  chat_message: 'a chat message',
  recipe: 'a recipe',
  guide: 'a guide',
  article: 'an article',
  textbook: 'a textbook',
  platform: 'the platform'
}

const REASONS: Record<string, string> = {
  wrong_allergens: 'Wrong or missing allergens',
  wrong_quantities: 'Quantities look wrong',
  wrong_steps: 'The steps do not work',
  wrong_nutrition: 'Nutrition looks wrong',
  wrong_description: 'Title or description is wrong',
  other: 'Something else',
  not_helpful: 'Not helpful',
  inaccurate: 'Inaccurate',
  incomplete: 'Incomplete',
  unclear: 'Unclear',
  unsafe: 'Unsafe'
}

const RATING_KINDS: Record<string, string> = {
  thumbs: 'Thumbs up or down',
  likert5: 'Five-point rating',
  ab: 'A or B preference',
  helpful: 'Helpful or not'
}

const STATUSES: Record<string, string> = {
  new: 'New',
  triaged: 'Triaged',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
  ignored: 'Ignored'
}

const VERDICTS: Record<string, string> = {
  correct: 'Correct',
  good: 'Good',
  acceptable: 'Acceptable',
  partial: 'Partly right',
  unclear: 'Unclear',
  incorrect: 'Incorrect',
  wrong: 'Wrong',
  harmful: 'Harmful'
}

const SURFACES: Record<string, string> = {
  recipes: 'Recipe search',
  param: 'Filtered search',
  catalog: 'Catalogue search',
  tools: 'Tool search',
  autocomplete: 'Suggestions',
  qa: 'Question sources',
  scholar_library: 'Library'
}

const ERROR_KINDS: Record<string, string> = {
  error: 'Script error',
  unhandledrejection: 'Unhandled promise',
  vue: 'Component error',
  http: 'Failed request',
  resource: 'Asset failed to load',
  csp: 'Blocked by security policy',
  server: 'Server error'
}

const SEVERITIES: Record<string, string> = {
  error: 'Critical',
  warning: 'Warning',
  info: 'Note'
}

const CLICK_KINDS: Record<string, string> = {
  click: 'Click',
  rage: 'Rage click',
  dead: 'Dead click',
  scroll: 'Scrolled'
}

/**
 * A readable fallback for a code nobody has named.
 *
 * `expert.feedback_context_read` → "Feedback context read". Keeps the last
 * segment (the verb-ish part), drops the namespace, swaps underscores for
 * spaces and capitalises once. Never returns the raw code, so a new event type
 * is legible the day it ships.
 */
export function humanize(value: unknown): string {
  // Table rows arrive as `Record<string, unknown>`, so a label function has to
  // take whatever the row holds — coercing here once beats a cast at every
  // call site, and a non-string is at least shown rather than thrown on.
  if (value === null || value === undefined || value === '') return '—'
  const code = String(value)
  const tail = code.includes('.') ? code.slice(code.lastIndexOf('.') + 1) : code
  const words = tail.replace(/[_-]+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const lookup = (table: Record<string, string>) =>
  (value: unknown): string => {
    const code = value === null || value === undefined ? '' : String(value)
    return (code && table[code]) || humanize(code)
  }

export const eventLabel = lookup(EVENT_TYPES)
export const appLabel = lookup(APPS)
export const reasonLabel = lookup(REASONS)
export const ratingKindLabel = lookup(RATING_KINDS)
export const statusLabel = lookup(STATUSES)
export const verdictLabel = lookup(VERDICTS)
export const surfaceLabel = lookup(SURFACES)
export const errorKindLabel = lookup(ERROR_KINDS)
export const severityLabel = lookup(SEVERITIES)
export const clickKindLabel = lookup(CLICK_KINDS)

/** "a recipe", "an answer" — reads inside a sentence: "feedback about a recipe". */
export const targetTypeLabel = lookup(TARGET_TYPES)

/**
 * A name for a person the console is allowed to show.
 *
 * Under consent the identity column is a Keycloak subject — a UUID — or
 * nothing. Neither is a name, and the console should not pretend otherwise.
 * A subject is shortened to something a person can compare by eye, and an
 * absence says what it is rather than rendering as a blank.
 */
export function personLabel(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'not attributed'
  const userId = String(value)
  return userId.length > 12 ? `${userId.slice(0, 8)}…` : userId
}

/*
 * A rating as a person would say it.
 *
 * Feedback carries three fields — the scale, the word, the number — and a
 * console that prints all three raw produces "likert5 great 5", which is the
 * database's phrasing, not a sentence. One of the three is the answer and the
 * others are how it was measured, so say the answer and add the scale only
 * where the number needs one to mean anything.
 */
const RATING_VALUES: Record<string, string> = {
  up: 'Thumbs up',
  down: 'Thumbs down',
  great: 'Great',
  good: 'Good',
  ok: 'Okay',
  bad: 'Bad',
  awful: 'Awful',
  helpful: 'Helpful',
  not_helpful: 'Not helpful',
  a: 'Preferred A',
  b: 'Preferred B'
}

export function ratingLabel(
  kind: unknown,
  value: unknown,
  num: unknown = null
): string {
  const key = String(value ?? '').trim().toLowerCase()
  const scale = String(kind ?? '').trim().toLowerCase()
  const score = typeof num === 'number' ? num : null
  const word = RATING_VALUES[key] ?? (key ? humanize(key) : '')

  // A five-point score is meaningless without its ceiling; a thumb is not.
  if (scale === 'likert5') {
    if (word && score !== null) return `${word} — ${score} of 5`
    if (score !== null) return `${score} of 5`
    return word || 'Rated'
  }
  if (word) return word
  if (score !== null) return String(score)
  return 'Rated'
}

/**
 * Where a rated thing lives in the console, so a complaint leads to the thing
 * complained about. Null when this platform has no page for it — a link that
 * goes nowhere is worse than no link.
 */
export function targetLink(targetType: unknown, targetId: unknown): string | null {
  const id = String(targetId ?? '').trim()
  if (!id) return null
  switch (String(targetType ?? '').trim().toLowerCase()) {
    case 'recipe':
      return `/console/assets/recipes/${encodeURIComponent(id)}`
    case 'article':
      return `/console/assets/articles/${encodeURIComponent(id)}`
    case 'guide':
      return `/console/assets/guides/${encodeURIComponent(id)}`
    case 'textbook':
      return `/console/assets/textbooks/${encodeURIComponent(id)}`
    case 'qa_answer':
      return `/console/insights/qa?request=${encodeURIComponent(id)}`
    default:
      return null
  }
}
