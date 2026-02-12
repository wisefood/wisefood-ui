<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <div class="border-b border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <NuxtLink
              to="/dashboard"
              class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              <UIcon
                name="i-lucide-arrow-left"
                class="w-5 h-5"
              />
              <span class="text-sm font-medium">Back to Dashboard</span>
            </NuxtLink>
          </div>
        </div>
        <div class="mt-4">
          <h1 class="text-3xl sm:text-4xl font-light text-gray-900 dark:text-white tracking-tight">
            <span class="font-serif italic text-brand-500 text-4xl sm:text-5xl">FoodScholar</span>
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-300 font-light">
            Educational content and nutritional insights about sustainable eating
          </p>
        </div>
      </div>
    </div>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <section
        class="mb-12 scroll-fade-in"
        style="--delay: 0.05s"
      >
        <div class="w-full">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center shrink-0 shadow-md shadow-brand-500/25">
                <UIcon
                  name="i-lucide-sparkles"
                  class="w-4 h-4 text-white"
                />
              </div>
              <div>
                <h2 class="text-3xl font-serif font-semibold text-gray-900 dark:text-white">
                  {{ qaHeading }}
                </h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Ask naturally. Get evidence-backed answers.
                </p>
              </div>
            </div>

            <div class="inline-flex items-center rounded-full border border-gray-200 dark:border-zinc-600 bg-white/70 dark:bg-zinc-900/70 p-1">
              <button
                type="button"
                :class="[
                  'px-3 py-1.5 text-xs font-semibold rounded-full transition-colors',
                  qaMode === 'simple'
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400'
                ]"
                @click="qaMode = 'simple'"
              >
                Simple
              </button>
              <button
                type="button"
                :class="[
                  'px-3 py-1.5 text-xs font-semibold rounded-full transition-colors',
                  qaMode === 'advanced'
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400'
                ]"
                @click="qaMode = 'advanced'"
              >
                Advanced
              </button>
            </div>
          </div>

          <div class="relative">
            <div
              class="chat-composer"
              :class="{ 'is-focused': composerFocused }"
            >
              <div class="chat-composer-accent chat-composer-accent-left" />
              <div class="chat-composer-accent chat-composer-accent-right" />

              <FoodscholarNLInput
                v-model="chatQuery"
                :disabled="asking"
                :placeholder="qaPlaceholder"
                input-class="w-full h-12 pl-11 pr-16 rounded-xl bg-transparent text-[15px] text-gray-900 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-zinc-400 focus:outline-none transition-all duration-200"
                @enter="askScholarQA"
                @focus="composerFocused = true"
                @blur="composerFocused = false"
              >
                <template #left>
                  <UIcon
                    name="i-lucide-search"
                    class="w-5 h-5 text-gray-500 dark:text-gray-400"
                  />
                </template>

                <template #right>
                  <button
                    :disabled="asking"
                    class="chat-send-button h-10 w-10 flex items-center justify-center rounded-xl text-white disabled:opacity-50 shadow-md shadow-brand-700/20"
                    :class="[
                      'bg-brand-500',
                      !asking ? 'chat-send-idle' : ''
                    ]"
                    @click="askScholarQA()"
                  >
                    <UIcon
                      v-if="asking"
                      name="i-lucide-loader-2"
                      class="w-4 h-4 animate-spin text-white"
                    />
                    <UIcon
                      v-else
                      name="i-lucide-arrow-up"
                      class="w-4 h-4 text-white"
                    />
                  </button>
                </template>
              </FoodscholarNLInput>
            </div>

            <div class="mt-2 px-1 flex items-center justify-between">
              <p class="text-[11px] text-gray-500 dark:text-gray-400 transition-colors">
                {{ composerFocused ? 'Nice, now add the detail you care about most.' : 'Press Enter to ask. Open Advanced for extra control.' }}
              </p>
              <span class="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Enter
              </span>
            </div>
          </div>

          <div
            v-if="isAdvancedMode"
            class="mt-4 rounded-2xl border border-gray-200/80 dark:border-zinc-700/80 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-sm p-4"
          >
            <div class="flex items-start justify-between gap-3 mb-4">
              <div>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">Advanced settings</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Tune behavior only if you need more control.</p>
              </div>
              <div class="inline-flex items-center rounded-full border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 p-1 shadow-sm">
                <button
                  type="button"
                  :class="[
                    'px-3 py-1.5 text-xs font-semibold rounded-full transition-colors',
                    ragEnabled
                      ? 'bg-emerald-500 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400'
                  ]"
                  @click="ragEnabled = true"
                >
                  RAG On
                </button>
                <button
                  type="button"
                  :class="[
                    'px-3 py-1.5 text-xs font-semibold rounded-full transition-colors',
                    !ragEnabled
                      ? 'bg-zinc-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400'
                  ]"
                  @click="ragEnabled = false"
                >
                  RAG Off
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-2">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">Model</label>
                <USelectMenu
                  v-model="selectedModelValue"
                  :items="modelOptions"
                  class="w-full"
                  size="lg"
                  :ui="advancedSelectUi"
                  value-key="value"
                  label-key="label"
                  :search-input="false"
                  placeholder="Auto (recommended)"
                  :portal="false"
                  :disabled="modelsLoading || asking"
                >
                  <template #leading>
                    <UIcon
                      :name="selectedModelOption.icon"
                      class="w-4 h-4 text-gray-500 dark:text-gray-400"
                    />
                  </template>
                </USelectMenu>
                <p
                  v-if="!modelsLoading && modelOptions.length <= 1"
                  class="mt-2 text-[11px] text-amber-700 dark:text-amber-300"
                >
                  No provider models available right now. Auto will be used.
                </p>
                <p
                  v-else
                  class="mt-2 text-[11px] text-gray-500 dark:text-gray-400"
                >
                  Leave on Auto unless you need a specific provider.
                </p>
              </div>

              <div class="space-y-2">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">Source Depth</label>
                <USelectMenu
                  v-model="selectedTopKValue"
                  :items="topKOptions"
                  class="w-full"
                  size="lg"
                  :ui="advancedSelectUi"
                  value-key="value"
                  label-key="label"
                  :search-input="false"
                  :portal="false"
                  :disabled="asking || !ragEnabled"
                >
                  <template #leading>
                    <UIcon
                      :name="selectedTopKOption.icon"
                      class="w-4 h-4 text-gray-500 dark:text-gray-400"
                    />
                  </template>
                </USelectMenu>
                <p class="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                  {{ ragEnabled ? selectedTopKOption.description : 'Enable RAG to adjust source depth.' }}
                </p>
              </div>

              <div class="space-y-2">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">Explanation Style</label>
                <USelectMenu
                  v-model="selectedExpertiseValue"
                  :items="expertiseOptions"
                  class="w-full"
                  size="lg"
                  :ui="advancedSelectUi"
                  value-key="value"
                  label-key="label"
                  :search-input="false"
                  :portal="false"
                  :disabled="asking"
                >
                  <template #leading>
                    <UIcon
                      :name="selectedExpertiseOption.icon"
                      class="w-4 h-4 text-gray-500 dark:text-gray-400"
                    />
                  </template>
                </USelectMenu>
                <p class="mt-2 text-[11px] text-gray-500 dark:text-gray-400">{{ selectedExpertiseOption.description }}</p>
              </div>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <button
              v-for="quickQ in quickQuestions"
              :key="quickQ"
              type="button"
              class="px-3 py-1.5 text-xs rounded-full bg-white/70 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-brand-100 dark:hover:bg-brand-900/30 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
              @click="askQuickQuestion(quickQ)"
            >
              {{ quickQ }}
            </button>
          </div>

          <div
            v-if="qaError"
            class="mt-5 p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50/90 dark:bg-red-900/20"
          >
            <p class="text-sm text-red-700 dark:text-red-300">{{ qaError }}</p>
          </div>

          <div
            v-if="asking"
            class="mt-6 space-y-4"
          >
            <div class="flex justify-end">
              <div class="chat-flow-bubble chat-flow-bubble-user">
                <p class="text-[10px] uppercase tracking-widest font-semibold text-brand-200 mb-1">You asked</p>
                <p class="text-sm leading-relaxed">{{ chatQuery }}</p>
              </div>
            </div>

            <div class="chat-flow-bubble chat-flow-bubble-assistant">
              <div class="flex items-center justify-between mb-3">
                <div class="h-4 w-16 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse" />
                <div class="h-3 w-24 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse" />
              </div>
              <div class="space-y-2.5">
                <div class="h-3 w-full rounded bg-gray-200 dark:bg-zinc-700 animate-pulse" />
                <div class="h-3 w-11/12 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse" />
                <div class="h-3 w-4/5 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse" />
                <div class="h-3 w-full rounded bg-gray-200 dark:bg-zinc-700 animate-pulse" />
                <div class="h-3 w-3/4 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse" />
                <div class="h-3 w-5/6 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse" />
                <div class="h-3 w-2/3 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse" />
              </div>
            </div>
          </div>

          <div
            v-if="qaResult && primaryAnswer"
            class="mt-6 space-y-4"
          >
            <div class="flex justify-end">
              <div class="chat-flow-bubble chat-flow-bubble-user">
                <p class="text-[10px] uppercase tracking-widest font-semibold text-brand-200 mb-1">You asked</p>
                <p class="text-sm leading-relaxed">{{ qaResult.question }}</p>
              </div>
            </div>

            <div
              v-if="hasDualAnswerMode"
              class="space-y-3"
            >
              <p
                v-if="!selectedPreferredAnswer"
                class="text-xs text-gray-500 dark:text-gray-400"
              >
                Click an answer card to choose your preferred response.
              </p>
              <div
                v-else
                class="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
              >
                <UIcon
                  name="i-lucide-check"
                  class="w-4 h-4"
                />
                Preference saved
              </div>
              <div
                :class="[
                  'grid gap-3',
                  selectedPreferredAnswer ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
                ]"
              >
                <div
                  v-if="!selectedPreferredAnswer || selectedPreferredAnswer === 'a'"
                  :class="[
                    'chat-flow-bubble chat-flow-bubble-assistant p-5 rounded-2xl transition-all duration-200',
                    selectedPreferredAnswer === 'a'
                      ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900'
                      : feedbackSubmitting
                        ? 'opacity-70 pointer-events-none'
                        : 'cursor-pointer hover:ring-2 hover:ring-brandp-300 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-brandp-600 dark:hover:ring-offset-zinc-900'
                  ]"
                  role="button"
                  tabindex="0"
                  :aria-pressed="selectedPreferredAnswer === 'a'"
                  @click="submitDualAnswerFeedback('a')"
                  @keydown.enter.prevent="submitDualAnswerFeedback('a')"
                  @keydown.space.prevent="submitDualAnswerFeedback('a')"
                >
                  <div class="flex items-center justify-between gap-2 mb-3">
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white">{{ selectedPreferredAnswer ? 'Answer' : 'Answer A' }}</h4>
                    <span
                      v-if="!selectedPreferredAnswer"
                      class="text-xs text-gray-500 dark:text-gray-400"
                    >
                      {{ answerALabel }}
                    </span>
                  </div>
                  <div
                    class="qa-answer-markdown answer-reveal-ltr text-sm text-gray-800 dark:text-gray-200 prose prose-sm dark:prose-invert max-w-none"
                    style="--answer-reveal-delay: 40ms"
                    v-html="renderMarkdown(primaryAnswer.answer)"
                  />
                </div>

                <div
                  v-if="(!selectedPreferredAnswer || selectedPreferredAnswer === 'b') && secondaryAnswer"
                  :class="[
                    'chat-flow-bubble chat-flow-bubble-assistant p-5 rounded-2xl transition-all duration-200',
                    selectedPreferredAnswer === 'b'
                      ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900'
                      : feedbackSubmitting
                        ? 'opacity-70 pointer-events-none'
                        : 'cursor-pointer hover:ring-2 hover:ring-brandp-300 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-brandp-600 dark:hover:ring-offset-zinc-900'
                  ]"
                  role="button"
                  tabindex="0"
                  :aria-pressed="selectedPreferredAnswer === 'b'"
                  @click="submitDualAnswerFeedback('b')"
                  @keydown.enter.prevent="submitDualAnswerFeedback('b')"
                  @keydown.space.prevent="submitDualAnswerFeedback('b')"
                >
                  <div class="flex items-center justify-between gap-2 mb-3">
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white">{{ selectedPreferredAnswer ? 'Answer' : 'Answer B' }}</h4>
                    <span
                      v-if="!selectedPreferredAnswer"
                      class="text-xs text-gray-500 dark:text-gray-400"
                    >
                      {{ answerBLabel }}
                    </span>
                  </div>
                  <div
                    class="qa-answer-markdown answer-reveal-ltr text-sm text-gray-800 dark:text-gray-200 prose prose-sm dark:prose-invert max-w-none"
                    style="--answer-reveal-delay: 120ms"
                    v-html="renderMarkdown(secondaryAnswer.answer)"
                  />
                </div>
              </div>
            </div>

            <div
              v-else
              class="chat-flow-bubble chat-flow-bubble-assistant"
            >
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Answer</h4>
                <span class="text-xs text-gray-500 dark:text-gray-400">Confidence: {{ primaryAnswer.confidence || 'n/a' }}</span>
              </div>
              <div
                class="qa-answer-markdown answer-reveal-ltr text-sm text-gray-800 dark:text-gray-200 prose prose-sm dark:prose-invert max-w-none"
                style="--answer-reveal-delay: 40ms"
                v-html="renderMarkdown(primaryAnswer.answer)"
              />

              <div
                v-if="singleAnswerFeedbackEnabled"
                class="mt-4 flex items-center gap-2"
              >
                <span class="text-xs text-gray-500 dark:text-gray-400">Was this helpful?</span>
                <template v-if="!singleAnswerFeedbackSubmitted">
                  <button
                    :disabled="feedbackSubmitting"
                    class="px-3 py-1.5 text-xs rounded-full border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-200 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-300 transition-colors disabled:opacity-50"
                    @click="submitSingleAnswerFeedback(true)"
                  >
                    Yes
                  </button>
                  <button
                    :disabled="feedbackSubmitting"
                    class="px-3 py-1.5 text-xs rounded-full border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-200 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-300 transition-colors disabled:opacity-50"
                    @click="submitSingleAnswerFeedback(false)"
                  >
                    No
                  </button>
                </template>
                <template v-else>
                  <UIcon
                    name="i-lucide-check"
                    class="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                  />
                  <span
                    class="text-xs font-medium text-emerald-700 dark:text-emerald-300"
                  >
                    Feedback saved
                  </span>
                </template>
              </div>
            </div>

            <div
              v-if="qaResult.follow_up_suggestions?.length"
              class="chat-flow-bubble chat-flow-bubble-muted"
            >
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Follow-up suggestions</h4>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="suggestion in qaResult.follow_up_suggestions"
                  :key="suggestion"
                  type="button"
                  class="px-3 py-1.5 text-xs rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-brand-100 dark:hover:bg-brand-900/40 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                  @click="askScholarQA(suggestion)"
                >
                  {{ suggestion }}
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section
        id="popular-articles"
        class="mb-16 scroll-fade-in"
        style="--delay: 0.25s"
      >
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <h2 class="text-3xl font-serif font-semibold text-gray-900 dark:text-white">
              Popular Articles
            </h2>
            <NuxtLink
              to="/foodscholar/catalog"
              class="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-600 bg-transparent hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300 font-medium transition-colors"
            >
              <span>Browse full catalog</span>
              <UIcon
                name="i-lucide-arrow-right"
                class="w-4 h-4"
              />
            </NuxtLink>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <button
              v-for="category in categories"
              :key="category"
              :class="[
                'px-6 py-2 rounded-full font-medium transition-all duration-300',
                selectedCategory === category
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
              ]"
              @click="selectCategory(category)"
            >
              {{ category }}
            </button>
          </div>
        </div>

        <div
          v-if="articlesLoading"
          class="text-center py-12"
        >
          <div class="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Loading popular articles...
          </p>
        </div>

        <div
          v-else-if="articlesError"
          class="p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 mb-4"
        >
          <p class="text-sm text-red-700 dark:text-red-300">
            {{ articlesError }}
          </p>
        </div>

        <div
          v-else-if="filteredArticles.length"
          class="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <FoodscholarArticleCard
            v-for="(article, index) in filteredArticles"
            :key="article.urn"
            :article="article"
            :index="index"
          />
        </div>

        <div
          v-else
          class="text-center py-12 border border-gray-200 dark:border-zinc-700 rounded-2xl bg-white dark:bg-zinc-900/40"
        >
          <p class="text-gray-600 dark:text-gray-400">
            No articles match the selected filters.
          </p>
        </div>
      </section>

      <section
        class="scroll-fade-in bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20 border border-brand-200 dark:border-brand-800 rounded-3xl p-8 sm:p-12 mb-12"
        style="--delay: 0.3s"
      >
        <h2 class="text-3xl font-serif font-semibold mb-8 text-gray-900 dark:text-white">
          Popular Topics
        </h2>
        <div
          v-if="popularTopics.length"
          class="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div
            v-for="topic in popularTopics"
            :key="topic.title"
            class="text-left p-6 rounded-2xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-gray-200 dark:border-zinc-700"
          >
            <div class="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center mb-4">
              <UIcon
                :name="topic.icon"
                class="w-6 h-6 text-brand-600 dark:text-brand-400"
              />
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
              {{ topic.title }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 font-light">
              {{ topic.description }}
            </p>
          </div>
        </div>
        <p
          v-else
          class="text-sm text-gray-600 dark:text-gray-300"
        >
          Topics will appear as article metadata is indexed.
        </p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import articlesApi, { type Article } from '~/services/articlesApi'
import foodscholarApi, {
  type QaAskRequest,
  type QaAskResult,
  type QaAnswer
} from '~/services/foodscholarApi'
import { useAuthStore } from '~/stores/auth'
import { useHouseholdStore } from '~/stores/household'
import { calculateReadTime, getExcerpt } from '~/utils/articleHelpers'

definePageMeta({
  middleware: ['auth', 'profile']
})

useHead({
  title: 'FoodScholar'
})

useSeoMeta({
  description: 'Educational content and nutritional insights about sustainable eating'
})

interface HomeArticle {
  id: number
  urn: string
  title: string
  category: string
  ai_category?: string | null
  excerpt: string
  readTime: number
  authors?: string[]
  tags?: string[]
  ai_tags?: string[]
  venue?: string | null
  publication_year?: string | null
}

interface AnnotatedFacet {
  value: string
  count: number
  field: string
}

interface TopicCard {
  title: string
  description: string
  icon: string
  query: string
}

interface ModelOption {
  value: string
  label: string
  provider: string
  icon: string
}

interface TopKOption {
  value: number
  label: string
  description: string
  icon: string
}

interface ExpertiseOption {
  value: string
  label: string
  description: string
  icon: string
}

const AUTO_MODEL_VALUE = '__auto__'

const qaHeadings = [
  'What would you like to know?',
  'Ask anything about food & nutrition',
  'Your nutrition research companion'
]
const qaHeading = qaHeadings[Math.floor(Math.random() * qaHeadings.length)]

const authStore = useAuthStore()
const householdStore = useHouseholdStore()

const selectedCategory = ref('All')
const articlesLoading = ref(false)
const articlesError = ref<string | null>(null)
const allArticles = ref<HomeArticle[]>([])
const facets = ref<Record<string, Array<{ value: string, count: number }>>>({})

const chatQuery = ref('')
const composerFocused = ref(false)
const asking = ref(false)
const qaError = ref<string | null>(null)
const qaResult = ref<QaAskResult | null>(null)
const qaMode = ref<'simple' | 'advanced'>('simple')
const ragEnabled = ref(true)
const qaModels = ref<string[]>([])
const selectedModel = ref('')
const modelsLoading = ref(false)
const topK = ref(5)
const expertiseLevel = ref('intermediate')
const feedbackSubmitting = ref(false)
const selectedPreferredAnswer = ref<'a' | 'b' | null>(null)
const singleAnswerFeedbackSubmitted = ref(false)

const quickQuestions = [
  'What is omega-3 and why is it important?',
  'What are examples of fermented foods?',
  'How can I reduce food waste at home?',
  'Which foods are high in vitamin D?'
]

const topKOptions: TopKOption[] = [
  { value: 3, label: 'Focused (3)', description: 'Fast answer using the most relevant sources only.', icon: 'i-lucide-zap' },
  { value: 5, label: 'Balanced (5)', description: 'Good balance of depth, speed, and citation variety.', icon: 'i-lucide-scale' },
  { value: 8, label: 'Deep (8)', description: 'More evidence coverage for nuanced or broad questions.', icon: 'i-lucide-layers' },
  { value: 12, label: 'Comprehensive (12)', description: 'Maximum context with slower, heavier retrieval.', icon: 'i-lucide-book-open' }
]

const expertiseOptions: ExpertiseOption[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'Simple language with practical explanations.',
    icon: 'i-lucide-smile'
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Balanced detail and terminology.',
    icon: 'i-lucide-graduation-cap'
  },
  {
    value: 'expert',
    label: 'Expert',
    description: 'Technical depth with research-oriented framing.',
    icon: 'i-lucide-flask-conical'
  }
]

