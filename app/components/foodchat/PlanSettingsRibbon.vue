<template>
  <!--
    Plan settings as a ribbon across the canvas top.

    The same parameters as PlanParameterCard, in a different posture: the
    card lives in the chat column and asks to be *applied*; the ribbon sits
    on the plan itself and each control commits on interaction — a settings
    strip, not a form. Both speak to the same endpoint with the same card
    payload, so whichever surface the member reaches for, the values and the
    plan they refine stay consistent.

    It WRAPS rather than scrolls. A horizontal scroller hides its own contents:
    a control off the right edge is a control the member does not know exists,
    and there is no scrollbar to hint at it (this one hid its own). Four groups
    on a narrow canvas become two rows.

    Three postures, one per kind of thing being set, so no two controls that
    mean different things look the same:

      duration   preset chips — 15 / 30 / 45 / 60 / 90. It was a ± stepper at
                 5 minutes a press, which is twelve presses from 30 to 90.
      a scale    a draggable knob over its stops. "Simple → Any" and
                 "Off → Reuse → Minimal shopping" are directions, and the
                 parameter definition has said so since it was written:
                 "a discrete labeled scale (still rendered as a draggable
                 knob over fixed stops in the UI)". It never was.
      a choice   segmented pills. "Lose weight" is not more or less than
                 "high protein", so nothing about it should slide.
  -->
  <div class="fc-ribbon flex flex-wrap items-center gap-x-4 gap-y-2 px-4 sm:px-6 py-2.5 shrink-0">
    <UIcon name="i-lucide-settings-2" class="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 shrink-0" />

    <template v-for="param in card.parameters" :key="param.key">
      <!-- A numeric duration: quick-pick presets. -->
      <div
        v-if="param.kind === 'scale'"
        class="fc-ribbon-group flex items-center gap-1.5"
      >
        <span class="text-xs text-gray-500 dark:text-zinc-400 font-light whitespace-nowrap">
          {{ paramLabel(param) }}
        </span>
        <div class="flex flex-wrap items-center gap-1">
          <button
            v-for="preset in presets(param)"
            :key="preset"
            class="px-2 py-0.5 text-xs rounded-md border tabular-nums transition-colors"
            :class="Number(currentValue(param)) === preset
              ? 'border-brandp-400 bg-brandp-50 dark:bg-brandp-950/50 text-brandp-700 dark:text-brandp-300 font-medium'
              : 'border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-brandp-300 hover:text-brandp-600'"
            :disabled="busy"
            @click="commitScale(param, preset)"
          >
            {{ preset }}<span class="font-light">{{ param.unit ? ` ${param.unit}` : '' }}</span>
          </button>
        </div>
      </div>

      <!-- An ordered scale: a knob that slides across its stops. -->
      <div
        v-else-if="param.kind === 'choice' && param.ordered && param.options"
        class="fc-ribbon-group flex items-center gap-2"
      >
        <span class="text-xs text-gray-500 dark:text-zinc-400 font-light whitespace-nowrap">
          {{ paramLabel(param) }}
        </span>
        <div class="flex items-center gap-2">
          <input
            :value="stopIndex(param)"
            type="range"
            min="0"
            :max="param.options.length - 1"
            step="1"
            class="fc-knob"
            :disabled="busy"
            :aria-label="paramLabel(param)"
            :aria-valuetext="optionLabel(param, param.options[stopIndex(param)]!)"
            @input="commitStop(param, Number(($event.target as HTMLInputElement).value))"
          >
          <span class="text-xs font-medium text-gray-600 dark:text-zinc-300 whitespace-nowrap min-w-16">
            {{ optionLabel(param, param.options[stopIndex(param)]!) }}
          </span>
        </div>
      </div>

      <!-- Unordered alternatives: segmented pills. -->
      <div
        v-else-if="param.kind === 'choice' && param.options"
        class="fc-ribbon-group flex items-center gap-1"
      >
        <span class="text-xs text-gray-500 dark:text-zinc-400 font-light whitespace-nowrap">
          {{ paramLabel(param) }}
        </span>
        <div class="flex flex-wrap rounded-full border border-gray-200 dark:border-zinc-700 p-0.5 bg-white dark:bg-zinc-800">
          <button
            v-for="option in param.options"
            :key="option.value"
            class="px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors"
            :class="currentValue(param) === option.value
              ? 'bg-brandp-500 text-white font-medium'
              : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'"
            :disabled="busy"
            @click="commitChoice(param, option.value)"
          >
            {{ optionLabel(param, option) }}
          </button>
        </div>
      </div>
    </template>

    <UIcon
      v-if="busy"
      name="i-lucide-loader-2"
      class="w-3.5 h-3.5 text-brandp-400 animate-spin shrink-0 ml-auto"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PlanParameter, PlanParameterCard, PlanParameterOption, PlanParameterValues } from '~/services/foodchatApi'

const props = defineProps<{
  card: PlanParameterCard
  busy?: boolean
}>()

const emit = defineEmits<{
  apply: [values: PlanParameterValues, planType?: 'daily' | 'weekly']
}>()

const { t } = useI18n()

// Optimistic local values so a clicked chip lights up immediately; the
// authoritative value comes back on the next card refresh.
const local = reactive<Record<string, number | string>>({})

function currentValue(param: PlanParameter): number | string {
  return local[param.key] ?? param.value ?? param.default ?? (
    param.kind === 'scale' ? param.min ?? 0 : param.options?.[0]?.value ?? ''
  )
}

