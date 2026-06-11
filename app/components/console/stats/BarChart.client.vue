<template>
  <div class="w-full">
    <VisXYContainer
      v-if="data.length"
      :data="data"
      :height="height"
    >
      <VisStackedBar
        :x="xAccessor"
        :y="yAccessor"
        :color="color"
        :rounded-corners="4"
        orientation="horizontal"
      />
      <VisAxis
        type="y"
        :tick-format="labelFormat"
        :num-ticks="data.length"
      />
      <VisAxis
        type="x"
        :tick-format="valueFormat"
        :num-ticks="4"
      />
      <VisTooltip />
    </VisXYContainer>
    <div
      v-else
      class="py-8 text-center text-sm text-gray-400 dark:text-gray-500"
    >
      No data in range.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { VisXYContainer, VisStackedBar, VisAxis, VisTooltip } from '@unovis/vue'
import type { MetricRow } from '~/services/observabilityApi'

const props = withDefaults(defineProps<{
  data: MetricRow[]
  color?: string
  valuePrefix?: string
}>(), {
  color: '#a6b52b',
  valuePrefix: ''
})

const height = computed(() => Math.max(120, props.data.length * 36))

// Horizontal bars: category on Y (index), value on X.
const xAccessor = (d: MetricRow, i: number) => i
const yAccessor = (d: MetricRow) => d.value

const labelFormat = (i: number): string => {
  const label = props.data[Math.round(i)]?.label ?? ''
  return label.length > 22 ? `${label.slice(0, 21)}…` : label
}

const valueFormat = (v: number): string => {
  if (props.valuePrefix === '$') return `$${v.toFixed(2)}`
  if (props.valuePrefix === 'ms') return `${Math.round(v)}ms`
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`
  return String(Math.round(v))
}
</script>
