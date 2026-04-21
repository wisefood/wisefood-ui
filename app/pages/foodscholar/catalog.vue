<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <!-- Header -->
    <FoodscholarMicroHeader
      :show-back="true"
      back-to="/foodscholar"
      :back-label="t('foodScholarCatalog.header.backToFoodScholar')"
      back-icon="i-lucide-arrow-left"
      brand-title="FoodScholar"
      :brand-lead="t('foodScholarCatalog.header.brandLead')"
      :section-title="t('foodScholarCatalog.header.sectionTitle')"
      :section-subtitle="t('foodScholarCatalog.header.sectionSubtitle')"
    />

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Loading State -->
      <div v-if="loading && (!articles || articles.length === 0)" class="flex justify-center items-center py-24">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">{{ t('foodScholarCatalog.loading') }}</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="max-w-2xl mx-auto">
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">{{ t('foodScholarCatalog.errors.failedToLoad') }}</h3>
              <p class="text-red-700 dark:text-red-300 mb-4">{{ error }}</p>
              <button
                @click="loadArticles"
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                {{ t('foodScholarCatalog.actions.tryAgain') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div v-else class="flex flex-col lg:flex-row lg:items-start gap-6">
        <!-- Left Sidebar - Filters -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          leave-active-class="transition-all duration-300 ease-in"
          enter-from-class="opacity-0 -translate-x-full"
          enter-to-class="opacity-100 translate-x-0"
          leave-from-class="opacity-100 translate-x-0"
          leave-to-class="opacity-0 -translate-x-full"
        >
          <aside
            v-if="showFilters"
            class="w-full lg:w-80 shrink-0 lg:self-start"
          >
            <div class="sticky top-24">
              <div class="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-sm">
                <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
                  <div>
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Filters</h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ totalResults.toLocaleString() }} results
                      <span v-if="facetsActiveCount"> · {{ facetsActiveCount }} active</span>
                    </p>
                  </div>
                  <button
                    v-if="hasActiveFilters"
                    @click="resetFilters"
                    class="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {{ t('foodScholarCatalog.actions.resetAllFilters') }}
                  </button>
                </div>

                <div class="px-4 py-2">
                  <div v-if="facetsLoading && !hasFacetOptions" class="py-4 text-sm text-gray-500 dark:text-gray-400">
                    Loading filters…
                  </div>

                  <div v-else class="divide-y divide-gray-100 dark:divide-zinc-800">
                    <div v-if="topicFacets.length" class="py-3">
                      <div class="mb-2 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                          <UIcon name="i-lucide-compass" class="w-3.5 h-3.5" />
                          Topics
                        </label>
                        <button
                          v-if="selectedTopics.length"
                          @click="selectedTopics = []"
                          class="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                      <div class="flex flex-wrap gap-1.5">
                        <button
                          v-for="facet in topTopicFacetPills"
                          :key="`topic-pill-${facet.value}`"
                          @click="toggleFacetSelection('topics', facet.value)"
                          :class="[
                            'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors',
                            selectedTopics.includes(facet.value)
                              ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                              : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                          ]"
                        >
                          <span class="truncate max-w-[11rem]">{{ facet.label }}</span>
                          <span class="text-[10px] opacity-70">{{ facet.count }}</span>
                        </button>
                        <button
                          v-if="topicFacets.length > TOP_FACET_PILLS"
                          @click="showMoreTopics = !showMoreTopics"
                          class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-700"
                        >
                          {{ showMoreTopics ? 'Less' : `More (${topicFacets.length - TOP_FACET_PILLS})` }}
                          <UIcon :name="showMoreTopics ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-3 h-3" />
                        </button>
                      </div>
                      <div v-if="showMoreTopics" class="mt-2">
                        <USelectMenu
                          :model-value="selectedTopics"
                          @update:model-value="(value) => { selectedTopics = Array.isArray(value) ? value : [] }"
                          :items="topicFacets"
                          multiple
                          value-key="value"
                          label-key="label"
                          :search-input="{ placeholder: 'Search topics…' }"
                          placeholder="Select topics"
                          class="w-full"
                        >
                          <template #default="{ modelValue }">
                            <span v-if="Array.isArray(modelValue) && modelValue.length" class="text-sm">{{ modelValue.length }} selected</span>
                            <span v-else class="text-sm text-gray-400">Select topics</span>
                          </template>
                          <template #item="{ item }">
                            <span class="flex-1 min-w-0 truncate">{{ item.label }}</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">{{ item.count }}</span>
                          </template>
                        </USelectMenu>
                      </div>
                    </div>

                    <div v-if="tagSelectFacets.length" class="py-3">
                      <div class="mb-2 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                          <UIcon name="i-lucide-tags" class="w-3.5 h-3.5" />
                          {{ t('foodScholarCatalog.filters.tags') }}
                        </label>
                        <button
                          v-if="selectedTags.length"
                          @click="selectedTags = []"
                          class="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                      <div class="flex flex-wrap gap-1.5">
                        <button
                          v-for="facet in topTagFacetPills"
                          :key="`tag-pill-${facet.value}`"
                          @click="toggleFacetSelection('tags', facet.value)"
                          :class="[
                            'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors',
                            selectedTags.includes(facet.value)
                              ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                              : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                          ]"
                        >
                          <span class="truncate max-w-[11rem]">{{ facet.label }}</span>
                          <span class="text-[10px] opacity-70">{{ facet.count }}</span>
                        </button>
                        <button
                          v-if="tagSelectFacets.length > TOP_FACET_PILLS"
                          @click="showMoreTags = !showMoreTags"
                          class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-700"
                        >
                          {{ showMoreTags ? 'Less' : `More (${tagSelectFacets.length - TOP_FACET_PILLS})` }}
                          <UIcon :name="showMoreTags ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-3 h-3" />
                        </button>
                      </div>
                      <div v-if="showMoreTags" class="mt-2">
                        <USelectMenu
                          :model-value="selectedTags"
                          @update:model-value="(value) => { selectedTags = Array.isArray(value) ? value : [] }"
                          :items="tagSelectFacets"
                          multiple
                          value-key="value"
                          label-key="label"
                          :search-input="{ placeholder: 'Search tags…' }"
                          :placeholder="t('foodScholarCatalog.filters.tags')"
                          class="w-full"
                        >
                          <template #default="{ modelValue }">
                            <span v-if="Array.isArray(modelValue) && modelValue.length" class="text-sm">{{ modelValue.length }} selected</span>
                            <span v-else class="text-sm text-gray-400">Select tags</span>
                          </template>
                          <template #item="{ item }">
                            <span class="flex-1 min-w-0 truncate">{{ item.label }}</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">{{ item.count }}</span>
                          </template>
                        </USelectMenu>
                      </div>
                    </div>

                    <div v-if="yearBounds" class="py-3">
                      <div class="mb-2 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                          <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5" />
                          {{ t('foodScholarCatalog.filters.publicationYear') }}
                        </label>
                        <button
                          v-if="hasYearRangeFilter"
                          @click="clearYearRange"
                          class="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          Clear
                        </button>
                      </div>

                      <div v-if="yearHistogramBins.length" class="rounded-lg border border-gray-200 dark:border-zinc-800 p-2">
                        <div class="flex h-10 items-end gap-[2px]">
                          <div
                            v-for="(bin, idx) in yearHistogramBins"
                            :key="`year-bin-${idx}`"
                            class="flex-1 rounded-sm transition-colors"
                            :class="bin.active ? 'bg-brand-500/70 dark:bg-brand-400/70' : 'bg-gray-300 dark:bg-zinc-700'"
                            :style="{ height: `${bin.heightPct}%` }"
                            :title="`${bin.from}${bin.from !== bin.to ? `-${bin.to}` : ''}: ${bin.count}`"
                          ></div>
                        </div>
                        <USlider
                          v-model="yearRangeSlider"
                          :min="yearBounds.min"
                          :max="yearBounds.max"
                          :step="1"
                          :min-steps-between-thumbs="0"
                          class="mt-3"
                        />
                        <div class="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                          <span>{{ yearBounds.min }}</span>
                          <span class="font-medium text-gray-700 dark:text-gray-300">{{ yearRangeChipLabel }}</span>
                          <span>{{ yearBounds.max }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="py-3">
                      <div class="mb-2 flex items-center justify-between gap-2">
                        <label class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                          <UIcon name="i-lucide-bar-chart-3" class="w-3.5 h-3.5" />
                          Citation Count
                        </label>
                        <button
                          v-if="hasCitationCountFilter"
                          @click="clearCitationCountRange"
                          class="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                      <div v-if="citationBounds" class="rounded-lg border border-gray-200 dark:border-zinc-800 p-2">
                        <div class="flex h-10 items-end gap-[2px]">
                          <div
                            v-for="(bin, idx) in citationHistogramBins"
                            :key="`citation-bin-${idx}`"
                            class="flex-1 rounded-sm transition-colors"
                            :class="bin.active ? 'bg-brand-500/70 dark:bg-brand-400/70' : 'bg-gray-300 dark:bg-zinc-700'"
                            :style="{ height: `${bin.heightPct}%` }"
                            :title="`${bin.from}${bin.from !== bin.to ? `-${bin.to}` : ''}: ${bin.count}`"
                          ></div>
                        </div>
                        <USlider
                          v-model="citationSliderRange"
                          :min="citationBounds.min"
                          :max="citationBounds.max"
                          :step="1"
                          :min-steps-between-thumbs="0"
                          class="mt-3"
                        />
                        <div class="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                          <span>{{ citationBounds.min }}</span>
                          <span class="font-medium text-gray-700 dark:text-gray-300">{{ citationRangeChipLabel || `${citationBounds.min}-${citationBounds.max}` }}</span>
                          <span>{{ citationBounds.max }}</span>
                        </div>
                        <div class="mt-2 grid grid-cols-2 gap-2">
                          <input
                            v-model="citationCountMin"
                            inputmode="numeric"
                            placeholder="Min"
                            class="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                          >
                          <input
                            v-model="citationCountMax"
                            inputmode="numeric"
                            placeholder="Max"
                            class="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                          >
                        </div>
                        <p v-if="citationRangeInvalid" class="mt-2 text-xs text-red-600 dark:text-red-400">
                          Invalid citation range
                        </p>
                      </div>
                    </div>

                    <div
                      v-for="filter in genericFilterRows"
                      :key="filter.key"
                      class="py-3"
                    >
                      <div class="mb-2 flex items-center justify-between gap-2">
                        <label class="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                          {{ filter.label }}
                        </label>
                        <button
                          v-if="filter.modelRef.value.length"
                          @click="filter.modelRef.value = []"
                          class="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          Clear
                        </button>
                      </div>

                      <USelectMenu
                        :model-value="filter.modelRef.value"
                        @update:model-value="(value) => { filter.modelRef.value = Array.isArray(value) ? value : [] }"
                        :items="filter.options"
                        multiple
                        value-key="value"
                        label-key="label"
                        :search-input="{ placeholder: 'Search…' }"
                        :placeholder="filter.placeholder"
                        :disabled="loading || facetsLoading || !filter.options.length"
                        class="w-full"
                      >
                        <template #default="{ modelValue }">
                          <span v-if="Array.isArray(modelValue) && modelValue.length" class="text-sm">
                            {{ modelValue.length }} selected
                          </span>
                          <span v-else class="text-sm text-gray-400">{{ filter.placeholder }}</span>
                        </template>
                        <template #item="{ item }">
                          <span class="flex-1 min-w-0 truncate">{{ item.label }}</span>
                          <span class="text-xs text-gray-500 dark:text-gray-400">{{ item.count }}</span>
                        </template>
                      </USelectMenu>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </aside>
        </Transition>

        <!-- Main Content Area -->
        <main class="flex-1 min-w-0">
          <!-- Filter Toggle Button -->
          <div class="mb-3 flex items-center justify-between gap-3">
            <button
              @click="showFilters = !showFilters"
              class="px-4 py-2 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <UIcon :name="showFilters ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'" class="w-4 h-4" />
              {{ showFilters ? t('foodScholarCatalog.filters.hide') : t('foodScholarCatalog.filters.show') }}
              <span
                v-if="facetsActiveCount"
                class="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[11px] font-semibold bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300"
              >
                {{ facetsActiveCount }}
              </span>
            </button>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ totalResults.toLocaleString() }} results</p>
          </div>

          <!-- Natural Language Search -->
          <div class="mb-4">
            <div class="catalog-search-composer">
            <FoodscholarNLInput
              v-model="nlQuery"
              @enter="performNLSearch"
              :placeholder="t('foodScholarCatalog.search.placeholder')"
              input-class="w-full h-12 pl-11 pr-16 rounded-xl bg-transparent text-[15px] text-gray-900 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-zinc-400 focus:outline-none transition-all duration-200"
            >
              <template #left>
                <UIcon name="i-lucide-search" class="w-4.5 h-4.5 text-gray-500 dark:text-gray-400" />
              </template>
              <template #right>
                <button
                  @click="performNLSearch"
                  class="catalog-search-send h-10 w-10 flex items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                >
                  <UIcon
                    name="i-lucide-arrow-right"
                    class="w-4 h-4 text-white"
                  />
                </button>
              </template>
            </FoodscholarNLInput>
            </div>

            <div class="mt-2 flex flex-wrap gap-1.5">
              <button
                v-for="example in exampleQueries"
                :key="example"
                @click="nlQuery = example; performNLSearch()"
                class="px-2 py-1 text-[11px] rounded-full text-gray-600 dark:text-gray-300 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
              >
                {{ example }}
              </button>
            </div>
          </div>

          <!-- Search Summary -->
          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
          >
          <div v-if="summaryLoading || searchSummary || summaryError" class="mb-5">
            <!-- Loading State -->
            <div v-if="summaryLoading" class="py-3 flex items-center gap-3">
              <div class="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ t('foodScholarCatalog.summary.loading') }}</p>
            </div>

            <!-- Error State -->
            <div v-else-if="summaryError" class="py-3">
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-red-900 dark:text-red-100">{{ t('foodScholarCatalog.summary.errorTitle') }}</p>
                  <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ summaryError }}</p>
                </div>
              </div>
            </div>

            <!-- Summary Content -->
            <div v-else-if="searchSummary" class="relative answer-reveal-ltr border-l-2 border-brand-200 dark:border-brand-800 pl-3 md:pl-4" style="--answer-reveal-delay: 40ms">
              <!-- Header - Always Visible -->
              <button
                @click="summaryExpanded = !summaryExpanded"
                class="w-full py-2 pr-1 flex items-start gap-3 transition-colors text-left"
              >
                <UIcon name="i-lucide-sparkles" class="w-4.5 h-4.5 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" />
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ t('foodScholarCatalog.summary.title') }}</h3>
                    <span class="text-xs px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
                      {{ t('foodScholarCatalog.summary.articlesBadge', { count: searchSummary.total_articles_analyzed }) }}
                    </span>
                  </div>
                  <div
                    v-if="summaryExpanded"
                    class="text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none [&_p]:leading-relaxed [&_p]:mb-2"
                    v-html="renderMarkdown(searchSummary.summary)"
                  ></div>
                  <div
                    v-else
                    class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 prose prose-sm dark:prose-invert max-w-none [&_p]:leading-relaxed [&_p]:mb-2"
                    v-html="renderMarkdown(searchSummary.summary)"
                  ></div>
                  <div v-if="!summaryExpanded && searchSummary.summary.length > 160" class="mt-1">
                    <span class="text-xs text-brand-600 dark:text-brand-400 font-medium">{{ t('foodScholarCatalog.summary.clickToReadMore') }}</span>
                  </div>
                </div>
                <UIcon
                  :name="summaryExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="w-4 h-4 text-gray-400 shrink-0 transition-transform mt-0.5"
                />
              </button>

              <!-- Expanded Content -->
              <div v-if="summaryExpanded" class="pt-1 pb-2 pl-7 md:pl-8 space-y-4 answer-reveal-ltr" style="--answer-reveal-delay: 80ms">
                <!-- Key Findings -->
                <div v-if="searchSummary.key_findings && searchSummary.key_findings.length > 0">
                  <h4 class="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <UIcon name="i-lucide-list-checks" class="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    Key Findings
                  </h4>
                  <div class="space-y-2.5">
                    <div
                      v-for="(finding, idx) in searchSummary.key_findings.slice(0, 3)"
                      :key="idx"
                      class="answer-reveal-ltr"
                      :style="{ '--answer-reveal-delay': `${120 + (Number(idx) * 40)}ms` }"
                    >
                      <div class="flex items-start gap-2.5">
                        <div class="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center shrink-0 mt-0.5">
                          <span class="text-[10px] font-semibold text-brand-700 dark:text-brand-300">{{ Number(idx) + 1 }}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none [&_p]:leading-relaxed [&_p]:mb-2" v-html="renderMarkdown(finding.finding)"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Follow-up Suggestions -->
                <div v-if="searchSummary.follow_up_suggestions && searchSummary.follow_up_suggestions.length > 0">
                  <h4 class="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <UIcon name="i-lucide-lightbulb" class="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    {{ t('foodScholarCatalog.summary.relatedTopics') }}
                  </h4>
                  <div class="flex flex-wrap gap-1.5">
                    <button
                      v-for="(suggestion, idx) in searchSummary.follow_up_suggestions"
                      :key="idx"
                      @click="nlQuery = suggestion; performNLSearch()"
                      class="text-xs px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors border border-brand-200 dark:border-brand-800"
                    >
                      {{ suggestion }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </Transition>

          <!-- Sorting Options -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <label class="text-sm text-gray-600 dark:text-gray-400">{{ t('foodScholarCatalog.sort.label') }}</label>
              <select
                v-model="sortBy"
                class="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="score desc">{{ t('foodScholarCatalog.sort.options.relevance') }}</option>
                <option value="created_at desc">{{ t('foodScholarCatalog.sort.options.mostRecent') }}</option>
                <option value="publication_year desc">{{ t('foodScholarCatalog.sort.options.pubYearNewest') }}</option>
                <option value="publication_year asc">{{ t('foodScholarCatalog.sort.options.pubYearOldest') }}</option>
                <option value="title asc">{{ t('foodScholarCatalog.sort.options.titleAsc') }}</option>
              </select>
            </div>
          </div>

          <!-- Active Filters Display -->
          <div v-if="hasActiveFilters" class="mb-3 flex flex-wrap gap-1.5">
            <span class="text-xs text-gray-600 dark:text-gray-400 self-center">{{ t('foodScholarCatalog.activeFilters') }}</span>
            <button
              v-for="chip in activeFilterChips"
              :key="`${chip.key}-${chip.value}`"
              @click="removeActiveFilterChip(chip)"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 hover:bg-brand-200 dark:hover:bg-brand-900/50"
            >
              <UIcon v-if="chip.icon" :name="chip.icon" class="w-3 h-3" />
              {{ chip.label }}
              <UIcon name="i-lucide-x" class="w-3 h-3" />
            </button>
          </div>

          <!-- Articles List -->
          <div v-if="displayArticles.length > 0">
            <div class="grid grid-cols-1 gap-4 mb-6">
              <FoodscholarArticleCard
                v-for="(article, index) in displayArticles"
                :key="article.urn"
                :article="article"
                :fade="false"
                :index="index"
              />
            </div>

            <!-- Pagination -->
            <div class="flex justify-center">
              <UPagination
                v-model:page="page"
                :total="totalResults"
                :items-per-page="itemsPerPage"
                :sibling-count="1"
                show-edges
              />
            </div>
          </div>

          <!-- No Results -->
          <div v-else class="text-center py-12">
            <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <UIcon name="i-lucide-search-x" class="w-8 h-8 text-gray-400" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">{{ t('foodScholarCatalog.empty.title') }}</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">{{ t('foodScholarCatalog.empty.subtitle') }}</p>
            <button
              @click="resetFilters"
              class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
            >
              {{ t('foodScholarCatalog.actions.resetFilters') }}
            </button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useArticles } from '~/composables/useArticles'
