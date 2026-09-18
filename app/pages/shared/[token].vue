<!--
  A shared meal plan, read by someone with no account.

  The only page in the app that expects no session. It asks for the plan with
  a plain fetch, renders what comes back, and says nothing about who made it —
  the server already removed that, and this page must not invent a way to put
  it back.
-->
<template>
  <div class="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
    <div class="mb-8 flex items-center justify-between gap-4">
      <img
        src="/logo.png"
        alt="WiseFood"
        class="h-9 w-auto"
        width="72"
        height="36"
      >
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        to="/"
        icon="i-lucide-arrow-right"
        trailing
      >
        {{ t('shared.discover') }}
      </UButton>
    </div>

    <div
      v-if="pending"
      class="flex items-center gap-2 py-16 text-sm text-gray-500 dark:text-gray-400"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="h-4 w-4 animate-spin"
      />
      {{ t('shared.loading') }}
    </div>

    <!-- Unknown, revoked and expired look identical here, exactly as they do
         on the server: telling them apart would help someone guessing. -->
    <div
      v-else-if="!plan"
      class="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-white/10 dark:bg-zinc-900"
    >
      <UIcon
        name="i-lucide-link-2-off"
        class="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600"
      />
      <h1 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
        {{ t('shared.goneTitle') }}
      </h1>
      <p class="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
        {{ t('shared.goneBody') }}
      </p>
      <UButton
        class="mt-6"
        color="primary"
        to="/"
      >
        {{ t('shared.goneCta') }}
      </UButton>
    </div>

    <div v-else>
      <header class="mb-8">
        <p class="text-xs font-medium uppercase tracking-wide text-primary-600 dark:text-primary-400">
          {{ t('shared.eyebrow') }}
        </p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          {{ plan.title || t('shared.fallbackTitle') }}
        </h1>
        <p
          v-if="plan.payload?.date"
          class="mt-1 text-sm text-gray-500 dark:text-gray-400"
        >
          {{ formatDate(plan.payload.date) }}
        </p>
      </header>

      <!-- A weekly share carries `days`; a daily one carries `meals`. Same
           dish cards either way, grouped by day when there is more than one,
           so a week reads as a week rather than as one very long day. -->
      <section
        v-for="day in days"
        :key="day.key"
        class="mb-10"
      >
        <h2
          v-if="day.label"
          class="mb-4 border-b border-gray-100 pb-2 text-sm font-semibold text-gray-900 dark:border-zinc-800 dark:text-white"
        >
          {{ day.label }}
          <span
            v-if="day.summary"
            class="ml-2 font-normal text-gray-400 dark:text-gray-500"
          >{{ day.summary }}</span>
        </h2>

        <section
          v-for="slot in day.slots"
          :key="`${day.key}-${slot.name}`"
          class="mb-8"
        >
          <h2 class="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500">
            {{ t(`shared.slots.${slot.name}`) }}
          </h2>
          <article
            v-for="(dish, i) in slot.dishes"
            :key="`${slot.name}-${i}`"
            class="mb-3 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-zinc-900"
          >
            <img
              v-if="dish.image_url"
              :src="dish.image_url"
              :alt="dish.title || ''"
              class="h-44 w-full object-cover"
              loading="lazy"
            >
            <div class="p-5">
              <div class="flex items-start justify-between gap-3">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  {{ dish.title || t('shared.untitled') }}
                </h3>
                <UBadge
                  v-if="dish.role"
                  color="neutral"
                  variant="soft"
                  size="sm"
                  class="shrink-0"
                >
                  {{ dish.role }}
                </UBadge>
              </div>
              <p
                v-if="kcal(dish)"
                class="mt-1 text-xs text-gray-500 dark:text-gray-400"
              >
                {{ kcal(dish) }}
              </p>
              <p
                v-if="dish.ingredients"
                class="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-gray-300"
              >
                {{ dish.ingredients }}
              </p>
              <details
                v-if="dish.directions"
                class="mt-3"
              >
                <summary class="cursor-pointer text-sm font-medium text-primary-600 dark:text-primary-400">
                  {{ t('shared.directions') }}
                </summary>
                <p class="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {{ dish.directions }}
                </p>
              </details>
            </div>
          </article>
        </section>
      </section>

      <footer class="mt-10 rounded-2xl bg-gray-50 p-6 text-center dark:bg-zinc-900/60">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          {{ t('shared.ctaBody') }}
        </p>
        <UButton
          class="mt-3"
          color="primary"
          to="/"
        >
          {{ t('shared.ctaButton') }}
        </UButton>
        <p class="mt-4 text-[0.6875rem] leading-relaxed text-gray-400 dark:text-gray-500">
          {{ t('shared.privacyNote') }}
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import sharingApi, { type SharedDish, type SharedPlan } from '~/services/sharingApi'

/*
 * No layout chrome and no auth. `layout: 'auth'` is the bare shell — the app
 * header would offer a signed-out reader navigation they cannot use, and the
 * global middleware leaves this route alone because it belongs to somebody
 * who has no account to check.
 */
definePageMeta({
  layout: 'auth'
})

const { t } = useI18n()
const route = useRoute()
const token = String(route.params.token ?? '')

const plan = ref<SharedPlan | null>(null)
const pending = ref(true)

/*
 * `noindex` is the whole difference between "anyone with the link" and
 * "anyone at all". The API sends the header too; this covers the case of a
 * crawler that renders the page rather than reading the response headers.
 * `no-referrer` keeps the token out of the logs of any site linked from here.
 */
useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow, noarchive' },
    { name: 'referrer', content: 'no-referrer' }
  ]
})
useSeoMeta({ title: () => plan.value?.title || t('shared.fallbackTitle') })