/**
 * The durations offered, snapped to the parameter's own bounds and step.
 *
 * Derived rather than hardcoded so the server stays the authority on the
 * range: a card that widens to 120 minutes gets a 120 chip without a UI
 * change, and one that narrows drops the chips it can no longer accept.
 */
function presets(param: PlanParameter): number[] {
  const min = param.min ?? 10
  const max = param.max ?? 90
  const step = param.step ?? 5
  const wanted = [15, 30, 45, 60, 90, 120]
  const snapped = wanted
    .filter(value => value >= min && value <= max)
    .map(value => Math.round(value / step) * step)
  // The member's own value belongs on the strip even when it is not a preset —
  // otherwise a 25-minute setting shows nothing selected and the next click
  // silently widens it.
  const current = Number(currentValue(param))
  if (Number.isFinite(current) && current >= min && current <= max
      && !snapped.includes(current)) {
    snapped.push(current)
  }
  return [...new Set(snapped)].sort((a, b) => a - b)
}

/** Which stop of an ordered scale is selected. */
function stopIndex(param: PlanParameter): number {
  const options = param.options ?? []
  const found = options.findIndex(option => option.value === currentValue(param))
  return found >= 0 ? found : 0
}

function commitChoice(param: PlanParameter, value: string) {
  if (currentValue(param) === value) return
  local[param.key] = value
  emit('apply', { [param.key]: value }, props.card.plan_type)
}

/**
 * A dragged knob fires `input` on every pixel, so the commit is debounced —
 * sliding from Off to Minimal shopping must cost one regeneration, not three.
 * The label under it updates immediately, because the knob is already there.
 */
let stopTimer: ReturnType<typeof setTimeout> | null = null
let pendingKey: string | null = null

function schedule(key: string) {
  pendingKey = key
  if (stopTimer) clearTimeout(stopTimer)
  stopTimer = setTimeout(flush, 700)
}

function flush() {
  if (stopTimer) {
    clearTimeout(stopTimer)
    stopTimer = null
  }
  if (!pendingKey) return
  const key = pendingKey
  pendingKey = null
  emit('apply', { [key]: local[key]! }, props.card.plan_type)
}

function commitStop(param: PlanParameter, index: number) {
  const option = param.options?.[index]
  if (!option || currentValue(param) === option.value) return
  local[param.key] = option.value
  schedule(param.key)
}

function commitScale(param: PlanParameter, value: number) {
  if (Number(currentValue(param)) === value) return
  local[param.key] = value
  // A preset is one deliberate click, so it commits at once — nothing to batch.
  emit('apply', { [param.key]: value }, props.card.plan_type)
}

onBeforeUnmount(() => {
  // A pending commit still applies — leaving the page must not silently
  // discard a change the ribbon already shows as made.
  flush()
})

function paramLabel(param: PlanParameter): string {
  const key = `foodChatHome.chat.planParams.params.${param.key}`
  const translated = t(key)
  return translated === key ? param.label : translated
}

function optionLabel(param: PlanParameter, option: PlanParameterOption): string {
  const key = `foodChatHome.chat.planParams.options.${option.value}`
  const translated = t(key)
  return translated === key ? option.label : translated
}
</script>

<style scoped>
.fc-ribbon {
  border-bottom: 1px solid rgb(228 228 231 / 0.7);
  background: rgb(255 255 255 / 0.6);
  backdrop-filter: blur(4px);
}
.dark .fc-ribbon {
  border-bottom-color: rgb(63 63 70 / 0.5);
  background: rgb(24 24 27 / 0.6);
}

/* The draggable knob for an ordered scale. Narrow on purpose: it sits inline
   with three other controls, and a full-width slider would read as the page's
   main affordance rather than one setting among several. */
.fc-knob {
  -webkit-appearance: none;
  appearance: none;
  width: 4.5rem;
  height: 1rem;
  background: transparent;
  cursor: grab;
}
.fc-knob:disabled { cursor: default; opacity: 0.5; }
.fc-knob:active { cursor: grabbing; }

.fc-knob::-webkit-slider-runnable-track {
  height: 0.25rem;
  border-radius: 9999px;
  background: rgb(228 228 231);
}
.dark .fc-knob::-webkit-slider-runnable-track { background: rgb(63 63 70); }
.fc-knob::-moz-range-track {
  height: 0.25rem;
  border-radius: 9999px;
  background: rgb(228 228 231);
}
.dark .fc-knob::-moz-range-track { background: rgb(63 63 70); }

.fc-knob::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 0.85rem;
  height: 0.85rem;
  margin-top: -0.3rem;
  border-radius: 9999px;
  background: var(--ui-primary, rgb(99 102 241));
  border: 2px solid white;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
}
.dark .fc-knob::-webkit-slider-thumb { border-color: rgb(24 24 27); }
.fc-knob::-moz-range-thumb {
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 9999px;
  background: var(--ui-primary, rgb(99 102 241));
  border: 2px solid white;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
}
.dark .fc-knob::-moz-range-thumb { border-color: rgb(24 24 27); }

.fc-knob:focus-visible { outline: none; }
.fc-knob:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px rgb(99 102 241 / 0.35);
}
.fc-knob:focus-visible::-moz-range-thumb {
  box-shadow: 0 0 0 3px rgb(99 102 241 / 0.35);
}
</style>
