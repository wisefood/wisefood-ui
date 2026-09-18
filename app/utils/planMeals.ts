/**
 * One way to read a meal plan, whatever shape it arrived in.
 *
 * A daily plan has been three named fields — `breakfast`, `lunch`, `dinner` —
 * since the day the endpoint returned three named fields. The planner no longer
 * has that limit: it fills any slots, over any days, and a meal can be several
 * courses. Every template that reads `plan.breakfast` directly is a place where
 * a fourth meal silently disappears, so they all read this instead.
 *
 * Normalising rather than migrating is deliberate. Stored plans use the old
 * shape and will for as long as plan history is worth keeping, so both have to
 * work — and a component that has to ask which one it received is a component
 * that will eventually forget to.
 */

import type { MealPlan, MealRecipe } from '~/services/foodchatApi'

/**
 * Suggested clock times, used only as a display hint.
 *
 * Previously hardcoded per template block (08:00 / 13:00 / 19:30). A slot with
 * no suggested time simply shows none — inventing "14:45" for a snack would be
 * asserting something about the user's day that nobody told us.
 */
const SLOT_TIMES: Record<string, string> = {
  breakfast: '08:00',
  brunch: '10:30',
  lunch: '13:00',
  snack: '16:00',
  dinner: '19:30',
  dessert: '20:30'
}

/**
 * Slots whose clock time comes from their POSITION, never from the table.
 *
 * `SLOT_TIMES` lists 16:00 for a snack, which was only ever true of a day with
 * one snack in the afternoon. A member can now ask for two ("include two snack
 * as well in-between"), and can move one, so the name stopped being evidence
 * of the hour.
 */
const IN_BETWEEN = new Set(['snack'])

const SLOT_ICONS: Record<string, string> = {
  breakfast: 'i-lucide-coffee',
  brunch: 'i-lucide-croissant',
  lunch: 'i-lucide-utensils',
  snack: 'i-lucide-cookie',
  dinner: 'i-lucide-moon',
  supper: 'i-lucide-moon',
  dessert: 'i-lucide-ice-cream-cone',
  side: 'i-lucide-salad',
  drink: 'i-lucide-cup-soda'
}

export interface NormalisedMeal {
  /** Stable key for `v-for` — slot alone is not unique in a multi-course meal. */
  key: string
  slot: string
  /** main | side | dessert | drink — which plate of its meal this is. */
  role: string
  recipe: MealRecipe
  time: string | null
  icon: string
  /** True when this slot has more than one plate, so the UI can group them. */
  partOfMultiCourse: boolean
}

/**
 * A repeated slot's kind. `snack_2` -> `snack`.
 *
 * A day can now hold more than one of a meal — "two snacks in-between" — and
 * the backend names the second one `snack_2`. The suffix is an identity, not a
 * label: it keeps two snacks apart in the plan, and every place that looks a
 * slot up by name (the icon table, the i18n key, the clock hint) wants the
 * kind, which is the word that has a translation and a cookie icon.
 */
export function slotKind(slot: string): string {
  return String(slot || '').toLowerCase().replace(/_[2-9]$/, '')
}

export function slotIcon(slot: string): string {
  const key = slotKind(slot)
  if (SLOT_ICONS[key]) return SLOT_ICONS[key]
  // Substring match keeps "second breakfast" and "late dinner" sensible.
  const match = Object.keys(SLOT_ICONS).find(known => key.includes(known))
  return match ? SLOT_ICONS[match]! : 'i-lucide-utensils'
}

export function slotTime(slot: string): string | null {
  return SLOT_TIMES[slotKind(slot)] ?? null
}

