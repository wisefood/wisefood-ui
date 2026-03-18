<template>
  <div>
    <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <UBreadcrumb
        :items="breadcrumbItems"
        class="mb-4"
      />

      <UPageBody class="space-y-5">
        <section class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div class="min-w-0 space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ pageTitle }}
              </h1>
              <UBadge
                v-if="selectedGuide"
                :color="statusColor(selectedGuide.status)"
                variant="soft"
              >
                {{ formatEnumLabel(selectedGuide.status) }}
              </UBadge>
              <UBadge
                v-if="selectedGuide"
                :color="reviewStatusColor(selectedGuide.review_status)"
                variant="outline"
              >
                {{ formatEnumLabel(selectedGuide.review_status) }}
              </UBadge>
            </div>

            <div
              v-if="selectedGuide"
              class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400"
            >
              <div
                v-for="item in guideMetadataItems"
                :key="item.label"
                class="flex min-w-0 items-center gap-1.5"
              >
                <UIcon
                  :name="item.icon"
                  class="h-4 w-4 shrink-0 text-brand-500 dark:text-brand-300"
                />
                <span class="truncate">{{ item.label }}</span>
              </div>
            </div>

            <p
              v-if="selectedGuide?.description"
              class="max-w-4xl text-sm leading-6 text-gray-600 dark:text-gray-300"
            >
              {{ selectedGuide.description }}
            </p>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-2 xl:max-w-md">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-refresh-cw"
              :loading="detailLoading"
              @click="refreshGuide"
            >
              Refresh
            </UButton>

            <UButton
              v-if="selectedGuide"
              color="neutral"
              variant="outline"
              icon="i-lucide-pen-square"
              @click="openGuideEditor"
            >
              Edit Guide
            </UButton>

            <UButton
              v-if="selectedGuide"
              color="primary"
              variant="soft"
              :icon="guidePublicationButtonIcon"
              :disabled="!canToggleGuidePublication"
              :loading="publishPending"
              @click="toggleGuidePublication"
            >
              {{ guidePublicationButtonLabel }}
            </UButton>

            <p
              v-if="selectedGuide"
              class="basis-full text-right text-xs text-gray-500 dark:text-gray-400"
            >
              {{ publishReadinessLabel }}
            </p>
          </div>
        </section>

        <UAlert
          v-if="detailError"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="detailError"
        />

        <template v-if="detailLoading">
          <UCard
            :ui="{ body: 'p-5 sm:p-6' }"
            class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
          >
            <div class="space-y-4">
              <div class="h-8 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
              <div class="h-72 animate-pulse rounded-2xl bg-gray-200 dark:bg-white/10" />
            </div>
          </UCard>
        </template>

        <template v-else-if="selectedGuide">
          <UCard
            :ui="{ body: 'p-5 sm:p-6' }"
            class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
          >
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/80 pb-4 dark:border-white/10">
              <div>
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-lucide-list-checks"
                    class="h-4 w-4 text-brand-500 dark:text-brand-300"
                  />
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    Guidelines
                  </p>
                </div>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Review and curate guidelines page by page against the source PDF.
                </p>
              </div>

              <UButton
                color="primary"
                variant="soft"
                icon="i-lucide-arrow-right"
                :to="guideReviewRoute"
              >
                Open Review
              </UButton>
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-3">
              <div class="rounded-xl border border-gray-200/80 bg-gray-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <p class="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                  Total
                </p>
                <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {{ guideGuidelines.length }}
                </p>
              </div>

              <div class="rounded-xl border border-gray-200/80 bg-gray-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <p class="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                  Ready
                </p>
                <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {{ readyGuidelineCount }}
                </p>
              </div>

              <div class="rounded-xl border border-gray-200/80 bg-gray-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <p class="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                  Pending
                </p>
                <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {{ pendingGuidelineCount }}
                </p>
              </div>
            </div>
          </UCard>

          <UCard
            :ui="{ body: 'p-5 sm:p-6' }"
            class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
          >
            <div class="flex items-center justify-between gap-3 border-b border-gray-200/80 pb-4 dark:border-white/10">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-file-stack"
                  class="h-4 w-4 text-brand-500 dark:text-brand-300"
                />
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  Artifacts
                </p>
              </div>

              <UBadge
                color="neutral"
                variant="outline"
              >
                {{ guideArtifacts.length }}
              </UBadge>
            </div>

            <div class="mt-5">
              <UTable
                :data="guideArtifacts"
                :columns="artifactColumns"
                sticky="header"
                class="min-h-[12rem]"
              >
                <template #title-cell="{ row }">
                  <div class="min-w-[15rem] py-0.5">
                    <p class="truncate font-medium text-gray-900 dark:text-white">
                      {{ row.original.title }}
                    </p>
                    <p class="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                      {{ row.original.description || row.original.language?.toUpperCase() || 'No description' }}
                    </p>
                  </div>
                </template>

                <template #file_type-cell="{ row }">
                  <span class="text-sm text-gray-600 dark:text-gray-300">
                    {{ row.original.file_type }}
                  </span>
                </template>

                <template #file_size-cell="{ row }">
                  <span class="text-sm text-gray-600 dark:text-gray-300">
                    {{ formatBytes(row.original.file_size) }}
                  </span>
                </template>

                <template #updated_at-cell="{ row }">
                  <span class="text-sm text-gray-600 dark:text-gray-300">
                    {{ formatDate(row.original.updated_at) }}
                  </span>
                </template>

                <template #actions-cell="{ row }">
                  <div class="flex justify-end gap-1">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      icon="i-lucide-download"
                      :loading="downloadingArtifactId === row.original.id"
                      @click.stop="downloadArtifact(row.original)"
                    />
                    <UButton
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      icon="i-lucide-pen-square"
                      @click.stop="openArtifactEditor(row.original)"
                    />
                  </div>
                </template>

                <template #empty>
                  <div class="flex h-64 flex-col items-center justify-center px-6 text-center">
                    <UIcon
                      name="i-lucide-file-stack"
                      class="h-8 w-8 text-gray-400"
                    />
                    <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                      No artifacts are attached to this guide yet.
                    </p>
                  </div>
                </template>
              </UTable>
            </div>
          </UCard>
        </template>

        <UCard
          v-else
          :ui="{ body: 'p-6 sm:p-8' }"
          class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
        >
          <div class="flex flex-col items-center justify-center text-center">
            <UIcon
              name="i-lucide-book-open-x"
              class="h-10 w-10 text-gray-400"
            />
            <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
              The requested guide could not be opened.
            </p>
            <UButton
              class="mt-4"
              :to="guideLibraryRoute"
              color="neutral"
              variant="outline"
              icon="i-lucide-arrow-left"
            >
              Back to Library
            </UButton>
          </div>
        </UCard>
      </UPageBody>
    </UPage>

    <UModal
      v-model:open="guideEditorOpen"
      :ui="{ content: 'w-[calc(100vw-2rem)] max-w-4xl sm:max-w-4xl' }"
    >
      <template #content>
        <UCard
          class="flex w-full min-h-[82vh] max-h-[95vh] flex-col"
          :ui="{ body: 'min-h-0 flex-1 overflow-y-auto p-5 sm:p-6', footer: 'p-5 sm:p-6' }"
        >
          <template #header>
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Edit Guide
                </h3>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Organize the guide record in a few focused metadata groups.
                </p>
              </div>

              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                @click="guideEditorOpen = false"
              />
            </div>
          </template>

          <UTabs
            v-model="guideEditorTab"
            :items="guideEditorTabs"
            variant="link"
            size="sm"
            class="w-full"
            :ui="{ content: 'w-full pt-5' }"
          >
            <template #basic>
              <div class="w-full space-y-4">
                <UFormField
                  label="Title"
                  class="w-full"
                >
                  <UInput
                    v-model="guideForm.title"
                    class="w-full"
                  />
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Full public title of the guide as it should appear in listings and detail views.
                  </p>
                </UFormField>
                <UFormField
                  label="Short Title"
                  class="w-full"
                >
                  <UInput
                    v-model="guideForm.short_title"
                    class="w-full"
                  />
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Compact label for tables and headers when the full title is too long.
                  </p>
                </UFormField>
                <UFormField
                  label="Language"
                  class="w-full"
                >
                  <UInput
                    v-model="guideForm.language"
                    placeholder="e.g. en"
                    class="w-full"
                  />
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Two-letter ISO language code such as <code>en</code>, <code>el</code>, or <code>fr</code>.
                  </p>
                </UFormField>
                <UFormField
                  label="URL"
                  class="w-full"
                >
                  <UInput
                    v-model="guideForm.url"
                    class="w-full"
                  />
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Canonical source URL for the guide publication or landing page.
                  </p>
                </UFormField>
                <UFormField
                  label="Region"
                  class="w-full"
                >
                  <UInput
                    v-model="guideForm.region"
                    placeholder="e.g. IE"
                    class="w-full"
                  />
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Two-letter ISO country code for the guide scope, for example <code>IE</code> or <code>GR</code>.
                  </p>
                </UFormField>
                <UFormField
                  label="Tags"
                  class="w-full"
                >
                  <UInput
                    v-model="guideForm.tags"
                    placeholder="Comma-separated"
                    class="w-full"
                  />
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Comma-separated discovery labels such as <code>dietary-guidelines</code>, <code>public-health</code>, or a country tag.
                  </p>
                </UFormField>
                <UFormField
                  label="Description"
                  class="w-full"
                >
                  <UTextarea
                    v-model="guideForm.description"
                    :rows="5"
                    class="w-full"
                  />
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Short editorial summary of what the guide covers and who it is intended for.
                  </p>
                </UFormField>
              </div>
            </template>

            <template #governance>
              <div class="w-full space-y-4">
                <UFormField
                  label="Publication Year"
                  class="w-full"
                >
                  <UInput
                    v-model="guideForm.publication_year"
                    type="number"
                    class="w-full"
                  />
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Original publication year of the guide, for example <code>2011</code>.
                  </p>
                </UFormField>
                <UFormField
                  label="Publication Date"
                  class="w-full"
                >
                  <UInput
                    v-model="guideForm.publication_date"
                    type="date"
                    class="w-full"
                  />
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Exact release date when it is known; leave blank if only the year is available.
                  </p>
                </UFormField>
                <UFormField
                  label="Issuing Authority"
                  class="w-full"
                >
                  <UInput
                    v-model="guideForm.issuing_authority"
                    class="w-full"
                  />
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Official body responsible for publishing the guide, such as a food safety authority or ministry.
                  </p>
                </UFormField>
                <UFormField
                  label="Responsible Ministry"
                  class="w-full"
                >
                  <UInput
                    v-model="guideForm.responsible_ministry"
                    class="w-full"
                  />
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Government ministry or supervising institution connected to the publication.
                  </p>
                </UFormField>
                <UFormField
                  label="Document Type"
                  class="w-full"
                >
                  <UInput
                    v-model="guideForm.document_type"
                    class="w-full"
                  />
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Editorial type of the source, for example <code>scientific_report</code>, guideline, or policy paper.
                  </p>
                </UFormField>
                <UFormField
                  label="Legal Status"
                  class="w-full"
                >
                  <UInput
                    v-model="guideForm.legal_status"
                    class="w-full"
                  />
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Regulatory or institutional standing, such as official national guideline or advisory recommendation.
                  </p>
                </UFormField>
              </div>
            </template>

            <template #nutrition>
              <div class="w-full space-y-4">
                <UFormField
                  label="Topic"
                  class="w-full"
                >
                  <UInput
                    v-model="guideForm.topic"
                    class="w-full"
                  />
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Main subject area, such as nutrition, food policy, maternal health, or obesity prevention.
                  </p>
                </UFormField>
                <UFormField
                  label="Audience"
                  class="w-full"
                >
                  <UInput
                    v-model="guideForm.audience"
                    class="w-full"
                  />
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Broad intended audience, for example general public, clinicians, or educators.
                  </p>
                </UFormField>
                <UFormField
                  label="Target Audiences"
                  class="w-full"
                >
                  <UInput
                    v-model="guideForm.target_audiences"
                    placeholder="Comma-separated"
                    class="w-full"
                  />
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    More specific audience segments as a comma-separated list, such as <code>consumers</code> or <code>health_professionals</code>.
                  </p>
                </UFormField>
                <UFormField
                  label="Evidence Basis"
                  class="w-full"
                >
                  <UTextarea
                    v-model="guideForm.evidence_basis"
                    :rows="5"
                    class="w-full"
                  />
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Short note on the methodology or evidence base used to derive the guide recommendations.
                  </p>
                </UFormField>

                <UFormField
                  label="Notes"
                  class="w-full"
                >
                  <UTextarea
                    v-model="guideForm.notes"
                    :rows="5"
                    class="w-full"
                  />
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Internal curator notes, review caveats, or handling instructions for this record.
                  </p>
                </UFormField>
              </div>
            </template>

            <template #content>
              <UFormField
                label="Guide Content"
                class="w-full"
              >
                <UTextarea
                  v-model="guideForm.content"
                  :rows="20"
                  class="w-full"
                />
                <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Full textual body when the guide content is stored directly in the catalog rather than only through linked artifacts.
                </p>
              </UFormField>
            </template>
          </UTabs>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                :disabled="guideSavePending"
                @click="guideEditorOpen = false"
              >
                Cancel
              </UButton>
              <UButton
                color="primary"
                :loading="guideSavePending"
                @click="saveGuide"
              >
                Save Guide
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <UModal
      v-model:open="artifactEditorOpen"
      :ui="{ content: 'w-[calc(100vw-2rem)] max-w-3xl sm:max-w-3xl' }"
    >
      <template #content>
        <UCard
          class="w-full"
          :ui="{ body: 'p-5 sm:p-6', footer: 'p-5 sm:p-6' }"
        >
          <template #header>
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Edit Artifact
                </h3>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Update artifact metadata while leaving the file itself in place.
                </p>
              </div>

              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                @click="artifactEditorOpen = false"
              />
            </div>
          </template>

          <div class="space-y-4 w-full">
            <UFormField
              label="Title"
              class="w-full"
            >
              <UInput
                v-model="artifactForm.title"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Description"
              class="w-full"
            >
              <UTextarea
                v-model="artifactForm.description"
                :rows="4"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="File Type"
              class="w-full"
            >
              <UInput
                v-model="artifactForm.file_type"
                class="w-full"
              />
            </UFormField>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                :disabled="artifactSavePending"
                @click="artifactEditorOpen = false"
              >
                Cancel
              </UButton>
              <UButton
                color="primary"
                :loading="artifactSavePending"
                @click="saveArtifact"
              >
                Save Artifact
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type {
  ArtifactUpdatePayload,
  CatalogApplicabilityStatus,
  CatalogArtifact,
  CatalogGuide,
  CatalogGuideline,
  CatalogReviewStatus,
  CatalogStatus,
  CatalogVisibility,
  GuideUpdatePayload
} from '~/services/catalogApi'
import catalogApi from '~/services/catalogApi'
import { fetchCatalogArtifactDownloadResponse, getArtifactPresignedUrl, hasS3Backing } from '~/services/objectStorageApi'
import {
  buildGuideReviewRoutePath,
  formatBytes,
  formatDate,
  formatEnumLabel,
  resolveGuideRouteParam,
  reviewStatusColor,
  statusColor
} from '~/utils/consoleGuideCatalog'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const toast = useToast()

