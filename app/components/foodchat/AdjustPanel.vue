<template>
  <!--
    The one place to change what the next plan is built around.

    Before this there were four, with three different ideas of when a change
    counted: the settings bar re-planned on every click, the side panel saved
    at once but waited for "Update the plan", the kitchen strip saved quietly
    for "next time", and the diner chips saved at once for the next message.
    Here nothing is sent until "Update my plan", and then everything goes in
    one plan.

    A side panel beside the plan on a wide screen, a sheet on a phone.
  -->
  <DefineBody>
    <div
      class="flex flex-col gap-6"
      data-flows="foodchat-plan-settings-panel"
    >
      <!-- Who's eating -->
      <section
        v-if="members.length > 1"
        class="flex flex-col gap-2.5"
        data-rum-private
      >
        <h3 class="fc-adj-h">
          {{ t('foodChatHome.adjust.who') }}
        </h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="member in members"
            :key="member.id"
            type="button"
            class="fc-adj-pill"
            :class="stagedDiners.includes(member.id) ? pillOn : pillOff"
            :aria-pressed="stagedDiners.includes(member.id)"
            :disabled="member.id === currentMemberId"
            @click="toggleDiner(member.id)"
          >
            <UIcon
              v-if="stagedDiners.includes(member.id)"
              name="i-lucide-check"
              class="w-4 h-4 shrink-0"
            />
            <span class="max-w-36 truncate">{{ member.id === currentMemberId ? t('foodChatHome.diners.you', { name: member.name }) : member.name }}</span>
          </button>
        </div>
        <p class="fc-adj-hint">
          {{ t('foodChatHome.adjust.whoHint') }}
        </p>
      </section>

      <!-- Time -->
      <section
        v-if="timeParam"
        class="flex flex-col gap-2.5"
      >
        <h3 class="fc-adj-h">
          {{ t('foodChatHome.adjust.time') }}
        </h3>
        <div class="grid grid-cols-5 gap-1.5">
          <button
            v-for="preset in timePresets"
            :key="preset"
            type="button"
            class="fc-adj-cell tabular-nums"
            :class="Number(value('cooking_time')) === preset ? pillOn : pillOff"
            :aria-pressed="Number(value('cooking_time')) === preset"
            @click="set('cooking_time', preset)"
          >
            {{ preset }}
          </button>
        </div>
        <p class="fc-adj-hint">
          {{ value('cooking_time') === undefined ? t('foodChatHome.adjust.timeUnset') : t('foodChatHome.adjust.timeHint') }}
        </p>
      </section>

      <!-- Simple -->
      <section
        v-if="difficultyParam"
        class="flex items-center gap-4"
      >
        <div class="flex-1 flex flex-col gap-1">
          <label
            :for="simpleId"
            class="fc-adj-h"
          >{{ t('foodChatHome.adjust.simple') }}</label>
          <span class="fc-adj-hint">{{ t('foodChatHome.adjust.simpleHint') }}</span>
        </div>
        <USwitch
          :id="simpleId"
          :model-value="value('difficulty') === 'easy'"
          size="lg"
          @update:model-value="set('difficulty', $event ? 'easy' : 'medium')"
        />
      </section>

      <!-- Goal -->
      <section
        v-if="goalParam?.options?.length"
        class="flex flex-col gap-2.5"
      >
        <h3 class="fc-adj-h">
          {{ t('foodChatHome.adjust.goal') }}
        </h3>
        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="option in goalParam.options"
            :key="option.value"
            type="button"
            class="fc-adj-cell"
            :class="value('goal') === option.value ? pillOn : pillOff"
            :aria-pressed="value('goal') === option.value"
            @click="set('goal', option.value)"
          >
            {{ optionLabel(goalParam, option) }}
          </button>
        </div>
        <p
          v-if="value('goal') === undefined"
          class="fc-adj-hint"
        >
          {{ t('foodChatHome.adjust.goalUnset') }}
        </p>
      </section>

      <!-- Kitchen -->
      <section
        class="flex flex-col gap-2.5"
        data-rum-private
      >
        <h3 class="fc-adj-h">
          {{ t('foodChatHome.adjust.kitchen') }}
        </h3>
        <div
          v-if="stagedPantry.length"
          class="flex flex-wrap gap-1.5"
        >
          <span
            v-for="item in stagedPantry"
            :key="item"
            class="inline-flex items-center gap-0.5 pl-3 pr-0.5 min-h-9 text-sm rounded-full border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
          >
            {{ item }}
            <button
              type="button"
              class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-800/40"
              :aria-label="t('foodChatHome.planningState.removeItem', { value: item })"
              @click="removePantry(item)"
            >
              <UIcon
                name="i-lucide-x"
                class="w-3.5 h-3.5"
              />
            </button>
          </span>
        </div>
        <p
          v-else
          class="fc-adj-hint"
        >
          {{ t('foodChatHome.adjust.kitchenEmpty') }}
        </p>
        <form
          class="flex gap-1.5"
          @submit.prevent="addPantry"
        >
          <UInput
            v-model="pantryDraft"
            size="lg"
            class="flex-1 min-w-0"
            :placeholder="t('foodChatHome.planningState.pantryAddPlaceholder')"
            :aria-label="t('foodChatHome.planningState.pantryAdd')"
          />
          <UButton
            type="submit"
            size="lg"
            color="neutral"
            variant="subtle"
            :disabled="!pantryDraft.trim()"
          >
            {{ t('foodChatHome.adjust.add') }}
          </UButton>
        </form>
        <button
          type="button"
          class="self-start text-sm font-semibold text-brandp-600 dark:text-brandp-300 hover:underline"
          @click="pickerOpen = true"
        >
          {{ t('foodChatHome.adjust.pickFromList') }}
        </button>
      </section>

      <!-- Everything else, folded -->
      <section
        v-if="hasMore"
        class="rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden"
      >
        <button
          type="button"
          class="w-full flex items-center gap-3 text-left px-4 py-3 bg-gray-50/70 dark:bg-zinc-800/40 hover:bg-gray-100/70 dark:hover:bg-zinc-800/70"
          :aria-expanded="moreOpen"
          @click="moreOpen = !moreOpen"
        >
          <span class="flex-1 flex flex-col gap-0.5">
            <span class="fc-adj-h">{{ t('foodChatHome.adjust.more') }}</span>
            <span class="text-xs text-gray-500 dark:text-zinc-400">{{ moreSummary }}</span>
          </span>
          <UIcon
            :name="moreOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="w-4 h-4 shrink-0 text-gray-500"
          />
        </button>
        <div
          v-show="moreOpen"
          class="flex flex-col gap-5 px-4 py-4"
        >
          <div
            v-for="p in extraChoiceParams"
            :key="p.key"
            class="flex flex-col gap-2"
          >
            <span class="text-sm font-semibold text-gray-800 dark:text-zinc-100">{{ paramLabel(p) }}</span>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="option in p.options ?? []"
                :key="option.value"
                type="button"
                class="fc-adj-pill"
                :class="effective(p.key) === option.value ? pillOn : pillOff"
                :aria-pressed="effective(p.key) === option.value"
                @click="set(p.key, option.value)"
              >
                {{ optionLabel(p, option) }}
              </button>
            </div>
          </div>

          <!-- Tastes heard in the chat: removable, and addable from what the
               recipes are actually tagged with (an invented taste empties
               the search rather than narrowing it). -->
          <div
            v-if="facets.length || tasteOptions.length"
            class="flex flex-col gap-2"
          >
            <span class="text-sm font-semibold text-gray-800 dark:text-zinc-100">{{ t('foodChatHome.adjust.tastes') }}</span>
            <div
              v-if="stagedTastes.length"
              class="flex flex-wrap gap-1.5"
            >
              <span
                v-for="taste in stagedTastes"
                :key="taste"
                class="inline-flex items-center gap-0.5 pl-3 pr-0.5 min-h-9 text-sm rounded-full border"
                :class="pillOn"
              >
                {{ capitalise(taste) }}
                <button
                  type="button"
                  class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brandp-100 dark:hover:bg-brandp-900/40"
                  :aria-label="t('foodChatHome.planningState.removeItem', { value: capitalise(taste) })"
                  @click="removeTaste(taste)"
                >
                  <UIcon
                    name="i-lucide-x"
                    class="w-3.5 h-3.5"
                  />
                </button>
              </span>
            </div>
            <p
              v-else
              class="fc-adj-hint"
            >
              {{ t('foodChatHome.planningState.facetsEmpty') }}
            </p>
            <USelectMenu
              v-if="tasteOptions.length"
              v-model="tasteDraft"
              :items="tasteOptions"
              value-key="value"
              label-key="label"
              size="lg"
              :placeholder="t('foodChatHome.planningState.facetsAdd')"
              @update:model-value="addTaste"
            />
          </div>

          <!-- Said in the chat: read-only. A diet can carry an allergy, so it
               is changed by saying so, never by a stray tap. -->
          <div
            v-if="statedTags.length"
            class="flex flex-col gap-2"
          >
            <span class="text-sm font-semibold text-gray-800 dark:text-zinc-100">{{ t('foodChatHome.adjust.stated') }}</span>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="tag in statedTags"
                :key="tag"
                class="inline-flex items-center px-3 min-h-8 text-sm rounded-full border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200"
              >{{ ledger.tag(tag) }}</span>
            </div>
            <p class="fc-adj-hint">
              {{ t('foodChatHome.adjust.statedHint') }}
            </p>
          </div>

          <div
            v-if="shapeSummary"
            class="flex flex-col gap-1"
          >
            <span class="text-sm font-semibold text-gray-800 dark:text-zinc-100">{{ t('foodChatHome.planningState.shapeLabel') }}</span>
            <span class="text-sm text-gray-600 dark:text-zinc-300">{{ shapeSummary }}</span>
            <p class="fc-adj-hint">
              {{ t('foodChatHome.adjust.shapeHint') }}
            </p>
          </div>

          <p
            v-if="favoritesDeclined"
            class="fc-adj-hint flex items-center gap-1.5"
          >
            <UIcon
              name="i-lucide-heart-off"
              class="w-3.5 h-3.5 shrink-0"
            />
            {{ t('foodChatHome.planningState.favoritesDeclined') }}
          </p>
        </div>
      </section>
    </div>

    <FoodchatPantryPicker
      v-if="pickerOpen"
      :items="stagedPantry"
      action="keep"
      @close="pickerOpen = false"
      @cook="pickPantry"
    />
  </DefineBody>

  <DefineFooter>
    <div class="w-full flex items-center gap-2">
      <span
        class="flex-1 text-sm text-gray-500 dark:text-zinc-400"
        aria-live="polite"
      >
        {{ changeCount
          ? t('foodChatHome.adjust.waiting', { count: changeCount }, changeCount)
          : t('foodChatHome.adjust.noChanges') }}
      </span>
      <UButton
        size="lg"
        color="neutral"
        variant="outline"
        @click="close"
      >
        {{ t('foodChatHome.adjust.cancel') }}
      </UButton>
      <UButton
        size="lg"
        color="primary"
        :disabled="!changeCount || busy"
        :loading="busy"
        data-flows="foodchat-adjust-apply"
        @click="apply"
      >
        {{ t('foodChatHome.adjust.update') }}
      </UButton>
    </div>
  </DefineFooter>

  <UDrawer
    v-if="sheet"
    :open="open"
    :title="t('foodChatHome.adjust.title')"
    :description="t('foodChatHome.adjust.subtitle')"
    :ui="{ content: 'max-h-[92dvh]', container: 'min-h-0 overflow-hidden', body: 'min-h-0 overflow-y-auto -mx-4 px-4', footer: 'pb-[max(1rem,var(--wf-safe-bottom))]' }"
    @update:open="onOpenChange"
  >
    <template #body>
      <ReuseBody />
    </template>
    <template #footer>
      <ReuseFooter />
    </template>
  </UDrawer>
  <USlideover
    v-else
    :open="open"
    side="right"
    :title="t('foodChatHome.adjust.title')"
    :description="t('foodChatHome.adjust.subtitle')"
    :ui="{ content: 'max-w-md' }"
    @update:open="onOpenChange"
  >
    <template #body>
      <ReuseBody />
    </template>
    <template #footer>
      <ReuseFooter />
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { createReusableTemplate } from '@vueuse/core'
import type { FacetChip, PlanParameterCard, PlanParameterValues, Vocabularies } from '~/services/foodchatApi'
import type { HouseholdMember } from '~/services/householdsApi'
import { capitalise } from '~/utils/planLedger'

