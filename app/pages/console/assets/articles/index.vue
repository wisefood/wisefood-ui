<template>
  <div>
    <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <UBreadcrumb
        :items="breadcrumbItems"
        class="mb-4"
      />

      <div class="flex flex-col gap-4 py-8 sm:flex-row sm:items-start sm:justify-between">
        <UPageHeader
          title="Scientific Articles"
          description="Search the article catalog, surface curation gaps, and open a full editorial workspace for each record."
          :ui="{ root: 'relative py-0 border-b-0' }"
        />

        <UButton
          color="primary"
          icon="i-lucide-plus"
          class="self-start"
          @click="openCreateArticleModal"
        >
          Add Article
        </UButton>
      </div>

      <UPageBody class="space-y-6">
        <UCard
          :ui="{ body: 'p-0', header: 'p-5 sm:p-6', footer: 'p-4 sm:px-6 sm:py-4' }"
          class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
        >
          <template #header>
            <div class="space-y-4">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                      Article Library
                    </h2>
                    <UBadge
                      color="neutral"
                      variant="outline"
                    >
                      {{ resultCountLabel }}
                    </UBadge>
                  </div>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Human curation stays front-and-center while AI-derived metadata remains visible for comparison.
                  </p>
                </div>

                <div class="ml-auto flex flex-wrap gap-2">
                  <UButton
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-refresh-cw"
                    :loading="articlesLoading"
                    @click="refreshArticles"
                  >
                    Sync
                  </UButton>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    :disabled="articlesLoading || !hasActiveFilters"
                    @click="resetFilters"
                  >
                    Reset
                  </UButton>
                </div>
              </div>

              <div class="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div class="w-full min-w-0">
                  <UInput
                    v-model="filters.q"
                    leading
                    leading-icon="i-lucide-search"
                    placeholder="Search title, authors, DOI, or abstract"
                    class="w-full"
                    @keydown.enter="applyFilters"
                  />
                </div>

                <div class="grid grid-cols-2 gap-2 sm:grid-cols-5 xl:flex xl:flex-none">
                  <USelectMenu
                    v-model="filters.category"
                    :items="categoryOptions"
                    value-key="value"
                    label-key="label"
                    leading-icon="i-lucide-layers-3"
                    class="w-full xl:w-44"
                    @update:model-value="applyFilters"
                  />
                  <USelectMenu
                    v-model="filters.studyType"
                    :items="studyTypeOptions"
                    value-key="value"
                    label-key="label"
                    leading-icon="i-lucide-flask-conical"
                    class="w-full xl:w-40"
                    @update:model-value="applyFilters"
                  />
                  <USelectMenu
                    v-model="filters.readerGroup"
                    :items="readerGroupOptions"
                    value-key="value"
                    label-key="label"
                    leading-icon="i-lucide-users"
                    class="w-full xl:w-40"
                    @update:model-value="applyFilters"
                  />
                  <USelectMenu
                    v-model="filters.region"
                    :items="regionOptions"
                    value-key="value"
                    label-key="label"
                    leading-icon="i-lucide-globe"
                    class="w-full xl:w-36"
                    @update:model-value="applyFilters"
                  />
                  <USelectMenu
                    v-model="sortBy"
                    :items="articleSortOptions"
                    value-key="value"
                    label-key="label"
                    leading-icon="i-lucide-arrow-up-down"
                    class="w-full xl:w-44"
                    @update:model-value="applyFilters"
                  />
                </div>
              </div>
            </div>
          </template>

          <UAlert
            v-if="articlesError"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :title="articlesError"
            class="mx-5 mt-5 sm:mx-6"
          />

          <div class="overflow-x-auto">
            <UTable
              :data="articles"
              :columns="articleColumns"
              :loading="articlesLoading"
              sticky="header"
              :on-select="handleArticleRowSelect"
              class="min-h-[32rem] min-w-[56rem]"
            >
            <template #title-cell="{ row }">
              <div class="w-[34rem] max-w-[34rem] py-0.5">
                <p class="truncate font-medium text-gray-900 dark:text-white">
                  {{ row.original.title }}
                </p>
                <p class="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                  {{ compactArticleMeta(row.original) }}
                </p>
              </div>
            </template>

            <template #updated_at-cell="{ row }">
              <span class="text-sm text-gray-600 dark:text-gray-300">
                {{ formatDate(row.original.updated_at) }}
              </span>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex justify-end gap-2">
                <UButton
                  color="error"
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-trash-2"
                  :loading="deletePending && articlePendingDeletion?.urn === row.original.urn"
                  @click.stop="promptDeleteArticle(row.original)"
                >
                  Delete
                </UButton>
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  trailing-icon="i-lucide-arrow-right"
                  @click.stop="openArticle(row.original)"
                >
                  Open
                </UButton>
              </div>
            </template>

            <template #empty>
              <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
                <UIcon
                  name="i-lucide-flask-conical-off"
                  class="h-8 w-8 text-gray-400"
                />
                <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                  No articles match the current search.
                </p>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Adjust the filters or broaden the search query to see more catalog records.
                </p>
              </div>
            </template>
            </UTable>
          </div>

          <template #footer>
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div class="flex flex-wrap items-center gap-3">
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  {{ paginationSummary }}
                </p>
              </div>

              <UPagination
                v-if="totalArticles > pageSize"
                v-model:page="page"
                :total="totalArticles"
                :items-per-page="pageSize"
                :sibling-count="1"
                show-edges
              />
            </div>
          </template>
        </UCard>
      </UPageBody>
    </UPage>

    <UModal
      v-model:open="deleteModalOpen"
      :ui="{ width: 'max-w-md' }"
    >
      <template #content>
        <UCard :ui="{ body: { padding: 'sm:p-6 p-4' }, rounded: 'rounded-2xl' }">
          <div class="space-y-5">
            <div class="text-center">
              <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <UIcon
                  name="i-lucide-alert-triangle"
                  class="h-8 w-8 text-red-600 dark:text-red-400"
                />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Delete article?
              </h3>
              <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                This will permanently remove
                <span class="font-medium text-gray-900 dark:text-white">{{ articlePendingDeletion?.title || 'this article' }}</span>
                from the catalog.
              </p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                URN: {{ articlePendingDeletion?.urn || 'Unknown' }}
              </p>
            </div>

            <UAlert
              v-if="deleteError"
              color="error"
              variant="soft"
              icon="i-lucide-alert-circle"
              :title="deleteError"
            />

            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                :disabled="deletePending"
                @click="cancelDeleteArticle"
              >
                Cancel
              </UButton>
              <UButton
                color="error"
                :loading="deletePending"
                @click="confirmDeleteArticle"
              >
                Delete article
              </UButton>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>

    <UModal
      v-model:open="createModalOpen"
      :ui="{ content: 'w-[calc(100vw-2rem)] max-w-3xl' }"
    >
      <template #content>
        <UCard
          class="flex w-full max-h-[calc(100vh-2.5rem)] flex-col"
          :ui="{ body: 'min-h-0 flex-1 overflow-y-auto p-4 sm:p-5', footer: 'p-4 sm:p-5' }"
        >
          <template #header>
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Add Article
                </h3>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Start a new article record here, then continue refining it inside the full workspace.
                </p>
              </div>

              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                :disabled="createPending"
                @click="closeCreateArticleModal"
              />
            </div>
          </template>

          <div class="space-y-5">
            <UAlert
              v-if="createError"
              color="error"
              variant="soft"
              icon="i-lucide-alert-circle"
              :title="createError"
            />

            <div class="space-y-4">
              <UFormField
                label="Article Title"
                required
              >
                <UInput
                  v-model="createForm.title"
                  placeholder="e.g. Mediterranean diet and cardiovascular outcomes"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="URN"
                required
              >
                <UInput
                  v-model="createForm.urn"
                  placeholder="e.g. mediterranean-diet-cardiovascular-outcomes"
                  class="w-full"
                  @update:model-value="markCreateUrnAsEdited"
                />
                <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Lowercase slug used by the catalog API. It auto-generates from the title until you edit it manually.
                </p>
              </UFormField>

              <UFormField
                label="Venue"
                required
              >
                <UInput
                  v-model="createForm.venue"
                  placeholder="e.g. The Lancet"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Publication Year">
                <UInput
                  v-model="createForm.publicationYear"
                  type="number"
                  placeholder="e.g. 2022"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Authors"
                required
              >
                <UTextarea
                  v-model="createForm.authors"
                  :rows="4"
                  placeholder="One author per line, or separate them with commas"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Abstract"
                required
              >
                <UTextarea
                  v-model="createForm.abstract"
                  :rows="5"
                  placeholder="Add the article abstract to seed the record"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Canonical URL">
                <UInput
                  v-model="createForm.url"
                  placeholder="https://..."
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Category">
                <UInput
                  v-model="createForm.category"
                  placeholder="e.g. Cardiometabolic Health"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Tags">
                <UInput
                  v-model="createForm.tags"
                  placeholder="Comma-separated"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Body Text">
                <UTextarea
                  v-model="createForm.content"
                  :rows="8"
                  placeholder="Optional source body or notes for the first curation pass"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                :disabled="createPending"
                @click="closeCreateArticleModal"
              >
                Cancel
              </UButton>
              <UButton
                color="primary"
                :loading="createPending"
                @click="createArticleRecord"
              >
                Create Article
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { Article, CreateArticleRequest } from '~/services/articlesApi'
import articlesApi from '~/services/articlesApi'
import {
  articleSortOptions,
  buildArticleRoutePath,
  formatConsolePublicationYear as formatPublicationYear,
  getDisplayArticleCategory,
  mergeFacetBuckets,
  normalizeFacetBuckets,
  slugifyArticleUrn
} from '~/utils/consoleArticles'
import { formatConsoleDate as formatDate } from '~/utils/consoleGuideCatalog'

definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Scientific Articles'
})

useSeoMeta({
  description: 'Wisefood scientific article management workspace for internal curation operations'
})

type SearchFacets = Record<string, Array<{ value: unknown, count: unknown }>>

const toast = useToast()
const router = useRouter()

const pageSize = 20
const facetFields = ['category', 'ai_category', 'study_type', 'reader_group', 'region']

const articles = ref<Article[]>([])
const totalArticles = ref(0)
const articlesLoading = ref(false)
const articlesError = ref<string | null>(null)

const facets = ref<SearchFacets>({})

const page = ref(1)
const sortBy = ref(articleSortOptions[0].value)

const filters = reactive({
  q: '',
  category: 'all',
  studyType: 'all',
  readerGroup: 'all',
  region: 'all'
})

const deleteModalOpen = ref(false)
const deletePending = ref(false)
const deleteError = ref<string | null>(null)
const articlePendingDeletion = ref<Article | null>(null)

const createModalOpen = ref(false)
const createPending = ref(false)
const createError = ref<string | null>(null)
const createUrnEdited = ref(false)

const createForm = reactive({
  title: '',
  urn: '',
  venue: '',
  authors: '',
  publicationYear: '',
  abstract: '',
  content: '',
  url: '',
  category: '',
  tags: ''
})

