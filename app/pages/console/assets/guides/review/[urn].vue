<template>
  <div>
    <UPage class="mx-auto max-w-[100rem] px-4 py-8 sm:px-6 lg:px-8">
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
                color="neutral"
                variant="outline"
              >
                Guideline Review
              </UBadge>
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
          </div>

          <div class="flex flex-wrap items-center justify-end gap-2 xl:max-w-2xl">
            <USelectMenu
              v-if="reviewArtifactOptions.length"
              v-model="selectedArtifactId"
              :items="reviewArtifactOptions"
              value-key="value"
              label-key="label"
              icon="i-lucide-file-text"
              class="min-w-72"
            />

            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-refresh-cw"
              :loading="detailLoading || pdfLoading"
              @click="refreshReview"
            >
              Refresh
            </UButton>

            <UButton
              v-if="!isGuideActive"
              color="neutral"
              variant="outline"
              icon="i-lucide-plus"
              :disabled="!canCreateGuideline"
              @click="openCreateGuidelineModal"
            >
              Add Guideline
            </UButton>

            <UButton
              v-if="!isGuideActive && selectedGuidelineCount"
              color="primary"
              variant="soft"
              icon="i-lucide-check-check"
              :disabled="!selectedGuidelinesNeedApproval"
              :loading="bulkApprovePending"
              @click="approveSelectedGuidelines"
            >
              Approve Selected
            </UButton>

            <UButton
              v-if="!isGuideActive && selectedGuidelineCount"
              color="error"
              variant="soft"
              icon="i-lucide-trash-2"
              :disabled="guidelineDeletePending"
              @click="promptSelectedGuidelinesDelete"
            >
              Discard Selected
            </UButton>

            <UButton
              v-if="!isGuideActive"
              color="primary"
              :variant="allPageGuidelinesApproved ? 'outline' : 'soft'"
              icon="i-lucide-badge-check"
              :disabled="!pageGuidelinesTotal || allPageGuidelinesApproved"
              :loading="bulkApprovePending"
              @click="approveCurrentPage"
            >
              {{ pageApprovalButtonLabel }}
            </UButton>
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
          <div class="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.95fr)]">
            <UCard
              :ui="{ body: 'p-5 sm:p-6' }"
              class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
            >
              <div class="space-y-4">
                <div class="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
                <div class="h-[36rem] animate-pulse rounded-2xl bg-gray-200 dark:bg-white/10" />
              </div>
            </UCard>

            <UCard
              :ui="{ body: 'p-5 sm:p-6' }"
              class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
            >
              <div class="space-y-4">
                <div class="h-8 w-40 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
                <div class="h-[36rem] animate-pulse rounded-2xl bg-gray-200 dark:bg-white/10" />
              </div>
            </UCard>
          </div>
        </template>

        <template v-else-if="selectedGuide">
          <div class="grid items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.95fr)]">
            <UCard
              :ui="{ body: 'p-5 sm:p-6' }"
              class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
            >
              <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/80 pb-4 dark:border-white/10">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <UIcon
                      name="i-lucide-file-text"
                      class="h-4 w-4 text-brand-500 dark:text-brand-300"
                    />
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ selectedPdfArtifact?.title || 'PDF Source' }}
                    </p>
                  </div>
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {{ pdfStatusLabel }}
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <UButton
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-minus"
                    :disabled="pdfZoom <= 0.75"
                    @click="zoomOutPdf"
                  />
                  <UBadge
                    color="neutral"
                    variant="outline"
                    class="min-w-20 justify-center"
                  >
                    {{ pdfZoomLabel }}
                  </UBadge>
                  <UButton
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-plus"
                    :disabled="pdfZoom >= 2.5"
                    @click="zoomInPdf"
                  />
                  <UButton
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    @click="resetPdfZoom"
                  >
                    Fit
                  </UButton>
                  <UButton
                    v-if="totalPdfPages > 1"
                    color="neutral"
                    :variant="facingPagesEnabled ? 'soft' : 'outline'"
                    size="sm"
                    icon="i-lucide-book-open"
                    class="hidden lg:inline-flex"
                    :disabled="!canUseFacingPages"
                    @click="toggleFacingPages"
                  >
                    Facing pages
                  </UButton>
                  <UButton
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-chevron-left"
                    :disabled="currentPage <= 1 || !totalPdfPages"
                    @click="goToPreviousPage"
                  />
                  <UBadge
                    color="neutral"
                    variant="outline"
                    class="min-w-24 justify-center"
                  >
                    {{ pdfPageBadgeLabel }}
                  </UBadge>
                  <UButton
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-chevron-right"
                    :disabled="!totalPdfPages || currentPage >= totalPdfPages"
                    @click="goToNextPage"
                  />
                </div>
              </div>

              <div class="mt-4">
                <div
                  v-if="!selectedPdfArtifact"
                  class="flex min-h-[36rem] items-center justify-center rounded-2xl border border-dashed border-gray-300 px-6 text-center dark:border-white/10"
                >
                  <div>
                    <UIcon
                      name="i-lucide-file-x-2"
                      class="mx-auto h-8 w-8 text-gray-400"
                    />
                    <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                      No PDF artifact is available for review.
                    </p>
                  </div>
                </div>

                <div
                  v-else
                  ref="pdfViewportEl"
                  class="relative min-h-[36rem] max-h-[72vh] overflow-auto rounded-2xl border border-gray-200/80 bg-white dark:border-white/10 dark:bg-zinc-950"
                  :class="pdfCanPan ? 'cursor-grab active:cursor-grabbing' : ''"
                  @mousedown="beginPdfPan"
                  @mousemove="movePdfPan"
                  @mouseup="endPdfPan"
                  @mouseleave="endPdfPan"
                >
                  <div
                    v-if="pdfLoading || pdfRendering"
                    class="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-zinc-950/70"
                  >
                    <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <UIcon
                        name="i-lucide-loader-circle"
                        class="h-4 w-4 animate-spin"
                      />
                      <span>{{ pdfLoading ? 'Loading document' : 'Rendering page' }}</span>
                    </div>
                  </div>

                  <div
                    v-if="pdfError"
                    class="flex min-h-[32rem] items-center justify-center px-6 text-center"
                  >
                    <div>
                      <UIcon
                        name="i-lucide-file-warning"
                        class="mx-auto h-8 w-8 text-gray-400"
                      />
                      <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                        {{ pdfError }}
                      </p>
                      <UButton
                        class="mt-4"
                        color="neutral"
                        variant="outline"
                        size="sm"
                        icon="i-lucide-refresh-cw"
                        @click="reloadSelectedPdf"
                      >
                        Retry
                      </UButton>
                    </div>
                  </div>

                  <div
                    v-else
                    class="flex w-max min-w-full items-start justify-center gap-4 p-4"
                  >
                    <div
                      v-for="panel in visiblePdfPanels"
                      :key="panel.key"
                      class="shrink-0 space-y-2"
                    >
                      <div class="flex items-center justify-between gap-2 px-1">
                        <div class="flex items-center gap-2">
                          <UBadge
                            :color="panel.kind === 'active' ? 'primary' : 'neutral'"
                            :variant="panel.kind === 'active' ? 'soft' : 'outline'"
                          >
                            {{ panel.kind === 'active' ? 'Active page' : 'Context only' }}
                          </UBadge>
                          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Page {{ panel.page }}
                          </span>
                        </div>
                      </div>

                      <div class="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm dark:border-white/10">
                        <canvas
                          :ref="element => setPdfCanvasEl(panel.key, element)"
                          class="block bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>

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
                    Page {{ currentPage }} of {{ totalPdfPages || 1 }}<span v-if="secondaryPdfPage"> · Context page {{ secondaryPdfPage }}</span>
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <UBadge
                    v-if="!isGuideActive && selectedGuidelineCount"
                    color="primary"
                    variant="soft"
                  >
                    {{ selectedGuidelineCount }} selected
                  </UBadge>
                  <UBadge
                    color="neutral"
                    variant="outline"
                  >
                    {{ pageGuidelinesTotal }} on page
                  </UBadge>
                </div>
              </div>

              <div class="mt-4">
                <UTable
                  :data="pageGuidelines"
                  :columns="guidelineColumns"
                  :meta="guidelineTableMeta"
                  :loading="pageGuidelinesLoading"
                  sticky="header"
                  class="min-h-[36rem]"
                >
                  <template #select-cell="{ row }">
                    <div
                      v-if="!isGuideActive"
                      class="flex justify-center py-1"
                    >
                      <input
                        :checked="isGuidelineSelected(row.original.id)"
                        :disabled="bulkApprovePending || guidelineDeletePending || !canBulkActOnGuideline(row.original)"
                        type="checkbox"
                        class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:bg-zinc-900"
                        @click.stop
                        @change="toggleGuidelineSelection(row.original.id, ($event.target as HTMLInputElement).checked)"
                      >
                    </div>
                  </template>

                  <template #rule_text-cell="{ row }">
                    <div class="w-[22rem] max-w-[22rem] min-w-[22rem] py-1">
                      <div class="flex items-start gap-3">
                        <UTooltip :text="guidelineStatusTooltip(row.original)">
                          <span
                            class="mt-2 inline-flex h-2.5 w-2.5 shrink-0 rounded-full cursor-help"
                            :class="guidelineStatusDotClass(row.original)"
                          />
                        </UTooltip>

                        <p
                          class="whitespace-pre-wrap break-words text-sm font-medium leading-6"
                          :class="guidelineTextClass(row.original)"
                        >
                          {{ row.original.rule_text }}
                        </p>
                      </div>
                    </div>
                  </template>

                  <template #actions-cell="{ row }">
                    <div
                      v-if="!isGuideActive"
                      class="flex justify-end gap-2"
                    >
                      <UButton
                        :color="isGuidelineApproved(row.original) ? 'neutral' : 'success'"
                        variant="soft"
                        size="sm"
                        :disabled="bulkApprovePending || guidelineDeletePending"
                        :loading="approvingGuidelineId === row.original.id"
                        @click="toggleGuidelineApproval(row.original)"
                      >
                        {{ isGuidelineApproved(row.original) ? 'Disapprove' : 'Approve' }}
                      </UButton>
                      <UButton
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        :disabled="bulkApprovePending || guidelineDeletePending"
                        @click="openEditGuidelineModal(row.original)"
                      >
                        Edit
                      </UButton>
                      <UButton
                        color="error"
                        variant="ghost"
                        size="sm"
                        :disabled="bulkApprovePending || guidelineDeletePending"
                        @click="promptGuidelineDelete(row.original)"
                      >
                        Discard
                      </UButton>
                    </div>
                  </template>

                  <template #empty>
                    <div class="flex h-[32rem] flex-col items-center justify-center px-6 text-center">
                      <UIcon
                        name="i-lucide-file-search"
                        class="h-8 w-8 text-gray-400"
                      />
                      <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                        No guidelines are mapped to page {{ currentPage }}.
                      </p>
                      <UButton
                        class="mt-4"
                        color="neutral"
                        variant="outline"
                        size="sm"
                        icon="i-lucide-plus"
                        v-if="!isGuideActive"
                        :disabled="!canCreateGuideline"
                        @click="openCreateGuidelineModal"
                      >
                        Add Guideline
                      </UButton>
                    </div>
                  </template>
                </UTable>

                <div
                  v-if="pageGuidelinesTotal > guidelinePageSize"
                  class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p class="text-sm text-gray-600 dark:text-gray-300">
                    {{ guidelinePaginationSummary }}
                  </p>

                  <UPagination
                    v-model:page="guidelineTablePage"
                    :total="pageGuidelinesTotal"
                    :items-per-page="guidelinePageSize"
                    :sibling-count="1"
                    size="sm"
                    show-edges
                  />
                </div>
              </div>
            </UCard>
          </div>
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
              :to="guideDetailRoute"
              color="neutral"
              variant="outline"
              icon="i-lucide-arrow-left"
            >
              Back to Guide
            </UButton>
          </div>
        </UCard>
      </UPageBody>
    </UPage>

    <UModal
      v-model:open="guidelineEditorOpen"
      :ui="{ content: 'w-[calc(100vw-2rem)] max-w-5xl sm:max-w-5xl' }"
    >
      <template #content>
        <UCard
          class="flex w-full min-h-[76vh] max-h-[92vh] flex-col"
          :ui="{ body: 'min-h-0 flex-1 overflow-y-auto p-5 sm:p-6', footer: 'p-5 sm:p-6' }"
        >
          <template #header>
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ guidelineEditorMode === 'create' ? 'Add Guideline' : 'Edit Guideline' }}
                </h3>
                <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <UBadge
                    color="neutral"
                    variant="outline"
                  >
                    {{ selectedPdfArtifact?.title || 'No source artifact' }}
                  </UBadge>
                  <UBadge
                    color="neutral"
                    variant="outline"
                  >
                    Page {{ currentPage }}
                  </UBadge>
                </div>
              </div>

              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                @click="guidelineEditorOpen = false"
              />
            </div>
          </template>

          <UTabs
            v-model="guidelineEditorTab"
            :items="guidelineEditorTabs"
            variant="link"
            size="sm"
            class="w-full"
            :ui="{ content: 'w-full pt-5' }"
          >
            <template #basic>
              <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <UFormField
                  label="Rule Text"
                  class="w-full lg:col-span-2"
                  required
                >
                  <UTextarea
                    v-model="guidelineForm.rule_text"
                    :rows="7"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Title"
                  class="w-full"
                >
                  <UInput
                    v-model="guidelineForm.title"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Sequence"
                  class="w-full"
                  required
                >
                  <UInput
                    v-model="guidelineForm.sequence_no"
                    type="number"
                    min="1"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Action Type"
                  class="w-full"
                  required
                >
                  <USelectMenu
                    v-model="guidelineForm.action_type"
                    :items="guidelineActionTypeRequiredOptions"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Frequency"
                  class="w-full"
                >
                  <USelectMenu
                    v-model="guidelineForm.frequency"
                    :items="guidelineFrequencyEditOptions"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Notes"
                  class="w-full lg:col-span-2"
                >
                  <UTextarea
                    v-model="guidelineForm.notes"
                    :rows="4"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </template>

            <template #metadata>
              <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <UFormField
                  label="Status"
                  class="w-full"
                >
                  <USelectMenu
                    v-model="guidelineForm.status"
                    :items="guideStatusEditOptions"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Review Status"
                  class="w-full"
                >
                  <USelectMenu
                    v-model="guidelineForm.review_status"
                    :items="guideReviewEditOptions"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Visibility"
                  class="w-full"
                >
                  <USelectMenu
                    v-model="guidelineForm.visibility"
                    :items="guideVisibilityEditOptions"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Applicability"
                  class="w-full"
                >
                  <USelectMenu
                    v-model="guidelineForm.applicability_status"
                    :items="guideApplicabilityEditOptions"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Target Populations"
                  class="w-full lg:col-span-2"
                >
                  <USelectMenu
                    v-model="guidelineForm.target_populations"
                    :items="guidelineTargetPopulationEditOptions"
                    value-key="value"
                    label-key="label"
                    multiple
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Food Groups"
                  class="w-full lg:col-span-2"
                >
                  <USelectMenu
                    v-model="guidelineForm.food_groups"
                    :items="guidelineFoodGroupEditOptions"
                    value-key="value"
                    label-key="label"
                    multiple
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Quantity Operator"
                  class="w-full"
                >
                  <USelectMenu
                    v-model="guidelineForm.quantity_operator"
                    :items="quantityOperatorEditOptions"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Quantity Value"
                  class="w-full"
                >
                  <UInput
                    v-model="guidelineForm.quantity_value"
                    type="number"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Quantity Unit"
                  class="w-full"
                >
                  <UInput
                    v-model="guidelineForm.quantity_unit"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Quantity Period"
                  class="w-full"
                >
                  <UInput
                    v-model="guidelineForm.quantity_period"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Quantity Raw Text"
                  class="w-full lg:col-span-2"
                >
                  <UInput
                    v-model="guidelineForm.quantity_raw_text"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </template>
          </UTabs>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                :disabled="guidelineSavePending"
                @click="guidelineEditorOpen = false"
              >
                Cancel
              </UButton>
              <UButton
                color="primary"
                :loading="guidelineSavePending"
                @click="saveGuideline"
              >
                {{ guidelineEditorMode === 'create' ? 'Create Guideline' : 'Save Guideline' }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <UModal
      v-model:open="guidelineDeleteOpen"
      :ui="{ content: 'w-[calc(100vw-2rem)] max-w-lg sm:max-w-lg' }"
    >
      <template #content>
        <UCard :ui="{ body: 'p-5 sm:p-6', footer: 'p-5 sm:p-6' }">
          <template #header>
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ guidelineDeleteDialogTitle }}
                </h3>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {{ guidelineDeleteDialogDescription }}
                </p>
              </div>

              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                @click="guidelineDeleteOpen = false"
              />
            </div>
          </template>

          <div class="space-y-3">
            <p class="text-sm leading-6 text-gray-600 dark:text-gray-300">
              {{ guidelineDeleteDialogBody }}
            </p>

            <div
              v-if="guidelinesPendingDeletion.length > 1"
              class="rounded-xl border border-gray-200/80 bg-gray-50/70 px-4 py-3 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
            >
              {{ guidelinesPendingDeletion.length }} guidelines are selected for discard.
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                :disabled="guidelineDeletePending"
                @click="guidelineDeleteOpen = false"
              >
                Cancel
              </UButton>
              <UButton
                color="error"
                :loading="guidelineDeletePending"
                @click="deleteGuidelines"
              >
                {{ guidelineDeleteConfirmLabel }}
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
  CatalogApplicabilityStatus,
  CatalogArtifact,
  CatalogGuide,
  CatalogGuideline,
  CatalogGuidelineActionType,
  CatalogGuidelineFoodGroup,
  CatalogGuidelineFrequency,
  CatalogGuidelineQuantity,
  CatalogGuidelineTargetPopulation,
  CatalogReviewStatus,
  CatalogStatus,
  CatalogVisibility,
  GuidelineCreatePayload,
  GuidelineUpdatePayload
} from '~/services/catalogApi'
import catalogApi from '~/services/catalogApi'
import { fetchCatalogArtifactDownloadResponse } from '~/services/objectStorageApi'
import {
  buildGuideRoutePath,
  formatDate,
  formatEnumLabel,
  guideApplicabilityEditOptions,
  guideReviewEditOptions,
  guideStatusEditOptions,
  guideVisibilityEditOptions,
  guidelineActionTypeEditOptions,
  guidelineFoodGroupEditOptions,
  guidelineFrequencyEditOptions,
  guidelineTargetPopulationEditOptions,
  quantityOperatorEditOptions,
  resolveGuideRouteParam,
  reviewStatusColor,
  statusColor
} from '~/utils/consoleGuideCatalog'

