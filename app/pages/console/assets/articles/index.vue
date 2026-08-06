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
                    color="primary"
                    variant="soft"
                    size="sm"
                    icon="i-lucide-sparkles"
                    :disabled="!selectedUrns.length || bulkEnrichPending"
                    :loading="bulkEnrichPending"
                    @click="enrichSelected"
                  >
                    {{ bulkEnrichLabel }}
                  </UButton>
                  <UButton
                    color="neutral"
                    variant="soft"
                    size="sm"
                    icon="i-lucide-shield-check"
                    :disabled="!canEditPolicy"
                    @click="policyModalOpen = true"
                  >
                    {{ policyButtonLabel }}
                  </UButton>
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

          <UAlert
            v-if="enrichmentError"
            color="warning"
            variant="soft"
            icon="i-lucide-alert-circle"
            :title="enrichmentError"
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
              <template #select-header>
                <UCheckbox
                  :model-value="selectAllState"
                  aria-label="Select all articles on this page"
                  @update:model-value="toggleSelectAll"
                  @click.stop
                />
              </template>

              <template #select-cell="{ row }">
                <UCheckbox
                  :model-value="isSelected(row.original.urn)"
                  :aria-label="`Select ${row.original.title}`"
                  @update:model-value="toggleSelected(row.original.urn)"
                  @click.stop
                />
              </template>

              <template #title-cell="{ row }">
                <div class="w-[30rem] max-w-[30rem] py-0.5">
                  <div class="flex items-center gap-2">
                    <p class="truncate font-medium text-gray-900 dark:text-white">
                      {{ row.original.title }}
                    </p>
                    <UBadge
                      v-if="readerVisibilityBadge(row.original)"
                      :color="readerVisibilityBadge(row.original)!.color"
                      variant="soft"
                      size="sm"
                      class="shrink-0 whitespace-nowrap"
                    >
                      <UIcon
                        :name="readerVisibilityBadge(row.original)!.icon"
                        class="mr-1 h-3 w-3"
                      />
                      {{ readerVisibilityBadge(row.original)!.label }}
                    </UBadge>
                    <UBadge
                      v-if="indexingTierBadge(row.original)"
                      :color="indexingTierBadge(row.original)!.color"
                      :variant="indexingTierBadge(row.original)!.editorial ? 'soft' : 'outline'"
                      size="sm"
                      class="shrink-0 whitespace-nowrap"
                    >
                      <UIcon
                        v-if="indexingTierBadge(row.original)!.icon"
                        :name="indexingTierBadge(row.original)!.icon!"
                        class="mr-1 h-3 w-3"
                      />
                      {{ indexingTierBadge(row.original)!.label }}
                    </UBadge>
                  </div>
                  <p class="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {{ compactArticleMeta(row.original) }}
                  </p>
                </div>
              </template>

              <template #enrichment-cell="{ row }">
                <div class="flex flex-col items-start gap-1">
                  <UBadge
                    :color="rowEnrichment(row.original).color"
                    variant="soft"
                    class="whitespace-nowrap"
                  >
                    <UIcon
                      :name="rowEnrichment(row.original).icon"
                      class="mr-1 h-3 w-3"
                      :class="{ 'animate-spin': rowEnrichment(row.original).active }"
                    />
                    {{ rowEnrichment(row.original).label }}
                  </UBadge>
                  <span
                    v-if="rowEnrichedAt(row.original)"
                    class="text-[11px] text-gray-500 dark:text-gray-400"
                  >
                    {{ formatEnrichmentTimestamp(rowEnrichedAt(row.original)) }}
                  </span>
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
                    color="primary"
                    variant="ghost"
                    size="sm"
                    icon="i-lucide-sparkles"
                    :loading="isEnrichPending(row.original.urn)"
                    :disabled="rowEnrichment(row.original).active"
                    @click.stop="enrichRow(row.original)"
                  >
                    {{ rowEnrichActionLabel(row.original) }}
                  </UButton>
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
                v-if="paginationTotal > pageSize"
                v-model:page="page"
                :total="paginationTotal"
                :items-per-page="pageSize"
                :sibling-count="1"
                show-edges
              />
              <p
                v-if="resultsWindowExceeded"
                class="text-xs text-gray-500 dark:text-gray-400 text-center mt-1"
              >
                Only the first {{ paginationTotal.toLocaleString() }} of
                {{ totalArticles.toLocaleString() }} results are browsable. Refine
                your filters to narrow the set.
              </p>
            </div>
          </template>
        </UCard>

        <ConsoleArticlesEnrichmentWorkerCard
          :status="workerStatus"
          :worker-loading="workerLoading"
          :pause-pending="pausePending"
          :restart-pending="restartPending"
          @refresh="loadWorkerStatus()"
          @pause="toggleSweeper(true)"
          @resume="toggleSweeper(false)"
          @restart="restartEnrichmentWorkers()"
        />
      </UPageBody>
    </UPage>

    <ConsoleArticlesArticlePolicyModal
      v-model:open="policyModalOpen"
      :selected-urns="selectedUrns"
      :query="filters.q.trim() || null"
      :filters="buildSearchFilters()"
      :query-total="totalArticles"
      @applied="onPolicyApplied"
    />

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

            <!-- Identity -->
            <section class="space-y-4">
              <h4 class="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                Identity
              </h4>

              <UFormField
                label="Article title"
                required
              >
                <UInput
                  v-model="createForm.title"
                  placeholder="e.g. Mediterranean diet and cardiovascular outcomes"
                  class="w-full"
                  autofocus
                />
              </UFormField>

              <UFormField
                label="URN slug"
                required
                :error="urnFieldError"
                help="Lowercase letters, numbers and dashes. Generated from the title until you edit it."
              >
                <UInput
                  v-model="createForm.urn"
                  placeholder="mediterranean-diet-cardiovascular-outcomes"
                  class="w-full"
                  @update:model-value="markCreateUrnAsEdited"
                >
                  <template #leading>
                    <span class="text-xs text-gray-400 dark:text-gray-500">urn:article:</span>
                  </template>
                </UInput>
              </UFormField>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField
                  label="Venue"
                  required
                  help="Journal, publisher or source."
                >
                  <UInputMenu
                    v-model="createForm.venue"
                    :items="venueOptions"
                    value-key="value"
                    label-key="label"
                    create-item="always"
                    placeholder="e.g. The Lancet"
                    class="w-full"
                    @create="createForm.venue = String($event).trim()"
                  />
                </UFormField>

                <UFormField
                  label="Publication year"
                  :error="publicationYearError"
                >
                  <UInput
                    v-model="createForm.publicationYear"
                    type="number"
                    inputmode="numeric"
                    :min="1500"
                    :max="currentYear + 1"
                    placeholder="e.g. 2022"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <UFormField
                label="Authors"
                required
                help="Order is preserved. Paste a comma- or newline-separated list to add several at once."
              >
                <ConsoleArticleTokenInput
                  v-model="createForm.authors"
                  label="author"
                  ordered
                  placeholder="Surname, Initials — then press Enter"
                  empty-text="No authors added yet."
                />
              </UFormField>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField
                  label="Canonical URL"
                  :error="urlFieldError"
                >
                  <UInput
                    v-model="createForm.url"
                    type="url"
                    placeholder="https://..."
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="DOI">
                  <UInput
                    v-model="createForm.doi"
                    placeholder="10.1016/j.example.2022.01.001"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </section>

            <USeparator />

            <!-- Content -->
            <section class="space-y-4">
              <h4 class="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                Content
              </h4>

              <UFormField
                label="Abstract"
                required
                :help="`${createForm.abstract.length.toLocaleString()} / 15,000 characters`"
              >
                <UTextarea
                  v-model="createForm.abstract"
                  :rows="5"
                  :maxlength="15000"
                  placeholder="Paste the article abstract — this seeds enrichment and retrieval."
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Body text"
                help="Optional. Falls back to the abstract when left empty."
              >
                <UTextarea
                  v-model="createForm.content"
                  :rows="6"
                  placeholder="Full text or curation notes"
                  class="w-full"
                />
              </UFormField>
            </section>

            <USeparator />

            <!-- Classification -->
            <section class="space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                  Classification
                </h4>
                <span class="text-xs text-gray-400 dark:text-gray-500">
                  All optional — refine later in the workspace
                </span>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="Category">
                  <UInputMenu
                    v-model="createForm.category"
                    :items="categorySelectOptions"
                    value-key="value"
                    label-key="label"
                    create-item="always"
                    placeholder="Select or type a category"
                    class="w-full"
                    @create="createForm.category = String($event).trim()"
                  />
                </UFormField>

                <UFormField label="Study type">
                  <UInputMenu
                    v-model="createForm.studyType"
                    :items="studyTypeSelectOptions"
                    value-key="value"
                    label-key="label"
                    create-item="always"
                    placeholder="Select or type a study type"
                    class="w-full"
                    @create="createForm.studyType = String($event).trim()"
                  />
                </UFormField>

                <UFormField label="Reader group">
                  <UInputMenu
                    v-model="createForm.readerGroup"
                    :items="readerGroupSelectOptions"
                    value-key="value"
                    label-key="label"
                    create-item="always"
                    placeholder="Who is this for?"
                    class="w-full"
                    @create="createForm.readerGroup = String($event).trim()"
                  />
                </UFormField>

                <UFormField label="Age group">
                  <UInputMenu
                    v-model="createForm.ageGroup"
                    :items="ageGroupSelectOptions"
                    value-key="value"
                    label-key="label"
                    create-item="always"
                    placeholder="Population age range"
                    class="w-full"
                    @create="createForm.ageGroup = String($event).trim()"
                  />
                </UFormField>

                <UFormField label="Region">
                  <UInputMenu
                    v-model="createForm.region"
                    :items="regionSelectOptions"
                    value-key="value"
                    label-key="label"
                    create-item="always"
                    placeholder="Geographic scope"
                    class="w-full"
                    @create="createForm.region = String($event).trim()"
                  />
                </UFormField>

                <UFormField label="Language">
                  <USelectMenu
                    v-model="createForm.language"
                    :items="languageOptions"
                    value-key="value"
                    label-key="label"
                    placeholder="Language"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <UFormField
                label="Tags"
                help="Up to 50. Existing tags are suggested as you type."
              >
                <ConsoleArticleTokenInput
                  v-model="createForm.tags"
                  label="tag"
                  :suggestions="tagSelectOptions"
                  :max="50"
                  placeholder="Add a tag"
                  empty-text="No tags added yet."
                />
              </UFormField>

              <UFormField
                label="Topics"
                help="Broader subject areas, used for browsing and retrieval."
              >
                <ConsoleArticleTokenInput
                  v-model="createForm.topics"
                  label="topic"
                  :suggestions="topicSelectOptions"
                  :max="100"
                  placeholder="Add a topic"
                  empty-text="No topics added yet."
                />
              </UFormField>
            </section>

            <USeparator />

            <!-- Access -->
            <section class="space-y-4">
              <h4 class="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                Access
              </h4>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="Licence">
                  <USelectMenu
                    v-model="createForm.license"
                    :items="licenseOptions"
                    value-key="value"
                    label-key="label"
                    placeholder="Select a licence"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Open access">
                  <USelectMenu
                    v-model="createForm.openAccess"
                    :items="openAccessOptions"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <UFormField
                label="Reader visibility"
                help="Controls who can read this article once it is published."
              >
                <USelectMenu
                  v-model="createForm.readerVisibility"
                  :items="readerVisibilityOptions"
                  value-key="value"
                  label-key="label"
                  class="w-full"
                />
              </UFormField>
            </section>
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
                :disabled="!createFormValid"
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
import type { Article, ArticlePolicyResult, CreateArticleRequest } from '~/services/articlesApi'
import articlesApi, {
  INDEXING_TIER_LABELS,
  READER_VISIBILITY_LABELS,
  effectiveIndexingTier,
  effectiveReaderVisibility
} from '~/services/articlesApi'
import { navigableTotal } from '~/composables/useArticles'
import { useArticleEnrichment } from '~/composables/useArticleEnrichment'
import {
  articleSortOptions,
  buildArticleRoutePath,
  formatConsolePublicationYear as formatPublicationYear,
  getDisplayArticleCategory,
  mergeFacetBuckets,
  normalizeFacetBuckets,
  slugifyArticleUrn
} from '~/utils/consoleArticles'
import ConsoleArticleTokenInput from '~/components/console/ArticleTokenInput.vue'
// Aliased as `*Vocabulary`: the identifiers without the suffix are already the
// filter bar's "All categories"-style dropdown lists on this page, which are a
// different thing from the curated suggestions offered when creating a record.
import {
  ageGroupOptions as ageGroupVocabulary,
  categoryOptions as categoryVocabulary,
  languageOptions,
  licenseOptions,
  mergeVocabularyWithFacet,
  openAccessOptions,
  readerGroupOptions as readerGroupVocabulary,
  readerVisibilityOptions,
  regionOptions as regionVocabulary,
  studyTypeOptions as studyTypeVocabulary
} from '~/utils/consoleArticleVocabulary'
import {
  enrichmentBadge,
  formatEnrichmentTimestamp,
  hasEnrichmentOnRecord
} from '~/utils/consoleEnrichment'
import { formatConsoleDate as formatDate } from '~/utils/consoleGuideCatalog'
import { assetSectionBreadcrumb } from '~/utils/consoleBreadcrumbs'

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
// Drives both the filter bar and the create form's suggestions, so the options
// an editor is offered are the values the corpus actually contains.
const facetFields = [
  'category',
  'ai_category',
  'study_type',
  'reader_group',
  'region',
  'age_group',
  'venue',
  'tags',
  'ai_tags',
  'topics'
]