const categories = computed(() => {
  const humanCategories = (facets.value.category || []).map(item => item.value)
  const aiCategories = (facets.value.ai_category || []).map(item => item.value)
  const merged = [...new Set([...humanCategories, ...aiCategories])].filter(Boolean)

  if (!merged.length) {
    const fallback = [...new Set(allArticles.value.map(article => article.category).filter(Boolean))]
    return ['All', ...fallback]
  }

  return ['All', ...merged]
})

const tagFacets = computed((): AnnotatedFacet[] => {
  const humanTags = (facets.value.tags || []).map(item => ({
    value: item.value,
    count: item.count,
    field: 'tags'
  }))

  const aiTags = (facets.value.ai_tags || []).map(item => ({
    value: item.value,
    count: item.count,
    field: 'ai_tags'
  }))

  const merged = new Map<string, AnnotatedFacet>()

  humanTags.forEach(tag => merged.set(tag.value, tag))
  aiTags.forEach((tag) => {
    if (!merged.has(tag.value)) {
      merged.set(tag.value, tag)
      return
    }
    const existing = merged.get(tag.value)!
    existing.count += tag.count
  })

  return Array.from(merged.values()).sort((a, b) => b.count - a.count)
})

const popularTopics = computed<TopicCard[]>(() => {
  const iconSet = ['i-lucide-flask-conical', 'i-lucide-leaf', 'i-lucide-heart', 'i-lucide-apple', 'i-lucide-scale']
  return tagFacets.value.slice(0, 6).map((tag, index) => ({
    title: toTitleCase(tag.value),
    description: `Explore research and evidence around ${tag.value}.`,
    icon: iconSet[index % iconSet.length],
    query: tag.value
  }))
})

