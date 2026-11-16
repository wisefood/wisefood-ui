import type { SessionStory, StoryChapter, StoryMoment } from '~/services/insightsApi'
import { chatStepLabel, controlName, eventLabel, targetTypeLabel } from '~/utils/labels'

/**
 * Words for a session's story.
 *
 * The gateway sends the moments and the chapters; everything a person reads
 * about them is decided here, once, so the session page, its outline and the
 * session list describe a visit the same way.
 */

export const PRODUCTS: Record<string, { name: string, icon: string }> = {
  foodchat: { name: 'FoodChat', icon: 'i-lucide-messages-square' },
  foodscholar: { name: 'FoodScholar', icon: 'i-lucide-graduation-cap' },
  recipes: { name: 'Recipes', icon: 'i-lucide-chef-hat' },
  other: { name: 'Around the site', icon: 'i-lucide-compass' }
}

export const productOf = (product: string | null | undefined) =>
  PRODUCTS[product ?? 'other'] ?? PRODUCTS.other!

/** "+2:14", "+1:02:03": where in the visit, not what time of day. */
export function formatOffset(seconds: number | null | undefined): string {
  const total = Math.max(0, Math.round(seconds ?? 0))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h ? `+${h}:${String(m).padStart(2, '0')}:${s}` : `+${m}:${s}`
}

/** "4 min", "1 h 5 min": a pause somebody would notice. */
export function formatPause(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ''}`
}

/** A pause worth a line of its own in the story. */
export const PAUSE_SECONDS = 90

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`

/**
 * A title per chapter. Conversations are numbered in the order they began,
 * and a conversation somebody came back to says so instead of looking new.
 */
export function chapterTitles(chapters: StoryChapter[]): Record<number, string> {
  const conversations: string[] = []
  for (const chapter of chapters) {
    const id = chapter.conversation_id
    if (chapter.product === 'foodchat' && id && !conversations.includes(id)) conversations.push(id)
  }
  const seen = new Set<string>()
  const titles: Record<number, string> = {}
  for (const chapter of chapters) {
    const id = chapter.conversation_id
    if (chapter.product === 'foodchat' && id) {
      const number = conversations.indexOf(id) + 1
      const name = conversations.length > 1 ? `FoodChat conversation ${number}` : 'FoodChat conversation'
      titles[chapter.id] = seen.has(id) ? `${name}, continued` : name
      seen.add(id)
    } else {
      titles[chapter.id] = productOf(chapter.product).name
    }
  }
  return titles
}

/** What a chapter did, as short facts: "4 turns · 2 plans · 1 saved". */
export function chapterFacts(chapter: StoryChapter): string[] {
  const c = chapter.counts
  const facts: string[] = []
  if (c.turns) facts.push(plural(c.turns, 'turn'))
  if (c.plans) facts.push(plural(c.plans, 'plan'))
  if (c.plans_saved) facts.push(`${c.plans_saved.toLocaleString()} saved`)
  if (c.questions) facts.push(plural(c.questions, 'question'))
  if (c.searches) facts.push(plural(c.searches, 'search', 'searches'))
  if (c.recipes_opened) facts.push(plural(c.recipes_opened, 'recipe') + ' opened')
  if (!facts.length && c.pages) facts.push(plural(c.pages, 'page'))
  return facts
}

export interface Flag { key: string, label: string, icon: string, tone: 'bad' | 'warn' | 'good' }

/** What went wrong in a chapter, or in a whole visit, worst first. */
export function troubleFlags(c: Partial<StoryChapter['counts']>): Flag[] {
  const flags: Flag[] = []
  if (c.rated_down) flags.push({ key: 'down', label: `${c.rated_down} rated down`, icon: 'i-lucide-thumbs-down', tone: 'bad' })
  if (c.failed_turns) flags.push({ key: 'failed', label: plural(c.failed_turns, 'failed turn'), icon: 'i-lucide-message-square-x', tone: 'bad' })
  if (c.errors) flags.push({ key: 'errors', label: plural(c.errors, 'error'), icon: 'i-lucide-circle-alert', tone: 'bad' })
  if (c.frustration) flags.push({ key: 'clicks', label: plural(c.frustration, 'frustrated click'), icon: 'i-lucide-mouse-pointer-click', tone: 'warn' })
  if (c.found_nothing) flags.push({ key: 'nothing', label: `${c.found_nothing} found nothing`, icon: 'i-lucide-search-x', tone: 'warn' })
  if (c.unanswered) flags.push({ key: 'unanswered', label: `${c.unanswered} unanswered`, icon: 'i-lucide-circle-help', tone: 'warn' })
  if (c.rated_up) flags.push({ key: 'up', label: `${c.rated_up} rated up`, icon: 'i-lucide-thumbs-up', tone: 'good' })
  return flags
}

