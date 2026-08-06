<template>
  <div>
    <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <UBreadcrumb
        :items="breadcrumbItems"
        class="mb-4"
      />

      <div class="flex flex-col gap-4 py-8 sm:flex-row sm:items-start sm:justify-between">
        <UPageHeader
          title="Textbooks"
          description="Curate reference textbooks and the passages FoodScholar retrieves from them."
          :ui="{ root: 'relative py-0 border-b-0' }"
        />
        <UButton
          color="primary"
          icon="i-lucide-plus"
          class="self-start"
          @click="openCreateModal"
        >
          Add Textbook
        </UButton>
      </div>

      <UPageBody class="space-y-6">
        <UCard
          :ui="{ body: 'p-0', header: 'p-5 sm:p-6', footer: 'p-4 sm:px-6 sm:py-4' }"
          class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
        >
          <template #header>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Textbook Library
                  </h2>
                  <UBadge
                    color="neutral"
                    variant="outline"
                  >
                    {{ resultCountLabel }}
                  </UBadge>
                </div>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Passages are produced by an external chunker and ingested per artifact.
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <UInput
                  v-model="query"
                  leading-icon="i-lucide-search"
                  placeholder="Search title, authors, ISBN"
                  class="w-full sm:w-72"
                  @keydown.enter="applySearch"
                />
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-refresh-cw"
                  :loading="loading"
                  @click="loadTextbooks"
                >
                  Sync
                </UButton>
              </div>
            </div>
          </template>

          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :title="error"
            class="mx-5 mt-5 sm:mx-6"
          />

          <UTable
            :data="textbooks"
            :columns="columns"
            :loading="loading"
            :on-select="openTextbook"
            class="min-h-[24rem]"
          >
            <template #title-cell="{ row }">
              <div class="min-w-0">
                <p class="truncate font-medium text-gray-900 dark:text-white">
                  {{ row.original.title }}
                </p>
                <p class="truncate text-xs text-gray-500 dark:text-gray-400">
                  {{ authorLine(row.original) }}
                </p>
              </div>
            </template>

            <template #publication-cell="{ row }">
              <span class="text-sm text-gray-600 dark:text-gray-300">
                {{ row.original.publisher || '—' }}
                <span
                  v-if="row.original.publication_year"
                  class="text-gray-400"
                >· {{ row.original.publication_year }}</span>
              </span>
            </template>

            <template #status-cell="{ row }">
              <div class="flex flex-wrap gap-1">
                <UBadge
                  :color="statusColor(row.original.status)"
                  variant="subtle"
                >
                  {{ formatEnumLabel(row.original.status || 'draft') }}
                </UBadge>
                <UBadge
                  v-if="row.original.review_status"
                  :color="reviewStatusColor(row.original.review_status)"
                  variant="subtle"
                >
                  {{ formatEnumLabel(row.original.review_status) }}
                </UBadge>
              </div>
            </template>

            <template #updated-cell="{ row }">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(row.original.updated_at) }}
              </span>
            </template>

            <template #empty>
              <div class="py-12 text-center">
                <UIcon
                  name="i-lucide-book-open"
                  class="mx-auto h-8 w-8 text-gray-300 dark:text-zinc-600"
                />
                <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  No textbooks yet.
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500">
                  Add one, attach its PDF, then ingest the chunked passages.
                </p>
              </div>
            </template>
          </UTable>

          <template
            v-if="total > pageSize"
            #footer
          >
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ resultCountLabel }}
              </span>
              <UPagination
                v-model:page="page"
                :items-per-page="pageSize"
                :total="total"
                @update:page="loadTextbooks"
              />
            </div>
          </template>
        </UCard>
      </UPageBody>
    </UPage>

    <UModal
      v-model:open="createModalOpen"
      :ui="{ content: 'w-[calc(100vw-2rem)] max-w-2xl' }"
    >
      <template #content>
        <UCard
          class="flex max-h-[calc(100vh-2.5rem)] w-full flex-col"
          :ui="{ body: 'min-h-0 flex-1 overflow-y-auto p-4 sm:p-5', footer: 'p-4 sm:p-5' }"
        >
          <template #header>
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Add Textbook
                </h3>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Create the record first; artifacts and passages are attached in the workspace.
                </p>
              </div>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                :disabled="createPending"
                @click="createModalOpen = false"
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

            <section class="space-y-4">
              <h4 class="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                Identity
              </h4>

              <UFormField
                label="Title"
                required
              >
                <UInput
                  v-model="createForm.title"
                  placeholder="e.g. Human Nutrition: Science for Healthy Living"
                  class="w-full"
                  autofocus
                />
              </UFormField>

              <UFormField
                label="URN slug"
                required
                :error="urnError"
                help="Lowercase letters, numbers and dashes. Generated from the title until you edit it."
              >
                <UInput
                  v-model="createForm.urn"
                  placeholder="human-nutrition-science-for-healthy-living"
                  class="w-full"
                  @update:model-value="urnEdited = true"
                >
                  <template #leading>
                    <span class="text-xs text-gray-400 dark:text-gray-500">urn:textbook:</span>
                  </template>
                </UInput>
              </UFormField>

              <UFormField
                label="Authors"
                help="Order is preserved."
              >
                <ConsoleArticleTokenInput
                  v-model="createForm.authors"
                  label="author"
                  ordered
                  placeholder="Surname, Initials"
                  empty-text="No authors added yet."
                />
              </UFormField>
            </section>

            <USeparator />

            <section class="space-y-4">
              <h4 class="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                Publication
              </h4>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="Publisher">
                  <UInput
                    v-model="createForm.publisher"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Edition">
                  <UInput
                    v-model="createForm.edition"
                    placeholder="e.g. 3rd"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="Publication year"
                  :error="yearError"
                >
                  <UInput
                    v-model="createForm.publication_year"
                    type="number"
                    :min="1500"
                    :max="currentYear + 1"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Language">
                  <USelectMenu
                    v-model="createForm.language"
                    :items="languageOptions"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="ISBN-13"
                  :error="isbnError"
                >
                  <UInput
                    v-model="createForm.isbn13"
                    placeholder="978-0-000-00000-0"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="DOI">
                  <UInput
                    v-model="createForm.doi"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </section>

            <USeparator />

            <section class="space-y-4">
              <h4 class="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                Classification
              </h4>

              <UFormField label="Topics">
                <ConsoleArticleTokenInput
                  v-model="createForm.topics"
                  label="topic"
                  placeholder="Add a topic"
                  empty-text="No topics."
                />
              </UFormField>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="Audience">
                  <UInputMenu
                    v-model="createForm.audience"
                    :items="readerGroupOptions"
                    value-key="value"
                    label-key="label"
                    create-item="always"
                    class="w-full"
                    @create="createForm.audience = String($event).trim()"
                  />
                </UFormField>
                <UFormField label="Licence">
                  <USelectMenu
                    v-model="createForm.license"
                    :items="licenseOptions"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </section>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                :disabled="createPending"
                @click="createModalOpen = false"
              >
                Cancel
              </UButton>
              <UButton
                color="primary"
                :loading="createPending"
                :disabled="!createFormValid"
                @click="createTextbook"
              >
                Create Textbook
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
/**
 * Textbook library.
 *
 * Textbooks had full catalog CRUD and a public browse page but no console at
 * all, so they were effectively read-only despite the API supporting more.
 * Passages are not created here: an external chunker produces them and they are
 * ingested per artifact from the workspace page.
 */