import { useAuthStore } from '~/stores/auth'
import articlesApi, { type Article } from '~/services/articlesApi'
import { getWisefoodRestApiUrl } from '~/utils/runtimeConfig'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const { t } = useI18n()

definePageMeta({
  middleware: ['auth', 'profile']
})

useHead({
  title: computed(() => t('foodScholarCatalog.meta.title'))
})

useSeoMeta({
  description: computed(() => t('foodScholarCatalog.meta.description'))
})

const route = useRoute()
const router = useRouter()

// Composable
const {
  articles,
  loading,
  error,
  totalResults,
  searchArticles,
  clearError
} = useArticles()

// Facets from API
const facets = ref<Record<string, Array<{ value: any, count: number }>>>({})
const facetsLoading = ref(false)

// Filter and Search State
const selectedVenues = ref<string[]>([])
const selectedYears = ref<string[]>([])
const selectedTags = ref<string[]>([])
const selectedTopics = ref<string[]>([])
const selectedStudyTypes = ref<string[]>([])
const selectedAgeGroups = ref<string[]>([])
const selectedCountries = ref<string[]>([])
const selectedIncomeSettings = ref<string[]>([])
const selectedYearRange = ref<[number, number] | null>(null)
const citationCountMin = ref('')
const citationCountMax = ref('')
const nlQuery = ref("")
const sortBy = ref("created_at desc")
const showFilters = ref(false)
const page = ref(1)
const itemsPerPage = 6
const showMoreTopics = ref(false)
const showMoreTags = ref(false)

