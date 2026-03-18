<template>
  <div>
    <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <UBreadcrumb
        :items="breadcrumbItems"
        class="mb-4"
      />

      <div class="flex flex-col gap-4 py-8 sm:flex-row sm:items-start sm:justify-between">
        <UPageHeader
          title="Dietary Guides"
          description="Search the guide catalog, create new guide records, and open an individual guide workspace."
          :ui="{ root: 'relative py-0 border-b-0' }"
        />

        <UButton
          color="primary"
          icon="i-lucide-plus"
          class="self-start"
          @click="openGuideWizard"
        >
          Add Guide
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
                      Guide Library
                    </h2>
                    <UBadge
                      color="neutral"
                      variant="outline"
                    >
                      {{ resultCountLabel }}
                    </UBadge>
                  </div>
                </div>

                <div class="ml-auto flex flex-wrap gap-2">
                  <UButton
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-refresh-cw"
                    :loading="guidesLoading"
                    @click="refreshGuides"
                  >
                    Sync
                  </UButton>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    :disabled="guidesLoading || !hasActiveFilters"
                    @click="resetFilters"
                  >
                    Reset
                  </UButton>
                </div>
              </div>

              <div class="flex flex-col gap-2 xl:flex-row xl:items-center xl:gap-0">
                <div class="w-full xl:min-w-0 xl:flex-1">
                  <UInput
                    v-model="filters.q"
                    icon="i-lucide-search"
                    placeholder="Search title or authority"
                    @keydown.enter="applyFilters"
                  />
                </div>

                <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:ml-0 xl:flex xl:flex-none">
                  <USelectMenu
                    v-model="filters.region"
                    :items="regionFilterOptions"
                    value-key="value"
                    label-key="label"
                    leading-icon="i-lucide-globe"
                    class="w-full xl:w-36"
                  />
                  <USelectMenu
                    v-model="filters.status"
                    :items="guideStatusFilterOptions"
                    value-key="value"
                    label-key="label"
                    leading-icon="i-lucide-circle-dot"
                    class="w-full xl:w-36"
                  />
                  <USelectMenu
                    v-model="filters.review"
                    :items="guideReviewFilterOptions"
                    value-key="value"
                    label-key="label"
                    leading-icon="i-lucide-badge-check"
                    class="w-full xl:w-40"
                  />
                  <USelectMenu
                    v-model="filters.language"
                    :items="languageFilterOptions"
                    value-key="value"
                    label-key="label"
                    leading-icon="i-lucide-languages"
                    class="w-full xl:w-36"
                  />
                </div>
              </div>
            </div>
          </template>

          <UAlert
            v-if="guidesError"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :title="guidesError"
            class="mx-5 mt-5 sm:mx-6"
          />

          <UTable
            :data="guides"
            :columns="guideColumns"
            :meta="guideTableMeta"
            :loading="guidesLoading"
            sticky="header"
            :on-select="handleGuideRowSelect"
            class="min-h-[32rem]"
          >
            <template #title-cell="{ row }">
              <div class="min-w-[15rem] py-0.5">
                <p class="truncate font-medium text-gray-900 dark:text-white">
                  {{ row.original.title }}
                </p>
                <p class="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                  {{ compactGuideMeta(row.original) }}
                </p>
              </div>
            </template>

            <template #region-cell="{ row }">
              <span class="text-sm text-gray-700 dark:text-gray-200">
                {{ row.original.region || 'Global' }}
              </span>
            </template>

            <template #status-cell="{ row }">
              <UBadge
                :color="statusColor(row.original.status)"
                variant="soft"
              >
                {{ formatEnumLabel(row.original.status) }}
              </UBadge>
            </template>

            <template #review_status-cell="{ row }">
              <UBadge
                :color="reviewStatusColor(row.original.review_status)"
                variant="soft"
              >
                {{ formatEnumLabel(row.original.review_status) }}
              </UBadge>
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
                  :loading="deletePending && guidePendingDeletion?.urn === row.original.urn"
                  @click.stop="promptDeleteGuide(row.original)"
                >
                  Delete
                </UButton>
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  trailing-icon="i-lucide-arrow-right"
                  @click.stop="openGuide(row.original)"
                >
                  Open
                </UButton>
              </div>
            </template>

            <template #empty>
              <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
                <UIcon
                  name="i-lucide-book-open"
                  class="h-8 w-8 text-gray-400"
                />
                <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                  No guides match the current search.
                </p>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Adjust the filters and run the search again.
                </p>
              </div>
            </template>
          </UTable>

          <template #footer>
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div class="flex flex-wrap items-center gap-3">
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  {{ paginationSummary }}
                </p>
              </div>

              <UPagination
                v-if="totalGuides > pageSize"
                v-model:page="page"
                :total="totalGuides"
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
                Delete guide?
              </h3>
              <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                This will permanently remove
                <span class="font-medium text-gray-900 dark:text-white">{{ guidePendingDeletion?.title || 'this guide' }}</span>
                from the system.
              </p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                URN: {{ guidePendingDeletion?.urn || 'Unknown' }}
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
                @click="cancelDeleteGuide"
              >
                Cancel
              </UButton>
              <UButton
                color="error"
                :loading="deletePending"
                @click="confirmDeleteGuide"
              >
                Delete guide
              </UButton>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>

    <UModal
      v-model:open="guideWizardDialogOpen"
      :ui="{ content: 'w-[calc(100vw-2rem)] max-w-5xl' }"
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
                  Add Guide
                </h3>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Create a guide record, attach its PDF, and optionally run FoodScholar extraction with a dry-run import preview.
                </p>
              </div>

              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                :disabled="wizardBusy"
                @click="closeGuideWizard"
              />
            </div>
          </template>

          <div class="space-y-5">
            <div class="grid gap-3 lg:grid-cols-3">
              <div
                v-for="item in guideWizardSteps"
                :key="item.step"
                :class="[
                  'rounded-2xl border p-3.5 transition-colors',
                  item.step === wizardStep
                    ? 'border-primary-300 bg-primary-50/70 dark:border-primary-400/60 dark:bg-primary-500/10'
                    : item.step < wizardStep
                      ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-400/40 dark:bg-emerald-500/10'
                      : 'border-gray-200/80 bg-gray-50/70 dark:border-white/10 dark:bg-white/5'
                ]"
              >
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                      item.step === wizardStep
                        ? 'bg-primary-600 text-white'
                        : item.step < wizardStep
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-gray-200'
                    ]"
                  >
                    <UIcon
                      v-if="item.step < wizardStep"
                      name="i-lucide-check"
                      class="h-4 w-4"
                    />
                    <span v-else>{{ item.step }}</span>
                  </div>

                  <div>
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">
                      {{ item.title }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <UAlert
              v-if="wizardError"
              color="error"
              variant="soft"
              icon="i-lucide-alert-circle"
              :title="wizardError"
            />

            <template v-if="wizardStep === 1">
              <div class="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.9fr)]">
                <div class="space-y-4">
                  <UFormField
                    label="Guide Title"
                    required
                  >
                    <UInput
                      v-model="wizardForm.title"
                      placeholder="e.g. Healthy Eating Guidelines"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    label="Source URL"
                    required
                  >
                    <UInput
                      v-model="wizardForm.url"
                      placeholder="https://..."
                      class="w-full"
                    />
                    <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                      Use the canonical public page or PDF landing page for this guide.
                    </p>
                  </UFormField>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <UFormField label="Issuing Authority">
                      <UInput
                        v-model="wizardForm.issuingAuthority"
                        placeholder="e.g. Department of Health"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Publication Year">
                      <UInput
                        v-model="wizardForm.publicationYear"
                        type="number"
                        placeholder="e.g. 2011"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <UFormField label="Language">
                      <UInput
                        v-model="wizardForm.language"
                        placeholder="e.g. en"
                        class="w-full"
                      />
                      <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                        Optional two-letter ISO language code.
                      </p>
                    </UFormField>

                    <UFormField label="Region">
                      <UInput
                        v-model="wizardForm.region"
                        placeholder="e.g. IE"
                        class="w-full"
                      />
                      <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                        Optional two-letter ISO country code.
                      </p>
                    </UFormField>
                  </div>
                </div>

                <div class="space-y-4">
                  <div class="rounded-2xl border border-gray-200/80 bg-gray-50/80 p-5 dark:border-white/10 dark:bg-white/5">
                    <dl class="space-y-3 text-sm">
                      <div>
                        <dt class="text-gray-500 dark:text-gray-400">
                          Guide URN
                        </dt>
                        <dd class="mt-1 break-all font-medium text-gray-900 dark:text-white">
                          {{ wizardGeneratedUrn }}
                        </dd>
                      </div>
                      <div>
                        <dt class="text-gray-500 dark:text-gray-400">
                          Initial Status
                        </dt>
                        <dd class="mt-1 font-medium text-gray-900 dark:text-white">
                          Draft / Unreviewed / Internal
                        </dd>
                      </div>
                      <div>
                        <dt class="text-gray-500 dark:text-gray-400">
                          Default License
                        </dt>
                        <dd class="mt-1 font-medium text-gray-900 dark:text-white">
                          {{ defaultGuideLicense }}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="wizardStep === 2">
              <div class="space-y-5">
                <div class="rounded-2xl border border-gray-200/80 bg-gray-50/80 p-5 dark:border-white/10 dark:bg-white/5">
                  <div class="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">
                        Draft Guide Created
                      </p>
                      <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        The guide record is ready. Upload the source PDF to attach it as an artifact.
                      </p>
                    </div>

                    <UBadge
                      color="warning"
                      variant="soft"
                    >
                      {{ formatEnumLabel(wizardCreatedGuide?.status || 'draft') }}
                    </UBadge>
                  </div>

                  <dl class="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt class="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                        Guide
                      </dt>
                      <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                        {{ wizardCreatedGuide?.title || 'Untitled guide' }}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                        URN
                      </dt>
                      <dd class="mt-1 break-all text-sm font-medium text-gray-900 dark:text-white">
                        {{ wizardCreatedGuide?.urn || wizardGeneratedUrn }}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div class="rounded-2xl border border-dashed border-gray-300/80 bg-white/80 p-5 dark:border-white/15 dark:bg-white/5">
                  <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">
                        Upload Source PDF
                      </p>
                      <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        The artifact upload uses the catalog artifact-management endpoint and attaches the PDF directly under this guide.
                      </p>
                    </div>

                    <label class="inline-flex cursor-pointer">
                      <span class="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-primary-400 hover:text-primary-700 dark:border-white/15 dark:bg-white/10 dark:text-gray-100 dark:hover:border-primary-400 dark:hover:text-primary-200">
                        <UIcon
                          name="i-lucide-file-up"
                          class="h-4 w-4"
                        />
                        Choose PDF
                      </span>
                      <input
                        :key="wizardFileInputKey"
                        type="file"
                        accept="application/pdf,.pdf"
                        class="hidden"
                        @change="handleGuideWizardPdfSelection"
                      >
                    </label>
                  </div>

                  <div class="mt-4 rounded-xl border border-gray-200/80 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-black/10">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ wizardSelectedPdfLabel }}
                    </p>
                    <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                      {{ wizardSelectedPdfMeta }}
                    </p>
                  </div>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="space-y-5">
                <div class="rounded-2xl border border-gray-200/80 bg-gray-50/80 p-5 dark:border-white/10 dark:bg-white/5">
                  <div class="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">
                        Guide + Artifact Ready
                      </p>
                      <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        The PDF is attached. You can now enqueue FoodScholar extraction. After extraction completes, import the guidelines from the guide page.
                      </p>
                    </div>

                    <UBadge
                      color="neutral"
                      variant="outline"
                    >
                      Artifact {{ wizardUploadedArtifact?.id || 'Pending' }}
                    </UBadge>
                  </div>

                  <dl class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <dt class="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                        Guide
                      </dt>
                      <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                        {{ wizardCreatedGuide?.title || 'Untitled guide' }}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                        Artifact Type
                      </dt>
                      <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                        {{ wizardUploadedArtifact?.file_type || 'application/pdf' }}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                        File Size
                      </dt>
                      <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                        {{ formatBytes(wizardUploadedArtifact?.file_size) }}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                        Uploaded
                      </dt>
                      <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                        {{ formatDate(wizardUploadedArtifact?.created_at) }}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div
                  v-if="!wizardExtractionStarted"
                  class="rounded-2xl border border-primary-200/70 bg-primary-50/80 p-5 dark:border-primary-400/30 dark:bg-primary-500/10"
                >
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">
                    Start rule extraction now?
                  </p>
                  <p class="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    This will enqueue extraction against the uploaded artifact and poll job status while the modal stays open. Importing happens later from the guide page after extraction completes.
                  </p>

                  <div class="mt-4 flex flex-wrap gap-3">
                    <UButton
                      color="primary"
                      :loading="wizardSubmitting"
                      @click="startGuideWizardExtraction"
                    >
                      Start extraction
                    </UButton>
                    <UButton
                      color="neutral"
                      variant="outline"
                      :disabled="wizardBusy"
                      @click="skipGuideWizardExtraction"
                    >
                      Skip for now
                    </UButton>
                  </div>
                </div>

                <template v-else>
                  <div class="rounded-2xl border border-gray-200/80 bg-white/90 p-5 dark:border-white/10 dark:bg-white/5">
                    <div class="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p class="text-sm font-semibold text-gray-900 dark:text-white">
                          Extraction Status
                        </p>
                        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          FoodScholar keeps processing in the backend even if you close this modal.
                        </p>
                      </div>

                      <UBadge
                        :color="extractionStatusColor(wizardExtractionStatus?.status)"
                        variant="soft"
                      >
                        {{ wizardExtractionStatusLabel }}
                      </UBadge>
                    </div>

                    <dl class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <dt class="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                          Progress
                        </dt>
                        <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                          {{ extractionProgressLabel }}
                        </dd>
                      </div>
                      <div>
                        <dt class="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                          Model
                        </dt>
                        <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                          {{ wizardExtractionStatus?.model || 'Pending' }}
                        </dd>
                      </div>
                      <div>
                        <dt class="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                          Unique Rules
                        </dt>
                        <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                          {{ wizardExtractionStatus?.result?.total_unique_guidelines ?? 'Pending' }}
                        </dd>
                      </div>
                      <div>
                        <dt class="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                          Completed
                        </dt>
                        <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                          {{ formatDate(wizardExtractionStatus?.completed_at || wizardExtractionStatus?.result?.extracted_at) }}
                        </dd>
                      </div>
                    </dl>

                    <p
                      v-if="wizardExtractionPolling"
                      class="mt-4 text-xs font-medium uppercase tracking-[0.12em] text-primary-700 dark:text-primary-300"
                    >
                      Refreshing extraction status automatically.
                    </p>
                  </div>

                  <UAlert
                    v-if="wizardExtractionMessage"
                    color="neutral"
                    variant="soft"
                    icon="i-lucide-info"
                    :title="wizardExtractionMessage"
                  />

                  <div
                    v-if="wizardExtractedGuidelinePreview.length"
                    class="rounded-2xl border border-gray-200/80 bg-gray-50/80 p-5 dark:border-white/10 dark:bg-white/5"
                  >
                    <div class="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-semibold text-gray-900 dark:text-white">
                          Extracted Guideline Preview
                        </p>
                        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          Showing the first extracted rules returned by the extraction result.
                        </p>
                      </div>

                      <UBadge
                        color="neutral"
                        variant="outline"
                      >
                        {{ wizardExtractionStatus?.result?.total_guidelines || wizardExtractedGuidelinePreview.length }} total
                      </UBadge>
                    </div>

                    <div class="mt-4 space-y-3">
                      <div
                        v-for="guideline in wizardExtractedGuidelinePreview"
                        :key="`${guideline.page}-${guideline.text}`"
                        class="rounded-xl border border-gray-200/70 bg-white/80 p-3 dark:border-white/10 dark:bg-black/10"
                      >
                        <p class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ guideline.text }}
                        </p>
                        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Page {{ guideline.page }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-2xl border border-primary-200/70 bg-primary-50/80 p-5 dark:border-primary-400/30 dark:bg-primary-500/10">
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">
                      Import from the guide page
                    </p>
                    <p class="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                      {{ wizardImportFollowupMessage }}
                    </p>

                    <div class="mt-4 flex flex-wrap gap-3">
                      <UButton
                        color="primary"
                        variant="soft"
                        icon="i-lucide-arrow-right"
                        :to="wizardGuideRoute"
                      >
                        Open Guide
                      </UButton>
                    </div>
                  </div>
                </template>
              </div>
            </template>
          </div>

          <template #footer>
            <div
              v-if="wizardStep < 3"
              class="flex flex-wrap justify-end gap-2"
            >
              <UButton
                color="neutral"
                variant="ghost"
                :disabled="wizardBusy"
                @click="closeGuideWizard"
              >
                Cancel
              </UButton>
              <UButton
                color="primary"
                :loading="wizardSubmitting"
                @click="submitGuideWizardStep"
              >
                {{ wizardStep === 1 ? 'Create guide' : 'Upload PDF' }}
              </UButton>
            </div>

            <div
              v-else
              class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p class="text-xs leading-5 text-gray-500 dark:text-gray-400">
                {{ wizardExtractionStarted ? 'You can close the modal at any time. Extraction continues in the backend and the draft guide remains available in the catalog.' : 'Skip extraction if you only want to finish guide setup for now.' }}
              </p>

              <UButton
                color="neutral"
                variant="ghost"
                :disabled="wizardBusy"
                @click="wizardExtractionStarted ? finishGuideWizard() : closeGuideWizard()"
              >
                {{ wizardExtractionStarted ? 'Done' : 'Close' }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type {
  CatalogArtifact,
  CatalogFacetBucket,
  CatalogGuide,
  GuideCreatePayload
} from '~/services/catalogApi'
import catalogApi from '~/services/catalogApi'
import foodscholarGuidelinesApi, { type FoodScholarGuidelineExtractionStatus } from '~/services/foodscholarGuidelinesApi'
import { uploadCatalogArtifact } from '~/services/objectStorageApi'
import {
  buildGuideRoutePath,
  formatBytes,
  formatDate,
  formatEnumLabel,
  guideReviewFilterOptions,
  guideStatusFilterOptions,
  reviewStatusColor,
  statusColor
} from '~/utils/consoleGuideCatalog'

definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Dietary Guides'
})

