<template>
  <UCard
    :ui="{ body: 'p-5' }"
    class="border border-gray-200/70 dark:border-white/10"
  >
    <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">
      Editorial review pipeline
    </h3>
    <div class="space-y-3">
      <div
        v-for="stage in stages"
        :key="stage.key"
      >
        <div class="mb-1 flex items-center justify-between text-sm">
          <span class="text-gray-600 dark:text-gray-300">{{ stage.label }}</span>
          <span class="font-medium text-gray-900 dark:text-white">{{ stage.count }}</span>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
          <div
            class="h-full rounded-full"
            :class="stage.barClass"
            :style="{ width: `${stage.pct}%` }"
          />
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogStats } from '~/services/catalogApi'

const props = defineProps<{ stats: CatalogStats | null }>()

const ORDER: Array<{ key: string, label: string, barClass: string }> = [
  { key: 'unreviewed', label: 'Unreviewed', barClass: 'bg-gray-400' },
  { key: 'pending_review', label: 'Pending review', barClass: 'bg-amber-400' },
  { key: 'in_review', label: 'In review', barClass: 'bg-blue-400' },
  { key: 'changes_requested', label: 'Changes requested', barClass: 'bg-orange-400' },
  { key: 'verified', label: 'Verified', barClass: 'bg-emerald-500' },
  { key: 'rejected', label: 'Rejected', barClass: 'bg-rose-400' }
]

const totals = computed<Record<string, number>>(() => {
  const acc: Record<string, number> = {}
  for (const e of props.stats?.entities ?? []) {
    for (const [k, v] of Object.entries(e.reviewStatus)) acc[k] = (acc[k] ?? 0) + v
  }
  return acc
})

const stages = computed(() => {
  const max = Math.max(1, ...ORDER.map(o => totals.value[o.key] ?? 0))
  return ORDER.map((o) => {
    const count = totals.value[o.key] ?? 0
    return { ...o, count, pct: Math.round((count / max) * 100) }
  })
})
</script>
