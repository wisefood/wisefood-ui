<template>
  <NuxtLink
    :to="`/foodscholar/${props.article.urn}`"
    :class="[{ 'scroll-fade-in': props.fade !== false }, 'group flex flex-col p-6 rounded-2xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full']"
    :style="{ '--delay': `${props.index * 0.1}s` }"
  >
    <!-- Header: Category and Read Time -->
    <div class="flex items-start justify-between mb-3">
      <span class="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
        {{ props.article.ai_category }}
      </span>
      <span class="text-xs text-gray-500 dark:text-gray-400">{{ props.article.readTime }} min read</span>
    </div>

    <!-- Title -->
    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2">
      {{ props.article.title }}
    </h3>

    <!-- Authors and Publication Info -->
    <div class="flex flex-wrap items-center gap-2 mb-3 text-xs text-gray-600 dark:text-gray-400">
      <div v-if="props.article.authors && props.article.authors.length > 0" class="flex items-center gap-1">
        <UIcon name="i-lucide-user" class="w-3.5 h-3.5" />
        <span class="truncate max-w-[200px]">{{ formatAuthors(props.article.authors) }}</span>
      </div>
      <span v-if="props.article.publication_year" class="flex items-center gap-1">
        <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5" />
        {{ props.article.publication_year.split('-')[0] }}
      </span>
      <span v-if="props.article.venue" class="flex items-center gap-1 truncate">
        <UIcon name="i-lucide-book-open" class="w-3.5 h-3.5" />
        <span class="truncate">{{ props.article.venue }}</span>
      </span>
    </div>

    <!-- Abstract/Excerpt with truncation -->
    <p class="text-gray-600 dark:text-gray-300 font-light leading-relaxed mb-4 line-clamp-3 grow">
      {{ props.article.excerpt }}
    </p>

    <!-- Tags -->
    <div v-if="displayTags.length > 0" class="flex flex-wrap gap-1.5 mb-4">
      <span
        v-for="tag in displayTags"
        :key="tag"
        class="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300"
      >
        {{ tag }}
      </span>
    </div>

    <!-- Footer: Read Article Link -->
    <div class="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-medium text-sm mt-auto">
      Read Article
      <UIcon name="i-lucide-arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Article {
  id: number
  urn: string
  title: string
  category: string
  ai_category?: string | null
  excerpt: string
  readTime: number
  authors?: string[]
  tags?: string[]
  ai_tags?: string[]
  venue?: string | null
  publication_year?: string | null
}

interface Props {
  article: Article
  index?: number
  fade?: boolean
}

// Provide defaults: index = 0, fade = true
const props = withDefaults(defineProps<Props>(), { index: 0, fade: true })

// Format authors for display
const formatAuthors = (authors: string[]): string => {
  if (!authors || authors.length === 0) return 'Unknown Author'
  if (authors.length === 1) return authors[0]
  if (authors.length === 2) return `${authors[0]} and ${authors[1]}`
  return `${authors[0]} et al.`
}

// Combine and limit tags (prefer human tags, supplement with AI tags)
const displayTags = computed(() => {
  const humanTags = props.article.tags || []
  const aiTags = props.article.ai_tags || []

  // Prefer human tags, supplement with AI tags if needed
  const allTags = [...humanTags, ...aiTags]

  // Remove duplicates and limit to 5 tags
  const uniqueTags = [...new Set(allTags)]
  return uniqueTags.slice(0, 5)
})
</script>