const TOP_FACET_PILLS = 8
const HISTOGRAM_BIN_COUNT = 20

// Search Summary State
const searchSummary = ref<any>(null)
const summaryLoading = ref(false)
const summaryError = ref<string | null>(null)
const summaryExpanded = ref(false)

// Annotated facet interface for tracking field source
interface AnnotatedFacet {
  value: string
  count: number
  field: string // The actual field name (category, ai_category, tags, ai_tags)
  label?: string // Optional label for display (e.g., "Clinical Nutrition (AI)")
}

interface SelectFacetOption {
  value: string
  label: string
  count: number
}

interface FilterRow {
  key: string
  label: string
  placeholder: string
  modelRef: Ref<string[]>
  options: SelectFacetOption[]
}

const FACET_FIELDS = [
  'venue',
  'publication_year',
  'tags',
  'ai_tags',
  'topics',
  'study_type',
  'age_group',
  'geographic_context.country_or_region',
  'geographic_context.income_setting',
  'citation_count'
]

const FACET_BOOTSTRAP_FL = [
  'urn',
  'title',
  'authors',
  'tags',
  'ai_tags',
  'abstract',
  'description',
  'venue',
  'publication_year',
  'category',
  'ai_category',
  'topics',
  'study_type',
  'age_group',
  'geographic_context',
  'citation_count'
]
const FACET_BOOTSTRAP_SORT = 'created_at desc'
const FACET_BOOTSTRAP_LIMIT = 6

