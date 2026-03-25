<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <!-- Header -->
    <div class="border-b border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-20">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <NuxtLink
          to="/foodscholar/catalog"
          class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
          <span class="text-sm font-medium">{{ t('foodScholarArticle.backToCatalog') }}</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-24">
      <div class="text-center">
        <div class="w-16 h-16 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">{{ t('foodScholarArticle.loading') }}</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-2xl mx-auto px-4 py-20">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
            <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">{{ t('foodScholarArticle.errors.failedToLoad') }}</h3>
            <p class="text-red-700 dark:text-red-300">{{ error }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main v-else-if="article" class="max-w-7xl mx-auto px-4 py-12">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Article Content (Left 2/3) -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Article Header -->
          <div class="scroll-fade-in">
            <!-- Badges Row -->
            <div class="flex flex-wrap items-center gap-3 mb-4">
              <UBadge color="primary" variant="subtle">{{ displayCategory }}</UBadge>
              <UTooltip v-if="displayTopic" :text="topicsTooltip">
                <UBadge variant="outline" class="text-gray-600 dark:text-gray-400 cursor-help">
                  <UIcon name="i-lucide-layers" class="w-3 h-3 mr-1" />
                  {{ displayTopic }}
                </UBadge>
              </UTooltip>
              <UBadge v-if="displayStudyType" variant="outline" class="text-gray-600 dark:text-gray-400">
                <UIcon name="i-lucide-flask-conical" class="w-3 h-3 mr-1" />
                {{ displayStudyType }}
              </UBadge>
            </div>

            <h1 class="text-4xl sm:text-5xl font-light text-gray-900 dark:text-white tracking-tight mb-4">
              {{ article.title }}
            </h1>

            <!-- Audience / Confidence -->
            <div class="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
              <div v-if="displayPopulationGroup" class="flex items-center gap-2">
                <UIcon name="i-lucide-target" class="w-4 h-4 text-brand-500" />
                <span><strong>{{ t('foodScholarArticle.labels.population') }}:</strong> {{ displayPopulationGroup }}</span>
              </div>
              <div v-if="displayReaderGroup" class="flex items-center gap-2">
                <UIcon name="i-lucide-users" class="w-4 h-4 text-brand-500" />
                <span><strong>{{ t('foodScholarArticle.labels.readerGroup') }}:</strong> {{ displayReaderGroup }}</span>
              </div>
              <UBadge v-if="annotationConfidenceLabel" color="primary" variant="subtle" class="text-xs">
                <UIcon name="i-lucide-badge-check" class="w-3 h-3 mr-1" />
                {{ t('foodScholarArticle.labels.confidence', { value: annotationConfidenceLabel }) }}
              </UBadge>
            </div>

            <!-- Publication Info -->
            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <div v-if="article.publication_year" class="flex items-center gap-2">
                <UIcon name="i-lucide-calendar" class="w-4 h-4" />
                <span>{{ article.publication_year.split('-')[0] }}</span>
              </div>
              <div v-if="article.venue" class="flex items-center gap-2">
                <UIcon name="i-lucide-book-open" class="w-4 h-4" />
                <span>{{ article.venue }}</span>
              </div>
              <div v-if="article.doi" class="flex items-center gap-2">
                <a
                  :href="formatDoiUrl(article.doi)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline"
                >
                  <UIcon name="i-lucide-external-link" class="w-4 h-4" />
                  <span>DOI</span>
                </a>
              </div>
              <div v-if="semanticScholarUrl" class="flex items-center gap-2">
                <a
                  :href="semanticScholarUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline"
                >
                  <UIcon name="i-lucide-external-link" class="w-4 h-4" />
                  <span>Semantic Scholar</span>
                </a>
              </div>
            </div>

            <!-- Authors -->
            <div v-if="article.authors && article.authors.length > 0" class="mb-6">
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(author, index) in visibleAuthors"
                  :key="index"
                  class="px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300"
                >
                  {{ author }}
                </span>
                <button
                  v-if="hiddenAuthorsCount > 0"
                  type="button"
                  class="px-3 py-1 text-sm rounded-full bg-gray-200/70 hover:bg-gray-200 dark:bg-zinc-700/60 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200 transition-colors"
                  @click="showAllAuthors = !showAllAuthors"
                >
                  {{ showAllAuthors ? t('foodScholarArticle.common.showLess') : t('foodScholarArticle.authors.showMore', { count: hiddenAuthorsCount }) }}
                </button>
              </div>
            </div>
          </div>

          <!-- Abstract Section with Magic Simplify -->
          <div class="scroll-fade-in p-6 rounded-2xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700" style="--delay: 0.1s">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UIcon name="i-lucide-file-text" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
                {{ t('foodScholarArticle.sections.abstract') }}
              </h2>
              <!-- Magic Simplify Button -->
              <button
                v-if="hasSimplifiedAbstract"
                @click="toggleSimplified"
                :class="[
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300',
                  isSimplified
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                ]"
              >
                <UIcon
                  name="i-lucide-sparkles"
                  :class="['w-4 h-4 transition-transform duration-500', { 'animate-sparkle': isSimplifying }]"
                />
                {{ isSimplified ? t('foodScholarArticle.actions.showOriginal') : t('foodScholarArticle.actions.simplify') }}
              </button>
            </div>

            <!-- Abstract Text with Glossary Tooltips -->
            <div
              ref="abstractContainerEl"
              class="text-gray-700 dark:text-gray-300 leading-relaxed transition-opacity duration-300"
              :class="{ 'opacity-50': isSimplifying }"
            >
              <p v-if="isSimplified" class="font-light">
                {{ simplifiedAbstract }}
              </p>
              <p v-else v-html="abstractWithTooltips" class="font-light abstract-content"></p>
            </div>
          </div>

          <!-- Key Takeaways -->
          <div v-if="displayTakeaways.length > 0" class="scroll-fade-in p-6 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800" style="--delay: 0.2s">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-lightbulb" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
              {{ t('foodScholarArticle.sections.keyTakeaways') }}
              <span v-if="!article.key_takeaways || article.key_takeaways.length === 0" class="text-xs font-normal text-gray-500 dark:text-gray-400">({{ t('foodScholarArticle.aiGenerated') }})</span>
            </h2>
            <ul class="space-y-3">
              <li
                v-for="(takeaway, index) in displayTakeaways"
                :key="index"
                class="flex items-start gap-3 text-gray-700 dark:text-gray-300"
              >
                <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                <span class="font-light">{{ takeaway }}</span>
              </li>
            </ul>
          </div>

          <!-- Evaluation Section -->
          <div v-if="article.extras?.evaluation" class="scroll-fade-in p-6 rounded-2xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700" style="--delay: 0.3s">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-gauge" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
              {{ t('foodScholarArticle.sections.studyEvaluation') }}
            </h2>

            <!-- Scores -->
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div v-if="article.extras.evaluation.actionability_score" class="p-4 rounded-xl bg-gray-50 dark:bg-zinc-700/50">
                <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">{{ t('foodScholarArticle.evaluation.actionability') }}</div>
                <div class="flex items-center gap-2">
                  <div class="flex gap-1">
                    <div
                      v-for="i in 5"
                      :key="i"
                      :class="[
                        'w-2 h-6 rounded-sm transition-colors',
                        i <= article.extras.evaluation.actionability_score
                          ? 'bg-brand-500'
                          : 'bg-gray-200 dark:bg-zinc-600'
                      ]"
                    ></div>
                  </div>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ article.extras.evaluation.actionability_score }}/5
                  </span>
                </div>
              </div>
              <div v-if="article.extras.evaluation.user_value_score" class="p-4 rounded-xl bg-gray-50 dark:bg-zinc-700/50">
                <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">{{ t('foodScholarArticle.evaluation.userValue') }}</div>
                <div class="flex items-center gap-2">
                  <div class="flex gap-1">
                    <div
                      v-for="i in 5"
                      :key="i"
                      :class="[
                        'w-2 h-6 rounded-sm transition-colors',
                        i <= article.extras.evaluation.user_value_score
                          ? 'bg-green-500'
                          : 'bg-gray-200 dark:bg-zinc-600'
                      ]"
                    ></div>
                  </div>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ article.extras.evaluation.user_value_score }}/5
                  </span>
                </div>
              </div>
            </div>

            <!-- Safety Badge -->
            <div v-if="article.extras.evaluation.safety_sensitivity" class="mb-4">
              <UBadge
                :color="getSafetyColor(article.extras.evaluation.safety_sensitivity)"
                variant="subtle"
                class="text-sm"
              >
                <UIcon name="i-lucide-shield" class="w-3 h-3 mr-1" />
                {{ article.extras.evaluation.safety_sensitivity }}
              </UBadge>
            </div>

            <!-- Recommended Framing -->
            <div v-if="article.extras.evaluation.recommended_user_framing" class="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-info" class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p class="text-sm text-blue-800 dark:text-blue-200">
                  {{ article.extras.evaluation.recommended_user_framing }}
                </p>
              </div>
            </div>
          </div>

          <!-- Q&A Sections -->
          <div v-if="hasQASections" class="scroll-fade-in space-y-4" style="--delay: 0.4s">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <UIcon name="i-lucide-message-circle-question" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
              {{ t('foodScholarArticle.sections.qa') }}
            </h2>

            <!-- Q&A Tabs -->
            <div class="flex gap-2 mb-4">
              <button
                v-for="tab in availableQATabs"
                :key="tab.key"
                @click="activeQATab = tab.key"
                :class="[
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  activeQATab === tab.key
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-600'
                ]"
              >
                {{ tab.label }}
              </button>
            </div>

            <!-- Q&A Content -->
            <div class="space-y-4">
              <div
                v-for="(qa, index) in currentQAItems"
                :key="index"
                class="p-4 rounded-xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700"
              >
                <h4 class="font-medium text-gray-900 dark:text-white mb-2 flex items-start gap-2">
                  <UIcon name="i-lucide-help-circle" class="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
                  {{ qa.question }}
                </h4>
                <p class="text-gray-600 dark:text-gray-300 ml-7 mb-2">{{ qa.answer }}</p>
                <p v-if="qa.grounding" class="text-xs text-gray-500 dark:text-gray-400 ml-7 italic border-l-2 border-gray-200 dark:border-zinc-600 pl-3">
                  {{ qa.grounding }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar (Right 1/3) -->
        <aside class="lg:col-span-1">
          <div class="sticky top-24 space-y-6">
            <!-- Metrics -->
            <div v-if="hasCitationInfo || hasAccessInfo" class="scroll-fade-in p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700" style="--delay: 0.05s">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UIcon name="i-lucide-bar-chart-3" class="w-5 h-5" />
                {{ t('foodScholarArticle.metrics.title') }}
              </h3>

              <div v-if="hasCitationInfo" class="flex items-center gap-4 mb-5">
                <RingMetric
                  v-if="article.citation_count !== null && article.citation_count !== undefined"
                  :label="t('foodScholarArticle.metrics.citations')"
                  :value="article.citation_count"
                  :tooltip="t('foodScholarArticle.metrics.citationsTooltip')"
                  color-class="text-brand-500"
                  :size="60"
                />
                <div class="flex-1 min-w-0 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div v-if="article.influential_citation_count !== null && article.influential_citation_count !== undefined" class="flex items-center justify-between gap-3">
                    <UTooltip :text="t('foodScholarArticle.metrics.influentialTooltip')">
                      <span class="inline-flex items-center gap-2 cursor-help">
                        <span class="w-2 h-2 rounded-full bg-purple-500"></span>
                        {{ t('foodScholarArticle.metrics.influential') }}
                      </span>
                    </UTooltip>
                    <span class="font-medium tabular-nums">{{ formatNumber(article.influential_citation_count) }}</span>
                  </div>
                  <div v-if="article.reference_count !== null && article.reference_count !== undefined" class="flex items-center justify-between gap-3">
                    <UTooltip :text="t('foodScholarArticle.metrics.referencesTooltip')">
                      <span class="inline-flex items-center gap-2 cursor-help">
                        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {{ t('foodScholarArticle.metrics.references') }}
                      </span>
                    </UTooltip>
                    <span class="font-medium tabular-nums">{{ formatNumber(article.reference_count) }}</span>
                  </div>
                </div>
              </div>

              <div v-if="hasAccessInfo" class="flex flex-wrap items-center gap-2">
                <UBadge
                  v-if="article.open_access !== null && article.open_access !== undefined"
                  :color="article.open_access ? 'success' : 'neutral'"
                  variant="subtle"
                >
                  <UIcon :name="article.open_access ? 'i-lucide-unlock' : 'i-lucide-lock'" class="w-3 h-3 mr-1" />
                  {{ article.open_access ? t('foodScholarArticle.access.open') : t('foodScholarArticle.access.closed') }}
                </UBadge>
                <UBadge v-if="meaningfulString(article.license)" variant="outline" class="text-gray-600 dark:text-gray-300">
                  <UIcon name="i-lucide-scale" class="w-3 h-3 mr-1" />
                  {{ article.license }}
                </UBadge>
              </div>
            </div>

            <!-- Tags -->
            <div v-if="displayTags.length > 0" class="scroll-fade-in p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700" style="--delay: 0.1s">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UIcon name="i-lucide-tags" class="w-5 h-5" />
                {{ t('foodScholarArticle.sections.tags') }}
                <span v-if="!article.tags || article.tags.length === 0" class="text-xs font-normal text-gray-500 dark:text-gray-400">({{ t('foodScholarArticle.ai') }})</span>
              </h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in displayTags"
                  :key="tag"
                  class="text-xs bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-3 py-1 rounded-full"
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <!-- Keywords -->
            <div v-if="displayKeywords.length > 0" class="scroll-fade-in p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700" style="--delay: 0.15s">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UIcon name="i-lucide-key" class="w-5 h-5" />
                {{ t('foodScholarArticle.sections.keywords') }}
              </h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="kw in displayKeywords"
                  :key="kw"
                  class="text-xs bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full"
                >
                  {{ kw }}
                </span>
              </div>
              <button
                v-if="allKeywords.length > keywordLimit"
                class="mt-3 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
                @click="showAllKeywords = !showAllKeywords"
              >
                {{ showAllKeywords ? t('foodScholarArticle.common.showLess') : t('foodScholarArticle.keywords.showAll', { count: allKeywords.length }) }}
              </button>
            </div>

            <!-- Glossary -->
            <div v-if="glossaryTerms.length > 0" class="scroll-fade-in p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700" style="--delay: 0.2s">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UIcon name="i-lucide-book-a" class="w-5 h-5" />
                {{ t('foodScholarArticle.sections.glossary') }}
              </h3>
              <div class="space-y-3">
                <div v-for="term in glossaryTerms" :key="term.term" class="text-sm">
                  <dt class="font-medium text-gray-800 dark:text-gray-200">{{ term.term }}</dt>
                  <dd class="text-gray-600 dark:text-gray-400 mt-0.5">{{ term.definition }}</dd>
                </div>
              </div>
            </div>

            <!-- Article Info -->
            <div class="scroll-fade-in p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700" style="--delay: 0.3s">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-4">{{ t('foodScholarArticle.sections.articleInfo') }}</h3>
              <div class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div v-for="item in visibleInfoItems" :key="item.label" class="flex items-start gap-2">
                  <UIcon :name="item.icon" class="w-4 h-4 mt-0.5 shrink-0" />
                  <div class="min-w-0">
                    <span class="text-gray-500 dark:text-gray-500">{{ item.label }}:</span>
                    <span class="ml-1 break-words">{{ item.value }}</span>
                  </div>
                </div>

                <button
                  v-if="hiddenInfoCount > 0"
                  class="pt-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
                  @click="showMoreInfo = !showMoreInfo"
                >
                  {{ showMoreInfo ? t('foodScholarArticle.actions.hideDetails') : t('foodScholarArticle.actions.showMore', { count: hiddenInfoCount }) }}
                </button>
              </div>
            </div>

            <!-- Share -->
            <div class="scroll-fade-in p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700" style="--delay: 0.4s">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-4">{{ t('foodScholarArticle.sections.share') }}</h3>
              <div class="flex gap-2">
                <UButton variant="outline" size="sm" icon="i-lucide-link" class="flex-1 cursor-pointer" @click="copyLink">
                  {{ copied ? t('foodScholarArticle.actions.copied') : t('foodScholarArticle.actions.copyLink') }}
                </UButton>
                <UButton variant="outline" size="sm" icon="i-lucide-bookmark" class="cursor-pointer">
                  {{ t('foodScholarArticle.actions.save') }}
                </UButton>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>

    <!-- Article Not Found -->
    <div v-else class="flex items-center justify-center py-20">
      <div class="text-center">
        <UIcon name="i-lucide-file-question" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{{ t('foodScholarArticle.notFound.title') }}</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">{{ t('foodScholarArticle.notFound.subtitle') }}</p>
        <UButton to="/foodscholar/catalog" color="primary">
          {{ t('foodScholarArticle.backToCatalog') }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useArticles } from '~/composables/useArticles'
import { formatDoiUrl } from '~/utils/articleHelpers'
import type { GlossaryTerm, QAItem } from '~/services/articlesApi'

definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()

const route = useRoute()
const urn = computed(() => route.params.id as string)

const { currentArticle: article, loading, error, fetchArticle } = useArticles()

// State
const isSimplified = ref(false)
const isSimplifying = ref(false)
const activeQATab = ref<'user' | 'practitioner' | 'expert'>('user')
const copied = ref(false)
const showMoreInfo = ref(false)
const showAllKeywords = ref(false)
const showAllAuthors = ref(false)
const abstractContainerEl = ref<HTMLElement | null>(null)

const keywordLimit = 12
const infoPrimaryLimit = 5
const authorLimit = 10

type InfoItem = { label: string, value: string, icon: string }

function isPlaceholderString(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return normalized === 'not stated' || normalized === 'none' || normalized === 'n/a' || normalized === 'unknown'
}

function meaningfulString(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (!value.trim()) return false
  return !isPlaceholderString(value)
}

function cleanStringList(list: unknown): string[] {
  if (!Array.isArray(list)) return []
  const cleaned = list
    .filter((x): x is string => typeof x === 'string')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !isPlaceholderString(s))
  return [...new Set(cleaned)]
}