useSeoMeta({
  description: 'Wisefood guide library for browsing and opening individual guide workspaces'
})

const pageSize = 10
const guideFieldList = [
  'urn',
  'title',
  'issuing_authority',
  'publication_year',
  'region',
  'language',
  'status',
  'review_status',
  'updated_at'
]

const route = useRoute()
const router = useRouter()
const toast = useToast()

const guides = ref<CatalogGuide[]>([])
const totalGuides = ref(0)
const guideFacets = ref<Record<string, CatalogFacetBucket[]>>({})
const guidesLoading = ref(false)
const guidesError = ref<string | null>(null)
const deleteModalOpen = ref(false)
const guidePendingDeletion = ref<CatalogGuide | null>(null)
const deletePending = ref(false)
const deleteError = ref<string | null>(null)
const page = ref(1)
let suppressPageWatcher = false
let suppressFilterWatcher = false
let filterRefreshTimeout: ReturnType<typeof setTimeout> | null = null

const filters = reactive({
  q: '',
  region: 'all',
  status: 'all',
  review: 'all',
  language: 'all'
})

const defaultGuideLicense = 'unspecified-oa'
const guideWizardSteps = [
  {
    step: 1,
    title: 'Create Guide'
  },
  {
    step: 2,
    title: 'Upload PDF'
  },
  {
    step: 3,
    title: 'Extract Rules'
  }
]

