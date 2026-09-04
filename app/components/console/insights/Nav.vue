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
