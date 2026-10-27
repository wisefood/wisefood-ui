<template>
  <!-- A sentence of steps, so it reads left to right as what somebody did.
       Wraps rather than scrolls: a path cut at the edge hides its ending,
       and the ending is the part that says whether it worked. -->
  <ol
    class="flex flex-wrap items-center gap-x-1 gap-y-1.5"
    :aria-label="spoken"
  >
    <template
      v-for="(item, index) in steps"
      :key="index"
    >
      <li
        v-if="index > 0"
        aria-hidden="true"
        class="text-gray-300 dark:text-zinc-600"
      >
        <UIcon
          name="i-lucide-chevron-right"
          class="h-3.5 w-3.5"
        />
      </li>
      <li>
        <span
          class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs ring-1 ring-inset"
          :class="tone(item.step)"
        >
          {{ chatStepLabel(item.step) }}
          <span
            v-if="item.repeats > 1"
            class="tabular-nums opacity-70"
          >×{{ item.repeats }}{{ item.or_more ? '+' : '' }}</span>
        </span>
      </li>
    </template>
    <li
      v-if="more"
      class="text-xs text-gray-400 dark:text-gray-500"
    >
      …
    </li>
  </ol>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { JourneyStep } from '~/services/insightsApi'
import { chatStepLabel } from '~/utils/labels'

/**
 * The steps of a conversation, in order, as chips.
 *
 * Three tones carry the reading: a kept plan is the outcome planning exists
 * for, a failed or refused turn is the thing to look into, and everything
 * else is neutral — colouring every intent its own hue made a path a
 * rainbow that said nothing about how it went.
 */
const props = withDefaults(defineProps<{
  steps: JourneyStep[]
  /** The path was cut; there were further steps. */
  more?: boolean
}>(), { more: false })

const tone = (step: string) => {
  if (step === 'saved') return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30'
  if (step === 'error') return 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30'
  if (step === 'busy') return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30'
  return 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-zinc-800/60 dark:text-gray-200 dark:ring-white/10'
}

const spoken = computed(() =>
  props.steps
    .map(item => item.repeats > 1 ? `${chatStepLabel(item.step)} ${item.repeats} times` : chatStepLabel(item.step))
    .join(', then ') + (props.more ? ', and more' : '')
)
</script>
