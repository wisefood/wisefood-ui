<template>
  <div>
    <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <UBreadcrumb
        :items="breadcrumbItems"
        class="mb-4"
      />

      <UPageBody class="space-y-6">
        <section class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div class="min-w-0 space-y-4">
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
                v-if="articleForm.openAccess !== 'unknown'"
                :color="articleForm.openAccess === 'true' ? 'success' : 'neutral'"
                variant="outline"
              >
                {{ articleForm.openAccess === 'true' ? 'Open access' : 'Closed access' }}
              </UBadge>
            </div>

            <h1 class="min-w-0 text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
              {{ pageTitle }}
            </h1>

            <div
              v-if="headerAudienceItems.length || annotationConfidenceLabel"
              class="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400"
            >
              <div
                v-for="item in headerAudienceItems"
                :key="item.label"
                class="flex items-center gap-2"
              >
                <UIcon
                  :name="item.icon"
                  class="h-4 w-4 shrink-0 text-brand-500 dark:text-brand-300"
                />
                <span>
                  <strong>{{ item.label }}:</strong> {{ item.value }}
                </span>
              </div>

              <UBadge
                v-if="annotationConfidenceLabel"
                color="primary"
                variant="soft"
                class="text-xs"
              >
                <UIcon
                  name="i-lucide-badge-check"
                  class="mr-1 h-3 w-3"
                />
                Confidence {{ annotationConfidenceLabel }}
              </UBadge>
            </div>

            <div
              v-if="headerPublicationItems.length"
              class="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400"
            >
              <div
                v-for="item in headerPublicationItems"
                :key="item.label"
                class="flex items-center gap-2"
              >
                <template v-if="item.href">
                  <a
                    :href="item.href"
                    :target="item.external ? '_blank' : undefined"
                    :rel="item.external ? 'noopener noreferrer' : undefined"
                    class="inline-flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-400"
                  >
                    <UIcon
                      :name="item.icon"
                      class="h-4 w-4 shrink-0"
                    />
                    <span>{{ item.label }}</span>
                  </a>
                </template>
                <template v-else>
                  <UIcon
                    :name="item.icon"
                    class="h-4 w-4 shrink-0"
                  />
                  <span>{{ item.value }}</span>
                </template>
              </div>
            </div>

            <div
              v-if="headerAuthors.length"
              class="flex flex-wrap gap-2"
            >
              <span
                v-for="author in headerAuthors"
                :key="author"
                class="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-zinc-800 dark:text-gray-300"
              >
                {{ author }}
              </span>
            </div>

            <div
              v-if="headerSystemItems.length"
              class="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400"
            >
              <div
                v-for="item in headerSystemItems"
                :key="item.label"
                class="flex min-w-0 items-center gap-1.5"
              >
                <UIcon
                  :name="item.icon"
                  class="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500"
                />
                <span class="font-medium text-gray-600 dark:text-gray-300">
                  {{ item.label }}:
                </span>
                <span class="min-w-0 max-w-[18rem] truncate">
                  {{ item.value }}
                </span>
              </div>
            </div>
          </div>

          <div
            ref="mainSaveActionsRef"
            class="flex flex-wrap items-center justify-end gap-2 xl:max-w-sm"
          >
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

            <div class="flex basis-full justify-end">
              <UBadge
                :color="saveStatus.color"
                variant="soft"
              >
                {{ saveStatus.label }}
              </UBadge>
            </div>

            <p
              v-if="saveReadinessLabel"
              class="basis-full text-right text-xs text-gray-500 dark:text-gray-400"
            >
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
              <div class="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(19rem,0.95fr)]">
                <div class="h-[38rem] animate-pulse rounded-2xl bg-gray-200 dark:bg-white/10" />
                <div class="h-[28rem] animate-pulse rounded-2xl bg-gray-200 dark:bg-white/10" />
              </div>
            </div>
          </UCard>
        </template>

        <template v-else-if="selectedArticle">
          <div class="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(19rem,0.95fr)]">
            <div class="space-y-6">
              <UCard
                :ui="{ body: 'p-5 sm:p-6' }"
                class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
              >
                <template #header>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Article
                  </h2>
                </template>

                <div class="space-y-5">
                  <UFormField
                    label="Title"
                    required
                  >
                    <UInput
                      v-model="articleForm.title"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Authors">
                    <UTextarea
                      v-model="articleForm.authors"
                      :rows="4"
                      placeholder="One author per line, or separate them with commas"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Abstract">
                    <UTextarea
                      v-model="articleForm.abstract"
                      :rows="8"
                      placeholder="Add the curator-approved abstract for the article"
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
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Curation
                  </h2>
                </template>

                <div class="space-y-6">
                  <section class="space-y-4">
                    <div class="flex items-center gap-2">
                      <UIcon
                        name="i-lucide-compass"
                        class="h-4 w-4 text-brand-500 dark:text-brand-300"
                      />
                      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                        Positioning
                      </h3>
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2">
                      <UFormField label="Category">
                        <UInputMenu
                          v-model="articleForm.category"
                          :items="categoryOptions"
                          create-item="always"
                          leading
                          leading-icon="i-lucide-layers-3"
                          placeholder="Select or type and press Enter"
                          class="w-full"
                          @create="articleForm.category = String($event).trim()"
                        />
                      </UFormField>

                      <UFormField label="Study Type">
                        <UInputMenu
                          v-model="articleForm.studyType"
                          :items="studyTypeOptions"
                          create-item="always"
                          leading
                          leading-icon="i-lucide-flask-conical"
                          placeholder="Select or type and press Enter"
                          class="w-full"
                          @create="articleForm.studyType = String($event).trim()"
                        />
                      </UFormField>
                    </div>

                    <div class="grid gap-4 sm:grid-cols-3">
                      <UFormField label="Reader Group">
                        <UInputMenu
                          v-model="articleForm.readerGroup"
                          :items="readerGroupOptions"
                          create-item="always"
                          leading
                          leading-icon="i-lucide-users"
                          placeholder="Select or type and press Enter"
                          class="w-full"
                          @create="articleForm.readerGroup = String($event).trim()"
                        />
                      </UFormField>

                      <UFormField label="Age Group">
                        <UInputMenu
                          v-model="articleForm.ageGroup"
                          :items="ageGroupOptions"
                          create-item="always"
                          leading
                          leading-icon="i-lucide-baby"
                          placeholder="Select or type and press Enter"
                          class="w-full"
                          @create="articleForm.ageGroup = String($event).trim()"
                        />
                      </UFormField>

                      <UFormField label="Population Group">
                        <UInputMenu
                          v-model="articleForm.populationGroup"
                          :items="populationGroupOptions"
                          create-item="always"
                          leading
                          leading-icon="i-lucide-users"
                          placeholder="Select or type and press Enter"
                          class="w-full"
                          @create="articleForm.populationGroup = String($event).trim()"
                        />
                      </UFormField>
                    </div>

                    <div class="grid gap-4 sm:grid-cols-3">
                      <UFormField label="Biological Model">
                        <UInputMenu
                          v-model="articleForm.biologicalModel"
                          :items="biologicalModelOptions"
                          create-item="always"
                          leading
                          leading-icon="i-lucide-dna"
                          placeholder="Select or type and press Enter"
                          class="w-full"
                          @create="articleForm.biologicalModel = String($event).trim()"
                        />
                      </UFormField>

                      <UFormField label="Region">
                        <UInputMenu
                          v-model="articleForm.region"
                          :items="regionOptions"
                          create-item="always"
                          leading
                          leading-icon="i-lucide-globe"
                          placeholder="Select or type and press Enter"
                          class="w-full"
                          @create="articleForm.region = String($event).trim()"
                        />
                      </UFormField>

                      <UFormField label="Language">
                        <UInputMenu
                          v-model="articleForm.language"
                          :items="languageOptions"
                          value-key="value"
                          label-key="label"
                          create-item="always"
                          leading
                          leading-icon="i-lucide-languages"
                          placeholder="Select or type and press Enter"
                          class="w-full"
                          @create="articleForm.language = String($event).trim()"
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
                        <UInputMenu
                          v-model="articleForm.incomeSetting"
                          :items="incomeSettingOptions"
                          create-item="always"
                          leading
                          leading-icon="i-lucide-briefcase"
                          placeholder="Select or type and press Enter"
                          class="w-full"
                          @create="articleForm.incomeSetting = String($event).trim()"
                        />
                      </UFormField>
                    </div>
                  </section>

                  <section class="space-y-4 border-t border-gray-200/80 pt-6 dark:border-white/10">
                    <div class="flex items-center gap-2">
                      <UIcon
                        name="i-lucide-tags"
                        class="h-4 w-4 text-brand-500 dark:text-brand-300"
                      />
                      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                        Discoverability
                      </h3>
                    </div>

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

                      <UFormField label="Exclusion Flags">
                        <UTextarea
                          v-model="articleForm.hardExclusionFlags"
                          :rows="4"
                          placeholder="Comma-separated or one flag per line"
                          class="w-full"
                        />
                      </UFormField>
                    </div>

                    <UFormField label="Curator Takeaways">
                      <UTextarea
                        v-model="articleForm.keyTakeaways"
                        :rows="5"
                        placeholder="Prefer one takeaway per line"
                        class="w-full"
                      />
                    </UFormField>
                  </section>
                </div>
              </UCard>

              <UCard
                :ui="{ body: 'p-5 sm:p-6' }"
                class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
              >
                <template #header>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Body
                  </h2>
                </template>

                <UFormField label="Article Body">
                  <UTextarea
                    v-model="articleForm.content"
                    :rows="24"
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
                  <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                    Publication &amp; Access
                  </h2>
                </template>

                <div class="space-y-4">
                  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <UFormField
                      label="Venue"
                      required
                    >
                      <UInput
                        v-model="articleForm.venue"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Publication Year">
                      <UInput
                        v-model="articleForm.publicationYear"
                        type="text"
                        placeholder="e.g. 2024"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <UFormField label="Article Type">
                      <UInputMenu
                        v-model="articleForm.type"
                        :items="articleTypeOptions"
                        create-item="always"
                        leading
                        leading-icon="i-lucide-file-stack"
                        placeholder="Select or type and press Enter"
                        class="w-full"
                        @create="articleForm.type = String($event).trim()"
                      />
                    </UFormField>

                    <UFormField label="Open Access">
                      <USelectMenu
                        v-model="articleForm.openAccess"
                        :items="openAccessOptions"
                        value-key="value"
                        label-key="label"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <div class="grid gap-4">
                    <UFormField label="Source URL">
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

                  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <UFormField label="License">
                      <UInputMenu
                        v-model="articleForm.license"
                        :items="licenseOptions"
                        create-item="always"
                        leading
                        leading-icon="i-lucide-badge-check"
                        placeholder="Select or type and press Enter"
                        class="w-full"
                        @create="articleForm.license = String($event).trim()"
                      />
                    </UFormField>

                    <UFormField label="External ID">
                      <UInput
                        v-model="articleForm.externalId"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <UFormField label="Organization URN">
                    <UInput
                      v-model="articleForm.organizationUrn"
                      placeholder="urn:..."
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

                  <div class="grid gap-4 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
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

                  <UCollapsible class="rounded-2xl border border-gray-200/80 bg-gray-50/70 dark:border-white/10 dark:bg-white/5">
                    <template #default="{ open }">
                      <button
                        type="button"
                        class="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                      >
                        <div>
                          <p class="text-sm font-medium text-gray-900 dark:text-white">
                            Raw extras JSON
                          </p>
                          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Only open this when you need to work directly with the underlying payload.
                          </p>
                        </div>
                        <UIcon
                          name="i-lucide-chevron-down"
                          class="h-4 w-4 shrink-0 text-gray-500 transition-transform dark:text-gray-400"
                          :class="open ? 'rotate-180' : ''"
                        />
                      </button>
                    </template>

                    <template #content>
                      <div class="border-t border-gray-200/80 px-4 pb-4 pt-4 dark:border-white/10">
                        <UFormField label="Extras JSON">
                          <UTextarea
                            v-model="articleForm.extrasJson"
                            :rows="14"
                            class="w-full font-mono text-xs"
                          />
                        </UFormField>
                      </div>
                    </template>
                  </UCollapsible>
                </div>
              </UCard>

              <UCard
                :ui="{ body: 'p-5 sm:p-6' }"
                class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
              >
                <template #header>
                  <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                    Enrichment Signals
                  </h2>
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

                  <div
                    v-if="evaluationCards.length"
                    class="grid gap-3"
                  >
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
                  <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                    Attached Annotations
                  </h2>
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
              <div class="flex flex-wrap items-center gap-2">
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
            </template>

            <div class="border-b border-gray-200/80 p-5 sm:p-6 dark:border-white/10">
              <div class="rounded-2xl border border-dashed border-gray-300/80 bg-white/80 p-5 dark:border-white/15 dark:bg-white/5">
                <div class="flex flex-col gap-5">
                  <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">
                        Upload Article Artifact
                      </p>
                      <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        Attach source files, supplementary material, or datasets directly under this article.
                      </p>
                    </div>

                    <label
                      :class="[
                        'inline-flex cursor-pointer self-start',
                        artifactUploadPending ? 'pointer-events-none opacity-60' : ''
                      ]"
                    >
                      <span class="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-primary-400 hover:text-primary-700 dark:border-white/15 dark:bg-white/10 dark:text-gray-100 dark:hover:border-primary-400 dark:hover:text-primary-200">
                        <UIcon
                          name="i-lucide-file-up"
                          class="h-4 w-4"
                        />
                        Choose File
                      </span>
                      <input
                        :key="artifactUploadFileInputKey"
                        type="file"
                        class="hidden"
                        @change="handleArtifactUploadSelection"
                      >
                    </label>
                  </div>

                  <UAlert
                    v-if="artifactUploadError"
                    color="error"
                    variant="soft"
                    icon="i-lucide-alert-circle"
                    :title="artifactUploadError"
                  />

                  <div class="rounded-xl border border-gray-200/80 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-black/10">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ artifactUploadSelectedFileLabel }}
                    </p>
                    <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                      {{ artifactUploadSelectedFileMeta }}
                    </p>
                  </div>

                  <div class="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(16rem,0.9fr)_auto] lg:items-end">
                    <UFormField
                      label="Artifact Name"
                      required
                    >
                      <UInput
                        v-model="artifactUploadForm.title"
                        placeholder="e.g. Supplementary appendix"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="File Type"
                      required
                    >
                      <USelectMenu
                        v-model="artifactUploadForm.file_type"
                        :items="artifactUploadFileTypeOptions"
                        value-key="value"
                        label-key="label"
                        class="w-full"
                      />
                    </UFormField>

                    <div class="flex lg:justify-end">
                      <UButton
                        color="primary"
                        icon="i-lucide-upload"
                        class="w-full lg:w-auto"
                        :loading="artifactUploadPending"
                        :disabled="!canUploadArtifact"
                        @click="uploadArticleArtifact"
                      >
                        Upload Artifact
                      </UButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
                    Upload the first artifact above to attach source material and keep it editable from this workspace.
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

    <Transition
      enter-active-class="transform transition duration-200 ease-out"
      enter-from-class="translate-y-6 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transform transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-6 opacity-0"
    >
      <div
        v-if="showFloatingSaveBar"
        class="fixed bottom-4 left-4 right-4 z-40 sm:bottom-6 sm:left-6 sm:right-auto sm:w-[28rem]"
      >
        <div class="rounded-2xl border border-gray-200/80 bg-white/95 p-4 shadow-2xl ring-1 ring-black/5 backdrop-blur dark:border-white/10 dark:bg-zinc-900/90 dark:ring-white/10">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                  Article changes
                </p>
                <p
                  v-if="saveReadinessLabel"
                  class="mt-1 text-sm font-medium text-gray-900 dark:text-white"
                >
                  {{ saveReadinessLabel }}
                </p>
              </div>

              <UBadge
                :color="saveStatus.color"
                variant="soft"
              >
                {{ saveStatus.label }}
              </UBadge>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                size="sm"
                :disabled="savePending || !hasUnsavedChanges"
                @click="resetForm"
              >
                Reset changes
              </UButton>

              <UButton
                color="primary"
                size="sm"
                icon="i-lucide-save"
                :loading="savePending"
                :disabled="!canSave"
                @click="saveArticle"
              >
                Save Changes
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>

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
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { ArtifactUpdatePayload, CatalogArtifact } from '~/services/catalogApi'
import catalogApi from '~/services/catalogApi'
import type { Article, UpdateArticleRequest } from '~/services/articlesApi'
import articlesApi from '~/services/articlesApi'
import { fetchCatalogArtifactDownloadResponse, getArtifactPresignedUrl, hasS3Backing, uploadCatalogArtifact } from '~/services/objectStorageApi'
import { formatDoiUrl } from '~/utils/articleHelpers'
import {
  formatPublicationYear,
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
const mainSaveActionsRef = ref<HTMLElement | null>(null)
const isMainSaveVisible = ref(true)

const artifactEditorOpen = ref(false)
const artifactSavePending = ref(false)
const artifactUploadPending = ref(false)
const artifactUploadError = ref<string | null>(null)
const artifactUploadFile = ref<File | null>(null)
const artifactUploadFileInputKey = ref(0)
const downloadingArtifactId = ref('')
const editingArtifactId = ref('')

const artifactForm = reactive({
  title: '',
  description: '',
  file_type: ''
})

const artifactUploadForm = reactive({
  title: '',
  file_type: 'application/pdf'
})

const articleForm = reactive({
  title: '',
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

const artifactFileTypeOptions = [
  { label: 'PDF document', value: 'application/pdf' },
  { label: 'Word document (.docx)', value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { label: 'Word document (.doc)', value: 'application/msword' },
  { label: 'Spreadsheet (.xlsx)', value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { label: 'Spreadsheet (.xls)', value: 'application/vnd.ms-excel' },
  { label: 'CSV dataset', value: 'text/csv' },
  { label: 'Text document', value: 'text/plain' },
  { label: 'PNG image', value: 'image/png' },
  { label: 'JPEG image', value: 'image/jpeg' },
  { label: 'ZIP archive', value: 'application/zip' },
  { label: 'Generic binary', value: 'application/octet-stream' }
]

const articleTypeOptions = [
  'Review',
  'Systematic review',
  'Meta-analysis',
  'Randomized controlled trial',
  'Clinical trial',
  'Cohort study',
  'Case-control study',
  'Cross-sectional study',
  'Guideline',
  'Consensus statement',
  'Narrative review',
  'Umbrella review',
  'Position paper',
  'Preprint'
]

const categoryOptions = [
  'Cardiometabolic Health',
  'Gut Health',
  'Nutrition Science',
  'Preventive Health',
  'Public Health',
  'Food Systems',
  'Exercise & Performance',
  'Mental Health',
  'Women\'s Health',
  'Chronic Disease'
]

const studyTypeOptions = [
  'Systematic review',
  'Meta-analysis',
  'Review',
  'Randomized controlled trial',
  'Clinical trial',
  'Cohort study',
  'Case-control study',
  'Cross-sectional study',
  'Guideline',
  'Qualitative study'
]

const readerGroupOptions = [
  'General public',
  'Practitioners',
  'Researchers',
  'Policy makers',
  'Students'
]

const ageGroupOptions = [
  'Prenatal',
  'Infants',
  'Children',
  'Adolescents',
  'Adults',
  'Older adults',
  'Mixed'
]

const populationGroupOptions = [
  'General population',
  'Healthy adults',
  'Adults with obesity',
  'Pregnant individuals',
  'Children',
  'Athletes',
  'Patients with chronic disease'
]

const biologicalModelOptions = [
  'Human',
  'Animal',
  'In vitro',
  'Computational',
  'Mixed'
]

const regionOptions = [
  'Global',
  'Europe',
  'North America',
  'South America',
  'Asia',
  'Africa',
  'Oceania',
  'Middle East',
  'Multinational'
]

const languageOptions = [
  { label: 'English (en)', value: 'en' },
  { label: 'Greek (el)', value: 'el' },
  { label: 'German (de)', value: 'de' },
  { label: 'French (fr)', value: 'fr' },
  { label: 'Spanish (es)', value: 'es' },
  { label: 'Italian (it)', value: 'it' },
  { label: 'Portuguese (pt)', value: 'pt' },
  { label: 'Dutch (nl)', value: 'nl' }
]

const incomeSettingOptions = [
  'High income',
  'Upper-middle income',
  'Lower-middle income',
  'Low income',
  'Mixed'
]

const licenseOptions = [
  'CC BY 4.0',
  'CC BY-SA 4.0',
  'CC BY-NC 4.0',
  'CC BY-ND 4.0',
  'CC0',
  'All rights reserved'
]

const resolvedArticleUrn = computed(() => resolveArticleRouteParam(route.params.urn))
const articleLibraryRoute = '/console/assets/articles'

const pageTitle = computed(() => articleForm.title.trim() || selectedArticle.value?.title || 'Article Workspace')
const sourceUrl = computed(() => articleForm.url.trim() || selectedArticle.value?.url || '')
const doiUrl = computed(() => formatDoiUrl(articleForm.doi.trim() || selectedArticle.value?.doi))
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

const headerAuthors = computed(() => parseDelimitedList(articleForm.authors).slice(0, 8))

const annotationConfidenceLabel = computed(() => {
  const normalized = articleForm.annotationConfidence.trim()
  if (!normalized) {
    return ''
  }

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return ''
  }

  const percentage = parsed <= 1 ? Math.round(parsed * 100) : Math.round(parsed)
  return percentage > 0 ? `${percentage}%` : ''
})

const headerAudienceItems = computed(() => {
  const items: Array<{ label: string, value: string, icon: string }> = []

  if (articleForm.populationGroup.trim()) {
    items.push({
      label: 'Population',
      value: articleForm.populationGroup.trim(),
      icon: 'i-lucide-target'
    })
  }

  if (articleForm.readerGroup.trim()) {
    items.push({
      label: 'Reader group',
      value: articleForm.readerGroup.trim(),
      icon: 'i-lucide-users'
    })
  }

  return items
})

const headerPublicationItems = computed(() => {
  const items: Array<{ label: string, value?: string, icon: string, href?: string, external?: boolean }> = []

  if (articleForm.publicationYear.trim()) {
    items.push({
      label: 'Publication year',
      value: articleForm.publicationYear.trim(),
      icon: 'i-lucide-calendar'
    })
  }

  if (articleForm.venue.trim()) {
    items.push({
      label: 'Venue',
      value: articleForm.venue.trim(),
      icon: 'i-lucide-book-open'
    })
  }

  if (doiUrl.value) {
    items.push({
      label: 'DOI',
      href: doiUrl.value,
      icon: 'i-lucide-external-link',
      external: true
    })
  }

  if (sourceUrl.value) {
    items.push({
      label: 'Source URL',
      href: sourceUrl.value,
      icon: 'i-lucide-external-link',
      external: true
    })
  }

  if (publicArticleRoute.value) {
    items.push({
      label: 'Public page',
      href: publicArticleRoute.value,
      icon: 'i-lucide-globe'
    })
  }

  return items
})

const headerSystemItems = computed(() => {
  const article = selectedArticle.value
  if (!article) {
    return []
  }

  return [
    { label: 'URN', value: article.urn, icon: 'i-lucide-fingerprint' },
    { label: 'Creator', value: article.creator || 'Unknown', icon: 'i-lucide-user' },
    { label: 'Created', value: formatDate(article.created_at), icon: 'i-lucide-calendar-range' },
    { label: 'Updated', value: formatDate(article.updated_at), icon: 'i-lucide-clock-3' }
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
    label: truncateBreadcrumbLabel(pageTitle.value),
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
const canUploadArtifact = computed(() =>
  Boolean(
    selectedArticle.value
    && artifactUploadFile.value
    && artifactUploadForm.title.trim()
    && artifactUploadForm.file_type.trim()
    && !artifactUploadPending.value
  )
)
const showFloatingSaveBar = computed(() =>
  Boolean(selectedArticle.value) && !detailLoading.value && !detailError.value && !isMainSaveVisible.value
)

const saveStatus = computed(() => {
  if (extrasJsonValidationError.value) {
    return {
      label: 'Needs attention',
      color: 'warning' as const
    }
  }

  if (savePending.value) {
    return {
      label: 'Saving',
      color: 'primary' as const
    }
  }

  if (hasUnsavedChanges.value) {
    return {
      label: 'Unsaved changes',
      color: 'warning' as const
    }
  }

  return {
    label: 'Saved',
    color: 'success' as const
  }
})

const saveReadinessLabel = computed(() => {
  if (extrasJsonValidationError.value) {
    return 'Fix the raw extras JSON before saving.'
  }

  if (savePending.value) {
    return 'Saving your article changes...'
  }

  if (!hasUnsavedChanges.value) {
    return ''
  }

  return ''
})

const artifactUploadFileTypeOptions = computed(() => buildArtifactFileTypeOptions(artifactUploadForm.file_type))

const artifactUploadSelectedFileLabel = computed(() =>
  artifactUploadFile.value?.name || 'No file selected yet'
)

const artifactUploadSelectedFileMeta = computed(() => {
  if (!artifactUploadFile.value) {
    return 'Choose a file, then set the artifact name and type before uploading it under this article.'
  }

  const selectedMimeType = artifactUploadFile.value.type || artifactUploadForm.file_type
  return `${formatBytes(artifactUploadFile.value.size)} · ${selectedMimeType || artifactUploadForm.file_type}`
})

useHead({
  title: computed(() => selectedArticle.value ? `${selectedArticle.value.title} | Scientific Articles` : 'Article Workspace')
})

useSeoMeta({
  description: computed(() => selectedArticle.value?.abstract || selectedArticle.value?.description || 'Wisefood article workspace for review and curation')
})

let mainSaveActionsObserver: IntersectionObserver | null = null

function normalizeNullable(value: string) {
  const normalized = value.trim()
  return normalized.length ? normalized : null
}

function buildArtifactTitleFromFilename(filename: string) {
  return filename.replace(/\.[^.]+$/, '').trim() || filename.trim() || 'Untitled artifact'
}

function buildArtifactFileTypeOptions(currentValue: string) {
  const normalizedCurrentValue = currentValue.trim()

  if (!normalizedCurrentValue || artifactFileTypeOptions.some(option => option.value === normalizedCurrentValue)) {
    return artifactFileTypeOptions
  }

  return [
    ...artifactFileTypeOptions,
    {
      label: `${normalizedCurrentValue} (detected)`,
      value: normalizedCurrentValue
    }
  ]
}

function inferArtifactFileType(file: File) {
  const mimeType = file.type.trim().toLowerCase()

  if (mimeType) {
    const matchingOption = artifactFileTypeOptions.find(option => option.value === mimeType)
    if (matchingOption) {
      return matchingOption.value
    }
  }

  const lowerName = file.name.toLowerCase()

  if (lowerName.endsWith('.pdf')) return 'application/pdf'
  if (lowerName.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (lowerName.endsWith('.doc')) return 'application/msword'
  if (lowerName.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  if (lowerName.endsWith('.xls')) return 'application/vnd.ms-excel'
  if (lowerName.endsWith('.csv')) return 'text/csv'
  if (lowerName.endsWith('.txt')) return 'text/plain'
  if (lowerName.endsWith('.png')) return 'image/png'
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg'
  if (lowerName.endsWith('.zip')) return 'application/zip'

  return mimeType || 'application/octet-stream'
}

function truncateBreadcrumbLabel(value: string, max = 38) {
  const normalized = value.trim()

  if (!normalized) {
    return 'Article Workspace'
  }

  if (normalized.length <= max) {
    return normalized
  }

  return `${normalized.slice(0, Math.max(0, max - 3)).trimEnd()}...`
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

function syncArticleArtifacts(nextArtifacts: CatalogArtifact[]) {
  articleArtifacts.value = nextArtifacts

  if (!selectedArticle.value) {
    return
  }

  selectedArticle.value = {
    ...selectedArticle.value,
    artifacts: nextArtifacts
  }
}

function populateArticleForm(article: Article) {
  articleForm.title = article.title || ''
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

function disconnectMainSaveObserver() {
  if (mainSaveActionsObserver) {
    mainSaveActionsObserver.disconnect()
    mainSaveActionsObserver = null
  }
}

function observeMainSaveActions() {
  if (!import.meta.client) {
    return
  }

  disconnectMainSaveObserver()

  const element = mainSaveActionsRef.value
  if (!element) {
    isMainSaveVisible.value = true
    return
  }

  mainSaveActionsObserver = new IntersectionObserver(
    (entries) => {
      const [entry] = entries
      isMainSaveVisible.value = Boolean(entry?.isIntersecting)
    },
    {
      threshold: 0.2
    }
  )

  mainSaveActionsObserver.observe(element)
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
  syncArticleArtifacts(
    articleArtifacts.value.map(artifact =>
      artifact.id === updatedArtifact.id ? updatedArtifact : artifact
    )
  )
}

function prependArtifact(uploadedArtifact: CatalogArtifact) {
  syncArticleArtifacts([
    uploadedArtifact,
    ...articleArtifacts.value.filter(artifact => artifact.id !== uploadedArtifact.id)
  ])
}

function resetArtifactUploadForm() {
  artifactUploadPending.value = false
  artifactUploadError.value = null
  artifactUploadFile.value = null
  artifactUploadForm.title = ''
  artifactUploadForm.file_type = 'application/pdf'
  artifactUploadFileInputKey.value += 1
}

function validateArtifactUpload() {
  if (!selectedArticle.value) {
    return 'Open an article before uploading artifacts.'
  }

  if (!artifactUploadFile.value) {
    return 'Choose a file before uploading.'
  }

  if (!artifactUploadForm.title.trim()) {
    return 'Artifact name is required.'
  }

  if (!artifactUploadForm.file_type.trim()) {
    return 'Artifact type is required.'
  }

  return null
}

function handleArtifactUploadSelection(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0] || null

  artifactUploadFile.value = file
  artifactUploadError.value = null

  if (!file) {
    artifactUploadForm.title = ''
    artifactUploadForm.file_type = 'application/pdf'
    return
  }

  artifactUploadForm.title = buildArtifactTitleFromFilename(file.name)
  artifactUploadForm.file_type = inferArtifactFileType(file)
}

async function uploadArticleArtifact() {
  const validationError = validateArtifactUpload()

  if (validationError) {
    artifactUploadError.value = validationError
    return
  }

  if (!selectedArticle.value || !artifactUploadFile.value) {
    return
  }

  artifactUploadPending.value = true
  artifactUploadError.value = null

  try {
    const uploadedArtifact = await uploadCatalogArtifact({
      parentUrn: selectedArticle.value.urn,
      file: artifactUploadFile.value,
      title: artifactUploadForm.title.trim(),
      language: normalizeNullable(articleForm.language) || undefined,
      fileType: artifactUploadForm.file_type.trim()
    })

    let finalArtifact = uploadedArtifact
    const desiredTitle = artifactUploadForm.title.trim()
    const desiredFileType = artifactUploadForm.file_type.trim()

    if (uploadedArtifact.title !== desiredTitle || uploadedArtifact.file_type !== desiredFileType) {
      try {
        finalArtifact = await catalogApi.updateArtifact(uploadedArtifact.id, {
          title: desiredTitle,
          file_type: desiredFileType
        })
      } catch (metadataError) {
        prependArtifact(uploadedArtifact)
        resetArtifactUploadForm()
        toast.add({
          title: 'Artifact uploaded with default metadata',
          description: resolveErrorMessage(
            metadataError,
            'The file was attached, but its custom name or type could not be finalized. You can edit it from the table.'
          ),
          color: 'warning'
        })
        return
      }
    }

    prependArtifact(finalArtifact)
    resetArtifactUploadForm()
    toast.add({
      title: 'Artifact uploaded',
      description: `${finalArtifact.title} was attached to this article.`,
      color: 'success'
    })
  } catch (error) {
    artifactUploadError.value = resolveErrorMessage(error, 'The artifact could not be uploaded right now.')
  } finally {
    artifactUploadPending.value = false
  }
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
  saveError.value = null

  try {
    const article = await articlesApi.getArticle(resolvedArticleUrn.value)
    selectedArticle.value = article
    syncArticleArtifacts(article.artifacts || [])
    resetArtifactUploadForm()
    populateArticleForm(article)
  } catch (error) {
    selectedArticle.value = null
    articleArtifacts.value = []
    resetArtifactUploadForm()
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
    syncArticleArtifacts(selectedArticle.value.artifacts || articleArtifacts.value)
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

onBeforeUnmount(() => {
  disconnectMainSaveObserver()
})

watch(resolvedArticleUrn, (nextUrn, previousUrn) => {
  if (nextUrn && nextUrn !== previousUrn) {
    void loadArticle()
  }
})

watch([selectedArticle, mainSaveActionsRef], async () => {
  await nextTick()
  observeMainSaveActions()
}, { flush: 'post' })
</script>
