<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <AppPageHeader
      back-to="/dashboard"
      :back-label="t('foodScholarHome.backToDashboard')"
      brand-title="FoodScholar"
      brand-class="text-brand-500 dark:text-brand-400"
      :subtitle="t('foodScholarHome.subtitle')"
    />

    <!-- Page tab switcher -->
    <div class="border-b border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 flex justify-center">
        <div class="flex gap-0">
          <button
            type="button"
            :class="[
              'px-5 py-3 text-sm font-medium border-b-2 transition-colors',
              pageTab === 'qa'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            ]"
            @click="pageTab = 'qa'"
          >
            <span class="flex items-center gap-1.5">
              <UIcon name="i-lucide-sparkles" class="w-3.5 h-3.5" />
              Ask Questions
            </span>
          </button>
          <button
            type="button"
            :class="[
              'px-5 py-3 text-sm font-medium border-b-2 transition-colors',
              pageTab === 'resources'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            ]"
            @click="pageTab = 'resources'"
          >
            <span class="flex items-center gap-1.5">
              <UIcon name="i-lucide-library" class="w-3.5 h-3.5" />
              Library
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- QA tab -->
    <template v-if="pageTab === 'qa'">
      <!-- Idle state: composer centered vertically in remaining viewport -->
      <div
        v-if="!hasActiveSession"
        class="qa-idle-shell flex-1 flex flex-col items-center justify-center px-4 pt-4 pb-48"
      >
        <div class="w-full max-w-2xl">
          <div class="mb-8 text-center">
            <h2 class="text-3xl font-claude text-gray-900 dark:text-white mb-2 inline-flex items-center justify-center gap-2 flex-wrap">
              <img src="/fig.png" alt="" aria-hidden="true" class="inline-block h-[1.2em] w-auto align-[-0.05em] select-none" draggable="false" />
              <span>{{ qaHeading }}</span>
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('foodScholarHome.qa.tagline') }}
            </p>
          </div>

          <div class="relative">
            <div class="chat-composer" :class="{ 'is-focused': composerFocused }">
              <FoodscholarNLInput
                v-model="chatQuery"
                :disabled="asking"
                :placeholder="qaPlaceholder"
                input-class="w-full h-12 pl-11 pr-28 rounded-xl bg-transparent text-[15px] text-gray-900 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-zinc-400 focus:outline-none transition-all duration-200"
                @enter="askScholarQA"
                @focus="composerFocused = true"
                @blur="composerFocused = false"
              >
                <template #left>
                  <UIcon name="i-lucide-search" class="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </template>
                <template #right>
                  <div class="flex items-center gap-2">
                    <UDropdownMenu
                      :items="chatSettingsItems"
                      :content="chatSettingsContent"
                      :ui="chatSettingsUi"
                    >
                      <button
                        type="button"
                        class="chat-settings-button h-10 w-10 flex items-center justify-center rounded-xl border border-gray-200/80 dark:border-zinc-700/80 bg-white/80 dark:bg-zinc-900/80 text-gray-600 dark:text-zinc-300 shadow-sm transition-colors hover:text-brand-600 dark:hover:text-brand-400"
                        :class="{ 'is-active': isAdvancedMode }"
                        :aria-label="t('foodScholarHome.qa.advanced.title')"
                        :title="t('foodScholarHome.qa.advanced.title')"
                      >
                        <UIcon name="i-lucide-sliders-horizontal" class="w-4 h-4" />
                      </button>
                    </UDropdownMenu>
                    <button
                      :disabled="asking"
                      class="chat-send-button h-10 w-10 flex items-center justify-center rounded-xl bg-brand-500 text-white disabled:opacity-50 shadow-md shadow-brand-700/20"
                      :class="{ 'chat-send-idle': !asking }"
                      @click="askScholarQA()"
                    >
                      <UIcon name="i-lucide-arrow-up" class="w-4 h-4 text-white" />
                    </button>
                  </div>
                </template>
              </FoodscholarNLInput>
            </div>
            <div class="mt-2 px-1 flex items-center justify-between">
              <p class="text-[11px] text-gray-500 dark:text-gray-400">
                {{ composerFocused ? t('foodScholarHome.qa.composer.focusedHint') : t('foodScholarHome.qa.composer.idleHint') }}
              </p>
              <span class="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {{ t('foodScholarHome.qa.composer.enterKey') }}
              </span>
            </div>
          </div>

          <!-- Advanced panel -->
          <Transition name="qa-advanced-panel">
            <div
              v-if="isAdvancedMode"
              class="qa-advanced-panel mt-4 rounded-2xl border border-gray-200/80 dark:border-zinc-700/80 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-sm p-4"
            >
              <div class="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ t('foodScholarHome.qa.advanced.title') }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ selectedRetrievalOption.description }}</p>
                </div>
                <div
                  class="inline-flex flex-wrap items-center justify-end rounded-full border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 p-1 shadow-sm"
                  :aria-label="t('foodScholarHome.qa.advanced.retrievalMode')"
                >
                  <button
                    v-for="option in retrievalOptions"
                    :key="option.value"
                    type="button"
                    :class="['inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors', retrievalButtonClass(option.value)]"
                    :title="option.description"
                    @click="retrievalMode = option.value"
                  >
                    <UIcon :name="option.icon" class="h-3.5 w-3.5" />
                    <span>{{ option.label }}</span>
                  </button>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="space-y-2">
                  <label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">{{ t('foodScholarHome.qa.advanced.model') }}</label>
                  <USelectMenu v-model="selectedModelValue" :items="modelOptions" class="w-full" size="lg" :ui="advancedSelectUi" :content="advancedSelectContent" value-key="value" label-key="label" :search-input="false" :placeholder="t('foodScholarHome.qa.model.auto')" :disabled="modelsLoading || asking">
                    <template #leading><UIcon :name="selectedModelOption.icon" class="w-4 h-4 text-gray-500 dark:text-gray-400" /></template>
                  </USelectMenu>
                  <p v-if="!modelsLoading && modelOptions.length <= 1" class="mt-2 text-[11px] text-amber-700 dark:text-amber-300">{{ t('foodScholarHome.qa.model.noProviderModels') }}</p>
                  <p v-else class="mt-2 text-[11px] text-gray-500 dark:text-gray-400">{{ t('foodScholarHome.qa.model.autoHint') }}</p>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">{{ t('foodScholarHome.qa.advanced.sourceDepth') }}</label>
                  <USelectMenu v-model="selectedTopKValue" :items="topKOptions" class="w-full" size="lg" :ui="advancedSelectUi" :content="advancedSelectContent" value-key="value" label-key="label" :search-input="false" :disabled="asking || !ragEnabled">
                    <template #leading><UIcon :name="selectedTopKOption.icon" class="w-4 h-4 text-gray-500 dark:text-gray-400" /></template>
                  </USelectMenu>
                  <p class="mt-2 text-[11px] text-gray-500 dark:text-gray-400">{{ ragEnabled ? selectedTopKOption.description : t('foodScholarHome.qa.advanced.enableRetrievalToAdjust') }}</p>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">{{ t('foodScholarHome.qa.advanced.explanationStyle') }}</label>
                  <USelectMenu v-model="selectedExpertiseValue" :items="expertiseOptions" class="w-full" size="lg" :ui="advancedSelectUi" :content="advancedSelectContent" value-key="value" label-key="label" :search-input="false" :disabled="asking">
                    <template #leading><UIcon :name="selectedExpertiseOption.icon" class="w-4 h-4 text-gray-500 dark:text-gray-400" /></template>
                  </USelectMenu>
                  <p class="mt-2 text-[11px] text-gray-500 dark:text-gray-400">{{ selectedExpertiseOption.description }}</p>
                </div>
              </div>
            </div>
          </Transition>

          <div
            v-if="quickQuestions.length"
            class="mt-4 flex flex-wrap gap-2"
          >
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
        </div>
      </div>

      <!-- Active session: centered answer + sidebar -->
      <div v-else class="flex-1 w-full px-4 py-6">
        <div ref="qaSessionGridRef" class="qa-session-layout relative max-w-7xl mx-auto">
          <!-- SVG overlay for citation hover lines -->
          <svg ref="citationSvgRef" class="pointer-events-none absolute inset-0 w-full h-full z-20 hidden xl:block" style="overflow:visible" aria-hidden="true">
            <line
              v-if="citationLine"
              :key="`${citationLine.x1}-${citationLine.y1}-${citationLine.x2}-${citationLine.y2}`"
              :x1="citationLine.x1" :y1="citationLine.y1"
              :x2="citationLine.x2" :y2="citationLine.y2"
              stroke="#60a5fa"
              stroke-width="1.5"
              stroke-dasharray="5 4"
              opacity="0.7"
              class="citation-hover-line"
            />
          </svg>

        <!-- Center: composer + answer — same width as idle state -->
        <div class="flex flex-col min-w-0 w-full max-w-2xl mx-auto">
        <!-- Pinned composer -->
        <div class="session-composer-wrap mb-6">
          <div class="relative">
            <div class="chat-composer" :class="{ 'is-focused': composerFocused }">
              <FoodscholarNLInput
                v-model="chatQuery"
                :disabled="asking"
                :placeholder="qaPlaceholder"
                input-class="w-full h-12 pl-11 pr-28 rounded-xl bg-transparent text-[15px] text-gray-900 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-zinc-400 focus:outline-none transition-all duration-200"
                @enter="askScholarQA"
                @focus="composerFocused = true"
                @blur="composerFocused = false"
              >
                <template #left>
                  <UIcon name="i-lucide-search" class="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </template>
                <template #right>
                  <div class="flex items-center gap-2">
                    <UDropdownMenu
                      :items="chatSettingsItems"
                      :content="chatSettingsContent"
                      :ui="chatSettingsUi"
                    >
                      <button
                        type="button"
                        class="chat-settings-button h-10 w-10 flex items-center justify-center rounded-xl border border-gray-200/80 dark:border-zinc-700/80 bg-white/80 dark:bg-zinc-900/80 text-gray-600 dark:text-zinc-300 shadow-sm transition-colors hover:text-brand-600 dark:hover:text-brand-400"
                        :class="{ 'is-active': isAdvancedMode }"
                        :aria-label="t('foodScholarHome.qa.advanced.title')"
                        :title="t('foodScholarHome.qa.advanced.title')"
                      >
                        <UIcon name="i-lucide-sliders-horizontal" class="w-4 h-4" />
                      </button>
                    </UDropdownMenu>
                    <button
                      :disabled="asking"
                      class="chat-send-button h-10 w-10 flex items-center justify-center rounded-xl bg-brand-500 text-white disabled:opacity-50 shadow-md shadow-brand-700/20"
                      :class="{ 'chat-send-idle': !asking }"
                      @click="askScholarQA()"
                    >
                      <UIcon v-if="asking" name="i-lucide-loader-2" class="w-4 h-4 animate-spin text-white" />
                      <UIcon v-else name="i-lucide-arrow-up" class="w-4 h-4 text-white" />
                    </button>
                  </div>
                </template>
              </FoodscholarNLInput>
            </div>
            <div class="mt-2 px-1 flex items-center justify-between">
              <p class="text-[11px] text-gray-500 dark:text-gray-400">
                {{ composerFocused ? t('foodScholarHome.qa.composer.focusedHint') : t('foodScholarHome.qa.composer.idleHint') }}
              </p>
              <span class="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {{ t('foodScholarHome.qa.composer.enterKey') }}
              </span>
            </div>
          </div>

          <!-- Advanced panel in session -->
          <Transition name="qa-advanced-panel">
            <div
              v-if="isAdvancedMode"
              class="qa-advanced-panel mt-3 rounded-2xl border border-gray-200/80 dark:border-zinc-700/80 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-sm p-4"
            >
              <div class="flex items-start justify-between gap-3 mb-3">
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ t('foodScholarHome.qa.advanced.title') }}</p>
                <div
                  class="inline-flex flex-wrap items-center justify-end rounded-full border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 p-0.5 shadow-sm"
                  :aria-label="t('foodScholarHome.qa.advanced.retrievalMode')"
                >
                  <button
                    v-for="option in retrievalOptions"
                    :key="option.value"
                    type="button"
                    :class="['inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full transition-colors', retrievalButtonClass(option.value)]"
                    :title="option.description"
                    @click="retrievalMode = option.value"
                  >
                    <UIcon :name="option.icon" class="h-3 w-3" />
                    <span>{{ option.label }}</span>
                  </button>
                </div>
              </div>
              <div class="grid grid-cols-3 gap-3">
                <USelectMenu v-model="selectedModelValue" :items="modelOptions" size="sm" :ui="advancedSelectUi" :content="advancedSelectContent" value-key="value" label-key="label" :search-input="false" :placeholder="t('foodScholarHome.qa.model.auto')" :disabled="modelsLoading || asking">
                  <template #leading><UIcon :name="selectedModelOption.icon" class="w-3.5 h-3.5 text-gray-500" /></template>
                </USelectMenu>
                <USelectMenu v-model="selectedTopKValue" :items="topKOptions" size="sm" :ui="advancedSelectUi" :content="advancedSelectContent" value-key="value" label-key="label" :search-input="false" :disabled="asking || !ragEnabled">
                  <template #leading><UIcon :name="selectedTopKOption.icon" class="w-3.5 h-3.5 text-gray-500" /></template>
                </USelectMenu>
                <USelectMenu v-model="selectedExpertiseValue" :items="expertiseOptions" size="sm" :ui="advancedSelectUi" :content="advancedSelectContent" value-key="value" label-key="label" :search-input="false" :disabled="asking">
                  <template #leading><UIcon :name="selectedExpertiseOption.icon" class="w-3.5 h-3.5 text-gray-500" /></template>
                </USelectMenu>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Error -->
        <div v-if="qaError" class="mb-4 p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50/90 dark:bg-red-900/20">
          <p class="text-sm text-red-700 dark:text-red-300">{{ qaError }}</p>
        </div>

        <!-- Loading skeleton -->
        <div v-if="asking" class="space-y-4 session-answer-enter">
          <div class="flex justify-end">
            <div class="chat-flow-bubble chat-flow-bubble-user">
              <p class="text-[10px] uppercase tracking-widest font-semibold text-brand-200 mb-1">{{ t('foodScholarHome.qa.youAsked') }}</p>
              <p class="text-sm leading-relaxed">{{ pendingQuestion || chatQuery }}</p>
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

        <!-- Clarification panel -->
        <div v-if="pendingClarification && !asking" class="space-y-4 session-answer-enter">
          <div class="flex justify-end">
            <div class="chat-flow-bubble chat-flow-bubble-user">
              <p class="text-[10px] uppercase tracking-widest font-semibold text-brand-200 mb-1">{{ t('foodScholarHome.qa.youAsked') }}</p>
              <p class="text-sm leading-relaxed">{{ pendingQuestion }}</p>
            </div>
          </div>

          <div class="chat-flow-bubble chat-flow-bubble-assistant">
            <div class="flex items-start gap-2 mb-4">
              <UIcon name="i-lucide-help-circle" class="w-4 h-4 text-brand-500 dark:text-brand-400 mt-0.5 shrink-0" />
              <div>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ pendingClarification.question }}</p>
                <p v-if="pendingClarification.reason" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ pendingClarification.reason }}</p>
              </div>
            </div>

            <!-- single_choice / boolean -->
            <div
              v-if="pendingClarification.input_type === 'single_choice' || pendingClarification.input_type === 'boolean'"
              class="flex flex-wrap gap-2 mb-4"
            >
              <button
                v-for="opt in (pendingClarification.options ?? (pendingClarification.input_type === 'boolean' ? [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] : []))"
                :key="opt.value"
                type="button"
                :class="[
                  'px-3.5 py-1.5 text-sm rounded-full border transition-colors',
                  clarificationSelectedValues.includes(opt.value)
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-medium'
                    : 'border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-200 hover:border-brand-400 dark:hover:border-brand-600'
                ]"
                @click="clarificationSelectedValues = [opt.value]"
              >{{ opt.label }}</button>
            </div>

            <!-- multiple_choice -->
            <div v-else-if="pendingClarification.input_type === 'multiple_choice'" class="flex flex-wrap gap-2 mb-4">
              <button
                v-for="opt in (pendingClarification.options ?? [])"
                :key="opt.value"
                type="button"
                :class="[
                  'px-3.5 py-1.5 text-sm rounded-full border transition-colors',
                  clarificationSelectedValues.includes(opt.value)
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-medium'
                    : 'border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-200 hover:border-brand-400 dark:hover:border-brand-600'
                ]"
                @click="clarificationSelectedValues.includes(opt.value)
                  ? clarificationSelectedValues = clarificationSelectedValues.filter(v => v !== opt.value)
                  : clarificationSelectedValues.push(opt.value)"
              >{{ opt.label }}</button>
            </div>

            <!-- free_text / number -->
            <div v-else-if="pendingClarification.input_type === 'free_text' || pendingClarification.input_type === 'number'" class="mb-4">
              <input
                v-model="clarificationFreeText"
                :type="pendingClarification.input_type === 'number' ? 'number' : 'text'"
                class="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-500 dark:focus:border-brand-400"
                placeholder="Your answer…"
                @keydown.enter.prevent="submitClarification"
              />
            </div>

            <!-- allow_free_text addon for choice types -->
            <div
              v-if="(pendingClarification.input_type === 'single_choice' || pendingClarification.input_type === 'multiple_choice') && pendingClarification.allow_free_text"
              class="mb-4"
            >
              <input
                v-model="clarificationFreeText"
                type="text"
                class="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-500 dark:focus:border-brand-400"
                placeholder="Other (optional)…"
                @keydown.enter.prevent="submitClarification"
              />
            </div>

            <div class="flex items-center justify-end gap-2">
              <button
                type="button"
                class="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                @click="pendingClarification = null; qaError = null"
              >Skip</button>
              <button
                type="button"
                :disabled="clarificationSelectedValues.length === 0 && !clarificationFreeText.trim()"
                class="px-4 py-1.5 text-sm font-medium rounded-full bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                @click="submitClarification"
              >Continue</button>
            </div>
          </div>
        </div>

        <!-- Answer -->
        <div v-if="qaResult && primaryAnswer" class="space-y-4 session-answer-enter">
          <div class="flex justify-end">
            <div class="chat-flow-bubble chat-flow-bubble-user">
              <p class="text-[10px] uppercase tracking-widest font-semibold text-brand-200 mb-1">{{ t('foodScholarHome.qa.youAsked') }}</p>
              <p class="text-sm leading-relaxed">{{ qaResult.question }}</p>
            </div>
          </div>

          <div v-if="hasDualAnswerMode" class="space-y-3">
            <p v-if="!selectedPreferredAnswer" class="text-xs text-gray-500 dark:text-gray-400">{{ t('foodScholarHome.qa.feedback.choosePreferredAnswer') }}</p>
            <div v-else class="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <UIcon name="i-lucide-check" class="w-4 h-4" />
              {{ t('foodScholarHome.qa.feedback.preferenceSaved') }}
            </div>
            <div :class="['grid gap-3', selectedPreferredAnswer ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2']">
              <div
                v-if="!selectedPreferredAnswer || selectedPreferredAnswer === 'a'"
                :class="['chat-flow-bubble chat-flow-bubble-assistant p-5 rounded-2xl transition-all duration-200', selectedPreferredAnswer === 'a' ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900' : feedbackSubmitting ? 'opacity-70 pointer-events-none' : 'cursor-pointer hover:ring-2 hover:ring-brandp-300 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-brandp-600 dark:hover:ring-offset-zinc-900']"
                role="button" tabindex="0" :aria-pressed="selectedPreferredAnswer === 'a'"
                @click="submitDualAnswerFeedback('a')" @keydown.enter.prevent="submitDualAnswerFeedback('a')" @keydown.space.prevent="submitDualAnswerFeedback('a')"
              >
                <div class="flex items-center justify-between gap-2 mb-3">
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-white">{{ selectedPreferredAnswer ? t('foodScholarHome.qa.answer') : t('foodScholarHome.qa.answerA') }}</h4>
                  <span v-if="!selectedPreferredAnswer" class="text-xs text-gray-500 dark:text-gray-400">{{ answerALabel }}</span>
                </div>
                <div class="qa-answer-markdown answer-reveal-ltr text-sm text-gray-800 dark:text-gray-200 prose prose-sm dark:prose-invert max-w-none" @click="handleMarkdownClick" @mouseover="handleAnswerMouseOver" @mouseout="handleAnswerMouseOut" style="--answer-reveal-delay: 40ms" v-html="renderMarkdown(primaryAnswer.answer)" />
              </div>
              <div
                v-if="(!selectedPreferredAnswer || selectedPreferredAnswer === 'b') && secondaryAnswer"
                :class="['chat-flow-bubble chat-flow-bubble-assistant p-5 rounded-2xl transition-all duration-200', selectedPreferredAnswer === 'b' ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900' : feedbackSubmitting ? 'opacity-70 pointer-events-none' : 'cursor-pointer hover:ring-2 hover:ring-brandp-300 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-brandp-600 dark:hover:ring-offset-zinc-900']"
                role="button" tabindex="0" :aria-pressed="selectedPreferredAnswer === 'b'"
                @click="submitDualAnswerFeedback('b')" @keydown.enter.prevent="submitDualAnswerFeedback('b')" @keydown.space.prevent="submitDualAnswerFeedback('b')"
              >
                <div class="flex items-center justify-between gap-2 mb-3">
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-white">{{ selectedPreferredAnswer ? t('foodScholarHome.qa.answer') : t('foodScholarHome.qa.answerB') }}</h4>
                  <span v-if="!selectedPreferredAnswer" class="text-xs text-gray-500 dark:text-gray-400">{{ answerBLabel }}</span>
                </div>
                <div class="qa-answer-markdown answer-reveal-ltr text-sm text-gray-800 dark:text-gray-200 prose prose-sm dark:prose-invert max-w-none" @click="handleMarkdownClick" @mouseover="handleAnswerMouseOver" @mouseout="handleAnswerMouseOut" style="--answer-reveal-delay: 120ms" v-html="renderMarkdown(secondaryAnswer.answer)" />
              </div>
            </div>
          </div>

          <div v-else class="chat-flow-bubble chat-flow-bubble-assistant">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white">{{ t('foodScholarHome.qa.answer') }}</h4>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ t('foodScholarHome.qa.confidence') }}: {{ primaryAnswer.confidence || t('foodScholarHome.qa.notAvailable') }}</span>
            </div>
            <div class="qa-answer-markdown answer-reveal-ltr text-sm text-gray-800 dark:text-gray-200 prose prose-sm dark:prose-invert max-w-none" style="--answer-reveal-delay: 40ms" @click="handleMarkdownClick" @mouseover="handleAnswerMouseOver" @mouseout="handleAnswerMouseOut" v-html="renderMarkdown(primaryAnswer.answer)" />

            <div v-if="singleAnswerFeedbackEnabled" class="mt-4">
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ t('foodScholarHome.qa.feedback.helpfulQuestion') }}</span>
                <template v-if="!singleAnswerFeedbackSubmitted && !showNegativeFeedbackReasons">
                  <button :disabled="feedbackSubmitting" class="px-3 py-1.5 text-xs rounded-full border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-200 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-300 transition-colors disabled:opacity-50" @click="submitSingleAnswerFeedback(true)">{{ t('foodScholarHome.common.yes') }}</button>
                  <button :disabled="feedbackSubmitting" class="px-3 py-1.5 text-xs rounded-full border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-200 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-300 transition-colors disabled:opacity-50" @click="submitSingleAnswerFeedback(false)">{{ t('foodScholarHome.common.no') }}</button>
                </template>
                <template v-else-if="singleAnswerFeedbackSubmitted">
                  <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span class="text-xs font-medium text-emerald-700 dark:text-emerald-300">{{ t('foodScholarHome.qa.feedback.saved') }}</span>
                </template>
              </div>
              <div v-if="showNegativeFeedbackReasons && !singleAnswerFeedbackSubmitted" class="mt-3 space-y-3">
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('foodScholarHome.qa.feedback.whatWentWrong') }}</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="reason in negativeFeedbackReasons" :key="reason" :disabled="feedbackSubmitting"
                    :class="['px-3 py-1.5 text-xs rounded-full border transition-colors disabled:opacity-50', selectedNegativeReason === reason ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-900/30 dark:text-red-300' : 'border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-200 hover:border-red-400 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-300']"
                    @click="selectNegativeReason(reason)"
                  >{{ reason }}</button>
                </div>
                <div v-if="selectedNegativeReason">
                  <textarea v-model="negativeFeedbackComment" :disabled="feedbackSubmitting" rows="2" :placeholder="t('foodScholarHome.qa.feedback.optionalComment')" class="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 resize-none disabled:opacity-50" />
                  <button :disabled="feedbackSubmitting" class="mt-2 px-4 py-1.5 text-xs font-medium rounded-full bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50" @click="submitNegativeFeedback()">{{ t('foodScholarHome.qa.feedback.submit') }}</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Follow-up suggestions -->
          <div v-if="qaResult.follow_up_suggestions?.length" class="chat-flow-bubble chat-flow-bubble-muted">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">{{ t('foodScholarHome.qa.followUpSuggestions') }}</h4>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="suggestion in qaResult.follow_up_suggestions" :key="suggestion" type="button"
                class="px-3 py-1.5 text-xs rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-brand-100 dark:hover:bg-brand-900/40 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                @click="askScholarQA(suggestion)"
              >{{ suggestion }}</button>
            </div>
          </div>
        </div>
        <!-- end answer block -->
        </div>
        <!-- end center column -->

        <!-- Right panel: cited sources (titles only) -->
        <aside class="qa-source-sidebar hidden xl:flex flex-col gap-2 pt-1">
          <template v-if="qaResult && primaryAnswer && primaryAnswer.citations?.length">
            <p class="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-gray-400 dark:text-zinc-500 px-1 mb-1">Sources cited</p>
            <NuxtLink
              v-for="(citation, idx) in primaryAnswer.citations"
              :key="citation.article_urn"
              :to="getCitationSourcePath(citation)"
              :data-citation-urn="citation.article_urn"
              class="citation-source-card flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-600 dark:hover:text-brand-400 transition-colors group"
              @click.prevent="getCitationSourceType(citation) === 'guideline' ? navigateToGuideline(citation.article_urn) : router.push(getCitationSourcePath(citation))"
            >
              <UIcon :name="getQaSourceIcon(citation.article_urn, getCitationSourceType(citation))" class="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
              <span class="text-xs text-gray-800 dark:text-gray-200 leading-snug line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{{ citation.article_title }}</span>
              <span class="text-[0.6rem] font-bold text-brand-400 dark:text-brand-500 shrink-0 mt-0.5 ml-auto">[{{ idx + 1 }}]</span>
            </NuxtLink>

            <template v-if="uncitedRetrievedArticles.length">
              <p class="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-gray-400 dark:text-zinc-500 px-1 mt-3 mb-1">Sources consulted</p>
              <NuxtLink
                v-for="article in uncitedRetrievedArticles"
                :key="article.urn"
                :to="getQaSourcePath(article.urn, article.source_type)"
                class="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 opacity-60 hover:opacity-100 hover:border-gray-300 dark:hover:border-zinc-700 transition-all group"
              >
                <UIcon :name="getQaSourceIcon(article.urn, article.source_type)" class="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                <span class="text-xs text-gray-700 dark:text-gray-300 leading-snug line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{{ article.title }}</span>
              </NuxtLink>
            </template>
          </template>
        </aside>

        </div><!-- end 3-col grid -->
      </div>
    </template>

    <!-- Library tab -->
    <template v-else-if="pageTab === 'resources'">
      <div class="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14 space-y-16">

        <!-- Introduction + resource type row -->
        <section class="grid lg:grid-cols-[1fr_auto] gap-10 items-start">
          <div>
            <h2 class="text-3xl sm:text-4xl font-claude text-gray-900 dark:text-white leading-tight mb-4">
              Access the science of human nutrition
            </h2>
            <p class="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed max-w-3xl mb-6">
              FoodScholar consolidates peer-reviewed research, national dietary guidance, and academic reference material across the full breadth of nutritional science, for everyone.
            </p>

            <!-- Library search bar -->
            <div ref="librarySearchBoxRef" class="relative max-w-xl">
              <div class="relative flex items-center">
                <UIcon name="i-lucide-search" class="absolute left-3.5 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none z-10" />
                <input
                  ref="librarySearchInputRef"
                  v-model="librarySearchQuery"
                  type="text"
                  placeholder="Search articles, guides, textbooks…"
                  class="w-full pl-10 pr-20 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:focus:ring-brand-600 transition"
                  autocomplete="off"
                  @input="handleLibrarySearchInput"
                  @keydown.enter.prevent="handleLibrarySearchEnter"
                  @keydown.down.prevent="handleLibraryArrowDown"
                  @keydown.up.prevent="handleLibraryArrowUp"
                  @keydown.esc.prevent="closeLibraryDropdown"
                  @focus="libraryDropdownOpen = !!librarySearchQuery.trim()"
                />
                <button
                  v-if="librarySearchQuery"
                  type="button"
                  class="absolute right-10 text-gray-300 dark:text-zinc-600 hover:text-gray-500 dark:hover:text-zinc-300 transition-colors"
                  @mousedown.prevent="clearLibrarySearch"
                >
                  <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  :disabled="!librarySearchQuery.trim() || librarySearching"
                  class="absolute right-2 px-2 py-1 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                  @mousedown.prevent="runLibrarySearch"
                >
                  <UIcon v-if="librarySearching" name="i-lucide-loader-2" class="w-3.5 h-3.5 animate-spin" />
                  <UIcon v-else name="i-lucide-arrow-right" class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Dropdown: autocomplete suggestions + full search results -->
              <div
                v-if="libraryDropdownOpen && (libraryAutocompleting || libraryAutocompleteSuggestions.articles.length > 0 || libraryAutocompleteSuggestions.guides.length > 0 || libraryAutocompleteSuggestions.textbooks.length > 0 || librarySearchResults !== null)"
                class="absolute left-0 right-0 mt-2 z-30 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden"
              >
                <!-- Autocomplete suggestions (while typing, before full search) -->
                <template v-if="librarySearchResults === null">
                  <div v-if="libraryAutocompleting" class="px-4 py-3 text-sm text-gray-400 dark:text-zinc-500">
                    Looking up suggestions…
                  </div>
                  <template v-else>
                    <!-- Article suggestions -->
                    <div v-if="libraryAutocompleteSuggestions.articles.length">
                      <div class="px-4 pt-3 pb-1.5">
                        <span class="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-gray-400 dark:text-zinc-500">Articles</span>
                      </div>
                      <NuxtLink
                        v-for="(suggestion, i) in libraryAutocompleteSuggestions.articles"
                        :key="suggestion.urn"
                        :to="`/foodscholar/${suggestion.urn}`"
                        :class="[
                          'flex items-start gap-3 px-4 py-2.5 transition-colors',
                          libraryActiveIndex === i ? 'bg-brand-50 dark:bg-brand-900/20' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                        ]"
                        @click="closeLibraryDropdown"
                        @mouseenter="libraryActiveIndex = i"
                      >
                        <UIcon name="i-lucide-file-text" class="w-4 h-4 text-brand-400 dark:text-brand-500 shrink-0 mt-0.5" />
                        <div class="min-w-0">
                          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ suggestion.title }}</p>
                          <p class="text-xs text-gray-400 dark:text-zinc-500 truncate">{{ suggestion.venue || suggestion.ai_category || '' }}</p>
                        </div>
                      </NuxtLink>
                    </div>

                    <!-- Guide suggestions -->
                    <div v-if="libraryAutocompleteSuggestions.guides.length" :class="libraryAutocompleteSuggestions.articles.length ? 'border-t border-gray-100 dark:border-zinc-800' : ''">
                      <div class="px-4 pt-3 pb-1.5">
                        <span class="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-gray-400 dark:text-zinc-500">Dietary Guides</span>
                      </div>
                      <NuxtLink
                        v-for="(suggestion, i) in libraryAutocompleteSuggestions.guides"
                        :key="suggestion.urn"
                        :to="`/foodscholar/catalog/guides/${suggestion.urn}`"
                        :class="[
                          'flex items-start gap-3 px-4 py-2.5 transition-colors',
                          libraryActiveIndex === libraryAutocompleteSuggestions.articles.length + i ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                        ]"
                        @click="closeLibraryDropdown"
                        @mouseenter="libraryActiveIndex = libraryAutocompleteSuggestions.articles.length + i"
                      >
                        <UIcon name="i-lucide-map" class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div class="min-w-0">
                          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ suggestion.title }}</p>
                          <p class="text-xs text-gray-400 dark:text-zinc-500 truncate">{{ suggestion.region || '' }}</p>
                        </div>
                      </NuxtLink>
                    </div>

                    <!-- Textbook suggestions -->
                    <div
                      v-if="libraryAutocompleteSuggestions.textbooks.length"
                      :class="(libraryAutocompleteSuggestions.articles.length || libraryAutocompleteSuggestions.guides.length) ? 'border-t border-gray-100 dark:border-zinc-800' : ''"
                    >
                      <div class="px-4 pt-3 pb-1.5 flex items-center justify-between">
                        <span class="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-gray-400 dark:text-zinc-500">Textbooks</span>
                      </div>
                      <NuxtLink
                        v-for="(suggestion, i) in libraryAutocompleteSuggestions.textbooks"
                        :key="suggestion.urn"
                        :to="`/foodscholar/textbooks/${suggestion.urn}`"
                        :class="[
                          'flex items-start gap-3 px-4 py-2.5 transition-colors',
                          libraryActiveIndex === libraryAutocompleteSuggestions.articles.length + libraryAutocompleteSuggestions.guides.length + i ? 'bg-amber-50 dark:bg-amber-900/20' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                        ]"
                        @click="closeLibraryDropdown"
                        @mouseenter="libraryActiveIndex = libraryAutocompleteSuggestions.articles.length + libraryAutocompleteSuggestions.guides.length + i"
                      >
                        <UIcon name="i-lucide-book-open" class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div class="min-w-0">
                          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ suggestion.title }}</p>
                          <p class="text-xs text-gray-400 dark:text-zinc-500 truncate">
                            {{ [suggestion.authors?.join(', '), suggestion.publication_year].filter(Boolean).join(' · ') || 'Textbook' }}
                          </p>
                        </div>
                      </NuxtLink>
                    </div>

                  </template>
                </template>

                <!-- Full search results (after Enter / clicking search) -->
                <template v-else>
                  <div v-if="librarySearching" class="px-4 py-6 text-center text-sm text-gray-400 dark:text-zinc-500">
                    Searching…
                  </div>
                  <template v-else>
                    <div v-if="!librarySearchResults.articles.length && !librarySearchResults.guides.length && !librarySearchResults.textbooks.length" class="px-4 py-6 text-center text-sm text-gray-400 dark:text-zinc-500">
                      No results for <em>"{{ librarySearchResults.query }}"</em>
                    </div>
                    <template v-else>
                      <!-- Articles -->
                      <div v-if="librarySearchResults.articles.length">
                        <div class="px-4 pt-3 pb-1.5 flex items-center justify-between">
                          <span class="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-gray-400 dark:text-zinc-500">Articles</span>
                          <NuxtLink :to="`/foodscholar/catalog?q=${encodeURIComponent(librarySearchResults.query)}`" class="text-[0.6rem] text-brand-500 hover:text-brand-600 font-medium" @click="closeLibraryDropdown">See all</NuxtLink>
                        </div>
                        <NuxtLink
                          v-for="(article, i) in librarySearchResults.articles"
                          :key="article.urn"
                          :to="`/foodscholar/${article.urn}`"
                          :class="[
                            'flex items-start gap-3 px-4 py-2.5 transition-colors',
                            libraryActiveIndex === i ? 'bg-brand-50 dark:bg-brand-900/20' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                          ]"
                          @click="closeLibraryDropdown"
                          @mouseenter="libraryActiveIndex = i"
                        >
                          <UIcon name="i-lucide-file-text" class="w-4 h-4 text-brand-400 dark:text-brand-500 shrink-0 mt-0.5" />
                          <div class="min-w-0">
                            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ article.title }}</p>
                            <p class="text-xs text-gray-400 dark:text-zinc-500 truncate">{{ article.venue || article.ai_category || '' }}</p>
                          </div>
                        </NuxtLink>
                      </div>

                      <!-- Dietary Guides -->
                      <div v-if="librarySearchResults.guides.length" :class="librarySearchResults.articles.length ? 'border-t border-gray-100 dark:border-zinc-800' : ''">
                        <div class="px-4 pt-3 pb-1.5 flex items-center justify-between">
                          <span class="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-gray-400 dark:text-zinc-500">Dietary Guides</span>
                          <NuxtLink to="/foodscholar/guides" class="text-[0.6rem] text-emerald-600 hover:text-emerald-700 font-medium" @click="closeLibraryDropdown">See all</NuxtLink>
                        </div>
                        <NuxtLink
                          v-for="(guide, i) in librarySearchResults.guides"
                          :key="guide.urn"
                          :to="`/foodscholar/catalog/guides/${guide.urn}`"
                          :class="[
                            'flex items-start gap-3 px-4 py-2.5 transition-colors',
                            libraryActiveIndex === librarySearchResults.articles.length + i ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                          ]"
                          @click="closeLibraryDropdown"
                          @mouseenter="libraryActiveIndex = librarySearchResults.articles.length + i"
                        >
                          <UIcon name="i-lucide-map" class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div class="min-w-0">
                            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ guide.title }}</p>
                            <p class="text-xs text-gray-400 dark:text-zinc-500 truncate">{{ guide.region || '' }}</p>
                          </div>
                        </NuxtLink>
                      </div>

                      <!-- Textbooks -->
                      <div
                        v-if="librarySearchResults.textbooks.length"
                        :class="(librarySearchResults.articles.length || librarySearchResults.guides.length) ? 'border-t border-gray-100 dark:border-zinc-800' : ''"
                      >
                        <div class="px-4 pt-3 pb-1.5 flex items-center justify-between">
                          <span class="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-gray-400 dark:text-zinc-500">Textbooks</span>
                          <NuxtLink :to="`/foodscholar/textbooks?q=${encodeURIComponent(librarySearchResults.query)}`" class="text-[0.6rem] text-amber-600 hover:text-amber-700 font-medium" @click="closeLibraryDropdown">See all</NuxtLink>
                        </div>
                        <NuxtLink
                          v-for="(textbook, i) in librarySearchResults.textbooks"
                          :key="textbook.urn"
                          :to="`/foodscholar/textbooks/${textbook.urn}`"
                          :class="[
                            'flex items-start gap-3 px-4 py-2.5 transition-colors',
                            libraryActiveIndex === librarySearchResults.articles.length + librarySearchResults.guides.length + i ? 'bg-amber-50 dark:bg-amber-900/20' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                          ]"
                          @click="closeLibraryDropdown"
                          @mouseenter="libraryActiveIndex = librarySearchResults.articles.length + librarySearchResults.guides.length + i"
                        >
                          <UIcon name="i-lucide-book-open" class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div class="min-w-0">
                            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ textbook.title }}</p>
                            <p class="text-xs text-gray-400 dark:text-zinc-500 truncate">
                              {{ [textbook.authors?.join(', '), textbook.publication_year].filter(Boolean).join(' · ') || 'Textbook' }}
                            </p>
                          </div>
                        </NuxtLink>
                      </div>
                    </template>
                  </template>
                </template>
              </div>
            </div>
          </div>

          <!-- Resource type pills -->
          <div class="flex lg:flex-col gap-3 flex-wrap">
            <NuxtLink
              to="/foodscholar/catalog"
              class="group inline-flex min-w-[14rem] items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-brand-700 dark:hover:bg-brand-900/20"
            >
              <div class="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/40 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-file-text" class="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p class="text-base font-semibold text-gray-900 dark:text-white">Articles</p>
                <p class="font-claude text-sm text-gray-400 dark:text-zinc-500">Browse by topic</p>
              </div>
              <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5 text-gray-300 dark:text-zinc-600 ml-2 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
            </NuxtLink>

            <NuxtLink
              to="/foodscholar/guides"
              class="group inline-flex min-w-[14rem] items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-emerald-300 hover:bg-emerald-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20"
            >
              <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-map" class="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              </div>
              <div>
                <p class="text-base font-semibold text-gray-900 dark:text-white">Dietary Guides</p>
                <p class="font-claude text-sm text-gray-400 dark:text-zinc-500">Official dietary rules</p>
              </div>
              <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5 text-gray-300 dark:text-zinc-600 ml-2 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
            </NuxtLink>

            <NuxtLink
              to="/foodscholar/textbooks"
              class="group inline-flex min-w-[14rem] items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-amber-300 hover:bg-amber-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-amber-700 dark:hover:bg-amber-900/20"
            >
              <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-book-open" class="w-4 h-4 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <p class="text-base font-semibold text-gray-900 dark:text-white">Textbooks</p>
                <p class="font-claude text-sm text-gray-400 dark:text-zinc-500">Academic reference</p>
              </div>
              <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5 text-gray-300 dark:text-zinc-600 ml-2 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
            </NuxtLink>
          </div>
        </section>

        <!-- Articles by topic -->
        <section>
          <div class="flex items-center justify-between gap-4 mb-6">
            <div>
              <p class="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500">Articles</p>
              <h2 class="font-claude text-2xl text-gray-900 dark:text-white">Browse by topic</h2>
            </div>
            <NuxtLink
              to="/foodscholar/catalog"
              class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group"
            >
              <UIcon name="i-lucide-external-link" class="w-3.5 h-3.5" />
              Browse articles
            </NuxtLink>
          </div>

          <!-- Loading -->
          <div v-if="articlesLoading" class="space-y-4">
            <div class="flex gap-2 mb-4">
              <div v-for="i in 5" :key="i" class="h-7 w-24 rounded-full bg-gray-100 dark:bg-zinc-800 animate-pulse" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="i in 6" :key="i" class="h-48 rounded-2xl bg-gray-100 dark:bg-zinc-800 animate-pulse" />
            </div>
          </div>

          <template v-else-if="allArticles.length">
            <!-- Topic tabs -->
            <div class="flex gap-1.5 flex-wrap mb-6">
              <button
                v-for="topic in libraryArticleTopics"
                :key="topic"
                type="button"
                :class="[
                  'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
                  librarySelectedTopic === topic
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-600 dark:hover:text-brand-400'
                ]"
                @click="selectLibraryTopic(topic)"
              >{{ topic }}</button>
            </div>

            <div v-if="libraryTopicArticlesLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="i in 6" :key="i" class="h-48 rounded-2xl bg-gray-100 dark:bg-zinc-800 animate-pulse" />
            </div>
            <template v-else>
              <!-- Article cards -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FoodscholarArticleCard
                  v-for="(article, i) in libraryFilteredArticles"
                  :key="article.urn"
                  :article="article"
                  :index="i"
                  :fade="false"
                />
              </div>

              <p v-if="!libraryFilteredArticles.length" class="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">
                No articles found for this topic.
              </p>
            </template>
          </template>

          <div v-else-if="articlesError" class="py-10 text-center text-sm text-red-500">{{ articlesError }}</div>
        </section>

        <!-- Dietary Guides overview -->
        <section>
          <div class="flex items-start justify-between gap-6 mb-6">
            <div>
              <p class="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500">Dietary Guides</p>
              <h2 class="font-claude text-2xl text-gray-900 dark:text-white">Official dietary rules.</h2>
            </div>
            <NuxtLink
              to="/foodscholar/guides"
              class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group"
            >
              <UIcon name="i-lucide-external-link" class="w-3.5 h-3.5" />
              Browse Guides
            </NuxtLink>
          </div>

          <div class="grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_14rem] xl:items-start">
            <div>
              <div v-if="libraryMapLoading" class="library-map-wrap animate-pulse bg-gray-50/70 dark:bg-zinc-800/40 flex items-center justify-center">
                <p class="text-sm text-gray-400 dark:text-zinc-500">Loading map…</p>
              </div>
              <div v-else-if="libraryMapError" class="flex min-h-40 items-center justify-center px-6 py-10 text-center">
                <p class="text-sm text-gray-400 dark:text-zinc-500">{{ libraryMapError }}</p>
              </div>
              <div v-else class="library-map-wrap">
                <FoodscholarGuidesEuropeGuidesMap
                  v-model:selected-region-code="librarySelectedRegion"
                  :regions="libraryEuRegions"
                  :hide-controls="true"
                  :view-padding="0.015"
                />
              </div>
            </div>

            <aside class="flex flex-col gap-5">
              <dl class="grid grid-cols-3 gap-3 border-b border-gray-100 pb-4 dark:border-zinc-800">
                <div>
                  <dt class="text-[0.58rem] uppercase tracking-[0.15em] text-gray-400 dark:text-zinc-500 font-semibold">Countries</dt>
                  <dd class="mt-0.5 text-xl font-semibold text-gray-900 dark:text-white">{{ libraryEuRegions.length }}</dd>
                </div>
                <div>
                  <dt class="text-[0.58rem] uppercase tracking-[0.15em] text-gray-400 dark:text-zinc-500 font-semibold">Guides</dt>
                  <dd class="mt-0.5 text-xl font-semibold text-gray-900 dark:text-white">{{ libraryTotalGuides.toLocaleString() }}</dd>
                </div>
                <div>
                  <dt class="text-[0.58rem] uppercase tracking-[0.15em] text-gray-400 dark:text-zinc-500 font-semibold">Rules</dt>
                  <dd class="mt-0.5 text-xl font-semibold text-gray-900 dark:text-white">{{ libraryTotalGuidelines > 0 ? libraryTotalGuidelines.toLocaleString() : '—' }}</dd>
                </div>
              </dl>

              <div v-if="librarySelectedRegionData" class="border-b border-gray-100 pb-4 dark:border-zinc-800">
                <p class="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {{ `${librarySelectedRegionData.flag || ''} ${librarySelectedRegionData.label}`.trim() }}
                </p>
                <p class="text-xs text-gray-400 dark:text-zinc-500 mb-3">
                  {{ librarySelectedRegionData.guideCount }} guide{{ librarySelectedRegionData.guideCount === 1 ? '' : 's' }}<template v-if="librarySelectedRegionData.guidelineCount"> · {{ librarySelectedRegionData.guidelineCount }} rules</template><template v-if="librarySelectedRegionData.latestPublicationYear"> · {{ librarySelectedRegionData.latestPublicationYear }}</template>
                </p>
                <NuxtLink
                  :to="`/foodscholar/guides/${librarySelectedRegionData.slug}`"
                  class="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors group"
                >
                  <UIcon name="i-lucide-external-link" class="w-3.5 h-3.5" />
                  Open country guides
                </NuxtLink>
              </div>
              <div v-else class="border-b border-gray-100 pb-4 dark:border-zinc-800">
                <p class="text-xs text-gray-400 dark:text-zinc-500 leading-relaxed">Select a country to see its dietary guidance records and available publications.</p>
                <NuxtLink
                  to="/foodscholar/guides"
                  class="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 transition-colors group"
                >
                  <UIcon name="i-lucide-list" class="w-3.5 h-3.5" />
                  Browse all guides
                </NuxtLink>
              </div>
            </aside>
          </div>
        </section>

        <!-- Textbooks section -->
        <section>
          <div class="flex items-center justify-between gap-4 mb-6">
            <div>
              <p class="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500">Textbooks</p>
              <h2 class="font-claude text-2xl text-gray-900 dark:text-white">Academic reference</h2>
            </div>
            <NuxtLink
              to="/foodscholar/textbooks"
              class="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors group"
            >
              Full catalog
              <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </NuxtLink>
               <NuxtLink
              to="/foodscholar/textbooks"
              class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group"
            >
              <UIcon name="i-lucide-external-link" class="w-3.5 h-3.5" />
              Browse Textbooks
            </NuxtLink>
          </div>

          <div v-if="libraryTextbooksLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="i in 3" :key="i" class="h-44 rounded-2xl bg-gray-100 dark:bg-zinc-800 animate-pulse" />
          </div>

          <div v-else-if="libraryTextbooks.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FoodscholarTextbookCard
              v-for="(book, i) in libraryTextbooks"
              :key="book.urn"
              :textbook="book"
              :index="i"
              :fade="false"
            />
          </div>

          <div v-else class="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">
            No textbooks available.
          </div>
        </section>

      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { DropdownMenuItem } from '@nuxt/ui'