const filteredArticles = computed(() => {
  return allArticles.value.slice(0, 8)
})

const selectCategory = async (category: string) => {
  selectedCategory.value = category
  if (category === 'All') {
    await loadPopularArticles()
  } else {
    await loadArticlesForCategory(category)
  }
}

const loadArticlesForCategory = async (category: string) => {
  articlesLoading.value = true
  articlesError.value = null

  try {
    const response = await articlesApi.searchArticles({
      q: null,
      limit: 24,
      offset: 0,
      sort: 'created_at desc',
      fl: ['id', 'urn', 'title', 'abstract', 'description', 'content', 'authors', 'tags', 'ai_tags', 'venue', 'publication_year', 'category', 'ai_category'],
      fq: [`(category:"${category}" OR ai_category:"${category}")`],
      fields: []
    })

    const results = response.result.results || []
    allArticles.value = results.map(mapArticleToHome)
  } catch (err: unknown) {
    articlesError.value = getErrorMessage(err, 'Failed to load articles.')
  } finally {
    articlesLoading.value = false
  }
}

const primaryAnswer = computed<QaAnswer | null>(() => qaResult.value?.primary_answer || null)
const secondaryAnswer = computed<QaAnswer | null>(() => qaResult.value?.secondary_answer || null)
const hasDualAnswerMode = computed(() => Boolean(primaryAnswer.value && secondaryAnswer.value && qaResult.value?.dual_answer_feedback))
const isAdvancedMode = computed(() => qaMode.value === 'advanced')
const ragUsedForResponse = computed(() => primaryAnswer.value?.rag_used ?? ragEnabled.value)
const qaPlaceholder = computed(() => {
  if (isAdvancedMode.value) {
    return 'Ask anything about food & nutrition (advanced controls enabled)'
  }
  return 'What would you like to know about food & nutrition?'
})

