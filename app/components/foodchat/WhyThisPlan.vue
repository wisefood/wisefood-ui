<template>
  <!--
    Everything about why this plan is what it is, behind one fold.

    Under a plan there used to be five separate pieces that each explained a
    little: the rule chips, the guidelines chip, a paragraph from the judge
    that ranked the candidates, "Personalized with…", and "Plan quality". Read
    together they said a lot; read one at a time, which is how anyone meets
    them, they said "claims", "maximum possible score is 2" and "highest score
    among the batch". Here they are one place, in the order a person asks:
    did it follow my rules, does it follow the guidelines, how good is it, and
    what did it use about me.

    Closed, it is one line with the answer to the first question.
  -->
  <section
    :id="anchorId"
    class="rounded-2xl border border-gray-200 dark:border-zinc-700/70 bg-white/70 dark:bg-zinc-900/40 overflow-hidden scroll-mt-4"
    data-flows="foodchat-why"
  >
    <button
      type="button"
      class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 transition-colors"
      :aria-expanded="open"
      @click="emit('update:open', !open)"
    >
      <UIcon
        name="i-lucide-book-open-check"
        class="w-4 h-4 text-brandp-500 dark:text-brandp-300 shrink-0"
      />
      <span class="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
        <span class="text-sm font-semibold text-gray-800 dark:text-zinc-100 shrink-0">{{ t('foodChatHome.why.title') }}</span>
        <span
          v-if="summary"
          class="text-xs text-gray-500 dark:text-zinc-400 truncate"
        >{{ summary }}</span>
      </span>
      <UIcon
        :name="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        class="w-4 h-4 text-gray-400 shrink-0"
      />
    </button>

    <div
      v-show="open"
      class="px-4 pb-5 pt-1 flex flex-col gap-6"
    >
      <!-- Your rules, as checked on the meals -->
      <section
        v-if="ruleRows.length"
        class="flex flex-col gap-2"
      >
        <div class="flex items-baseline justify-between gap-3">
          <h3 class="text-sm font-bold text-gray-800 dark:text-zinc-100">
            {{ t('foodChatHome.why.rulesTitle') }}
          </h3>
          <span class="text-xs text-gray-500 dark:text-zinc-400">{{ t('foodChatHome.why.rulesHint') }}</span>
        </div>
        <ul class="rounded-xl border border-gray-100 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800">
          <li
            v-for="(row, idx) in ruleRows"
            :key="idx"
            class="flex items-start gap-3 px-3 py-2.5"
          >
            <span
              class="mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center"
              :class="statusDot(row)"
            >
              <UIcon
                :name="statusIcon(row)"
                class="w-3 h-3"
              />
              <span
                v-if="row.detail || row.code"
                class="sr-only"
              >{{ statusWord(row) }}</span>
            </span>
            <span class="flex-1 min-w-0 flex flex-col gap-0.5">
              <span class="text-sm font-medium text-gray-800 dark:text-zinc-100">
                {{ rowName(row) }}
                <span
                  v-if="row.members?.length"
                  class="font-normal text-gray-500 dark:text-zinc-400"
                >· {{ row.members.join(', ') }}</span>
              </span>
              <span class="text-xs text-gray-500 dark:text-zinc-400">{{ rowKind(row) }}</span>
            </span>
            <span class="max-w-[50%] text-xs text-right text-gray-700 dark:text-zinc-300 leading-snug">{{ rowResult(row) }}</span>
          </li>
        </ul>
      </section>

      <!-- Dietary guidelines -->
      <section
        v-if="guidelines.length"
        class="flex flex-col gap-2"
      >
        <div class="flex items-baseline justify-between gap-3">
          <h3 class="text-sm font-bold text-gray-800 dark:text-zinc-100">
            {{ guidelineHeading }}
          </h3>
          <button
            v-if="guidelines.length > 3"
            type="button"
            class="text-xs font-semibold text-brandp-600 dark:text-brandp-300 hover:underline"
            @click="allGuidelines = !allGuidelines"
          >
            {{ allGuidelines ? t('foodChatHome.why.showFewer') : t('foodChatHome.why.showAll', { count: guidelines.length }) }}
          </button>
        </div>
        <ul class="flex flex-col gap-1.5">
          <li
            v-for="(g, idx) in shownGuidelines"
            :key="idx"
            class="flex items-start gap-2 text-sm"
          >
            <span
              class="shrink-0 min-w-16 whitespace-nowrap text-xs font-semibold pt-0.5"
              :class="g.state === 'met' ? 'text-emerald-700 dark:text-emerald-400' : g.state === 'unmet' ? 'text-amber-700 dark:text-amber-400' : 'text-gray-500 dark:text-zinc-400'"
            >{{ t(`foodChatHome.why.guideline.${g.state}`) }}</span>
            <span class="flex-1 min-w-0 text-gray-700 dark:text-zinc-200">
              {{ g.text }}
              <span
                v-if="g.extra"
                class="text-gray-500 dark:text-zinc-400"
              >· {{ g.extra }}</span>
            </span>
          </li>
        </ul>
      </section>

      <!-- Scores -->
      <section
        v-if="metrics.length"
        class="flex flex-col gap-2.5"
      >
        <h3 class="text-sm font-bold text-gray-800 dark:text-zinc-100">
          {{ t('foodChatHome.why.scoresTitle') }}
        </h3>
        <div
          v-for="metric in metrics"
          :key="metric.key"
          class="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto] items-center gap-3 text-sm"
        >
          <span class="text-gray-700 dark:text-zinc-200 truncate">{{ metric.label }}</span>
          <span class="h-1.5 rounded-full bg-brandp-50 dark:bg-zinc-700 overflow-hidden">
            <span
              v-if="metric.max != null"
              class="block h-full rounded-full bg-brandp-400 dark:bg-brandp-300"
              :style="{ width: `${Math.min(Math.max(metric.value / metric.max, 0), 1) * 100}%` }"
            />
          </span>
          <span class="flex items-center gap-1 justify-end text-xs font-medium text-gray-700 dark:text-zinc-200 tabular-nums">
            {{ metric.max != null ? `${metric.value}/${metric.max}` : t('foodChatHome.quality.varietyValue', { count: metric.value }) }}
            <FoodchatInfoPopover
              v-if="metric.reasoning"
              :text="metric.reasoning"
            >
              <button
                type="button"
                class="w-5 h-5 pointer-coarse:w-9 pointer-coarse:h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                :aria-label="t('foodChatHome.why.scoreWhy', { name: metric.label })"
              >
                <UIcon
                  name="i-lucide-info"
                  class="w-3.5 h-3.5"
                />
              </button>
            </FoodchatInfoPopover>
          </span>
        </div>
      </section>

      <!-- Made for you -->
      <section
        v-if="personalText"
        class="flex flex-col gap-1.5"
      >
        <h3 class="text-sm font-bold text-gray-800 dark:text-zinc-100">
          {{ t('foodChatHome.why.personalTitle') }}
        </h3>
        <p class="text-sm text-gray-700 dark:text-zinc-200 leading-relaxed">
          {{ personalText }}
        </p>
        <NuxtLink
          to="/my-profile"
          class="self-start text-sm font-semibold text-brandp-600 dark:text-brandp-300 hover:underline"
        >
          {{ t('foodChatHome.why.manageMemory') }}
        </NuxtLink>
      </section>

      <!-- How FoodChat chose these (a week's own summary; a day's ranking
           note is the judge comparing candidates, and is not shown) -->
      <section
        v-if="notes.length"
        class="flex flex-col gap-1.5"
      >
        <h3 class="text-sm font-bold text-gray-800 dark:text-zinc-100">
          {{ t('foodChatHome.why.howTitle') }}
        </h3>
        <p
          v-for="(note, idx) in notes"
          :key="idx"
          class="text-sm text-gray-700 dark:text-zinc-200 leading-relaxed"
        >
          {{ note }}
        </p>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ConstraintApplied, PersonalizationSummary, WeeklyGuidelineCheck } from '~/services/foodchatApi'
