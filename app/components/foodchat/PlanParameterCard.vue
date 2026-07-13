<template>
  <div class="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-700/50">
    <div class="rounded-xl border border-brandp-100 dark:border-brandp-900/50 bg-brandp-50/50 dark:bg-brandp-950/20 px-3 py-2.5 space-y-3">
      <!-- Header -->
      <div class="flex items-center gap-1.5">
        <UIcon name="i-lucide-sliders-horizontal" class="w-3.5 h-3.5 text-brandp-500 dark:text-brandp-300 shrink-0" />
        <span class="flex-1 text-[11px] font-medium text-gray-700 dark:text-zinc-200">
          {{ t('foodChatHome.chat.planParams.title') }}
        </span>
        <span class="text-[10px] text-gray-400 dark:text-zinc-500 font-light">
          {{ t('foodChatHome.chat.planParams.optional') }}
        </span>
        <button
          class="flex items-center justify-center w-5 h-5 rounded-full text-gray-400 dark:text-zinc-500 hover:bg-gray-200/60 dark:hover:bg-zinc-700/60 transition-colors"
          :aria-label="t('foodChatHome.chat.planParams.dismiss')"
          @click="emit('dismiss')"
        >
          <UIcon name="i-lucide-x" class="w-3 h-3" />
        </button>
      </div>

      <!-- One slider per parameter -->
      <div v-for="param in card.parameters" :key="param.key" class="space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[11px] text-gray-600 dark:text-zinc-300 font-light">
            {{ paramLabel(param) }}
          </span>
          <span
            class="text-[11px] font-medium tabular-nums transition-colors"
            :class="touched.has(param.key)
              ? 'text-brandp-600 dark:text-brandp-300'
              : 'text-gray-400 dark:text-zinc-500'"
          >
            {{ displayValue(param) }}
          </span>
        </div>

        <input
          type="range"
          class="fc-param-slider"
          :min="param.kind === 'scale' ? param.min ?? 0 : 0"
          :max="param.kind === 'scale' ? param.max ?? 100 : (param.options?.length ?? 1) - 1"
          :step="param.kind === 'scale' ? param.step ?? 1 : 1"
          :value="sliderPosition(param)"
          :disabled="busy"
          :aria-label="paramLabel(param)"
          @input="onSlide(param, ($event.target as HTMLInputElement).value)"
        />

        <!-- Stop labels for discrete scales -->
        <div v-if="param.kind === 'choice' && param.options" class="flex justify-between">
          <span
            v-for="option in param.options"
            :key="option.value"
            class="text-[9px] font-light text-gray-400 dark:text-zinc-500 first:text-left last:text-right text-center"
          >
            {{ optionLabel(param, option) }}
          </span>
        </div>
      </div>

      <!-- Apply row -->
      <div class="flex items-center justify-end gap-2 pt-0.5">
        <span v-if="touched.size" class="text-[10px] text-gray-400 dark:text-zinc-500 font-light">
          {{ t('foodChatHome.chat.planParams.touchedHint', touched.size) }}
        </span>
        <button
          class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-full font-medium transition-colors
                 bg-brandp-500 text-white hover:bg-brandp-600
                 disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
          :disabled="busy || touched.size === 0"
          @click="apply"
        >
          <UIcon v-if="busy" name="i-lucide-loader-2" class="w-3 h-3 animate-spin" />
          <UIcon v-else name="i-lucide-check" class="w-3 h-3" />
          {{ busy ? t('foodChatHome.chat.planParams.applying') : t('foodChatHome.chat.planParams.apply') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PlanParameter, PlanParameterCard, PlanParameterOption, PlanParameterValues } from '~/services/foodchatApi'

defineProps<{
  card: PlanParameterCard
  busy?: boolean
}>()

const emit = defineEmits<{
  apply: [values: PlanParameterValues]
  dismiss: []
}>()

const { t } = useI18n()

// Local knob positions; only knobs the user actually moved are applied,
// so untouched parameters stay unconstrained
const local = reactive<Record<string, number | string>>({})
const touched = ref(new Set<string>())

function currentValue(param: PlanParameter): number | string {
  return local[param.key] ?? param.value ?? param.default ?? (
    param.kind === 'scale' ? param.min ?? 0 : param.options?.[0]?.value ?? ''
  )
}

function sliderPosition(param: PlanParameter): number {
  const value = currentValue(param)
  if (param.kind === 'scale') return Number(value)
  const idx = param.options?.findIndex(o => o.value === value) ?? 0
  return Math.max(0, idx)
}

function onSlide(param: PlanParameter, raw: string) {
  if (param.kind === 'scale') {
    local[param.key] = Number(raw)
  } else {
    const option = param.options?.[Number(raw)]
    if (!option) return
    local[param.key] = option.value
  }
  touched.value = new Set([...touched.value, param.key])
}

function apply() {
  const values: PlanParameterValues = {}
  for (const key of touched.value) {
    const value = local[key]
    if (value !== undefined) values[key] = value
  }
  if (Object.keys(values).length) emit('apply', values)
}

// Labels come from the backend in English; prefer a translation when the
// locale has one, fall back to the backend label
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

function displayValue(param: PlanParameter): string {
  const value = currentValue(param)
  if (param.kind === 'scale') return `${value} ${param.unit ?? ''}`.trim()
  const option = param.options?.find(o => o.value === value)
  return option ? optionLabel(param, option) : String(value)
}
</script>

<style scoped>
.fc-param-slider {
  width: 100%;
  height: 0.375rem;
  border-radius: 9999px;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  background: var(--color-gray-200);
  accent-color: var(--color-brandp-500);
}
.fc-param-slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.fc-param-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 9999px;
  background: var(--color-brandp-500);
  border: 2px solid white;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
  transition: transform 150ms;
}
.fc-param-slider::-webkit-slider-thumb:hover {
  transform: scale(1.25);
}
.fc-param-slider::-moz-range-thumb {
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 9999px;
  background: var(--color-brandp-500);
  border: 2px solid white;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
  transition: transform 150ms;
}
.fc-param-slider::-moz-range-thumb:hover {
  transform: scale(1.25);
}
@media (prefers-color-scheme: dark) {
  .fc-param-slider {
    background: var(--color-zinc-700);
  }
  .fc-param-slider::-webkit-slider-thumb {
    background: var(--color-brandp-300);
    border-color: var(--color-zinc-900);
  }
  .fc-param-slider::-moz-range-thumb {
    background: var(--color-brandp-300);
    border-color: var(--color-zinc-900);
  }
}
</style>