function pickFirstMeaningful(...candidates: Array<unknown>): string | null {
  for (const c of candidates) {
    if (meaningfulString(c)) return c.trim()
  }
  return null
}

// Computed properties
const displayCategory = computed(() => {
  if (!article.value) return ''
  return article.value.category || article.value.ai_category || t('foodScholarHome.categories.uncategorized')
})

const displayTopic = computed(() => {
  const topics = cleanStringList(article.value?.topics)
  return topics[0] || ''
})

const topicsTooltip = computed(() => {
  const topics = cleanStringList(article.value?.topics)
  return t('foodScholarArticle.topicsTooltip', { topics: topics.join(', ') })
})

const displayStudyType = computed(() => {
  return pickFirstMeaningful(article.value?.study_type, article.value?.extras?.study_type) || ''
})

const displayReaderGroup = computed(() => {
  return pickFirstMeaningful(article.value?.reader_group, article.value?.extras?.reader_group) || ''
})

const displayPopulationGroup = computed(() => {
  return pickFirstMeaningful(article.value?.population_group, article.value?.extras?.population_group) || ''
})

const annotationConfidenceLabel = computed(() => {
  const v = article.value?.annotation_confidence
  if (typeof v !== 'number' || !Number.isFinite(v)) return ''
  const pct = v <= 1 ? Math.round(v * 100) : Math.round(v)
  if (pct <= 0) return ''
  return `${pct}%`
})