const wizardOpen = ref(false)
const wizardStep = ref(1)
const wizardSubmitting = ref(false)
const wizardError = ref<string | null>(null)
const wizardNeedsRefresh = ref(false)
const wizardCreatedGuide = ref<CatalogGuide | null>(null)
const wizardUploadedArtifact = ref<CatalogArtifact | null>(null)
const wizardSelectedPdf = ref<File | null>(null)
const wizardFileInputKey = ref(0)
const wizardUrnSeed = ref(createGuideWizardSeed())
const wizardExtractionStarted = ref(false)
const wizardExtractionStatus = ref<FoodScholarGuidelineExtractionStatus | null>(null)
const wizardExtractionMessage = ref<string | null>(null)
const wizardExtractionPolling = ref(false)
let wizardExtractionPollTimeout: ReturnType<typeof setTimeout> | null = null

const wizardForm = reactive({
  title: '',
  url: '',
  issuingAuthority: '',
  publicationYear: '' as string | number,
  language: '',
  region: ''
})

const guideWizardDialogOpen = computed({
  get: () => wizardOpen.value,
  set: (nextOpen: boolean) => {
    if (nextOpen) {
      wizardOpen.value = true
      return
    }

    closeGuideWizard()
  }
})

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
    label: 'Dietary Guides',
    icon: 'i-lucide-book-open-check'
  }
]