const articles = ref<Article[]>([])
const totalArticles = ref(0)
const maxResultWindow = ref(10000)
const articlesLoading = ref(false)
const articlesError = ref<string | null>(null)

// Total fed to the pager: clamped to the result window so navigation never
// requests an offset the backend rejects. The real total is shown separately.
const paginationTotal = computed(() =>
  navigableTotal(totalArticles.value, pageSize, maxResultWindow.value)
)
const resultsWindowExceeded = computed(
  () => totalArticles.value > paginationTotal.value
)

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

/**
 * Create-form state.
 *
 * Array fields are held as arrays, not as comma-separated strings: the API
 * types them as `string[]`, so keeping them as strings meant every save had to
 * guess where one value ended and the next began.
 */
const createForm = reactive({
  title: '',
  urn: '',
  venue: '',
  authors: [] as string[],
  publicationYear: '',
  abstract: '',
  content: '',
  url: '',
  doi: '',
  category: '',
  studyType: '',
  readerGroup: '',
  ageGroup: '',
  region: '',
  language: '',
  license: '',
  openAccess: 'unknown',
  readerVisibility: 'public',
  tags: [] as string[],
  topics: [] as string[]
})

const currentYear = new Date().getFullYear()

// --- Inline validation ------------------------------------------------------
// Shown as the editor types, so an invalid value is caught before the request
// rather than surfacing as a 422 alert at the top of the modal.