const semanticScholarUrl = computed(() => {
  const url = article.value?.url
  return meaningfulString(url) ? url : ''
})

const highlightText = computed(() => {
  const raw = route.query.hl
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' ? value.trim() : ''
})

const shouldHighlightAbstract = computed(() => {
  const raw = route.query.section
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) return true
  return String(value).toLowerCase() === 'abstract'
})

const allAuthors = computed(() => {
  return Array.isArray(article.value?.authors) ? article.value!.authors : []
})

const hiddenAuthorsCount = computed(() => {
  const extra = allAuthors.value.length - authorLimit
  return Math.max(0, extra)
})

const visibleAuthors = computed(() => {
  if (showAllAuthors.value) return allAuthors.value
  return allAuthors.value.slice(0, authorLimit)
})

const displayTakeaways = computed(() => {
  if (!article.value) return []
  const humanTakeaways = article.value.key_takeaways || []
  if (humanTakeaways.length > 0) return humanTakeaways
  return article.value.ai_key_takeaways || []
})

const displayTags = computed(() => {
  if (!article.value) return []
  const humanTags = article.value.tags || []
  const aiTags = article.value.ai_tags || []
  const allTags = [...humanTags, ...aiTags]
  const uniqueTags = [...new Set(allTags)]
  return uniqueTags.slice(0, 10)
})