import articlesApi, { type Article } from '~/services/articlesApi'
import catalogApi, { type CatalogGuide } from '~/services/catalogApi'
import textbooksApi, { type Textbook, type TextbookSuggestion } from '~/services/textbooksApi'
import foodscholarApi, {
  type QaAskRequest,
  type QaAskResult,
  type QaAnswer,
  type QaCitation,
  type QaClarification,
  type QaClarificationResponse,
  type QaRetriever
} from '~/services/foodscholarApi'
import { useAuthStore } from '~/stores/auth'
import { useHouseholdStore } from '~/stores/household'
import { getExcerpt } from '~/utils/articleHelpers'
import {
  buildGuideDetailPath,
  buildRegionSummaries,
  getRegionPresentation,
  type GuidesCatalogRegionSummary
} from '~/utils/guidesCatalog'
import { euCountryCodes } from '~/utils/countries'

const { t, locale } = useI18n()

definePageMeta({
  middleware: ['auth', 'profile']
})

useHead({
  title: computed(() => t('dashboard.apps.foodScholar.title'))
})

useSeoMeta({
  description: computed(() => t('foodScholarHome.subtitle'))
})

interface HomeArticle {
  id: string | number
  urn: string
  title: string
  category: string
  ai_category?: string | null
  excerpt: string
  authors?: string[]
  tags?: string[]
  ai_tags?: string[]
  topics?: string[]
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

type QaRetrievalMode = QaRetriever | 'model'
type QaEvidenceSourceType = NonNullable<QaCitation['source_type']>

interface RetrievalOption {
  value: QaRetrievalMode
  label: string
  description: string
  icon: string
}

const AUTO_MODEL_VALUE = '__auto__'
const CATEGORY_ALL = 'All'
const CATEGORY_UNCATEGORIZED = 'Uncategorized'
const pageTab = ref<'qa' | 'resources'>('qa')
const hasActiveSession = computed(() => asking.value || !!qaResult.value || !!qaError.value || !!pendingClarification.value)
const advancedSelectContent = {
  side: 'bottom' as const,
  sideOffset: 6,
  collisionPadding: 16,
  position: 'popper' as const
}
const advancedSelectUi = {
  base: 'cursor-pointer',
  content: 'z-[140] max-h-72 w-auto min-w-64 max-w-[calc(100vw-2rem)]',
  viewport: 'max-h-72',
  item: 'cursor-pointer'
}
const chatSettingsContent = {
  align: 'end' as const,
  side: 'bottom' as const,
  sideOffset: 8,
  collisionPadding: 12
}
const chatSettingsUi = {
  content: 'w-52 z-[140]'
}

// ============================================================================
// Library tab state
// ============================================================================
const EU_REGION_SET = new Set<string>(euCountryCodes)

const libraryMapLoading = ref(false)
const libraryMapLoaded = ref(false)
const libraryMapError = ref<string | null>(null)
const libraryRegionSummaries = ref<GuidesCatalogRegionSummary[]>([])
const librarySelectedRegion = ref<string | null>(null)

const LIBRARY_MAP_EXTRA = new Set(['RS']) // Serbia included even though not EU
const libraryEuRegions = computed(() =>
  libraryRegionSummaries.value.filter(r => {
    const code = getRegionPresentation(r.region).value.toUpperCase()
    return EU_REGION_SET.has(code) || LIBRARY_MAP_EXTRA.has(code)
  })
)

const libraryTotalGuides = computed(() =>
  libraryEuRegions.value.reduce((s, r) => s + r.guideCount, 0)
)

const libraryTotalGuidelines = computed(() =>
  libraryEuRegions.value.reduce((s, r) => s + (r.guidelineCount ?? 0), 0)
)

const librarySelectedRegionData = computed(() =>
  libraryEuRegions.value.find(r =>
    getRegionPresentation(r.region).value.toUpperCase() === librarySelectedRegion.value
  ) ?? null
)

const librarySelectedTopic = ref(CATEGORY_ALL)
const libraryTopicArticles = ref<HomeArticle[]>([])
const libraryTopicArticlesLoading = ref(false)
const libraryTopicFacetsLoaded = ref(false)

const libraryArticleTopics = computed(() => popularArticleTopics.value.slice(0, 8))

const libraryFilteredArticles = computed(() => {
  const topic = librarySelectedTopic.value
  if (topic === CATEGORY_ALL) return allArticles.value.slice(0, 6)
  return libraryTopicArticles.value.slice(0, 6)
})

async function loadLibraryTopicFacets() {
  if (libraryTopicFacetsLoaded.value) return
  if (!allArticles.value.length) {
    await loadPopularArticles()
  }
  libraryTopicFacetsLoaded.value = true
}

async function selectLibraryTopic(topic: string) {
  librarySelectedTopic.value = topic
  if (topic === CATEGORY_ALL) {
    libraryTopicArticles.value = []
    return
  }

  libraryTopicArticlesLoading.value = true
  try {
    const response = await articlesApi.searchArticles({
      q: null,
      limit: 6,
      offset: 0,
      sort: 'created_at desc',
      fl: ['id', 'urn', 'title', 'abstract', 'description', 'content', 'authors', 'tags', 'ai_tags', 'topics', 'venue', 'publication_year', 'category', 'ai_category'],
      fq: [`topics:"${topic}"`],
      fields: []
    })
    const results = response.result.results || []
    libraryTopicArticles.value = results.map(mapArticleToHome)
  } catch {
    libraryTopicArticles.value = []
  } finally {
    libraryTopicArticlesLoading.value = false
  }
}

async function loadLibraryMap() {
  if (libraryMapLoaded.value || libraryMapLoading.value) return
  libraryMapLoading.value = true
  libraryMapError.value = null
  try {
    const [guideRes, guidelineRes] = await Promise.all([
      catalogApi.searchGuides({ limit: 250, offset: 0, sort: 'publication_year desc', facet_limit: 100 }),
      catalogApi.searchGuidelines({ limit: 1, offset: 0, fields: ['region'], facet_limit: 100 }).catch(() => ({
        guidelines: [], total: 0, facets: {} as Record<string, Array<{ value: string; count: number }>>
      }))
    ])
    libraryRegionSummaries.value = buildRegionSummaries(
      guideRes.guides,
      guideRes.facets.region || [],
      guidelineRes.facets.region || []
    )
    libraryMapLoaded.value = true
  } catch {
    libraryMapError.value = 'Dietary guides data could not be loaded.'
  } finally {
    libraryMapLoading.value = false
  }
}

const libraryTextbooks = ref<Textbook[]>([])
const libraryTextbooksLoading = ref(false)

async function loadLibraryTextbooks() {
  if (libraryTextbooksLoading.value || libraryTextbooks.value.length) return
  libraryTextbooksLoading.value = true
  try {
    const res = await textbooksApi.searchTextbooks({ q: null, limit: 6, offset: 0, sort: 'updated_at desc' })
    libraryTextbooks.value = res.textbooks
  } catch {
    // silently fail — section stays empty
  } finally {
    libraryTextbooksLoading.value = false
  }
}
// ============================================================================
// Library search
// ============================================================================
const librarySearchBoxRef = ref<HTMLElement | null>(null)
const librarySearchInputRef = ref<HTMLInputElement | null>(null)
const librarySearchQuery = ref('')
const librarySearching = ref(false)
const librarySearchResults = ref<{ query: string; articles: HomeArticle[]; guides: CatalogGuide[]; textbooks: Textbook[] } | null>(null)
const libraryDropdownOpen = ref(false)
const libraryActiveIndex = ref(-1)

interface LibraryAutocompleteSuggestions {
  articles: Array<{ urn: string; title: string; venue?: string | null; ai_category?: string | null }>
  guides: Array<{ urn: string; title: string; region?: string | null }>
  textbooks: TextbookSuggestion[]
}

const libraryAutocompleting = ref(false)
const libraryAutocompleteSuggestions = ref<LibraryAutocompleteSuggestions>({ articles: [], guides: [], textbooks: [] })
let libraryAutocompleteTimer: ReturnType<typeof setTimeout> | null = null

async function fetchLibraryAutocomplete(q: string) {
  libraryAutocompleting.value = true
  try {
    const [articleSuggestions, guideSuggestions, textbookSuggestions] = await Promise.all([
      articlesApi.autocompleteArticles(q, 5).catch(() => []),
      catalogApi.autocompleteGuides(q, 5).catch(() => []),
      textbooksApi.autocompleteTextbooks(q, 5).catch(() => [])
    ])
    if (librarySearchQuery.value.trim() !== q) return
    libraryAutocompleteSuggestions.value = {
      articles: articleSuggestions,
      guides: guideSuggestions,
      textbooks: textbookSuggestions
    }
    const hasAny = articleSuggestions.length > 0 || guideSuggestions.length > 0 || textbookSuggestions.length > 0
    libraryDropdownOpen.value = hasAny
    libraryActiveIndex.value = -1
  } catch {
    libraryAutocompleteSuggestions.value = { articles: [], guides: [], textbooks: [] }
  } finally {
    libraryAutocompleting.value = false
  }
}

function handleLibrarySearchInput() {
  const q = librarySearchQuery.value.trim()
  librarySearchResults.value = null
  libraryActiveIndex.value = -1

  if (libraryAutocompleteTimer) {
    clearTimeout(libraryAutocompleteTimer)
    libraryAutocompleteTimer = null
  }

  if (q.length < 2) {
    libraryAutocompleteSuggestions.value = []
    libraryDropdownOpen.value = false
    return
  }

  libraryDropdownOpen.value = true
  libraryAutocompleteTimer = setTimeout(() => {
    void fetchLibraryAutocomplete(q)
  }, 220)
}

// Computed flat list of navigable items for arrow-key tracking
const libraryNavItems = computed(() => {
  if (librarySearchResults.value === null) {
    // autocomplete mode — articles and guides are navigable, textbooks are not
    const s = libraryAutocompleteSuggestions.value
    return [
      ...s.articles.map((_, i) => ({ type: 'ac-article' as const, index: i })),
      ...s.guides.map((_, i) => ({ type: 'ac-guide' as const, index: i })),
      ...s.textbooks.map((_, i) => ({ type: 'ac-textbook' as const, index: i }))
    ]
  }
  const r = librarySearchResults.value
  return [
    ...r.articles.map((_, i) => ({ type: 'article' as const, index: i })),
    ...r.guides.map((_, i) => ({ type: 'guide' as const, index: i }))
  ]
})

function handleLibraryArrowDown() {
  if (!libraryDropdownOpen.value) return
  const max = libraryNavItems.value.length - 1
  libraryActiveIndex.value = libraryActiveIndex.value < max ? libraryActiveIndex.value + 1 : 0
}

function handleLibraryArrowUp() {
  if (!libraryDropdownOpen.value) return
  const max = libraryNavItems.value.length - 1
  libraryActiveIndex.value = libraryActiveIndex.value > 0 ? libraryActiveIndex.value - 1 : max
}

function handleLibrarySearchEnter() {
  if (!libraryDropdownOpen.value || libraryNavItems.value.length === 0) {
    void runLibrarySearch()
    return
  }

  const item = libraryNavItems.value[libraryActiveIndex.value >= 0 ? libraryActiveIndex.value : 0]
  if (!item) { void runLibrarySearch(); return }

  if (item.type === 'ac-textbook') {
    void runLibrarySearch()
    return
  }

  if (item.type === 'ac-article') {
    const article = libraryAutocompleteSuggestions.value.articles[item.index]
    if (article) { closeLibraryDropdown(); void navigateTo(`/foodscholar/${article.urn}`) }
    return
  }

  if (item.type === 'ac-guide') {
    const guide = libraryAutocompleteSuggestions.value.guides[item.index]
    if (guide) { closeLibraryDropdown(); void navigateTo(`/foodscholar/catalog/guides/${guide.urn}`) }
    return
  }

  if (item.type === 'article' && librarySearchResults.value) {
    const article = librarySearchResults.value.articles[item.index]
    if (article) { closeLibraryDropdown(); void navigateTo(`/foodscholar/${article.urn}`) }
    return
  }

  if (item.type === 'guide' && librarySearchResults.value) {
    const guide = librarySearchResults.value.guides[item.index]
    if (guide) { closeLibraryDropdown(); void navigateTo(`/foodscholar/catalog/guides/${guide.urn}`) }
    return
  }

  void runLibrarySearch()
}

async function runLibrarySearch() {
  const q = librarySearchQuery.value.trim()
  if (!q || librarySearching.value) return
  if (libraryAutocompleteTimer) { clearTimeout(libraryAutocompleteTimer); libraryAutocompleteTimer = null }
  libraryAutocompleteSuggestions.value = { articles: [], guides: [], textbooks: [] }
  librarySearching.value = true
  librarySearchResults.value = { query: q, articles: [], guides: [], textbooks: [] }
  libraryDropdownOpen.value = true
  libraryActiveIndex.value = -1
  try {
    const [articleRes, guideRes, textbookRes] = await Promise.all([
      articlesApi.searchArticles({ q, limit: 5, offset: 0 }),
      catalogApi.searchGuides({ q, limit: 5, offset: 0 }),
      textbooksApi.searchTextbooks({ q, limit: 5, offset: 0 }).catch(() => ({ textbooks: [], total: 0, facets: {} }))
    ])
    librarySearchResults.value = {
      query: q,
      articles: (articleRes.result?.results ?? []).slice(0, 5).map(mapArticleToHome),
      guides: guideRes.guides.slice(0, 5),
      textbooks: textbookRes.textbooks.slice(0, 5)
    }
  } catch {
    // silent
  } finally {
    librarySearching.value = false
  }
}

function closeLibraryDropdown() {
  libraryDropdownOpen.value = false
  libraryActiveIndex.value = -1
}

function clearLibrarySearch() {
  librarySearchQuery.value = ''
  librarySearchResults.value = null
  libraryAutocompleteSuggestions.value = { articles: [], guides: [], textbooks: [] }
  libraryDropdownOpen.value = false
  libraryActiveIndex.value = -1
  librarySearchInputRef.value?.focus()
}

function handleLibraryClickOutside(e: MouseEvent) {
  if (librarySearchBoxRef.value && !librarySearchBoxRef.value.contains(e.target as Node)) {
    closeLibraryDropdown()
  }
}

// ============================================================================
// QA headings
// ============================================================================
const router = useRouter()
const authStore = useAuthStore()
const householdStore = useHouseholdStore()

const qaHeadingIndex = Math.floor(Math.random() * 10)
const qaHeadings = computed(() => {
  const name = householdStore.currentMember?.name?.split(' ')[0] || householdStore.currentMember?.name || ''
  const greeting = name ? `, ${name}` : ''
  return [
    `What's on your mind${greeting}?`,
    `Ready to explore nutrition${greeting}?`,
    `Ask me anything${greeting}`,
    `What would you like to know${greeting}?`,
    `Where shall we start${greeting}?`,
    `Your nutrition question${greeting}?`,
    `Hello${greeting}! What can I help with?`,
    `Let's dig into the science${greeting}`,
    `Curious about something${greeting}?`,
    `What are you researching${greeting}?`
  ]
})
const qaHeading = computed(() => qaHeadings.value[qaHeadingIndex] || qaHeadings.value[0])

const normalizeQaSourceType = (urn: string, sourceType?: QaCitation['source_type']): QaEvidenceSourceType => {
  const normalizedType = sourceType?.toLowerCase()

  if (normalizedType === 'guideline' || normalizedType === 'guide' || normalizedType === 'article') {
    return normalizedType
  }

  if (urn.startsWith('urn:guide:')) {
    return 'guide'
  }

  if (urn.startsWith('urn:article:')) {
    return 'article'
  }

  return 'guideline'
}

const getQaSourcePath = (urn: string, sourceType?: QaCitation['source_type']) => {
  const normalizedType = normalizeQaSourceType(urn, sourceType)

  if (normalizedType === 'guideline') {
    return `/foodscholar/catalog/guidelines/${encodeURIComponent(urn)}`
  }

  if (normalizedType === 'guide') {
    return `/foodscholar/catalog/guides/${encodeURIComponent(urn)}`
  }

  return `/foodscholar/${urn}`
}

const getQaSourceIcon = (urn: string, sourceType?: QaCitation['source_type']) => {
  const normalizedType = normalizeQaSourceType(urn, sourceType)

  if (normalizedType === 'guideline') {
    return 'i-lucide-list-checks'
  }

  if (normalizedType === 'guide') {
    return 'i-lucide-book-open'
  }

  return 'i-lucide-file-text'
}

const getCitationSourceType = (citation: QaCitation): QaCitation['source_type'] =>
  citation.source_type ?? retrievedArticleMap.value[citation.article_urn]?.source_type ?? null

const getCitationSourcePath = (citation: QaCitation) =>
  getQaSourcePath(citation.article_urn, getCitationSourceType(citation))

const getCitationForUrn = (articleUrn: string) => {
  const citations = [
    ...(primaryAnswer.value?.citations || []),
    ...(secondaryAnswer.value?.citations || [])
  ]
  return citations.find(c => c.article_urn === articleUrn && (c.quote || c.section)) || null
}

const navigateToGuideline = async (guidelineId: string, extraQuery: Record<string, string> = {}) => {
  try {
    const guideline = await catalogApi.getGuideline(guidelineId)
    if (!guideline.guide_urn) {
      router.push({ path: `/foodscholar/catalog/guidelines/${encodeURIComponent(guidelineId)}`, query: { ...extraQuery, guideline: guidelineId } })
      return
    }
    const query: Record<string, string> = { ...extraQuery, guideline: guidelineId }
    if (typeof guideline.page_no === 'number') {
      query.pdf_page = String(guideline.page_no)
    }
    router.push({
      path: buildGuideDetailPath(guideline.region, guideline.guide_urn),
      query,
    })
  } catch {
    router.push({ path: `/foodscholar/catalog/guidelines/${encodeURIComponent(guidelineId)}`, query: { ...extraQuery, guideline: guidelineId } })
  }
}

const resolveQaSourceHref = (href: string): { url: URL, urn: string, sourceType: QaEvidenceSourceType, path: string } | null => {
  const url = new URL(href, window.location.origin)
  const pathSegments = url.pathname
    .split('/')
    .filter(Boolean)
    .map(segment => decodeURIComponent(segment))

  const guidelineId = pathSegments[0] === 'guidelines'
    ? pathSegments[1]
    : pathSegments[0] === 'foodscholar' && pathSegments[1] === 'catalog' && pathSegments[2] === 'guidelines'
      ? pathSegments[3]
      : null

  if (guidelineId) {
    return {
      url,
      urn: guidelineId,
      sourceType: 'guideline',
      path: getQaSourcePath(guidelineId, 'guideline')
    }
  }

  const catalogGuideUrn = pathSegments[0] === 'foodscholar' && pathSegments[1] === 'catalog' && pathSegments[2] === 'guides'
    ? pathSegments[3]
    : null

  if (catalogGuideUrn) {
    return {
      url,
      urn: catalogGuideUrn,
      sourceType: 'guide',
      path: getQaSourcePath(catalogGuideUrn, 'guide')
    }
  }

  const articleUrn = (pathSegments[0] === 'foodscholar' || pathSegments[0] === 'articles') && pathSegments[1]?.startsWith('urn:article:')
    ? pathSegments[1]
    : null

  if (articleUrn) {
    return {
      url,
      urn: articleUrn,
      sourceType: 'article',
      path: getQaSourcePath(articleUrn, 'article')
    }
  }

  return null
}

const handleMarkdownClick = (event: MouseEvent) => {
  const anchor = (event.target as HTMLElement).closest('a')
  if (!anchor) return

  const href = anchor.getAttribute('href')
  if (!href) return

  const resolvedSource = resolveQaSourceHref(href)
  if (!resolvedSource) return

  const { url, urn: targetUrn, sourceType, path: targetPath } = resolvedSource
  const citation = getCitationForUrn(targetUrn)

  event.preventDefault()
  event.stopPropagation()

  const query = Object.fromEntries(url.searchParams.entries()) as Record<string, string>

  if (sourceType === 'guideline') {
    void navigateToGuideline(targetUrn, query)
  } else {
    if (!('section' in query) && citation?.section) query.section = String(citation.section)
    if (!('hl' in query) && citation?.quote) query.hl = String(citation.quote)
    router.push({
      path: targetPath,
      query,
      hash: url.hash
    })
  }
}

const selectedPopularTopic = ref(CATEGORY_ALL)
const articlesLoading = ref(false)
const articlesError = ref<string | null>(null)
const allArticles = ref<HomeArticle[]>([])
const facets = ref<Record<string, Array<{ value: string, count: number }>>>({})

const chatQuery = ref('')
const composerFocused = ref(false)
const asking = ref(false)
const qaError = ref<string | null>(null)
const qaResult = ref<QaAskResult | null>(null)

// clarification state
const pendingClarification = ref<QaClarification | null>(null)
const qaThreadId = ref<string | null>(null)
const pendingQuestion = ref<string>('')
const pendingPayload = ref<QaAskRequest | null>(null)
const clarificationSelectedValues = ref<string[]>([])
const clarificationFreeText = ref<string>('')
const qaMode = ref<'simple' | 'advanced'>('simple')
const retrievalMode = ref<QaRetrievalMode>('rag')
const ragEnabled = computed({
  get: () => retrievalMode.value !== 'model',
  set: (enabled: boolean) => {
    retrievalMode.value = enabled
      ? (retrievalMode.value === 'model' ? 'rag' : retrievalMode.value)
      : 'model'
  }
})
const selectedRetriever = computed<QaRetriever>(() => retrievalMode.value === 'linearrag' ? 'linearrag' : 'rag')
const qaModels = ref<string[]>([])
const selectedModel = ref('')
const modelsLoading = ref(false)
const topK = ref(5)
const expertiseLevel = ref('intermediate')
const feedbackSubmitting = ref(false)
const selectedPreferredAnswer = ref<'a' | 'b' | null>(null)
const singleAnswerFeedbackSubmitted = ref(false)
const showNegativeFeedbackReasons = ref(false)
const selectedNegativeReason = ref<string | null>(null)
const negativeFeedbackComment = ref('')

const negativeFeedbackReasons = computed(() => [
  t('foodScholarHome.qa.feedback.reasons.inaccurate'),
  t('foodScholarHome.qa.feedback.reasons.notAsked'),
  t('foodScholarHome.qa.feedback.reasons.missingQuality'),
  t('foodScholarHome.qa.feedback.reasons.slowOrErrors'),
  t('foodScholarHome.qa.feedback.reasons.toneStyle'),
  t('foodScholarHome.qa.feedback.reasons.safetyLegal')
])

const quickQuestions = ref<string[]>([])

const retrievalOptions = computed<RetrievalOption[]>(() => [
  {
    value: 'rag',
    label: t('foodScholarHome.qa.advanced.retrieverRag'),
    description: t('foodScholarHome.qa.advanced.retrieverRagDescription'),
    icon: 'i-lucide-library'
  },
  {
    value: 'linearrag',
    label: t('foodScholarHome.qa.advanced.retrieverLinearRag'),
    description: t('foodScholarHome.qa.advanced.retrieverLinearRagDescription'),
    icon: 'i-lucide-git-branch'
  },
  {
    value: 'model',
    label: t('foodScholarHome.qa.advanced.retrieverModelOnly'),
    description: t('foodScholarHome.qa.advanced.retrieverModelOnlyDescription'),
    icon: 'i-lucide-brain'
  }
])

const selectedRetrievalOption = computed<RetrievalOption>(() => retrievalOptions.value.find(option => option.value === retrievalMode.value) ?? retrievalOptions.value[0]!)

const retrievalButtonClass = (value: QaRetrievalMode) => {
  if (retrievalMode.value !== value) {
    return 'text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400'
  }

  if (value === 'linearrag') {
    return 'bg-brand-500 text-white shadow-sm'
  }

  if (value === 'model') {
    return 'bg-zinc-600 text-white shadow-sm'
  }

  return 'bg-emerald-500 text-white shadow-sm'
}

const topKOptions = computed<TopKOption[]>(() => [
  { value: 3, label: t('foodScholarHome.qa.topK.focusedLabel'), description: t('foodScholarHome.qa.topK.focusedDescription'), icon: 'i-lucide-zap' },
  { value: 5, label: t('foodScholarHome.qa.topK.balancedLabel'), description: t('foodScholarHome.qa.topK.balancedDescription'), icon: 'i-lucide-scale' },
  { value: 8, label: t('foodScholarHome.qa.topK.deepLabel'), description: t('foodScholarHome.qa.topK.deepDescription'), icon: 'i-lucide-layers' },
  { value: 12, label: t('foodScholarHome.qa.topK.comprehensiveLabel'), description: t('foodScholarHome.qa.topK.comprehensiveDescription'), icon: 'i-lucide-book-open' }
])

const expertiseOptions = computed<ExpertiseOption[]>(() => [
  {
    value: 'beginner',
    label: t('foodScholarHome.qa.expertise.beginnerLabel'),
    description: t('foodScholarHome.qa.expertise.beginnerDescription'),
    icon: 'i-lucide-smile'
  },
  {
    value: 'intermediate',
    label: t('foodScholarHome.qa.expertise.intermediateLabel'),
    description: t('foodScholarHome.qa.expertise.intermediateDescription'),
    icon: 'i-lucide-graduation-cap'
  },
  {
    value: 'expert',
    label: t('foodScholarHome.qa.expertise.expertLabel'),
    description: t('foodScholarHome.qa.expertise.expertDescription'),
    icon: 'i-lucide-flask-conical'
  }
])

const popularArticleTopics = computed(() => {
  const topics = (facets.value.topics || [])
    .filter(item => item?.value)
    .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))
    .slice(0, 10)
    .map(item => item.value)

