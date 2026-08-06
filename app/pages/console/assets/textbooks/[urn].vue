<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />

    <UAlert
      v-if="loadError"
      color="error"
      variant="soft"
      icon="i-lucide-alert-circle"
      :title="loadError"
    />

    <template v-else>
      <div class="flex flex-col gap-4 py-6 sm:flex-row sm:items-start sm:justify-between">
        <UPageHeader
          :title="textbook?.title || 'Textbook'"
          :description="textbook?.urn"
          :ui="{ root: 'relative py-0 border-b-0' }"
        />
        <div class="flex flex-wrap gap-2 self-start">
          <UBadge
            :color="statusColor(textbook?.status || 'draft')"
            variant="subtle"
          >
            {{ formatEnumLabel(textbook?.status || 'draft') }}
          </UBadge>
          <UButton
            color="primary"
            :loading="savePending"
            :disabled="!hasChanges"
            @click="save"
          >
            {{ hasChanges ? 'Save changes' : 'Saved' }}
          </UButton>
        </div>
      </div>

      <UPageBody class="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,1fr)]">
        <div class="space-y-6">
          <!-- Metadata -->
          <UCard
            :ui="{ body: 'p-5 sm:p-6', header: 'p-5 sm:px-6' }"
            class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
          >
            <template #header>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Details
              </h2>
            </template>

            <div class="space-y-4">
              <UFormField label="Title">
                <UInput
                  v-model="form.title"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Description">
                <UTextarea
                  v-model="form.description"
                  :rows="3"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Authors"
                help="Order is preserved."
              >
                <ConsoleArticleTokenInput
                  v-model="form.authors"
                  label="author"
                  ordered
                  placeholder="Surname, Initials"
                  empty-text="No authors recorded."
                />
              </UFormField>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="Publisher">
                  <UInput
                    v-model="form.publisher"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Edition">
                  <UInput
                    v-model="form.edition"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="Publication year"
                  :error="yearError"
                >
                  <UInput
                    v-model="form.publication_year"
                    type="number"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Language">
                  <USelectMenu
                    v-model="form.language"
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
                    v-model="form.isbn13"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="DOI">
                  <UInput
                    v-model="form.doi"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <UFormField label="Topics">
                <ConsoleArticleTokenInput
                  v-model="form.topics"
                  label="topic"
                  placeholder="Add a topic"
                  empty-text="No topics."
                />
              </UFormField>

              <UFormField label="Keywords">
                <ConsoleArticleTokenInput
                  v-model="form.keywords"
                  label="keyword"
                  placeholder="Add a keyword"
                  empty-text="No keywords."
                />
              </UFormField>
            </div>
          </UCard>

          <!-- Passages -->
          <UCard
            :ui="{ body: 'p-0', header: 'p-5 sm:px-6', footer: 'p-4 sm:px-6' }"
            class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
          >
            <template #header>
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Passages
                  </h2>
                  <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Produced by the external chunker and ingested per artifact.
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <UBadge
                    color="neutral"
                    variant="outline"
                  >
                    {{ passageTotal.toLocaleString() }} indexed
                  </UBadge>
                  <UButton
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-upload"
                    :disabled="!artifacts.length"
                    @click="openIngestModal"
                  >
                    Ingest passages
                  </UButton>
                </div>
              </div>
            </template>

            <div class="border-b border-gray-100 px-5 py-3 dark:border-white/10">
              <UInput
                v-model="passageQuery"
                leading-icon="i-lucide-search"
                placeholder="Search passage text"
                class="w-full"
                @keydown.enter="searchPassages"
              />
            </div>

            <div
              v-if="passages.length"
              class="divide-y divide-gray-100 dark:divide-white/5"
            >
              <div
                v-for="passage in passages"
                :key="passage.id"
                class="px-5 py-3"
              >
                <div class="mb-1 flex items-center gap-2">
                  <span
                    v-if="passage.structure_path.length"
                    class="text-[11px] font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400"
                  >
                    {{ passage.structure_path.join(' · ') }}
                  </span>
                  <span class="ml-auto text-[11px] tabular-nums text-gray-400 dark:text-gray-500">
                    #{{ passage.sequence_no }}<template v-if="passage.page_no"> · p.{{ passage.page_no }}</template>
                  </span>
                </div>
                <p class="line-clamp-3 text-sm leading-6 text-gray-700 dark:text-gray-200">
                  {{ passage.text }}
                </p>
              </div>
            </div>

            <div
              v-else
              class="py-12 text-center"
            >
              <UIcon
                name="i-lucide-file-text"
                class="mx-auto h-8 w-8 text-gray-300 dark:text-zinc-600"
              />
              <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
                {{ passageQuery ? 'No passages match that search.' : 'No passages ingested yet.' }}
              </p>
              <p
                v-if="!passageQuery && !artifacts.length"
                class="text-xs text-gray-400 dark:text-gray-500"
              >
                Attach a PDF artifact first — passages are ingested against one.
              </p>
            </div>

            <template
              v-if="passageTotal > passagePageSize"
              #footer
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ passageTotal.toLocaleString() }} passages
                </span>
                <UPagination
                  v-model:page="passagePage"
                  :items-per-page="passagePageSize"
                  :total="passageTotal"
                  @update:page="loadPassages"
                />
              </div>
            </template>
          </UCard>
        </div>

        <!-- Sidebar -->
        <aside class="space-y-6">
          <UCard
            :ui="{ body: 'p-5 sm:p-6', header: 'p-5 sm:px-6' }"
            class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
          >
            <template #header>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                Editorial state
              </h3>
            </template>

            <div class="space-y-4">
              <UFormField label="Status">
                <USelectMenu
                  v-model="form.status"
                  :items="guideStatusEditOptions"
                  value-key="value"
                  label-key="label"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Review status">
                <USelectMenu
                  v-model="form.review_status"
                  :items="guideReviewEditOptions"
                  value-key="value"
                  label-key="label"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Visibility">
                <USelectMenu
                  v-model="form.visibility"
                  :items="guideVisibilityEditOptions"
                  value-key="value"
                  label-key="label"
                  class="w-full"
                />
              </UFormField>
            </div>
          </UCard>

          <UCard
            :ui="{ body: 'p-5 sm:p-6', header: 'p-5 sm:px-6' }"
            class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
          >
            <template #header>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                Artifacts
              </h3>
            </template>

            <ul
              v-if="artifacts.length"
              class="space-y-2"
            >
              <li
                v-for="artifact in artifacts"
                :key="artifact.id"
                class="rounded-lg border border-gray-200/70 p-3 dark:border-white/10"
              >
                <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {{ artifact.title || artifact.file_type }}
                </p>
                <p class="mt-0.5 truncate font-mono text-[11px] text-gray-400 dark:text-gray-500">
                  {{ artifact.id }}
                </p>
              </li>
            </ul>
            <p
              v-else
              class="text-sm text-gray-500 dark:text-gray-400"
            >
              No artifacts attached. Passages are ingested against an artifact, so add the source PDF first.
            </p>
          </UCard>
        </aside>
      </UPageBody>
    </template>

    <!-- Passage ingestion -->
    <UModal
      v-model:open="ingestModalOpen"
      :ui="{ content: 'w-[calc(100vw-2rem)] max-w-2xl' }"
    >
      <template #content>
        <UCard
          class="flex max-h-[calc(100vh-2.5rem)] w-full flex-col"
          :ui="{ body: 'min-h-0 flex-1 overflow-y-auto p-4 sm:p-5', footer: 'p-4 sm:p-5' }"
        >
          <template #header>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Ingest passages
              </h3>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Paste the chunker's JSON output. This <strong>replaces</strong> every passage
                currently stored for the selected artifact.
              </p>
            </div>
          </template>

          <div class="space-y-4">
            <UAlert
              v-if="ingestError"
              color="error"
              variant="soft"
              icon="i-lucide-alert-circle"
              :title="ingestError"
            />

            <UFormField
              label="Artifact"
              required
              help="Passages belong to one artifact; re-ingesting swaps that artifact's set atomically."
            >
              <USelectMenu
                v-model="ingestArtifactId"
                :items="artifactOptions"
                value-key="value"
                label-key="label"
                class="w-full"
              />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField
                label="Chunker name"
                help="Recorded on every passage for provenance."
              >
                <UInput
                  v-model="ingestExtractorName"
                  placeholder="e.g. pdf-chunker"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Run id">
                <UInput
                  v-model="ingestRunId"
                  placeholder="Optional"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UFormField
              label="Passages JSON"
              required
              :error="ingestJsonError"
              :help="ingestSummary"
            >
              <UTextarea
                v-model="ingestJson"
                :rows="12"
                class="w-full font-mono text-xs"
                placeholder='[{"page_no": 1, "sequence_no": 1, "text": "…", "char_start": 0, "char_end": 512, "structure_path": ["Chapter 1"]}]'
              />
            </UFormField>

            <p class="text-xs text-gray-500 dark:text-gray-400">
              Each entry needs <code>page_no</code>, <code>sequence_no</code>, <code>text</code>,
              <code>char_start</code> and <code>char_end</code>. <code>structure_path</code> and
              <code>structure_node_id</code> are optional. A top-level array or
              <code>{ "passages": [...] }</code> are both accepted.
            </p>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                :disabled="ingestPending"
                @click="ingestModalOpen = false"
              >
                Cancel
              </UButton>
              <UButton
                color="primary"
                :loading="ingestPending"
                :disabled="!canIngest"
                @click="ingestPassages"
              >
                Replace {{ parsedPassages.length }} passage{{ parsedPassages.length === 1 ? '' : 's' }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </UPage>
</template>

<script setup lang="ts">
/**
 * Textbook workspace: metadata, editorial state, and passage ingestion.
 *
 * Passages are produced by an external chunker, so this page does not create
 * them one by one — it ingests a chunker's output for one artifact, replacing
 * that artifact's passage set atomically. That is what makes re-chunking a
 * document a safe, repeatable operation rather than something that accumulates
 * duplicates.
 */
import { computed, onMounted, reactive, ref } from 'vue'
import textbooksApi, {
  type Textbook,
  type TextbookArtifact,
  type TextbookPassage,
  type TextbookPassageInput,
  type TextbookUpdatePayload
} from '~/services/textbooksApi'
import ConsoleArticleTokenInput from '~/components/console/ArticleTokenInput.vue'
import { languageOptions } from '~/utils/consoleArticleVocabulary'
import {
  formatConsoleEnumLabel as formatEnumLabel,
  guideReviewEditOptions,
  guideStatusEditOptions,
  guideVisibilityEditOptions,
  statusColor
} from '~/utils/consoleGuideCatalog'
import { assetSectionBreadcrumb, recordCrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })

