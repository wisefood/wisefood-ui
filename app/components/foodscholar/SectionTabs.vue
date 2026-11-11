<template>
  <!-- FoodScholar's sections, Ask and Library, switched in place. -->
  <div class="border-b border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 flex justify-center">
      <nav
        class="flex gap-0"
        :aria-label="t('dashboard.apps.foodScholar.title')"
      >
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="tabClass(tab.id)"
          :aria-current="active === tab.id ? 'page' : undefined"
          :data-flows="tab.flows"
          @click="emit('select', tab.id)"
        >
          <span class="flex items-center gap-1.5">
            <UIcon
              :name="tab.icon"
              class="w-3.5 h-3.5"
            />
            {{ tab.label }}
          </span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type SectionId = 'qa' | 'resources'

const props = defineProps<{
  active: SectionId
}>()

const emit = defineEmits<{
  select: [id: SectionId]
}>()

const { t } = useI18n()

const tabs = computed(() => [
  { id: 'qa' as const, label: t('foodScholarHome.qa.tabs.askQuestions'), icon: 'i-lucide-sparkles', flows: 'foodscholar-tab-ask' },
  { id: 'resources' as const, label: t('foodScholarHome.qa.tabs.library'), icon: 'i-lucide-library', flows: 'foodscholar-tab-library' }
])

function tabClass(id: SectionId): string {
  return [
    'px-4 sm:px-5 py-3 text-sm font-medium border-b-2 transition-colors',
    props.active === id
      ? 'border-brand-500 text-brand-600 dark:text-brand-400'
      : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
  ].join(' ')
}
</script>