const selectedGuide = ref<CatalogGuide | null>(null)
const detailLoading = ref(false)
const detailError = ref<string | null>(null)

const guideGuidelines = ref<CatalogGuideline[]>([])
const guideArtifacts = ref<CatalogArtifact[]>([])

const guideEditorOpen = ref(false)
const artifactEditorOpen = ref(false)
const guideEditorTab = ref('basic')

const guideSavePending = ref(false)
const artifactSavePending = ref(false)
const publishPending = ref(false)
const downloadingArtifactId = ref('')
const editingArtifactId = ref('')

const guideEditorTabs = [
  { label: 'Basic Metadata', value: 'basic', slot: 'basic' },
  { label: 'Governance', value: 'governance', slot: 'governance' },
  { label: 'Nutrition Metadata', value: 'nutrition', slot: 'nutrition' },
  { label: 'Content', value: 'content', slot: 'content' }
]

const guideForm = reactive({
  title: '',
  short_title: '',
  description: '',
  content: '',
  url: '',
  region: '',
  language: '',
  publication_year: '',
  publication_date: '',
  topic: '',
  audience: '',
  document_type: '',
  issuing_authority: '',
  responsible_ministry: '',
  legal_status: '',
  visibility: '',
  applicability_status: '',
  tags: '',
  target_audiences: '',
  evidence_basis: '',
  notes: ''
})