const articleColumns = [
  { accessorKey: 'title', header: 'Article' },
  { accessorKey: 'updated_at', header: 'Updated' },
  { id: 'actions', header: '', enableSorting: false }
]

const breadcrumbItems = [
  {
    label: 'Console',
    icon: 'i-lucide-panel-top',
    to: '/console'
  },
  {
    label: 'Asset Manager',
    icon: 'i-lucide-folder-open',
    to: '/console/assets'
  },
  {
    label: 'Scientific Articles',
    icon: 'i-lucide-flask-conical'
  }
]

const categoryOptions = computed(() => [
  { label: 'All categories', value: 'all' },
  ...mergeFacetBuckets(facets.value.category, facets.value.ai_category).map(entry => ({
    label: `${entry.value} (${entry.count})`,
    value: entry.value
  }))
])

const studyTypeOptions = computed(() => [
  { label: 'All study types', value: 'all' },
  ...normalizeFacetBuckets(facets.value.study_type).map(entry => ({
    label: `${entry.value} (${entry.count})`,
    value: entry.value
  }))
])

const readerGroupOptions = computed(() => [
  { label: 'All reader groups', value: 'all' },
  ...normalizeFacetBuckets(facets.value.reader_group).map(entry => ({
    label: `${entry.value} (${entry.count})`,
    value: entry.value
  }))
])

const regionOptions = computed(() => [
  { label: 'All regions', value: 'all' },
  ...normalizeFacetBuckets(facets.value.region).map(entry => ({
    label: `${entry.value} (${entry.count})`,
    value: entry.value
  }))
])

const hasActiveFilters = computed(() =>
  Boolean(
    filters.q.trim()
    || filters.category !== 'all'
    || filters.studyType !== 'all'
    || filters.readerGroup !== 'all'
    || filters.region !== 'all'
    || sortBy.value !== articleSortOptions[0].value
  )
)

