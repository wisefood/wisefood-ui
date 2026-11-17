<template>
  <!--
    What this plan is built around, in one line, and the one way to change it.

    It replaces five places that each said part of this: the "Plan settings"
    bar, the "Your rules" chips, the "Cooking for" banner, the kitchen strip
    under the chat and the side panel. Each had its own way of committing a
    change, so nobody could say which edits had reached the plan. Now the line
    only reads, and Adjust is the only door.

    On a phone the whole line is one button, because a row of wrapped chips
    above the meals is the first screen of the plan.
  -->
  <button
    v-if="compact"
    type="button"
    class="w-full flex items-center gap-3 text-left rounded-xl border border-brandp-100 dark:border-brandp-900/60 bg-brandp-50/50 dark:bg-brandp-950/20 px-3 py-2.5 min-h-11"
    data-flows="foodchat-plan-settings"
    @click="emit('adjust')"
  >
    <span class="flex-1 min-w-0 flex flex-col gap-0.5">
      <span class="text-[0.6875rem] font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">
        {{ t('foodChatHome.builtAround.label') }}
      </span>
      <span class="text-xs text-gray-700 dark:text-zinc-200 line-clamp-2">
        {{ summary || t('foodChatHome.builtAround.nothing') }}
      </span>
    </span>
    <span class="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-brandp-600 dark:text-brandp-300">
      {{ t('foodChatHome.builtAround.adjust') }}
      <UIcon
        name="i-lucide-chevron-right"
        class="w-4 h-4"
      />
    </span>
  </button>

  <div
    v-else
    class="flex items-center gap-1.5 flex-wrap"
    data-rum-region="foodchat.built-around"
    data-rum-private
  >
    <span class="text-[0.6875rem] font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400 mr-1">
      {{ t('foodChatHome.builtAround.label') }}
    </span>

    <span
      v-if="dinerText"
      :class="[chip, chosen]"
    >
      <UIcon
        name="i-lucide-users"
        class="w-3 h-3 shrink-0"
      />
      {{ dinerText }}
    </span>

    <span
      v-if="pantryText"
      :class="[chip, kitchen]"
    >
      <UIcon
        name="i-lucide-refrigerator"
        class="w-3 h-3 shrink-0"
      />
      {{ pantryText }}
    </span>

    <FoodchatInfoPopover
      v-for="(rule, idx) in rules"
      :key="`rule-${idx}`"
      :text="ruleHint(rule)"
    >
      <button
        type="button"
        :class="[chip, chosen, 'cursor-help']"
      >
        <UIcon
          v-if="rule.type === 'hard'"
          name="i-lucide-shield-check"
          class="w-3 h-3 shrink-0"
        />
        {{ ruleName(rule) }}
        <span
          v-if="rule.members?.length"
          class="opacity-70"
        >· {{ rule.members.join(', ') }}</span>
      </button>
    </FoodchatInfoPopover>

    <span
      v-for="tag in statedTags"
      :key="`stated-${tag}`"
      :class="[chip, chosen]"
    >
      {{ ledger.tag(tag) }}
    </span>

    <span
      v-for="facet in facets"
      :key="`taste-${facet.value}`"
      :class="[chip, chosen]"
    >
      {{ facetLabel(facet.value) }}
    </span>

    <span
      v-for="phrase in settingPhrases"
      :key="`set-${phrase.key}`"
      :class="[chip, chosen]"
    >
      <UIcon
        v-if="phrase.key === 'cooking_time'"
        name="i-lucide-timer"
        class="w-3 h-3 shrink-0"
      />
      {{ phrase.text }}
    </span>

    <span
      v-if="!hasAnything"
      class="text-xs text-gray-500 dark:text-zinc-400"
    >{{ t('foodChatHome.builtAround.nothing') }}</span>

    <UButton
      v-if="!hideAdjust"
      size="xs"
      color="neutral"
      variant="subtle"
      icon="i-lucide-sliders-horizontal"
      class="ml-auto"
      data-flows="foodchat-plan-settings"
      @click="emit('adjust')"
    >
      {{ t('foodChatHome.builtAround.adjust') }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ConstraintApplied, FacetChip, PlanParameterCard } from '~/services/foodchatApi'