const artifactForm = reactive({
  title: '',
  description: '',
  file_type: ''
})

const artifactColumns = [
  { accessorKey: 'title', header: 'Artifact' },
  { accessorKey: 'file_type', header: 'Type' },
  { accessorKey: 'file_size', header: 'Size' },
  { accessorKey: 'updated_at', header: 'Updated' },
  { id: 'actions', header: '', enableSorting: false }
]

const resolvedGuideUrn = computed(() => resolveGuideRouteParam(route.params.urn))

const guideLibraryQuery = computed(() => {
  const { tab, ...rest } = route.query
  return rest
})

const guideLibraryRoute = computed(() => ({
  path: '/console/assets/guides',
  query: guideLibraryQuery.value
}))

const guideReviewRoute = computed(() => buildGuideReviewRoutePath(resolvedGuideUrn.value))

const pageTitle = computed(() => selectedGuide.value?.short_title || selectedGuide.value?.title || 'Guide Workspace')

const breadcrumbItems = computed(() => [
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
    label: 'Dietary Guides',
    icon: 'i-lucide-book-open-check',
    to: guideLibraryRoute.value
  },
  {
    label: pageTitle.value,
    icon: 'i-lucide-file-pen-line'
  }
])

const readyGuidelineCount = computed(() =>
  guideGuidelines.value.filter(
    guideline => guideline.status === 'active' && guideline.review_status === 'verified'
  ).length
)