import { capitalise, checkKey, isUnmet, ledgerGroup, rowsOf, sourceKey } from '~/utils/planLedger'

export interface WhyMetric {
  key: string
  label: string
  value: number
  max?: number
  reasoning?: string
}

const props = withDefaults(defineProps<{
  open: boolean
  rows?: ConstraintApplied[]
  metrics?: WhyMetric[]
  personalization?: PersonalizationSummary | null
  /** A week's checklist, measured over the whole week. Wins over guideline rows. */
  checklist?: WeeklyGuidelineCheck[]
  /** Plain sentences about how the plan was put together. */
  notes?: string[]
  anchorId?: string
}>(), {
  rows: () => [],
  metrics: () => [],
  personalization: null,
  checklist: () => [],
  notes: () => [],
  anchorId: 'foodchat-why'
})

const emit = defineEmits<{ 'update:open': [open: boolean] }>()

const { t } = useI18n()
const ledger = useLedgerText()
const allGuidelines = ref(false)

// ── Rules and checks, the not-met ones first ─────────────────────────────
const ORDER: Record<string, number> = { violated: 0, relaxed: 1, satisfied: 2, unsupported: 3 }

const ruleRows = computed(() =>
  (props.rows ?? [])
    .filter(row => ledgerGroup(row) !== 'guideline')
    .slice()
    .sort((a, b) => (ORDER[a.status] ?? 2) - (ORDER[b.status] ?? 2))
)