const urnFieldError = computed(() => {
  const value = createForm.urn.trim()
  if (!value) return undefined
  // Mirrors the API's SlugStr pattern.
  return /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(value)
    ? undefined
    : 'Use lowercase letters, numbers, dashes or underscores.'
})

const publicationYearError = computed(() => {
  const value = createForm.publicationYear.trim()
  if (!value) return undefined
  const year = Number(value)
  if (!/^\d{4}$/.test(value) || Number.isNaN(year)) return 'Enter a 4-digit year.'
  if (year < 1500 || year > currentYear + 1) return `Enter a year between 1500 and ${currentYear + 1}.`
  return undefined
})

const urlFieldError = computed(() => {
  const value = createForm.url.trim()
  if (!value) return undefined
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? undefined
      : 'Use an http or https URL.'
  } catch {
    return 'Enter a valid URL, including https://'
  }
})

const createFormValid = computed(() =>
  Boolean(createForm.title.trim())
  && Boolean(createForm.urn.trim())
  && Boolean(createForm.venue.trim())
  && createForm.authors.length > 0
  && Boolean(createForm.abstract.trim())
  && !urnFieldError.value
  && !publicationYearError.value
  && !urlFieldError.value
)

// --- Option lists: curated vocabulary merged with what the corpus already uses

