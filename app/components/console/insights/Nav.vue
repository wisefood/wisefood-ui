<template>
  <nav
    class="mb-6 flex flex-wrap items-center gap-1 border-b border-gray-200/70 pb-3 dark:border-white/10"
    aria-label="Analytics sections"
  >
    <UButton
      to="/console/insights"
      :color="isOverview ? 'primary' : 'neutral'"
      :variant="isOverview ? 'soft' : 'ghost'"
      size="sm"
      icon="i-lucide-layout-dashboard"
    >
      Overview
    </UButton>

    <span class="mx-1 h-4 w-px bg-gray-200 dark:bg-white/10" />

    <UDropdownMenu
      v-for="group in INSIGHTS_NAV"
      :key="group.title"
      :items="[menuItems(group)]"
      :popper="{ placement: 'bottom-start' }"
    >
      <UButton
        :color="isActiveGroup(group) ? 'primary' : 'neutral'"
        :variant="isActiveGroup(group) ? 'soft' : 'ghost'"
        size="sm"
        :icon="group.icon"
        trailing-icon="i-lucide-chevron-down"
      >
        {{ group.title }}
      </UButton>
    </UDropdownMenu>

    <!--
      How old the numbers are, and a way to get newer ones — on every page.
      The recorder flushes on a two-second interval behind a thirty-second
      cache, so the console is always a little behind; a page that never said
      so left the reader to wonder whether a missing event was lost or late.
    -->
    <div
      v-if="loadedAt !== undefined"
      class="ml-auto flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
    >
      <span
        v-if="loadedAt"
        aria-live="polite"
      >as of {{ formatTime(loadedAt) }}</span>
      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-lucide-refresh-cw"
        :loading="refreshing"
        aria-label="Refresh this page's data"
        @click="$emit('refresh')"
      >
        Refresh
      </UButton>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { INSIGHTS_NAV, type InsightsGroup } from '~/utils/insightsNav'

/*
 * The console's section menu, on every analytics page.
 *
 * Before this the only way to reach a page was the index, and the index listed
 * them below the charts — so moving between two reports meant going back and
 * scrolling past a dashboard to find a button. Fourteen pages reachable only
 * from one scroll position is not navigation.
 *
 * Grouped dropdowns rather than fourteen tabs: tabs would wrap onto three
 * lines and cost more vertical space than the content they sit above, and the
 * grouping is what makes an unfamiliar page findable — you know whether you
 * want speed or spend before you know which page is called what.
 */
/*
 * `loadedAt` is optional and tri-state on purpose: `undefined` means the page
 * has not adopted freshness reporting and the control is hidden; `null` means
 * it has but nothing has loaded yet; a Date is the real thing.
 */
withDefaults(defineProps<{
  loadedAt?: Date | null
  refreshing?: boolean
}>(), { loadedAt: undefined, refreshing: false })

defineEmits<{ refresh: [] }>()

const formatTime = (when: Date) =>
  when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })

const route = useRoute()

const isOverview = computed(() => route.path === '/console/insights')

const isActiveGroup = (group: InsightsGroup) =>
  group.links.some(link => route.path.startsWith(link.to))

function menuItems(group: InsightsGroup) {
  return group.links.map(link => ({
    label: link.label,
    icon: link.icon,
    to: link.to,
    // The description is what tells someone which page answers their question
    // without opening three of them.
    description: link.hint
  }))
}
</script>