  if (!topics.length) {
    const topicCounts = new Map<string, number>()

    allArticles.value.forEach((article) => {
      ;(article.topics || []).forEach((topic) => {
        if (!topic) return
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
      })
    })

    const fallback = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic)

    if (!fallback.length) {
      const tagFallback = popularTopics.value.slice(0, 10).map(topic => topic.query).filter(Boolean)
      return [CATEGORY_ALL, ...new Set(tagFallback)]
    }

    return [CATEGORY_ALL, ...new Set(fallback)]
  }

  return [CATEGORY_ALL, ...topics]
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
    description: t('foodScholarHome.popularTopics.topicDescription', { topic: tag.value }),
    icon: iconSet[index % iconSet.length],
    query: tag.value
  }))
})

const filteredArticles = computed(() => {
  return allArticles.value.slice(0, 8)
})

const selectPopularTopic = async (topic: string) => {
  selectedPopularTopic.value = topic
  if (topic === CATEGORY_ALL) {
    await loadPopularArticles()
  } else {
    await loadArticlesForTopic(topic)
  }
}

const loadArticlesForTopic = async (topic: string) => {
  articlesLoading.value = true
  articlesError.value = null

  try {
    const response = await articlesApi.searchArticles({
      q: null,
      limit: 24,
      offset: 0,
      sort: 'created_at desc',
      fl: ['id', 'urn', 'title', 'abstract', 'description', 'content', 'authors', 'tags', 'ai_tags', 'topics', 'venue', 'publication_year', 'category', 'ai_category'],
      fq: [`topics:"${topic}"`],
      fields: []
    })

    const results = response.result.results || []
    allArticles.value = results.map(mapArticleToHome)
  } catch (err: unknown) {
    articlesError.value = getErrorMessage(err, t('foodScholarHome.errors.failedToLoadArticles'))
  } finally {
    articlesLoading.value = false
  }
}

