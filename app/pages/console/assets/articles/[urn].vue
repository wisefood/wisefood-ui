<template>
  <div>
    <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <UBreadcrumb
        :items="breadcrumbItems"
        class="mb-4"
      />

      <UPageBody class="space-y-6">
        <section class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div class="min-w-0 space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge
                :color="articleForm.category.trim() ? 'primary' : 'neutral'"
                :variant="articleForm.category.trim() ? 'soft' : 'outline'"
              >
                {{ categoryPreviewLabel }}
              </UBadge>

              <UBadge
                v-if="articleForm.studyType.trim()"
                color="neutral"
                variant="outline"
              >
                {{ articleForm.studyType.trim() }}
              </UBadge>

              <UBadge
                :color="curationPreview.isComplete ? 'success' : 'warning'"
                variant="soft"
              >
                {{ curationPreview.completeCount }}/{{ curationPreview.totalCount }} curated
              </UBadge>

              <UBadge
                v-if="selectedArticle?.open_access !== null && selectedArticle?.open_access !== undefined"
                :color="selectedArticle.open_access ? 'success' : 'neutral'"
                variant="outline"
              >
                {{ selectedArticle.open_access ? 'Open access' : 'Closed access' }}
              </UBadge>
            </div>

            <div class="flex flex-wrap items-start gap-3">
              <h1 class="min-w-0 text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
                {{ pageTitle }}
              </h1>
            </div>

            <div
              v-if="selectedArticle"
              class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400"
            >
              <div
                v-for="item in articleMetadataItems"
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
              v-if="articleSummaryPreview"
              class="max-w-4xl text-sm leading-6 text-gray-600 dark:text-gray-300"
            >
              {{ articleSummaryPreview }}
            </p>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-2 xl:max-w-lg">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-refresh-cw"
              :loading="detailLoading"
              @click="refreshArticle"
            >
              Refresh
            </UButton>

            <UButton
              color="neutral"
              variant="ghost"
              :disabled="savePending || !hasUnsavedChanges"
              @click="resetForm"
            >
              Reset changes
            </UButton>

            <UButton
              color="primary"
              icon="i-lucide-save"
              :loading="savePending"
              :disabled="!canSave"
              @click="saveArticle"
            >
              Save Changes
            </UButton>

            <p class="basis-full text-right text-xs text-gray-500 dark:text-gray-400">
              {{ saveReadinessLabel }}
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

        <UAlert
          v-else-if="saveError"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="saveError"
        />

        <UAlert
          v-else-if="extrasJsonValidationError"
          color="warning"
          variant="soft"
          icon="i-lucide-braces"
          :title="extrasJsonValidationError"
        />

        <template v-if="detailLoading">
          <UCard
            :ui="{ body: 'p-5 sm:p-6' }"
            class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
          >
            <div class="space-y-4">
              <div class="h-8 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
              <div class="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(18rem,0.9fr)]">
                <div class="h-[34rem] animate-pulse rounded-2xl bg-gray-200 dark:bg-white/10" />
                <div class="h-[24rem] animate-pulse rounded-2xl bg-gray-200 dark:bg-white/10" />
              </div>
            </div>
          </UCard>
        </template>

        <template v-else-if="selectedArticle">
          <div class="rounded-2xl border border-gray-200/80 bg-gradient-to-r from-white via-white to-brand-50/60 px-5 py-4 shadow-sm dark:border-white/10 dark:from-zinc-900/80 dark:via-zinc-900/80 dark:to-brand-500/10">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-lucide-file-pen-line"
                    class="h-4 w-4 text-brand-600 dark:text-brand-300"
                  />
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">
                    Editorial Workspace
                  </p>
                </div>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Work through the record in-place, compare AI-enriched signals in the side rail, and keep the main article form visible while you curate.
                </p>
              </div>

              <UBadge
                :color="hasUnsavedChanges ? 'warning' : 'success'"
                variant="soft"
              >
                {{ hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved' }}
              </UBadge>
            </div>
          </div>

          <div class="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(18rem,0.9fr)]">
            <div class="space-y-6">
              <UCard
                :ui="{ body: 'p-5 sm:p-6' }"
                class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
              >
                <template #header>
                  <div>
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                      Editorial Overview
                    </h2>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Shape how the article reads in the catalog before diving into the denser classification metadata.
                    </p>
                  </div>
                </template>

                <div class="space-y-4">
                  <div class="grid gap-4 sm:grid-cols-2">
                    <UFormField
                      label="Title"
                      required
                    >
                      <UInput
                        v-model="articleForm.title"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Venue"
                      required
                    >
                      <UInput
                        v-model="articleForm.venue"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <UFormField label="Canonical URL">
                      <UInput
                        v-model="articleForm.url"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="DOI">
                      <UInput
                        v-model="articleForm.doi"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <div class="grid gap-4 sm:grid-cols-3">
                    <UFormField label="Publication Year">
                      <UInput
                        v-model="articleForm.publicationYear"
                        type="number"
                        placeholder="e.g. 2024"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Article Type">
                      <UInput
                        v-model="articleForm.type"
                        placeholder="e.g. Review"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Organization URN">
                      <UInput
                        v-model="articleForm.organizationUrn"
                        placeholder="urn:..."
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <UFormField label="Description">
                    <UTextarea
                      v-model="articleForm.description"
                      :rows="4"
                      class="w-full"
                    />
                    <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                      A concise curator-written summary that helps the record scan well in internal and public article views.
                    </p>
                  </UFormField>

                  <UFormField label="Abstract">
                    <UTextarea
                      v-model="articleForm.abstract"
                      :rows="6"
                      class="w-full"
                    />
                  </UFormField>
                </div>
              </UCard>

              <UCard
                :ui="{ body: 'p-5 sm:p-6' }"
                class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
              >
                <template #header>
                  <div>
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                      Classification & Audience
                    </h2>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Curate the human-authoritative fields that shape retrieval, downstream prompts, and public presentation.
                    </p>
                  </div>
                </template>

                <div class="space-y-4">
                  <div class="grid gap-4 sm:grid-cols-2">
                    <UFormField label="Category">
                      <UInput
                        v-model="articleForm.category"
                        placeholder="e.g. Cardiometabolic Health"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Study Type">
                      <UInput
                        v-model="articleForm.studyType"
                        placeholder="e.g. Meta-analysis"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <UFormField label="Reader Group">
                      <UInput
                        v-model="articleForm.readerGroup"
                        placeholder="e.g. General public"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Population Group">
                      <UInput
                        v-model="articleForm.populationGroup"
                        placeholder="e.g. Adults with obesity"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <UFormField label="Age Group">
                      <UInput
                        v-model="articleForm.ageGroup"
                        placeholder="e.g. Adults"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Biological Model">
                      <UInput
                        v-model="articleForm.biologicalModel"
                        placeholder="e.g. Human"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <UFormField label="Region">
                      <UInput
                        v-model="articleForm.region"
                        placeholder="e.g. Europe"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Language">
                      <UInput
                        v-model="articleForm.language"
                        placeholder="e.g. en"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <UFormField label="Country / Region Context">
                      <UInput
                        v-model="articleForm.countryOrRegion"
                        placeholder="e.g. United Kingdom"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Income Setting">
                      <UInput
                        v-model="articleForm.incomeSetting"
                        placeholder="e.g. High income"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <UFormField label="Authors">
                    <UTextarea
                      v-model="articleForm.authors"
                      :rows="5"
                      placeholder="One author per line, or separate them with commas"
                      class="w-full"
                    />
                  </UFormField>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <UFormField label="Tags">
                      <UTextarea
                        v-model="articleForm.tags"
                        :rows="4"
                        placeholder="Comma-separated or one tag per line"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Topics">
                      <UTextarea
                        v-model="articleForm.topics"
                        :rows="4"
                        placeholder="Comma-separated or one topic per line"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <UFormField label="Keywords">
                      <UTextarea
                        v-model="articleForm.keywords"
                        :rows="4"
                        placeholder="Comma-separated or one keyword per line"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Hard Exclusion Flags">
                      <UTextarea
                        v-model="articleForm.hardExclusionFlags"
                        :rows="4"
                        placeholder="Comma-separated or one flag per line"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <UFormField label="Key Takeaways">
                    <UTextarea
                      v-model="articleForm.keyTakeaways"
                      :rows="5"
                      placeholder="Prefer one takeaway per line"
                      class="w-full"
                    />
                    <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                      These are the authoritative takeaways shown before the AI-generated ones.
                    </p>
                  </UFormField>
                </div>
              </UCard>

              <UCard
                :ui="{ body: 'p-5 sm:p-6' }"
                class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
              >
                <template #header>
                  <div>
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                      Advanced Metadata
                    </h2>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Reference metrics, access state, and raw extras are editable here for higher-fidelity curation passes.
                    </p>
                  </div>
                </template>

                <div class="space-y-4">
                  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <UFormField label="Open Access">
                      <USelectMenu
                        v-model="articleForm.openAccess"
                        :items="openAccessOptions"
                        value-key="value"
                        label-key="label"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="License">
                      <UInput
                        v-model="articleForm.license"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="External ID">
                      <UInput
                        v-model="articleForm.externalId"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Annotation Confidence">
                      <UInput
                        v-model="articleForm.annotationConfidence"
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <div class="grid gap-4 sm:grid-cols-3">
                    <UFormField label="Citation Count">
                      <UInput
                        v-model="articleForm.citationCount"
                        type="number"
                        min="0"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Reference Count">
                      <UInput
                        v-model="articleForm.referenceCount"
                        type="number"
                        min="0"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Influential Citations">
                      <UInput
                        v-model="articleForm.influentialCitationCount"
                        type="number"
                        min="0"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <UFormField label="Extras JSON">
                    <UTextarea
                      v-model="articleForm.extrasJson"
                      :rows="14"
                      class="w-full font-mono text-xs"
                    />
                    <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                      Use this for enriched metadata that does not warrant a dedicated control yet, including nested evaluation and annotation payloads.
                    </p>
                  </UFormField>
                </div>
              </UCard>

              <UCard
                :ui="{ body: 'p-5 sm:p-6' }"
                class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
              >
                <template #header>
                  <div>
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                      Full Content
                    </h2>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Keep the working body visible while you curate the surrounding metadata.
                    </p>
                  </div>
                </template>

                <UFormField label="Article Body">
                  <UTextarea
                    v-model="articleForm.content"
                    :rows="22"
                    class="w-full"
                  />
                </UFormField>
              </UCard>
            </div>

            <aside class="space-y-6 xl:sticky xl:top-24 xl:self-start">
              <UCard
                :ui="{ body: 'p-5 sm:p-6' }"
                class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
              >
                <template #header>
                  <div>
                    <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                      Record Snapshot
                    </h2>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Source provenance, timestamps, and quick links.
                    </p>
                  </div>
                </template>

                <div class="space-y-4">
                  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div
                      v-for="item in snapshotStats"
                      :key="item.label"
                      class="rounded-xl border border-gray-200/80 bg-gray-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                    >
                      <p class="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                        {{ item.label }}
                      </p>
                      <p class="mt-1 break-words text-sm font-semibold text-gray-900 dark:text-white">
                        {{ item.value }}
                      </p>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <UButton
                      v-if="publicArticleRoute"
                      :to="publicArticleRoute"
                      color="neutral"
                      variant="outline"
                      size="sm"
                      icon="i-lucide-globe"
                      class="w-full justify-center"
                    >
                      Open Public Article
                    </UButton>

                    <UButton
                      v-if="selectedArticle.url"
                      :to="selectedArticle.url"
                      target="_blank"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      icon="i-lucide-external-link"
                      class="w-full justify-center"
                    >
                      Open Source URL
                    </UButton>

                    <UButton
                      v-if="doiUrl"
                      :to="doiUrl"
                      target="_blank"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      icon="i-lucide-link-2"
                      class="w-full justify-center"
                    >
                      Open DOI
                    </UButton>
                  </div>
                </div>
              </UCard>

              <UCard
                :ui="{ body: 'p-5 sm:p-6' }"
                class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
              >
                <template #header>
                  <div>
                    <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                      AI Signals
                    </h2>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Compare the editor-facing fields with the enrichment layer without leaving the page.
                    </p>
                  </div>
                </template>

                <div class="space-y-4">
                  <div v-if="selectedArticle.ai_category">
                    <p class="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                      AI Category
                    </p>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <UBadge
                        color="neutral"
                        variant="outline"
                      >
                        {{ selectedArticle.ai_category }}
                      </UBadge>
                    </div>
                  </div>

                  <div v-if="selectedArticle.ai_tags?.length">
                    <p class="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                      AI Tags
                    </p>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <UBadge
                        v-for="tag in selectedArticle.ai_tags"
                        :key="tag"
                        color="neutral"
                        variant="outline"
                      >
                        {{ tag }}
                      </UBadge>
                    </div>
                  </div>

                  <div v-if="selectedArticle.ai_key_takeaways?.length">
                    <p class="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                      AI Takeaways
                    </p>
                    <ul class="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <li
                        v-for="takeaway in selectedArticle.ai_key_takeaways"
                        :key="takeaway"
                        class="flex items-start gap-2"
                      >
                        <UIcon
                          name="i-lucide-sparkles"
                          class="mt-0.5 h-4 w-4 shrink-0 text-brand-500 dark:text-brand-300"
                        />
                        <span>{{ takeaway }}</span>
                      </li>
                    </ul>
                  </div>

                  <div v-if="evaluationCards.length" class="grid gap-3">
                    <div
                      v-for="item in evaluationCards"
                      :key="item.label"
                      class="rounded-xl border border-gray-200/80 bg-gray-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                    >
                      <p class="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                        {{ item.label }}
                      </p>
                      <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                        {{ item.value }}
                      </p>
                    </div>
                  </div>

                  <p
                    v-if="simplifiedAbstractPreview"
                    class="rounded-xl border border-gray-200/80 bg-gray-50/70 px-4 py-3 text-sm leading-6 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                  >
                    {{ simplifiedAbstractPreview }}
                  </p>
                </div>
              </UCard>

              <UCard
                v-if="annotationSummaryItems.length"
                :ui="{ body: 'p-5 sm:p-6' }"
                class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
              >
                <template #header>
                  <div>
                    <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                      Annotation Coverage
                    </h2>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      A quick read on glossary and QA material attached to this article.
                    </p>
                  </div>
                </template>

                <div class="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <div
                    v-for="item in annotationSummaryItems"
                    :key="item.label"
                    class="flex items-center justify-between gap-3"
                  >
                    <span class="inline-flex items-center gap-2">
                      <UIcon
                        :name="item.icon"
                        class="h-4 w-4 text-brand-500 dark:text-brand-300"
                      />
                      {{ item.label }}
                    </span>
                    <span class="font-medium text-gray-900 dark:text-white">
                      {{ item.value }}
                    </span>
                  </div>
                </div>
              </UCard>
            </aside>
          </div>

          <UCard
            :ui="{ body: 'p-0', header: 'p-5 sm:p-6' }"
            class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
          >
            <template #header>
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div class="flex items-center gap-2">
                    <UIcon
                      name="i-lucide-file-stack"
                      class="h-4 w-4 text-brand-500 dark:text-brand-300"
                    />
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                      Artifacts
                    </h2>
                    <UBadge
                      color="neutral"
                      variant="outline"
                    >
                      {{ articleArtifacts.length }}
                    </UBadge>
                  </div>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Linked files stay visible from the same workspace so curators can review the source material alongside metadata editing.
                  </p>
                </div>
              </div>
            </template>

            <UTable
              :data="articleArtifacts"
              :columns="artifactColumns"
              class="min-h-[14rem]"
            >
              <template #title-cell="{ row }">
                <div class="min-w-[14rem] py-0.5">
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ row.original.title }}
                  </p>
                  <p class="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {{ row.original.description || 'No description' }}
                  </p>
                </div>
              </template>

              <template #file_type-cell="{ row }">
                <span class="text-sm text-gray-700 dark:text-gray-200">
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
                  {{ formatDate(row.original.updated_at || row.original.created_at) }}
                </span>
              </template>

              <template #actions-cell="{ row }">
                <div class="flex justify-end gap-2">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    icon="i-lucide-download"
                    :loading="downloadingArtifactId === row.original.id"
                    @click.stop="downloadArtifact(row.original)"
                  >
                    Download
                  </UButton>

                  <UButton
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    icon="i-lucide-pen-square"
                    @click.stop="openArtifactEditor(row.original)"
                  >
                    Edit
                  </UButton>
                </div>
              </template>

              <template #empty>
                <div class="flex flex-col items-center justify-center px-6 py-14 text-center">
                  <UIcon
                    name="i-lucide-file-x-2"
                    class="h-8 w-8 text-gray-400"
                  />
                  <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                    No artifacts are linked to this article yet.
                  </p>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Once files are attached upstream, this workspace will let you review and edit their metadata in-place.
                  </p>
                </div>
              </template>
            </UTable>
          </UCard>
        </template>

        <UCard
          v-else
          :ui="{ body: 'p-6 sm:p-8' }"
          class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
        >
          <div class="flex flex-col items-center justify-center text-center">
            <UIcon
              name="i-lucide-file-question"
              class="h-10 w-10 text-gray-400"
            />
            <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
              The requested article could not be opened.
            </p>
            <UButton
              class="mt-4"
              :to="articleLibraryRoute"
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
                  Update artifact metadata while keeping the linked file in place.
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
            <UFormField label="Title">
              <UInput
                v-model="artifactForm.title"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Description">
              <UTextarea
                v-model="artifactForm.description"
                :rows="4"
                class="w-full"
              />
            </UFormField>
            <UFormField label="File Type">
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { ArtifactUpdatePayload, CatalogArtifact } from '~/services/catalogApi'
import catalogApi from '~/services/catalogApi'
import type { Article, UpdateArticleRequest } from '~/services/articlesApi'
import articlesApi from '~/services/articlesApi'
import { fetchCatalogArtifactDownloadResponse, getArtifactPresignedUrl, hasS3Backing } from '~/services/objectStorageApi'
import { formatDoiUrl } from '~/utils/articleHelpers'
import {
  formatPublicationYear,
  getArticleCurationSummary,
  resolveArticleRouteParam
} from '~/utils/consoleArticles'
import { formatBytes, formatDate } from '~/utils/consoleGuideCatalog'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const toast = useToast()