definePageMeta({
  layout: 'default'
})

type PdfJsModule = typeof import('pdfjs-dist/legacy/build/pdf.mjs')
type PdfWorkerModule = {
  default: new () => Worker
}
type PdfPanelKey = 'primary' | 'secondary'
type PdfRenderTask = {
  promise: Promise<void>
  cancel?: () => void
}
type PdfDocumentLike = {
  numPages: number
  getPage: (pageNumber: number) => Promise<{
    getViewport: (params: { scale: number }) => { width: number, height: number }
    render: (params: {
      canvasContext: CanvasRenderingContext2D
      viewport: { width: number, height: number }
      transform?: [number, number, number, number, number, number]
    }) => { promise: Promise<void>, cancel?: () => void }
  }>
  destroy?: () => void | Promise<void>
}

type GuidelineEditorMode = 'create' | 'edit'

let pdfModulePromise: Promise<PdfJsModule> | null = null
let pdfWorkerPromise: Promise<PdfWorkerModule> | null = null
let pdfWorkerInstance: Worker | null = null
let activePdfDocument: PdfDocumentLike | null = null
let activePdfRenderTasks: PdfRenderTask[] = []
let pdfLoadToken = 0
let pdfRenderToken = 0
let pageGuidelineLoadToken = 0
let resizeTimer: ReturnType<typeof setTimeout> | null = null

