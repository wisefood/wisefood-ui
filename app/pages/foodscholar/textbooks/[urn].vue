<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <AppPageHeader
      back-to="/foodscholar/textbooks"
      back-label="Textbook Library"
      brand-title="FoodScholar"
      brand-class="text-brand-500 dark:text-brand-400"
      subtitle="Textbook"
    />

    <!-- Loading -->
    <div v-if="loading" class="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div class="animate-pulse space-y-6">
        <div class="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
        <div class="space-y-3">
          <div class="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
          <div class="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6" />
          <div class="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-4/6" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center">
      <UIcon name="i-lucide-alert-circle" class="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Failed to load textbook</h2>
      <p class="text-zinc-600 dark:text-zinc-400 mb-6">{{ error }}</p>
      <UButton color="primary" @click="loadTextbook">Try again</UButton>
    </div>

    <!-- Content -->
    <main v-else-if="textbook" class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

      <!-- Title & badges -->
      <div class="mb-8">
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <span v-if="textbook.review_status" :class="reviewBadgeClass(textbook.review_status)" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold">
            <UIcon v-if="textbook.review_status === 'verified'" name="i-lucide-shield-check" class="w-3 h-3" />
            {{ formatReviewStatus(textbook.review_status) }}
          </span>
          <span v-if="textbook.visibility === 'public'" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <UIcon name="i-lucide-globe" class="w-3 h-3" />
            Public
          </span>
          <span v-if="textbook.status" :class="statusBadgeClass(textbook.status)" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold">
            {{ textbook.status.charAt(0).toUpperCase() + textbook.status.slice(1) }}
          </span>
        </div>

        <h1 class="text-3xl sm:text-4xl font-serif font-bold text-zinc-900 dark:text-white mb-2">
          {{ textbook.title }}
        </h1>
        <p v-if="textbook.subtitle" class="text-xl text-zinc-500 dark:text-zinc-400 italic mb-4">
          {{ textbook.subtitle }}
        </p>

        <!-- Quick meta row -->
        <div class="flex flex-wrap gap-3">
          <div v-if="textbook.authors.length" class="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 rounded-xl">
            <UIcon name="i-lucide-user" class="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span class="text-sm text-zinc-700 dark:text-zinc-300">{{ formatAuthors(textbook.authors) }}</span>
          </div>
          <div v-if="textbook.publication_year" class="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 rounded-xl">
            <UIcon name="i-lucide-calendar" class="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span class="text-sm text-zinc-700 dark:text-zinc-300">{{ textbook.publication_year }}</span>
          </div>
          <div v-if="textbook.publisher" class="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 rounded-xl">
            <UIcon name="i-lucide-building-2" class="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span class="text-sm text-zinc-700 dark:text-zinc-300">{{ textbook.publisher }}</span>
          </div>
          <div v-if="textbook.language" class="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 rounded-xl">
            <UIcon name="i-lucide-languages" class="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span class="text-sm text-zinc-700 dark:text-zinc-300 uppercase">{{ textbook.language }}</span>
          </div>
          <div v-if="textbook.page_count" class="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 rounded-xl">
            <UIcon name="i-lucide-book-open" class="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span class="text-sm text-zinc-700 dark:text-zinc-300">{{ textbook.page_count }} pages</span>
          </div>
          <a
            v-if="textbook.url"
            :href="textbook.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-brand-400 dark:hover:border-brand-500 px-3 py-2 rounded-xl transition-colors"
          >
            <UIcon name="i-lucide-external-link" class="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span class="text-sm font-medium text-brand-700 dark:text-brand-300">Open URL</span>
          </a>
        </div>
      </div>

      <!-- Two-column layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Main column -->
        <div class="lg:col-span-2 space-y-6">

          <!-- Description -->
          <div v-if="textbook.description" class="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <button class="w-full flex items-center justify-between px-5 py-4 text-left" @click="descExpanded = !descExpanded">
              <span class="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
                <UIcon name="i-lucide-file-text" class="w-4 h-4 text-brand-500" />
                Description
              </span>
              <UIcon :name="descExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-4 h-4 text-zinc-400" />
            </button>
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-[2000px]"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 max-h-[2000px]"
              leave-to-class="opacity-0 max-h-0"
            >
              <div v-if="descExpanded" class="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-800">
                <p class="text-zinc-700 dark:text-zinc-300 leading-relaxed pt-4 whitespace-pre-wrap">{{ textbook.description }}</p>
              </div>
            </Transition>
          </div>

          <!-- Topics -->
          <div v-if="textbook.topics.length" class="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5">
            <h3 class="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white mb-3">
              <UIcon name="i-lucide-compass" class="w-4 h-4 text-brand-500" />
              Topics
            </h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="topic in textbook.topics"
                :key="topic"
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
              >
                {{ topic }}
              </span>
            </div>
          </div>

          <!-- Keywords / Tags -->
          <div v-if="textbook.keywords.length || textbook.tags.length" class="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5">
            <h3 class="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white mb-3">
              <UIcon name="i-lucide-tags" class="w-4 h-4 text-brand-500" />
              Keywords &amp; Tags
            </h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="kw in [...textbook.keywords, ...textbook.tags]"
                :key="kw"
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
              >
                #{{ kw }}
              </span>
            </div>
          </div>

          <!-- Artifacts / Downloads -->
          <div v-if="textbook.artifacts.length" class="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5">
            <h3 class="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white mb-3">
              <UIcon name="i-lucide-paperclip" class="w-4 h-4 text-brand-500" />
              Artifacts
            </h3>
            <ul class="space-y-2">
              <li
                v-for="artifact in textbook.artifacts"
                :key="artifact.id"
                class="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"
              >
                <div class="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                  <UIcon name="i-lucide-file" class="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-zinc-900 dark:text-white truncate">{{ artifact.title }}</p>
                  <p v-if="artifact.description" class="text-xs text-zinc-500 dark:text-zinc-400 truncate">{{ artifact.description }}</p>
                  <p class="text-xs text-zinc-400 dark:text-zinc-500">
                    {{ artifact.file_type.toUpperCase() }}
                    <span v-if="artifact.file_size"> · {{ formatFileSize(artifact.file_size) }}</span>
                  </p>
                </div>
                <a
                  :href="artifact.file_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors shrink-0"
                >
                  <UIcon name="i-lucide-download" class="w-3.5 h-3.5" />
                  Download
                </a>
              </li>
            </ul>
          </div>

          <!-- Passages -->
          <div v-if="passages.length" class="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <button class="w-full flex items-center justify-between px-5 py-4 text-left" @click="passagesExpanded = !passagesExpanded">
              <span class="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
                <UIcon name="i-lucide-quote" class="w-4 h-4 text-brand-500" />
                Passages
                <span class="text-xs font-normal text-zinc-500 dark:text-zinc-400">({{ passages.length }})</span>
              </span>
              <UIcon :name="passagesExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-4 h-4 text-zinc-400" />
            </button>
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-[4000px]"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 max-h-[4000px]"
              leave-to-class="opacity-0 max-h-0"
            >
              <ul v-if="passagesExpanded" class="divide-y divide-zinc-100 dark:divide-zinc-800 border-t border-zinc-100 dark:border-zinc-800">
                <li
                  v-for="passage in passages"
                  :key="passage.id"
                  class="px-5 py-4"
                >
                  <div class="flex items-start gap-2 mb-1">
                    <span v-if="passage.chapter" class="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wide">
                      {{ passage.chapter }}
                      <span v-if="passage.section"> · {{ passage.section }}</span>
                    </span>
                    <span v-if="passage.page_start != null" class="text-xs text-zinc-400 dark:text-zinc-500 ml-auto">
                      p.{{ passage.page_start }}{{ passage.page_end && passage.page_end !== passage.page_start ? `–${passage.page_end}` : '' }}
                    </span>
                  </div>
                  <p v-if="passage.title" class="text-sm font-semibold text-zinc-900 dark:text-white mb-1">{{ passage.title }}</p>
                  <p class="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-4">{{ passage.content }}</p>
                  <div v-if="passage.topics.length || passage.tags.length" class="mt-2 flex flex-wrap gap-1">
                    <span
                      v-for="t in [...passage.topics, ...passage.tags].slice(0, 4)"
                      :key="t"
                      class="px-1.5 py-0.5 text-[10px] rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    >
                      {{ t }}
                    </span>
                  </div>
                </li>
              </ul>
            </Transition>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">

          <!-- Bibliographic info -->
          <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm p-5">
            <h3 class="font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-info" class="w-4 h-4 text-brand-500" />
              Bibliographic Info
            </h3>
            <dl class="space-y-3 text-sm">
              <div v-if="textbook.edition">
                <dt class="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-0.5">Edition</dt>
                <dd class="text-zinc-700 dark:text-zinc-300">{{ textbook.edition }}</dd>
              </div>
              <div v-if="textbook.isbn13 || textbook.isbn10">
                <dt class="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-0.5">ISBN</dt>
                <dd class="text-zinc-700 dark:text-zinc-300 font-mono text-xs">{{ textbook.isbn13 || textbook.isbn10 }}</dd>
              </div>
              <div v-if="textbook.doi">
                <dt class="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-0.5">DOI</dt>
                <dd class="text-zinc-700 dark:text-zinc-300 font-mono text-xs break-all">{{ textbook.doi }}</dd>
              </div>
              <div v-if="textbook.license">
                <dt class="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-0.5">License</dt>
                <dd class="text-zinc-700 dark:text-zinc-300">{{ textbook.license }}</dd>
              </div>
              <div v-if="textbook.audience">
                <dt class="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-0.5">Audience</dt>
                <dd class="text-zinc-700 dark:text-zinc-300">{{ textbook.audience }}</dd>
              </div>
              <div v-if="textbook.region">
                <dt class="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-0.5">Region</dt>
                <dd class="text-zinc-700 dark:text-zinc-300">{{ textbook.region }}</dd>
              </div>
              <div v-if="textbook.editors.length">
                <dt class="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-0.5">Editors</dt>
                <dd class="text-zinc-700 dark:text-zinc-300">{{ textbook.editors.join(', ') }}</dd>
              </div>
              <div v-if="textbook.applicability_status && textbook.applicability_status !== 'unknown'">
                <dt class="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-0.5">Applicability</dt>
                <dd class="text-zinc-700 dark:text-zinc-300 capitalize">{{ textbook.applicability_status }}</dd>
              </div>
              <div v-if="textbook.creator">
                <dt class="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-0.5">Added by</dt>
                <dd class="text-zinc-700 dark:text-zinc-300">{{ textbook.creator }}</dd>
              </div>
              <div v-if="textbook.created_at">
                <dt class="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-0.5">Added</dt>
                <dd class="text-zinc-700 dark:text-zinc-300">{{ formatDate(textbook.created_at) }}</dd>
              </div>
              <div v-if="textbook.urn">
                <dt class="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-0.5">URN</dt>
                <dd class="text-zinc-700 dark:text-zinc-300 font-mono text-xs break-all">{{ textbook.urn }}</dd>
              </div>
            </dl>
          </div>

          <!-- Browse library CTA -->
          <div class="bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30 rounded-2xl border border-brand-200 dark:border-brand-700 p-5">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-lucide-library" class="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 class="font-semibold text-brand-900 dark:text-brand-100">Textbook Library</h3>
            </div>
            <p class="text-xs text-brand-700 dark:text-brand-300 mb-3 leading-relaxed">
              Explore more textbooks in the FoodScholar library.
            </p>
            <UButton to="/foodscholar/textbooks" color="primary" size="sm" class="w-full justify-center">
              Browse All Textbooks
            </UButton>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import textbooksApi from '~/services/textbooksApi'