const route = useRoute()
const toast = useToast()

const textbookUrn = computed(() => {
  const raw = route.params.urn
  return decodeURIComponent(Array.isArray(raw) ? raw[0] ?? '' : raw ?? '')
})

const textbook = ref<Textbook | null>(null)
const loadError = ref<string | null>(null)
const savePending = ref(false)

const passages = ref<TextbookPassage[]>([])
const passageTotal = ref(0)
const passagePage = ref(1)
const passagePageSize = 25
const passageQuery = ref('')

const ingestModalOpen = ref(false)
const ingestPending = ref(false)
const ingestError = ref<string | null>(null)
const ingestArtifactId = ref('')
const ingestExtractorName = ref('')
const ingestRunId = ref('')
const ingestJson = ref('')

const form = reactive({
  title: '',
  description: '',
  authors: [] as string[],
  publisher: '',
  edition: '',
  publication_year: '',
  language: '',
  isbn13: '',
  doi: '',
  topics: [] as string[],
  keywords: [] as string[],
  status: 'draft',
  review_status: 'unreviewed',
  visibility: 'internal'
})

let snapshot = ''

useHead({ title: () => `${textbook.value?.title || 'Textbook'} · Console` })

const breadcrumbItems = computed(() => assetSectionBreadcrumb(
  'textbooks',
  [recordCrumb(textbook.value?.title, 'Textbook')]
))