const parseQueryValues = (value: unknown): string[] => {
  if (value === null || value === undefined) return []

  const rawValues = Array.isArray(value) ? value : [value]

  return rawValues
    .flatMap(entry => String(entry).split(','))
    .map(entry => entry.trim())
    .filter(Boolean)
}

const getSingleQueryValue = (value: unknown): string => {
  return parseQueryValues(value)[0] || ''
}

const getNumericQueryValue = (value: unknown): number | null => {
  const raw = getSingleQueryValue(value)
  if (!raw) return null

  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

const normalizeQueryRecord = (query: Record<string, unknown>) => {
  return Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0) && String(value).trim() !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => [
      key,
      (Array.isArray(value) ? value : [value])
        .map(entry => String(entry))
        .sort((left, right) => left.localeCompare(right))
    ])
}

const routeFiltersHydrated = ref(false)

const hydrateStateFromRoute = () => {
  nlQuery.value = getSingleQueryValue(route.query.q)
  selectedVenues.value = parseQueryValues(route.query.venue)
  selectedYears.value = parseQueryValues(route.query.year)
  selectedTags.value = parseQueryValues(route.query.tag)
  selectedTopics.value = parseQueryValues(route.query.topic)
  selectedStudyTypes.value = parseQueryValues(route.query.study_type)
  selectedAgeGroups.value = parseQueryValues(route.query.age_group)
  selectedCountries.value = parseQueryValues(route.query.country)
  selectedIncomeSettings.value = parseQueryValues(route.query.income_setting)

  const yearMin = getNumericQueryValue(route.query.year_min)
  const yearMax = getNumericQueryValue(route.query.year_max)
  selectedYearRange.value = yearMin !== null && yearMax !== null
    ? [Math.min(yearMin, yearMax), Math.max(yearMin, yearMax)]
    : null

  citationCountMin.value = getSingleQueryValue(route.query.citation_min)
  citationCountMax.value = getSingleQueryValue(route.query.citation_max)

  const sort = getSingleQueryValue(route.query.sort)
  sortBy.value = sort || (nlQuery.value ? 'score desc' : 'created_at desc')

  const queryPage = getNumericQueryValue(route.query.page)
  page.value = queryPage && queryPage > 0 ? queryPage : 1
}

const buildRouteQueryFromState = () => {
  const query: Record<string, string | string[]> = {}

  if (nlQuery.value.trim()) query.q = nlQuery.value.trim()
  if (selectedVenues.value.length) query.venue = [...selectedVenues.value]
  if (selectedYears.value.length) query.year = [...selectedYears.value]
  if (selectedTags.value.length) query.tag = [...selectedTags.value]
  if (selectedTopics.value.length) query.topic = [...selectedTopics.value]
  if (selectedStudyTypes.value.length) query.study_type = [...selectedStudyTypes.value]
  if (selectedAgeGroups.value.length) query.age_group = [...selectedAgeGroups.value]
  if (selectedCountries.value.length) query.country = [...selectedCountries.value]
  if (selectedIncomeSettings.value.length) query.income_setting = [...selectedIncomeSettings.value]

  if (hasYearRangeFilter.value) {
    const [yearMin, yearMax] = yearRangeSlider.value
    query.year_min = String(yearMin)
    query.year_max = String(yearMax)
  }

  if (hasCitationCountFilter.value && !citationRangeInvalid.value) {
    const min = citationRangeState.value.min
    const max = citationRangeState.value.max
    if (min !== null) query.citation_min = String(min)
    if (max !== null) query.citation_max = String(max)
  }

  if (sortBy.value !== 'created_at desc') query.sort = sortBy.value
  if (page.value > 1) query.page = String(page.value)

  return query
}

const syncRouteQuery = async () => {
  if (!routeFiltersHydrated.value) return

  const nextQuery = buildRouteQueryFromState()
  const currentQuery = route.query as Record<string, unknown>

  if (JSON.stringify(normalizeQueryRecord(currentQuery)) === JSON.stringify(normalizeQueryRecord(nextQuery))) {
    return
  }

  await router.replace({ query: nextQuery })
}

const exampleQueries = computed(() => ([
  t('foodScholarCatalog.examples.omega3'),
  t('foodScholarCatalog.examples.fermentedFoods'),
  t('foodScholarCatalog.examples.vitaminD'),
]))

// Markdown rendering function with sanitization
const renderMarkdown = (text: string): string => {
  if (!text) return ''

  const viewArticleLabel = t('foodScholarCatalog.summary.viewArticle')

  // Pre-process: Convert URN references to clickable links
  // Matches patterns like: (urn:article:some-article-id) or *text* (urn:article:some-article-id)
  let processedText = text.replace(
    /\(urn:article:([a-zA-Z0-9\-]+)\)/g,
    `([${viewArticleLabel}](/foodscholar/$1))`
  )

  // Also handle inline URN references without parentheses
  processedText = processedText.replace(
    /urn:article:([a-zA-Z0-9\-]+)/g,
    '[urn:article:$1](/foodscholar/urn:article:$1)'
  )

  // Configure marked to properly handle line breaks
  // breaks: true converts single \n to <br>
  // gfm: true enables GitHub Flavored Markdown which handles \n\n as paragraphs
  const rawHtml = marked(processedText, {
    breaks: true,
    gfm: true
  }) as string

  return DOMPurify.sanitize(rawHtml, {
    ADD_ATTR: ['target'], // Allow target attribute for links
  })
}

// Transform articles to match ArticleCard interface
const displayArticles = computed(() => {
  return articles.value.map(article => ({
    ...article,
    id: article.id,
    urn: article.urn,
    category: article.category || article.ai_category || t('foodScholarHome.categories.uncategorized'),
    ai_category: article.ai_category,
    excerpt: article.abstract || article.description || '',
    authors: article.authors || [],
    tags: article.tags || [],
    ai_tags: article.ai_tags || [],
    topics: article.topics || [],
    venue: article.venue,
    publication_year: article.publication_year,
  }))
})

// Computed facets for UI - merged Category (category + ai_category)
const categoryFacets = computed((): AnnotatedFacet[] => {
  const humanCategories = (facets.value.category || []).map(f => ({
    value: f.value,
    count: f.count,
    field: 'category',
    label: f.value
  }))

  const aiCategories = (facets.value.ai_category || []).map(f => ({
    value: f.value,
    count: f.count,
    field: 'ai_category',
    label: `${f.value} (${t('foodScholarCatalog.ai')})`
  }))

  // Merge and deduplicate by value, prioritizing human-reviewed
  const merged = new Map<string, AnnotatedFacet>()

  humanCategories.forEach(cat => merged.set(cat.value, cat))
  aiCategories.forEach(cat => {
    if (!merged.has(cat.value)) {
      merged.set(cat.value, cat)
    } else {
      // Add AI count to existing human category
      const existing = merged.get(cat.value)!
      existing.count += cat.count
    }
  })

  return Array.from(merged.values()).sort((a, b) => b.count - a.count)
})