/** The whole visit's counts: the chapters added up. */
export function storyTotals(story: SessionStory | null | undefined): StoryChapter['counts'] {
  const totals = {
    turns: 0, failed_turns: 0, plans: 0, plans_saved: 0, questions: 0, unanswered: 0,
    searches: 0, found_nothing: 0, recipes_opened: 0, rated_up: 0, rated_down: 0,
    errors: 0, frustration: 0, pages: 0
  }
  for (const chapter of story?.chapters ?? []) {
    for (const key of Object.keys(totals) as Array<keyof typeof totals>) {
      totals[key] += chapter.counts[key] ?? 0
    }
  }
  return totals
}

const quote = (text: string | null | undefined, max = 80) => {
  const value = (text ?? '').trim()
  if (!value) return ''
  return `“${value.length > max ? `${value.slice(0, max - 1)}…` : value}”`
}

/**
 * The visit in a few sentences — what somebody opening it wants before
 * anything else. Built from the story rather than written by a model: every
 * sentence can be checked against the moments below it.
 */
export function storyHeadline(story: SessionStory | null | undefined): string[] {
  const chapters = story?.chapters ?? []
  if (!chapters.length) return []
  const t = storyTotals(story)
  const lines: string[] = []

  const conversations = new Set(chapters.filter(c => c.product === 'foodchat' && c.conversation_id).map(c => c.conversation_id))
  if (t.turns) {
    let line = `Talked to FoodChat in ${plural(conversations.size || 1, 'conversation')} (${plural(t.turns, 'turn')})`
    if (t.plans) {
      line += `, made ${plural(t.plans, 'meal plan')}`
      line += t.plans_saved ? ` and saved ${t.plans_saved.toLocaleString()}` : ' and saved none'
    } else {
      line += ' without making a plan'
    }
    if (t.failed_turns) line += `; ${plural(t.failed_turns, 'turn')} failed`
    lines.push(`${line}.`)
  }

  const ratings = chapters.flatMap(c => c.moments).flatMap((m) => {
    if (m.kind === 'rating' && m.value) return [m]
    if (m.kind === 'question' && m.rating?.value) return [{ ...m.rating, kind: 'question' } as unknown as StoryMoment]
    return []
  })
  const down = ratings.filter(r => r.negative)
  if (down.length) {
    const said = down.map(r => quote(r.comment || r.reason, 60)).filter(Boolean)
    lines.push(
      `Rated ${plural(down.length, 'answer')} down${said.length ? `: ${said.slice(0, 3).join(', ')}` : ', without saying why'}.`
    )
  } else if (ratings.length) {
    lines.push(`Rated ${plural(ratings.length, 'answer')} up.`)
  }

  if (t.questions) {
    let line = `Asked FoodScholar ${plural(t.questions, 'question')}`
    if (t.unanswered) line += `, ${t.unanswered.toLocaleString()} never answered`
    lines.push(`${line}.`)
  }

  if (t.searches || t.recipes_opened) {
    const parts: string[] = []
    if (t.searches) {
      parts.push(`searched ${plural(t.searches, 'time')}${t.found_nothing ? ` (${t.found_nothing.toLocaleString()} found nothing)` : ''}`)
    }
    if (t.recipes_opened) parts.push(`opened ${plural(t.recipes_opened, 'recipe')}`)
    const line = parts.join(' and ')
    lines.push(`${line.charAt(0).toUpperCase()}${line.slice(1)}.`)
  }

  if (t.errors || t.frustration) {
    const parts: string[] = []
    if (t.errors) parts.push(`hit ${plural(t.errors, 'error')}`)
    if (t.frustration) parts.push(`clicked ${plural(t.frustration, 'time')} on something that did not respond`)
    const line = parts.join(' and ')
    lines.push(`${line.charAt(0).toUpperCase()}${line.slice(1)}.`)
  }

  if (!lines.length) lines.push('Looked around without chatting, asking, or searching.')
  return lines
}

/** Moments shown only when somebody asks for everything. */
export const QUIET_KINDS = new Set(['page', 'event'])

export type Tone = 'bad' | 'warn' | 'good' | 'quiet' | 'plain'

export function momentTone(m: StoryMoment): Tone {
  switch (m.kind) {
    case 'error':
    case 'client_error':
      return 'bad'
    case 'turn':
      return m.outcome && m.outcome !== 'ok' ? 'bad' : 'plain'
    case 'rating':
      if (!m.value) return 'plain'
      return m.negative ? 'bad' : 'good'
    case 'question':
      if (m.rating?.negative) return 'bad'
      return m.answered === false ? 'warn' : 'plain'
    case 'frustration':
    case 'abandoned':
      return 'warn'
    case 'search':
      return m.zero_result ? 'warn' : 'plain'
    case 'plan_saved':
    case 'favourite':
      return 'good'
    case 'page':
    case 'event':
      return 'quiet'
    default:
      return 'plain'
  }
}