const primaryAnswer = computed<QaAnswer | null>(() => qaResult.value?.primary_answer || null)
const secondaryAnswer = computed<QaAnswer | null>(() => qaResult.value?.secondary_answer || null)

const retrievedSources = computed(() =>
  qaResult.value?.retrieved_sources ?? qaResult.value?.retrieved_articles ?? []
)

const retrievedArticleMap = computed(() => {
  const map: Record<string, { urn: string; title: string; source_type?: QaCitation['source_type']; authors?: string[] | null; publication_year?: string; similarity_score?: number }> = {}
  for (const a of retrievedSources.value) {
    map[a.urn] = a
  }
  return map
})

const uncitedRetrievedArticles = computed(() => {
  const citedUrns = new Set((primaryAnswer.value?.citations ?? []).map(c => c.article_urn))
  return retrievedSources.value.filter(a => !citedUrns.has(a.urn))
})

// Citation hover line
const qaSessionGridRef = ref<HTMLElement | null>(null)
const citationSvgRef = ref<SVGSVGElement | null>(null)
const citationLine = ref<{ x1: number; y1: number; x2: number; y2: number } | null>(null)

function getCitationUrnFromHref(href: string): string | null {
  return resolveQaSourceHref(href)?.urn ?? null
}

function drawCitationLine(anchorEl: HTMLElement, urn: string) {
  const grid = qaSessionGridRef.value
  if (!grid) return
  const card = grid.querySelector<HTMLElement>(`.citation-source-card[data-citation-urn="${CSS.escape(urn)}"]`)
  if (!card) return

  const gridRect = grid.getBoundingClientRect()
  const anchorRect = anchorEl.getBoundingClientRect()
  const cardRect = card.getBoundingClientRect()

  citationLine.value = {
    x1: anchorRect.right - gridRect.left,
    y1: anchorRect.top + anchorRect.height / 2 - gridRect.top,
    x2: cardRect.left - gridRect.left,
    y2: cardRect.top + cardRect.height / 2 - gridRect.top,
  }
  card.classList.add('citation-source-card--active')
}