const venueFacets = computed(() => facets.value.venue || [])

const yearFacets = computed(() => {
  return (facets.value.publication_year || [])
    .map(f => ({
      value: f.value, // preserve full date for exact match (e.g. "2014-01-01")
      label: (() => {
        const raw = f.value
        const asString = String(raw)
        const date = (typeof raw === 'number' || /^\d+$/.test(asString))
          ? new Date(Number(raw))
          : new Date(raw)
        const year = date.getFullYear()
        return Number.isNaN(year) ? asString : year.toString()
      })(),
      count: f.count
    }))
    .sort((a, b) => parseInt(b.label) - parseInt(a.label))
})

// Computed facets for Tags (tags + ai_tags)
const tagFacets = computed((): AnnotatedFacet[] => {
  const humanTags = (facets.value.tags || []).map(f => ({
    value: f.value,
    count: f.count,
    field: 'tags',
    label: f.value
  }))

  const aiTags = (facets.value.ai_tags || []).map(f => ({
    value: f.value,
    count: f.count,
    field: 'ai_tags',
    label: `${f.value} (${t('foodScholarCatalog.ai')})`
  }))

  // Merge and deduplicate by value, prioritizing human-reviewed
  const merged = new Map<string, AnnotatedFacet>()

  humanTags.forEach(tag => merged.set(tag.value, tag))
  aiTags.forEach(tag => {
    if (!merged.has(tag.value)) {
      merged.set(tag.value, tag)
    } else {
      // Add AI count to existing human tag
      const existing = merged.get(tag.value)!
      existing.count += tag.count
    }
  })

  return Array.from(merged.values()).sort((a, b) => b.count - a.count)
})

const toSelectFacetOptions = (entries: Array<{ value: any, count: number }> | undefined): SelectFacetOption[] => {
  return (entries || [])
    .filter(entry => entry?.value !== null && entry?.value !== undefined && `${entry.value}`.trim() !== '')
    .map(entry => ({
      value: String(entry.value),
      label: String(entry.value),
      count: Number(entry.count || 0)
    }))
    .sort((a, b) => b.count - a.count)
}

const topicFacets = computed(() => toSelectFacetOptions(facets.value.topics))
const studyTypeFacets = computed(() => toSelectFacetOptions(facets.value.study_type))
const ageGroupFacets = computed(() => toSelectFacetOptions(facets.value.age_group))
const countryFacets = computed(() => toSelectFacetOptions(facets.value['geographic_context.country_or_region']))
const incomeSettingFacets = computed(() => toSelectFacetOptions(facets.value['geographic_context.income_setting']))

const categorySelectFacets = computed<SelectFacetOption[]>(() =>
  categoryFacets.value.map(f => ({
    value: f.value,
    label: f.label || f.value,
    count: f.count
  }))
)

const venueSelectFacets = computed<SelectFacetOption[]>(() =>
  venueFacets.value
    .filter(f => f?.value)
    .map(f => ({ value: String(f.value), label: String(f.value), count: Number(f.count || 0) }))
    .sort((a, b) => b.count - a.count)
)

const yearSelectFacets = computed<SelectFacetOption[]>(() =>
  yearFacets.value.map(f => ({
    value: String(f.value),
    label: f.label,
    count: f.count
  }))
)

const tagSelectFacets = computed<SelectFacetOption[]>(() =>
  tagFacets.value.map(f => ({
    value: f.value,
    label: f.label || f.value,
    count: f.count
  }))
)

const filterRows = computed<FilterRow[]>(() => [
  { key: 'topics', label: 'Topics', placeholder: 'Select topics', modelRef: selectedTopics, options: topicFacets.value },
  { key: 'tags', label: t('foodScholarCatalog.filters.tags'), placeholder: 'Select tags', modelRef: selectedTags, options: tagSelectFacets.value },
  { key: 'publication_year', label: t('foodScholarCatalog.filters.publicationYear'), placeholder: 'Select years', modelRef: selectedYears, options: yearSelectFacets.value },
  { key: 'study_type', label: 'Study Type', placeholder: 'Select study types', modelRef: selectedStudyTypes, options: studyTypeFacets.value },
  { key: 'age_group', label: 'Age Group', placeholder: 'Select age groups', modelRef: selectedAgeGroups, options: ageGroupFacets.value },
  { key: 'country', label: 'Country / Region', placeholder: 'Select countries', modelRef: selectedCountries, options: countryFacets.value },
  { key: 'income_setting', label: 'Income Setting', placeholder: 'Select income settings', modelRef: selectedIncomeSettings, options: incomeSettingFacets.value },
  { key: 'venue', label: t('foodScholarCatalog.filters.venue'), placeholder: 'Select venues', modelRef: selectedVenues, options: venueSelectFacets.value }
].filter(row => row.options.length > 0))

const genericFilterRows = computed(() =>
  filterRows.value.filter(row => !['topics', 'tags', 'publication_year'].includes(row.key))
)

const topTopicFacetPills = computed(() => topicFacets.value.slice(0, TOP_FACET_PILLS))
const topTagFacetPills = computed(() => tagSelectFacets.value.slice(0, TOP_FACET_PILLS))

const hasFacetOptions = computed(() =>
  genericFilterRows.value.length > 0 ||
  topicFacets.value.length > 0 ||
  tagSelectFacets.value.length > 0 ||
  yearSelectFacets.value.length > 0 ||
  (facets.value.citation_count || []).length > 0
)

const toggleFacetSelection = (kind: 'topics' | 'tags', value: string) => {
  const modelRef = kind === 'topics' ? selectedTopics : selectedTags
  if (modelRef.value.includes(value)) {
    modelRef.value = modelRef.value.filter(v => v !== value)
  } else {
    modelRef.value = [...modelRef.value, value]
  }
}

const buildHistogramBins = (
  entries: Array<{ value: number, count: number }>,
  selectedRange: [number, number] | null,
  totalBins = HISTOGRAM_BIN_COUNT
): HistogramBin[] => {
  if (!entries.length) return []

  const min = Math.min(...entries.map(e => e.value))
  const max = Math.max(...entries.map(e => e.value))
  const span = Math.max(1, max - min)
  const binCount = Math.min(totalBins, span + 1)
  const width = Math.max(1, Math.ceil((span + 1) / binCount))
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, idx) => {
    const from = min + idx * width
    const to = idx === binCount - 1 ? max : Math.min(max, from + width - 1)
    return { from, to, count: 0, heightPct: 0, active: false }
  })

  entries.forEach(entry => {
    const rawIndex = Math.floor((entry.value - min) / width)
    const index = Math.max(0, Math.min(binCount - 1, rawIndex))
    bins[index].count += entry.count
  })

  const peak = Math.max(...bins.map(b => b.count), 1)
  const [selMin, selMax] = selectedRange || [min, max]
  return bins.map(bin => ({
    ...bin,
    heightPct: Math.max(10, Math.round((bin.count / peak) * 100)),
    active: bin.to >= selMin && bin.from <= selMax
  }))
}