async function getPdfModule() {
  if (!import.meta.client) {
    throw new Error('PDF rendering is only available in the browser')
  }

  if (!pdfModulePromise) {
    pdfWorkerPromise ||= import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?worker')

    pdfModulePromise = Promise.all([
      import('pdfjs-dist/legacy/build/pdf.mjs'),
      pdfWorkerPromise
    ]).then(([module, workerModule]) => {
      pdfWorkerInstance ||= new workerModule.default()
      module.GlobalWorkerOptions.workerPort ||= pdfWorkerInstance
      return module
    })
  }

  return pdfModulePromise
}

const route = useRoute()
const toast = useToast()

const selectedGuide = ref<CatalogGuide | null>(null)
const guideGuidelines = ref<CatalogGuideline[]>([])
const pageGuidelines = ref<CatalogGuideline[]>([])
const guideArtifacts = ref<CatalogArtifact[]>([])

const detailLoading = ref(false)
const detailError = ref<string | null>(null)
const pageGuidelinesLoading = ref(false)
const guidelineTablePage = ref(1)
const guidelinePageSize = 4
const pageGuidelinesTotal = ref(0)
const selectedGuidelineIds = ref<string[]>([])

const selectedArtifactId = ref('')
const currentPage = ref(1)
const totalPdfPages = ref(0)
const pdfZoom = ref(1)
const pdfLoading = ref(false)
const pdfRendering = ref(false)
const pdfError = ref<string | null>(null)
const facingPagesEnabled = ref(false)
const isDesktopPdfViewport = ref(false)

const pdfViewportEl = ref<HTMLElement | null>(null)
const pdfCanvasEls = reactive<Record<PdfPanelKey, HTMLCanvasElement | null>>({
  primary: null,
  secondary: null
})

const guidelineEditorOpen = ref(false)
const guidelineEditorMode = ref<GuidelineEditorMode>('create')
const guidelineEditorTab = ref('basic')
const editingGuidelineId = ref('')
const guidelineSavePending = ref(false)

const guidelineDeleteOpen = ref(false)
const guidelineDeletePending = ref(false)
const guidelineDeleteTargetIds = ref<string[]>([])
const approvingGuidelineId = ref('')

const bulkApprovePending = ref(false)
const pdfPanState = reactive({
  active: false,
  startX: 0,
  startY: 0,
  scrollLeft: 0,
  scrollTop: 0
})

const guidelineEditorTabs = [
  { label: 'Basic', value: 'basic', slot: 'basic' },
  { label: 'Metadata', value: 'metadata', slot: 'metadata' }
]