const pendingGuidelineCount = computed(() =>
  Math.max(guideGuidelines.value.length - readyGuidelineCount.value, 0)
)

const isGuidePublished = computed(() =>
  selectedGuide.value?.status === 'active' && selectedGuide.value?.review_status === 'verified'
)

const canPublishGuide = computed(() =>
  Boolean(
    selectedGuide.value
    && guideGuidelines.value.length
    && readyGuidelineCount.value === guideGuidelines.value.length
    && !isGuidePublished.value
  )
)

const canToggleGuidePublication = computed(() =>
  Boolean(selectedGuide.value) && (isGuidePublished.value || canPublishGuide.value)
)

const guidePublicationButtonLabel = computed(() =>
  isGuidePublished.value ? 'Unpublish Guide' : 'Publish Guide'
)

const guidePublicationButtonIcon = computed(() =>
  isGuidePublished.value ? 'i-lucide-undo-2' : 'i-lucide-badge-check'
)

const publishReadinessLabel = computed(() => {
  if (!guideGuidelines.value.length) {
    return 'No linked guidelines are ready yet.'
  }

  if (isGuidePublished.value) {
    return 'Guide is active and verified. Unpublish it to move the record back to draft for changes.'
  }

  if (canPublishGuide.value) {
    return `All ${guideGuidelines.value.length} guidelines are active and verified.`
  }

  return `${readyGuidelineCount.value}/${guideGuidelines.value.length} guidelines are active and verified.`
})