const yearDistributionEntries = computed(() => {
  const aggregate = new Map<number, number>()
  ;(facets.value.publication_year || []).forEach((f) => {
    const raw = f?.value
    const parsedDate = typeof raw === 'number' || /^\d+$/.test(String(raw))
      ? new Date(Number(raw))
      : new Date(String(raw))
    const year = parsedDate.getFullYear()
    if (Number.isNaN(year)) return
    aggregate.set(year, (aggregate.get(year) || 0) + Number(f.count || 0))
  })
  return Array.from(aggregate.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value - b.value)
})

const yearBounds = computed(() => {
  if (!yearDistributionEntries.value.length) return null
  return {
    min: yearDistributionEntries.value[0].value,
    max: yearDistributionEntries.value[yearDistributionEntries.value.length - 1].value
  }
})

const yearRangeSlider = computed<[number, number]>({
  get() {
    const bounds = yearBounds.value
    if (!bounds) return [2000, 2025]
    const [rawMin, rawMax] = selectedYearRange.value || [bounds.min, bounds.max]
    return [Math.max(bounds.min, rawMin), Math.min(bounds.max, rawMax)].sort((a, b) => a - b) as [number, number]
  },
  set(value) {
    if (!Array.isArray(value) || value.length < 2) return
    const bounds = yearBounds.value
    const min = Math.min(Number(value[0]), Number(value[1]))
    const max = Math.max(Number(value[0]), Number(value[1]))
    if (!bounds) {
      selectedYearRange.value = [min, max]
      return
    }
    const next: [number, number] = [
      Math.max(bounds.min, min),
      Math.min(bounds.max, max)
    ]
    selectedYearRange.value = next
  }
})

const hasYearRangeFilter = computed(() => {
  const bounds = yearBounds.value
  if (!bounds || !selectedYearRange.value) return false
  const [min, max] = yearRangeSlider.value
  return min !== bounds.min || max !== bounds.max
})

const yearRangeChipLabel = computed(() => {
  const [min, max] = yearRangeSlider.value
  return min === max ? `${min}` : `${min}-${max}`
})

const yearHistogramBins = computed(() =>
  buildHistogramBins(yearDistributionEntries.value, yearBounds.value ? yearRangeSlider.value : null, 16)
)

const parseCitationInput = (value: string): number | null => {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!/^\d+$/.test(trimmed)) return NaN
  return Number(trimmed)
}

const citationRangeState = computed(() => {
  const min = parseCitationInput(citationCountMin.value)
  const max = parseCitationInput(citationCountMax.value)
  const invalidNumber = Number.isNaN(min) || Number.isNaN(max)
  const invalidRange = !invalidNumber && min !== null && max !== null && min > max
  return {
    min: Number.isNaN(min) ? null : min,
    max: Number.isNaN(max) ? null : max,
    invalid: invalidNumber || invalidRange
  }
})

const citationRangeInvalid = computed(() => citationRangeState.value.invalid)
const citationDistributionEntries = computed(() => {
  return (facets.value.citation_count || [])
    .filter(entry => typeof entry?.value === 'number' && Number.isFinite(entry.value))
    .map(entry => ({ value: Number(entry.value), count: Number(entry.count || 0) }))
    .sort((a, b) => a.value - b.value)
})

const citationBounds = computed(() => {
  if (!citationDistributionEntries.value.length) return null
  return {
    min: citationDistributionEntries.value[0].value,
    max: citationDistributionEntries.value[citationDistributionEntries.value.length - 1].value
  }
})

const citationSliderRange = computed<[number, number]>({
  get() {
    const bounds = citationBounds.value
    const minValue = citationRangeState.value.min
    const maxValue = citationRangeState.value.max
    if (!bounds) return [0, 100]
    return [
      minValue ?? bounds.min,
      maxValue ?? bounds.max
    ]
  },
  set(value) {
    if (!Array.isArray(value) || value.length < 2) return
    const bounds = citationBounds.value
    const nextMin = Math.min(Number(value[0]), Number(value[1]))
    const nextMax = Math.max(Number(value[0]), Number(value[1]))
    citationCountMin.value = String(bounds ? Math.max(bounds.min, nextMin) : nextMin)
    citationCountMax.value = String(bounds ? Math.min(bounds.max, nextMax) : nextMax)
  }
})

const hasCitationCountFilter = computed(() => {
  const { min, max } = citationRangeState.value
  if (citationRangeState.value.invalid) return false
  if (min === null && max === null) return false
  const bounds = citationBounds.value
  if (!bounds) return min !== null || max !== null
  const resolvedMin = min ?? bounds.min
  const resolvedMax = max ?? bounds.max
  return resolvedMin !== bounds.min || resolvedMax !== bounds.max
})

const citationHistogramBins = computed(() =>
  buildHistogramBins(citationDistributionEntries.value, citationBounds.value ? citationSliderRange.value : null, 20)
)
const citationRangeChipLabel = computed(() => {
  const { min, max } = citationRangeState.value
  if (min === null && max === null) return ''
  if (min !== null && max !== null) return `${min}-${max}`
  if (min !== null) return `≥ ${min}`
  return `≤ ${max}`
})

const facetsActiveCount = computed(() => {
  return [
    selectedTopics.value.length,
    selectedStudyTypes.value.length,
    selectedVenues.value.length,
    selectedYears.value.length,
    hasYearRangeFilter.value ? 1 : 0,
    selectedTags.value.length,
    selectedAgeGroups.value.length,
    selectedCountries.value.length,
    selectedIncomeSettings.value.length,
    hasCitationCountFilter.value ? 1 : 0
  ].reduce((sum, count) => sum + count, 0)
})

// Computed
const hasActiveFilters = computed(() => {
  return selectedTopics.value.length > 0 ||
         selectedStudyTypes.value.length > 0 ||
         selectedVenues.value.length > 0 ||
         selectedYears.value.length > 0 ||
         hasYearRangeFilter.value ||
         selectedTags.value.length > 0 ||
         selectedAgeGroups.value.length > 0 ||
         selectedCountries.value.length > 0 ||
         selectedIncomeSettings.value.length > 0 ||
         hasCitationCountFilter.value ||
         nlQuery.value.trim() !== ''
})

interface ActiveFilterChip {
  key: string
  value: string
  label: string
  icon?: string
}

interface HistogramBin {
  from: number
  to: number
  count: number
  heightPct: number
  active: boolean
}

const formatYearLabel = (value: string) => {
  const numeric = Number(value)
  if (!Number.isNaN(numeric) && value.length >= 5) {
    const year = new Date(numeric).getFullYear()
    if (!Number.isNaN(year)) return String(year)
  }
  const parsedYear = new Date(value).getFullYear()
  if (!Number.isNaN(parsedYear)) return String(parsedYear)
  return value
}

