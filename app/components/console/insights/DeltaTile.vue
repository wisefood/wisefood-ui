<template>
  <UCard
    :ui="{ body: 'p-4' }"
    class="border border-gray-200/70 dark:border-white/10"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="truncate text-sm text-gray-500 dark:text-gray-400">
          {{ label }}
        </p>
        <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
          {{ display }}
        </p>
        <p class="mt-1 flex items-center gap-1 text-xs">
          <template v-if="delta !== null">
            <UIcon
              :name="delta >= 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
              class="h-3.5 w-3.5"
              :class="toneClass"
              aria-hidden="true"
            />
            <span :class="toneClass">{{ delta >= 0 ? '+' : '' }}{{ delta }}%</span>
            <!-- Green means good and red means bad only to someone who can see
                 the colour. The judgement is said out loud for everyone else. -->
            <span class="sr-only">{{ delta >= 0 ? 'up' : 'down' }}, {{ isGood ? 'better' : 'worse' }} than the previous period</span>
            <span class="text-gray-400 dark:text-gray-500">vs previous {{ days }}d</span>
          </template>
          <span
            v-else
            class="text-gray-400 dark:text-gray-500"
          >{{ hint || 'no earlier data' }}</span>
        </p>
      </div>
      <div class="rounded-xl bg-brand-50 p-3 dark:bg-brand-500/10">
        <UIcon
          :name="icon"
          class="h-5 w-5 text-brand-600 dark:text-brand-300"
        />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * A figure with its direction of travel.
 *
 * `higherIsBetter` exists because the colour has to mean something: searches
 * going up is good, searches finding nothing going up is not, and a tile that
 * paints both green teaches people to ignore the colour.
 */
const props = withDefaults(defineProps<{
  label: string
  value: number
  previous: number
  icon: string
  days: number
  suffix?: string
  prefix?: string
  decimals?: number
  higherIsBetter?: boolean
  hint?: string
}>(), {
  suffix: '',
  prefix: '',
  decimals: 0,
  higherIsBetter: true,
  hint: ''
})

const display = computed(() => {
  const n = props.decimals ? props.value.toFixed(props.decimals) : Math.round(props.value).toLocaleString()
  return `${props.prefix}${n}${props.suffix}`
})

// Null rather than a number when there is nothing to compare against: a jump
// from zero is not "+100%", it is "new".
const delta = computed<number | null>(() => {
  if (!props.previous) return null
  return Math.round(((props.value - props.previous) / props.previous) * 1000) / 10
})

/** Whether the movement is welcome. Drives the colour AND the spoken word. */
const isGood = computed(() => {
  if (delta.value === null || delta.value === 0) return true
  return delta.value > 0 ? props.higherIsBetter : !props.higherIsBetter
})

const toneClass = computed(() => {
  if (delta.value === null || delta.value === 0) return 'text-gray-400 dark:text-gray-500'
  return isGood.value ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
})
</script>
