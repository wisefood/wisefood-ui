<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <!-- Header -->
    <div class="border-b border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-20">
      <div class="w-full px-4 sm:px-6 lg:px-8 py-6">
        <NuxtLink
          to="/foodscholar/catalog"
          class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
          <span class="text-sm font-medium">Back to Articles</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-24">
      <div class="text-center">
        <div class="w-16 h-16 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">Loading article...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-2xl mx-auto px-4 py-20">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
            <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Failed to load article</h3>
            <p class="text-red-700 dark:text-red-300">{{ error }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main v-else-if="article" class="w-full px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Article Content (Left 2/3) -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Article Header -->
          <div class="scroll-fade-in">
            <div class="flex items-center gap-3 mb-4">
              <UBadge color="primary" variant="subtle">{{ displayCategory }}</UBadge>
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ readTime }} min read</span>
            </div>

            <h1 class="text-4xl sm:text-5xl font-light text-gray-900 dark:text-white tracking-tight mb-4">
              {{ article.title }}
            </h1>

            <p v-if="article.abstract || article.description" class="text-xl text-gray-600 dark:text-gray-300 font-light leading-relaxed mb-6">
              {{ article.abstract || article.description }}
            </p>

            <!-- Publication Info -->
            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <div v-if="article.publication_year" class="flex items-center gap-2">
                <UIcon name="i-lucide-calendar" class="w-4 h-4" />
                <span>{{ article.publication_year.split('-')[0] }}</span>
              </div>
              <div v-if="article.venue" class="flex items-center gap-2">
                <UIcon name="i-lucide-book-open" class="w-4 h-4" />
                <span>{{ article.venue }}</span>
              </div>
              <div v-if="article.urn" class="flex items-center gap-2">
                <UIcon name="i-lucide-link" class="w-4 h-4" />
                <span class="text-xs font-mono">{{ article.urn }}</span>
              </div>
            </div>

            <!-- Authors -->
            <div v-if="article.authors && article.authors.length > 0" class="mb-4">
              <p class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Authors:</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(author, index) in article.authors"
                  :key="index"
                  class="px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300"
                >
                  {{ author }}
                </span>
              </div>
            </div>

            <!-- DOI Link -->
            <div v-if="article.doi" class="mb-4">
              <a
                :href="formatDoiUrl(article.doi)"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:underline"
              >
                <UIcon name="i-lucide-external-link" class="w-4 h-4" />
                <span>DOI: {{ article.doi }}</span>
              </a>
            </div>
          </div>

          <!-- Key Takeaways -->
          <div v-if="displayTakeaways.length > 0" class="scroll-fade-in p-6 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800" style="--delay: 0.1s">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-lightbulb" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
              Key Takeaways
              <span v-if="!article.key_takeaways || article.key_takeaways.length === 0" class="text-xs font-normal text-gray-500 dark:text-gray-400">(AI Generated)</span>
            </h2>
            <ul class="space-y-3">
              <li
                v-for="(takeaway, index) in displayTakeaways"
                :key="index"
                class="flex items-start gap-3 text-gray-700 dark:text-gray-300"
              >
                <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                <span class="font-light">{{ takeaway }}</span>
              </li>
            </ul>
          </div>

          <!-- Article Content -->
          <div v-if="article.content">
            <div class="p-8 rounded-2xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Full Article</h2>
              <div class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {{ article.content }}
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar (Right 1/3) -->
        <aside class="lg:col-span-1">
          <div class="sticky top-24 space-y-6">
            <!-- Tags -->
            <div v-if="displayTags.length > 0" class="scroll-fade-in p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700" style="--delay: 0.1s">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UIcon name="i-lucide-tags" class="w-5 h-5" />
                Tags
                <span v-if="!article.tags || article.tags.length === 0" class="text-xs font-normal text-gray-500 dark:text-gray-400">(AI)</span>
              </h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in displayTags"
                  :key="tag"
                  class="text-xs bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-3 py-1 rounded-full"
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <!-- Category Info -->
            <div class="scroll-fade-in p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700" style="--delay: 0.2s">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UIcon name="i-lucide-folder" class="w-5 h-5" />
                Category
              </h3>
              <div class="space-y-2">
                <div v-if="article.category" class="flex items-center gap-2">
                  <UBadge color="primary" variant="subtle">{{ article.category }}</UBadge>
                  <span class="text-xs text-gray-500 dark:text-gray-400">(Human Reviewed)</span>
                </div>
                <div v-if="article.ai_category && article.ai_category !== article.category" class="flex items-center gap-2">
                  <UBadge variant="subtle">{{ article.ai_category }}</UBadge>
                  <span class="text-xs text-gray-500 dark:text-gray-400">(AI Suggested)</span>
                </div>
              </div>
            </div>

            <!-- Additional Info -->
            <div class="scroll-fade-in p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700" style="--delay: 0.3s">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Article Info</h3>
              <div class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div v-if="article.language" class="flex items-center gap-2">
                  <UIcon name="i-lucide-globe" class="w-4 h-4" />
                  <span>Language: {{ article.language.toUpperCase() }}</span>
                </div>
                <div v-if="article.region" class="flex items-center gap-2">
                  <UIcon name="i-lucide-map-pin" class="w-4 h-4" />
                  <span>Region: {{ article.region }}</span>
                </div>
                <div v-if="article.external_id" class="flex items-center gap-2">
                  <UIcon name="i-lucide-database" class="w-4 h-4" />
                  <span class="font-mono text-xs">{{ article.external_id }}</span>
                </div>
              </div>
            </div>

            <!-- Share -->
            <div class="scroll-fade-in p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700" style="--delay: 0.4s">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Share Article</h3>
              <div class="flex gap-2">
                <UButton variant="outline" size="sm" icon="i-lucide-link" class="flex-1 cursor-pointer">
                  Copy Link
                </UButton>
                <UButton variant="outline" size="sm" icon="i-lucide-bookmark" class="cursor-pointer">
                  Save
                </UButton>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>

    <!-- Article Not Found -->
    <div v-else class="flex items-center justify-center py-20">
      <div class="text-center">
        <UIcon name="i-lucide-file-question" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Article Not Found</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">The article you're looking for doesn't exist.</p>
        <UButton to="/foodscholar/catalog" color="primary">
          Back to Articles
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useArticles } from '~/composables/useArticles'
import { calculateReadTime, formatDoiUrl } from '~/utils/articleHelpers'