const activeFilterChips = computed<ActiveFilterChip[]>(() => {
  const chips: ActiveFilterChip[] = []

  selectedTopics.value.forEach(value => chips.push({ key: 'topic', value, label: value, icon: 'i-lucide-compass' }))
  selectedStudyTypes.value.forEach(value => chips.push({ key: 'study_type', value, label: value, icon: 'i-lucide-flask-conical' }))
  selectedVenues.value.forEach(value => chips.push({ key: 'venue', value, label: value, icon: 'i-lucide-book-open' }))
  selectedYears.value.forEach(value => chips.push({ key: 'year', value, label: formatYearLabel(value), icon: 'i-lucide-calendar' }))
  if (hasYearRangeFilter.value) {
    chips.push({ key: 'year_range', value: yearRangeChipLabel.value, label: `Year: ${yearRangeChipLabel.value}`, icon: 'i-lucide-calendar' })
  }
  selectedTags.value.forEach(value => chips.push({ key: 'tag', value, label: value, icon: 'i-lucide-tags' }))
  selectedAgeGroups.value.forEach(value => chips.push({ key: 'age_group', value, label: value, icon: 'i-lucide-users' }))
  selectedCountries.value.forEach(value => chips.push({ key: 'country', value, label: value, icon: 'i-lucide-globe' }))
  selectedIncomeSettings.value.forEach(value => chips.push({ key: 'income_setting', value, label: value, icon: 'i-lucide-landmark' }))

  if (hasCitationCountFilter.value) {
    chips.push({ key: 'citation_count', value: citationRangeChipLabel.value, label: `Citations: ${citationRangeChipLabel.value}`, icon: 'i-lucide-bar-chart-3' })
  }
  if (nlQuery.value.trim()) {
    chips.push({ key: 'query', value: nlQuery.value.trim(), label: `Query: ${nlQuery.value.trim()}`, icon: 'i-lucide-search' })
  }

  return chips
})

const removeActiveFilterChip = (chip: ActiveFilterChip) => {
  switch (chip.key) {
    case 'topic':
      selectedTopics.value = selectedTopics.value.filter(v => v !== chip.value)
      return
    case 'study_type':
      selectedStudyTypes.value = selectedStudyTypes.value.filter(v => v !== chip.value)
      return
    case 'venue':
      selectedVenues.value = selectedVenues.value.filter(v => v !== chip.value)
      return
    case 'year':
      selectedYears.value = selectedYears.value.filter(v => v !== chip.value)
      return
    case 'tag':
      selectedTags.value = selectedTags.value.filter(v => v !== chip.value)
      return
    case 'year_range':
      clearYearRange()
      return
    case 'age_group':
      selectedAgeGroups.value = selectedAgeGroups.value.filter(v => v !== chip.value)
      return
    case 'country':
      selectedCountries.value = selectedCountries.value.filter(v => v !== chip.value)
      return
    case 'income_setting':
      selectedIncomeSettings.value = selectedIncomeSettings.value.filter(v => v !== chip.value)
      return
    case 'citation_count':
      clearCitationCountRange()
      return
    case 'query':
      nlQuery.value = ''
      searchSummary.value = null
      void syncRouteQuery()
      loadArticles()
      return
  }
}

const hasUsableFacets = (payload: Record<string, Array<{ value: any, count: number }>> | undefined | null) => {
  if (!payload) return false
  return Object.values(payload).some((entries) => Array.isArray(entries) && entries.length > 0)
}

// Load all facets (without filters) to keep facet options always available
const loadFacets = async () => {
  facetsLoading.value = true
  try {
    const baseFacetRequest = {
      q: null as string | null,
      limit: FACET_BOOTSTRAP_LIMIT,
      offset: 0,
      sort: FACET_BOOTSTRAP_SORT,
      fq: null as string[] | null,
      fields: FACET_FIELDS,
      facet_limit: 200
    }

    // Backend is inconsistent: `score desc` with `q:null` and ultra-low limits can return `facets: {}`
    // even though the same endpoint returns facets for a normal search sort.
    let facetResponse = await articlesApi.searchArticles({
      ...baseFacetRequest,
      fl: FACET_BOOTSTRAP_FL
    })

    let facetPayload = facetResponse.result.facets

    // Retry with looser params if backend returns empty facets
    if (!hasUsableFacets(facetPayload)) {
      facetResponse = await articlesApi.searchArticles(baseFacetRequest)
      facetPayload = facetResponse.result.facets
    }

    if (hasUsableFacets(facetPayload)) {
      facets.value = facetPayload
    } else {
      console.warn('Facet bootstrap returned empty facets after retry')
    }
  } catch (err) {
    console.error('Failed to load facets:', err)
  } finally {
    facetsLoading.value = false
  }
}

// Load articles from backend with filters
const loadArticles = async () => {
  clearError()

  try {
    // Build filter queries
    const fq: string[] = []

    if (selectedVenues.value.length > 0) {
      const venueFilter = selectedVenues.value.map(v => `venue:"${v}"`).join(' OR ')
      fq.push(selectedVenues.value.length > 1 ? `(${venueFilter})` : venueFilter)
    }

    if (selectedTopics.value.length > 0) {
      const topicsFilter = selectedTopics.value.map(topic => `topics:"${topic}"`).join(' OR ')
      fq.push(selectedTopics.value.length > 1 ? `(${topicsFilter})` : topicsFilter)
    }

    if (selectedStudyTypes.value.length > 0) {
      const studyTypeFilter = selectedStudyTypes.value.map(st => `study_type:"${st}"`).join(' OR ')
      fq.push(selectedStudyTypes.value.length > 1 ? `(${studyTypeFilter})` : studyTypeFilter)
    }

    if (hasYearRangeFilter.value) {
      const [yearMin, yearMax] = yearRangeSlider.value
      fq.push(`publication_year:[${yearMin}-01-01 TO ${yearMax}-12-31]`)
    }

    if (selectedYears.value.length > 0) {
      const yearFilter = selectedYears.value.map(y => `publication_year:"${y}"`).join(' OR ')
      fq.push(selectedYears.value.length > 1 ? `(${yearFilter})` : yearFilter)
    }

    // Tags filter: build OR query across both tags and ai_tags fields
    if (selectedTags.value.length > 0) {
      const tagFilters: string[] = []
      selectedTags.value.forEach(tag => {
        // Search in both tags and ai_tags fields for each selected value
        tagFilters.push(`tags:"${tag}"`)
        tagFilters.push(`ai_tags:"${tag}"`)
      })
      const tagFilter = tagFilters.join(' OR ')
      fq.push(tagFilters.length > 1 ? `(${tagFilter})` : tagFilter)
    }

    if (selectedAgeGroups.value.length > 0) {
      const ageFilter = selectedAgeGroups.value.map(age => `age_group:"${age}"`).join(' OR ')
      fq.push(selectedAgeGroups.value.length > 1 ? `(${ageFilter})` : ageFilter)
    }

    if (selectedCountries.value.length > 0) {
      const countryFilter = selectedCountries.value.map(country => `geographic_context.country_or_region:"${country}"`).join(' OR ')
      fq.push(selectedCountries.value.length > 1 ? `(${countryFilter})` : countryFilter)
    }

    if (selectedIncomeSettings.value.length > 0) {
      const incomeFilter = selectedIncomeSettings.value.map(income => `geographic_context.income_setting:"${income}"`).join(' OR ')
      fq.push(selectedIncomeSettings.value.length > 1 ? `(${incomeFilter})` : incomeFilter)
    }

    if (hasCitationCountFilter.value && !citationRangeInvalid.value) {
      const min = citationRangeState.value.min ?? '*'
      const max = citationRangeState.value.max ?? '*'
      fq.push(`citation_count:[${min} TO ${max}]`)
    }

    // Load articles with filters (backend may still return facets even with `fields: []`)
    const articleResponse = await searchArticles({
      q: nlQuery.value || null,
      limit: itemsPerPage,
      offset: (page.value - 1) * itemsPerPage,
      sort: sortBy.value,
      fl: ['urn', 'title', 'authors', 'tags', 'ai_tags', 'topics', 'abstract', 'description', 'venue', 'publication_year', 'category', 'ai_category'],
      fq: fq.length > 0 ? fq : null,
      fields: [], // Don't request facets here since we get them separately
    })

    // Fallback: if facet bootstrap returned empty, reuse facets from the article response
    if (!hasUsableFacets(facets.value) && hasUsableFacets(articleResponse?.result?.facets)) {
      facets.value = articleResponse.result.facets
    }

    // Fetch summary only for the first page and when there's a query
    if (page.value === 1 && nlQuery.value && articles.value.length > 0) {
      await fetchSearchSummary(nlQuery.value, articles.value)
    }
  } catch (err) {
    console.error('Failed to load articles:', err)
  }
}