const guideColumns = [
  { accessorKey: 'title', header: 'Guide' },
  { accessorKey: 'region', header: 'Region' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'review_status', header: 'Review' },
  { accessorKey: 'updated_at', header: 'Updated' },
  { id: 'actions', header: '', enableSorting: false }
]

const guideTableMeta = computed(() => ({
  class: {
    tr: 'cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5'
  }
}))

const validStatusValues = new Set(guideStatusFilterOptions.map(option => option.value))
const validReviewValues = new Set(guideReviewFilterOptions.map(option => option.value))

const regionFacetBuckets = computed(() => {
  return guideFacets.value.region?.length
    ? guideFacets.value.region
    : deriveGuideFacetBuckets(guide => guide.region)
})

const languageFacetBuckets = computed(() => {
  return guideFacets.value.language?.length
    ? guideFacets.value.language
    : deriveGuideFacetBuckets(guide => guide.language)
})

const regionFilterOptions = computed(() => buildFacetFilterOptions('All regions', regionFacetBuckets.value, filters.region))
const languageFilterOptions = computed(() => buildFacetFilterOptions('All languages', languageFacetBuckets.value, filters.language))

const resultCountLabel = computed(() => {
  return totalGuides.value === 1 ? '1 guide' : `${totalGuides.value.toLocaleString()} guides`
})

const hasActiveFilters = computed(() => {
  return Boolean(
    filters.q.trim()
    || filters.region !== 'all'
    || filters.status !== 'all'
    || filters.review !== 'all'
    || filters.language !== 'all'
  )
})

