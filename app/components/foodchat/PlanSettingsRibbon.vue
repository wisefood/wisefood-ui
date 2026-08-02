<template>
  <!--
    Plan settings as a ribbon across the canvas top.

    The same parameters as PlanParameterCard, in a different posture: the
    card lives in the chat column and asks to be *applied*; the ribbon sits
    on the plan itself and each control commits on interaction — a settings
    strip, not a form. Both speak to the same endpoint with the same card
    payload, so whichever surface the member reaches for, the values and the
    plan they refine stay consistent.
  -->
  <div class="fc-ribbon flex items-center gap-3 px-4 sm:px-6 py-2.5 shrink-0 overflow-x-auto">
    <UIcon name="i-lucide-settings-2" class="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 shrink-0" />

    <template v-for="param in card.parameters" :key="param.key">
      <!-- Discrete choices: segmented pills, commit on click -->
      <div
        v-if="param.kind === 'choice' && param.options"
        class="fc-ribbon-group flex items-center gap-1 shrink-0"
      >
        <span class="text-xs text-gray-500 dark:text-zinc-400 font-light whitespace-nowrap">
          {{ paramLabel(param) }}
        </span>
        <div class="flex rounded-full border border-gray-200 dark:border-zinc-700 p-0.5 bg-white dark:bg-zinc-800">
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

      <!-- Numeric scales: stepper, commit debounced so ± ± ± is one apply -->
      <div
        v-else-if="param.kind === 'scale'"
        class="fc-ribbon-group flex items-center gap-1 shrink-0"
      >
        <span class="text-xs text-gray-500 dark:text-zinc-400 font-light whitespace-nowrap">
          {{ paramLabel(param) }}
        </span>
        <div class="flex items-center rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <button
            class="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-brandp-500 disabled:opacity-40"
            :disabled="busy || Number(currentValue(param)) <= (param.min ?? 0)"
            :aria-label="`${paramLabel(param)} −`"
            @click="step(param, -1)"
          >
            <UIcon name="i-lucide-minus" class="w-3 h-3" />
          </button>
          <span class="text-xs font-medium tabular-nums text-gray-600 dark:text-zinc-300 min-w-14 text-center">
            {{ currentValue(param) }} {{ param.unit ?? '' }}
          </span>
          <button
            class="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-brandp-500 disabled:opacity-40"
            :disabled="busy || Number(currentValue(param)) >= (param.max ?? 100)"
            :aria-label="`${paramLabel(param)} +`"
            @click="step(param, 1)"
          >
            <UIcon name="i-lucide-plus" class="w-3 h-3" />
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

// Optimistic local values so a clicked pill lights up immediately; the
// authoritative value comes back on the next card refresh.
const local = reactive<Record<string, number | string>>({})

function currentValue(param: PlanParameter): number | string {
  return local[param.key] ?? param.value ?? param.default ?? (
    param.kind === 'scale' ? param.min ?? 0 : param.options?.[0]?.value ?? ''
  )
}

function commitChoice(param: PlanParameter, value: string) {
  if (currentValue(param) === value) return
  local[param.key] = value
  emit('apply', { [param.key]: value }, props.card.plan_type)
}

// Stepper presses batch into one apply — three taps of “+” should cost one
// regeneration, not three.
let stepTimer: ReturnType<typeof setTimeout> | null = null
let pendingKey: string | null = null

function step(param: PlanParameter, direction: number) {
  const stepSize = param.step ?? 1
  const next = Math.min(
    param.max ?? 100,
    Math.max(param.min ?? 0, Number(currentValue(param)) + direction * stepSize)
  )
  if (next === Number(currentValue(param))) return
  local[param.key] = next
  pendingKey = param.key
  if (stepTimer) clearTimeout(stepTimer)
  stepTimer = setTimeout(() => {
    stepTimer = null
    if (pendingKey) {
      emit('apply', { [pendingKey]: Number(local[pendingKey]) }, props.card.plan_type)
      pendingKey = null
    }
  }, 900)
}

onBeforeUnmount(() => {
  // A pending stepper commit still applies — leaving the page must not
  // silently discard a change the ribbon already shows as made. Only the
  // key with a live timer is pending; earlier commits already emitted.
  if (stepTimer) clearTimeout(stepTimer)
  if (pendingKey) {
    emit('apply', { [pendingKey]: Number(local[pendingKey]) }, props.card.plan_type)
    pendingKey = null
  }
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
  scrollbar-width: none;
}
.fc-ribbon::-webkit-scrollbar { display: none; }
.dark .fc-ribbon {
  border-bottom-color: rgb(63 63 70 / 0.5);
  background: rgb(24 24 27 / 0.6);
}
</style>
