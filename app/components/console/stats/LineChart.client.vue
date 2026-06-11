<template>
  <div class="h-48 w-full">
    <VisXYContainer
      v-if="data.length"
      :data="data"
      :height="180"
    >
      <VisArea
        :x="xAccessor"
        :y="yAccessor"
        :color="color"
        :opacity="0.12"
      />
      <VisLine
        :x="xAccessor"
        :y="yAccessor"
        :color="color"
      />
      <VisAxis
        type="x"
        :tick-format="xTickFormat"
        :num-ticks="6"
      />
      <VisAxis
        type="y"
        :tick-format="yTickFormat"
        :num-ticks="4"
      />
      <VisTooltip />
    </VisXYContainer>
    <div
      v-else
      class="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500"
    >
      No data in range.
    </div>
  </div>
</template>

<script setup lang="ts">
import { VisXYContainer, VisLine, VisArea, VisAxis, VisTooltip } from '@unovis/vue'
import type { TimeBucket } from '~/services/observabilityApi'

const props = withDefaults(defineProps<{
  data: TimeBucket[]
  color?: string
  valuePrefix?: string
}>(), {
  color: '#d53355',
  valuePrefix: ''
})

// unovis needs numeric x; map bucket index → label for the axis.
const xAccessor = (_d: TimeBucket, i: number) => i
const yAccessor = (d: TimeBucket) => d.value

const xTickFormat = (i: number): string => {
  const b = props.data[Math.round(i)]?.bucket ?? ''
  // "2026-06-09" → "06-09"; "2026-06-09T14:00:00Z" → "14:00"
  if (b.includes('T')) return b.slice(11, 16)
  return b.length >= 10 ? b.slice(5, 10) : b
}

const yTickFormat = (v: number): string => {
  if (props.valuePrefix === '$') return `$${v.toFixed(2)}`
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`
  return String(Math.round(v))
}
</script>