const answerALabel = computed(() => qaResult.value?.dual_answer_feedback?.answer_a_label || 'Primary model response')
const answerBLabel = computed(() => qaResult.value?.dual_answer_feedback?.answer_b_label || 'Alternative model response')

const feedbackRequestId = computed(() => {
  return qaResult.value?.dual_answer_feedback?.request_id || qaResult.value?.request_id || ''
})

const singleAnswerFeedbackEnabled = computed(() => {
  return Boolean(primaryAnswer.value && !hasDualAnswerMode.value && feedbackRequestId.value)
})

const modelOptions = ref<ModelOption[]>([
  {
    value: AUTO_MODEL_VALUE,
    label: 'Auto (recommended)',
    provider: 'System',
    icon: 'i-lucide-sparkles'
  }
])

const selectedModelOption = computed<ModelOption>(() => {
  return modelOptions.value.find(option => option.value === selectedModelValue.value) || modelOptions.value[0]
})

const selectedTopKOption = computed<TopKOption>(() => {
  return topKOptions.find(option => option.value === Number(topK.value)) || topKOptions[1]
})

const selectedExpertiseOption = computed<ExpertiseOption>(() => {
  return expertiseOptions.find(option => option.value === expertiseLevel.value) || expertiseOptions[1]
})

const selectedModelValue = computed<string>({
  get: () => selectedModel.value || AUTO_MODEL_VALUE,
  set: (value) => {
    selectedModel.value = value === AUTO_MODEL_VALUE ? '' : value
  }
})