export interface AdjustChanges {
  /** The whole new diner list, or null when it did not change. */
  diners: string[] | null
  /** The whole new pantry, or null when it did not change. */
  pantry: string[] | null
  addFacets: string[]
  removeFacets: string[]
  /** Only the settings that changed. */
  params: PlanParameterValues
}

const props = withDefaults(defineProps<{
  open: boolean
  /** Bottom sheet (phone) instead of a side panel. */
  sheet?: boolean
  busy?: boolean
  members?: HouseholdMember[]
  currentMemberId?: string | null
  selectedDiners?: string[]
  pantry?: string[]
  card?: PlanParameterCard | null
  facets?: FacetChip[]
  vocabularies?: Vocabularies | null
  statedTags?: string[]
  shapeSummary?: string
  favoritesDeclined?: boolean
}>(), {
  sheet: false,
  busy: false,
  members: () => [],
  currentMemberId: null,
  selectedDiners: () => [],
  pantry: () => [],
  card: null,
  facets: () => [],
  vocabularies: null,
  statedTags: () => [],
  shapeSummary: '',
  favoritesDeclined: false
})

const emit = defineEmits<{
  'update:open': [open: boolean]
  'apply': [changes: AdjustChanges]
}>()

const { t } = useI18n()
const { paramLabel, optionLabel, param, applied } = usePlanParamLabels()
const ledger = useLedgerText()
const [DefineBody, ReuseBody] = createReusableTemplate()
const [DefineFooter, ReuseFooter] = createReusableTemplate()
const simpleId = useId()