const selectedArticle = ref<Article | null>(null)
const articleArtifacts = ref<CatalogArtifact[]>([])
const detailLoading = ref(false)
const detailError = ref<string | null>(null)
const savePending = ref(false)
const saveError = ref<string | null>(null)
const initialFormSnapshot = ref('')

const artifactEditorOpen = ref(false)
const artifactSavePending = ref(false)
const downloadingArtifactId = ref('')
const editingArtifactId = ref('')

const artifactForm = reactive({
  title: '',
  description: '',
  file_type: ''
})

const articleForm = reactive({
  title: '',
  description: '',
  abstract: '',
  content: '',
  venue: '',
  publicationYear: '',
  url: '',
  doi: '',
  externalId: '',
  type: '',
  organizationUrn: '',
  category: '',
  studyType: '',
  readerGroup: '',
  ageGroup: '',
  populationGroup: '',
  biologicalModel: '',
  region: '',
  language: '',
  countryOrRegion: '',
  incomeSetting: '',
  authors: '',
  tags: '',
  topics: '',
  keywords: '',
  hardExclusionFlags: '',
  keyTakeaways: '',
  openAccess: 'unknown',
  license: '',
  annotationConfidence: '',
  citationCount: '',
  referenceCount: '',
  influentialCitationCount: '',
  extrasJson: ''
})