const venueOptions = computed(() =>
  mergeVocabularyWithFacet([], normalizeFacetBuckets(facets.value.venue))
)
const categorySelectOptions = computed(() =>
  mergeVocabularyWithFacet(
    categoryVocabulary,
    mergeFacetBuckets(facets.value.category, facets.value.ai_category)
  )
)
const studyTypeSelectOptions = computed(() =>
  mergeVocabularyWithFacet(studyTypeVocabulary, normalizeFacetBuckets(facets.value.study_type))
)
const readerGroupSelectOptions = computed(() =>
  mergeVocabularyWithFacet(readerGroupVocabulary, normalizeFacetBuckets(facets.value.reader_group))
)
const ageGroupSelectOptions = computed(() =>
  mergeVocabularyWithFacet(ageGroupVocabulary, normalizeFacetBuckets(facets.value.age_group))
)
const regionSelectOptions = computed(() =>
  mergeVocabularyWithFacet(regionVocabulary, normalizeFacetBuckets(facets.value.region))
)
const tagSelectOptions = computed(() =>
  mergeVocabularyWithFacet([], mergeFacetBuckets(facets.value.tags, facets.value.ai_tags))
)
const topicSelectOptions = computed(() =>
  mergeVocabularyWithFacet([], normalizeFacetBuckets(facets.value.topics))
)

