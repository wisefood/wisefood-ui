<template>
  <UCard
    :ui="{ body: 'p-0' }"
    class="overflow-hidden border border-gray-200/70 dark:border-white/10"
  >
    <div class="border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">
        Recent traces
      </h3>
    </div>
    <div
      v-if="!enabled"
      class="px-5 py-6 text-sm text-gray-500 dark:text-gray-400"
    >
      Observability is not configured.
    </div>
    <div
      v-else-if="!traces.length"
      class="px-5 py-6 text-sm text-gray-500 dark:text-gray-400"
    >
      No traces found.
    </div>
    <table
      v-else
      class="w-full text-sm"
    >
      <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-zinc-900/50 dark:text-gray-400">
        <tr>
          <th class="px-5 py-2 font-medium">
            Name
          </th>
          <th class="px-5 py-2 font-medium">
            When
          </th>
          <th class="px-5 py-2 text-right font-medium">
            Latency
          </th>
          <th class="px-5 py-2 text-right font-medium">
            Cost
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(t, i) in traces"
          :key="t.id ?? i"
          class="border-t border-gray-100 dark:border-zinc-800"
        >
          <td class="px-5 py-2 text-gray-900 dark:text-white">
            {{ t.name ?? '—' }}
          </td>
          <td class="px-5 py-2 font-mono text-xs tabular-nums text-gray-500 dark:text-gray-400">
            {{ formatWhen(t.timestamp) }}
          </td>
          <td class="px-5 py-2 text-right tabular-nums">
            {{ t.latency != null ? `${Math.round(Number(t.latency))}ms` : '—' }}
          </td>
          <td class="px-5 py-2 text-right tabular-nums">
            {{ t.totalCost != null ? `$${Number(t.totalCost).toFixed(4)}` : '—' }}
          </td>
        </tr>
      </tbody>
    </table>
  </UCard>
</template>

<script setup lang="ts">
import type { TraceRow } from '~/services/observabilityApi'

defineProps<{ traces: TraceRow[], enabled: boolean }>()

// Deterministic, locale-stable timestamp (YYYY-MM-DD HH:mm) so the column reads
// as a clean monospace data field rather than locale text like "12:52 π.μ.".
const pad = (n: number): string => String(n).padStart(2, '0')

const formatWhen = (ts?: string): string => {
  if (!ts) return '—'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>
