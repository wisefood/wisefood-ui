<template>
  <NuxtLink
    :to="`/foodscholar/textbooks/${props.textbook.urn}`"
    :class="[{ 'scroll-fade-in': props.fade !== false }, 'group flex flex-col p-5 rounded-2xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer h-full']"
    :style="{ '--delay': `${props.index * 0.1}s` }"
  >
    <!-- Header: visibility / review badge -->
    <div class="flex items-start justify-between mb-2">
      <span v-if="props.textbook.topics && props.textbook.topics.length" class="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider truncate max-w-[70%]">
        {{ props.textbook.topics[0] }}
      </span>
      <span v-else class="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
        Textbook
      </span>
      <span v-if="props.textbook.review_status === 'verified'" class="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 dark:text-green-400">
        <UIcon name="i-lucide-shield-check" class="w-3 h-3" />
        Verified
      </span>
    </div>

    <!-- Topic pills -->
    <div v-if="displayTopics.length" class="mb-2 flex flex-wrap gap-1">
      <span
        v-for="topic in displayTopics"
        :key="topic"
        class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
      >
        <UIcon name="i-lucide-compass" class="w-3 h-3" />
        {{ topic }}
      </span>
    </div>

    <!-- Title -->
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2">
      {{ props.textbook.title }}
    </h3>

    <!-- Subtitle -->
    <p v-if="props.textbook.subtitle" class="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-1 italic">
      {{ props.textbook.subtitle }}
    </p>

    <!-- Authors / publication info -->
    <div class="flex flex-wrap items-center gap-2 mb-2.5 text-xs text-gray-600 dark:text-gray-400">
      <div v-if="props.textbook.authors && props.textbook.authors.length" class="flex items-center gap-1">
        <UIcon name="i-lucide-user" class="w-3.5 h-3.5" />
        <span class="truncate max-w-[200px]">{{ formatAuthors(props.textbook.authors) }}</span>
      </div>
      <span v-if="props.textbook.publication_year" class="flex items-center gap-1">
        <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5" />
        {{ props.textbook.publication_year }}
      </span>
      <span v-if="props.textbook.publisher" class="flex items-center gap-1 truncate">
        <UIcon name="i-lucide-building-2" class="w-3.5 h-3.5" />
        <span class="truncate max-w-[120px]">{{ props.textbook.publisher }}</span>
      </span>
      <span v-if="props.textbook.edition" class="flex items-center gap-1">
        <UIcon name="i-lucide-layers" class="w-3.5 h-3.5" />
        {{ props.textbook.edition }}
      </span>
    </div>

    <!-- Description excerpt -->
    <p class="text-gray-600 dark:text-gray-300 font-light leading-relaxed mb-3 line-clamp-2 grow">
      {{ props.textbook.description || '' }}
    </p>

    <!-- Tags -->
    <div v-if="displayTags.length" class="flex flex-wrap gap-1.5 mb-3">
      <span
        v-for="tag in displayTags"
        :key="tag"
        class="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300"
      >
        {{ tag }}
      </span>
    </div>

    <!-- Footer CTA -->
    <div class="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-medium text-sm mt-auto">
      View Textbook
      <UIcon name="i-lucide-arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Textbook } from '~/services/textbooksApi'

interface Props {
  textbook: Textbook
  index?: number
  fade?: boolean
}

const props = withDefaults(defineProps<Props>(), { index: 0, fade: true })

const formatAuthors = (authors: string[]): string => {
  if (!authors.length) return 'Unknown author'
  if (authors.length === 1) return authors[0]
  if (authors.length === 2) return `${authors[0]} and ${authors[1]}`
  return `${authors[0]} et al.`
}

const displayTopics = computed(() =>
  (props.textbook.topics || []).filter(t => typeof t === 'string' && t.trim()).slice(0, 2)
)

const displayTags = computed(() => {
  const all = [...(props.textbook.tags || []), ...(props.textbook.keywords || [])]
  return [...new Set(all)].slice(0, 4)
})
</script>