import { computed, onMounted, reactive, ref } from 'vue'
import textbooksApi, {
  type Textbook,
  type TextbookCreatePayload
} from '~/services/textbooksApi'
import ConsoleArticleTokenInput from '~/components/console/ArticleTokenInput.vue'
import {
  languageOptions,
  licenseOptions,
  readerGroupOptions
} from '~/utils/consoleArticleVocabulary'
import {
  formatConsoleDate as formatDate,
  formatConsoleEnumLabel as formatEnumLabel,
  reviewStatusColor,
  statusColor
} from '~/utils/consoleGuideCatalog'
import { slugifyArticleUrn } from '~/utils/consoleArticles'
import { assetSectionBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Textbooks · Console' })

const router = useRouter()
const toast = useToast()

const pageSize = 25
const loading = ref(false)
const error = ref<string | null>(null)
const textbooks = ref<Textbook[]>([])
const total = ref(0)
const page = ref(1)
const query = ref('')

const createModalOpen = ref(false)
const createPending = ref(false)
const createError = ref<string | null>(null)
const urnEdited = ref(false)
const currentYear = new Date().getFullYear()

const createForm = reactive({
  title: '',
  urn: '',
  authors: [] as string[],
  publisher: '',
  edition: '',
  publication_year: '',
  language: '',
  isbn13: '',
  doi: '',
  topics: [] as string[],
  audience: '',
  license: ''
})

const breadcrumbItems = assetSectionBreadcrumb('textbooks')

const columns = [
  { accessorKey: 'title', header: 'Textbook' },
  { accessorKey: 'publication', header: 'Publisher' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'updated', header: 'Updated' }
]

const resultCountLabel = computed(() =>
  total.value === 1 ? '1 textbook' : `${total.value.toLocaleString()} textbooks`
)

const urnError = computed(() => {
  const value = createForm.urn.trim()
  if (!value) return undefined
  return /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(value)
    ? undefined
    : 'Use lowercase letters, numbers, dashes or underscores.'
})

const yearError = computed(() => {
  const value = createForm.publication_year.trim()
  if (!value) return undefined
  const year = Number(value)
  if (!/^\d{4}$/.test(value)) return 'Enter a 4-digit year.'
  if (year < 1500 || year > currentYear + 1) return `Enter a year between 1500 and ${currentYear + 1}.`
  return undefined
})

const isbnError = computed(() => {
  const value = createForm.isbn13.replace(/[\s-]/g, '')
  if (!value) return undefined
  return /^\d{13}$/.test(value) ? undefined : 'An ISBN-13 has 13 digits.'
})

const createFormValid = computed(() =>
  Boolean(createForm.title.trim())
  && Boolean(createForm.urn.trim())
  && !urnError.value
  && !yearError.value
  && !isbnError.value
)

// Auto-slug from the title until the editor takes over, matching the article form.
watch(
  () => createForm.title,
  (title) => {
    if (!urnEdited.value) createForm.urn = slugifyArticleUrn(title)
  }
)

function authorLine(textbook: Textbook): string {
  const authors = textbook.authors ?? []
  if (!authors.length) return textbook.urn
  if (authors.length <= 3) return authors.join(', ')
  return `${authors.slice(0, 3).join(', ')} +${authors.length - 3}`
}

function openTextbook(_event: Event, row: { original: Textbook }) {
  void router.push(`/console/assets/textbooks/${encodeURIComponent(row.original.urn)}`)
}

function openCreateModal() {
  createError.value = null
  urnEdited.value = false
  Object.assign(createForm, {
    title: '',
    urn: '',
    authors: [],
    publisher: '',
    edition: '',
    publication_year: '',
    language: '',
    isbn13: '',
    doi: '',
    topics: [],
    audience: '',
    license: ''
  })
  createModalOpen.value = true
}

async function createTextbook() {
  createPending.value = true
  createError.value = null
  try {
    const payload: TextbookCreatePayload = {
      urn: createForm.urn.trim(),
      title: createForm.title.trim()
    }

    // Optional fields are omitted rather than sent empty: the API is typed and
    // an empty string where it expects an enum or a number is a 422.
    const optional: Record<string, string> = {
      publisher: createForm.publisher,
      edition: createForm.edition,
      language: createForm.language,
      doi: createForm.doi,
      audience: createForm.audience,
      license: createForm.license
    }
    for (const [key, raw] of Object.entries(optional)) {
      const value = raw.trim()
      if (value) (payload as unknown as Record<string, unknown>)[key] = value
    }

    const isbn = createForm.isbn13.replace(/[\s-]/g, '')
    if (isbn) payload.isbn13 = isbn
    if (createForm.publication_year.trim()) {
      payload.publication_year = Number(createForm.publication_year)
    }
    if (createForm.authors.length) payload.authors = createForm.authors
    if (createForm.topics.length) payload.topics = createForm.topics

    const created = await textbooksApi.createTextbook(payload)
    toast.add({
      title: 'Textbook created',
      description: `${created.title} is ready for curation.`,
      color: 'success'
    })
    createModalOpen.value = false
    await router.push(`/console/assets/textbooks/${encodeURIComponent(created.urn)}`)
  } catch (err) {
    createError.value = err instanceof Error ? err.message : 'Failed to create textbook.'
  } finally {
    createPending.value = false
  }
}

function applySearch() {
  page.value = 1
  void loadTextbooks()
}

async function loadTextbooks() {
  loading.value = true
  error.value = null
  try {
    const result = await textbooksApi.searchTextbooks({
      q: query.value.trim() || null,
      limit: pageSize,
      offset: (page.value - 1) * pageSize,
      sort: 'updated_at desc'
    })
    textbooks.value = result.textbooks
    total.value = result.total
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not load textbooks.'
    textbooks.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(loadTextbooks)
</script>