const pillOn = 'border-brandp-400 bg-brandp-50 dark:bg-brandp-950/50 text-brandp-700 dark:text-brandp-200 font-semibold'
const pillOff = 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:border-brandp-300'

// ── Staged state: a copy taken when the panel opens ─────────────────────
const stagedDiners = ref<string[]>([])
const stagedPantry = ref<string[]>([])
const stagedTastes = ref<string[]>([])
const stagedParams = ref<PlanParameterValues>({})
const pantryDraft = ref('')
const tasteDraft = ref<string | undefined>(undefined)
const moreOpen = ref(false)
const pickerOpen = ref(false)

function reset() {
  stagedDiners.value = [...props.selectedDiners]
  stagedPantry.value = [...props.pantry]
  stagedTastes.value = props.facets.map(chip => chip.value)
  stagedParams.value = {}
  pantryDraft.value = ''
  tasteDraft.value = undefined
  pickerOpen.value = false
}

watch(() => props.open, (open) => {
  if (open) reset()
}, { immediate: true })

function onOpenChange(open: boolean) {
  emit('update:open', open)
}

function close() {
  emit('update:open', false)
}

// ── Settings ────────────────────────────────────────────────────────────
const timeParam = computed(() => param(props.card, 'cooking_time'))
const difficultyParam = computed(() => param(props.card, 'difficulty'))
const goalParam = computed(() => param(props.card, 'goal'))

