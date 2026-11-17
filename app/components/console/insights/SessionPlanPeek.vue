<template>
  <div class="rounded-lg border border-gray-200/70 bg-gray-50/60 p-3 text-sm dark:border-white/10 dark:bg-white/[0.03]">
    <div
      v-if="loading"
      class="animate-pulse space-y-2"
      role="status"
      aria-label="Loading the plan"
    >
      <div class="h-3 w-1/3 rounded bg-gray-200 dark:bg-zinc-800" />
      <div class="h-3 w-2/3 rounded bg-gray-200 dark:bg-zinc-800" />
      <div class="h-3 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
    </div>

    <p
      v-else-if="!plan"
      class="text-gray-500 dark:text-gray-400"
    >
      {{ unavailable }}
    </p>

    <div
      v-else
      class="space-y-4"
    >
      <p class="text-xs text-gray-500 dark:text-gray-400">
        {{ plan.plan_type === 'weekly' ? 'Week plan' : 'Day plan' }} · version {{ plan.version }}
        <template v-if="plan.saved">
          · saved
        </template>
        <template v-if="plan.parent_id">
          · changed from an earlier version
        </template>
      </p>

      <!-- What it was asked for, before what it gave: the comparison a reviewer makes. -->
      <ConsoleInsightsPlanRequestSummary :request="plan.request" />

      <!-- The dishes, per meal and per day: what the member actually got. -->
      <div class="space-y-3">
        <div
          v-for="day in days"
          :key="day.label"
        >
          <p
            v-if="day.label"
            class="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
          >
            {{ day.label }}
          </p>
          <dl class="space-y-1">
            <div
              v-for="(meal, index) in day.meals"
              :key="index"
              class="grid grid-cols-[6.5rem_1fr] gap-2"
            >
              <dt class="capitalize text-gray-500 dark:text-gray-400">
                {{ meal.meal_type || 'Meal' }}
              </dt>
              <dd class="min-w-0 text-gray-900 dark:text-white">
                <span
                  v-for="(plate, p) in meal.plates"
                  :key="p"
                >
                  <span v-if="p">, </span>
                  <NuxtLink
                    v-if="plate.recipe_id"
                    :to="`/recipe-wrangler/${encodeURIComponent(plate.recipe_id)}`"
                    class="hover:underline"
                    target="_blank"
                  >{{ plate.title || 'Untitled dish' }}</NuxtLink>
                  <span v-else>{{ plate.title || 'Untitled dish' }}</span>
                  <span
                    v-if="plate.role && plate.role !== 'main'"
                    class="text-gray-400 dark:text-gray-500"
                  > ({{ plate.role }})</span>
                  <span
                    v-if="plate.kcal"
                    class="tabular-nums text-gray-400 dark:text-gray-500"
                  > · {{ Math.round(plate.kcal) }} kcal</span>
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- The judges' verdicts with their reasons: usually the answer to
           "why did they rate it down" is already written here. -->
      <div v-if="plan.scores.length">
        <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          How FoodChat judged it
        </p>
        <ul class="space-y-1.5">
          <li
            v-for="score in plan.scores"
            :key="score.name"
          >
            <span class="font-medium text-gray-900 dark:text-white">{{ scoreName(score.name) }}</span>
            <span
              v-if="score.score !== null"
              class="ml-1 tabular-nums text-gray-500 dark:text-gray-400"
            >{{ score.score }}</span>
            <span
              v-if="score.reasoning"
              class="text-gray-600 dark:text-gray-300"
            > — {{ score.reasoning }}</span>
          </li>
        </ul>
      </div>

      <div v-if="plan.constraints_applied.length">
        <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          What it was held to
        </p>
        <div class="flex flex-wrap gap-1.5">
          <UBadge
            v-for="(row, index) in plan.constraints_applied"
            :key="index"
            :color="constraintColor(row.status)"
            variant="subtle"
            size="sm"
            :title="row.detail || undefined"
          >
            {{ row.constraint || 'Unnamed rule' }}<template v-if="row.status">
              · {{ row.status }}
            </template>
          </UBadge>
        </div>
      </div>

      <details
        v-if="plan.reasoning"
        class="text-gray-600 dark:text-gray-300"
      >
        <summary class="cursor-pointer text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          Why FoodChat chose these
        </summary>
        <p class="mt-1 whitespace-pre-line">
          {{ plan.reasoning }}
        </p>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import insightsApi, { type PlanReview } from '~/services/insightsApi'

/**
 * One FoodChat plan, opened from a session's story.
 *
 * A session only recorded that a plan was made, so a thumbs-down on it could
 * not be checked against what was on it. Loaded when opened, not with the
 * page: it is a read from FoodChat, and the gateway records each one.
 */

const props = defineProps<{ planId: string }>()

const loading = ref(true)
const review = ref<PlanReview | null>(null)

const plan = computed(() => (review.value?.available ? review.value.plan : null))

const unavailable = computed(() =>
  review.value?.reason ?? 'The plan could not be loaded. FoodChat or the gateway did not answer.'
)

const SCORES: Record<string, string> = {
  overall: 'Overall',
  fruit_and_veg: 'Fruit and veg',
  variety: 'Variety',
  guidelines: 'Guidelines'
}
const scoreName = (name: string) => SCORES[name] ?? name

function constraintColor(status: string | undefined) {
  switch ((status ?? '').toLowerCase()) {
    case 'satisfied':
    case 'met':
      return 'success' as const
    case 'violated':
    case 'unmet':
      return 'error' as const
    case 'relaxed':
    case 'partial':
    case 'unsupported':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}

/** Meals grouped by day, so a week reads as seven short lists. */
const days = computed(() => {
  const meals = plan.value?.meals ?? []
  const multiDay = new Set(meals.map(meal => meal.day)).size > 1
  if (!multiDay) return [{ label: '', meals }]
  const byDay = new Map<number | null, typeof meals>()
  for (const meal of meals) {
    const list = byDay.get(meal.day) ?? []
    list.push(meal)
    byDay.set(meal.day, list)
  }
  return [...byDay.entries()].map(([day, list]) => ({ label: day ? `Day ${day}` : '', meals: list }))
})

onMounted(async () => {
  review.value = await insightsApi.getPlanReview(props.planId)
  loading.value = false
})
</script>
