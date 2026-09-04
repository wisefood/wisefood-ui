<template>
  <div
    class="w-full"
    role="img"
    :aria-label="summary"
  >
    <!--
      The same numbers as a table, for anyone the picture is not for. A chart
      with no text alternative is an empty box to a screen reader; a table of
      the same series is the whole chart.
    -->
    <table
      v-if="data.length"
      class="sr-only"
    >
      <caption>{{ summary }}</caption>
      <tbody>
        <tr
          v-for="(row, i) in data"
          :key="i"
        >
          <th scope="row">
            {{ rowLabel(row) }}
          </th>
          <td>{{ valuePrefix }}{{ row.value }}</td>
        </tr>
      </tbody>
    </table>
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
  color: '',
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

/*
 * Colour comes from the theme when none is given, so a chart drawn in a card
 * matches the buttons beside it and follows the palette if the palette moves.
 * Read once, at setup: the custom property is stable for the life of the page.
 */
const themeColor = (): string => {
  if (typeof document === 'undefined') return '#a6b52b'
  const value = getComputedStyle(document.documentElement).getPropertyValue('--ui-primary').trim()
  return value || '#a6b52b'
}
const color = computed(() => props.color || themeColor())

const rowLabel = (row: { label?: string, bucket?: string }) => row.label ?? row.bucket ?? ''

/** One sentence for the accessible name: what the series is and its extent. */
const summary = computed(() => {
  if (!props.data.length) return 'No data in range'
  const values = props.data.map(d => d.value)
  const top = Math.max(...values)
  const first = rowLabel(props.data[0] as { label?: string, bucket?: string })
  const last = rowLabel(props.data[props.data.length - 1] as { label?: string, bucket?: string })
  return `${props.data.length} points from ${first} to ${last}, highest ${props.valuePrefix ?? ''}${top}`
})
</script>