const articleColumns = [
  { id: 'select', header: '', enableSorting: false },
  { accessorKey: 'title', header: 'Article' },
  { id: 'enrichment', header: 'Enrichment', enableSorting: false },
  { accessorKey: 'updated_at', header: 'Updated' },
  { id: 'actions', header: '', enableSorting: false }
]

// --------------------------------------------------------------------------- #
// Selective enrichment
// --------------------------------------------------------------------------- #

const {
  workerStatus,
  workerLoading,
  pausePending,
  restartPending,
  error: enrichmentError,
  statusFor,
  isPending: isEnrichPending,
  loadStatuses,
  loadWorkerStatus,
  setSweeperPaused,
  restartWorkers,
  enrichArticle,
  enrichArticles
} = useArticleEnrichment()

const selectedUrns = ref<string[]>([])
const bulkEnrichPending = ref(false)

const policyModalOpen = ref(false)

// Policy can be applied to ticked rows, or to everything the current search
// matches. With neither, there is nothing to scope a change to.
const canEditPolicy = computed(
  () => selectedUrns.value.length > 0 || Boolean(filters.q.trim()) || buildSearchFilters().length > 0
)

const policyButtonLabel = computed(() =>
  selectedUrns.value.length
    ? `Policy for ${selectedUrns.value.length} selected`
    : 'Editorial policy'
)

function onPolicyApplied(result: ArticlePolicyResult) {
  toast.add({
    title: `Editorial policy updated for ${result.updated} article${result.updated === 1 ? '' : 's'}`,
    description: result.capped
      ? `Capped at ${result.max_docs}; ${result.matched - result.updated} matching articles were left unchanged.`
      : undefined,
    color: result.capped ? 'warning' : 'success'
  })
  selectedUrns.value = []
  refreshArticles()
}

function readerVisibilityBadge(article: Article) {
  const visibility = effectiveReaderVisibility(article)
  if (visibility === 'public') return null
  return {
    label: READER_VISIBILITY_LABELS[visibility],
    color: visibility === 'hidden' ? 'error' as const : 'warning' as const,
    icon: visibility === 'hidden' ? 'i-lucide-eye-off' : 'i-lucide-graduation-cap'
  }
}

function indexingTierBadge(article: Article) {
  const tier = effectiveIndexingTier(article)
  if (!tier || tier === 'supportive') return null
  const editorial = Boolean(article.indexing_tier)
  return {
    label: INDEXING_TIER_LABELS[tier],
    // Only an editor's choice is highlighted; an agent proposal stays quiet.
    color: tier === 'prime' && editorial ? 'primary' as const : 'neutral' as const,
    icon: tier === 'prime' ? 'i-lucide-star' : undefined,
    editorial
  }
}