// Methods
const fetchSearchSummary = async (query: string, results: Article[]) => {
  if (!query || results.length === 0) {
    searchSummary.value = null
    return
  }

  summaryLoading.value = true
  summaryError.value = null

  try {
    const authStore = useAuthStore()
    const token = authStore.getToken()

    if (!token) {
      throw new Error('No authentication token available')
    }

    const requestBody = {
      query: query,
      results: results.map(article => ({
        urn: article.urn,
        title: article.title,
        abstract: article.abstract || article.description || '',
        authors: article.authors || [],
        venue: article.venue || '',
        publication_year: article.publication_year || '',
        category: article.category || article.ai_category || '',
        _score: 1.0 // Placeholder score
      })),
      expertise_level: 'intermediate',
      language: 'en'
    }

    const baseUrl = getWisefoodRestApiUrl()
    const response = await fetch(`${baseUrl}/foodscholar/search/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch summary: ${response.statusText}`)
    }

    const data = await response.json()
    searchSummary.value = data.result
    summaryExpanded.value = false // Start collapsed
  } catch (err: any) {
    console.error('Error fetching search summary:', err)
    summaryError.value = err.message || t('foodScholarCatalog.summary.defaultError')
    searchSummary.value = null
  } finally {
    summaryLoading.value = false
  }
}

const performNLSearch = () => {
  page.value = 1
  searchSummary.value = null // Clear previous summary
  sortBy.value = "score desc" // Switch to relevance sorting for searches
  void syncRouteQuery()
  loadArticles()
}

const clearCitationCountRange = () => {
  if (citationBounds.value) {
    citationCountMin.value = String(citationBounds.value.min)
    citationCountMax.value = String(citationBounds.value.max)
  } else {
    citationCountMin.value = ''
    citationCountMax.value = ''
  }
}

const clearYearRange = () => {
  selectedYearRange.value = null
}

const resetFilters = () => {
  selectedTopics.value = []
  selectedStudyTypes.value = []
  selectedVenues.value = []
  selectedYears.value = []
  clearYearRange()
  selectedTags.value = []
  selectedAgeGroups.value = []
  selectedCountries.value = []
  selectedIncomeSettings.value = []
  clearCitationCountRange()
  nlQuery.value = ""
  sortBy.value = "created_at desc"
  page.value = 1
  searchSummary.value = null // Clear summary when resetting
  void syncRouteQuery()
  loadArticles()
}

// Watch for changes
watch([
  selectedTopics,
  selectedStudyTypes,
  selectedVenues,
  selectedYears,
  selectedYearRange,
  selectedTags,
  selectedAgeGroups,
  selectedCountries,
  selectedIncomeSettings,
  citationCountMin,
  citationCountMax,
  sortBy
], () => {
  if (!routeFiltersHydrated.value) return
  page.value = 1
  searchSummary.value = null // Clear summary when filters change
  void syncRouteQuery()
  loadArticles()
}, { deep: true })

watch(page, () => {
  if (!routeFiltersHydrated.value) return
  if (page.value > 1) {
    searchSummary.value = null // Clear summary when navigating away from page 1
  }
  void syncRouteQuery()
  loadArticles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
  setupObserver()
})

// Intersection Observer for animations
let observer: IntersectionObserver | null = null

const setupObserver = () => {
  // Clean up existing observations
  if (observer) {
    observer.disconnect()
  }

  // Set up new observer
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.1
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer?.unobserve(entry.target)
      }
    })
  }, observerOptions)

  // Observe all scroll-fade-in elements
  setTimeout(() => {
    document.querySelectorAll('.scroll-fade-in').forEach((el) => {
      el.classList.remove('is-visible')
      observer?.observe(el)
    })
  }, 50)
}

onMounted(async () => {
  hydrateStateFromRoute()
  routeFiltersHydrated.value = true
  await loadFacets() // Load all available facets once
  await loadArticles() // Load filtered articles
  setupObserver()
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.scroll-fade-in {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
  transition-delay: var(--delay, 0s);
}

.scroll-fade-in.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.catalog-search-composer {
  position: relative;
  border-radius: 0.9rem;
  padding: 0.35rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(14px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.catalog-search-composer:focus-within {
  border-color: rgb(59 130 246 / 0.45);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.12);
  background: rgba(255, 255, 255, 0.85);
}

.dark .catalog-search-composer {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(24, 24, 27, 0.65);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
}

.dark .catalog-search-composer:focus-within {
  border-color: rgb(96 165 250 / 0.45);
  box-shadow: 0 0 0 3px rgb(96 165 250 / 0.12);
  background: rgba(24, 24, 27, 0.82);
}

.catalog-search-send {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.catalog-search-send:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.22);
}

/* Enhanced prose styling for better readability */
:deep(.prose) {
  line-height: 1.75;
}

:deep(.prose p) {
  margin-bottom: 1rem;
  line-height: 1.75;
}

:deep(.prose p + p) {
  margin-top: 1rem;
}

:deep(.prose ul),
:deep(.prose ol) {
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

:deep(.prose li) {
  margin-bottom: 0.5rem;
  line-height: 1.75;
}

:deep(.prose strong) {
  font-weight: 600;
  color: rgb(17 24 39);
}

:deep(.dark .prose strong) {
  color: rgb(249 250 251);
}

/* Ensure proper spacing in summary sections */
:deep(.prose-sm p) {
  font-size: 0.875rem;
  line-height: 1.75;
}

:deep(.prose-base p) {
  font-size: 1rem;
  line-height: 1.8;
}

/* Style URN links to be visually distinct */
:deep(.prose a) {
  color: rgb(37 99 235);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

:deep(.prose a:hover) {
  color: rgb(29 78 216);
  text-decoration: underline;
}

:deep(.dark .prose a) {
  color: rgb(96 165 250);
}

:deep(.dark .prose a:hover) {
  color: rgb(147 197 253);
}

/* Special styling for article reference links */
:deep(.prose a[href*="/foodscholar/"]) {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.375rem;
  background-color: rgb(239 246 255);
  border-radius: 0.375rem;
  font-size: 0.875em;
  white-space: nowrap;
}

:deep(.dark .prose a[href*="/foodscholar/"]) {
  background-color: rgba(37, 99, 235, 0.15);
}

:deep(.prose a[href*="/foodscholar/"]:hover) {
  background-color: rgb(219 234 254);
}

:deep(.dark .prose a[href*="/foodscholar/"]:hover) {
  background-color: rgba(37, 99, 235, 0.25);
}

.answer-reveal-ltr {
  opacity: 0;
  transform: translateX(-12px);
  clip-path: inset(0 100% 0 0);
  animation: answer-reveal-ltr 640ms ease-out forwards;
  animation-delay: var(--answer-reveal-delay, 0ms);
}

@keyframes answer-reveal-ltr {
  0% {
    opacity: 0;
    transform: translateX(-12px);
    clip-path: inset(0 100% 0 0);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
    clip-path: inset(0 0 0 0);
  }
}
</style>
