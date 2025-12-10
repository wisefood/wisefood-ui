<template>
  <UCard :ui="{ body: { padding: 'p-0' } }">
    <div class="p-5 border-b border-gray-200 dark:border-gray-800">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ title }}
        </h3>
        <UBadge v-if="badge" :color="badge.color" variant="subtle">
          {{ badge.text }}
        </UBadge>
      </div>
      <p v-if="description" class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {{ description }}
      </p>
    </div>
    <div class="divide-y divide-gray-200 dark:divide-gray-800">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
        @click="() => item.onClick?.()"
      >
        <div class="flex items-start gap-3">
          <div v-if="item.image" class="shrink-0">
            <img
              :src="item.image"
              :alt="item.title"
              class="h-12 w-12 rounded-lg object-cover"
            />
          </div>
          <div v-else-if="item.icon" class="shrink-0">
            <div
              :class="[
                'flex h-12 w-12 items-center justify-center rounded-lg',
                item.iconBg || 'bg-gray-100 dark:bg-gray-800'
              ]"
            >
              <UIcon :name="item.icon" class="h-6 w-6" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <h4 class="font-medium text-gray-900 dark:text-white line-clamp-1">
                {{ item.title }}
              </h4>
              <UBadge v-if="item.badge" size="xs" :color="item.badge.color" variant="subtle">
                {{ item.badge.text }}
              </UBadge>
            </div>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {{ item.description }}
            </p>
            <div v-if="item.meta" class="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
              <span v-for="(metaItem, metaIndex) in item.meta" :key="metaIndex" class="flex items-center gap-1">
                <UIcon v-if="metaItem.icon" :name="metaItem.icon" class="h-3.5 w-3.5" />
                {{ metaItem.text }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showViewAll" class="p-4 border-t border-gray-200 dark:border-gray-800">
      <UButton
        variant="ghost"
        color="gray"
        block
        trailing-icon="i-lucide-arrow-right"
        @click="onViewAll"
      >
        View All
      </UButton>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Badge {
  text: string
  color?: string
}

interface Meta {
  icon?: string
  text: string
}

interface TrendingItem {
  title: string
  description: string
  image?: string
  icon?: string
  iconBg?: string
  badge?: Badge
  meta?: Meta[]
  onClick?: () => void
}

interface Props {
  title: string
  description?: string
  badge?: Badge
  items: TrendingItem[]
  showViewAll?: boolean
  onViewAll?: () => void
}

withDefaults(defineProps<Props>(), {
  showViewAll: false
})
</script>