const guidelineForm = reactive({
  title: '',
  rule_text: '',
  sequence_no: '',
  action_type: 'eat',
  frequency: '',
  target_populations: [] as string[],
  food_groups: [] as string[],
  status: 'draft',
  review_status: 'unreviewed',
  visibility: 'internal',
  applicability_status: '',
  notes: '',
  quantity_operator: '',
  quantity_value: '',
  quantity_unit: '',
  quantity_period: '',
  quantity_raw_text: ''
})

const pdfByteCache = reactive<Record<string, Uint8Array>>({})

const guidelineColumns = computed(() => {
  const columns = [
    { accessorKey: 'rule_text', header: 'Guideline text' }
  ]

  if (!isGuideActive.value) {
    columns.unshift({ id: 'select', header: '', enableSorting: false })
    columns.push({ id: 'actions', header: '', enableSorting: false })
  }

  return columns
})

const guidelineTableMeta = computed(() => ({
  class: {
    tr: () => 'hover:bg-gray-50 dark:hover:bg-white/5'
  }
}))

const resolvedGuideUrn = computed(() => resolveGuideRouteParam(route.params.urn))
const pageTitle = computed(() => selectedGuide.value?.short_title || selectedGuide.value?.title || 'Guideline Review')

const guideDetailRoute = computed(() => ({
  path: buildGuideRoutePath(resolvedGuideUrn.value)
}))

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
    to: '/console/assets/guides'
  },
  {
    label: selectedGuide.value?.short_title || selectedGuide.value?.title || 'Guide',
    icon: 'i-lucide-file-pen-line',
    to: guideDetailRoute.value
  },
  {
    label: 'Guideline Review',
    icon: 'i-lucide-list-checks'
  }
])

const reviewArtifacts = computed(() =>
  guideArtifacts.value.filter(artifact => hasPdfSuffix(artifact.file_s3_url))
)

const reviewArtifactOptions = computed(() =>
  reviewArtifacts.value.map(artifact => ({
    label: artifact.title,
    value: artifact.id
  }))
)

const selectedPdfArtifact = computed(() =>
  reviewArtifacts.value.find(artifact => artifact.id === selectedArtifactId.value) || null
)

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
    { label: `${reviewArtifacts.value.length} PDF artifacts`, icon: 'i-lucide-file-text' }
  ]
})

const guidelinesPendingDeletion = computed(() =>
  guideGuidelines.value.filter(guideline => guidelineDeleteTargetIds.value.includes(guideline.id))
)

const editingGuideline = computed(() =>
  guideGuidelines.value.find(guideline => guideline.id === editingGuidelineId.value) || null
)

const nextGuidelineSequence = computed(() =>
  guideGuidelines.value.reduce((maxSequence, guideline) => Math.max(maxSequence, guideline.sequence_no || 0), 0) + 1
)

const isGuideActive = computed(() =>
  selectedGuide.value?.status === 'active'
)

const canCreateGuideline = computed(() =>
  Boolean(selectedGuide.value && selectedPdfArtifact.value && totalPdfPages.value >= 1 && !isGuideActive.value)
)

const pdfCanPan = computed(() => pdfZoom.value > 1.02 && !pdfLoading.value && !pdfError.value)

const canUseFacingPages = computed(() =>
  isDesktopPdfViewport.value && totalPdfPages.value > 1
)

const secondaryPdfPage = computed(() =>
  facingPagesEnabled.value && canUseFacingPages.value && currentPage.value < totalPdfPages.value
    ? currentPage.value + 1
    : null
)

const visiblePdfPanels = computed(() => {
  const panels: Array<{ key: PdfPanelKey, kind: 'active' | 'context', page: number }> = [{
    key: 'primary',
    kind: 'active',
    page: currentPage.value
  }]

  if (secondaryPdfPage.value) {
    panels.push({
      key: 'secondary',
      kind: 'context',
      page: secondaryPdfPage.value
    })
  }

  return panels
})

const pdfZoomLabel = computed(() => `${Math.round(pdfZoom.value * 100)}%`)

const pdfPageBadgeLabel = computed(() =>
  secondaryPdfPage.value
    ? `Pages ${currentPage.value}-${secondaryPdfPage.value} / ${totalPdfPages.value || 1}`
    : `Page ${currentPage.value} / ${totalPdfPages.value || 1}`
)

const guidelineTableOffset = computed(() => (guidelineTablePage.value - 1) * guidelinePageSize)

const guidelinePaginationSummary = computed(() => {
  if (!pageGuidelinesTotal.value) {
    return 'No guidelines on this PDF page.'
  }

  const start = guidelineTableOffset.value + 1
  const end = Math.min(guidelineTableOffset.value + pageGuidelines.value.length, pageGuidelinesTotal.value)
  return `Showing ${start}-${end} of ${pageGuidelinesTotal.value}`
})

const selectedGuidelines = computed(() =>
  pageGuidelines.value.filter(guideline => selectedGuidelineIds.value.includes(guideline.id) && canBulkActOnGuideline(guideline))
)

const selectedGuidelineCount = computed(() => selectedGuidelines.value.length)

const currentPdfPageGuidelines = computed(() =>
  guideGuidelines.value.filter(guideline => guideline.page_no === currentPage.value)
)

const selectedGuidelinesNeedApproval = computed(() =>
  selectedGuidelines.value.some(guideline => !isGuidelineApproved(guideline))
)

const allPageGuidelinesApproved = computed(() =>
  Boolean(currentPdfPageGuidelines.value.length) && currentPdfPageGuidelines.value.every(isGuidelineApproved)
)

const pageApprovalButtonLabel = computed(() =>
  allPageGuidelinesApproved.value ? 'Page Active' : 'Approve Page'
)

const guidelineDeleteDialogTitle = computed(() =>
  guidelinesPendingDeletion.value.length > 1 ? 'Discard Selected Guidelines' : 'Discard Guideline'
)

const guidelineDeleteDialogDescription = computed(() =>
  guidelinesPendingDeletion.value.length > 1
    ? 'This removes the selected guidelines from the guide.'
    : 'This removes the guideline from the guide.'
)

const guidelineDeleteDialogBody = computed(() => {
  if (!guidelinesPendingDeletion.value.length) {
    return 'Selected guideline'
  }

  if (guidelinesPendingDeletion.value.length === 1) {
    return guidelinesPendingDeletion.value[0]?.rule_text || 'Selected guideline'
  }

  return 'These guidelines will be removed from the guide and from the current review list.'
})

const guidelineDeleteConfirmLabel = computed(() =>
  guidelinesPendingDeletion.value.length > 1 ? 'Discard Selected' : 'Discard Guideline'
)

const pdfStatusLabel = computed(() => {
  if (!selectedPdfArtifact.value) {
    return 'Choose a PDF artifact to start review.'
  }

  if (pdfError.value) {
    return pdfError.value
  }

  if (pdfLoading.value) {
    return 'Loading document'
  }

  if (!totalPdfPages.value) {
    return 'Preparing document'
  }

  return `${totalPdfPages.value} pages`
})

const guidelineActionTypeRequiredOptions = computed(() =>
  guidelineActionTypeEditOptions.filter(option => option.value)
)

useHead({
  title: computed(() => selectedGuide.value ? `Guideline Review | ${selectedGuide.value.title}` : 'Guideline Review')
})

useSeoMeta({
  description: computed(() => selectedGuide.value ? `Guideline review workspace for ${selectedGuide.value.title}` : 'Wisefood guideline review workspace')
})

function hasPdfSuffix(value: string | null | undefined) {
  return value?.split('?')[0].toLowerCase().endsWith('.pdf') || false
}