const selectedTopKValue = computed<number>({
  get: () => selectedTopKOption.value.value,
  set: (value) => {
    const parsed = Number(value)
    topK.value = topKOptions.some(option => option.value === parsed)
      ? parsed
      : topKOptions[1].value
  }
})

const selectedExpertiseValue = computed<string>({
  get: () => selectedExpertiseOption.value.value,
  set: (value) => {
    expertiseLevel.value = expertiseOptions.some(option => option.value === value)
      ? value
      : expertiseOptions[1].value
  }
})

const loadPopularArticles = async () => {
  articlesLoading.value = true
  articlesError.value = null

  try {
    const response = await articlesApi.searchArticles({
      q: null,
      limit: 24,
      offset: 0,
      sort: 'created_at desc',
      fl: ['id', 'urn', 'title', 'abstract', 'description', 'content', 'authors', 'tags', 'ai_tags', 'venue', 'publication_year', 'category', 'ai_category'],
      fields: ['category', 'ai_category', 'tags', 'ai_tags']
    })

    const results = response.result.results || []

    allArticles.value = results.map(mapArticleToHome)
    facets.value = (response.result.facets || {}) as Record<string, Array<{ value: string, count: number }>>
  } catch (err: unknown) {
    articlesError.value = getErrorMessage(err, 'Failed to load popular articles.')
  } finally {
    articlesLoading.value = false
  }
}

