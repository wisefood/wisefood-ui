<template>
  <!--
    One RecipeWrangler adaptation, whatever the mode. Every mode answers in the
    same shape, so this renders the shape and not the mode. The caller puts its
    Save button in the `actions` slot, which only shows for a result that found
    a change.
  -->
  <div class="space-y-3">
    <!-- Nothing to suggest -->
    <div
      v-if="adaptation.status === 'no_suggestion' || adaptation.status === 'not_scored'"
      class="py-6 text-center space-y-2"
    >
      <UIcon
        :name="adaptation.status === 'no_suggestion' ? 'i-lucide-badge-check' : 'i-lucide-circle-help'"
        class="w-8 h-8 text-brandg-500 mx-auto"
      />
      <p class="text-sm text-zinc-700 dark:text-zinc-200 max-w-md mx-auto">
        {{ adaptation.reason || t(`recipeWrangler.detail.adaptation.${adaptation.status === 'no_suggestion' ? 'noSuggestion' : 'notScored'}`) }}
      </p>
    </div>

    <!-- The recipe already breaks the member's restrictions -->
    <div
      v-else-if="adaptation.status === 'not_suitable_for_user'"
      class="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4"
    >
      <div class="flex items-start gap-3">
        <UIcon
          name="i-lucide-triangle-alert"
          class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
        />
        <div class="min-w-0 space-y-2">
          <p class="text-sm font-medium text-amber-800 dark:text-amber-200">
            {{ t('recipeWrangler.detail.adaptation.notSuitable') }}
          </p>
          <ul
            v-if="adaptation.offending?.length"
            class="list-disc pl-4 space-y-0.5 text-xs text-amber-800 dark:text-amber-200"
          >
            <li
              v-for="line in adaptation.offending"
              :key="line"
            >
              {{ line }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- A change was found -->
    <div
      v-else-if="adaptation.status === 'adapted' && adaptation.adapted"
      class="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-3"
    >
      <p
        v-if="adaptation.benefit?.tip"
        class="font-semibold text-zinc-900 dark:text-white text-sm"
      >
        {{ adaptation.benefit.tip }}
      </p>

      <!-- Metric: before to after, with the signed change -->
      <div
        v-if="metric"
        class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-700 dark:text-zinc-200"
      >
        <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ metricLabel }}</span>
        <span class="font-mono">{{ formatValue(metric.before) }}</span>
        <UIcon
          name="i-lucide-arrow-right"
          class="w-3.5 h-3.5 text-brandg-500 flex-shrink-0"
        />
        <span class="font-mono font-semibold text-brandg-700 dark:text-brandg-300">{{ formatValue(metric.after) }}</span>
        <span
          v-if="typeof metric.change === 'number'"
          class="text-[0.625rem] font-medium px-1.5 py-0.5 rounded bg-brandg-100 dark:bg-brandg-900/30 text-brandg-700 dark:text-brandg-300"
        >
          {{ formatSigned(metric.change) }}
        </span>
        <span
          v-if="gradeBefore && gradeAfter"
          class="inline-flex items-center gap-1"
        >
          <span :class="['w-5 h-5 rounded-sm flex items-center justify-center text-[0.625rem] font-bold text-white', getNutriScoreColorBg(gradeBefore)]">{{ gradeBefore }}</span>
          <UIcon
            name="i-lucide-arrow-right"
            class="w-3 h-3 text-zinc-400"
          />
          <span :class="['w-5 h-5 rounded-sm flex items-center justify-center text-[0.625rem] font-bold text-white', getNutriScoreColorBg(gradeAfter)]">{{ gradeAfter }}</span>
        </span>
      </div>

      <!-- New title, when the mode renamed the dish -->
      <p
        v-if="titleChanged"
        class="text-sm text-zinc-700 dark:text-zinc-200"
      >
        <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ t('recipeWrangler.detail.adaptation.newTitle') }}</span>
        <span class="ml-1.5 font-semibold text-brandg-700 dark:text-brandg-300">{{ adaptation.adapted.title }}</span>
      </p>

      <!-- Changed ingredient lines -->
      <ul
        v-if="changedLines.length"
        class="space-y-1.5"
      >
        <li
          v-for="row in changedLines"
          :key="row.index"
          class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm min-w-0"
        >
          <span
            v-if="row.before && row.before !== row.after"
            class="line-through text-zinc-500 dark:text-zinc-400"
          >{{ row.before }}</span>
          <UIcon
            v-if="row.before && row.before !== row.after"
            name="i-lucide-arrow-right"
            class="w-4 h-4 text-brandg-500 flex-shrink-0"
          />
          <span class="font-semibold text-brandg-700 dark:text-brandg-300">{{ row.after }}</span>
        </li>
      </ul>

      <!-- Changed steps -->
      <ul
        v-if="changedSteps.length"
        class="space-y-1.5"
      >
        <li
          v-for="row in changedSteps"
          :key="row.index"
          class="rounded-lg bg-brandg-50 dark:bg-brandg-900/20 px-3 py-2 text-sm text-zinc-800 dark:text-zinc-100"
        >
          <span class="block text-[0.625rem] font-semibold uppercase tracking-wide text-brandg-700 dark:text-brandg-300">
            {{ t('recipeWrangler.detail.adaptation.stepLabel', { n: row.index + 1 }) }}
          </span>
          {{ row.text }}
        </li>
      </ul>

      <!-- Flags -->
      <div
        v-if="flagLabels.length"
        class="flex flex-wrap items-center gap-1.5"
      >
        <span
          v-for="flag in flagLabels"
          :key="flag"
          class="text-[0.625rem] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
        >
          {{ flag }}
        </span>
      </div>

      <!-- The whole adapted recipe -->
      <details class="group rounded-lg border border-zinc-100 dark:border-zinc-800">
        <summary class="cursor-pointer select-none list-none flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-brandg-700 dark:hover:text-brandg-300">
          <UIcon
            name="i-lucide-chevron-right"
            class="w-3.5 h-3.5 transition-transform group-open:rotate-90"
          />
          {{ t('recipeWrangler.detail.adaptation.showFull') }}
        </summary>
        <div class="px-3 pb-3 space-y-3">
          <div>
            <p class="text-[0.625rem] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-1">
              {{ t('recipeWrangler.detail.adaptation.fullIngredients') }}
            </p>
            <ul class="space-y-0.5">
              <li
                v-for="(line, index) in adaptation.adapted.lines"
                :key="`l-${index}`"
                :class="['text-xs rounded px-1.5 py-0.5', changedLineSet.has(index) ? 'bg-brandg-50 dark:bg-brandg-900/20 font-medium text-brandg-800 dark:text-brandg-200' : 'text-zinc-600 dark:text-zinc-300']"
              >
                {{ line }}
              </li>
            </ul>
          </div>
          <div v-if="adaptation.adapted.steps?.length">
            <p class="text-[0.625rem] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-1">
              {{ t('recipeWrangler.detail.adaptation.fullSteps') }}
            </p>
            <ol class="space-y-1">
              <li
                v-for="(step, index) in adaptation.adapted.steps"
                :key="`s-${index}`"
                :class="['text-xs rounded px-1.5 py-1', changedStepSet.has(index) ? 'bg-brandg-50 dark:bg-brandg-900/20 font-medium text-brandg-800 dark:text-brandg-200' : 'text-zinc-600 dark:text-zinc-300']"
              >
                <span class="font-semibold mr-1">{{ index + 1 }}.</span>{{ step }}
              </li>
            </ol>
          </div>
        </div>
      </details>

      <!-- Save (or whatever the caller offers) -->
      <div
        v-if="$slots.actions"
        class="pt-2.5 border-t border-zinc-100 dark:border-zinc-700/50"
      >
        <slot name="actions" />
      </div>
    </div>

    <p
      v-if="restrictionsNote"
      class="text-xs text-zinc-400 dark:text-zinc-500 flex items-start gap-1.5"
    >
      <UIcon
        name="i-lucide-shield-check"
        class="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
      />
      {{ restrictionsNote }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RecipeAdaptation } from '~/services/recipeApi'