const bulkEnrichLabel = computed(() =>
  selectedUrns.value.length
    ? `Enrich ${selectedUrns.value.length} selected`
    : 'Enrich selected'
)

// Tri-state header checkbox: 'indeterminate' when only some rows are picked.
const selectAllState = computed<boolean | 'indeterminate'>(() => {
  if (!articles.value.length) return false
  const selectedOnPage = articles.value.filter(article => selectedUrns.value.includes(article.urn))
  if (!selectedOnPage.length) return false
  return selectedOnPage.length === articles.value.length ? true : 'indeterminate'
})

function isSelected(urn: string) {
  return selectedUrns.value.includes(urn)
}

function toggleSelected(urn: string) {
  selectedUrns.value = isSelected(urn)
    ? selectedUrns.value.filter(entry => entry !== urn)
    : [...selectedUrns.value, urn]
}

function toggleSelectAll() {
  const pageUrns = articles.value.map(article => article.urn)
  selectedUrns.value = selectAllState.value === true
    ? selectedUrns.value.filter(urn => !pageUrns.includes(urn))
    : Array.from(new Set([...selectedUrns.value, ...pageUrns]))
}

function rowEnrichedAt(article: Article) {
  return statusFor(article.urn)?.result?.enriched_at || article.extras?.enriched_at || null
}

function rowEnrichment(article: Article) {
  const status = statusFor(article.urn)

  // Redis job records expire; `extras.enriched_at` is the durable evidence, so
  // an article the console has never queued still reads as enriched.
  if (!status || status.status === 'not_found') {
    return hasEnrichmentOnRecord(status, article.extras?.enriched_at)
      ? enrichmentBadge('succeeded')
      : enrichmentBadge('not_found')
  }

  return enrichmentBadge(status.status)
}

function rowEnrichActionLabel(article: Article) {
  return hasEnrichmentOnRecord(statusFor(article.urn), article.extras?.enriched_at)
    ? 'Re-enrich'
    : 'Enrich'
}

async function refreshEnrichmentStatuses() {
  const urns = articles.value.map(article => article.urn).filter(Boolean)
  if (!urns.length) return
  await loadStatuses(urns, { silent: true })
}

async function enrichRow(article: Article) {
  // Re-running an already-enriched article needs force, or the sweeper's
  // processed set makes it a no-op.
  const force = hasEnrichmentOnRecord(statusFor(article.urn), article.extras?.enriched_at)

  try {
    await enrichArticle(article.urn, force)
    toast.add({
      title: force ? 'Re-enrichment queued' : 'Enrichment queued',
      description: `${article.title} was handed to FoodScholar.`,
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Could not queue enrichment',
      description: enrichmentError.value || 'FoodScholar rejected the request.',
      color: 'error'
    })
  }
}

async function enrichSelected() {
  if (!selectedUrns.value.length) return

  bulkEnrichPending.value = true
  try {
    const targets = [...selectedUrns.value]
    const response = await enrichArticles(targets, true)
    toast.add({
      title: 'Enrichment queued',
      description: `${response.total} article${response.total === 1 ? '' : 's'} handed to FoodScholar.`,
      color: 'success'
    })
    selectedUrns.value = []
    void loadWorkerStatus({ silent: true })
  } catch {
    toast.add({
      title: 'Could not queue enrichment',
      description: enrichmentError.value || 'FoodScholar rejected the request.',
      color: 'error'
    })
  } finally {
    bulkEnrichPending.value = false
  }
}

async function toggleSweeper(paused: boolean) {
  try {
    await setSweeperPaused(paused)
    toast.add({
      title: paused ? 'Sweeper paused' : 'Sweeper resumed',
      description: paused
        ? 'Automatic catalog enrichment is stopped. Selective enrichment still works.'
        : 'FoodScholar resumed its automatic pass over the catalog.',
      color: paused ? 'warning' : 'success'
    })
  } catch {
    toast.add({
      title: 'Could not change the sweeper',
      description: enrichmentError.value || 'FoodScholar rejected the request.',
      color: 'error'
    })
  }
}