import { capitalise, sourceKey } from '~/utils/planLedger'

const props = withDefaults(defineProps<{
  /** Who is eating, by name. Shown once there is more than one. */
  diners?: string[]
  pantry?: string[]
  /** Rules from profiles: already sorted out of the ledger by the page. */
  rules?: ConstraintApplied[]
  /** Diet and nutrition the member stated in this conversation. */
  statedTags?: string[]
  facets?: FacetChip[]
  card?: PlanParameterCard | null
  /** One button instead of a row of chips. */
  compact?: boolean
  /** Leave out the line's own Adjust button: the plan's toolbar carries it. */
  hideAdjust?: boolean
}>(), {
  diners: () => [],
  pantry: () => [],
  rules: () => [],
  statedTags: () => [],
  facets: () => [],
  card: null,
  compact: false,
  hideAdjust: false
})

const emit = defineEmits<{ adjust: [] }>()

// The page's chip colours: purple for what the member chose, green for what
// is in their kitchen (the same green the kitchen has everywhere else).
const chip = 'inline-flex items-center gap-1 px-2.5 py-0.5 pointer-coarse:min-h-8 text-xs rounded-full border'
const chosen = 'border-brandp-100 dark:border-brandp-800/70 bg-brandp-50 dark:bg-brandp-950/40 text-brandp-600 dark:text-brandp-300'
const kitchen = 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'

const { t, locale } = useI18n()
const ledger = useLedgerText()
const { label: facetLabel } = useFacetLabels()

/** "No peanut", in this language when FoodChat sent a code for it. */
function ruleName(rule: ConstraintApplied): string {
  return ledger.name(rule) ?? capitalise(rule.constraint)
}
const { appliedPhrases } = usePlanParamLabels()

function listOf(items: string[]): string {
  try {
    return new Intl.ListFormat(locale.value, { style: 'long', type: 'conjunction' }).format(items)
  } catch {
    return items.join(', ')
  }
}

const dinerText = computed(() => props.diners.length > 1 ? listOf(props.diners) : '')

/** Four items, then a count: a full fridge is a paragraph, not a chip. */
const pantryText = computed(() => {
  const items = props.pantry
  if (!items.length) return ''
  const shown = items.slice(0, 4).join(', ')
  const more = items.length - 4
  const list = more > 0 ? t('foodChatHome.builtAround.andMore', { list: shown, count: more }) : shown
  return t('foodChatHome.builtAround.using', { list })
})

/**
 * The settings, minus any the line already names: "high protein" said in the
 * chat and "High protein" picked as the goal are one fact, not two chips.
 */
const settingPhrases = computed(() => {
  const named = new Set([
    ...props.statedTags.map(v => ledger.tag(v).toLowerCase()),
    ...props.facets.map(f => facetLabel(f.value).toLowerCase())
  ])
  return appliedPhrases(props.card).filter(p => !named.has(p.text.toLowerCase()))
})

const hasAnything = computed(() =>
  !!dinerText.value || !!pantryText.value || props.rules.length > 0
  || props.statedTags.length > 0 || props.facets.length > 0 || settingPhrases.value.length > 0
)

/** The whole line as a sentence, for the phone's single button. */
const summary = computed(() => {
  const parts: string[] = []
  if (dinerText.value) parts.push(dinerText.value)
  if (props.pantry.length) parts.push(props.pantry.slice(0, 4).join(', '))
  for (const rule of props.rules) parts.push(ruleName(rule).toLowerCase())
  for (const tag of props.statedTags) parts.push(ledger.tag(tag).toLowerCase())
  for (const chip of props.facets) parts.push(facetLabel(chip.value).toLowerCase())
  for (const phrase of settingPhrases.value) parts.push(phrase.text.toLowerCase())
  return parts.join(' · ')
})

/** "Always applied · from an allergy · Nikos" in the rule's popover. */
function ruleHint(rule: ConstraintApplied): string {
  const strength = rule.type === 'hard'
    ? t('foodChatHome.why.always')
    : t('foodChatHome.why.preferred')
  const key = sourceKey(rule.source)
  const from = key ? t(`foodChatHome.why.sources.${key}`) : (rule.source || '')
  return [strength, from, ledger.detail(rule)].filter(Boolean).join(' · ')
}
</script>
