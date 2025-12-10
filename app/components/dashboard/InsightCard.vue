<template>
  <UCard>
    <div class="flex items-start gap-4">
      <div
        v-if="icon"
        :class="[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          iconBackgroundClass
        ]"
      >
        <UIcon :name="icon" :class="['h-5 w-5', iconColorClass]" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <h4 class="font-semibold text-gray-900 dark:text-white">
            {{ title }}
          </h4>
          <UBadge v-if="badge" size="xs" :color="badge.color" variant="subtle">
            {{ badge.text }}
          </UBadge>
        </div>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ description }}
        </p>
        <div v-if="link" class="mt-3">
          <UButton
            :to="link.to"
            variant="link"
            color="primary"
            trailing-icon="i-lucide-arrow-right"
            :padded="false"
            size="sm"
          >
            {{ link.text }}
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Badge {
  text: string
  color?: string
}

interface Link {
  text: string
  to: string
}

interface Props {
  title: string
  description: string
  icon?: string
  iconColorClass?: string
  iconBackgroundClass?: string
  badge?: Badge
  link?: Link
}

withDefaults(defineProps<Props>(), {
  iconColorClass: 'text-primary-600 dark:text-primary-400',
  iconBackgroundClass: 'bg-primary-100 dark:bg-primary-900/20'
})
</script>
