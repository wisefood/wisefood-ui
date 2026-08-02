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

/** Display order for slots. Anything unlisted sorts after, alphabetically. */
const SLOT_ORDER: readonly string[] = [
  'breakfast',
  'brunch',
  'lunch',
  'snack',
  'dinner',
  'side',
  'dessert',
  'drink'
]

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

export function slotIcon(slot: string): string {
  const key = String(slot || '').toLowerCase()
  if (SLOT_ICONS[key]) return SLOT_ICONS[key]
  // Substring match keeps "second breakfast" and "late dinner" sensible.
  const match = Object.keys(SLOT_ICONS).find(known => key.includes(known))
  return match ? SLOT_ICONS[match]! : 'i-lucide-utensils'
}

export function slotTime(slot: string): string | null {
  return SLOT_TIMES[String(slot || '').toLowerCase()] ?? null
}

/** `main-dish` -> `Main Dish`, `breakfast` -> `Breakfast`. */
export function humaniseSlot(slot: string): string {
  return String(slot || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

function sortIndex(slot: string): number {
  const index = SLOT_ORDER.indexOf(String(slot || '').toLowerCase())
  return index === -1 ? SLOT_ORDER.length : index
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

  return raw
    .map((meal, index) => ({
      key: `${meal.slot}-${meal.recipe.recipe_id}-${index}`,
      slot: meal.slot,
      role: meal.role,
      recipe: meal.recipe,
      time: slotTime(meal.slot),
      icon: slotIcon(meal.slot),
      partOfMultiCourse: (perSlot.get(meal.slot) ?? 0) > 1
    }))
    .sort((a, b) => {
      const order = sortIndex(a.slot) - sortIndex(b.slot)
      return order !== 0 ? order : a.slot.localeCompare(b.slot)
    })
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