// Glossary
const glossaryTerms = computed<GlossaryTerm[]>(() => {
  return article.value?.extras?.annotations?.glosary || []
})

// Keywords
const allKeywords = computed(() => cleanStringList(article.value?.keywords))
const displayKeywords = computed(() => {
  if (showAllKeywords.value) return allKeywords.value
  return allKeywords.value.slice(0, keywordLimit)
})

// Metrics & access info
const hasCitationInfo = computed(() => {
  const a = article.value
  if (!a) return false
  return [a.citation_count, a.influential_citation_count, a.reference_count].some(v => v !== null && v !== undefined)
})

const hasAccessInfo = computed(() => {
  const a = article.value
  if (!a) return false
  return (a.open_access !== null && a.open_access !== undefined) || meaningfulString(a.license)
})

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value)
}

// Sidebar info items (hide placeholders like "Not stated")
const allInfoItems = computed<InfoItem[]>(() => {
  const a = article.value
  if (!a) return []

  const items: InfoItem[] = []
  const push = (label: string, icon: string, value: unknown) => {
    if (typeof value === 'string') {
      if (!meaningfulString(value)) return
      items.push({ label, icon, value: value.trim() })
      return
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return
      items.push({ label, icon, value: new Intl.NumberFormat().format(value) })
      return
    }
    if (Array.isArray(value)) {
      const cleaned = cleanStringList(value)
      if (cleaned.length === 0) return
      items.push({ label, icon, value: cleaned.join(', ') })
      return
    }
  }

  if (meaningfulString(a.language)) push(t('foodScholarArticle.info.language'), 'i-lucide-globe', a.language.toUpperCase())
  push(t('foodScholarArticle.info.region'), 'i-lucide-map-pin', a.region)
  push(t('foodScholarArticle.info.ageGroup'), 'i-lucide-baby', a.age_group)

  const geoCountry = pickFirstMeaningful(a.geographic_context?.country_or_region)
  const geoIncome = pickFirstMeaningful(a.geographic_context?.income_setting)
  const geo = [geoCountry, geoIncome].filter(Boolean).join(' · ')
  if (geo) push(t('foodScholarArticle.info.geographicContext'), 'i-lucide-map', geo)

  push(t('foodScholarArticle.info.biologicalModel'), 'i-lucide-dna', a.biological_model)

  const hardExclusions = cleanStringList(a.hard_exclusion_flags).filter(v => v.toLowerCase() !== 'none')
  if (hardExclusions.length > 0) push(t('foodScholarArticle.info.exclusionFlags'), 'i-lucide-shield-alert', hardExclusions)

  push(t('foodScholarArticle.info.externalId'), 'i-lucide-database', a.external_id)

  return items
})