function isGuidelineApproved(guideline: CatalogGuideline) {
  return guideline.status === 'active' && guideline.review_status === 'verified'
}

function canBulkActOnGuideline(guideline: CatalogGuideline) {
  return !isGuideActive.value && !isGuidelineApproved(guideline)
}

function guidelineStatusDotClass(guideline: CatalogGuideline) {
  if (isGuidelineApproved(guideline)) {
    return 'bg-brandg-500 dark:bg-brandg-400'
  }

  return 'bg-amber-400 dark:bg-amber-300'
}

function guidelineTextClass(guideline: CatalogGuideline) {
  if (isGuidelineApproved(guideline)) {
    return 'text-brandg-700 dark:text-brandg-300'
  }

  return 'text-amber-700 dark:text-amber-300'
}

function guidelineStatusTooltip(guideline: CatalogGuideline) {
  if (isGuidelineApproved(guideline)) {
    return 'Approved and active'
  }

  if (guideline.review_status === 'verified') {
    return 'Verified but still inactive'
  }

  return 'Draft or needs review'
}

function clampPage(page: number) {
  if (!totalPdfPages.value) {
    return 1
  }

  return Math.min(Math.max(page, 1), totalPdfPages.value)
}

function setPdfCanvasEl(panelKey: PdfPanelKey, element: Element | null) {
  pdfCanvasEls[panelKey] = element instanceof HTMLCanvasElement ? element : null
}

function clearPdfCanvas(panelKey: PdfPanelKey) {
  const canvas = pdfCanvasEls[panelKey]
  if (!canvas) {
    return
  }

  const context = canvas.getContext('2d')
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  canvas.width = 0
  canvas.height = 0
}

function clearAllPdfCanvases() {
  clearPdfCanvas('primary')
  clearPdfCanvas('secondary')
}

function cancelActivePdfRenderTasks() {
  activePdfRenderTasks.forEach(renderTask => {
    if (!renderTask.cancel) {
      return
    }

    try {
      renderTask.cancel()
    } catch {
      // no-op
    }
  })

  activePdfRenderTasks = []
}

async function destroyActivePdfDocument() {
  pdfRenderToken += 1

  cancelActivePdfRenderTasks()

  if (activePdfDocument?.destroy) {
    await activePdfDocument.destroy()
  }

  activePdfDocument = null
  clearAllPdfCanvases()
}

async function getArtifactPdfBytes(artifactId: string) {
  const cached = pdfByteCache[artifactId]
  if (cached?.byteLength) {
    return cached
  }

  const response = await fetchCatalogArtifactDownloadResponse(artifactId)
  if (!response.ok) {
    throw new Error(`PDF fetch failed with status ${response.status}`)
  }

  const data = new Uint8Array(await response.arrayBuffer())
  if (!data.byteLength) {
    throw new Error('The PDF response was empty')
  }

  pdfByteCache[artifactId] = data
  return data
}

