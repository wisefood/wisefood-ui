<template>
  <!--
    What FoodChat is planning around, shown and correctable.

    Everything here was already true and already used — the pantry, the facets
    read out of a sentence, a diet stated mid-conversation — and none of it was
    on screen. So a member who said "I have zucchini and spinach" had no way to
    know it was heard, and a facet inferred from "something light" could only be
    retracted by arguing with the assistant until it agreed.

    Two rules this panel follows:

    * Nothing here claims more than it does. A chip says what it is and where it
      came from; a removed chip is gone from the NEXT plan, not from the one on
      screen, and the button says so.
    * Changing something is not the same as re-planning. Removing three chips
      should produce one plan, not three, so edits accumulate and the member
      commits them.
  -->
  <div class="fc-state-panel rounded-2xl border border-gray-200 dark:border-zinc-700/70 bg-white/60 dark:bg-zinc-900/40 overflow-hidden">
    <!-- Header: collapses, because on a settled plan this is reference material -->
    <button
      class="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 transition-colors"
      :aria-expanded="open"
      @click="open = !open"
    >
      <UIcon
        name="i-lucide-clipboard-list"
        class="w-4 h-4 text-brandp-500 shrink-0"
      />
      <span class="text-sm font-medium text-gray-700 dark:text-zinc-200">
        {{ t('foodChatHome.planningState.title') }}
      </span>
      <span
        v-if="!open && summaryCount > 0"
        class="text-[10px] px-1.5 py-0.5 rounded-full bg-brandp-50 dark:bg-brandp-900/30 text-brandp-600 dark:text-brandp-300 tabular-nums"
      >{{ summaryCount }}</span>
      <UIcon
        :name="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        class="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 ml-auto shrink-0"
      />
    </button>

    <div
      v-if="open"
      class="px-4 pb-4 space-y-4"
    >
      <p class="text-xs text-gray-500 dark:text-zinc-400 font-light">
        {{ t('foodChatHome.planningState.subtitle') }}
      </p>

      <!-- ── The shape being planned ──────────────────────────────────
           Only when it is not the default: "1 day — breakfast; lunch; dinner"
           is what everyone gets and is not news. A member who asked for three
           days with a side at dinner should be able to see that standing. -->
      <section v-if="state && !state.plan_shape_is_default && state.plan_shape_summary">
        <h4 class="text-[10px] uppercase tracking-wide text-gray-400 dark:text-zinc-500 mb-1.5 flex items-center gap-1">
          <UIcon name="i-lucide-layout-grid" class="w-3 h-3" />
          {{ t('foodChatHome.planningState.shapeLabel') }}
        </h4>
        <p class="text-[11px] text-gray-600 dark:text-zinc-300">
          {{ state.plan_shape_summary }}
        </p>
      </section>

      <!-- ── How long a meal may take ─────────────────────────────────
           In force whether it came from the slider or from a sentence, and
           shown here because a ribbon that lists what is being planned around
           and omits a hard time limit is a ribbon that is lying.

           Read-only on purpose: the slider card is where this is changed, and
           two controls for one number is how they end up disagreeing. The hint
           says where to go. -->
      <section v-if="state && state.max_minutes">
        <h4 class="text-[10px] uppercase tracking-wide text-gray-400 dark:text-zinc-500 mb-1.5 flex items-center gap-1">
          <UIcon name="i-lucide-timer" class="w-3 h-3" />
          {{ t('foodChatHome.planningState.timeLabel') }}
        </h4>
        <p class="text-[11px] text-gray-600 dark:text-zinc-300">
          {{ t('foodChatHome.planningState.timeValue', { minutes: state.max_minutes }) }}
          <span class="text-gray-400 dark:text-zinc-500 font-light">
            — {{ t('foodChatHome.planningState.timeHint') }}
          </span>
        </p>
      </section>

      <!-- ── In your kitchen ─────────────────────────────────────────── -->
      <section>
        <div class="flex items-baseline gap-2 mb-1.5">
          <h4 class="text-[10px] uppercase tracking-wide text-gray-400 dark:text-zinc-500 flex items-center gap-1">
            <UIcon
              name="i-lucide-refrigerator"
              class="w-3 h-3"
            />
            {{ t('foodChatHome.planningState.pantryLabel') }}
          </h4>
          <span class="text-[10px] text-gray-400 dark:text-zinc-500 font-light truncate">
            {{ t('foodChatHome.planningState.pantryHint') }}
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <span
            v-for="item in pantry"
            :key="`pantry-${item}`"
            class="group inline-flex items-center gap-1 pl-2 pr-1 py-0.5 text-[11px] rounded-full border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
          >
            {{ item }}
            <button
              class="w-4 h-4 flex items-center justify-center rounded-full text-emerald-500/70 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-800/40 disabled:opacity-40"
              :aria-label="t('foodChatHome.planningState.removeItem', { value: item })"
              :disabled="busy"
              @click="emit('remove-pantry', item)"
            >
              <UIcon
                name="i-lucide-x"
                class="w-2.5 h-2.5"
              />
            </button>
          </span>

          <span
            v-if="!pantry.length"
            class="text-[11px] text-gray-400 dark:text-zinc-500 font-light"
          >
            {{ t('foodChatHome.planningState.pantryEmpty') }}
          </span>
        </div>

        <!-- Add: a plain text field, because the member's kitchen is not a
             closed vocabulary. Unlike a facet, an unmatched ingredient still
             does something useful — it becomes an ingredient search. -->
        <form
          class="mt-2 flex items-center gap-1.5"
          @submit.prevent="submitPantry"
        >
          <UInput
            v-model="draft"
            size="xs"
            :placeholder="t('foodChatHome.planningState.pantryAddPlaceholder')"
            :aria-label="t('foodChatHome.planningState.pantryAdd')"
            :disabled="busy"
            class="flex-1 min-w-0"
          />
          <UButton
            type="submit"
            size="xs"
            color="neutral"
            variant="soft"
            icon="i-lucide-plus"
            :disabled="busy || !draft.trim()"
            :aria-label="t('foodChatHome.planningState.pantryAdd')"
          />
        </form>
      </section>

      <!-- ── Heard from you: the removable facet chips ───────────────── -->
      <section v-if="facets.length || vocabularyOptions.length">
        <div class="flex items-baseline gap-2 mb-1.5">
          <h4 class="text-[10px] uppercase tracking-wide text-gray-400 dark:text-zinc-500 flex items-center gap-1">
            <UIcon
              name="i-lucide-ear"
              class="w-3 h-3"
            />
            {{ t('foodChatHome.planningState.facetsLabel') }}
          </h4>
          <span class="text-[10px] text-gray-400 dark:text-zinc-500 font-light truncate">
            {{ t('foodChatHome.planningState.facetsHint') }}
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <UTooltip
            v-for="chip in facets"
            :key="`facet-${chip.family}-${chip.value}`"
            :text="familyLabel(chip.family)"
          >
            <span
              class="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 text-[11px] rounded-full border border-sky-200 dark:border-sky-800/60 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300"
            >
              {{ humanise(chip.value) }}
              <button
                class="w-4 h-4 flex items-center justify-center rounded-full text-sky-500/70 hover:text-sky-700 hover:bg-sky-100 dark:hover:bg-sky-800/40 disabled:opacity-40"
                :aria-label="t('foodChatHome.planningState.removeItem', { value: chip.value })"
                :disabled="busy"
                @click="emit('remove-facet', chip.value)"
              >
                <UIcon
                  name="i-lucide-x"
                  class="w-2.5 h-2.5"
                />
              </button>
            </span>
          </UTooltip>

          <span
            v-if="!facets.length"
            class="text-[11px] text-gray-400 dark:text-zinc-500 font-light"
          >{{ t('foodChatHome.planningState.facetsEmpty') }}</span>
        </div>

        <!-- Add one. The options come from the LIVE corpus vocabulary, not a
             hardcoded list: the search ANDs facet values and never relaxes an
             unlisted one, so offering a taste the collection is not tagged
             with would empty the next plan rather than narrow it. Nothing is
             offered when the vocabulary is unreachable. -->
        <div v-if="vocabularyOptions.length" class="mt-2">
          <USelectMenu
            v-model="facetDraft"
            :items="vocabularyOptions"
            value-key="value"
            label-key="label"
            size="xs"
            :placeholder="t('foodChatHome.planningState.facetsAdd')"
            :disabled="busy"
            class="w-full"
            @update:model-value="submitFacet"
          />
        </div>
      </section>

      <!-- ── Diet stated in chat, and nutrition claims ───────────────── -->
      <!-- Not removable here: a diet is a hard constraint, and a chip with an
           × on it invites a click that could quietly drop an allergy-adjacent
           restriction. Retracting one is a sentence ("actually, use my
           profile"), which the assistant already understands. -->
      <section
        v-if="dietTags.length || claimTags.length"
        class="space-y-2"
      >
        <div v-if="dietTags.length">
          <div class="flex items-baseline gap-2 mb-1.5">
            <h4 class="text-[10px] uppercase tracking-wide text-gray-400 dark:text-zinc-500 flex items-center gap-1">
              <UIcon
                name="i-lucide-leaf"
                class="w-3 h-3"
              />
              {{ t('foodChatHome.planningState.dietLabel') }}
            </h4>
            <span class="text-[10px] text-gray-400 dark:text-zinc-500 font-light truncate">
              {{ t('foodChatHome.planningState.dietHint') }}
            </span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="tag in dietTags"
              :key="`diet-${tag}`"
              class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full border border-violet-200 dark:border-violet-800/60 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
            >
              <UIcon
                name="i-lucide-shield-check"
                class="w-2.5 h-2.5"
              />
              {{ humanise(tag) }}
            </span>
          </div>
        </div>

        <div v-if="claimTags.length">
          <h4 class="text-[10px] uppercase tracking-wide text-gray-400 dark:text-zinc-500 mb-1.5 flex items-center gap-1">
            <UIcon
              name="i-lucide-target"
              class="w-3 h-3"
            />
            {{ t('foodChatHome.planningState.claimsLabel') }}
          </h4>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="tag in claimTags"
              :key="`claim-${tag}`"
              class="inline-flex items-center px-2 py-0.5 text-[11px] rounded-full border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
            >
              {{ humanise(tag) }}
            </span>
          </div>
        </div>
      </section>

      <!-- The declined-favourites answer. Shown because "we asked and they said
           no" is a decision the member made and should be able to see. -->
      <p
        v-if="state && state.use_favorites === false"
        class="text-[11px] text-gray-400 dark:text-zinc-500 font-light flex items-center gap-1"
      >
        <UIcon
          name="i-lucide-heart-off"
          class="w-3 h-3 shrink-0"
        />
        {{ t('foodChatHome.planningState.favoritesDeclined') }}
      </p>

      <p
        v-if="!summaryCount"
        class="text-[11px] text-gray-400 dark:text-zinc-500 font-light"
      >
        {{ t('foodChatHome.planningState.empty') }}
      </p>

      <!-- ── Commit ──────────────────────────────────────────────────── -->
      <div
        v-if="pendingChanges > 0"
        class="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-zinc-800"
      >
        <UButton
          size="xs"
          color="primary"
          :loading="busy"
          icon="i-lucide-refresh-cw"
          @click="emit('replan')"
        >
          {{ busy ? t('foodChatHome.planningState.replanning') : t('foodChatHome.planningState.replan') }}
        </UButton>
        <span class="text-[10px] text-gray-400 dark:text-zinc-500 font-light">
          {{ t('foodChatHome.planningState.pendingChanges', { count: pendingChanges }) }}
        </span>
      </div>
      <p
        v-else-if="summaryCount > 0"
        class="text-[10px] text-gray-400 dark:text-zinc-500 font-light pt-1 border-t border-gray-100 dark:border-zinc-800"
      >
        {{ t('foodChatHome.planningState.replanHint') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FacetChip, PlanningState, Vocabularies } from '~/services/foodchatApi'

const props = withDefaults(defineProps<{
  state: PlanningState | null
  facets: FacetChip[]
  /** How many edits have been made since the last plan. Drives the commit row. */
  pendingChanges?: number
  busy?: boolean
  /** Start expanded when the member has nothing yet and needs the invitation. */
  startOpen?: boolean
  /** The facet vocabulary the corpus carries. Empty hides the picker. */
  vocabularies?: Vocabularies | null
}>(), {
  pendingChanges: 0,
  busy: false,
  startOpen: false,
  vocabularies: null
})

const emit = defineEmits<{
  'add-facet': [value: string]
  'add-pantry': [items: string[]]
  'remove-pantry': [item: string]
  'remove-facet': [value: string]
  'replan': []
}>()

const { t } = useI18n()

const open = ref(props.startOpen)
const draft = ref('')
const facetDraft = ref<string | undefined>(undefined)

/**
 * Everything the corpus is tagged with, minus what is already standing.
 *
 * Flattened across the four families for the same reason the chips are: the
 * member is choosing a taste, not a taxonomy slot. The family rides in the
 * label so two families sharing a word stay distinguishable.
 */
const vocabularyOptions = computed(() => {
  const vocab = props.vocabularies
  if (!vocab) return []
  const standing = new Set(props.facets.map(chip => chip.value))
  const families: Array<FacetChip['family']> = [
    'cuisines', 'moods', 'flavor_profiles', 'food_groups'
  ]
  return families.flatMap(family =>
    (vocab[family] || [])
      .filter(value => !standing.has(value))
      .map(value => ({
        value,
        label: `${humanise(value)} · ${familyLabel(family)}`
      }))
  )
})

function submitFacet(value: string | undefined) {
  if (!value) return
  emit('add-facet', value)
  // Cleared immediately: the chip list above is the record of what was added,
  // and leaving the choice in the box reads as "still pending".
  facetDraft.value = undefined
}

const pantry = computed(() => props.state?.pantry ?? [])
const dietTags = computed(() => props.state?.diet_tags ?? [])
const claimTags = computed(() => props.state?.claim_tags ?? [])

/** Everything standing, as one number for the collapsed header. */
const summaryCount = computed(() =>
  pantry.value.length + props.facets.length + dietTags.value.length + claimTags.value.length
  // A time ceiling counts as one thing in force, so the collapsed badge does
  // not read "0" on a session whose only standing constraint is the clock.
  + (props.state?.max_minutes ? 1 : 0)
)

/**
 * "ground beef, feta" and "ground beef" both work.
 *
 * A comma is how people list things, and splitting here means one round trip
 * instead of three — the endpoint takes a list precisely so it can.
 */
function submitPantry() {
  const items = draft.value
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
  if (!items.length) return
  emit('add-pantry', items)
  draft.value = ''
}

/** `flavor_profiles` -> the translated family name, for the chip's tooltip. */
function familyLabel(family: FacetChip['family']): string {
  return t(`foodChatHome.planningState.family.${family}`)
}

/** `middle_eastern` -> `Middle eastern`. Slugs are how the corpus stores them. */
function humanise(value: string): string {
  const text = String(value || '').replace(/[_-]+/g, ' ').trim()
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}
</script>

<style scoped>
.fc-state-panel {
  backdrop-filter: blur(4px);
}
</style>
