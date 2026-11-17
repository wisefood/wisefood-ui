import type { PlanRequest, TranscriptMessage } from '~/services/insightsApi'

/**
 * Which messages of a FoodChat conversation one turn of a session's story was.
 *
 * The story knows a turn by its conversation, its number in this visit, when
 * it was reported and, if it made one, its plan. FoodChat's transcript knows
 * messages by id and time. They are joined here, in order of how sure the
 * join is:
 *
 * 1. `plan`: the reply that made the turn's plan (stamped on messages since
 *    2026-11-17).
 * 2. `time`: the latest reply saved before the turn was reported. FoodChat
 *    saves the reply, then reports the turn a few seconds later, on the same
 *    clock; a reply more than three minutes earlier is somebody else's turn.
 * 3. `order`: the reply to the n-th message of the conversation. Only right
 *    when this visit saw the conversation from its start, so the panel says
 *    when it fell back to it.
 */
export type TurnMatch = 'plan' | 'time' | 'order'

export interface TurnExchange {
  /** What the person wrote, since FoodChat last answered. */
  asked: TranscriptMessage[]
  reply: TranscriptMessage | null
  how: TurnMatch | null
}

const AFTER_REPORT_MS = 5_000
const BEFORE_REPORT_MS = 180_000

function timeOf(message: TranscriptMessage): number | null {
  if (!message.timestamp) return null
  const at = Date.parse(message.timestamp)
  return Number.isFinite(at) ? at : null
}

function askedBefore(messages: TranscriptMessage[], replyIndex: number): TranscriptMessage[] {
  const asked: TranscriptMessage[] = []
  for (let i = replyIndex - 1; i >= 0; i--) {
    const message = messages[i]
    if (!message || message.role === 'assistant') break
    if (message.role === 'user') asked.unshift(message)
  }
  return asked
}

export function findTurnExchange(
  messages: TranscriptMessage[],
  turn: { occurredAt?: string | null, number?: number | null, planId?: string | null }
): TurnExchange {
  const found = (index: number, how: TurnMatch): TurnExchange => ({
    asked: askedBefore(messages, index),
    reply: messages[index] ?? null,
    how
  })

  if (turn.planId) {
    const index = messages.findIndex(m => m.role === 'assistant' && m.plan_id === turn.planId)
    if (index >= 0) return found(index, 'plan')
  }

  const reported = turn.occurredAt ? Date.parse(turn.occurredAt) : Number.NaN
  if (Number.isFinite(reported)) {
    let best = -1
    messages.forEach((message, index) => {
      if (message.role !== 'assistant') return
      const at = timeOf(message)
      if (at === null || at > reported + AFTER_REPORT_MS || at < reported - BEFORE_REPORT_MS) return
      const current = best >= 0 ? messages[best] : undefined
      const bestAt = current ? timeOf(current) : null
      if (bestAt === null || at >= bestAt) best = index
    })
    if (best >= 0) return found(best, 'time')
  }

  if (turn.number && turn.number > 0) {
    let seen = 0
    for (let i = 0; i < messages.length; i++) {
      if (messages[i]?.role !== 'user') continue
      // Consecutive messages before one reply are one turn.
      if (i > 0 && messages[i - 1]?.role === 'user') continue
      seen += 1
      if (seen === turn.number) {
        const reply = messages.findIndex((m, j) => j > i && m.role === 'assistant')
        return reply >= 0
          ? found(reply, 'order')
          : { asked: askedBefore(messages, messages.length), reply: null, how: 'order' }
      }
    }
  }

  return { asked: [], reply: null, how: null }
}

/** FoodChat's reading of a request, as lines a reviewer can scan. */
export function readingLines(request: PlanRequest | null | undefined): string[] {
  const reading = request?.reading
  if (!reading) return []
  const lines: string[] = []
  const spec = reading.spec ?? {}
  const shape: string[] = []
  if (spec.num_days) shape.push(spec.num_days === 1 ? '1 day' : `${spec.num_days} days`)
  if (spec.meals?.length) shape.push(spec.meals.join(', '))
  if (shape.length) lines.push(shape.join(' · '))
  const plates = Object.keys(spec.plates ?? {}).length
  if (plates) lines.push(`Plates asked for in ${plates} meal${plates === 1 ? '' : 's'}`)
  const anchors = Object.keys(reading.anchors ?? {}).length
  if (anchors) lines.push(`${anchors} dish${anchors === 1 ? '' : 'es'} chosen by the member`)
  if (reading.excluded_recipe_ids?.length) lines.push(`${reading.excluded_recipe_ids.length} recipes ruled out`)
  if (reading.pantry?.length) lines.push(`Cooking from: ${reading.pantry.join(', ')}`)
  if (reading.diet_tags?.length) lines.push(`Diet: ${reading.diet_tags.join(', ')}`)
  if (reading.claim_tags?.length) lines.push(`Asked for: ${reading.claim_tags.join(', ')}`)
  if (reading.max_minutes) lines.push(`At most ${reading.max_minutes} minutes to cook`)
  if (reading.use_favorites) lines.push('Use their favourites')
  for (const [label, values] of [
    ['Cuisine', reading.cuisines],
    ['Mood', reading.moods],
    ['Flavour', reading.flavor_profiles],
    ['Food groups', reading.food_groups]
  ] as const) {
    if (values?.length) lines.push(`${label}: ${values.join(', ')}`)
  }
  return lines
}

/** The profile a plan was built around, as lines. */
export function profileLines(request: PlanRequest | null | undefined): string[] {
  const profile = request?.profile
  if (!profile) return []
  const lines: string[] = []
  if (profile.diet?.length) lines.push(`Diet: ${profile.diet.join(', ')}`)
  if (profile.allergies?.length) lines.push(`Allergies: ${profile.allergies.join(', ')}`)
  if (profile.calorie_target) lines.push(`${profile.calorie_target} kcal a day`)
  if (profile.dietary_goals?.length) lines.push(`Goals: ${profile.dietary_goals.join(', ')}`)
  if (profile.min_nutri_score) lines.push(`Nutri-Score ${profile.min_nutri_score} or better`)
  if (profile.preferences?.length) lines.push(`Preferences: ${profile.preferences.join(', ')}`)
  if (profile.food_likes?.length) lines.push(`Likes: ${profile.food_likes.join(', ')}`)
  if (profile.food_dislikes?.length) lines.push(`Dislikes: ${profile.food_dislikes.join(', ')}`)
  if (profile.age_group) lines.push(`Age group: ${profile.age_group}`)
  return lines
}
