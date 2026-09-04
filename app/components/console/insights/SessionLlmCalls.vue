<template>
  <ConsoleInsightsTablePanel
    title="Model calls"
    subtitle="Every call this session made. Sort by cost to find what the total is made of."
    :rows="calls"
    :columns="columns"
    empty="No model calls in this session."
    empty-hint="Browsing, searching and reading cost nothing to serve — a session with no answers or plans in it makes no calls."
    empty-icon="i-lucide-cpu"
  >
    <template #cell-model="{ row }">
      <span class="font-mono text-xs break-all">{{ row.model || 'unnamed' }}</span>
    </template>
    <template #cell-feature="{ row }">
      <span class="text-xs text-gray-600 dark:text-gray-300">{{ row.feature || row.app || '—' }}</span>
    </template>
    <template #cell-cost_usd="{ row }">
      <!-- A model with no rate on file costs an unknown amount, not nothing.
           Rendering it as $0.00 would understate the total and hide the fact
           that a rate needs adding. -->
      <span
        v-if="row.cost_usd === null || row.cost_usd === undefined"
        class="text-xs italic text-gray-400 dark:text-gray-500"
        title="no price is on file for this model, so the call is not costed"
      >unpriced</span>
      <span v-else>${{ Number(row.cost_usd).toFixed(4) }}</span>
    </template>
    <template #cell-latency_ms="{ row }">
      <span
        v-if="row.latency_ms === null || row.latency_ms === undefined"
        class="text-gray-400 dark:text-gray-500"
      >—</span>
      <span
        v-else
        :class="Number(row.latency_ms) > 5000 ? 'text-amber-600 dark:text-amber-400' : ''"
      >{{ Number(row.latency_ms).toLocaleString() }}ms</span>
    </template>
  </ConsoleInsightsTablePanel>
</template>

<script setup lang="ts">
/**
 * The individual model calls behind a session's total.
 *
 * A session that cost more than the others is only actionable once you can see
 * which call did it — one long answer, or forty small retries, are the same
 * number and completely different problems. The rows arrived in the session
 * response from the start and only the total was ever shown.
 */
type LlmCall = {
  occurred_at: string | null
  app: string | null
  feature: string | null
  model: string | null
  input_tokens: number | null
  output_tokens: number | null
  total_tokens: number | null
  cost_usd: number | null
  latency_ms: number | null
  trace_id: string | null
}

defineProps<{ calls: LlmCall[] }>()

const columns = [
  { key: 'model', label: 'Model' },
  { key: 'feature', label: 'What for' },
  { key: 'input_tokens', label: 'In', align: 'right' as const },
  { key: 'output_tokens', label: 'Out', align: 'right' as const },
  { key: 'cost_usd', label: 'Cost', align: 'right' as const },
  { key: 'latency_ms', label: 'Took', align: 'right' as const }
]
</script>