const artifactColumns = [
  { accessorKey: 'title', header: 'Artifact' },
  { accessorKey: 'file_type', header: 'Type' },
  { accessorKey: 'file_size', header: 'Size' },
  { accessorKey: 'updated_at', header: 'Updated' },
  { id: 'actions', header: '', enableSorting: false }
]

const openAccessOptions = [
  { label: 'Unknown', value: 'unknown' },
  { label: 'Open access', value: 'true' },
  { label: 'Closed access', value: 'false' }
]

const resolvedArticleUrn = computed(() => resolveArticleRouteParam(route.params.urn))
const articleLibraryRoute = '/console/assets/articles'

const pageTitle = computed(() => articleForm.title.trim() || selectedArticle.value?.title || 'Article Workspace')
const doiUrl = computed(() => formatDoiUrl(selectedArticle.value?.doi))
const publicArticleRoute = computed(() =>
  selectedArticle.value ? `/foodscholar/${encodeURIComponent(selectedArticle.value.urn)}` : ''
)

const categoryPreviewLabel = computed(() => {
  if (articleForm.category.trim()) {
    return articleForm.category.trim()
  }

  if (selectedArticle.value?.ai_category) {
    return `${selectedArticle.value.ai_category} (AI)`
  }

  return 'Unclassified'
})

