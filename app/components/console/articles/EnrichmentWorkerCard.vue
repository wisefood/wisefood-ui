<template>
  <UCard
    :ui="{ body: 'p-5 sm:p-6', header: 'p-5 sm:p-6' }"
    class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
  >
    <template #header>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <UIcon
              name="i-lucide-sparkles"
              class="h-4 w-4 text-brand-500 dark:text-brand-300"
            />
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">
              FoodScholar Enrichment
            </h2>
            <UBadge
              :color="sweeperBadge.color"
              variant="soft"
            >
              {{ sweeperBadge.label }}
            </UBadge>
          </div>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The sweeper walks the whole catalog on its own. Pause it to take manual
            control — selective enrichment keeps working either way.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-refresh-cw"
            :loading="workerLoading"
            @click="$emit('refresh')"
          >
            Refresh
          </UButton>

          <UButton
            v-if="sweeperPaused"
            color="primary"
            size="sm"
            icon="i-lucide-play"
            :loading="pausePending"
            :disabled="!sweeperEnabled"
            @click="$emit('resume')"
          >
            Resume sweeper
          </UButton>
          <UButton
            v-else
            color="warning"
            variant="soft"
            size="sm"
            icon="i-lucide-pause"
            :loading="pausePending"
            :disabled="!sweeperEnabled"
            @click="$emit('pause')"
          >
            Pause sweeper
          </UButton>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <UAlert
        v-if="!sweeperEnabled"
        color="neutral"
        variant="soft"
        icon="i-lucide-power-off"
        title="Sweeper disabled on the API"
        description="ENABLE_BACKGROUND_WORKER is off, so no automatic pass runs. Selective enrichment below still works."
      />

      <UAlert
        v-else-if="sweeperPaused"
        color="warning"
        variant="soft"
        icon="i-lucide-pause"
        title="Automatic enrichment is paused"
        description="No articles are being swept. Queue individual articles below, then resume when you are done."
      />

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="tile in tiles"
          :key="tile.label"
          class="rounded-xl border border-gray-200/80 bg-gray-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/5"
        >
          <p class="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
            {{ tile.label }}
          </p>
          <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
            {{ tile.value }}
          </p>
          <p
            v-if="tile.hint"
            class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400"
          >
            {{ tile.hint }}
          </p>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EnrichmentWorkerStatus } from '~/services/foodscholarEnrichmentApi'
import { formatWorkerUptime } from '~/utils/consoleEnrichment'

const props = defineProps<{
  status: EnrichmentWorkerStatus | null
  workerLoading?: boolean
  pausePending?: boolean
}>()

defineEmits<{
  refresh: []
  pause: []
  resume: []
}>()

const sweeper = computed(() => props.status?.sweeper)
const jobs = computed(() => props.status?.jobs)

const sweeperEnabled = computed(() => Boolean(sweeper.value?.enabled))
const sweeperPaused = computed(() => Boolean(sweeper.value?.paused))

const sweeperBadge = computed(() => {
  if (!props.status) return { label: 'Unknown', color: 'neutral' as const }
  if (!sweeperEnabled.value) return { label: 'Sweeper disabled', color: 'neutral' as const }
  if (sweeperPaused.value) return { label: 'Sweeper paused', color: 'warning' as const }
  if (sweeper.value?.running) return { label: 'Sweeper running', color: 'success' as const }
  return { label: 'Sweeper stopped', color: 'neutral' as const }
})

function formatCount(value: number | null | undefined) {
  return typeof value === 'number' ? value.toLocaleString() : '—'
}

const tiles = computed(() => [
  {
    label: 'Swept',
    value: formatCount(sweeper.value?.processed),
    hint: sweeper.value?.cursor != null ? `Cursor at ${sweeper.value.cursor}` : undefined
  },
  {
    label: 'Sweep failures',
    value: formatCount(sweeper.value?.failed),
    hint: formatCount(sweeper.value?.skipped) === '—' ? undefined : `${formatCount(sweeper.value?.skipped)} skipped`
  },
  {
    label: 'Queued jobs',
    value: formatCount(jobs.value?.pending_jobs),
    hint: jobs.value?.running ? 'On-demand worker running' : 'On-demand worker idle'
  },
  {
    label: 'On-demand runs',
    value: formatCount(jobs.value?.processed),
    hint: `Up ${formatWorkerUptime(jobs.value?.uptime_seconds)}`
  }
])
</script>