/**
 * Bring the workers back up.
 *
 * The report is deliberately specific about *what* was wrong — a stale pause
 * and a dead thread need the same action but mean different things, and only
 * the response can tell them apart after the fact.
 */
async function restartEnrichmentWorkers() {
  try {
    const response = await restartWorkers()
    const notes: string[] = []

    if (response.sweeper?.pause_switch_was_set) {
      notes.push('cleared a stale pause')
    }
    if (response.sweeper?.thread_was_alive === false) {
      notes.push('rebuilt the dead sweeper thread')
    }
    if (response.jobs?.thread_was_alive === false) {
      notes.push('rebuilt the dead job worker thread')
    }
    if (response.sweeper?.reason) {
      notes.push(response.sweeper.reason)
    }
    if (response.jobs?.reason) {
      notes.push(response.jobs.reason)
    }

    toast.add({
      title: 'Enrichment workers restarted',
      description: notes.length
        ? `FoodScholar ${notes.join(', ')}.`
        : 'Both workers were already healthy and have been restarted anyway.',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Could not restart the workers',
      description: enrichmentError.value || 'FoodScholar rejected the request.',
      color: 'error'
    })
  }
}

const breadcrumbItems = assetSectionBreadcrumb('articles')

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
    // Clamp the offset to the result window so a stale/high page number can't
    // request a window the backend rejects.
    const maxOffset = Math.max(0, maxResultWindow.value - pageSize)
    const offset = Math.min((page.value - 1) * pageSize, maxOffset)

    const response = await articlesApi.searchArticles({
      q: filters.q.trim() || null,
      limit: pageSize,
      offset,
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
        'updated_at',
        // Editorial controls. Absent on articles indexed before these fields
        // existed, which the badge helpers read as "public, untiered".
        'reader_visibility',
        'indexing_tier',
        'ai_indexing_tier',
        // Carries `enriched_at`, which is the durable record of a past
        // enrichment even after the Redis job record has expired.
        'extras'
      ]
    })

    articles.value = response.result.results || []
    totalArticles.value = response.result.total || 0
    maxResultWindow.value = response.result.max_result_window ?? maxResultWindow.value

    if (Object.keys(facets.value).length === 0 && response.result.facets) {
      facets.value = response.result.facets
    }

    void refreshEnrichmentStatuses()
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
  createForm.authors = []
  createForm.publicationYear = ''
  createForm.abstract = ''
  createForm.content = ''
  createForm.url = ''
  createForm.doi = ''
  createForm.category = ''
  createForm.studyType = ''
  createForm.readerGroup = ''
  createForm.ageGroup = ''
  createForm.region = ''
  createForm.language = ''
  createForm.license = ''
  createForm.openAccess = 'unknown'
  createForm.readerVisibility = 'public'
  createForm.tags = []
  createForm.topics = []
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
    const authors = createForm.authors

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
      publication_year: buildPublicationYearDate(createForm.publicationYear)
    }

    // Optional fields are omitted rather than sent empty: the API is
    // extra="forbid" with typed values, so an empty string where it expects an
    // enum or a URL is a 422 rather than "unset".
    const optionalStrings = {
      url: createForm.url,
      doi: createForm.doi,
      category: createForm.category,
      study_type: createForm.studyType,
      reader_group: createForm.readerGroup,
      age_group: createForm.ageGroup,
      region: createForm.region,
      language: createForm.language,
      license: createForm.license
    } as const

    for (const [key, raw] of Object.entries(optionalStrings)) {
      const value = normalizeNullable(raw)
      if (value) (payload as unknown as Record<string, unknown>)[key] = value
    }

    if (createForm.tags.length) payload.tags = createForm.tags
    if (createForm.topics.length) payload.topics = createForm.topics
    if (createForm.openAccess !== 'unknown') {
      payload.open_access = createForm.openAccess === 'true'
    }
    if (createForm.readerVisibility && createForm.readerVisibility !== 'public') {
      ;(payload as unknown as Record<string, unknown>).reader_visibility = createForm.readerVisibility
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
  void loadWorkerStatus()
})
</script>