/** Food waste and (on a week) repeated meals: the rarer settings. */
const extraChoiceParams = computed(() =>
  (props.card?.parameters ?? []).filter(p => p.kind === 'choice' && p.options?.length
    && p.key !== 'difficulty' && p.key !== 'goal')
)

/** What the member has staged, else what is applied; undefined = never set. */
function value(key: string): number | string | undefined {
  return key in stagedParams.value ? stagedParams.value[key] : applied(props.card, key)
}

/**
 * The value a setting acts with. Repeat meals has a real default (a week
 * repeats breakfasts unless told otherwise), so it shows selected; the others
 * do nothing until set and show nothing selected.
 */
function effective(key: string): number | string | undefined {
  const own = value(key)
  if (own !== undefined) return own
  return key === 'repeat_meals' ? (param(props.card, key)?.default ?? undefined) : undefined
}

function set(key: string, next: number | string) {
  const current = applied(props.card, key)
  // Back to what is applied (or, for effort, to "any" when nothing is) is no
  // change at all, so it drops out of the count instead of adding to it.
  const unchanged = current === next
    || (current === undefined && key === 'difficulty' && next === 'medium')
  const rest = Object.fromEntries(Object.entries(stagedParams.value).filter(([k]) => k !== key))
  stagedParams.value = unchanged ? rest : { ...rest, [key]: next }
}

/** 15 to 90, within FoodChat's own bounds, plus the member's own value. */
const timePresets = computed(() => {
  const p = timeParam.value
  if (!p) return []
  const min = p.min ?? 10
  const max = p.max ?? 90
  const step = p.step ?? 5
  const snapped = [15, 30, 45, 60, 90]
    .filter(v => v >= min && v <= max)
    .map(v => Math.round(v / step) * step)
  const own = Number(applied(props.card, 'cooking_time'))
  if (Number.isFinite(own) && own >= min && own <= max && !snapped.includes(own)) snapped.push(own)
  return [...new Set(snapped)].sort((a, b) => a - b)
})