const visibleInfoItems = computed(() => {
  if (showMoreInfo.value) return allInfoItems.value
  return allInfoItems.value.slice(0, infoPrimaryLimit)
})

const hiddenInfoCount = computed(() => Math.max(0, allInfoItems.value.length - infoPrimaryLimit))

// Simplified abstract
const hasSimplifiedAbstract = computed(() => {
  return !!article.value?.extras?.annotations?.abstract
})

const simplifiedAbstract = computed(() => {
  return article.value?.extras?.annotations?.abstract || ''
})

// Abstract with tooltip-enabled glossary terms
const abstractWithTooltips = computed(() => {
  const abstractText = article.value?.abstract || article.value?.description || ''
  if (!abstractText) return ''

  let result = escapeHtml(abstractText)

  if (shouldHighlightAbstract.value && highlightText.value) {
    const escapedQuote = escapeHtml(highlightText.value)
    const pattern = escapeRegex(escapedQuote).replace(/\s+/g, '\\s+')
    const regex = new RegExp(pattern, 'i')
    result = replaceOutsideTags(result, regex, '<mark class="highlight-term">$&</mark>')
  }

  if (glossaryTerms.value.length === 0) return result

  for (const term of glossaryTerms.value) {
    const regex = new RegExp(`\\b(${escapeRegex(term.term)})\\b`, 'gi')
    result = replaceOutsideTags(
      result,
      regex,
      `<span class="glossary-term" data-tooltip="${escapeHtml(term.definition)}">$1</span>`
    )
  }

  return result
})

