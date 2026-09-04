<template>
  <UCard
    :ui="{ body: 'p-0' }"
    class="overflow-hidden border"
    :class="items.length
      ? 'border-amber-300/70 dark:border-amber-500/30'
      : 'border-gray-200/70 dark:border-white/10'"
  >
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
      :class="items.length
        ? 'border-amber-200/70 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/10'
        : 'border-gray-200/70 dark:border-white/10'"
    >
      <div class="min-w-0">
        <h3 class="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
          <UIcon
            name="i-lucide-hand"
            class="h-4 w-4"
            :class="items.length ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'"
          />
          Where they got stuck
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Clicking the same thing over and over, and clicking things that do nothing.
        </p>
      </div>
      <span
        v-if="items.length"
        class="shrink-0 text-xs font-medium text-amber-700 dark:text-amber-400"
      >
        {{ totalClicks.toLocaleString() }} click{{ totalClicks === 1 ? '' : 's' }} in {{ items.length }} place{{ items.length === 1 ? '' : 's' }}
      </span>
    </div>

    <ConsoleInsightsEmptyState
      v-if="!items.length"
      title="Nothing in this session looked like frustration."
      hint="Rage and dead clicks are recorded on every page that reports interactions. None here means none happened — unless interaction capture is off for this product, in which case the heatmaps page is empty too."
      icon="i-lucide-mouse-pointer-click"
    />

    <ul
      v-else
      class="divide-y divide-gray-100 dark:divide-zinc-800"
    >
      <li
        v-for="(row, index) in items"
        :key="index"
        class="flex flex-wrap items-start gap-x-3 gap-y-1 px-5 py-3"
      >
        <UBadge
          :color="row.kind === 'rage' ? 'error' : 'warning'"
          variant="subtle"
          size="sm"
          class="shrink-0"
          :title="row.kind === 'rage'
            ? 'clicked repeatedly in the same spot — the control did not respond fast enough, or at all'
            : 'clicked something that was never going to do anything'"
        >
          {{ row.kind === 'rage' ? 'rage clicks' : row.kind === 'dead' ? 'dead clicks' : row.kind }}
        </UBadge>

        <div class="min-w-0 flex-1">
          <NuxtLink
            :to="`/console/insights/heatmaps?path=${encodeURIComponent(row.path)}`"
            class="break-all font-mono text-xs text-brand-600 hover:underline dark:text-brand-300"
          >
            {{ row.path }}
          </NuxtLink>
          <!-- Element keys are generated selectors and can be very long, so
               they get their own scrolling line rather than widening the page. -->
          <p
            v-if="row.element_key"
            class="mt-0.5 overflow-x-auto whitespace-nowrap font-mono text-xs text-gray-400 dark:text-gray-500"
          >
            {{ row.element_key }}
          </p>
          <p
            v-else
            class="mt-0.5 text-xs italic text-gray-400 dark:text-gray-500"
          >
            no element identified — the click landed on the page itself
          </p>
        </div>

        <span class="shrink-0 font-mono text-sm tabular-nums text-gray-900 dark:text-white">
          {{ row.clicks.toLocaleString() }}×
        </span>
      </li>
    </ul>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Rage and dead clicks in one session.
 *
 * This is the most actionable thing on the page and it sits high up for that
 * reason. Everything else here says what somebody did; this says where the
 * product failed them, in a specific place, with a selector precise enough to
 * open the file. A run of rage clicks on one control is a bug report that
 * nobody had to file.
 */
type FrustrationRow = {
  kind: string
  path: string
  element_key: string | null
  clicks: number
}

const props = defineProps<{ items: FrustrationRow[] }>()

const totalClicks = computed(() => props.items.reduce((sum, row) => sum + (row.clicks || 0), 0))
</script>