const paginationSummary = computed(() => {
  if (!totalGuides.value) {
    return 'No guides available'
  }

  const start = ((page.value - 1) * pageSize) + 1
  const end = start + guides.value.length - 1
  return `Showing ${start}-${end} of ${totalGuides.value.toLocaleString()}`
})

const wizardGeneratedUrnSlug = computed(() => buildGuideWizardUrnSlug(wizardForm.title, wizardUrnSeed.value))
const wizardGeneratedUrn = computed(() => `urn:guide:${wizardGeneratedUrnSlug.value}`)

const wizardSelectedPdfLabel = computed(() => {
  return wizardSelectedPdf.value?.name || 'No PDF selected yet'
})

const wizardSelectedPdfMeta = computed(() => {
  if (!wizardSelectedPdf.value) {
    return 'Choose the canonical source PDF for the guide. Only PDF uploads are accepted here.'
  }

  const mime = wizardSelectedPdf.value.type || 'application/pdf'
  return `${formatBytes(wizardSelectedPdf.value.size)} · ${mime}`
})

const wizardExtractionStatusLabel = computed(() => {
  if (wizardExtractionStatus.value?.status) {
    return formatEnumLabel(wizardExtractionStatus.value.status)
  }

  return wizardExtractionPolling.value ? 'Checking Status' : 'Queued'
})

const extractionProgressLabel = computed(() => {
  const currentPage = wizardExtractionStatus.value?.current_page
  const totalPages = wizardExtractionStatus.value?.total_pages

  if (typeof currentPage === 'number' && typeof totalPages === 'number' && totalPages > 0) {
    return `${currentPage} / ${totalPages} pages`
  }

  return wizardExtractionStarted.value ? 'Waiting for progress' : 'Not started'
})

const wizardExtractedGuidelinePreview = computed(() => {
  return wizardExtractionStatus.value?.result?.guidelines.slice(0, 6) || []
})

const wizardImportFollowupMessage = computed(() => {
  const extractionStatus = wizardExtractionStatus.value?.status?.toLowerCase() || ''

  if (extractionStatus === 'succeeded') {
    return 'Extraction is complete. Open the guide page to import the extracted guidelines.'
  }

  if (extractionStatus === 'failed') {
    return 'Extraction failed. You can reopen the guide page later to retry and import once extraction succeeds.'
  }

  if (wizardExtractionStarted.value) {
    return 'After extraction completes, import the guidelines from the guide page.'
  }

  return 'Import happens from the guide page after extraction completes.'
})

const wizardBusy = computed(() => wizardSubmitting.value)

const wizardGuideRoute = computed(() =>
  wizardCreatedGuide.value ? buildGuideRoutePath(wizardCreatedGuide.value.urn) : '/console/assets/guides'
)

function createGuideWizardSeed() {
  const now = new Date()
  const year = now.getUTCFullYear().toString()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const day = String(now.getUTCDate()).padStart(2, '0')
  const hour = String(now.getUTCHours()).padStart(2, '0')
  const minute = String(now.getUTCMinutes()).padStart(2, '0')
  const second = String(now.getUTCSeconds()).padStart(2, '0')
  const millisecond = String(now.getUTCMilliseconds()).padStart(3, '0')

  return `${year}${month}${day}${hour}${minute}${second}${millisecond}`
}

