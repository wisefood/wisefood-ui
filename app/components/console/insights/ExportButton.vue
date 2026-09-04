<template>
  <UButton
    :to="href"
    external
    download
    color="neutral"
    variant="outline"
    size="xs"
    icon="i-lucide-download"
  >
    {{ label }}
  </UButton>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import insightsApi from '~/services/insightsApi'

/*
 * A report as a spreadsheet.
 *
 * The evaluation work this console exists to support happens in spreadsheets
 * and notebooks; a table that can only be read on screen is where the workflow
 * stops. A plain link rather than a fetch-and-blob, so the browser's own
 * download handling does the work and a large export never passes through
 * JavaScript memory.
 */
const props = withDefaults(defineProps<{
  report: string
  days?: number
  limit?: number
  label?: string
}>(), {
  days: 30,
  limit: 1000,
  label: 'Export CSV'
})

const href = computed(() => insightsApi.exportUrl(props.report, props.days, props.limit))
</script>