const artifacts = computed<TextbookArtifact[]>(() => textbook.value?.artifacts ?? [])

const artifactOptions = computed(() =>
  artifacts.value.map(artifact => ({
    value: artifact.id,
    label: artifact.title || `${artifact.file_type} · ${artifact.id.slice(0, 8)}`
  }))
)

const hasChanges = computed(() => JSON.stringify({ ...form }) !== snapshot)

const yearError = computed(() => {
  const value = form.publication_year.trim()
  if (!value) return undefined
  return /^\d{4}$/.test(value) ? undefined : 'Enter a 4-digit year.'
})

const isbnError = computed(() => {
  const value = form.isbn13.replace(/[\s-]/g, '')
  if (!value) return undefined
  return /^\d{13}$/.test(value) ? undefined : 'An ISBN-13 has 13 digits.'
})

/**
 * Parse the chunker output.
 *
 * Accepts a bare array or `{ passages: [...] }` because both are common
 * chunker shapes, and validates each entry so a malformed paste is caught here
 * rather than as a 422 after the replace has already been attempted.
 */
const parsedPassages = computed<TextbookPassageInput[]>(() => {
  const raw = ingestJson.value.trim()
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    const items = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.passages)
        ? parsed.passages
        : []
    return items.map((item: Record<string, unknown>, index: number) => ({
      page_no: Number(item.page_no),
      sequence_no: Number(item.sequence_no ?? index + 1),
      text: String(item.text ?? ''),
      char_start: Number(item.char_start ?? 0),
      char_end: Number(item.char_end ?? String(item.text ?? '').length),
      structure_node_id: (item.structure_node_id as string) ?? null,
      structure_path: Array.isArray(item.structure_path)
        ? (item.structure_path as string[])
        : []
    }))
  } catch {
    return []
  }
})

