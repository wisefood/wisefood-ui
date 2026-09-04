<template>
  <div
    class="h-48 w-full"
    role="img"
    :aria-label="summary"
  >
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
          <td>{{ row.value }}</td>
        </tr>
      </tbody>
    </table>
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
  color: '',
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