function rowName(row: ConstraintApplied): string {
  const named = ledger.name(row)
  if (named) return named
  if (ledgerGroup(row) === 'check') {
    const key = checkKey(row.constraint)
    if (key) return t(`foodChatHome.why.checks.${key}`)
  }
  return capitalise(row.constraint)
}

function rowKind(row: ConstraintApplied): string {
  if (ledgerGroup(row) === 'check') return t('foodChatHome.why.checkedOnMeals')
  const strength = row.type === 'hard' ? t('foodChatHome.why.always') : t('foodChatHome.why.preferred')
  const key = sourceKey(row.source)
  const from = key ? t(`foodChatHome.why.sources.${key}`) : row.source
  return from ? `${strength} · ${from}` : strength
}

function statusWord(row: ConstraintApplied): string {
  return t(`foodChatHome.why.status.${row.status in ORDER ? row.status : 'satisfied'}`)
}

function rowResult(row: ConstraintApplied): string {
  // An unsupported rule's own detail says what could not be enforced; the
  // generic sentence is only for rows with nothing of their own to say.
  const said = ledger.detail(row)
  if (said) return said
  if (row.status === 'unsupported') return t('foodChatHome.constraints.unsupportedTooltip')
  return statusWord(row)
}

function statusIcon(row: ConstraintApplied): string {
  if (row.status === 'violated') return 'i-lucide-x'
  if (row.status === 'relaxed') return 'i-lucide-minus'
  if (row.status === 'unsupported') return 'i-lucide-help-circle'
  return 'i-lucide-check'
}

function statusDot(row: ConstraintApplied): string {
  if (row.status === 'violated') return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300'
  if (row.status === 'relaxed') return 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
  if (row.status === 'unsupported') return 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'
  return 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950'
}

// ── Guidelines ──────────────────────────────────────────────────────────
interface GuidelineLine { text: string, extra?: string, state: 'met' | 'unmet' | 'unchecked' }

const guidelines = computed<GuidelineLine[]>(() => {
  if (props.checklist.length) {
    return props.checklist.map(c => ({
      text: c.rule,
      extra: [`${c.actual} · ${c.target}`, c.source].filter(Boolean).join(' · '),
      state: c.met ? 'met' : 'unmet'
    }))
  }
  return rowsOf(props.rows, 'guideline').map(row => ({
    text: capitalise(row.constraint),
    extra: ledger.detail(row) || undefined,
    state: row.status === 'satisfied' ? 'met' : isUnmet(row) ? 'unmet' : 'unchecked'
  }))
})

const guidelinesChecked = computed(() => guidelines.value.filter(g => g.state !== 'unchecked'))
const guidelinesMet = computed(() => guidelines.value.filter(g => g.state === 'met').length)

const guidelineHeading = computed(() =>
  guidelinesChecked.value.length
    ? t('foodChatHome.why.guidelinesTitle', { met: guidelinesMet.value, total: guidelinesChecked.value.length })
    : t('foodChatHome.why.guidelinesPlain')
)

const shownGuidelines = computed(() => {
  // Not-met first: the line a person is looking for is the one that failed.
  const sorted = [...guidelines.value].sort((a, b) =>
    (a.state === 'unmet' ? 0 : a.state === 'met' ? 1 : 2) - (b.state === 'unmet' ? 0 : b.state === 'met' ? 1 : 2))
  return allGuidelines.value ? sorted : sorted.slice(0, 3)
})

// ── Made for you ────────────────────────────────────────────────────────
const personalText = computed(() => {
  const p = props.personalization
  if (!p) return ''
  const parts: string[] = []
  if (p.favorites_used > 0) parts.push(t('foodChatHome.why.usesFavourites', { count: p.favorites_used }, p.favorites_used))
  if (p.memories_used > 0) parts.push(t('foodChatHome.why.usesMemories', { count: p.memories_used }, p.memories_used))
  if (p.feedback_signals > 0) parts.push(t('foodChatHome.why.usesRatings', { count: p.feedback_signals }, p.feedback_signals))
  return parts.join(' ')
})

// ── The closed line ─────────────────────────────────────────────────────
const summary = computed(() => {
  const parts: string[] = []
  const judged = ruleRows.value.filter(r => r.status !== 'unsupported')
  if (judged.length) {
    const met = judged.filter(r => r.status === 'satisfied').length
    parts.push(met === judged.length
      ? t('foodChatHome.why.summaryAllMet', { count: judged.length }, judged.length)
      : t('foodChatHome.why.summaryMet', { met, total: judged.length }))
  }
  if (guidelinesChecked.value.length) {
    parts.push(t('foodChatHome.why.summaryGuidelines', { met: guidelinesMet.value, total: guidelinesChecked.value.length }))
  }
  const p = props.personalization
  if (p && p.favorites_used > 0) parts.push(t('foodChatHome.why.summaryFavourites', { count: p.favorites_used }, p.favorites_used))
  return parts.join(' · ')
})
</script>