function clearCitationLine() {
  citationLine.value = null
  const grid = qaSessionGridRef.value
  grid?.querySelectorAll('.citation-source-card--active').forEach(el => el.classList.remove('citation-source-card--active'))
}

function getAnchorCitationUrn(a: HTMLElement): string | null {
  const annotated = a.getAttribute('data-citation-urn')
  if (annotated) return annotated
  // Fallback: resolve from href in case the anchor wasn't annotated at render time.
  const href = a.getAttribute('href') ?? ''
  return resolveQaSourceHref(href)?.urn ?? null
}

function handleAnswerMouseOver(e: MouseEvent) {
  const a = (e.target as HTMLElement).closest<HTMLElement>('a[href]')
  if (!a) return
  const urn = getAnchorCitationUrn(a)
  if (!urn) return
  drawCitationLine(a, urn)
}

function handleAnswerMouseOut(e: MouseEvent) {
  const a = (e.target as HTMLElement).closest<HTMLElement>('a[href]')
  if (!a) return
  if (getAnchorCitationUrn(a)) clearCitationLine()
}
const hasDualAnswerMode = computed(() => Boolean(primaryAnswer.value && secondaryAnswer.value && qaResult.value?.dual_answer_feedback))
const isAdvancedMode = computed(() => qaMode.value === 'advanced')
const ragUsedForResponse = computed(() => primaryAnswer.value?.rag_used ?? ragEnabled.value)
const qaPlaceholder = computed(() => {
  if (isAdvancedMode.value) {
    return t('foodScholarHome.qa.placeholder.advanced')
  }
  return t('foodScholarHome.qa.placeholder.default')
})