// ── Diners ──────────────────────────────────────────────────────────────
function toggleDiner(id: string) {
  if (id === props.currentMemberId) return
  stagedDiners.value = stagedDiners.value.includes(id)
    ? stagedDiners.value.filter(d => d !== id)
    : [...stagedDiners.value, id]
}

// ── Kitchen ─────────────────────────────────────────────────────────────
function addPantry() {
  const items = pantryDraft.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  const next = [...stagedPantry.value]
  for (const item of items) if (!next.includes(item)) next.push(item)
  stagedPantry.value = next
  pantryDraft.value = ''
}

function removePantry(item: string) {
  stagedPantry.value = stagedPantry.value.filter(i => i !== item)
}

function pickPantry(items: string[]) {
  stagedPantry.value = [...items]
  pickerOpen.value = false
}

// ── Tastes ──────────────────────────────────────────────────────────────
const FAMILIES: Array<FacetChip['family']> = ['cuisines', 'moods', 'flavor_profiles', 'food_groups']

const tasteOptions = computed(() => {
  const vocab = props.vocabularies
  if (!vocab) return []
  const standing = new Set(stagedTastes.value)
  return FAMILIES.flatMap(family =>
    (vocab[family] || [])
      .filter(v => !standing.has(v))
      .map(v => ({ value: v, label: `${capitalise(v)} · ${t(`foodChatHome.planningState.family.${family}`)}` }))
  )
})

function addTaste(value: string | undefined) {
  if (value && !stagedTastes.value.includes(value)) stagedTastes.value = [...stagedTastes.value, value]
  tasteDraft.value = undefined
}

function removeTaste(value: string) {
  stagedTastes.value = stagedTastes.value.filter(v => v !== value)
}

const hasMore = computed(() =>
  extraChoiceParams.value.length > 0 || props.facets.length > 0 || tasteOptions.value.length > 0
  || props.statedTags.length > 0 || !!props.shapeSummary || props.favoritesDeclined
)

const moreSummary = computed(() => {
  const parts = extraChoiceParams.value.map(p => paramLabel(p))
  if (props.facets.length || tasteOptions.value.length) parts.push(t('foodChatHome.adjust.tastes'))
  if (props.statedTags.length) parts.push(t('foodChatHome.adjust.stated'))
  return parts.join(' · ')
})

// ── What changed ────────────────────────────────────────────────────────
function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every(x => b.includes(x))
}

const changes = computed<AdjustChanges>(() => {
  const original = props.facets.map(chip => chip.value)
  return {
    diners: sameSet(stagedDiners.value, props.selectedDiners) ? null : [...stagedDiners.value],
    pantry: sameSet(stagedPantry.value, props.pantry) ? null : [...stagedPantry.value],
    addFacets: stagedTastes.value.filter(v => !original.includes(v)),
    removeFacets: original.filter(v => !stagedTastes.value.includes(v)),
    params: { ...stagedParams.value }
  }
})

const changeCount = computed(() => {
  const c = changes.value
  const pantryDelta = c.pantry
    ? c.pantry.filter(i => !props.pantry.includes(i)).length + props.pantry.filter(i => !c.pantry!.includes(i)).length
    : 0
  return (c.diners ? 1 : 0) + pantryDelta + c.addFacets.length + c.removeFacets.length
    + Object.keys(c.params).length
})

function apply() {
  if (!changeCount.value || props.busy) return
  emit('apply', changes.value)
}
</script>

<style scoped>
.fc-adj-h {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--ui-text-highlighted);
}
.fc-adj-hint {
  font-size: 0.8125rem;
  color: var(--ui-text-muted);
}
.fc-adj-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 2.75rem;
  padding: 0 0.875rem;
  font-size: 0.875rem;
  border-width: 1px;
  border-radius: 9999px;
  transition: border-color 0.15s, background-color 0.15s;
}
.fc-adj-pill:disabled { cursor: default; opacity: 1; }
.fc-adj-cell {
  min-height: 2.75rem;
  padding: 0 0.5rem;
  font-size: 0.875rem;
  border-width: 1px;
  border-radius: 0.625rem;
  transition: border-color 0.15s, background-color 0.15s;
}
</style>