const articleSummaryPreview = computed(() =>
  articleForm.description.trim() || articleForm.abstract.trim() || ''
)

const curationPreview = computed(() =>
  getArticleCurationSummary({
    category: articleForm.category.trim(),
    tags: parseDelimitedList(articleForm.tags),
    key_takeaways: parseLineList(articleForm.keyTakeaways),
    description: articleForm.description.trim(),
    abstract: articleForm.abstract.trim()
  })
)

const articleMetadataItems = computed(() => {
  const article = selectedArticle.value
  if (!article) {
    return []
  }

  return [
    { label: formatPublicationYear(article.publication_year), icon: 'i-lucide-calendar-range' },
    { label: article.venue || 'No venue', icon: 'i-lucide-book-open' },
    { label: article.reader_group || 'Reader group not set', icon: 'i-lucide-users' },
    { label: `${articleArtifacts.value.length} artifacts`, icon: 'i-lucide-file-stack' },
    { label: `Updated ${formatDate(article.updated_at)}`, icon: 'i-lucide-clock-3' }
  ]
})

const snapshotStats = computed(() => {
  const article = selectedArticle.value
  if (!article) {
    return []
  }

  return [
    { label: 'URN', value: article.urn },
    { label: 'Creator', value: article.creator || 'Unknown' },
    { label: 'Created', value: formatDate(article.created_at) },
    { label: 'Updated', value: formatDate(article.updated_at) }
  ]
})