const loadQaModels = async () => {
  modelsLoading.value = true

  try {
    const result = await foodscholarApi.listModels()
    const models = normalizeModelList(result)
    qaModels.value = models
  } catch (err) {
    console.warn('Failed to fetch QA models', err)
    qaModels.value = []
  } finally {
    modelsLoading.value = false
  }
}

const askScholarQA = async (questionOverride?: string) => {
  const question = (questionOverride ?? chatQuery.value).trim()
  if (!question || asking.value) return

  if (questionOverride) {
    chatQuery.value = question
  }

  asking.value = true
  qaResult.value = null
  qaError.value = null
  selectedPreferredAnswer.value = null
  singleAnswerFeedbackSubmitted.value = false

  try {
    const payload: QaAskRequest = {
      question,
      mode: qaMode.value,
      rag_enabled: ragEnabled.value,
      language: 'en'
    }

    if (isAdvancedMode.value) {
      payload.expertise_level = expertiseLevel.value || 'intermediate'
      if (ragEnabled.value) {
        payload.top_k = selectedTopKOption.value.value
      }
    } else {
      payload.expertise_level = 'intermediate'
      if (ragEnabled.value) {
        payload.top_k = 5
      }
    }

    if (isAdvancedMode.value && selectedModel.value) {
      payload.model = selectedModel.value
    }

    if (authStore.currentUser?.id) {
      payload.user_id = authStore.currentUser.id
    }

    if (householdStore.currentMember?.id) {
      payload.member_id = householdStore.currentMember.id
    }

    qaResult.value = await foodscholarApi.askQuestion(payload)
  } catch (err: unknown) {
    qaError.value = getErrorMessage(err, 'Failed to get a QA response from FoodScholar.')
  } finally {
    asking.value = false
    chatQuery.value = ''
  }
}

const submitDualAnswerFeedback = async (preferredAnswer: 'a' | 'b') => {
  if (!feedbackRequestId.value || feedbackSubmitting.value || selectedPreferredAnswer.value === preferredAnswer) return

  feedbackSubmitting.value = true
  const previousSelection = selectedPreferredAnswer.value
  selectedPreferredAnswer.value = preferredAnswer

  try {
    await foodscholarApi.submitFeedback({
      request_id: feedbackRequestId.value,
      preferred_answer: preferredAnswer,
      helpfulness: 'helpful',
      target_answer: 'overall',
      reason: `User preferred answer ${preferredAnswer.toUpperCase()} in dual-answer mode.`
    })
  } catch (err: unknown) {
    selectedPreferredAnswer.value = previousSelection
    qaError.value = getErrorMessage(err, 'Failed to submit feedback.')
  } finally {
    feedbackSubmitting.value = false
  }
}