const guideMetadataItems = computed(() => {
  const guide = selectedGuide.value
  if (!guide) {
    return []
  }

  const publicationLabel = guide.publication_year?.toString() || formatDate(guide.publication_date)

  return [
    { label: guide.issuing_authority || 'Unspecified authority', icon: 'i-lucide-building-2' },
    { label: guide.region || 'No region', icon: 'i-lucide-globe' },
    { label: guide.language?.toUpperCase() || 'No language', icon: 'i-lucide-languages' },
    { label: publicationLabel, icon: 'i-lucide-calendar-range' },
    { label: `${guideGuidelines.value.length} guidelines`, icon: 'i-lucide-list-checks' },
    { label: `${guideArtifacts.value.length} artifacts`, icon: 'i-lucide-file-stack' },
    { label: `Updated ${formatDate(guide.updated_at)}`, icon: 'i-lucide-clock-3' }
  ]
})

useHead({
  title: computed(() => selectedGuide.value ? `${selectedGuide.value.title} | Dietary Guides` : 'Guide Workspace')
})

useSeoMeta({
  description: computed(() => selectedGuide.value?.description || 'Wisefood guide workspace for review and curation')
})

function normalizeNullable(value: string) {
  const normalized = value.trim()
  return normalized.length ? normalized : null
}