const evaluationCards = computed(() => {
  const evaluation = selectedArticle.value?.extras?.evaluation
  if (!evaluation) {
    return []
  }

  return [
    evaluation.safety_sensitivity
      ? { label: 'Safety Sensitivity', value: evaluation.safety_sensitivity }
      : null,
    evaluation.actionability_score !== null && evaluation.actionability_score !== undefined
      ? { label: 'Actionability', value: `${evaluation.actionability_score}/5` }
      : null,
    evaluation.user_value_score !== null && evaluation.user_value_score !== undefined
      ? { label: 'User Value', value: `${evaluation.user_value_score}/5` }
      : null,
    evaluation.recommended_user_framing
      ? { label: 'Recommended Framing', value: evaluation.recommended_user_framing }
      : null
  ].filter((item): item is { label: string, value: string } => Boolean(item))
})

const simplifiedAbstractPreview = computed(() =>
  selectedArticle.value?.extras?.annotations?.abstract || ''
)

const annotationSummaryItems = computed(() => {
  const annotations = selectedArticle.value?.extras?.annotations
  if (!annotations) {
    return []
  }

  return [
    annotations.glosary?.length
      ? { label: 'Glossary Terms', value: String(annotations.glosary.length), icon: 'i-lucide-book-a' }
      : null,
    annotations.user_qa?.length
      ? { label: 'User Q&A', value: String(annotations.user_qa.length), icon: 'i-lucide-message-circle-question' }
      : null,
    annotations.practitioner_qa?.length
      ? { label: 'Practitioner Q&A', value: String(annotations.practitioner_qa.length), icon: 'i-lucide-stethoscope' }
      : null,
    annotations.expert_qa?.length
      ? { label: 'Expert Q&A', value: String(annotations.expert_qa.length), icon: 'i-lucide-brain' }
      : null
  ].filter((item): item is { label: string, value: string, icon: string } => Boolean(item))
})

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
    label: 'Scientific Articles',
    icon: 'i-lucide-flask-conical',
    to: articleLibraryRoute
  },
  {
    label: pageTitle.value,
    icon: 'i-lucide-file-pen-line'
  }
])