const submitSingleAnswerFeedback = async (helpful: boolean) => {
  if (!feedbackRequestId.value || feedbackSubmitting.value) return

  feedbackSubmitting.value = true

  try {
    await foodscholarApi.submitFeedback({
      request_id: feedbackRequestId.value,
      preferred_answer: 'a',
      helpfulness: helpful ? 'helpful' : 'not_helpful',
      target_answer: 'overall',
      reason: helpful ? 'User marked single answer as helpful.' : 'User marked single answer as not helpful.'
    })

    singleAnswerFeedbackSubmitted.value = true
  } catch (err: unknown) {
    qaError.value = getErrorMessage(err, 'Failed to submit feedback.')
  } finally {
    feedbackSubmitting.value = false
  }
}

const askQuickQuestion = (question: string) => {
  chatQuery.value = question
  askScholarQA(question)
}

const normalizeModelList = (result: string[] | Record<string, unknown>): string[] => {
  const models = new Set<string>()

  const collectStringArrays = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === 'string' && item.trim()) {
          models.add(item.trim())
          return
        }

        if (item && typeof item === 'object') {
          collectStringArrays(item)
        }
      })
      return
    }

    if (value && typeof value === 'object') {
      Object.values(value).forEach(entry => collectStringArrays(entry))
    }
  }

  collectStringArrays(result)
  return Array.from(models)
}

const inferModelProvider = (model: string): string => {
  const normalized = model.toLowerCase()

  if (normalized.includes('openai') || normalized.includes('gpt-') || normalized.includes('o1') || normalized.includes('o3')) return 'openai'
  if (normalized.includes('anthropic') || normalized.includes('claude')) return 'anthropic'
  if (normalized.includes('google') || normalized.includes('gemini')) return 'google'
  if (normalized.includes('meta') || normalized.includes('llama')) return 'meta'
  if (normalized.includes('mistral')) return 'mistral'
  if (normalized.includes('cohere') || normalized.includes('command-r')) return 'cohere'
  if (normalized.includes('azure') || normalized.includes('microsoft')) return 'microsoft'
  if (normalized.includes('xai') || normalized.includes('grok')) return 'xai'
  if (normalized.includes('perplexity') || normalized.includes('sonar')) return 'perplexity'
  if (normalized.includes('groq')) return 'groq'
  if (normalized.includes('deepseek')) return 'deepseek'
  if (normalized.includes('ollama')) return 'ollama'

  return 'unknown'
}

const providerLabel = (provider: string): string => {
  const labels: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    meta: 'Meta',
    mistral: 'Mistral',
    cohere: 'Cohere',
    microsoft: 'Microsoft',
    xai: 'xAI',
    perplexity: 'Perplexity',
    groq: 'Groq',
    deepseek: 'DeepSeek',
    ollama: 'Ollama',
    unknown: 'Custom'
  }

  return labels[provider] || labels.unknown
}

const providerIcon = (provider: string): string => {
  const icons: Record<string, string> = {
    openai: 'i-simple-icons-openai',
    anthropic: 'i-simple-icons-anthropic',
    google: 'i-simple-icons-google',
    meta: 'i-simple-icons-meta',
    mistral: 'i-simple-icons-mistralai',
    cohere: 'i-simple-icons-cohere',
    microsoft: 'i-simple-icons-microsoftazure',
    xai: 'i-simple-icons-x',
    perplexity: 'i-simple-icons-perplexity',
    groq: 'i-simple-icons-groq',
    deepseek: 'i-simple-icons-deepseek',
    ollama: 'i-simple-icons-ollama',
    unknown: 'i-lucide-cpu'
  }

  return icons[provider] || icons.unknown
}

const formatModelLabel = (model: string, provider: string): string => {
  const normalized = model.replace(/^models\//i, '').trim()
  const separators = ['/', ':']

  for (const separator of separators) {
    if (!normalized.includes(separator)) continue

    const [head, ...tail] = normalized.split(separator)
    if (!tail.length) break

    const normalizedHead = head.toLowerCase()
    if (normalizedHead.includes(provider) || inferModelProvider(head) === provider) {
      return tail.join(separator)
    }
  }

  return normalized
}

const mapArticleToHome = (article: Article): HomeArticle => {
  return {
    id: article.id,
    urn: article.urn,
    title: article.title,
    category: article.category || article.ai_category || 'Uncategorized',
    ai_category: article.ai_category,
    excerpt: getExcerpt(article, 220),
    readTime: calculateReadTime(article.abstract || article.description || article.content || ''),
    authors: article.authors || [],
    tags: article.tags || [],
    ai_tags: article.ai_tags || [],
    venue: article.venue,
    publication_year: article.publication_year
  }
}

const renderMarkdown = (text: string): string => {
  if (!text) return ''

  const base = useRuntimeConfig().app.baseURL?.replace(/\/$/, '') || ''
  const normalizedText = text
    .replace(/\]\(\/articles\/(urn:article:[^)]+)\)/g, `](${base}/foodscholar/$1)`)
    .replace(/\]\(\/foodscholar\/(urn:article:[^)]+)\)/g, `](${base}/foodscholar/$1)`)

  const rawHtml = marked(normalizedText, {
    breaks: true,
    gfm: true
  }) as string

  return DOMPurify.sanitize(rawHtml)
}

