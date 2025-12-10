<!-- Image-first recipe card with badges and save toggle -->
<script setup lang="ts">
import { MICROCOPY } from '@/utils/constants'

const props = defineProps<{
  id: number
  title: string
  thumb: string
  healthy: boolean
  sustainable: boolean
}>()

const STORAGE_KEY = 'wisefood-saved-recipes'

const isSaved = ref(false)

onMounted(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY)
    const savedIds = saved ? JSON.parse(saved) : []
    isSaved.value = savedIds.includes(props.id)
  }
})

const toggleSave = () => {
  if (typeof window === 'undefined') return

  const saved = localStorage.getItem(STORAGE_KEY)
  const savedIds = saved ? JSON.parse(saved) : []

  if (isSaved.value) {
    const filtered = savedIds.filter((id: number) => id !== props.id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    isSaved.value = false
  } else {
    savedIds.push(props.id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds))
    isSaved.value = true
  }
}
</script>

<template>
  <div class="flex-shrink-0 w-64 snap-start">
    <UCard class="overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div class="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <img
          :src="thumb"
          :alt="title"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <button
          :aria-label="isSaved ? MICROCOPY.accessibility.unsaveRecipe : MICROCOPY.accessibility.saveRecipe"
          class="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 transition-all duration-200 hover:scale-110"
          @click="toggleSave"
        >
          <UIcon
            :name="isSaved ? 'i-lucide-heart-filled' : 'i-lucide-heart'"
            :class="[
              'w-5 h-5',
              isSaved ? 'text-brand' : 'text-gray-600 dark:text-gray-400'
            ]"
          />
        </button>
      </div>

      <template #footer>
        <div class="space-y-3">
          <h3 class="font-semibold text-base text-gray-900 dark:text-white line-clamp-2">
            {{ title }}
          </h3>
          <div class="flex gap-2 flex-wrap">
            <UBadge v-if="healthy" color="green" variant="subtle" size="sm">
              Healthy
            </UBadge>
            <UBadge v-if="sustainable" color="emerald" variant="subtle" size="sm">
              Sustainable
            </UBadge>
          </div>
        </div>
      </template>
    </UCard>
  </div>
</template>