const resultCountLabel = computed(() => {
  const total = totalArticles.value.toLocaleString()
  return `${total} article${totalArticles.value === 1 ? '' : 's'}`
})

const paginationSummary = computed(() => {
  if (!totalArticles.value) {
    return 'No articles to display'
  }

  const start = (page.value - 1) * pageSize + 1
  const end = Math.min(page.value * pageSize, totalArticles.value)
  return `Showing ${start}-${end} of ${totalArticles.value.toLocaleString()} articles`
})

function normalizeNullable(value: string) {
  const normalized = value.trim()
  return normalized.length ? normalized : null
}

function parseDelimitedList(value: string) {
  const entries = value
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(item => item.length > 0)

  return Array.from(new Set(entries))
}

function buildPublicationYearDate(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return undefined
  }

  if (/^\d{4}$/.test(normalized)) {
    return `${normalized}-01-01`
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized
  }

  throw new Error('Publication year must be a 4-digit year such as 2024.')
}

function escapeFilterValue(value: string) {
  return value.replace(/"/g, '\\"')
}

function extractErrorDetail(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value
  }

  if (Array.isArray(value)) {
    const messages = value
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }

        if (item && typeof item === 'object') {
          const message = 'msg' in item && typeof item.msg === 'string' ? item.msg : null
          const detail = 'detail' in item ? extractErrorDetail(item.detail) : null
          return message || detail
        }

        return null
      })
      .filter((item): item is string => Boolean(item))

    return messages.length ? messages.join(' ') : null
  }

  if (typeof value === 'object' && value !== null && 'detail' in value) {
    return extractErrorDetail((value as { detail?: unknown }).detail)
  }

  return null
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (error && typeof error === 'object') {
    const message = 'message' in error && typeof error.message === 'string' ? error.message : null
    const detail = 'data' in error ? extractErrorDetail(error.data) : null

    if (detail) {
      return detail
    }

    if (message && message.trim()) {
      return message
    }
  }

  return fallback
}

function compactArticleMeta(article: Article) {
  const authors = Array.isArray(article.authors) ? article.authors.filter(Boolean).slice(0, 3) : []
  const authorLabel = authors.length ? authors.join(', ') : 'Unknown authors'
  const publicationLabel = formatPublicationYear(article.publication_year)
  const venueLabel = article.venue?.trim() || 'No venue'
  const categoryLabel = getDisplayArticleCategory(article)
  return `${authorLabel} · ${venueLabel} · ${publicationLabel} · ${categoryLabel}`
}

function buildSearchFilters() {
  const fq: string[] = []

  if (filters.category !== 'all') {
    const escaped = escapeFilterValue(filters.category)
    fq.push(`(category:"${escaped}" OR ai_category:"${escaped}")`)
  }

  if (filters.studyType !== 'all') {
    fq.push(`study_type:"${escapeFilterValue(filters.studyType)}"`)
  }

  if (filters.readerGroup !== 'all') {
    fq.push(`reader_group:"${escapeFilterValue(filters.readerGroup)}"`)
  }

  if (filters.region !== 'all') {
    fq.push(`region:"${escapeFilterValue(filters.region)}"`)
  }

  return fq
}

async function loadFacets() {
  try {
    const response = await articlesApi.searchArticles({
      q: null,
      limit: 1,
      offset: 0,
      sort: 'updated_at desc',
      fields: facetFields,
      facet_limit: 100,
      fl: ['urn']
    })

    facets.value = response.result.facets || {}
  } catch (error) {
    console.error('[ConsoleArticles] Failed to load facets', error)
  }
}

async function loadArticles() {
  articlesLoading.value = true
  articlesError.value = null

  try {
    const response = await articlesApi.searchArticles({
      q: filters.q.trim() || null,
      limit: pageSize,
      offset: (page.value - 1) * pageSize,
      sort: sortBy.value,
      fq: buildSearchFilters(),
      fl: [
        'urn',
        'title',
        'authors',
        'venue',
        'publication_year',
        'category',
        'ai_category',
        'study_type',
        'reader_group',
        'tags',
        'key_takeaways',
        'description',
        'abstract',
        'updated_at'
      ]
    })

    articles.value = response.result.results || []
    totalArticles.value = response.result.total || 0

    if (Object.keys(facets.value).length === 0 && response.result.facets) {
      facets.value = response.result.facets
    }
  } catch (error) {
    articles.value = []
    totalArticles.value = 0
    articlesError.value = resolveErrorMessage(error, 'Failed to load articles')
  } finally {
    articlesLoading.value = false
  }
}