// Q&A sections
const hasQASections = computed(() => {
  const annotations = article.value?.extras?.annotations
  return !!(annotations?.user_qa?.length || annotations?.practitioner_qa?.length || annotations?.expert_qa?.length)
})

const availableQATabs = computed(() => {
  const tabs: { key: 'user' | 'practitioner' | 'expert', label: string }[] = []
  const annotations = article.value?.extras?.annotations
  if (annotations?.user_qa?.length) tabs.push({ key: 'user', label: t('foodScholarArticle.qaTabs.forYou') })
  if (annotations?.practitioner_qa?.length) tabs.push({ key: 'practitioner', label: t('foodScholarArticle.qaTabs.forPractitioners') })
  if (annotations?.expert_qa?.length) tabs.push({ key: 'expert', label: t('foodScholarArticle.qaTabs.forExperts') })
  return tabs
})

const currentQAItems = computed<QAItem[]>(() => {
  const annotations = article.value?.extras?.annotations
  if (!annotations) return []
  switch (activeQATab.value) {
    case 'user': return annotations.user_qa || []
    case 'practitioner': return annotations.practitioner_qa || []
    case 'expert': return annotations.expert_qa || []
    default: return []
  }
})

// Helper functions
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;')
}

function replaceOutsideTags(
  html: string,
  regex: RegExp,
  replacer: string | ((substring: string, ...args: any[]) => string)
): string {
  const parts = html.split(/(<[^>]+>)/g)
  return parts
    .map(part => part.startsWith('<') ? part : part.replace(regex, replacer as any))
    .join('')
}

