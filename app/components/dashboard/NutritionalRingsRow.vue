<!-- Row of three RingStat items for macros -->
<script setup lang="ts">
const props = defineProps<{
  rings: Array<{
    id: string
    label: string
    percent: number
    value: string
  }>
}>()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold font-display text-gray-900 dark:text-white">
          Nutritional Balance
        </h2>
        <UBadge color="primary" variant="subtle">
          Today
        </UBadge>
      </div>
    </template>

    <div class="grid grid-cols-3 gap-4 py-4">
      <DashboardRingStat
        v-for="ring in rings"
        :key="ring.id"
        :id="ring.id"
        :label="ring.label"
        :percent="ring.percent"
        :value="ring.value"
      />
    </div>
  </UCard>
</template>