const chatSettingsItems = computed<DropdownMenuItem[]>(() => [
  {
    label: t('foodScholarHome.qa.mode.advanced'),
    icon: 'i-lucide-sliders-horizontal',
    type: 'checkbox',
    checked: isAdvancedMode.value,
    onUpdateChecked: (checked: boolean) => {
      qaMode.value = checked ? 'advanced' : 'simple'
    }
  }
])

const answerALabel = computed(() => qaResult.value?.dual_answer_feedback?.answer_a_label || t('foodScholarHome.qa.answerPrimaryModelResponse'))
const answerBLabel = computed(() => qaResult.value?.dual_answer_feedback?.answer_b_label || t('foodScholarHome.qa.answerAlternativeModelResponse'))

const feedbackRequestId = computed(() => {
  return qaResult.value?.dual_answer_feedback?.request_id || qaResult.value?.request_id || ''
})

const singleAnswerFeedbackEnabled = computed(() => {
  return Boolean(primaryAnswer.value && !hasDualAnswerMode.value && feedbackRequestId.value)
})

const modelOptions = ref<ModelOption[]>([
  {
    value: AUTO_MODEL_VALUE,
    label: t('foodScholarHome.qa.model.auto'),
    provider: t('foodScholarHome.qa.model.system'),
    icon: 'i-lucide-sparkles'
  }
])