import type { Textbook, TextbookPassage, TextbookReviewStatus, TextbookStatus } from '~/services/textbooksApi'

definePageMeta({ middleware: ['auth', 'profile'] })

const route = useRoute()
const urn = computed(() => route.params.urn as string)

const textbook = ref<Textbook | null>(null)
const passages = ref<TextbookPassage[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const descExpanded = ref(true)
const passagesExpanded = ref(false)

useHead(() => ({
  title: textbook.value ? `${textbook.value.title} – FoodScholar` : 'Textbook – FoodScholar'
}))

async function loadTextbook() {
  loading.value = true
  error.value = null
  try {
    textbook.value = await textbooksApi.getTextbook(urn.value)
    textbooksApi.fetchPassages(urn.value).then(p => { passages.value = p }).catch(() => {})
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}

onMounted(loadTextbook)

const formatAuthors = (authors: string[]): string => {
  if (!authors.length) return 'Unknown author'
  if (authors.length <= 3) return authors.join(', ')
  return `${authors.slice(0, 3).join(', ')} et al.`
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const reviewBadgeClass = (status: TextbookReviewStatus) => {
  const map: Record<TextbookReviewStatus, string> = {
    verified: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800',
    pending_review: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
    in_review: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    unreviewed: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700',
    changes_requested: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
    rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
  }
  return map[status] ?? map.unreviewed
}

const formatReviewStatus = (status: TextbookReviewStatus) => {
  const map: Record<TextbookReviewStatus, string> = {
    verified: 'Verified', pending_review: 'Pending Review', in_review: 'In Review',
    unreviewed: 'Unreviewed', changes_requested: 'Changes Requested', rejected: 'Rejected'
  }
  return map[status] ?? status
}

const statusBadgeClass = (status: TextbookStatus) => {
  const map: Record<TextbookStatus, string> = {
    active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800',
    draft: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700',
    archived: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-600',
    deleted: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800',
    deprecated: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
  }
  return map[status] ?? map.draft
}
</script>
