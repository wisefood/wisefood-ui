<template>
  <UCard
    :ui="{ body: 'p-5' }"
    class="border border-gray-200/70 dark:border-white/10"
  >
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">
        {{ title }}
      </h3>
      <UBadge
        v-if="!enabled"
        color="neutral"
        variant="outline"
        size="sm"
      >
        Not configured
      </UBadge>
    </div>
    <p
      v-if="!enabled"
      class="text-sm text-gray-500 dark:text-gray-400"
    >
      Observability is not configured. Set Langfuse keys on the API to populate this panel.
    </p>
    <p
      v-else-if="!rows.length"
      class="text-sm text-gray-500 dark:text-gray-400"
    >
      No data in range.
    </p>
    <div
      v-else
      class="flex h-32 items-end gap-1"
    >
      <div
        v-for="(row, i) in rows"
        :key="`${row.label}-${i}`"
        class="flex-1 rounded-t bg-brand-400 transition-all dark:bg-brand-500"
        :style="{ height: `${barPct(row.value)}%` }"
        :title="`${row.label}: ${row.value}`"
      />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MetricRow } from '~/services/observabilityApi'

const props = defineProps<{ title: string, rows: MetricRow[], enabled: boolean }>()

const max = computed(() => Math.max(1, ...props.rows.map(r => r.value)))
const barPct = (v: number) => Math.max(2, Math.round((v / max.value) * 100))
</script>
