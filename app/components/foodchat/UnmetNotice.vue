<template>
  <!--
    What this plan did not fully manage, said above the meals in sentences.

    The only part of "why" that stays out of the fold, because it changes what
    a person does next: a plan 1,000 kcal under their target, or dishes that
    are not the high-protein ones they asked for, is worth reading before the
    meals. Everything that went right folds into "Why this plan".

    It used to be a red chip reading "claims" or "calories", with the sentence
    that explained it in a tooltip.
  -->
  <!-- A broken safety rule (an allergy, a diet) keeps its box: it is the one
       thing on the plan that must not be missed. -->
  <div
    v-if="rows.length && serious"
    role="status"
    class="rounded-xl border px-3.5 py-2.5 flex items-start gap-2.5 border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/30"
    data-flows="foodchat-unmet"
  >
    <UIcon
      name="i-lucide-alert-triangle"
      class="w-4 h-4 mt-0.5 shrink-0 text-red-600 dark:text-red-400"
    />
    <div class="flex-1 min-w-0 flex flex-col gap-1">
      <p
        v-for="(row, idx) in shown"
        :key="idx"
        class="text-sm leading-snug text-red-900 dark:text-red-100"
      >
        <strong class="font-semibold">{{ name(row) }}<template v-if="row.members?.length"> · {{ row.members.join(', ') }}</template>:</strong>
        {{ ' ' }}{{ ledgerText.detail(row) || t(`foodChatHome.why.status.${row.status}`) }}
      </p>
      <p
        v-if="rows.length > shown.length"
        class="text-xs text-gray-600 dark:text-zinc-400"
      >
        {{ t('foodChatHome.unmet.more', { count: rows.length - shown.length }) }}
      </p>
    </div>
    <button
      type="button"
      class="shrink-0 text-sm font-semibold text-brandp-600 dark:text-brandp-300 hover:underline whitespace-nowrap min-h-8 pointer-coarse:min-h-11"
      @click="emit('why')"
    >
      {{ t('foodChatHome.unmet.seeWhy') }}
    </button>
  </div>

  <!-- Anything else not fully met is a note, not an alarm: one quiet pill
       each, beside what the plan is built around, and a way to see why. -->
  <div
    v-else-if="rows.length"
    role="status"
    class="flex flex-wrap items-center gap-2"
    data-flows="foodchat-unmet"
  >
    <span
      v-for="(row, idx) in shown"
      :key="idx"
      class="inline-flex items-start gap-2 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/25 px-3 py-1.5 text-[0.8125rem] leading-snug text-amber-950 dark:text-amber-100"
    >
      <UIcon
        name="i-lucide-circle-alert"
        class="w-4 h-4 mt-px shrink-0 text-amber-600 dark:text-amber-400"
      />
      <span><strong class="font-semibold">{{ name(row) }}<template v-if="row.members?.length"> · {{ row.members.join(', ') }}</template>:</strong>{{ ' ' }}{{ ledgerText.detail(row) || t(`foodChatHome.why.status.${row.status}`) }}</span>
    </span>
    <span
      v-if="rows.length > shown.length"
      class="text-xs text-gray-500 dark:text-zinc-400"
    >{{ t('foodChatHome.unmet.more', { count: rows.length - shown.length }) }}</span>
    <button
      type="button"
      class="text-[0.8125rem] font-semibold text-brandp-600 dark:text-brandp-300 underline-offset-2 hover:underline whitespace-nowrap min-h-8 pointer-coarse:min-h-11 px-1"
      @click="emit('why')"
    >
      {{ t('foodChatHome.unmet.seeWhy') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ConstraintApplied } from '~/services/foodchatApi'
import { capitalise, checkKey, isUnmet, ledgerGroup } from '~/utils/planLedger'

const props = defineProps<{ ledger?: ConstraintApplied[] | null }>()
const emit = defineEmits<{ why: [] }>()
const { t } = useI18n()
const ledgerText = useLedgerText()

/** Rules and checks not fully met; guidelines stay in the fold. */
const rows = computed(() =>
  (props.ledger ?? [])
    .filter(row => ledgerGroup(row) !== 'guideline' && isUnmet(row))
    // Broken first: "violated" before "relaxed".
    .sort((a, b) => (a.status === 'violated' ? 0 : 1) - (b.status === 'violated' ? 0 : 1))
)

const shown = computed(() => rows.value.slice(0, 3))

/** Red only when a safety rule broke: an allergy or a diet. */
const serious = computed(() =>
  rows.value.some(row => row.status === 'violated' && row.type === 'hard')
)

function name(row: ConstraintApplied): string {
  const named = ledgerText.name(row)
  if (named) return named
  if (ledgerGroup(row) === 'check') {
    const key = checkKey(row.constraint)
    if (key) return t(`foodChatHome.why.checks.${key}`)
  }
  return capitalise(row.constraint)
}
</script>
