<template>
  <UCard
    :ui="{
      body: { padding: 'p-0' },
      ring: 'ring-1 ring-gray-200 dark:ring-gray-800 hover:ring-primary-500 dark:hover:ring-primary-500'
    }"
    class="cursor-pointer transition-all hover:shadow-lg"
    @click="handleClick"
  >
    <div class="p-5">
      <div class="flex items-center gap-4">
        <div
          :class="[
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
            backgroundClass
          ]"
        >
          <UIcon :name="icon" :class="['h-6 w-6', iconColorClass]" />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ title }}
          </h3>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {{ description }}
          </p>
        </div>
        <UIcon
          name="i-lucide-arrow-right"
          class="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0"
        />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description: string
  icon: string
  iconColorClass?: string
  backgroundClass?: string
  to?: string
  action?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  iconColorClass: 'text-primary-600 dark:text-primary-400',
  backgroundClass: 'bg-primary-100 dark:bg-primary-900/20'
})

const handleClick = () => {
  if (props.to) {
    navigateTo(props.to)
  } else if (props.action) {
    props.action()
  }
}
</script>