function normalizeNumber(value: string) {
  if (!value.trim()) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeCsv(value: string) {
  return value
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
}

function isoDateFromDateInput(value: string) {
  if (!value.trim()) {
    return null
  }

  return `${value}T00:00:00Z`
}

function dateInputFromIso(value: string | null | undefined) {
  return value ? value.slice(0, 10) : ''
}

function setGuideEditorForm(guide: CatalogGuide) {
  guideForm.title = guide.title
  guideForm.short_title = guide.short_title || ''
  guideForm.description = guide.description
  guideForm.content = guide.content
  guideForm.url = guide.url
  guideForm.region = guide.region || ''
  guideForm.language = guide.language || ''
  guideForm.publication_year = guide.publication_year?.toString() || ''
  guideForm.publication_date = dateInputFromIso(guide.publication_date)
  guideForm.topic = guide.topic || ''
  guideForm.audience = guide.audience || ''
  guideForm.document_type = guide.document_type || ''
  guideForm.issuing_authority = guide.issuing_authority || ''
  guideForm.responsible_ministry = guide.responsible_ministry || ''
  guideForm.legal_status = guide.legal_status || ''
  guideForm.visibility = guide.visibility || ''
  guideForm.applicability_status = guide.applicability_status || ''
  guideForm.tags = guide.tags.join(', ')
  guideForm.target_audiences = guide.target_audiences.join(', ')
  guideForm.evidence_basis = guide.evidence_basis || ''
  guideForm.notes = guide.notes || ''
}

function setArtifactEditorForm(artifact: CatalogArtifact) {
  artifactForm.title = artifact.title
  artifactForm.description = artifact.description || ''
  artifactForm.file_type = artifact.file_type
}

function mergeGuide(updatedGuide: CatalogGuide) {
  selectedGuide.value = updatedGuide
  guideArtifacts.value = updatedGuide.artifacts
}

function mergeArtifact(updatedArtifact: CatalogArtifact) {
  guideArtifacts.value = guideArtifacts.value.map(artifact =>
    artifact.id === updatedArtifact.id ? updatedArtifact : artifact
  )

  if (selectedGuide.value) {
    selectedGuide.value = {
      ...selectedGuide.value,
      artifacts: guideArtifacts.value
    }
  }
}

function extractFilenameFromDisposition(disposition: string | null) {
  if (!disposition) {
    return null
  }

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const plainMatch = disposition.match(/filename="?([^"]+)"?/i)
  return plainMatch?.[1] || null
}