import { allergenLabel } from '~/utils/allergens'
import { formatAdaptGrade } from '~/utils/adaptation'
import { getNutriScoreColorBg } from '~/utils/nutriScore'

const props = defineProps<{ adaptation: RecipeAdaptation }>()

const { t, te, locale } = useI18n()

const metric = computed(() => props.adaptation.benefit?.metric ?? null)
const gradeBefore = computed(() => formatAdaptGrade(metric.value?.grade_before))
const gradeAfter = computed(() => formatAdaptGrade(metric.value?.grade_after))

const numberFormat = computed(() => new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 }))

// The metric's own unit string is English ("EUR per serving"), so the unit is
// rebuilt from the mode and the metric name and "per serving" is localised.
const metricUnit = computed(() => {
  const mode = props.adaptation.mode
  if (mode === 'sustainability') return 'kg CO₂e'
  if (mode === 'cost') return '€'
  return /_(g|mg|kcal|ug)$/.exec(metric.value?.name || '')?.[1] ?? ''
})

const metricLabel = computed(() => {
  const mode = props.adaptation.mode
  if (mode === 'sustainability') return t('recipeWrangler.detail.adaptation.metricCo2e')
  if (mode === 'cost') return t('recipeWrangler.detail.adaptation.metricCost')
  const name = String(metric.value?.name || '').replace(/_(g|mg|kcal|ug)$/, '').replace(/_/g, ' ')
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`
})

const formatValue = (value: number | null | undefined): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return `${numberFormat.value.format(value)} ${metricUnit.value} ${t('recipeWrangler.detail.adaptation.perServing')}`.replace('  ', ' ')
}

const formatSigned = (value: number): string => {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${numberFormat.value.format(Math.abs(value))}`
}

const titleChanged = computed(() => {
  const next = props.adaptation.adapted?.title
  const prev = props.adaptation.original?.title
  return Boolean(next && prev && next !== prev)
})

const changedLineSet = computed(() => new Set(props.adaptation.adapted?.changed_positions ?? []))
const changedStepSet = computed(() => new Set(props.adaptation.adapted?.changed_steps ?? []))

const changedLines = computed(() =>
  (props.adaptation.adapted?.changed_positions ?? [])
    .map(index => ({
      index,
      before: props.adaptation.original?.lines?.[index] ?? '',
      after: props.adaptation.adapted?.lines?.[index] ?? ''
    }))
    .filter(row => row.after)
)

const changedSteps = computed(() =>
  (props.adaptation.adapted?.changed_steps ?? [])
    .map(index => ({ index, text: props.adaptation.adapted?.steps?.[index] ?? '' }))
    .filter(row => row.text)
)

const flagLabels = computed(() => {
  const flags = props.adaptation.provenance?.flags
  if (!flags) return []
  const out: string[] = []
  if (flags.indicative) out.push(t('recipeWrangler.detail.adaptation.flagIndicative'))
  if (flags.unreviewed) out.push(t('recipeWrangler.detail.adaptation.flagUnreviewed'))
  if (flags.start_only) out.push(t('recipeWrangler.detail.adaptation.flagStartOnly'))
  if (flags.changes_dish_identity) out.push(t('recipeWrangler.detail.adaptation.flagChangesDish'))
  return out
})

const restrictionsNote = computed(() => {
  const applied = props.adaptation.applied_restrictions
  const allergens = (applied?.allergens ?? []).map(a => allergenLabel(a, t, te)).join(', ')
  const diet = applied?.diet && te(`recipeWrangler.detail.adaptation.diets.${applied.diet}`)
    ? t(`recipeWrangler.detail.adaptation.diets.${applied.diet}`)
    : applied?.diet || ''
  if (allergens && diet) return t('recipeWrangler.detail.adaptation.checkedBoth', { allergens, diet })
  if (allergens) return t('recipeWrangler.detail.adaptation.checkedAllergens', { allergens })
  if (diet) return t('recipeWrangler.detail.adaptation.checkedDiet', { diet })
  return ''
})
</script>