definePageMeta({
  middleware: ['auth', 'profile']
})

const route = useRoute()
const urn = computed(() => route.params.id as string)

const { currentArticle: article, loading, error, fetchArticle } = useArticles()

// Computed properties
const displayCategory = computed(() => {
  if (!article.value) return ''
  return article.value.category || article.value.ai_category || 'Uncategorized'
})

const readTime = computed(() => {
  if (!article.value?.content) return 1
  return calculateReadTime(article.value.content)
})

const displayTakeaways = computed(() => {
  if (!article.value) return []
  const humanTakeaways = article.value.key_takeaways || []
  if (humanTakeaways.length > 0) return humanTakeaways
  return article.value.ai_key_takeaways || []
})

const displayTags = computed(() => {
  if (!article.value) return []
  const humanTags = article.value.tags || []
  const aiTags = article.value.ai_tags || []

  // Prefer human tags, supplement with AI tags
  const allTags = [...humanTags, ...aiTags]
  const uniqueTags = [...new Set(allTags)]
  return uniqueTags.slice(0, 10)
})

// Set page metadata
useHead({
  title: computed(() => article.value ? `${article.value.title} - FoodScholar` : 'Article - FoodScholar')
})

useSeoMeta({
  description: computed(() => article.value?.abstract || article.value?.description || 'Learn about nutrition and sustainable eating')
})

// Intersection Observer for animations
let observer: IntersectionObserver | null = null

// Load article and setup observer on mount
onMounted(async () => {
  // Fetch article
  await fetchArticle(urn.value)

  // Setup intersection observer for animations
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.1
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer?.unobserve(entry.target)
      }
    })
  }, observerOptions)

  // Wait for Vue to render the content, then observe
  await nextTick()
  setTimeout(() => {
    document.querySelectorAll('.scroll-fade-in').forEach((el) => {
      observer?.observe(el)
    })
  }, 200)
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.scroll-fade-in {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
  transition-delay: var(--delay, 0s);
}

.scroll-fade-in.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.prose {
  max-width: none;
}
</style>
