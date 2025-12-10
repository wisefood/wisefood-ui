<template>
  <NuxtLink
    :to="`/foodscholar/${props.article.id}`"
    :class="[{ 'scroll-fade-in': props.fade !== false }, 'group p-6 rounded-2xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer']"
    :style="{ '--delay': `${props.index * 0.1}s` }"
  >
    <div class="flex items-start justify-between mb-3">
      <span class="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
        {{ props.article.category }}
      </span>
      <span class="text-xs text-gray-500 dark:text-gray-400">{{ props.article.readTime }} min read</span>
    </div>

    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
      {{ props.article.title }}
    </h3>

    <p class="text-gray-600 dark:text-gray-300 font-light leading-relaxed mb-4">
      {{ props.article.excerpt }}
    </p>

    <!-- Reactions and Citations -->
    <div class="flex items-center gap-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
      <div class="flex items-center gap-1">
        <UIcon name="i-lucide-thumbs-up" class="w-3.5 h-3.5" />
        <span>{{ props.article.reactions?.helpful || 0 }}</span>
      </div>
      <div class="flex items-center gap-1">
        <UIcon name="i-lucide-lightbulb" class="w-3.5 h-3.5" />
        <span>{{ props.article.reactions?.insightful || 0 }}</span>
      </div>
      <div class="flex items-center gap-1">
        <UIcon name="i-lucide-star" class="w-3.5 h-3.5" />
        <span>{{ props.article.reactions?.interesting || 0 }}</span>
      </div>
      <div class="flex items-center gap-1 ml-auto">
        <UIcon name="i-lucide-quote" class="w-3.5 h-3.5" />
        <span>{{ props.article.citations || 0 }} citations</span>
      </div>
    </div>

    <div class="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-medium text-sm">
      Read Article
      <UIcon name="i-lucide-arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
interface Article {
  id: number
  title: string
  category: string
  excerpt: string
  readTime: number
  reactions?: {
    helpful: number
    insightful: number
    interesting: number
  }
  citations?: number
}

interface Props {
  article: Article
  index?: number
  fade?: boolean
}

// Provide defaults: index = 0, fade = true
const props = withDefaults(defineProps<Props>(), { index: 0, fade: true })
</script>