function openArticle(article: Article) {
  return router.push(buildArticleRoutePath(article.urn))
}

function handleArticleRowSelect(row: { original: Article }) {
  return openArticle(row.original)
}

function refreshArticles() {
  return loadArticles()
}

function applyFilters() {
  if (page.value !== 1) {
    page.value = 1
    return
  }

  return loadArticles()
}

function resetFilters() {
  filters.q = ''
  filters.category = 'all'
  filters.studyType = 'all'
  filters.readerGroup = 'all'
  filters.region = 'all'
  sortBy.value = articleSortOptions[0].value
  if (page.value !== 1) {
    page.value = 1
    return
  }

  return loadArticles()
}

function promptDeleteArticle(article: Article) {
  articlePendingDeletion.value = article
  deleteError.value = null
  deleteModalOpen.value = true
}

function cancelDeleteArticle() {
  deleteModalOpen.value = false
  articlePendingDeletion.value = null
  deleteError.value = null
}

async function confirmDeleteArticle() {
  if (!articlePendingDeletion.value) {
    return
  }

  deletePending.value = true
  deleteError.value = null

  try {
    await articlesApi.deleteArticle(articlePendingDeletion.value.urn)
    toast.add({
      title: 'Article deleted',
      description: `${articlePendingDeletion.value.title} was removed from the catalog.`,
      color: 'success'
    })
    cancelDeleteArticle()

    if (articles.value.length === 1 && page.value > 1) {
      page.value -= 1
    }

    await loadArticles()
  } catch (error) {
    deleteError.value = resolveErrorMessage(error, 'Failed to delete article')
  } finally {
    deletePending.value = false
  }
}

function resetCreateForm() {
  createForm.title = ''
  createForm.urn = ''
  createForm.venue = ''
  createForm.authors = ''
  createForm.publicationYear = ''
  createForm.abstract = ''
  createForm.content = ''
  createForm.url = ''
  createForm.category = ''
  createForm.tags = ''
  createUrnEdited.value = false
  createError.value = null
}

function openCreateArticleModal() {
  resetCreateForm()
  createModalOpen.value = true
}

function closeCreateArticleModal() {
  createModalOpen.value = false
  createError.value = null
}

function markCreateUrnAsEdited() {
  createUrnEdited.value = true
}

async function createArticleRecord() {
  createPending.value = true
  createError.value = null

  try {
    const title = normalizeNullable(createForm.title)
    const urn = normalizeNullable(createForm.urn)
    const venue = normalizeNullable(createForm.venue)
    const abstract = normalizeNullable(createForm.abstract)
    const content = normalizeNullable(createForm.content) || abstract
    const authors = parseDelimitedList(createForm.authors)

    if (!title) {
      throw new Error('Article title is required.')
    }

    if (!urn) {
      throw new Error('URN is required.')
    }

    if (!venue) {
      throw new Error('Venue is required.')
    }

    if (!authors.length) {
      throw new Error('At least one author is required.')
    }

    if (!abstract) {
      throw new Error('Abstract is required to create the article record.')
    }

    const payload: CreateArticleRequest = {
      urn,
      title,
      venue,
      authors,
      content: content || abstract,
      abstract: abstract || undefined,
      url: normalizeNullable(createForm.url) || undefined,
      category: normalizeNullable(createForm.category) || undefined,
      tags: parseDelimitedList(createForm.tags),
      publication_year: buildPublicationYearDate(createForm.publicationYear)
    }

    const createdArticle = await articlesApi.createArticle(payload)

    toast.add({
      title: 'Article created',
      description: `${createdArticle.title} is ready for curation.`,
      color: 'success'
    })

    createModalOpen.value = false
    await loadArticles()
    await router.push(buildArticleRoutePath(createdArticle.urn))
  } catch (error) {
    createError.value = resolveErrorMessage(error, 'Failed to create article')
  } finally {
    createPending.value = false
  }
}

watch(() => createForm.title, (value) => {
  if (!createUrnEdited.value) {
    createForm.urn = value.trim() ? slugifyArticleUrn(value) : ''
  }
})

watch(page, () => {
  void loadArticles()
})

onMounted(async () => {
  await loadFacets()
  await loadArticles()
})
</script>