onMounted(async () => {
  plan.value = await sharingApi.readShare(token)
  pending.value = false
})

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
  'Saturday', 'Sunday']

/**
 * One dish, from whichever shape the sender's plan uses.
 *
 * A share carries the plan EXACTLY as its own service returns it, and three
 * services return three shapes. This page only knew the gateway's — a slot map
 * of dishes with `title` — so a FoodChat plan rendered as a week of "Untitled
 * dish": the calories were found (`nutrition` is spelled the same everywhere)
 * and the name was not, because FoodChat carries RecipeWrangler's
 * `recipe_title`.
 */
function asDish(raw: unknown): SharedDish | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  // A weekly entry wraps its dish; a slot map holds it directly.
  const recipe = (row.recipe && typeof row.recipe === 'object'
    ? row.recipe
    : row) as Record<string, unknown>
  const title = String(recipe.recipe_title ?? recipe.title ?? '').trim()
  const id = String(recipe.recipe_id ?? '').trim()
  if (!title && !id) return null
  return {
    recipe_id: id || undefined,
    title: title || undefined,
    role: (row.role ?? recipe.role ?? null) as string | null,
    nutrition: (recipe.nutrition ?? null) as Record<string, unknown> | null,
    image_url: (recipe.image_url ?? null) as string | null
  }
}

/** Slots in the order anyone eats them, each normalised to a list. */
function slotsOf(meals: Record<string, unknown>) {
  const known = ['breakfast', 'lunch', 'dinner']
  // Any slot the plan actually used, with the familiar three first: a week
  // can carry a snack or a dessert, and dropping them would silently lose
  // food the sender meant to share.
  const names = [...known, ...Object.keys(meals).filter(n => !known.includes(n))]
  return names
    .map(name => ({
      name,
      dishes: (Array.isArray(meals[name]) ? meals[name] : [meals[name]])
        .map(asDish)
        .filter(Boolean) as SharedDish[]
    }))
    .filter(slot => slot.dishes.length)
}

/**
 * One entry per day. A daily share becomes a single unlabelled day, so it
 * renders exactly as it did before; a weekly one gets a heading per day.
 */
/** A FoodChat weekly plan: flat `entries`, each naming its day and slot. */
function daysFromEntries(payload: Record<string, unknown>) {
  const entries = payload.entries
  if (!Array.isArray(entries) || !entries.length) return null
  const summaries = (payload.day_summaries ?? {}) as Record<string, string>
  const byDay = new Map<number, Record<string, unknown[]>>()
  for (const entry of entries as Record<string, unknown>[]) {
    const day = Number(entry.day ?? 1) || 1
    const slot = String(entry.meal_type ?? 'meal').toLowerCase()
    const slots = byDay.get(day) ?? {}
    ;(slots[slot] = (slots[slot] as unknown[]) ?? []).push(entry)
    byDay.set(day, slots)
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, slots]) => ({
      key: String(day),
      label: WEEKDAYS[(day - 1) % 7] ?? `Day ${day}`,
      summary: summaries[String(day)] ?? summaries[day as unknown as string] ?? '',
      slots: slotsOf(slots as Record<string, unknown>)
    }))
    .filter(day => day.slots.length)
}

/** A FoodChat daily plan: `days[].meals[]`, each meal a list of plates. */
function daysFromPlates(payload: Record<string, unknown>) {
  const days = payload.days
  if (!Array.isArray(days) || !days.length) return null
  const out = days.map((raw) => {
    const day = raw as Record<string, unknown>
    const meals = Array.isArray(day.meals) ? day.meals : []
    // Only the plate-shaped form; a gateway day already keys its slots.
    if (!meals.length || !(meals[0] as Record<string, unknown>)?.plates) return null
    const slots: Record<string, unknown[]> = {}
    for (const meal of meals as Record<string, unknown>[]) {
      const slot = String(meal.meal_type ?? 'meal').toLowerCase()
      slots[slot] = (Array.isArray(meal.plates) ? meal.plates : []) as unknown[]
    }
    return {
      key: String(day.day ?? 1),
      label: days.length > 1 ? `Day ${day.day ?? 1}` : '',
      summary: '',
      slots: slotsOf(slots as Record<string, unknown>)
    }
  })
  return out.every(Boolean) ? (out as NonNullable<(typeof out)[number]>[]) : null
}

const days = computed(() => {
  const payload = plan.value?.payload as Record<string, unknown> | undefined
  if (!payload) return []

  const fromEntries = daysFromEntries(payload)
  if (fromEntries?.length) return fromEntries
  const fromPlates = daysFromPlates(payload)
  if (fromPlates?.length) return fromPlates.filter(day => day.slots.length)

  if ((payload as { days?: unknown[] }).days?.length) {
    return ((payload as { days: Array<Record<string, unknown>> }).days).map(day => ({
      key: String(day.day),
      label: WEEKDAYS[(Number(day.day) - 1) % 7] ?? `Day ${day.day}`,
      summary: day.summary || '',
      slots: slotsOf((day.meals ?? {}) as Record<string, unknown>)
    })).filter(day => day.slots.length)
  }
  const slots = slotsOf((payload.meals ?? {}) as Record<string, unknown>)
  return slots.length ? [{ key: 'day', label: '', summary: '', slots }] : []
})

function kcal(dish: SharedDish): string {
  const nutrition = dish.nutrition as { kcal?: number, calories?: number } | null
  const value = nutrition?.kcal ?? nutrition?.calories
  return value ? `${Math.round(Number(value))} kcal` : ''
}

function formatDate(value: string): string {
  const when = new Date(value)
  return Number.isNaN(when.getTime()) ? value : when.toLocaleDateString()
}
</script>