const selectedModelOption = computed<ModelOption>(() => {
  return modelOptions.value.find(option => option.value === selectedModelValue.value) || modelOptions.value[0]
})

const selectedTopKOption = computed<TopKOption>(() => {
  return topKOptions.value.find(option => option.value === Number(topK.value)) || topKOptions.value[1]
})

const selectedExpertiseOption = computed<ExpertiseOption>(() => {
  return expertiseOptions.value.find(option => option.value === expertiseLevel.value) || expertiseOptions.value[1]
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
    topK.value = topKOptions.value.some(option => option.value === parsed)
      ? parsed
      : topKOptions.value[1].value
  }
})

const selectedExpertiseValue = computed<string>({
  get: () => selectedExpertiseOption.value.value,
  set: (value) => {
    expertiseLevel.value = expertiseOptions.value.some(option => option.value === value)
      ? value
      : expertiseOptions.value[1].value
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
      fl: ['id', 'urn', 'title', 'abstract', 'description', 'content', 'authors', 'tags', 'ai_tags', 'topics', 'venue', 'publication_year', 'category', 'ai_category'],
      fields: ['category', 'ai_category', 'tags', 'ai_tags', 'topics'],
      facet_limit: 50
    })

    const results = response.result.results || []

    allArticles.value = results.map(mapArticleToHome)
    facets.value = (response.result.facets || {}) as Record<string, Array<{ value: string, count: number }>>
  } catch (err: unknown) {
    articlesError.value = getErrorMessage(err, t('foodScholarHome.errors.failedToLoadPopularArticles'))
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

const loadQaQuestions = async () => {
  try {
    const result = await foodscholarApi.listQuestions()
    quickQuestions.value = normalizeQuestionList(result)
  } catch (err) {
    console.warn('Failed to fetch QA suggested questions', err)
    quickQuestions.value = []
  }
}

const buildBasePayload = (question: string): QaAskRequest => {
  const payload: QaAskRequest = {
    question,
    mode: qaMode.value,
    rag_enabled: ragEnabled.value,
    language: 'en'
  }

  if (ragEnabled.value) {
    payload.retriever = selectedRetriever.value
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

  return payload
}

const normalizeQaCitations = (citations: QaCitation[]): QaCitation[] => {
  return citations.map((c) => {
    const raw = c as unknown as Record<string, unknown>
    return {
      ...c,
      article_urn: c.article_urn || (raw.source_id as string) || '',
      article_title: c.article_title || (raw.source_title as string) || '',
      source_type: c.source_type || (raw.source_type as QaCitation['source_type']) || null,
    }
  })
}

const normalizeQaResult = (result: QaAskResult): QaAskResult => {
  const normalizeAnswer = (answer: typeof result.primary_answer) => ({
    ...answer,
    citations: normalizeQaCitations(answer.citations ?? [])
  })
  return {
    ...result,
    primary_answer: normalizeAnswer(result.primary_answer),
    secondary_answer: result.secondary_answer ? normalizeAnswer(result.secondary_answer) : result.secondary_answer
  }
}

const handleQaResponse = (result: QaAskResult, basePayload: QaAskRequest) => {
  if (result.needs_clarification && result.clarification) {
    pendingClarification.value = result.clarification
    qaThreadId.value = result.qa_thread_id ?? null
    pendingPayload.value = basePayload
    clarificationSelectedValues.value = []
    clarificationFreeText.value = ''
    qaResult.value = null
  } else {
    pendingClarification.value = null
    qaThreadId.value = null
    pendingPayload.value = null
    qaResult.value = normalizeQaResult(result)
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
  pendingClarification.value = null
  qaThreadId.value = null
  pendingPayload.value = null
  selectedPreferredAnswer.value = null
  singleAnswerFeedbackSubmitted.value = false
  showNegativeFeedbackReasons.value = false
  selectedNegativeReason.value = null
  negativeFeedbackComment.value = ''

  try {
    const payload = buildBasePayload(question)
    pendingQuestion.value = question
    const result = await foodscholarApi.askQuestion(payload)
    handleQaResponse(result, payload)
  } catch (err: unknown) {
    qaError.value = getErrorMessage(err, t('foodScholarHome.errors.failedToGetQaResponse'))
  } finally {
    asking.value = false
    chatQuery.value = ''
  }
}

const submitClarification = async () => {
  if (!pendingClarification.value || !pendingPayload.value || asking.value) return

  const clarif = pendingClarification.value
  asking.value = true
  qaError.value = null

  try {
    const clarificationResponse: QaClarificationResponse = {
      question_id: clarif.id,
      selected_values: [...clarificationSelectedValues.value],
      free_text: clarificationFreeText.value.trim() || null
    }

    const payload: QaAskRequest = {
      ...pendingPayload.value,
      qa_thread_id: qaThreadId.value ?? undefined,
      clarification_response: clarificationResponse
    }

    const result = await foodscholarApi.askQuestion(payload)
    handleQaResponse(result, pendingPayload.value)
  } catch (err: unknown) {
    qaError.value = getErrorMessage(err, t('foodScholarHome.errors.failedToGetQaResponse'))
  } finally {
    asking.value = false
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
    qaError.value = getErrorMessage(err, t('foodScholarHome.errors.failedToSubmitFeedback'))
  } finally {
    feedbackSubmitting.value = false
  }
}

const submitSingleAnswerFeedback = async (helpful: boolean) => {
  if (!feedbackRequestId.value || feedbackSubmitting.value) return

  if (!helpful) {
    showNegativeFeedbackReasons.value = true
    return
  }

  feedbackSubmitting.value = true

  try {
    await foodscholarApi.submitFeedback({
      request_id: feedbackRequestId.value,
      preferred_answer: 'a',
      helpfulness: 'helpful',
      target_answer: 'overall',
      reason: 'User marked single answer as helpful.'
    })

    singleAnswerFeedbackSubmitted.value = true
  } catch (err: unknown) {
    qaError.value = getErrorMessage(err, t('foodScholarHome.errors.failedToSubmitFeedback'))
  } finally {
    feedbackSubmitting.value = false
  }
}

const selectNegativeReason = (reason: string) => {
  selectedNegativeReason.value = reason
}

const submitNegativeFeedback = async () => {
  if (!feedbackRequestId.value || feedbackSubmitting.value || !selectedNegativeReason.value) return

  feedbackSubmitting.value = true

  const comment = negativeFeedbackComment.value.trim()
  const reason = comment
    ? `${selectedNegativeReason.value}: ${comment}`
    : selectedNegativeReason.value

  try {
    await foodscholarApi.submitFeedback({
      request_id: feedbackRequestId.value,
      preferred_answer: 'a',
      helpfulness: 'not_helpful',
      target_answer: 'overall',
      reason
    })

    singleAnswerFeedbackSubmitted.value = true
    showNegativeFeedbackReasons.value = false
  } catch (err: unknown) {
    qaError.value = getErrorMessage(err, t('foodScholarHome.errors.failedToSubmitFeedback'))
  } finally {
    feedbackSubmitting.value = false
  }
}

const askQuickQuestion = (question: string) => {
  chatQuery.value = question
  askScholarQA(question)
}

const normalizeQuestionList = (result: { questions?: unknown } | string[] | null | undefined): string[] => {
  if (Array.isArray(result)) {
    return result
      .filter((question): question is string => typeof question === 'string')
      .map(question => question.trim())
      .filter(Boolean)
  }

  const rawQuestions = (result && typeof result === 'object' && Array.isArray(result.questions))
    ? result.questions
    : []

  return rawQuestions
    .filter((question): question is string => typeof question === 'string')
    .map(question => question.trim())
    .filter(Boolean)
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
    unknown: t('foodScholarHome.qa.model.custom')
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
    category: article.category || article.ai_category || CATEGORY_UNCATEGORIZED,
    ai_category: article.ai_category,
    excerpt: getExcerpt(article, 220),
    authors: article.authors || [],
    tags: article.tags || [],
    ai_tags: article.ai_tags || [],
    topics: article.topics || [],
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

  const sanitized = DOMPurify.sanitize(rawHtml)
  return annotateCitationAnchors(sanitized)
}

// Inject data-citation-urn / data-citation-type onto each anchor whose href
// points to a known QA source (article / guide / guideline). Doing this once,
// during render, makes hover-to-sidebar matching robust to baseURL prefixes,
// URL-encoding differences, and future href shapes.
const annotateCitationAnchors = (html: string): string => {
  if (!html || typeof window === 'undefined') return html
  const container = document.createElement('div')
  container.innerHTML = html
  container.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href') ?? ''
    const resolved = resolveQaSourceHref(href)
    if (!resolved) return
    anchor.setAttribute('data-citation-urn', resolved.urn)
    anchor.setAttribute('data-citation-type', resolved.sourceType)
  })
  return container.innerHTML
}

const formatDateTime = (dateTime?: string): string => {
  if (!dateTime) return t('foodScholarHome.common.justNow')

  const parsed = new Date(dateTime)
  if (Number.isNaN(parsed.getTime())) return t('foodScholarHome.common.justNow')

  return parsed.toLocaleString(locale.value, {
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

watch(popularArticleTopics, (newTopics) => {
  if (newTopics.length > 0 && !newTopics.includes(selectedPopularTopic.value)) {
    selectedPopularTopic.value = CATEGORY_ALL
  }
})

watch(libraryArticleTopics, (newTopics) => {
  if (newTopics.length > 0 && !newTopics.includes(librarySelectedTopic.value)) {
    librarySelectedTopic.value = CATEGORY_ALL
    libraryTopicArticles.value = []
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
      label: t('foodScholarHome.qa.model.auto'),
      provider: t('foodScholarHome.qa.model.system'),
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

watch(pageTab, (tab) => {
  if (tab === 'resources') {
    loadLibraryMap()
    loadLibraryTextbooks()
    loadLibraryTopicFacets()
  }
})

onMounted(async () => {
  await Promise.all([
    loadPopularArticles(),
    loadQaModels(),
    loadQaQuestions()
  ])

  if (pageTab.value === 'resources') {
    loadLibraryMap()
    loadLibraryTextbooks()
    loadLibraryTopicFacets()
  }

  setupObserver()
  document.addEventListener('mousedown', handleLibraryClickOutside)
})

onUnmounted(() => {
  observer?.disconnect()
  document.removeEventListener('mousedown', handleLibraryClickOutside)
  if (libraryAutocompleteTimer) clearTimeout(libraryAutocompleteTimer)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

@font-face {
  font-family: 'ClaudeDisplay';
  src: url('https://assets-proxy.anthropic.com/claude-ai/v2/assets/v1/c66fc489e-C-BHYa_K.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}

.font-claude {
  font-family: 'ClaudeDisplay', 'Cormorant Garamond', Georgia, serif;
  font-weight: normal;
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

.qa-session-layout {
  min-height: 100%;
}

.qa-source-sidebar {
  position: absolute;
  right: 0;
  top: 0.25rem;
  width: clamp(12rem, calc((100% - 42rem) / 2 - 1.5rem), 18rem);
  max-width: 18rem;
}

.qa-advanced-panel {
  overflow: hidden;
}

.qa-advanced-panel-enter-active,
.qa-advanced-panel-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms ease,
    max-height 260ms ease,
    margin-top 260ms ease,
    padding-top 260ms ease,
    padding-bottom 260ms ease,
    border-color 260ms ease;
}

.qa-advanced-panel-enter-from,
.qa-advanced-panel-leave-to {
  border-color: transparent;
  max-height: 0;
  margin-top: 0;
  opacity: 0;
  padding-bottom: 0;
  padding-top: 0;
  transform: translateY(-0.5rem);
}

.qa-advanced-panel-enter-to,
.qa-advanced-panel-leave-from {
  max-height: 40rem;
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


.chat-send-button {
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.chat-settings-button.is-active {
  border-color: var(--color-brand-300);
  background: var(--color-brand-50);
  color: var(--color-brand-600);
}

.dark .chat-settings-button.is-active {
  border-color: color-mix(in srgb, var(--color-brand-500) 55%, transparent);
  background: color-mix(in srgb, var(--color-brand-950) 35%, transparent);
  color: var(--color-brand-300);
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

:deep(.qa-answer-markdown a[href*="/foodscholar/urn:"], .qa-answer-markdown a[href*="/articles/urn:"]) {
  color: rgb(156 163 175);
  text-decoration: none;
  font-weight: 500;
}

:deep(.qa-answer-markdown a[href*="/foodscholar/urn:"]:hover, .qa-answer-markdown a[href*="/articles/urn:"]:hover) {
  color: rgb(107 114 128);
  text-decoration: underline;
}

:deep(.dark .qa-answer-markdown a[href*="/foodscholar/urn:"], .dark .qa-answer-markdown a[href*="/articles/urn:"]) {
  color: rgb(161 161 170);
}

:deep(.dark .qa-answer-markdown a[href*="/foodscholar/urn:"]:hover, .dark .qa-answer-markdown a[href*="/articles/urn:"]:hover) {
  color: rgb(212 212 216);
}

.citation-hover-line {
  stroke: var(--color-brand-400, #60a5fa);
  stroke-width: 1.5;
  stroke-dasharray: 5 4;
  opacity: 0.7;
  animation: citation-dash 0.3s ease-out;
}

.citation-source-card--active {
  border-color: var(--color-brand-300, #93c5fd) !important;
  background-color: rgb(239 246 255 / 0.9) !important;
}

.dark .citation-source-card--active {
  border-color: var(--color-brand-700, #1d4ed8) !important;
  background-color: rgb(30 58 138 / 0.2) !important;
}

@keyframes citation-dash {
  from { stroke-dashoffset: 40; opacity: 0; }
  to { stroke-dashoffset: 0; opacity: 0.7; }
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

.session-answer-enter {
  animation: session-slide-up 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes session-slide-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.library-map-wrap {
  position: relative;
  width: min(100%, 46rem);
  margin-inline: auto;
  overflow: hidden;
  height: clamp(18rem, 30vw, 25rem);
}

.library-map-wrap > * {
  height: 100%;
  min-height: 0 !important;
}

.library-map-wrap :deep(.relative),
.library-map-wrap :deep(.europe-guides-map-host),
.library-map-wrap :deep([class*="min-h-"]) {
  min-height: unset !important;
  height: 100%;
}
</style>