function slugifyGuideTitle(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function buildGuideWizardUrnSlug(title: string, seed: string) {
  const slugBase = slugifyGuideTitle(title) || 'guide'
  const maxBaseLength = Math.max(1, 100 - seed.length - 1)

  return `${slugBase.slice(0, maxBaseLength)}-${seed}`
}

function normalizeLanguageCode(value: string) {
  const normalized = value.trim().toLowerCase()
  return normalized || null
}

function normalizeRegionCode(value: string) {
  const normalized = value.trim().toUpperCase()
  return normalized || null
}

function normalizeTextValue(value: string | number | null | undefined) {
  if (typeof value === 'number') {
    return String(value)
  }

  return typeof value === 'string' ? value.trim() : ''
}

function parsePublicationYear(value: string | number) {
  const trimmed = normalizeTextValue(value)

  if (!trimmed) {
    return null
  }

  const parsed = Number.parseInt(trimmed, 10)
  return Number.isInteger(parsed) ? parsed : null
}

function extractErrorDetail(value: unknown): string | null {
  if (!value) {
    return null
  }

  if (typeof value === 'string' && value.trim()) {
    return value
  }

  if (Array.isArray(value)) {
    const messages = value
      .map(item => {
        if (item && typeof item === 'object' && 'msg' in item && typeof item.msg === 'string') {
          return item.msg
        }

        if (typeof item === 'string') {
          return item
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

function validateGuideWizardStepOne() {
  if (!wizardForm.title.trim()) {
    return 'Guide title is required.'
  }

  if (!wizardForm.url.trim()) {
    return 'Source URL is required.'
  }

  try {
    new URL(wizardForm.url.trim())
  } catch {
    return 'Enter a valid source URL.'
  }

  const language = normalizeLanguageCode(wizardForm.language)
  if (language && !/^[a-z]{2}$/.test(language)) {
    return 'Language must be a two-letter code such as en or el.'
  }

  const region = normalizeRegionCode(wizardForm.region)
  if (region && !/^[A-Z]{2}$/.test(region)) {
    return 'Region must be a two-letter country code such as IE or GR.'
  }

  const publicationYear = normalizeTextValue(wizardForm.publicationYear)
  if (publicationYear && !/^\d{4}$/.test(publicationYear)) {
    return 'Publication year must be a four-digit year.'
  }

  return null
}

function validateGuideWizardStepTwo() {
  if (!wizardSelectedPdf.value) {
    return 'Select a PDF file before continuing.'
  }

  const isPdfMime = wizardSelectedPdf.value.type === 'application/pdf'
  const hasPdfExtension = wizardSelectedPdf.value.name.toLowerCase().endsWith('.pdf')

  if (!isPdfMime && !hasPdfExtension) {
    return 'Only PDF files can be uploaded for guide artifacts.'
  }

  return null
}

function buildGuideCreationPayload(): GuideCreatePayload {
  const title = wizardForm.title.trim()
  const issuingAuthority = wizardForm.issuingAuthority.trim()
  const publicationYear = parsePublicationYear(wizardForm.publicationYear)
  const language = normalizeLanguageCode(wizardForm.language)
  const region = normalizeRegionCode(wizardForm.region)

  return {
    urn: wizardGeneratedUrnSlug.value,
    title,
    description: issuingAuthority ? `${title} published by ${issuingAuthority}.` : title,
    status: 'draft',
    url: wizardForm.url.trim(),
    license: defaultGuideLicense,
    region,
    content: `Guide record created from the console upload wizard for ${title}.`,
    language,
    issuing_authority: issuingAuthority || null,
    review_status: 'unreviewed',
    visibility: 'internal',
    applicability_status: 'unknown',
    publication_year: publicationYear
  }
}

function buildArtifactUploadTitle() {
  return `${wizardCreatedGuide.value?.title || wizardForm.title.trim()} PDF`
}

function clearWizardExtractionPoll() {
  if (wizardExtractionPollTimeout) {
    clearTimeout(wizardExtractionPollTimeout)
    wizardExtractionPollTimeout = null
  }
}

function isTerminalExtractionStatus(status: string | null | undefined) {
  return ['succeeded', 'failed', 'not_found', 'cancelled'].includes((status || '').toLowerCase())
}

function scheduleWizardExtractionPoll() {
  clearWizardExtractionPoll()

  if (!wizardOpen.value || wizardStep.value !== 3 || !wizardExtractionStarted.value) {
    return
  }

  if (isTerminalExtractionStatus(wizardExtractionStatus.value?.status)) {
    return
  }

  wizardExtractionPollTimeout = setTimeout(() => {
    void pollGuideWizardExtraction()
  }, 3000)
}

function extractionStatusColor(status: string | null | undefined) {
  switch ((status || '').toLowerCase()) {
    case 'queued':
    case 'enqueued':
    case 'pending':
    case 'running':
      return 'warning'
    case 'succeeded':
      return 'success'
    case 'failed':
      return 'error'
    default:
      return 'neutral'
  }
}

function resetGuideWizardState() {
  clearWizardExtractionPoll()
  wizardStep.value = 1
  wizardSubmitting.value = false
  wizardError.value = null
  wizardNeedsRefresh.value = false
  wizardCreatedGuide.value = null
  wizardUploadedArtifact.value = null
  wizardSelectedPdf.value = null
  wizardFileInputKey.value += 1
  wizardUrnSeed.value = createGuideWizardSeed()
  wizardExtractionStarted.value = false
  wizardExtractionStatus.value = null
  wizardExtractionMessage.value = null
  wizardExtractionPolling.value = false
  wizardForm.title = ''
  wizardForm.url = ''
  wizardForm.issuingAuthority = ''
  wizardForm.publicationYear = ''
  wizardForm.language = ''
  wizardForm.region = ''
}

function openGuideWizard() {
  resetGuideWizardState()
  wizardOpen.value = true
}

function closeGuideWizard() {
  if (wizardBusy.value) {
    return
  }

  const shouldRefresh = wizardNeedsRefresh.value
  wizardOpen.value = false
  resetGuideWizardState()

  if (shouldRefresh) {
    void loadGuides()
  }
}

function handleGuideWizardPdfSelection(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0] || null

  wizardSelectedPdf.value = file
  wizardError.value = null
}

async function submitGuideWizardStep() {
  if (wizardStep.value === 1) {
    await createGuideWizardRecord()
    return
  }

  if (wizardStep.value === 2) {
    await uploadGuideWizardArtifact()
  }
}

async function createGuideWizardRecord() {
  const validationError = validateGuideWizardStepOne()

  if (validationError) {
    wizardError.value = validationError
    return
  }

  wizardSubmitting.value = true
  wizardError.value = null

  try {
    const guide = await catalogApi.createGuide(buildGuideCreationPayload())
    wizardCreatedGuide.value = guide
    wizardNeedsRefresh.value = true
    wizardStep.value = 2
  } catch (error) {
    console.error('[ConsoleGuidesIndex] Failed to create guide:', error)
    wizardError.value = resolveErrorMessage(error, 'The guide could not be created right now.')
  } finally {
    wizardSubmitting.value = false
  }
}

async function uploadGuideWizardArtifact() {
  const validationError = validateGuideWizardStepTwo()

  if (validationError) {
    wizardError.value = validationError
    return
  }

  if (!wizardCreatedGuide.value || !wizardSelectedPdf.value) {
    wizardError.value = 'Create the guide first and choose a PDF before uploading.'
    return
  }

  wizardSubmitting.value = true
  wizardError.value = null

  try {
    const artifact = await uploadCatalogArtifact({
      parentUrn: wizardCreatedGuide.value.urn,
      file: wizardSelectedPdf.value,
      title: buildArtifactUploadTitle(),
      description: `Source PDF uploaded for ${wizardCreatedGuide.value.title}.`,
      language: normalizeLanguageCode(wizardForm.language)
    })

    wizardUploadedArtifact.value = artifact
    wizardNeedsRefresh.value = true
    wizardStep.value = 3
  } catch (error) {
    console.error('[ConsoleGuidesIndex] Failed to upload guide artifact:', error)
    wizardError.value = resolveErrorMessage(error, 'The source PDF could not be uploaded right now.')
  } finally {
    wizardSubmitting.value = false
  }
}

async function startGuideWizardExtraction() {
  if (!wizardUploadedArtifact.value) {
    wizardError.value = 'Upload a PDF artifact before starting extraction.'
    return
  }

  wizardSubmitting.value = true
  wizardError.value = null
  wizardExtractionMessage.value = null

  try {
    const response = await foodscholarGuidelinesApi.enqueueExtraction(wizardUploadedArtifact.value.id)
    wizardExtractionStarted.value = true

    if (typeof response === 'string') {
      wizardExtractionMessage.value = response
      scheduleWizardExtractionPoll()
      return
    }

    wizardExtractionStatus.value = response
    wizardExtractionMessage.value = response.error || null

    if (!isTerminalExtractionStatus(response.status)) {
      scheduleWizardExtractionPoll()
    }
  } catch (error) {
    console.error('[ConsoleGuidesIndex] Failed to start guide extraction:', error)
    wizardError.value = resolveErrorMessage(error, 'The extraction task could not be started right now.')
  } finally {
    wizardSubmitting.value = false
  }
}

async function pollGuideWizardExtraction() {
  if (!wizardUploadedArtifact.value || !wizardExtractionStarted.value) {
    return
  }

  wizardExtractionPolling.value = true

  try {
    const response = await foodscholarGuidelinesApi.getExtractionStatus(wizardUploadedArtifact.value.id)

    if (typeof response === 'string') {
      wizardExtractionMessage.value = response
      scheduleWizardExtractionPoll()
      return
    }

    wizardExtractionStatus.value = response
    wizardExtractionMessage.value = response.error || null

    if (isTerminalExtractionStatus(response.status)) {
      clearWizardExtractionPoll()
      return
    }

    scheduleWizardExtractionPoll()
  } catch (error) {
    console.error('[ConsoleGuidesIndex] Failed to poll guide extraction status:', error)
    wizardExtractionMessage.value = resolveErrorMessage(error, 'The extraction status could not be refreshed right now.')
    clearWizardExtractionPoll()
  } finally {
    wizardExtractionPolling.value = false
  }
}

function skipGuideWizardExtraction() {
  const description = 'The guide was created and the PDF was uploaded. You can start extraction and import guidelines later from the guide page.'
  closeGuideWizard()
  toast.add({
    title: 'Guide created',
    description,
    color: 'success'
  })
}

function finishGuideWizard() {
  const extractionStatus = wizardExtractionStatus.value?.status?.toLowerCase() || null
  let title = 'Guide workflow saved'
  let description = 'The guide was created and the PDF was uploaded.'
  let color: 'success' | 'warning' = 'success'

  if (extractionStatus === 'succeeded') {
    title = 'Extraction completed'
    description = 'The guide and PDF were saved. Import the extracted guidelines from the guide page.'
  } else if (extractionStatus === 'failed') {
    color = 'warning'
    description = 'The guide and PDF were saved, but the extraction task reported a failure.'
  } else if (extractionStatus) {
    description = `The guide and PDF were saved. Extraction status is ${formatEnumLabel(extractionStatus).toLowerCase()}. Import the guidelines from the guide page after extraction completes.`
  } else if (wizardExtractionMessage.value) {
    description = `The guide and PDF were saved. ${wizardExtractionMessage.value}`
  }

  closeGuideWizard()
  toast.add({
    title,
    description,
    color
  })
}

function firstQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : ''
  }

  return typeof value === 'string' ? value : ''
}

function parsePageQuery(value: unknown) {
  const parsed = Number(firstQueryValue(value))
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function quoteFilterValue(value: string) {
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return /[\s:]/.test(escaped) ? `"${escaped}"` : escaped
}

function buildFacetFilterOptions(label: string, buckets: CatalogFacetBucket[] = [], selectedValue = 'all') {
  const items = buckets
    .slice()
    .sort((left, right) => left.value.localeCompare(right.value))
    .map(bucket => ({
      label: `${bucket.value} (${bucket.count})`,
      value: bucket.value
    }))

  if (selectedValue !== 'all' && selectedValue && !items.some(item => item.value === selectedValue)) {
    items.unshift({
      label: selectedValue,
      value: selectedValue
    })
  }

  return [
    { label, value: 'all' },
    ...items
  ]
}

function deriveGuideFacetBuckets(selector: (guide: CatalogGuide) => string | null | undefined) {
  const counts = new Map<string, number>()

  for (const guide of guides.value) {
    const value = selector(guide)
    if (!value) {
      continue
    }

    counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => left.value.localeCompare(right.value))
}

function compactGuideMeta(guide: CatalogGuide) {
  const parts = [
    guide.issuing_authority,
    guide.publication_year?.toString()
  ].filter(Boolean)

  return parts.length ? parts.join(' · ') : 'No supporting metadata'
}

function buildFilterQueries() {
  const queries: string[] = []

  if (filters.region !== 'all') {
    queries.push(`region:${quoteFilterValue(filters.region)}`)
  }

  if (filters.status !== 'all') {
    queries.push(`status:${quoteFilterValue(filters.status)}`)
  }

  if (filters.review !== 'all') {
    queries.push(`review_status:${quoteFilterValue(filters.review)}`)
  }

  if (filters.language !== 'all') {
    queries.push(`language:${quoteFilterValue(filters.language)}`)
  }

  return queries
}

function buildRouteQuery() {
  return {
    q: filters.q.trim() || undefined,
    region: filters.region !== 'all' ? filters.region : undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    review: filters.review !== 'all' ? filters.review : undefined,
    language: filters.language !== 'all' ? filters.language : undefined,
    page: page.value > 1 ? String(page.value) : undefined
  }
}

function syncRouteQuery() {
  void router.replace({
    query: buildRouteQuery()
  })
}

function setPageWithoutWatcher(nextPage: number) {
  suppressPageWatcher = true
  page.value = nextPage
}

function hydrateStateFromRoute() {
  filters.q = firstQueryValue(route.query.q)
  filters.region = firstQueryValue(route.query.region) || 'all'
  filters.status = validStatusValues.has(firstQueryValue(route.query.status)) ? firstQueryValue(route.query.status) : 'all'
  filters.review = validReviewValues.has(firstQueryValue(route.query.review)) ? firstQueryValue(route.query.review) : 'all'
  filters.language = firstQueryValue(route.query.language) || 'all'
  page.value = parsePageQuery(route.query.page)
}

async function loadGuides() {
  guidesLoading.value = true
  guidesError.value = null

  try {
    const activeQueries = buildFilterQueries()
    const searchQuery = filters.q.trim() || null

    const [tableResponse, facetsResponse] = await Promise.all([
      catalogApi.searchGuides({
        q: searchQuery,
        limit: pageSize,
        offset: (page.value - 1) * pageSize,
        fl: guideFieldList,
        fq: activeQueries.length ? activeQueries : null,
        sort: 'updated_at desc',
        fields: null
      }),
      catalogApi.searchGuides({
        q: searchQuery,
        limit: 1,
        offset: 0,
        fl: null,
        fq: null,
        sort: 'updated_at desc',
        fields: ['region', 'language'],
        facet_limit: 100
      })
    ])

    guides.value = tableResponse.guides
    totalGuides.value = tableResponse.total
    guideFacets.value = facetsResponse.facets

    const totalPages = Math.max(1, Math.ceil(totalGuides.value / pageSize))
    if (page.value > totalPages) {
      setPageWithoutWatcher(totalPages)
      syncRouteQuery()
      return await loadGuides()
    }
  } catch (error) {
    console.error('[ConsoleGuidesIndex] Failed to load guides:', error)
    guidesError.value = 'The guide library could not be loaded right now.'
    guides.value = []
    totalGuides.value = 0
  } finally {
    guidesLoading.value = false
  }
}

async function openGuide(guide: CatalogGuide) {
  await navigateTo({
    path: buildGuideRoutePath(guide.urn),
    query: route.query
  })
}

function promptDeleteGuide(guide: CatalogGuide) {
  guidePendingDeletion.value = guide
  deleteError.value = null
  deleteModalOpen.value = true
}

function cancelDeleteGuide() {
  if (deletePending.value) {
    return
  }

  deleteModalOpen.value = false
  guidePendingDeletion.value = null
  deleteError.value = null
}

async function confirmDeleteGuide() {
  if (!guidePendingDeletion.value) {
    return
  }

  const guideToDelete = guidePendingDeletion.value
  deletePending.value = true
  deleteError.value = null

  try {
    await catalogApi.deleteGuide(guideToDelete.urn)
    deleteModalOpen.value = false
    guidePendingDeletion.value = null
    await loadGuides()
    toast.add({
      title: 'Guide deleted',
      description: 'The dietary guide was removed successfully.',
      color: 'success'
    })
  } catch (error) {
    console.error('[ConsoleGuidesIndex] Failed to delete guide:', error)
    deleteError.value = 'The guide could not be deleted right now.'
  } finally {
    deletePending.value = false
  }
}

function handleGuideRowSelect(_event: Event, row: { original: CatalogGuide }) {
  void openGuide(row.original)
}

function clearScheduledFilterRefresh() {
  if (filterRefreshTimeout) {
    clearTimeout(filterRefreshTimeout)
    filterRefreshTimeout = null
  }
}

function scheduleFilterRefresh() {
  clearScheduledFilterRefresh()

  filterRefreshTimeout = setTimeout(() => {
    syncRouteQuery()
    void loadGuides()
  }, 250)
}

async function applyFilters() {
  if (page.value !== 1) {
    setPageWithoutWatcher(1)
  }

  clearScheduledFilterRefresh()
  syncRouteQuery()
  await loadGuides()
}

async function resetFilters() {
  suppressFilterWatcher = true
  filters.q = ''
  filters.region = 'all'
  filters.status = 'all'
  filters.review = 'all'
  filters.language = 'all'

  if (page.value !== 1) {
    setPageWithoutWatcher(1)
  }

  clearScheduledFilterRefresh()
  syncRouteQuery()
  await loadGuides()
  await nextTick()
  suppressFilterWatcher = false
}

async function refreshGuides() {
  clearScheduledFilterRefresh()
  syncRouteQuery()
  await loadGuides()
}

watch(page, (nextPage, previousPage) => {
  if (suppressPageWatcher) {
    suppressPageWatcher = false
    return
  }

  if (nextPage === previousPage) {
    return
  }

  syncRouteQuery()
  void loadGuides()
})

watch(deleteModalOpen, isOpen => {
  if (isOpen || deletePending.value) {
    return
  }

  guidePendingDeletion.value = null
  deleteError.value = null
})

watch([
  () => filters.q,
  () => filters.region,
  () => filters.status,
  () => filters.review,
  () => filters.language
], () => {
  if (suppressFilterWatcher) {
    return
  }

  if (page.value !== 1) {
    setPageWithoutWatcher(1)
  }

  scheduleFilterRefresh()
})

onMounted(async () => {
  const legacyGuideQuery = firstQueryValue(route.query.guide)

  if (legacyGuideQuery) {
    const { guide, ...restQuery } = route.query
    await navigateTo({
      path: buildGuideRoutePath(legacyGuideQuery),
      query: restQuery
    }, {
      replace: true
    })
    return
  }

  suppressFilterWatcher = true
  hydrateStateFromRoute()
  await loadGuides()
  await nextTick()
  suppressFilterWatcher = false
})

onBeforeUnmount(() => {
  clearScheduledFilterRefresh()
  clearWizardExtractionPoll()
})
</script>