async function renderVisiblePdfPages() {
  if (!import.meta.client || !activePdfDocument || !pdfViewportEl.value) {
    return
  }

  await nextTick()

  const renderToken = ++pdfRenderToken
  pdfRendering.value = true
  pdfError.value = null

  cancelActivePdfRenderTasks()

  try {
    const panels = visiblePdfPanels.value
    const viewportContainerWidth = Math.max(pdfViewportEl.value.clientWidth - 32, 320)
    const interPageGap = panels.length > 1 ? 16 : 0
    const perPageWidth = panels.length > 1
      ? Math.max((viewportContainerWidth - interPageGap) / 2, 240)
      : viewportContainerWidth
    const devicePixelRatio = window.devicePixelRatio || 1

    if (!panels.some(panel => panel.key === 'secondary')) {
      clearPdfCanvas('secondary')
    }

    for (const panel of panels) {
      const canvas = pdfCanvasEls[panel.key]
      if (!canvas) {
        continue
      }

      const page = await activePdfDocument.getPage(clampPage(panel.page))
      if (renderToken !== pdfRenderToken) {
        return
      }

      const baseViewport = page.getViewport({ scale: 1 })
      const scale = (perPageWidth / baseViewport.width) * pdfZoom.value
      const viewport = page.getViewport({ scale })
      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('Canvas rendering context unavailable')
      }

      canvas.width = Math.floor(viewport.width * devicePixelRatio)
      canvas.height = Math.floor(viewport.height * devicePixelRatio)
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`

      context.setTransform(1, 0, 0, 1, 0, 0)
      context.clearRect(0, 0, canvas.width, canvas.height)

      const renderTask = page.render({
        canvasContext: context,
        viewport,
        transform: devicePixelRatio === 1
          ? undefined
          : [devicePixelRatio, 0, 0, devicePixelRatio, 0, 0]
      })

      activePdfRenderTasks = [...activePdfRenderTasks, renderTask]
      await renderTask.promise
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (!message.toLowerCase().includes('cancel')) {
      console.error('[ConsoleGuidelineReview] Failed to render PDF page:', error)
      pdfError.value = 'The PDF page could not be rendered.'
    }
  } finally {
    if (renderToken === pdfRenderToken) {
      pdfRendering.value = false
      activePdfRenderTasks = []
    }
  }
}

function clampPdfZoom(value: number) {
  return Math.min(Math.max(value, 0.75), 2.5)
}

function zoomInPdf() {
  pdfZoom.value = clampPdfZoom(Number((pdfZoom.value + 0.25).toFixed(2)))
}

function zoomOutPdf() {
  pdfZoom.value = clampPdfZoom(Number((pdfZoom.value - 0.25).toFixed(2)))
}

function resetPdfZoom() {
  pdfZoom.value = 1
}

function toggleFacingPages() {
  if (!canUseFacingPages.value) {
    return
  }

  facingPagesEnabled.value = !facingPagesEnabled.value

  if (activePdfDocument && import.meta.client) {
    void renderVisiblePdfPages()
  }
}

function beginPdfPan(event: MouseEvent) {
  if (!pdfCanPan.value || !pdfViewportEl.value) {
    return
  }

  pdfPanState.active = true
  pdfPanState.startX = event.clientX
  pdfPanState.startY = event.clientY
  pdfPanState.scrollLeft = pdfViewportEl.value.scrollLeft
  pdfPanState.scrollTop = pdfViewportEl.value.scrollTop
  event.preventDefault()
}

function movePdfPan(event: MouseEvent) {
  if (!pdfPanState.active || !pdfViewportEl.value) {
    return
  }

  const deltaX = event.clientX - pdfPanState.startX
  const deltaY = event.clientY - pdfPanState.startY
  pdfViewportEl.value.scrollLeft = pdfPanState.scrollLeft - deltaX
  pdfViewportEl.value.scrollTop = pdfPanState.scrollTop - deltaY
}

function endPdfPan() {
  pdfPanState.active = false
}

async function loadSelectedPdf(forceReload = false) {
  const artifact = selectedPdfArtifact.value
  const loadToken = ++pdfLoadToken

  pdfError.value = null
  totalPdfPages.value = 0
  pdfLoading.value = Boolean(artifact)

  await destroyActivePdfDocument()

  if (!artifact) {
    pdfLoading.value = false
    return
  }

  try {
    if (forceReload) {
      pdfByteCache[artifact.id] = new Uint8Array()
    }

    const bytes = await getArtifactPdfBytes(artifact.id)
    const pdfModule = await getPdfModule()
    const document = await pdfModule.getDocument({ data: bytes }).promise as PdfDocumentLike

    if (loadToken !== pdfLoadToken) {
      await document.destroy?.()
      return
    }

    activePdfDocument = document
    totalPdfPages.value = document.numPages
    currentPage.value = clampPage(currentPage.value)

    await renderVisiblePdfPages()
  } catch (error) {
    console.error('[ConsoleGuidelineReview] Failed to load PDF:', error)
    pdfError.value = 'The selected PDF could not be opened.'
    totalPdfPages.value = 0
    clearAllPdfCanvases()
  } finally {
    if (loadToken === pdfLoadToken) {
      pdfLoading.value = false
    }
  }
}

function schedulePdfRender() {
  if (!import.meta.client || !activePdfDocument) {
    return
  }

  if (resizeTimer) {
    clearTimeout(resizeTimer)
  }

  resizeTimer = setTimeout(() => {
    void renderVisiblePdfPages()
  }, 120)
}

function syncPdfViewportMode() {
  if (!import.meta.client) {
    return
  }

  isDesktopPdfViewport.value = window.innerWidth >= 1024
}

function handlePdfViewportResize() {
  syncPdfViewportMode()
  schedulePdfRender()
}

function normalizeNullable(value: string) {
  const normalized = value.trim()
  return normalized.length ? normalized : null
}

function normalizeNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function buildGuidelineQuantityPayload(): CatalogGuidelineQuantity | null {
  const operator = normalizeNullable(guidelineForm.quantity_operator)
  const value = normalizeNumber(guidelineForm.quantity_value)
  const unit = normalizeNullable(guidelineForm.quantity_unit)
  const period = normalizeNullable(guidelineForm.quantity_period)
  const rawText = normalizeNullable(guidelineForm.quantity_raw_text)

  const hasAnyQuantityField = Boolean(operator || value !== null || unit || period || rawText)
  if (!hasAnyQuantityField) {
    return null
  }

  if (!operator || value === null || !unit) {
    throw new Error('Complete the quantity operator, value, and unit or leave them blank.')
  }

  return {
    operator: operator as CatalogGuidelineQuantity['operator'],
    value,
    unit,
    period,
    raw_text: rawText
  }
}

function resetGuidelineFormForCreate() {
  guidelineForm.title = ''
  guidelineForm.rule_text = ''
  guidelineForm.sequence_no = String(nextGuidelineSequence.value)
  guidelineForm.action_type = 'eat'
  guidelineForm.frequency = ''
  guidelineForm.target_populations = []
  guidelineForm.food_groups = []
  guidelineForm.status = 'draft'
  guidelineForm.review_status = 'unreviewed'
  guidelineForm.visibility = 'internal'
  guidelineForm.applicability_status = ''
  guidelineForm.notes = ''
  guidelineForm.quantity_operator = ''
  guidelineForm.quantity_value = ''
  guidelineForm.quantity_unit = ''
  guidelineForm.quantity_period = ''
  guidelineForm.quantity_raw_text = ''
}

function setGuidelineForm(guideline: CatalogGuideline) {
  guidelineForm.title = guideline.title || ''
  guidelineForm.rule_text = guideline.rule_text
  guidelineForm.sequence_no = guideline.sequence_no?.toString() || String(nextGuidelineSequence.value)
  guidelineForm.action_type = guideline.action_type || 'eat'
  guidelineForm.frequency = guideline.frequency || ''
  guidelineForm.target_populations = [...guideline.target_populations]
  guidelineForm.food_groups = [...guideline.food_groups]
  guidelineForm.status = guideline.status || ''
  guidelineForm.review_status = guideline.review_status || ''
  guidelineForm.visibility = guideline.visibility || ''
  guidelineForm.applicability_status = guideline.applicability_status || ''
  guidelineForm.notes = guideline.notes || ''
  guidelineForm.quantity_operator = guideline.quantity?.operator || ''
  guidelineForm.quantity_value = guideline.quantity?.value?.toString() || ''
  guidelineForm.quantity_unit = guideline.quantity?.unit || ''
  guidelineForm.quantity_period = guideline.quantity?.period || ''
  guidelineForm.quantity_raw_text = guideline.quantity?.raw_text || ''
}

function mergeGuideline(updatedGuideline: CatalogGuideline) {
  const existingIndex = guideGuidelines.value.findIndex(guideline => guideline.id === updatedGuideline.id)

  if (existingIndex === -1) {
    guideGuidelines.value = [...guideGuidelines.value, updatedGuideline].sort((left, right) => (left.sequence_no || 0) - (right.sequence_no || 0))
    return
  }

  guideGuidelines.value = guideGuidelines.value
    .map(guideline => guideline.id === updatedGuideline.id ? updatedGuideline : guideline)
    .sort((left, right) => (left.sequence_no || 0) - (right.sequence_no || 0))
}

function removeGuideline(guidelineId: string) {
  guideGuidelines.value = guideGuidelines.value.filter(guideline => guideline.id !== guidelineId)
  pageGuidelines.value = pageGuidelines.value.filter(guideline => guideline.id !== guidelineId)
  selectedGuidelineIds.value = selectedGuidelineIds.value.filter(id => id !== guidelineId)
}

function isGuidelineSelected(guidelineId: string) {
  return selectedGuidelineIds.value.includes(guidelineId)
}

function toggleGuidelineSelection(guidelineId: string, checked: boolean | 'indeterminate') {
  if (isGuideActive.value) {
    return
  }

  if (checked === 'indeterminate') {
    return
  }

  if (checked) {
    if (!selectedGuidelineIds.value.includes(guidelineId)) {
      selectedGuidelineIds.value = [...selectedGuidelineIds.value, guidelineId]
    }
    return
  }

  selectedGuidelineIds.value = selectedGuidelineIds.value.filter(id => id !== guidelineId)
}

async function loadPageGuidelines() {
  const guide = selectedGuide.value
  if (!guide) {
    pageGuidelines.value = []
    pageGuidelinesTotal.value = 0
    selectedGuidelineIds.value = []
    return
  }

  const loadToken = ++pageGuidelineLoadToken
  pageGuidelinesLoading.value = true

  try {
    const response = await catalogApi.searchGuidelinesByGuide(guide.urn, {
      limit: guidelinePageSize,
      offset: guidelineTableOffset.value,
      sort: 'sequence_no asc',
      fq: [`page_no:${currentPage.value}`]
    })

    if (loadToken !== pageGuidelineLoadToken) {
      return
    }

    pageGuidelinesTotal.value = response.total

    const totalTablePages = Math.max(1, Math.ceil(response.total / guidelinePageSize))
    if (guidelineTablePage.value > totalTablePages) {
      guidelineTablePage.value = totalTablePages
      return
    }

    pageGuidelines.value = [...response.guidelines].sort((left, right) => (left.sequence_no || 0) - (right.sequence_no || 0))
    selectedGuidelineIds.value = selectedGuidelineIds.value.filter(id =>
      pageGuidelines.value.some(guideline => guideline.id === id && canBulkActOnGuideline(guideline))
    )
  } catch (error) {
    if (loadToken !== pageGuidelineLoadToken) {
      return
    }

    console.error('[ConsoleGuidelineReview] Failed to load page guidelines:', error)
    pageGuidelines.value = []
    pageGuidelinesTotal.value = 0
    selectedGuidelineIds.value = []
  } finally {
    if (loadToken === pageGuidelineLoadToken) {
      pageGuidelinesLoading.value = false
    }
  }
}

async function loadGuideDetail(urn: string) {
  if (!urn) {
    detailError.value = 'No guide identifier was provided.'
    selectedGuide.value = null
    guideGuidelines.value = []
    pageGuidelines.value = []
    guideArtifacts.value = []
    pageGuidelinesTotal.value = 0
    selectedGuidelineIds.value = []
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
    guideArtifacts.value = guide.artifacts
    guideGuidelines.value = [...guidelines].sort((left, right) => (left.sequence_no || 0) - (right.sequence_no || 0))
    selectedGuidelineIds.value = []
    guidelineDeleteTargetIds.value = []

    if (!reviewArtifacts.value.some(artifact => artifact.id === selectedArtifactId.value)) {
      selectedArtifactId.value = reviewArtifacts.value[0]?.id || ''
    }

    currentPage.value = 1
    guidelineTablePage.value = 1
    pdfZoom.value = 1
  } catch (error) {
    console.error('[ConsoleGuidelineReview] Failed to load guide detail:', error)
    detailError.value = 'The selected guide could not be loaded.'
    selectedGuide.value = null
    guideGuidelines.value = []
    pageGuidelines.value = []
    guideArtifacts.value = []
    pageGuidelinesTotal.value = 0
    selectedGuidelineIds.value = []
    selectedArtifactId.value = ''
    currentPage.value = 1
    guidelineTablePage.value = 1
  } finally {
    detailLoading.value = false
  }
}

async function refreshReview() {
  await loadGuideDetail(resolvedGuideUrn.value)
  await Promise.all([
    loadSelectedPdf(true),
    loadPageGuidelines()
  ])
}

function goToPreviousPage() {
  currentPage.value = clampPage(currentPage.value - 1)
}

function goToNextPage() {
  currentPage.value = clampPage(currentPage.value + 1)
}

function openCreateGuidelineModal() {
  if (!canCreateGuideline.value || isGuideActive.value) {
    return
  }

  guidelineEditorMode.value = 'create'
  guidelineEditorTab.value = 'basic'
  editingGuidelineId.value = ''
  resetGuidelineFormForCreate()
  guidelineEditorOpen.value = true
}

function openEditGuidelineModal(guideline: CatalogGuideline) {
  if (isGuideActive.value) {
    return
  }

  guidelineEditorMode.value = 'edit'
  guidelineEditorTab.value = 'basic'
  editingGuidelineId.value = guideline.id
  setGuidelineForm(guideline)
  guidelineEditorOpen.value = true
}

function promptGuidelineDelete(guideline: CatalogGuideline) {
  if (isGuideActive.value) {
    return
  }

  guidelineDeleteTargetIds.value = [guideline.id]
  guidelineDeleteOpen.value = true
}

function promptSelectedGuidelinesDelete() {
  if (isGuideActive.value || !selectedGuidelines.value.length) {
    return
  }

  guidelineDeleteTargetIds.value = selectedGuidelines.value.map(guideline => guideline.id)
  guidelineDeleteOpen.value = true
}

function buildCreateSourceRefs() {
  if (!selectedPdfArtifact.value) {
    return []
  }

  return [{
    artifact_id: selectedPdfArtifact.value.id,
    page_start: currentPage.value,
    page_end: currentPage.value,
    section_label: null
  }]
}

async function saveGuideline() {
  if (!selectedGuide.value) {
    return
  }

  const sequenceNo = normalizeNumber(guidelineForm.sequence_no)

  if (!guidelineForm.rule_text.trim()) {
    toast.add({
      title: 'Rule text required',
      description: 'Enter the guideline text before saving.',
      color: 'error'
    })
    return
  }

  if (!sequenceNo || sequenceNo < 1) {
    toast.add({
      title: 'Sequence required',
      description: 'Use a sequence number of 1 or higher.',
      color: 'error'
    })
    return
  }

  if (!guidelineForm.action_type) {
    toast.add({
      title: 'Action type required',
      description: 'Select an action type before saving.',
      color: 'error'
    })
    return
  }

  guidelineSavePending.value = true

  try {
    const quantity = buildGuidelineQuantityPayload()
    const commonPayload = {
      title: normalizeNullable(guidelineForm.title),
      rule_text: guidelineForm.rule_text.trim(),
      sequence_no: sequenceNo,
      action_type: guidelineForm.action_type as CatalogGuidelineActionType,
      target_populations: guidelineForm.target_populations as CatalogGuidelineTargetPopulation[],
      frequency: normalizeNullable(guidelineForm.frequency) as CatalogGuidelineFrequency | null,
      quantity,
      food_groups: guidelineForm.food_groups as CatalogGuidelineFoodGroup[],
      notes: normalizeNullable(guidelineForm.notes),
      status: normalizeNullable(guidelineForm.status) as CatalogStatus | null,
      review_status: normalizeNullable(guidelineForm.review_status) as CatalogReviewStatus | null,
      visibility: normalizeNullable(guidelineForm.visibility) as CatalogVisibility | null,
      applicability_status: normalizeNullable(guidelineForm.applicability_status) as CatalogApplicabilityStatus | null
    }

    if (guidelineEditorMode.value === 'create') {
      const payload: GuidelineCreatePayload = {
        guide_urn: selectedGuide.value.urn,
        ...commonPayload,
        source_refs: buildCreateSourceRefs()
      }

      const createdGuideline = await catalogApi.createGuideline(payload)
      mergeGuideline(createdGuideline)
      await loadPageGuidelines()
      toast.add({
        title: 'Guideline created',
        description: `Added to page ${currentPage.value}.`,
        color: 'success'
      })
    } else if (editingGuideline.value) {
      const payload: GuidelineUpdatePayload = {
        ...commonPayload
      }

      const updatedGuideline = await catalogApi.updateGuideline(editingGuideline.value.id, payload)
      mergeGuideline(updatedGuideline)
      await loadPageGuidelines()
      toast.add({
        title: 'Guideline updated',
        description: 'The guideline changes were saved.',
        color: 'success'
      })
    }

    guidelineEditorOpen.value = false
  } catch (error) {
    console.error('[ConsoleGuidelineReview] Failed to save guideline:', error)
    toast.add({
      title: 'Save failed',
      description: error instanceof Error ? error.message : 'The guideline could not be saved.',
      color: 'error'
    })
  } finally {
    guidelineSavePending.value = false
  }
}

async function deleteGuidelines() {
  if (isGuideActive.value) {
    return
  }

  const guidelineIds = [...guidelineDeleteTargetIds.value]
  if (!guidelineIds.length) {
    return
  }

  guidelineDeletePending.value = true

  try {
    const results = await Promise.allSettled(
      guidelineIds.map(guidelineId => catalogApi.deleteGuideline(guidelineId))
    )

    let discardedCount = 0
    let failedCount = 0

    results.forEach((result, index) => {
      const guidelineId = guidelineIds[index]
      if (!guidelineId) {
        return
      }

      if (result.status === 'fulfilled') {
        removeGuideline(guidelineId)
        discardedCount += 1
      } else {
        failedCount += 1
      }
    })

    await loadPageGuidelines()

    if (discardedCount) {
      toast.add({
        title: discardedCount === 1 ? 'Guideline discarded' : 'Guidelines discarded',
        description: discardedCount === 1
          ? 'The guideline was removed from the guide.'
          : `${discardedCount} guidelines were removed from the guide.`,
        color: 'success'
      })
    }

    if (failedCount) {
      toast.add({
        title: 'Discard failed',
        description: `${failedCount} guideline${failedCount === 1 ? '' : 's'} could not be deleted.`,
        color: 'error'
      })
    }

    if (!failedCount) {
      guidelineDeleteOpen.value = false
      guidelineDeleteTargetIds.value = []
    }
  } catch (error) {
    console.error('[ConsoleGuidelineReview] Failed to delete guideline selection:', error)
    toast.add({
      title: 'Delete failed',
      description: 'The selected guidelines could not be deleted.',
      color: 'error'
    })
  } finally {
    guidelineDeletePending.value = false
  }
}

async function toggleGuidelineApproval(guideline: CatalogGuideline) {
  if (isGuideActive.value) {
    return
  }

  if (approvingGuidelineId.value) {
    return
  }

  const wasApproved = isGuidelineApproved(guideline)
  approvingGuidelineId.value = guideline.id

  try {
    const updatedGuideline = await catalogApi.updateGuideline(guideline.id, {
      status: wasApproved ? 'draft' : 'active',
      review_status: wasApproved ? 'unreviewed' : 'verified'
    })

    mergeGuideline(updatedGuideline)
    await loadPageGuidelines()
    toast.add({
      title: wasApproved ? 'Guideline disapproved' : 'Guideline approved',
      description: wasApproved
        ? 'The guideline was moved back to draft and is no longer verified.'
        : 'The guideline is now active and verified.',
      color: 'success'
    })
  } catch (error) {
    console.error('[ConsoleGuidelineReview] Failed to toggle guideline approval:', error)
    toast.add({
      title: wasApproved ? 'Disapprove failed' : 'Approval failed',
      description: wasApproved
        ? 'The guideline could not be moved back to draft.'
        : 'The guideline could not be approved.',
      color: 'error'
    })
  } finally {
    approvingGuidelineId.value = ''
  }
}

async function approveCurrentPage() {
  const guide = selectedGuide.value
  if (!guide || !pageGuidelinesTotal.value || isGuideActive.value) {
    return
  }

  bulkApprovePending.value = true

  try {
    const candidateResponse = await catalogApi.searchGuidelinesByGuide(guide.urn, {
      limit: Math.max(pageGuidelinesTotal.value, guidelinePageSize),
      offset: 0,
      sort: 'sequence_no asc',
      fq: [`page_no:${currentPage.value}`]
    })

    const candidateIds = candidateResponse.guidelines
      .filter(guideline => guideline.status !== 'active' || guideline.review_status !== 'verified')
      .map(guideline => guideline.id)

    if (!candidateIds.length) {
      toast.add({
        title: 'Nothing to approve',
        description: `All guidelines on page ${currentPage.value} are already approved.`,
        color: 'success'
      })
      return
    }

    const results = await Promise.allSettled(
      candidateIds.map(guidelineId =>
        catalogApi.updateGuideline(guidelineId, {
          status: 'active',
          review_status: 'verified'
        })
      )
    )

    let updatedCount = 0
    let failedCount = 0

    for (const result of results) {
      if (result.status === 'fulfilled') {
        mergeGuideline(result.value)
        updatedCount += 1
      } else {
        failedCount += 1
      }
    }

    if (updatedCount) {
      toast.add({
        title: 'Page approved',
        description: `Approved ${updatedCount} guideline${updatedCount === 1 ? '' : 's'} on page ${currentPage.value}.`,
        color: 'success'
      })
    }

    if (failedCount) {
      toast.add({
        title: 'Some approvals failed',
        description: `${failedCount} guideline${failedCount === 1 ? '' : 's'} could not be updated.`,
        color: 'error'
      })
    }

    await loadPageGuidelines()
  } catch (error) {
    console.error('[ConsoleGuidelineReview] Failed to approve page guidelines:', error)
    toast.add({
      title: 'Approval failed',
      description: 'The page guidelines could not be approved.',
      color: 'error'
    })
  } finally {
    bulkApprovePending.value = false
  }
}

async function approveSelectedGuidelines() {
  if (isGuideActive.value) {
    return
  }

  const guidelinesToApprove = selectedGuidelines.value.filter(guideline => !isGuidelineApproved(guideline))

  if (!guidelinesToApprove.length) {
    toast.add({
      title: 'Nothing to approve',
      description: 'The selected guidelines are already active and verified.',
      color: 'success'
    })
    return
  }

  bulkApprovePending.value = true

  try {
    const results = await Promise.allSettled(
      guidelinesToApprove.map(guideline =>
        catalogApi.updateGuideline(guideline.id, {
          status: 'active',
          review_status: 'verified'
        })
      )
    )

    let updatedCount = 0
    let failedCount = 0

    for (const result of results) {
      if (result.status === 'fulfilled') {
        mergeGuideline(result.value)
        updatedCount += 1
      } else {
        failedCount += 1
      }
    }

    if (updatedCount) {
      toast.add({
        title: 'Selected guidelines approved',
        description: `Approved ${updatedCount} guideline${updatedCount === 1 ? '' : 's'}.`,
        color: 'success'
      })
    }

    if (failedCount) {
      toast.add({
        title: 'Some approvals failed',
        description: `${failedCount} guideline${failedCount === 1 ? '' : 's'} could not be updated.`,
        color: 'error'
      })
    }

    await loadPageGuidelines()
  } catch (error) {
    console.error('[ConsoleGuidelineReview] Failed to approve selected guidelines:', error)
    toast.add({
      title: 'Approval failed',
      description: 'The selected guidelines could not be approved.',
      color: 'error'
    })
  } finally {
    bulkApprovePending.value = false
  }
}

function reloadSelectedPdf() {
  void loadSelectedPdf(true)
}

onMounted(() => {
  if (!import.meta.client) {
    return
  }

  syncPdfViewportMode()
  window.addEventListener('resize', handlePdfViewportResize)

  if (selectedArtifactId.value) {
    void loadSelectedPdf()
  }
})

watch(
  () => route.params.urn,
  (value, previousValue) => {
    const nextUrn = resolveGuideRouteParam(value)
    const previousUrn = resolveGuideRouteParam(previousValue)

    if (!nextUrn || nextUrn === previousUrn) {
      return
    }

    void (async () => {
      await loadGuideDetail(nextUrn)
      await loadPageGuidelines()

      if (import.meta.client && selectedArtifactId.value) {
        await loadSelectedPdf(true)
      }
    })()
  }
)

watch(selectedArtifactId, () => {
  const shouldReloadImmediately = currentPage.value === 1
  currentPage.value = 1
  guidelineTablePage.value = 1
  selectedGuidelineIds.value = []
  pdfZoom.value = 1
  if (shouldReloadImmediately) {
    void loadPageGuidelines()
  }

  if (import.meta.client) {
    void loadSelectedPdf()
  }
})

watch(currentPage, (page) => {
  if (!totalPdfPages.value) {
    return
  }

  const nextPage = clampPage(page)
  if (nextPage !== page) {
    currentPage.value = nextPage
    return
  }

  if (guidelineTablePage.value !== 1) {
    guidelineTablePage.value = 1
  } else {
    selectedGuidelineIds.value = []
    void loadPageGuidelines()
  }

  if (activePdfDocument) {
    void renderVisiblePdfPages()
  }
})

watch(guidelineTablePage, (page, previousPage) => {
  if (page === previousPage) {
    return
  }

  selectedGuidelineIds.value = []
  void loadPageGuidelines()
})

watch(guidelineDeleteOpen, isOpen => {
  if (isOpen || guidelineDeletePending.value) {
    return
  }

  guidelineDeleteTargetIds.value = []
})

watch(pdfZoom, () => {
  if (activePdfDocument && import.meta.client) {
    void renderVisiblePdfPages()
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('resize', handlePdfViewportResize)
  }

  if (resizeTimer) {
    clearTimeout(resizeTimer)
  }

  if (pdfWorkerInstance) {
    pdfWorkerInstance.terminate()
    pdfWorkerInstance = null
    pdfWorkerPromise = null
    pdfModulePromise = null
  }

  void destroyActivePdfDocument()
})

await loadGuideDetail(resolvedGuideUrn.value)
await loadPageGuidelines()
</script>