function getSafetyColor(sensitivity: string): string {
  if (sensitivity.toLowerCase().includes('medical')) return 'warning'
  if (sensitivity.toLowerCase().includes('high')) return 'error'
  return 'neutral'
}

function toggleSimplified() {
  isSimplifying.value = true
  setTimeout(() => {
    isSimplified.value = !isSimplified.value
    isSimplifying.value = false
  }, 400)
}

async function copyLink() {
  await navigator.clipboard.writeText(window.location.href)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

// Set page metadata
useHead({
  title: computed(() => article.value
    ? t('foodScholarArticle.meta.title', { title: article.value.title })
    : t('foodScholarArticle.meta.fallbackTitle'))
})

useSeoMeta({
  description: computed(() => article.value?.abstract || article.value?.description || t('foodScholarArticle.meta.fallbackDescription'))
})

// Intersection Observer for animations
let observer: IntersectionObserver | null = null

onMounted(async () => {
  await fetchArticle(urn.value)

  if (highlightText.value) {
    isSimplified.value = false
  }

  // Set initial Q&A tab
  if (availableQATabs.value.length > 0) {
    activeQATab.value = availableQATabs.value[0].key
  }

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

  await nextTick()
  setTimeout(() => {
    document.querySelectorAll('.scroll-fade-in').forEach((el) => {
      observer?.observe(el)
    })
  }, 200)

  if (highlightText.value) {
    setTimeout(() => {
      const container = abstractContainerEl.value
      const target = container?.querySelector('.highlight-term') as HTMLElement | null
      if (!target) return
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
  }
})

watch(() => highlightText.value, async (value) => {
  if (!value) return
  isSimplified.value = false
  await nextTick()
  const container = abstractContainerEl.value
  const target = container?.querySelector('.highlight-term') as HTMLElement | null
  if (!target) return
  target.scrollIntoView({ behavior: 'smooth', block: 'center' })
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

/* Glossary term tooltips */
:deep(.glossary-term) {
  position: relative;
  border-bottom: 1px dashed currentColor;
  cursor: help;
}

:deep(.glossary-term::after) {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-4px);
  background: #1f2937;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: normal;
  white-space: normal;
  width: max-content;
  max-width: 280px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 50;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  line-height: 1.4;
}

:deep(.glossary-term:hover::after) {
  opacity: 1;
  visibility: visible;
}

/* Highlighted citation passage */
:deep(.highlight-term) {
  background: rgba(250, 204, 21, 0.35);
  color: inherit;
  padding: 0.05em 0.15em;
  border-radius: 0.25rem;
}

/* Sparkle animation */
@keyframes sparkle {
  0%, 100% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(-10deg) scale(1.1); }
  50% { transform: rotate(10deg) scale(1.2); }
  75% { transform: rotate(-5deg) scale(1.1); }
}

.animate-sparkle {
  animation: sparkle 0.5s ease-in-out;
}
</style>