/** `main-dish` -> `Main Dish`, `breakfast` -> `Breakfast`, `snack_2` -> `Snack`. */
export function humaniseSlot(slot: string): string {
  return String(slot || '')
    .replace(/_[2-9]$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

/** `08:00` -> 480. `null` for anything that is not a clock time. */
function minutesOf(time: string | null): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(time || ''))
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function clockOf(minutes: number): string {
  const whole = Math.round(minutes)
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`
}

/**
 * Clock hints for a day, read from its ORDER rather than from slot names alone.
 *
 * `SLOT_TIMES` is a table of typical times, and it was the whole answer: every
 * snack showed 16:00 because the word "snack" maps to 16:00. That was already
 * wrong for a day the member had rearranged ("put the snack before lunch"),
 * and it becomes visibly wrong the moment a day has two snacks — both would
 * claim the same afternoon.
 *
 * So an anchor meal keeps its own time while the plan's order agrees with it,
 * and everything else is placed evenly between the nearest anchors on either
 * side. A slot with no anchor before it or none after gets no time at all,
 * which is the honest answer: inventing "14:45" for a snack asserts something
 * about someone's day that nobody told us.
 */
export function slotTimes(slots: string[]): Array<string | null> {
  // A snack has no hour of its own. It is defined by where it sits — that is
  // what "in-between" means — so taking 16:00 from the table put the day's
  // first snack after its lunch, and pushed the lunch to 17:10 to make room.
  // Lunch is at lunchtime; a snack is whenever the gap is.
  const times: Array<number | null> = slots.map(
    slot => (IN_BETWEEN.has(slotKind(slot)) ? null : minutesOf(slotTime(slot)))
  )

  // Drop any anchor that does not sit after the last one kept — the plan's
  // order is the member's, and the table is only a hint. A day whose breakfast
  // the member moved after dinner gets an interpolated time for it rather than
  // an 08:00 contradicting the card above it.
  let last = -1
  for (let i = 0; i < times.length; i++) {
    const at = times[i] ?? null
    if (at === null) continue
    if (at <= last) times[i] = null
    else last = at
  }

  const out: Array<string | null> = times.map(at => (at === null ? null : clockOf(at)))
  for (let i = 0; i < times.length; i++) {
    if ((times[i] ?? null) !== null) continue
    let before = i - 1
    while (before >= 0 && times[before] === null) before--
    let after = i + 1
    while (after < times.length && times[after] === null) after++
    if (before < 0 || after >= times.length) continue
    const span = times[after]! - times[before]!
    out[i] = clockOf(times[before]! + (span * (i - before)) / (after - before))
  }
  return out
}

/**
 * Every plate in a plan's first day, in display order, from either shape.
 *
 * `days` wins when present: it is strictly more expressive, and a plan carrying
 * both would otherwise render its legacy three-course subset and drop whatever
 * the extra plates were. The backend populates the scalar fields from day 1's
 * *main* plates precisely so both readings agree on what the main course is.
 */
export function planMeals(plan: MealPlan | null | undefined): NormalisedMeal[] {
  if (!plan) return []

  const raw: Array<{ slot: string, role: string, recipe: MealRecipe }> = []

  // `days` is what the backend serialises for a flexible plan — the same
  // `DayPlan -> Meal -> plates` structure it persists. Reading anything else
  // would mean translating on the way in, and a translation is where a plate
  // goes missing.
  //
  // Only day 1 is taken here: this function answers "what is on the plan
  // canvas", which shows one day. `planDays()` below returns them all.
  const day = plan.days?.[0]
  if (day && Array.isArray(day.meals) && day.meals.length > 0) {
    for (const meal of day.meals) {
      for (const plate of meal.plates || []) {
        if (!plate?.recipe_id) continue
        raw.push({
          slot: String(meal.meal_type || 'meal'),
          role: String(plate.role || 'main'),
          recipe: plate
        })
      }
    }
  } else {
    for (const slot of ['breakfast', 'lunch', 'dinner'] as const) {
      const recipe = plan[slot]
      if (recipe?.recipe_id) raw.push({ slot, role: 'main', recipe })
    }
  }

  // Which slots appear more than once — those are multi-course meals, and the
  // UI groups their plates under one heading instead of repeating it.
  const perSlot = new Map<string, number>()
  for (const meal of raw) {
    perSlot.set(meal.slot, (perSlot.get(meal.slot) ?? 0) + 1)
  }

  // Times for the day as a whole, because a slot's hour depends on where it
  // sits: the second snack of a day is not at the same hour as the first, and
  // neither is a snack the member moved before lunch.
  const times = slotTimes(raw.map(meal => meal.slot))

  return raw
    .map((meal, index) => ({
      key: `${meal.slot}-${meal.recipe.recipe_id}-${index}`,
      slot: meal.slot,
      role: meal.role,
      recipe: meal.recipe,
      time: times[index] ?? null,
      icon: slotIcon(meal.slot),
      partOfMultiCourse: (perSlot.get(meal.slot) ?? 0) > 1
    }))
  // NOT sorted. `raw` is built in the plan's OWN order — `days[0].meals` as the
  // backend serialised them — and that order is now something a member can
  // change ("put the snack before lunch"). Re-sorting by slot NAME put it
  // straight back, which is half of why a day could not be rearranged: two
  // independent sorters, this one and `slot_sort_key`, both insisting that a
  // snack belongs between lunch and dinner whatever the member's day is.
}

/** Meals grouped by slot, preserving order — one entry per meal, N plates each. */
export function planMealsBySlot(
  plan: MealPlan | null | undefined
): Array<{ slot: string, icon: string, time: string | null, plates: NormalisedMeal[] }> {
  const grouped: Array<{ slot: string, icon: string, time: string | null, plates: NormalisedMeal[] }> = []
  for (const meal of planMeals(plan)) {
    const existing = grouped.find(entry => entry.slot === meal.slot)
    if (existing) existing.plates.push(meal)
    else grouped.push({ slot: meal.slot, icon: meal.icon, time: meal.time, plates: [meal] })
  }
  return grouped
}

/**
 * The day's macro totals.
 *
 * Prefers the server's own `nutrition_total`, which sums every plate including
 * ones the client may not render. Falls back to summing what is on screen, so a
 * plan from before the backend computed totals still shows one.
 *
 * `complete` is carried through rather than assumed: a total that quietly omits
 * an unprofiled meal is a number someone might act on.
 */
export function planNutritionTotal(plan: MealPlan | null | undefined): {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  complete: boolean
} | null {
  if (!plan) return null

  const server = plan.nutrition_total
  if (server && typeof server.calories === 'number') {
    return {
      calories: server.calories ?? 0,
      protein_g: server.protein_g ?? 0,
      carbs_g: server.carbs_g ?? 0,
      fat_g: server.fat_g ?? 0,
      complete: server.complete !== false
    }
  }

  return mealsNutritionTotal(planMeals(plan))
}

/**
 * Totals for one set of meals — one day's, in practice.
 *
 * Returns null when nothing contributed. A plan whose meals carry no macros
 * rendered as "0 kcal · 0g protein · partial", which reads as a measurement
 * rather than as an absence: zero calories is a claim, and a wrong one. This
 * happens against a backend that predates carried macros, so it is a real
 * state, not a transient.
 */
export function mealsNutritionTotal(meals: NormalisedMeal[]): {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  complete: boolean
} | null {
  if (meals.length === 0) return null

  let complete = true
  let contributed = 0
  const totals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  for (const meal of meals) {
    const nutrition = meal.recipe.nutrition
    if (!nutrition || typeof nutrition.kcal !== 'number') {
      complete = false
      continue
    }
    contributed += 1
    totals.calories += nutrition.kcal ?? 0
    totals.protein_g += nutrition.protein_g ?? 0
    totals.carbs_g += nutrition.carbs_g ?? 0
    totals.fat_g += nutrition.fat_g ?? 0
  }
  if (contributed === 0) return null

  return { ...totals, complete }
}

/**
 * Every day of a plan as its own group of normalised meals.
 *
 * `planMeals` answers "what is on the canvas today" and reads day 1 only —
 * which silently amputated days 2..N of a multi-day plan at the last mile,
 * after the backend, the serializer and the store had all faithfully carried
 * them. Each group is produced by `planMeals` itself on a one-day shim, so
 * per-day normalisation (roles, multi-course grouping, slot order) cannot
 * drift from the single-day canvas.
 */
export function planDayGroups(plan: MealPlan | null | undefined): Array<{
  day: number
  meals: NormalisedMeal[]
}> {
  if (!plan?.days?.length) {
    const meals = planMeals(plan)
    return meals.length ? [{ day: 1, meals }] : []
  }
  return plan.days
    .map(day => ({
      day: day.day,
      meals: planMeals({ ...plan, days: [day] })
    }))
    .filter(group => group.meals.length > 0)
}

/** Tailwind grid classes for however many meals a plan turned out to have. */
export function mealGridColumns(count: number): string {
  if (count <= 1) return 'grid grid-cols-1'
  if (count === 2) return 'grid grid-cols-1 sm:grid-cols-2'
  if (count === 4) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  if (count >= 5) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  return 'grid grid-cols-1 sm:grid-cols-3'
}

/**
 * Every day of a plan, each with its meals grouped and totalled.
 *
 * `planMeals` answers "what is on today's canvas"; this answers "what does the
 * whole plan look like", which is what an N-day plan needs. Both read the same
 * `days` structure, so they cannot disagree about what a plan contains.
 */
export function planDays(plan: MealPlan | null | undefined): Array<{
  day: number
  meals: Array<{ slot: string, icon: string, time: string | null, plates: MealRecipe[] }>
}> {
  if (!plan?.days?.length) {
    const meals = planMeals(plan)
    if (!meals.length) return []
    const grouped: Record<string, MealRecipe[]> = {}
    for (const meal of meals) (grouped[meal.slot] ||= []).push(meal.recipe)
    return [{
      day: 1,
      meals: Object.entries(grouped).map(([slot, plates]) => ({
        slot, icon: slotIcon(slot), time: slotTime(slot), plates
      }))
    }]
  }

  return plan.days.map(day => ({
    day: day.day,
    meals: (day.meals || []).map(meal => ({
      slot: meal.meal_type,
      icon: slotIcon(meal.meal_type),
      time: slotTime(meal.meal_type),
      plates: (meal.plates || []).filter(plate => plate?.recipe_id)
    }))
  }))
}