function extensionFromMimeType(mimeType: string) {
  const known: Record<string, string> = {
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/json': 'json',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
  }

  return known[mimeType] || ''
}

function sanitizeFilename(filename: string) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .split('')
    .filter(character => character >= ' ')
    .join('')
}

function buildArtifactFilename(artifact: CatalogArtifact, response: Response) {
  const fromHeader = extractFilenameFromDisposition(response.headers.get('content-disposition'))
  if (fromHeader) {
    return sanitizeFilename(fromHeader)
  }

  const baseName = sanitizeFilename(artifact.title || `artifact-${artifact.id}`)
  const mimeType = (response.headers.get('content-type') || artifact.file_type).split(';')[0]?.trim() || ''
  const extension = extensionFromMimeType(mimeType)

  if (extension && !baseName.toLowerCase().endsWith(`.${extension}`)) {
    return `${baseName}.${extension}`
  }

  return baseName
}

async function fetchS3ArtifactDownloadResponse(artifact: CatalogArtifact) {
  const url = await getArtifactPresignedUrl(artifact)

  return fetch(url)
}

async function downloadArtifact(artifact: CatalogArtifact) {
  downloadingArtifactId.value = artifact.id

  try {
    let response: Response

    if (hasS3Backing(artifact)) {
      try {
        response = await fetchS3ArtifactDownloadResponse(artifact)
      } catch {
        response = await fetchCatalogArtifactDownloadResponse(artifact.id)
      }
    } else {
      response = await fetchCatalogArtifactDownloadResponse(artifact.id)
    }

    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`)
    }

    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = blobUrl
    anchor.download = buildArtifactFilename(artifact, response)
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('[ConsoleGuideDetail] Failed to download artifact:', error)
  } finally {
    downloadingArtifactId.value = ''
  }
}

async function loadGuideDetail(urn: string) {
  if (!urn) {
    detailError.value = 'No guide identifier was provided.'
    selectedGuide.value = null
    return
  }

  detailLoading.value = true
  detailError.value = null

  try {
    const [guide, guidelines] = await Promise.all([
      catalogApi.getGuide(urn),
      catalogApi.fetchGuidelinesByGuide(urn, { limit: 1000, offset: 0 })
    ])

    selectedGuide.value = guide
    guideGuidelines.value = guidelines.sort((left, right) => (left.sequence_no || 0) - (right.sequence_no || 0))
    guideArtifacts.value = guide.artifacts
  } catch (error) {
    console.error('[ConsoleGuideDetail] Failed to load guide detail:', error)
    detailError.value = 'The selected guide could not be loaded in full.'
    selectedGuide.value = null
    guideGuidelines.value = []
    guideArtifacts.value = []
  } finally {
    detailLoading.value = false
  }
}

async function refreshGuide() {
  await loadGuideDetail(resolvedGuideUrn.value)
}

function openGuideEditor() {
  if (!selectedGuide.value) {
    return
  }

  guideEditorTab.value = 'basic'
  setGuideEditorForm(selectedGuide.value)
  guideEditorOpen.value = true
}

function openArtifactEditor(artifact: CatalogArtifact) {
  editingArtifactId.value = artifact.id
  setArtifactEditorForm(artifact)
  artifactEditorOpen.value = true
}

async function saveGuide() {
  if (!selectedGuide.value) {
    return
  }

  const payload: GuideUpdatePayload = {
    title: normalizeNullable(guideForm.title),
    short_title: normalizeNullable(guideForm.short_title),
    description: normalizeNullable(guideForm.description),
    content: normalizeNullable(guideForm.content),
    url: normalizeNullable(guideForm.url),
    region: normalizeNullable(guideForm.region)?.toUpperCase() || null,
    language: normalizeNullable(guideForm.language)?.toLowerCase() || null,
    publication_year: normalizeNumber(guideForm.publication_year),
    publication_date: isoDateFromDateInput(guideForm.publication_date),
    topic: normalizeNullable(guideForm.topic),
    audience: normalizeNullable(guideForm.audience),
    document_type: normalizeNullable(guideForm.document_type),
    issuing_authority: normalizeNullable(guideForm.issuing_authority),
    responsible_ministry: normalizeNullable(guideForm.responsible_ministry),
    legal_status: normalizeNullable(guideForm.legal_status),
    visibility: normalizeNullable(guideForm.visibility) as CatalogVisibility | null,
    applicability_status: normalizeNullable(guideForm.applicability_status) as CatalogApplicabilityStatus | null,
    tags: normalizeCsv(guideForm.tags),
    target_audiences: normalizeCsv(guideForm.target_audiences),
    evidence_basis: normalizeNullable(guideForm.evidence_basis),
    notes: normalizeNullable(guideForm.notes)
  }

  guideSavePending.value = true

  try {
    const updatedGuide = await catalogApi.updateGuide(selectedGuide.value.urn, payload)
    mergeGuide(updatedGuide)
    guideEditorOpen.value = false
    toast.add({
      title: 'Guide updated',
      description: 'The guide record was saved successfully.',
      color: 'success'
    })
  } catch (error) {
    console.error('[ConsoleGuideDetail] Failed to save guide:', error)
    toast.add({
      title: 'Guide update failed',
      description: 'The guide changes could not be saved.',
      color: 'error'
    })
  } finally {
    guideSavePending.value = false
  }
}

async function toggleGuidePublication() {
  if (!selectedGuide.value || !canToggleGuidePublication.value) {
    return
  }

  const wasPublished = isGuidePublished.value
  publishPending.value = true

  try {
    const updatedGuide = await catalogApi.updateGuide(
      selectedGuide.value.urn,
      wasPublished
        ? {
            status: 'draft' as CatalogStatus
          }
        : {
            status: 'active' as CatalogStatus,
            review_status: 'verified' as CatalogReviewStatus
          }
    )

    mergeGuide(updatedGuide)
    toast.add({
      title: wasPublished ? 'Guide unpublished' : 'Guide published',
      description: wasPublished
        ? 'The guide was moved back to draft so it can be revised.'
        : 'The guide is now active and verified.',
      color: 'success'
    })
  } catch (error) {
    console.error('[ConsoleGuideDetail] Failed to toggle guide publication:', error)
    toast.add({
      title: wasPublished ? 'Guide unpublish failed' : 'Guide publish failed',
      description: wasPublished
        ? 'The guide could not be moved back to draft right now.'
        : 'The guide could not be published right now.',
      color: 'error'
    })
  } finally {
    publishPending.value = false
  }
}

async function saveArtifact() {
  if (!editingArtifactId.value) {
    return
  }

  const payload: ArtifactUpdatePayload = {
    file_type: artifactForm.file_type.trim(),
    title: normalizeNullable(artifactForm.title),
    description: normalizeNullable(artifactForm.description)
  }

  artifactSavePending.value = true

  try {
    const updatedArtifact = await catalogApi.updateArtifact(editingArtifactId.value, payload)
    mergeArtifact(updatedArtifact)
    artifactEditorOpen.value = false
    toast.add({
      title: 'Artifact updated',
      description: 'The artifact metadata was saved successfully.',
      color: 'success'
    })
  } catch (error) {
    console.error('[ConsoleGuideDetail] Failed to save artifact:', error)
    toast.add({
      title: 'Artifact update failed',
      description: 'The artifact changes could not be saved.',
      color: 'error'
    })
  } finally {
    artifactSavePending.value = false
  }
}

watch(
  () => route.params.urn,
  (value, previousValue) => {
    const nextUrn = resolveGuideRouteParam(value)
    const previousUrn = resolveGuideRouteParam(previousValue)

    if (!nextUrn || nextUrn === previousUrn) {
      return
    }

    void loadGuideDetail(nextUrn)
  }
)

void loadGuideDetail(resolvedGuideUrn.value)
</script>