const formatDateTime = (dateTime?: string): string => {
  if (!dateTime) return 'just now'

  const parsed = new Date(dateTime)
  if (Number.isNaN(parsed.getTime())) return 'just now'

  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const toTitleCase = (value: string): string => {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase())
}

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (typeof err === 'string') return err

  if (err && typeof err === 'object') {
    if ('message' in err && typeof err.message === 'string') {
      return err.message
    }

    if ('data' in err && err.data && typeof err.data === 'object' && 'detail' in err.data) {
      return String(err.data.detail)
    }
  }

  return fallback
}

watch(categories, (newCategories) => {
  if (newCategories.length > 0 && !newCategories.includes(selectedCategory.value)) {
    selectedCategory.value = 'All'
  }
})

watch(qaModels, (models) => {
  const mappedOptions = models.map((model) => {
    const providerKey = inferModelProvider(model)

    return {
      value: model,
      label: `${formatModelLabel(model, providerKey)} (${providerLabel(providerKey)})`,
      provider: providerLabel(providerKey),
      icon: providerIcon(providerKey)
    }
  })

  modelOptions.value = [
    {
      value: AUTO_MODEL_VALUE,
      label: 'Auto (recommended)',
      provider: 'System',
      icon: 'i-lucide-sparkles'
    },
    ...mappedOptions
  ]

  if (selectedModel.value && !models.includes(selectedModel.value)) {
    selectedModel.value = ''
  }
}, { immediate: true })

let observer: IntersectionObserver | null = null

const setupObserver = () => {
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

  document.querySelectorAll('.scroll-fade-in').forEach((el) => {
    observer?.observe(el)
  })
}

onMounted(async () => {
  await Promise.all([
    loadPopularArticles(),
    loadQaModels()
  ])

  setupObserver()
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}


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

.chat-composer {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  padding: 0.45rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease, background 0.3s ease;
}

.dark .chat-composer {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(24, 24, 27, 0.6);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.chat-composer.is-focused {
  transform: translateY(-1px);
  border-color: var(--color-brandp-300);
  background: rgba(255, 255, 255, 0.85);
  box-shadow:
    0 0 0 3px var(--color-brandp-400 / 0.12),
    0 8px 24px rgba(0, 0, 0, 0.06);
}

.dark .chat-composer.is-focused {
  border-color: var(--color-brandp-400);
  background: rgba(24, 24, 27, 0.75);
  box-shadow:
    0 0 0 3px var(--color-brandp-400 / 0.18),
    0 8px 24px rgba(0, 0, 0, 0.3);
}

.chat-composer-accent {
  pointer-events: none;
  position: absolute;
  width: 8rem;
  height: 8rem;
  border-radius: 9999px;
  filter: blur(28px);
  opacity: 0.26;
  transition: opacity 0.25s ease;
}

.chat-composer.is-focused .chat-composer-accent {
  opacity: 0.42;
}

.chat-composer-accent-left {
  top: -3.5rem;
  left: -2rem;
  background: var(--color-brand-400 / 0.26);
}

.chat-composer-accent-right {
  bottom: -4rem;
  right: -2.2rem;
  background: var(--color-brand-600 / 0.2);
}

.chat-send-button {
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.chat-send-button:hover:not(:disabled) {
  transform: translateY(-1px) scale(1.03);
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.28);
  filter: saturate(1.1);
}

.chat-send-idle {
  animation: send-pulse 1.8s ease-in-out infinite;
}

.answer-reveal-ltr {
  opacity: 0;
  transform: translateX(-12px);
  clip-path: inset(0 100% 0 0);
  animation: answer-reveal-ltr 640ms ease-out forwards;
  animation-delay: var(--answer-reveal-delay, 0ms);
}

:deep([data-slot='base']) {
  cursor: pointer;
}

:deep([data-slot='content'] [data-slot='item']) {
  cursor: pointer;
}

:deep(.qa-answer-markdown a[href*="/foodscholar/urn:"]) {
  color: rgb(156 163 175);
  text-decoration: none;
  font-weight: 500;
}

:deep(.qa-answer-markdown a[href*="/foodscholar/urn:"]:hover) {
  color: rgb(107 114 128);
  text-decoration: underline;
}

:deep(.dark .qa-answer-markdown a[href*="/foodscholar/urn:"]) {
  color: rgb(161 161 170);
}

:deep(.dark .qa-answer-markdown a[href*="/foodscholar/urn:"]:hover) {
  color: rgb(212 212 216);
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

@keyframes send-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.25);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(37, 99, 235, 0);
  }
}
</style>