export function momentIcon(m: StoryMoment): string {
  switch (m.kind) {
    case 'turn': return m.outcome && m.outcome !== 'ok' ? 'i-lucide-message-square-x' : 'i-lucide-message-square'
    case 'plan_generated': return 'i-lucide-utensils'
    case 'plan_saved': return 'i-lucide-bookmark-check'
    case 'rating': return m.negative ? 'i-lucide-thumbs-down' : 'i-lucide-thumbs-up'
    case 'question': return 'i-lucide-message-circle-question'
    case 'search': return m.zero_result ? 'i-lucide-search-x' : 'i-lucide-search'
    case 'page': return 'i-lucide-arrow-right'
    case 'recipe_view':
    case 'result_opened': return 'i-lucide-chef-hat'
    case 'compare': return 'i-lucide-git-compare'
    case 'favourite': return 'i-lucide-heart'
    case 'unfavourite': return 'i-lucide-heart-off'
    case 'citation': return 'i-lucide-quote'
    case 'abandoned': return 'i-lucide-circle-stop'
    case 'reading': return 'i-lucide-book-open'
    case 'error': return 'i-lucide-server-crash'
    case 'client_error': return 'i-lucide-bug'
    case 'frustration': return 'i-lucide-mouse-pointer-click'
    default: return 'i-lucide-dot'
  }
}

/** The one line a moment reads as. Details and links are the component's. */
export function momentTitle(m: StoryMoment): string {
  switch (m.kind) {
    case 'turn':
      if (m.outcome === 'error') return 'The turn failed'
      if (m.outcome === 'busy') return 'Sent a message while FoodChat was still busy'
      if (m.outcome && m.outcome !== 'ok') return chatStepLabel(m.outcome)
      return chatStepLabel(m.intent ?? 'unknown')
    case 'plan_generated':
      return `A ${m.plan_type ?? ''} plan was made`.replace('  ', ' ')
    case 'plan_saved':
      return 'Saved the plan'
    case 'rating': {
      const what = m.target_type === 'chat_message' ? 'a reply' : targetTypeLabel(m.target_type)
      // The feedback widget leaves words, not a verdict.
      if (!m.value) return m.target_type === 'feedback' ? 'Sent feedback' : `Left feedback on ${what}`
      return `Rated ${what} ${m.negative ? 'down' : 'up'}`
    }
    case 'question':
      return m.question ? `Asked ${quote(m.question, 140)}` : 'Asked a question (the words were not kept)'
    case 'search':
      return m.query ? `Searched for ${quote(m.query)}` : 'Searched (the words were not kept)'
    case 'page':
      return `Went to ${m.path ?? 'a page'}`
    case 'recipe_view':
      return 'Opened a recipe'
    case 'result_opened':
      return m.position ? `Opened search result ${m.position}` : 'Opened a search result'
    case 'compare':
      return 'Compared recipes'
    case 'favourite':
      return 'Added a recipe to favourites'
    case 'unfavourite':
      return 'Removed a favourite'
    case 'citation':
      return 'Opened a source an answer cited'
    case 'abandoned':
      return 'Stopped waiting for an answer'
    case 'reading':
      return `Read ${m.entry_type ? `a ${m.entry_type}` : 'an entry'}`
    case 'error':
      return `A request failed${m.status ? ` (${m.status})` : ''}`
    case 'client_error':
      return `The page hit an error${m.name ? `: ${m.name}` : ''}`
    case 'frustration':
      return `${m.click_kind === 'rage' ? 'Clicked again and again on' : 'Clicked, and nothing happened:'} ${controlName(m)}`
    case 'event':
      return eventLabel(m.event_type ?? 'event')
    default:
      return eventLabel(m.kind)
  }
}

/** The list row's sentence: what a visit amounted to, in a dozen words. */
export function visitSentence(did: {
  chat_turns?: number
  meal_plans_generated?: number
  meal_plans_saved?: number
  questions_asked?: number
  searches?: number
  recipes_viewed?: number
} | undefined): string {
  if (!did) return ''
  const parts: string[] = []
  if (did.meal_plans_generated) {
    parts.push(`${plural(did.meal_plans_generated, 'plan')} made${did.meal_plans_saved ? `, ${did.meal_plans_saved} saved` : ''}`)
  } else if (did.chat_turns) {
    parts.push(`chatted (${plural(did.chat_turns, 'turn')}), no plan`)
  }
  if (did.questions_asked) parts.push(`asked ${plural(did.questions_asked, 'question')}`)
  if (did.searches) parts.push(plural(did.searches, 'search', 'searches'))
  if (did.recipes_viewed) parts.push(`opened ${plural(did.recipes_viewed, 'recipe')}`)
  const sentence = parts.join(' · ')
  return sentence ? sentence.charAt(0).toUpperCase() + sentence.slice(1) : ''
}