const ingestJsonError = computed(() => {
  const raw = ingestJson.value.trim()
  if (!raw) return undefined
  try {
    JSON.parse(raw)
  } catch {
    return 'That is not valid JSON.'
  }
  if (!parsedPassages.value.length) return 'No passages found in that payload.'

  const bad = parsedPassages.value.findIndex(
    passage =>
      !passage.text.trim()
      || !Number.isFinite(passage.page_no)
      || !Number.isFinite(passage.sequence_no)
  )
  if (bad >= 0) {
    return `Passage ${bad + 1} is missing text, page_no or sequence_no.`
  }
  return undefined
})

const ingestSummary = computed(() =>
  parsedPassages.value.length
    ? `${parsedPassages.value.length} passage(s) parsed.`
    : 'Paste the chunker output.'
)

const canIngest = computed(() =>
  Boolean(ingestArtifactId.value)
  && parsedPassages.value.length > 0
  && !ingestJsonError.value
)

function populate(record: Textbook) {
  form.title = record.title || ''
  form.description = record.description || ''
  form.authors = [...(record.authors ?? [])]
  form.publisher = record.publisher || ''
  form.edition = record.edition || ''
  form.publication_year = record.publication_year?.toString() || ''
  form.language = record.language || ''
  form.isbn13 = record.isbn13 || ''
  form.doi = record.doi || ''
  form.topics = [...(record.topics ?? [])]
  form.keywords = [...(record.keywords ?? [])]
  form.status = record.status || 'draft'
  form.review_status = record.review_status || 'unreviewed'
  form.visibility = record.visibility || 'internal'
  snapshot = JSON.stringify({ ...form })
}

async function save() {
  savePending.value = true
  try {
    const payload: TextbookUpdatePayload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      authors: form.authors,
      publisher: form.publisher.trim() || null,
      edition: form.edition.trim() || null,
      language: form.language.trim() || null,
      doi: form.doi.trim() || null,
      topics: form.topics,
      keywords: form.keywords,
      status: form.status as Textbook['status'],
      review_status: form.review_status as Textbook['review_status'],
      visibility: form.visibility as Textbook['visibility']
    }
    const isbn = form.isbn13.replace(/[\s-]/g, '')
    payload.isbn13 = isbn || null
    payload.publication_year = form.publication_year.trim()
      ? Number(form.publication_year)
      : null

    const updated = await textbooksApi.updateTextbook(textbookUrn.value, payload)
    textbook.value = updated
    populate(updated)
    toast.add({ title: 'Textbook saved', color: 'success' })
  } catch (err) {
    toast.add({
      title: 'Could not save',
      description: err instanceof Error ? err.message : 'Unknown error',
      color: 'error'
    })
  } finally {
    savePending.value = false
  }
}

function openIngestModal() {
  ingestError.value = null
  ingestJson.value = ''
  ingestRunId.value = ''
  ingestArtifactId.value = artifacts.value[0]?.id ?? ''
  ingestModalOpen.value = true
}

async function ingestPassages() {
  ingestPending.value = true
  ingestError.value = null
  try {
    const result = await textbooksApi.replacePassages(textbookUrn.value, {
      artifact_id: ingestArtifactId.value,
      passages: parsedPassages.value,
      extractor_name: ingestExtractorName.value.trim() || null,
      extractor_run_id: ingestRunId.value.trim() || null
    })
    toast.add({
      title: 'Passages ingested',
      description: `${result.replaced_count} stored, ${result.deleted_count} previous passage(s) removed.`,
      color: 'success'
    })
    ingestModalOpen.value = false
    passagePage.value = 1
    await loadPassages()
  } catch (err) {
    ingestError.value = err instanceof Error ? err.message : 'Ingestion failed.'
  } finally {
    ingestPending.value = false
  }
}

function searchPassages() {
  passagePage.value = 1
  void loadPassages()
}

async function loadPassages() {
  if (!textbookUrn.value) return
  try {
    const result = await textbooksApi.searchPassages(textbookUrn.value, {
      q: passageQuery.value.trim() || null,
      limit: passagePageSize,
      offset: (passagePage.value - 1) * passagePageSize
    })
    passages.value = result.passages
    passageTotal.value = result.total
  } catch {
    passages.value = []
    passageTotal.value = 0
  }
}

async function load() {
  loadError.value = null
  try {
    const record = await textbooksApi.getTextbook(textbookUrn.value)
    textbook.value = record
    populate(record)
    await loadPassages()
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Could not load that textbook.'
  }
}

onMounted(load)
</script>