const extrasJsonValidationError = computed(() => {
  if (!articleForm.extrasJson.trim()) {
    return ''
  }

  try {
    JSON.parse(articleForm.extrasJson)
    return ''
  } catch (error) {
    return error instanceof Error ? `Extras JSON is invalid: ${error.message}` : 'Extras JSON is invalid.'
  }
})

const hasUnsavedChanges = computed(() => initialFormSnapshot.value !== serializeFormState())
const canSave = computed(() => Boolean(selectedArticle.value) && !extrasJsonValidationError.value && !savePending.value)

const saveReadinessLabel = computed(() => {
  if (extrasJsonValidationError.value) {
    return 'Fix the extras JSON before saving.'
  }

  if (savePending.value) {
    return 'Saving article changes...'
  }

  if (!hasUnsavedChanges.value) {
    return 'No unsaved changes.'
  }

  return curationPreview.value.isComplete
    ? 'All core curation fields are filled.'
    : `Missing ${curationPreview.value.missingLabels.join(', ')}.`
})

useHead({
  title: computed(() => selectedArticle.value ? `${selectedArticle.value.title} | Scientific Articles` : 'Article Workspace')
})

useSeoMeta({
  description: computed(() => selectedArticle.value?.description || selectedArticle.value?.abstract || 'Wisefood article workspace for review and curation')
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

function parseLineList(value: string) {
  const entries = value
    .split('\n')
    .map(item => item.trim())
    .filter(item => item.length > 0)

  return Array.from(new Set(entries))
}

function serializeDelimitedList(values: string[] | null | undefined) {
  return (values || []).join('\n')
}

function serializeExtras(value: unknown) {
  if (!value || (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length === 0)) {
    return ''
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return ''
  }
}

function parsePublicationYearInput(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  if (/^\d{4}$/.test(normalized)) {
    return `${normalized}-01-01`
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized
  }

  throw new Error('Publication year must be a 4-digit year such as 2024.')
}

function parseIntegerInput(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  if (!/^\d+$/.test(normalized)) {
    throw new Error('Numeric metrics must be whole numbers.')
  }

  return Number(normalized)
}

function parseConfidenceInput(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  const numericValue = Number(normalized)
  if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 1) {
    throw new Error('Annotation confidence must be between 0 and 1.')
  }

  return numericValue
}

function parseOpenAccessValue(value: string) {
  switch (value) {
    case 'true':
      return true
    case 'false':
      return false
    default:
      return null
  }
}

function serializeFormState() {
  return JSON.stringify({ ...articleForm })
}

function populateArticleForm(article: Article) {
  articleForm.title = article.title || ''
  articleForm.description = article.description || ''
  articleForm.abstract = article.abstract || ''
  articleForm.content = article.content || ''
  articleForm.venue = article.venue || ''
  articleForm.publicationYear = article.publication_year ? formatPublicationYear(article.publication_year) : ''
  articleForm.url = article.url || ''
  articleForm.doi = article.doi || ''
  articleForm.externalId = article.external_id || ''
  articleForm.type = typeof article.type === 'string' ? article.type : ''
  articleForm.organizationUrn = article.organization_urn || ''
  articleForm.category = article.category || ''
  articleForm.studyType = article.study_type || ''
  articleForm.readerGroup = article.reader_group || ''
  articleForm.ageGroup = article.age_group || ''
  articleForm.populationGroup = article.population_group || ''
  articleForm.biologicalModel = article.biological_model || ''
  articleForm.region = article.region || ''
  articleForm.language = article.language || ''
  articleForm.countryOrRegion = article.geographic_context?.country_or_region || ''
  articleForm.incomeSetting = article.geographic_context?.income_setting || ''
  articleForm.authors = serializeDelimitedList(article.authors)
  articleForm.tags = serializeDelimitedList(article.tags)
  articleForm.topics = serializeDelimitedList(article.topics || [])
  articleForm.keywords = serializeDelimitedList(article.keywords || [])
  articleForm.hardExclusionFlags = serializeDelimitedList(article.hard_exclusion_flags || [])
  articleForm.keyTakeaways = serializeDelimitedList(article.key_takeaways || [])
  articleForm.openAccess = article.open_access === true ? 'true' : article.open_access === false ? 'false' : 'unknown'
  articleForm.license = article.license || ''
  articleForm.annotationConfidence = article.annotation_confidence === null || article.annotation_confidence === undefined
    ? ''
    : String(article.annotation_confidence)
  articleForm.citationCount = article.citation_count === null || article.citation_count === undefined ? '' : String(article.citation_count)
  articleForm.referenceCount = article.reference_count === null || article.reference_count === undefined ? '' : String(article.reference_count)
  articleForm.influentialCitationCount = article.influential_citation_count === null || article.influential_citation_count === undefined
    ? ''
    : String(article.influential_citation_count)
  articleForm.extrasJson = serializeExtras(article.extras)
  initialFormSnapshot.value = serializeFormState()
}

function buildArticleUpdatePayload(): UpdateArticleRequest {
  const title = normalizeNullable(articleForm.title)
  const venue = normalizeNullable(articleForm.venue)
  const authors = parseDelimitedList(articleForm.authors)
  const tags = parseDelimitedList(articleForm.tags)
  const topics = parseDelimitedList(articleForm.topics)
  const keywords = parseDelimitedList(articleForm.keywords)
  const hardExclusionFlags = parseDelimitedList(articleForm.hardExclusionFlags)
  const keyTakeaways = parseLineList(articleForm.keyTakeaways)
  const publicationYear = parsePublicationYearInput(articleForm.publicationYear)
  const extras = articleForm.extrasJson.trim() ? JSON.parse(articleForm.extrasJson) : null
  const countryOrRegion = normalizeNullable(articleForm.countryOrRegion)
  const incomeSetting = normalizeNullable(articleForm.incomeSetting)

  if (!title) {
    throw new Error('Title is required.')
  }

  if (!venue) {
    throw new Error('Venue is required.')
  }

  return {
    title,
    description: normalizeNullable(articleForm.description),
    abstract: normalizeNullable(articleForm.abstract),
    content: normalizeNullable(articleForm.content),
    venue,
    publication_year: publicationYear,
    url: normalizeNullable(articleForm.url),
    doi: normalizeNullable(articleForm.doi),
    external_id: normalizeNullable(articleForm.externalId),
    type: normalizeNullable(articleForm.type),
    organization_urn: normalizeNullable(articleForm.organizationUrn),
    category: normalizeNullable(articleForm.category),
    study_type: normalizeNullable(articleForm.studyType),
    reader_group: normalizeNullable(articleForm.readerGroup),
    age_group: normalizeNullable(articleForm.ageGroup),
    population_group: normalizeNullable(articleForm.populationGroup),
    biological_model: normalizeNullable(articleForm.biologicalModel),
    region: normalizeNullable(articleForm.region),
    language: normalizeNullable(articleForm.language),
    geographic_context: countryOrRegion || incomeSetting
      ? {
          country_or_region: countryOrRegion,
          income_setting: incomeSetting
        }
      : null,
    authors: authors.length ? authors : null,
    tags,
    topics,
    keywords,
    hard_exclusion_flags: hardExclusionFlags,
    key_takeaways: keyTakeaways,
    open_access: parseOpenAccessValue(articleForm.openAccess),
    license: normalizeNullable(articleForm.license),
    annotation_confidence: parseConfidenceInput(articleForm.annotationConfidence),
    citation_count: parseIntegerInput(articleForm.citationCount),
    reference_count: parseIntegerInput(articleForm.referenceCount),
    influential_citation_count: parseIntegerInput(articleForm.influentialCitationCount),
    extras
  }
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

function setArtifactEditorForm(artifact: CatalogArtifact) {
  artifactForm.title = artifact.title
  artifactForm.description = artifact.description || ''
  artifactForm.file_type = artifact.file_type
}

function mergeArtifact(updatedArtifact: CatalogArtifact) {
  articleArtifacts.value = articleArtifacts.value.map(artifact =>
    artifact.id === updatedArtifact.id ? updatedArtifact : artifact
  )
}

function buildArtifactFilename(artifact: CatalogArtifact, response: Response) {
  const contentDisposition = response.headers.get('content-disposition') || ''
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match) {
    return decodeURIComponent(utf8Match[1])
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  if (plainMatch) {
    return plainMatch[1]
  }

  const safeTitle = artifact.title.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '')
  return safeTitle || `artifact-${artifact.id}`
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
      response = await fetchS3ArtifactDownloadResponse(artifact)
    } else {
      response = await fetchCatalogArtifactDownloadResponse(artifact.id)
    }

    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`)
    }

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = buildArtifactFilename(artifact, response)
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(objectUrl)
  } catch (error) {
    toast.add({
      title: 'Artifact download failed',
      description: resolveErrorMessage(error, 'The artifact could not be downloaded.'),
      color: 'error'
    })
  } finally {
    downloadingArtifactId.value = ''
  }
}

function openArtifactEditor(artifact: CatalogArtifact) {
  editingArtifactId.value = artifact.id
  setArtifactEditorForm(artifact)
  artifactEditorOpen.value = true
}

async function saveArtifact() {
  if (!editingArtifactId.value) {
    return
  }

  artifactSavePending.value = true

  try {
    const payload: ArtifactUpdatePayload = {
      title: normalizeNullable(artifactForm.title) || undefined,
      description: normalizeNullable(artifactForm.description),
      file_type: normalizeNullable(artifactForm.file_type) || 'application/octet-stream'
    }

    const updatedArtifact = await catalogApi.updateArtifact(editingArtifactId.value, payload)
    mergeArtifact(updatedArtifact)

    toast.add({
      title: 'Artifact updated',
      description: `${updatedArtifact.title} metadata was saved.`,
      color: 'success'
    })

    artifactEditorOpen.value = false
  } catch (error) {
    toast.add({
      title: 'Artifact update failed',
      description: resolveErrorMessage(error, 'The artifact metadata could not be saved.'),
      color: 'error'
    })
  } finally {
    artifactSavePending.value = false
  }
}

async function loadArticle() {
  detailLoading.value = true
  detailError.value = null

  try {
    const article = await articlesApi.getArticle(resolvedArticleUrn.value)
    selectedArticle.value = article
    articleArtifacts.value = article.artifacts || []
    populateArticleForm(article)
  } catch (error) {
    selectedArticle.value = null
    articleArtifacts.value = []
    detailError.value = resolveErrorMessage(error, 'Failed to load article')
  } finally {
    detailLoading.value = false
  }
}

async function refreshArticle() {
  await loadArticle()
}

function resetForm() {
  if (!selectedArticle.value) {
    return
  }

  saveError.value = null
  populateArticleForm(selectedArticle.value)
}

async function saveArticle() {
  if (!selectedArticle.value) {
    return
  }

  savePending.value = true
  saveError.value = null

  try {
    const payload = buildArticleUpdatePayload()
    const updatedArticle = await articlesApi.updateArticle(selectedArticle.value.urn, payload)
    selectedArticle.value = {
      ...updatedArticle,
      artifacts: updatedArticle.artifacts || articleArtifacts.value
    }
    articleArtifacts.value = selectedArticle.value.artifacts || articleArtifacts.value
    populateArticleForm(selectedArticle.value)

    toast.add({
      title: 'Article updated',
      description: `${selectedArticle.value.title} was saved successfully.`,
      color: 'success'
    })
  } catch (error) {
    saveError.value = resolveErrorMessage(error, 'Failed to save article')
  } finally {
    savePending.value = false
  }
}

onMounted(() => {
  void loadArticle()
})

watch(resolvedArticleUrn, (nextUrn, previousUrn) => {
  if (nextUrn && nextUrn !== previousUrn) {
    void loadArticle()
  }
})
</script>
