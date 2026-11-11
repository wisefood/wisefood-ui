<template>
  <!-- Exactly the screen below the site header (the `app` layout): the start
       screen, the conversation and the library each scroll in their own
       pane, so the header, the tabs and the question box stay in place. -->
  <div class="flex min-h-0 flex-1 flex-col bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <AppPageHeader
      back-to="/dashboard"
      :back-label="t('foodScholarHome.backToDashboard')"
      brand-title="FoodScholar"
      brand-class="text-brand-500 dark:text-brand-400"
      :subtitle="t('foodScholarHome.subtitle')"
      compact
    />

    <!-- Page tab switcher: Ask and Library switch in place -->
    <FoodscholarSectionTabs
      :active="pageTab"
      @select="selectSection"
    />

    <!-- QA tab -->
    <template v-if="pageTab === 'qa'">
      <!-- Idle state: composer centered vertically in remaining viewport -->
      <div
        v-if="!hasActiveSession"
        class="qa-idle-shell flex-1 min-h-0 overflow-y-auto flex flex-col items-center px-4 pt-10 sm:pt-14 pb-16 sm:pb-24"
      >
        <div class="w-full max-w-2xl lg:max-w-3xl my-auto">
          <div class="mb-10 text-center">
            <h2 class="text-3xl font-claude text-gray-900 dark:text-white mb-2 inline-flex items-center justify-center gap-2 flex-wrap">
              <img ref="figImgRef" src="/fig.png" alt="" aria-hidden="true" class="fig-mark inline-block h-[1.2em] w-auto align-[-0.05em] select-none cursor-pointer" draggable="false" @load="onFigLoad" @mouseenter="replayFigTilt" :class="{ 'fig-mark--animate': figLoaded }" />
              <span>{{ qaHeading }}</span>
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('foodScholarHome.qa.tagline') }}
            </p>
          </div>

          <!-- The question box, with its options in a tray beneath it. -->
          <div class="qa-composer-stack">
            <FoodscholarComposerBox
              ref="idleComposerRef"
              v-model="chatQuery"
              :disabled="asking"
              :busy="asking"
              :placeholder="composerIntent === 'claim' ? t('foodScholarLearn.intents.claimPlaceholder') : qaPlaceholder"
              :level-items="explanationLevelItems"
              :level-label="selectedExpertiseOption.label"
              :level-title="selectedExpertiseOption.description"
              :level-icon="selectedExpertiseOption.icon"
              :advanced-active="isAdvancedMode"
              :advanced-label="t('foodScholarHome.qa.advanced.title')"
              :send-label="t('foodScholarLearn.composer.send')"
              class="relative z-10"
              @submit="submitIdleComposer"
              @toggle-advanced="toggleAdvancedMode"
              @focus="composerFocused = true"
              @blur="composerFocused = false"
            >
              <template #leading>
                <button
                  v-if="composerIntent === 'claim'"
                  type="button"
                  class="qa-claim-pill"
                  :aria-label="t('foodScholarLearn.composer.leaveClaim')"
                  @click="clearClaimIntent"
                >
                  <UIcon name="i-lucide-search-check" class="w-4 h-4" />
                  <span class="hidden min-[400px]:inline">{{ t('foodScholarLearn.intents.claim') }}</span>
                  <UIcon name="i-lucide-x" class="w-3.5 h-3.5 opacity-70" />
                </button>
              </template>
            </FoodscholarComposerBox>

            <!-- What do you want to do? Options in a tray under the box, for
                 people who do not arrive with a research question. Each
                 opens a short list of things to ask. -->
            <div
              class="qa-composer-tray"
              data-flows="foodscholar-qa-intents"
            >
              <button
                type="button"
                :aria-pressed="selectedTool === 'claim'"
                :class="['qa-tray-item', { 'is-active': selectedTool === 'claim' }]"
                @click="openTool('claim')"
              >
                <UIcon name="i-lucide-search-check" class="w-4 h-4" />
                {{ t('foodScholarLearn.intents.claim') }}
              </button>
              <button
                type="button"
                :aria-pressed="selectedTool === 'everyday'"
                :class="['qa-tray-item', { 'is-active': selectedTool === 'everyday' }]"
                @click="openTool('everyday')"
              >
                <UIcon name="i-lucide-utensils" class="w-4 h-4" />
                {{ t('foodScholarLearn.intents.everyday') }}
              </button>
            </div>
          </div>

          <Transition name="qa-advanced-panel">
            <FoodscholarComposerToolPanel
              v-if="activeTool"
              :key="activeTool"
              :tool="activeTool"
              :suggested="quickQuestions"
              @use="useSuggestion"
              @close="closeTool"
            />
          </Transition>

          <!-- Advanced panel -->
          <Transition name="qa-advanced-panel">
            <div
              v-if="isAdvancedMode"
              data-flows="foodscholar-qa-advanced-panel"
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
                  <p v-if="!modelsLoading && modelOptions.length <= 1" class="mt-2 text-[0.6875rem] text-amber-700 dark:text-amber-300">{{ t('foodScholarHome.qa.model.noProviderModels') }}</p>
                  <p v-else class="mt-2 text-[0.6875rem] text-gray-500 dark:text-gray-400">{{ t('foodScholarHome.qa.model.autoHint') }}</p>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">{{ t('foodScholarHome.qa.advanced.sourceDepth') }}</label>
                  <USelectMenu v-model="selectedTopKValue" :items="topKOptions" class="w-full" size="lg" :ui="advancedSelectUi" :content="advancedSelectContent" value-key="value" label-key="label" :search-input="false" :disabled="asking || !ragEnabled">
                    <template #leading><UIcon :name="selectedTopKOption.icon" class="w-4 h-4 text-gray-500 dark:text-gray-400" /></template>
                  </USelectMenu>
                  <p class="mt-2 text-[0.6875rem] text-gray-500 dark:text-gray-400">{{ ragEnabled ? selectedTopKOption.description : t('foodScholarHome.qa.advanced.enableRetrievalToAdjust') }}</p>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">{{ t('foodScholarHome.qa.advanced.explanationStyle') }}</label>
                  <USelectMenu v-model="selectedExpertiseValue" :items="expertiseOptions" class="w-full" size="lg" :ui="advancedSelectUi" :content="advancedSelectContent" value-key="value" label-key="label" :search-input="false" :disabled="asking">
                    <template #leading><UIcon :name="selectedExpertiseOption.icon" class="w-4 h-4 text-gray-500 dark:text-gray-400" /></template>
                  </USelectMenu>
                  <p class="mt-2 text-[0.6875rem] text-gray-500 dark:text-gray-400">{{ selectedExpertiseOption.description }}</p>
                </div>
              </div>
            </div>
          </Transition>

          <!-- See what FoodScholar can do: one card per kind of help. -->
          <div class="mt-10" data-flows="foodscholar-qa-try">
            <p class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 px-1">
              <UIcon name="i-lucide-lightbulb" class="w-4 h-4 text-amber-500" />
              {{ t('foodScholarLearn.composer.tryTitle') }}
            </p>
            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                v-for="card in tryCards"
                :key="card.id"
                type="button"
                class="qa-try-card group"
                @click="card.run()"
              >
                <span class="flex items-start justify-between gap-2">
                  <span :class="['w-9 h-9 rounded-xl flex items-center justify-center', card.accent]">
                    <UIcon :name="card.icon" class="w-5 h-5" />
                  </span>
                  <span class="qa-try-pill">{{ t('foodScholarLearn.composer.try') }}</span>
                </span>
                <span class="mt-3 block text-[0.9375rem] font-semibold text-gray-900 dark:text-white">{{ card.title }}</span>
                <span class="mt-1 block text-sm text-gray-600 dark:text-gray-400 font-light leading-snug">{{ card.body }}</span>
              </button>
            </div>
          </div>

          <div
            v-if="quickQuestions.length"
            class="mt-6 flex flex-wrap justify-center gap-2"
            data-flows="foodscholar-qa-suggestions"
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

      <!-- Active session: the conversation scrolls in its own pane, the
           question box stays below it -->
      <div v-else class="flex-1 min-h-0 flex flex-col">
        <!-- Thread bar: the memory made visible, and a fresh start. Pinned
             above the conversation pane, so it is always in reach however
             far down a long conversation the reader is. -->
        <div v-if="(qaThreadId || threadMemorySuggestions.length) && hasActiveSession" class="qa-thread-bar px-4 pt-3" data-flows="foodscholar-qa-thread-bar">
          <div class="max-w-2xl lg:max-w-3xl mx-auto">
            <div class="flex items-center justify-between gap-2 px-1">
              <button
                v-if="hasCarriedContext"
                type="button"
                class="inline-flex items-center gap-1.5 min-h-8 text-[0.6875rem] text-gray-500 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                :aria-expanded="memoryPanelOpen"
                @click="memoryPanelOpen = !memoryPanelOpen"
              >
                <UIcon name="i-lucide-brain" class="w-3.5 h-3.5" />
                {{ t('foodScholarHome.qa.thread.remembers') }}
                <UIcon :name="memoryPanelOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-3 h-3" />
              </button>
              <span v-else />
              <span class="flex items-center gap-2">
              <!-- Narrow screens have no left rail: the nudges open from here,
                   in reach however far down the conversation the reader is. -->
              <button
                v-if="threadMemorySuggestions.length"
                type="button"
                class="xl:hidden inline-flex items-center gap-1.5 min-h-8 rounded-lg px-2.5 py-1 text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
                :aria-expanded="memoryNudgesOpen"
                data-flows="foodscholar-qa-memory-toggle"
                @click="memoryNudgesOpen = !memoryNudgesOpen"
              >
                <UIcon name="i-lucide-brain" class="w-3.5 h-3.5 shrink-0" />
                {{ t('foodScholarHome.qa.memory.toggle', { count: pendingMemorySuggestions.length || threadMemorySuggestions.length }) }}
                <UIcon :name="memoryNudgesOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-3 h-3" />
              </button>
              <button
                v-if="qaThreadId"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-zinc-200 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                data-flows="foodscholar-qa-new-thread"
                @click="startNewThread"
              >
                <UIcon name="i-lucide-plus" class="w-3.5 h-3.5 shrink-0" />
                {{ t('foodScholarHome.qa.thread.new') }}
              </button>
              </span>
            </div>

            <div v-if="memoryNudgesOpen && threadMemorySuggestions.length" class="xl:hidden mt-2 max-h-[35dvh] overflow-y-auto overscroll-contain" data-flows="foodscholar-qa-memory">
              <FoodscholarMemoryNudges
                :suggestions="threadMemorySuggestions"
                :state="memoryChipState"
                @decide="handleMemoryDecision"
              />
            </div>

            <!-- What FoodScholar is carrying from this conversation: opens
                 under the bar, scrolling on its own when long. -->
            <div v-if="memoryPanelOpen && carriedContext" class="mt-2 max-h-[35dvh] overflow-y-auto overscroll-contain px-4 py-3 rounded-2xl border border-gray-200 dark:border-zinc-700/70 bg-white dark:bg-zinc-900 space-y-2">
              <p v-if="carriedContext.summary" class="text-xs text-gray-600 dark:text-zinc-300 whitespace-pre-line">{{ carriedContext.summary }}</p>
              <div v-if="carriedContext.notes?.length" class="flex flex-wrap gap-1.5">
                <span
                  v-for="(note, nIdx) in carriedContext.notes.slice(0, 8)"
                  :key="`cnote-${nIdx}`"
                  class="inline-flex items-center gap-1 px-2 py-0.5 text-[0.6875rem] rounded-full border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300"
                >
                  <UIcon :name="note.kind === 'gap' ? 'i-lucide-circle-alert' : note.kind === 'lead' ? 'i-lucide-compass' : 'i-lucide-check'" class="w-2.5 h-2.5 opacity-70" />
                  {{ note.text }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div
          ref="threadScrollRef"
          :class="['qa-thread-scroll flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-2', qaThreadId && hasActiveSession ? 'pt-4' : 'pt-6']"
          :style="{ '--qa-thread-h': `${threadPaneHeight}px` }"
        >
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
          <div class="flex flex-col min-w-0 w-full max-w-2xl lg:max-w-3xl mx-auto">
          <!-- Earlier exchanges of this thread, in full, in the page's own
               scroll: one conversation reading top to bottom, like a chat. -->
          <div v-if="threadTurns.length" class="space-y-5 mb-8">
            <template v-for="(turn, tIdx) in threadTurns" :key="`turn-${turn.result.request_id || tIdx}`">
              <div class="flex justify-end">
                <div class="chat-flow-bubble chat-flow-bubble-user">
                  <p v-if="turn.result.ui_claim" class="text-[0.625rem] uppercase tracking-widest font-semibold text-brand-200 mb-1">{{ t('foodScholarLearn.claim.youChecked') }}</p>
                  <p class="text-sm leading-relaxed">{{ turn.question }}</p>
                </div>
              </div>
              <FoodscholarClaimVerdictRow
                v-if="turn.result.ui_claim"
                :verdict="turn.result.ui_claim.verdict"
                :mix="sourceMix(turn.result.retrieved_sources ?? turn.result.retrieved_articles)"
              />
              <div class="chat-flow-bubble chat-flow-bubble-assistant">
                <div class="qa-answer-markdown text-sm text-gray-800 dark:text-gray-200 prose prose-sm dark:prose-invert max-w-none" @click="handleMarkdownClick" v-html="renderMarkdown(turn.result.primary_answer?.answer || '')" />
              </div>
            </template>
          </div>

          <!-- Error -->
          <div v-if="qaError" class="mb-4 p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50/90 dark:bg-red-900/20">
            <p class="text-sm text-red-700 dark:text-red-300">{{ qaError }}</p>
          </div>

          <!-- Live pipeline: reasoning steps stream in, then the answer tokens -->
          <div
            v-if="asking"
            data-qa-exchange="live"
            :class="['space-y-4 session-answer-enter qa-exchange', { 'qa-exchange-fill': threadTurns.length > 0 }]"
          >
            <div class="flex justify-end">
              <div class="chat-flow-bubble chat-flow-bubble-user">
                <p class="text-[0.625rem] uppercase tracking-widest font-semibold text-brand-200 mb-1">{{ pendingClaim ? t('foodScholarLearn.claim.youChecked') : t('foodScholarHome.qa.youAsked') }}</p>
                <p class="text-sm leading-relaxed">{{ pendingQuestion || chatQuery }}</p>
              </div>
            </div>
            <FoodscholarClaimVerdictRow
              v-if="pendingClaim"
              :verdict="liveVerdict"
              checking
            />

            <!-- Open while researching; folds away as the first words of the
                 answer arrive, so the settled answer (steps folded) lands in
                 the same place instead of jumping up. -->
            <FoodscholarReasoningSteps
              v-if="liveSteps.length"
              :steps="liveSteps"
              :live="!liveAnswerShown"
              start-open
            />

            <!-- The answer as it streams: same markdown surface as the settled
                 answer, minus the reveal animation (it would restart per token). -->
            <div v-if="liveAnswerShown" class="chat-flow-bubble chat-flow-bubble-assistant">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-semibold text-gray-900 dark:text-white">{{ t('foodScholarHome.qa.answer') }}</h4>
                <UIcon name="i-lucide-loader-2" class="w-3.5 h-3.5 animate-spin text-gray-400 dark:text-zinc-500" />
              </div>
              <div class="qa-answer-markdown text-sm text-gray-800 dark:text-gray-200 prose prose-sm dark:prose-invert max-w-none" @click="handleMarkdownClick" @mouseover="handleAnswerMouseOver" @mouseout="handleAnswerMouseOut" v-html="renderMarkdown(liveAnswerShown)" />
            </div>

            <!-- Skeleton only until the first pipeline event arrives (or when the
                 gateway lacks the streaming route and we fell back to one-shot). -->
            <div v-else-if="!liveSteps.length" class="chat-flow-bubble chat-flow-bubble-assistant">
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
              </div>
            </div>
          </div>

          <!-- Clarification panel -->
          <div v-if="pendingClarification && !asking" class="space-y-4 session-answer-enter">
            <div class="flex justify-end">
              <div class="chat-flow-bubble chat-flow-bubble-user">
                <p class="text-[0.625rem] uppercase tracking-widest font-semibold text-brand-200 mb-1">{{ t('foodScholarHome.qa.youAsked') }}</p>
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
                  v-for="opt in (pendingClarification.options ?? (pendingClarification.input_type === 'boolean' ? [{ label: t('foodScholarHome.qa.clarify.yes'), value: 'true' }, { label: t('foodScholarHome.qa.clarify.no'), value: 'false' }] : []))"
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
                  :placeholder="t('foodScholarHome.qa.clarify.yourAnswer')"
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
                  :placeholder="t('foodScholarHome.qa.clarify.otherOptional')"
                  @keydown.enter.prevent="submitClarification"
                />
              </div>

              <div class="flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  @click="pendingClarification = null; qaError = null"
                >{{ t('foodScholarHome.qa.clarify.skip') }}</button>
                <button
                  type="button"
                  :disabled="clarificationSelectedValues.length === 0 && !String(clarificationFreeText ?? '').trim()"
                  class="px-4 py-1.5 text-sm font-medium rounded-full bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  @click="submitClarification"
                >{{ t('foodScholarHome.qa.clarify.continueBtn') }}</button>
              </div>
            </div>
          </div>

          <!-- Answer -->
          <div
            v-if="qaResult && primaryAnswer"
            ref="latestExchangeRef"
            data-qa-exchange="settled"
            :class="['space-y-4 session-answer-enter qa-exchange', { 'qa-exchange-fill': threadTurns.length > 0, 'qa-settled-quiet': settledAfterStream }]"
            data-flows="foodscholar-qa-answer"
          >
            <div class="flex justify-end">
              <div class="chat-flow-bubble chat-flow-bubble-user">
                <p class="text-[0.625rem] uppercase tracking-widest font-semibold text-brand-200 mb-1">{{ qaResult.ui_claim ? t('foodScholarLearn.claim.youChecked') : t('foodScholarHome.qa.youAsked') }}</p>
                <p class="text-sm leading-relaxed">{{ qaResult.question }}</p>
              </div>
            </div>
            <FoodscholarClaimVerdictRow
              v-if="qaResult.ui_claim"
              :verdict="qaResult.ui_claim.verdict"
              :mix="sourceMix(qaResult.retrieved_sources ?? qaResult.retrieved_articles)"
            />

            <!-- How the answer was researched: collapsed once settled, reopenable -->
            <FoodscholarReasoningSteps
              v-if="answerReasoningSteps.length"
              :steps="answerReasoningSteps"
            />

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
                <!-- A popover, not a tooltip: a tooltip never opens on tap. -->
                <UPopover :mode="hasHover ? 'hover' : 'click'" :ui="{ content: 'max-w-xs px-3 py-2 text-xs leading-5 text-gray-700 dark:text-gray-200' }">
                  <span role="button" tabindex="0" class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 cursor-help">
                    {{ t('foodScholarHome.qa.confidence') }}: {{ primaryAnswer.confidence || t('foodScholarHome.qa.notAvailable') }}
                    <UIcon name="i-lucide-help-circle" class="w-3 h-3" />
                  </span>
                  <template #content>
                    <p>{{ t('foodScholarHome.qa.confidenceExplainer') }}</p>
                  </template>
                </UPopover>
              </div>
              <div class="qa-answer-markdown answer-reveal-ltr text-sm text-gray-800 dark:text-gray-200 prose prose-sm dark:prose-invert max-w-none" style="--answer-reveal-delay: 40ms" @click="handleMarkdownClick" @mouseover="handleAnswerMouseOver" @mouseout="handleAnswerMouseOut" v-html="renderMarkdown(primaryAnswer.answer)" />

              <!-- The boundary has to be on the answer itself: this is the surface
                   where people ask health questions about their own bodies. -->
              <p class="mt-3 flex items-start gap-1.5 text-[0.6875rem] text-gray-400 dark:text-gray-500">
                <UIcon name="i-lucide-info" class="w-3 h-3 mt-0.5 shrink-0" />
                {{ t('foodScholarHome.qa.medicalBoundary') }}
              </p>

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
            <div
              v-if="qaResult.follow_up_suggestions?.length"
              class="chat-flow-bubble chat-flow-bubble-muted"
              data-flows="foodscholar-qa-followups"
            >
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">{{ t('foodScholarHome.qa.followUpSuggestions') }}</h4>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="suggestion in qaResult.follow_up_suggestions" :key="suggestion" type="button"
                  class="px-3 py-1.5 text-xs rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-brand-100 dark:hover:bg-brand-900/40 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                  @click="askScholarFollowUp(suggestion)"
                >{{ suggestion }}</button>
              </div>
            </div>
          </div>
          <!-- end answer block -->

          <!-- Sources, for the screens with no room for the rail beside the
               answer: the same list the rail shows, folded under the answer
               so it reads as a footnote rather than a second column. -->
          <UCollapsible
            v-if="qaResult && primaryAnswer && (primaryAnswer.citations?.length || uncitedRetrievedArticles.length)"
            class="mt-4 xl:hidden"
            data-flows="foodscholar-qa-sources-inline"
          >
            <button
              type="button"
              class="group flex w-full items-center justify-between rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white"
            >
              <span class="inline-flex items-center gap-2">
                <UIcon name="i-lucide-library" class="w-4 h-4 text-gray-400" />
                {{ t('foodScholarHome.qa.sidebar.inlineTitle', { count: (primaryAnswer.citations?.length || 0) + uncitedRetrievedArticles.length }) }}
              </span>
              <UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
            </button>
            <template #content>
              <div class="mt-2 flex flex-col gap-2">
                <template v-if="primaryAnswer.citations?.length">
                  <p class="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-gray-400 dark:text-zinc-500 px-1">{{ t('foodScholarHome.qa.sidebar.cited') }}</p>
                  <NuxtLink
                    v-for="(citation, idx) in primaryAnswer.citations"
                    :key="`inline-${citation.article_urn}`"
                    :to="getCitationSourcePath(citation)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                    @click="recordCitationOpened(citation.article_urn, getCitationSourceType(citation), 'sidebar')"
                  >
                    <UIcon :name="getQaSourceIcon(citation.article_urn, getCitationSourceType(citation))" class="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                    <span class="min-w-0 flex-1">
                      <span class="block text-xs text-gray-800 dark:text-gray-200 leading-snug">{{ citation.article_title }}</span>
                      <span v-if="citationMetaLine(citation)" class="block text-[0.625rem] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">{{ citationMetaLine(citation) }}</span>
                    </span>
                    <span class="text-[0.6rem] font-bold text-brand-400 dark:text-brand-500 shrink-0 mt-0.5">[{{ idx + 1 }}]</span>
                  </NuxtLink>
                </template>
                <template v-if="uncitedRetrievedArticles.length">
                  <p class="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-gray-400 dark:text-zinc-500 px-1 mt-2">{{ t('foodScholarHome.qa.sidebar.consulted') }}</p>
                  <NuxtLink
                    v-for="article in uncitedRetrievedArticles"
                    :key="`inline-${article.urn}`"
                    :to="getRetrievedSourcePath(article)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 opacity-70 hover:opacity-100 transition-all"
                  >
                    <UIcon :name="getQaSourceIcon(article.urn, article.source_type)" class="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                    <span class="min-w-0 flex-1">
                      <span class="block text-xs text-gray-700 dark:text-gray-300 leading-snug">{{ article.title }}</span>
                      <span v-if="retrievedMetaLine(article)" class="block text-[0.625rem] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">{{ retrievedMetaLine(article) }}</span>
                    </span>
                  </NuxtLink>
                </template>
              </div>
            </template>
          </UCollapsible>

          <!-- Where the conversation ends: watched to offer "jump to latest". -->
          <div ref="threadEndRef" class="qa-thread-end" aria-hidden="true" />

          </div>
          <!-- end center column -->

          <!-- Left panel: what FoodScholar could remember about the asker,
               from every answer of this conversation, beside the answers
               rather than after them. -->
          <aside v-if="threadMemorySuggestions.length" class="qa-memory-rail hidden xl:block pt-1">
            <div class="qa-memory-rail-inner" data-flows="foodscholar-qa-memory">
              <p class="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-gray-400 dark:text-zinc-500 px-1 mb-1">{{ t('foodScholarHome.qa.memory.title') }}</p>
              <FoodscholarMemoryNudges
                :suggestions="threadMemorySuggestions"
                :state="memoryChipState"
                @decide="handleMemoryDecision"
              />
            </div>
          </aside>

          <!-- Right panel: cited sources (titles only) -->
          <aside class="qa-source-sidebar hidden xl:block pt-1">
            <div
              class="qa-source-sidebar-inner"
              data-flows="foodscholar-qa-sources"
            >
            <template v-if="qaResult && primaryAnswer && primaryAnswer.citations?.length">
              <p class="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-gray-400 dark:text-zinc-500 px-1 mb-1">{{ t('foodScholarHome.qa.sidebar.cited') }}</p>
              <NuxtLink
                v-for="(citation, idx) in primaryAnswer.citations"
                :key="citation.article_urn"
                :to="getCitationSourcePath(citation)"
                :data-citation-urn="citation.article_urn"
                target="_blank"
                rel="noopener noreferrer"
                class="citation-source-card flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-600 dark:hover:text-brand-400 transition-colors group"
                @click="recordCitationOpened(citation.article_urn, getCitationSourceType(citation), 'sidebar')"
              >
                <UIcon :name="getQaSourceIcon(citation.article_urn, getCitationSourceType(citation))" class="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                <span class="min-w-0 flex-1">
                  <span class="block text-xs text-gray-800 dark:text-gray-200 leading-snug line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{{ citation.article_title }}</span>
                  <span v-if="citationMetaLine(citation)" class="block text-[0.625rem] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">{{ citationMetaLine(citation) }}</span>
                </span>
                <span class="text-[0.6rem] font-bold text-brand-400 dark:text-brand-500 shrink-0 mt-0.5 ml-auto">[{{ idx + 1 }}]</span>
              </NuxtLink>

              <template v-if="uncitedRetrievedArticles.length">
                <p class="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-gray-400 dark:text-zinc-500 px-1 mt-3 mb-1">{{ t('foodScholarHome.qa.sidebar.consulted') }}</p>
                <NuxtLink
                  v-for="article in uncitedRetrievedArticles"
                  :key="article.urn"
                  :to="getRetrievedSourcePath(article)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 opacity-60 hover:opacity-100 hover:border-gray-300 dark:hover:border-zinc-700 transition-all group"
                >
                  <UIcon :name="getQaSourceIcon(article.urn, article.source_type)" class="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                  <span class="min-w-0 flex-1">
                    <span class="block text-xs text-gray-700 dark:text-gray-300 leading-snug line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{{ article.title }}</span>
                    <span v-if="retrievedMetaLine(article)" class="block text-[0.625rem] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">{{ retrievedMetaLine(article) }}</span>
                  </span>
                </NuxtLink>
              </template>
            </template>
            </div>
          </aside>

          </div><!-- end 3-col grid -->
        </div><!-- end conversation pane -->

        <!-- The question box, below the conversation pane. -->
        <div class="qa-dock px-4">
          <div class="relative max-w-2xl lg:max-w-3xl mx-auto">
          <Transition name="qa-jump">
            <button
              v-if="showJumpToLatest"
              type="button"
              class="qa-jump-latest"
              :aria-label="t('foodScholarLearn.composer.jumpToLatest')"
              :title="t('foodScholarLearn.composer.jumpToLatest')"
              @click="jumpToLatest"
            >
              <UIcon name="i-lucide-arrow-down" class="w-4 h-4" />
            </button>
          </Transition>

          <!-- Advanced panel in session -->
          <Transition name="qa-advanced-panel">
            <div
              v-if="isAdvancedMode"
              data-flows="foodscholar-qa-advanced-panel"
              class="qa-advanced-panel mb-3 rounded-2xl border border-gray-200/80 dark:border-zinc-700/80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm shadow-sm p-4"
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
                    :class="['inline-flex items-center gap-1 px-2.5 py-1 text-[0.6875rem] font-semibold rounded-full transition-colors', retrievalButtonClass(option.value)]"
                    :title="option.description"
                    @click="retrievalMode = option.value"
                  >
                    <UIcon :name="option.icon" class="h-3 w-3" />
                    <span>{{ option.label }}</span>
                  </button>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

          <FoodscholarComposerBox
            v-model="chatQuery"
            docked
            :disabled="asking"
            :busy="asking"
            :placeholder="composerIntent === 'claim' ? t('foodScholarLearn.intents.claimPlaceholder') : (threadTurns.length || qaResult ? t('foodScholarLearn.composer.followUpPlaceholder') : qaPlaceholder)"
            :level-items="explanationLevelItems"
            :level-label="selectedExpertiseOption.label"
            :level-title="selectedExpertiseOption.description"
            :level-icon="selectedExpertiseOption.icon"
            :advanced-active="isAdvancedMode"
            :advanced-label="t('foodScholarHome.qa.advanced.title')"
            :send-label="t('foodScholarLearn.composer.send')"
            @submit="submitDockedComposer"
            @toggle-advanced="toggleAdvancedMode"
            @focus="composerFocused = true"
            @blur="composerFocused = false"
          >
            <template #leading>
              <button
                type="button"
                :class="composerIntent === 'claim' ? 'qa-claim-pill' : 'qa-claim-toggle'"
                :aria-pressed="composerIntent === 'claim'"
                :aria-label="t('foodScholarLearn.intents.claim')"
                :title="t('foodScholarLearn.intents.claim')"
                data-flows="foodscholar-qa-claim-toggle"
                @click="composerIntent === 'claim' ? clearClaimIntent() : (composerIntent = 'claim')"
              >
                <UIcon name="i-lucide-search-check" class="w-4 h-4" />
                <span v-if="composerIntent === 'claim'" class="hidden min-[400px]:inline">{{ t('foodScholarLearn.intents.claim') }}</span>
                <UIcon v-if="composerIntent === 'claim'" name="i-lucide-x" class="w-3.5 h-3.5 opacity-70" />
              </button>
            </template>
          </FoodscholarComposerBox>
          <p class="hidden sm:block mt-2 text-center text-[0.6875rem] text-gray-400 dark:text-zinc-500">
            {{ t('foodScholarLearn.composer.disclaimer') }}
          </p>
        </div>
        </div>
      </div>
    </template>

    <!-- Library tab -->
    <template v-else-if="pageTab === 'resources'">
      <div class="flex-1 min-h-0 overflow-y-auto">
        <div class="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14 space-y-16">

          <!-- Introduction + resource type row -->
          <section class="grid lg:grid-cols-[1fr_auto] gap-10 items-start">
            <div class="relative">
              <!-- Subtle wavy grainient behind the intro copy -->
              <div class="grainient-intro" aria-hidden="true">
                <div class="grainient-intro__mesh" />
                <div class="grainient-intro__grain" />
              </div>
              <h2 class="relative text-3xl sm:text-4xl font-claude text-gray-900 dark:text-white leading-tight mb-4">
                Access the science of human nutrition
              </h2>
              <p class="relative text-sm text-gray-500 dark:text-zinc-400 leading-relaxed max-w-3xl mb-6">
                FoodScholar consolidates peer-reviewed research, national dietary guidance, and academic reference material across the full breadth of nutritional science, for everyone.
              </p>

              <!-- Library search bar -->
              <div ref="librarySearchBoxRef" class="relative max-w-xl">
                <div
                  class="relative flex items-center"
                  data-flows="foodscholar-library-search"
                >
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
                    :disabled="!librarySearchQuery.trim()"
                    class="absolute right-2 px-2 py-1 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                    @mousedown.prevent="navigateToCatalogWithQuery"
                  >
                    <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5" />
                  </button>
                </div>

                <!-- Dropdown: autocomplete suggestions -->
                <div
                  v-if="libraryDropdownOpen && (libraryAutocompleting || libraryAutocompleteSuggestions.articles.length > 0 || libraryAutocompleteSuggestions.guides.length > 0 || libraryAutocompleteSuggestions.textbooks.length > 0)"
                  class="absolute left-0 right-0 mt-2 z-30 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden"
                >
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
                </div>
              </div>
            </div>

            <!-- Resource type pills -->
            <div
              class="flex lg:flex-col gap-3 flex-wrap"
              data-flows="foodscholar-library-nav"
            >
              <NuxtLink
                to="/foodscholar/hierarchy"
                class="group inline-flex min-w-[14rem] items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-violet-300 hover:bg-violet-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-violet-700 dark:hover:bg-violet-900/20"
              >
                <div class="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                  <UIcon name="i-lucide-list-tree" class="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p class="text-base font-semibold text-gray-900 dark:text-white">Hierarchy</p>
                  <p class="font-claude text-sm text-gray-400 dark:text-zinc-500">Browse by theme</p>
                </div>
                <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5 text-gray-300 dark:text-zinc-600 ml-2 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
              </NuxtLink>

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
            <div class="flex items-center justify-between gap-4 mb-4">
              <div>
                <p class="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500">Articles</p>
                <h2 class="font-claude text-2xl text-gray-900 dark:text-white">Browse articles</h2>
              </div>
              <NuxtLink
                :to="librarySeeAllTo || '/foodscholar/catalog'"
                class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group"
              >
                <UIcon name="i-lucide-external-link" class="w-3.5 h-3.5" />
                Browse articles
              </NuxtLink>
            </div>

            <dl
              v-if="!articlesLoading && (libraryTotalArticles || libraryTotalJournals || libraryTotalTopics)"
              class="grid grid-cols-3 gap-3 border-b border-gray-100 dark:border-zinc-800 pb-4 mb-6 max-w-md"
            >
              <div>
                <dt class="text-[0.58rem] uppercase tracking-[0.15em] text-gray-400 dark:text-zinc-500 font-semibold">{{ t('foodScholarHome.library.articleStats.articles') }}</dt>
                <dd class="mt-0.5 text-xl font-semibold text-gray-900 dark:text-white">{{ libraryTotalArticles > 0 ? libraryTotalArticles.toLocaleString() : '—' }}</dd>
              </div>
              <div>
                <dt class="text-[0.58rem] uppercase tracking-[0.15em] text-gray-400 dark:text-zinc-500 font-semibold">{{ t('foodScholarHome.library.articleStats.journals') }}</dt>
                <dd class="mt-0.5 text-xl font-semibold text-gray-900 dark:text-white">{{ libraryTotalJournals > 0 ? libraryTotalJournals.toLocaleString() : '—' }}</dd>
              </div>
              <div>
                <dt class="text-[0.58rem] uppercase tracking-[0.15em] text-gray-400 dark:text-zinc-500 font-semibold">{{ t('foodScholarHome.library.articleStats.topics') }}</dt>
                <dd class="mt-0.5 text-xl font-semibold text-gray-900 dark:text-white">{{ libraryTotalTopics > 0 ? libraryTotalTopics.toLocaleString() : '—' }}</dd>
              </div>
            </dl>

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
              <!-- Browse axis toggle -->
              <div class="inline-flex items-center gap-0.5 rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/60 p-0.5 mb-4">
                <button
                  type="button"
                  :class="[
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors',
                    libraryBrowseAxis === 'topic'
                      ? 'bg-white dark:bg-zinc-900 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                  ]"
                  @click="setLibraryBrowseAxis('topic')"
                >
                  <UIcon name="i-lucide-compass" class="w-3.5 h-3.5" />
                  Topic
                </button>
                <button
                  type="button"
                  :class="[
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors',
                    libraryBrowseAxis === 'journal'
                      ? 'bg-white dark:bg-zinc-900 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                  ]"
                  @click="setLibraryBrowseAxis('journal')"
                >
                  <UIcon name="i-lucide-book-marked" class="w-3.5 h-3.5" />
                  Journal
                </button>
              </div>

              <!-- Browse-axis pills -->
              <div class="flex gap-1.5 flex-wrap mb-6">
                <button
                  v-for="pill in libraryActivePills"
                  :key="pill.value"
                  type="button"
                  :class="[
                    'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
                    librarySelectedTopic === pill.value
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-600 dark:hover:text-brand-400'
                  ]"
                  @click="selectLibraryFacet(pill.value)"
                >
                  {{ pill.value }}
                  <span
                    v-if="pill.count"
                    :class="[
                      'rounded-full px-1.5 py-px text-[0.625rem] font-semibold tabular-nums',
                      librarySelectedTopic === pill.value
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'
                    ]"
                  >{{ pill.count.toLocaleString() }}</span>
                </button>
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
                    :selected-topic="libraryBrowseAxis === 'topic' && librarySelectedTopic !== CATEGORY_ALL ? librarySelectedTopic : null"
                    :hide-abstract="true"
                  />
                </div>

                <div v-if="librarySeeAllTo && libraryFilteredArticles.length" class="mt-5 flex justify-center">
                  <NuxtLink
                    :to="librarySeeAllTo"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group"
                  >
                    <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5" />
                    <span v-if="librarySelectedCount">See all {{ librarySelectedCount.toLocaleString() }} in catalog</span>
                    <span v-else>See all in catalog</span>
                  </NuxtLink>
                </div>

                <p v-if="!libraryFilteredArticles.length" class="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">
                  {{ libraryEmptyMessage }}
                </p>
              </template>
            </template>

            <div v-else-if="articlesError" class="py-10 text-center text-sm text-red-500">{{ articlesError }}</div>
          </section>

          <!-- Dietary Guides overview -->
          <section>
            <div class="flex items-start justify-between gap-6 mb-6">
              <div>
                <p class="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500">Explore</p>
                <h2 class="font-claude text-2xl text-gray-900 dark:text-white">Dietary guides by region</h2>
                <p class="mt-1 text-sm text-gray-400 dark:text-zinc-500">Click a region to open its official guides →</p>
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
                    :show-hint="true"
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
                    <dd class="mt-0.5 text-xl font-semibold text-gray-900 dark:text-white">{{ libraryRulesTotal > 0 ? libraryRulesTotal.toLocaleString() : (libraryTotalGuidelines > 0 ? libraryTotalGuidelines.toLocaleString() : '—') }}</dd>
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
      </div>
    </template>

    <FoodscholarGuidelineCitationPeek
      :open="guidelinePeekOpen"
      :guideline="guidelinePeek"
      :loading="guidelinePeekLoading"
      :error="guidelinePeekError"
      :anchor-rect="guidelinePeekAnchorRect"
      @close="closeGuidelinePeek"
      @open="openGuidelineFromPeek"
    />

    <FoodscholarArticleCitationPeek
      :open="articlePeekOpen"
      :citation="articlePeekCitation"
      :anchor-rect="articlePeekAnchorRect"
      @open="openArticleFromPeek"
      @close="articlePeekOpen = false"
      @pointer-enter="cancelArticlePeekClose"
      @pointer-leave="scheduleArticlePeekClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { track } from '~/composables/useTelemetry'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { DropdownMenuItem } from '@nuxt/ui'
import articlesApi, { type Article } from '~/services/articlesApi'
import catalogApi, { type CatalogGuide, type CatalogGuideline } from '~/services/catalogApi'
import GuidelineCitationPeek from '~/components/foodscholar/GuidelineCitationPeek.vue'
import textbooksApi, { type Textbook, type TextbookSuggestion } from '~/services/textbooksApi'
import foodscholarApi, {
  type QaAskRequest,
  type QaAskResult,
  type QaAnswer,
  type QaCitation,
  type QaClarification,
  type QaClarificationResponse,
  type QaMemorySuggestion,
  type QaRetrievedArticle,
  type QaRetriever
} from '~/services/foodscholarApi'
import { useAuthStore } from '~/stores/auth'
import { useHouseholdStore } from '~/stores/household'
import { useFoodScholarQaStore, type QaThreadTurn } from '~/stores/foodscholarQa'
import { getExcerpt } from '~/utils/articleHelpers'
import {
  buildGuideDetailPath,
  buildRegionSummaries,
  getRegionPresentation,
  type GuidesCatalogRegionSummary
} from '~/utils/guidesCatalog'
import { euCountryCodes } from '~/utils/countries'
import { splitVerdict, verdictFromResult, sourceMix, type ComposerTool } from '~/utils/claimCheck'

const { t, locale } = useI18n()
const { hasHover } = useViewport()

definePageMeta({
  layout: 'app',
  middleware: [
    // The graph was once a tab here and its links were shared as
    // `?tab=graph&node=…&view=…`; they now open the Hierarchy page, keeping
    // the node and view they named.
    (to) => {
      if (to.query.tab !== 'graph') return
      const query = { ...to.query }
      delete query.tab
      return navigateTo({ path: '/foodscholar/hierarchy', query }, { replace: true })
    },
    'auth',
    'profile'
  ]
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
// The composer only owns the bottom edge once a conversation is on screen;
// on the start screen and the Library tab the dock stays in the corner.
usePageDockMode(() => (pageTab.value === 'qa' && hasActiveSession.value ? 'raised-tall' : 'default'))
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

// ============================================================================
// Library tab state
// ============================================================================
const EU_REGION_SET = new Set<string>(euCountryCodes)

const libraryMapLoading = ref(false)
const libraryMapLoaded = ref(false)
const libraryMapError = ref<string | null>(null)
const libraryRegionSummaries = ref<GuidesCatalogRegionSummary[]>([])
const librarySelectedRegion = ref<string | null>(null)
const libraryRulesTotal = ref(0)

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
const libraryBrowseAxis = ref<'topic' | 'journal'>('topic')
const libraryTopicArticles = ref<HomeArticle[]>([])
const libraryTopicArticlesLoading = ref(false)
const libraryTopicFacetsLoaded = ref(false)

interface LibraryPill {
  value: string
  count: number
}

// Topic pills use the topics field — the subject chips shown on the article
// cards (e.g. "Oral Health", "Iron Supplementation").
const libraryTopicPills = computed<LibraryPill[]>(() => {
  const top = (facets.value.topics || [])
    .filter(f => f?.value && String(f.value).trim())
    .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))
    .slice(0, 8)
    .map(f => ({ value: f.value, count: Number(f.count || 0) }))
  return [{ value: CATEGORY_ALL, count: 0 }, ...top]
})

const libraryJournalPills = computed<LibraryPill[]>(() => {
  const top = (facets.value.venue || [])
    .filter(f => f?.value && String(f.value).trim())
    .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))
    .slice(0, 8)
    .map(f => ({ value: f.value, count: Number(f.count || 0) }))
  return [{ value: CATEGORY_ALL, count: 0 }, ...top]
})

const libraryActivePills = computed<LibraryPill[]>(() =>
  libraryBrowseAxis.value === 'journal' ? libraryJournalPills.value : libraryTopicPills.value
)

const librarySelectedCount = computed<number>(() => {
  const value = librarySelectedTopic.value
  if (value === CATEGORY_ALL) return 0
  const field = libraryBrowseAxis.value === 'journal' ? 'venue' : 'topics'
  return Number((facets.value[field] || []).find(f => f.value === value)?.count || 0)
})

const libraryEmptyMessage = computed(() =>
  libraryBrowseAxis.value === 'journal'
    ? 'No articles in this journal yet.'
    : 'No articles in this topic yet.'
)

const librarySeeAllTo = computed(() => {
  const value = librarySelectedTopic.value
  if (value === CATEGORY_ALL) return null
  // Catalog hydrates both ?venue and ?topic directly, so the active filter
  // transfers exactly.
  const query = libraryBrowseAxis.value === 'journal' ? { venue: value } : { topic: value }
  return { path: '/foodscholar/catalog', query }
})

const libraryTotalArticles = computed(() => allArticlesTotal.value)
const libraryTotalJournals = computed(() => {
  const venues = facets.value.venue || []
  return venues.filter(v => v?.value && String(v.value).trim()).length
})
const libraryTotalTopics = computed(() => {
  const topics = facets.value.topics || []
  return topics.filter(t => t?.value && String(t.value).trim()).length
})

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

function syncLibraryQuery() {
  if (pageTab.value !== 'resources') return
  const query: Record<string, string> = { ...(route.query as Record<string, string>) }
  query.tab = 'resources'
  query.browse = libraryBrowseAxis.value
  // Clear both value keys, then set the active one (if a real selection).
  delete query.venue
  delete query.topic
  if (librarySelectedTopic.value !== CATEGORY_ALL) {
    if (libraryBrowseAxis.value === 'journal') query.venue = librarySelectedTopic.value
    else query.topic = librarySelectedTopic.value
  }
  router.replace({ query })
}

function hydrateLibraryFromQuery() {
  const tab = route.query.tab
  if (tab === 'resources') pageTab.value = 'resources'
  const browse = route.query.browse
  if (browse === 'journal' || browse === 'topic') libraryBrowseAxis.value = browse
  const value = libraryBrowseAxis.value === 'journal' ? route.query.venue : route.query.topic
  if (typeof value === 'string' && value) librarySelectedTopic.value = value
}

async function selectLibraryFacet(value: string) {
  librarySelectedTopic.value = value
  if (value === CATEGORY_ALL) {
    libraryTopicArticles.value = []
    syncLibraryQuery()
    return
  }

  // Topic browses by topics (the card's subject chips); journals by venue.
  const field = libraryBrowseAxis.value === 'journal' ? 'venue' : 'topics'
  const fq = [`${field}:"${value}"`]
  libraryTopicArticlesLoading.value = true
  try {
    const response = await articlesApi.searchArticles({
      q: null,
      limit: 6,
      offset: 0,
      sort: 'created_at desc',
      fl: ['id', 'urn', 'title', 'abstract', 'description', 'content', 'authors', 'tags', 'ai_tags', 'topics', 'venue', 'publication_year', 'category', 'ai_category'],
      fq,
      fields: []
    })
    const results = response.result.results || []
    libraryTopicArticles.value = results.map(mapArticleToHome)
  } catch {
    libraryTopicArticles.value = []
  } finally {
    libraryTopicArticlesLoading.value = false
  }
  syncLibraryQuery()
}

function setLibraryBrowseAxis(axis: 'topic' | 'journal') {
  if (libraryBrowseAxis.value === axis) return
  libraryBrowseAxis.value = axis
  librarySelectedTopic.value = CATEGORY_ALL
  libraryTopicArticles.value = []
  syncLibraryQuery()
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
    libraryRulesTotal.value = guidelineRes.total || 0
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
  libraryActiveIndex.value = -1

  if (libraryAutocompleteTimer) {
    clearTimeout(libraryAutocompleteTimer)
    libraryAutocompleteTimer = null
  }

  if (q.length < 2) {
    libraryAutocompleteSuggestions.value = { articles: [], guides: [], textbooks: [] }
    libraryAutocompleting.value = false
    libraryDropdownOpen.value = false
    return
  }

  libraryDropdownOpen.value = true
  libraryAutocompleting.value = true
  libraryAutocompleteTimer = setTimeout(() => {
    void fetchLibraryAutocomplete(q)
  }, 220)
}

// Computed flat list of navigable items for arrow-key tracking
const libraryNavItems = computed(() => {
  const s = libraryAutocompleteSuggestions.value
  return [
    ...s.articles.map((_, i) => ({ type: 'ac-article' as const, index: i })),
    ...s.guides.map((_, i) => ({ type: 'ac-guide' as const, index: i })),
    ...s.textbooks.map((_, i) => ({ type: 'ac-textbook' as const, index: i }))
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

function navigateToCatalogWithQuery() {
  const q = librarySearchQuery.value.trim()
  if (!q) return
  closeLibraryDropdown()
  void navigateTo(`/foodscholar/catalog?q=${encodeURIComponent(q)}`)
}

function handleLibrarySearchEnter() {
  if (libraryActiveIndex.value < 0) {
    navigateToCatalogWithQuery()
    return
  }

  const item = libraryNavItems.value[libraryActiveIndex.value]
  if (!item) {
    navigateToCatalogWithQuery()
    return
  }

  if (item.type === 'ac-textbook') {
    const textbook = libraryAutocompleteSuggestions.value.textbooks[item.index]
    if (textbook) { closeLibraryDropdown(); void navigateTo(`/foodscholar/textbooks/${textbook.urn}`) }
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

  navigateToCatalogWithQuery()
}

function closeLibraryDropdown() {
  libraryDropdownOpen.value = false
  libraryActiveIndex.value = -1
}

function clearLibrarySearch() {
  librarySearchQuery.value = ''
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
const route = useRoute()
const authStore = useAuthStore()
const householdStore = useHouseholdStore()
const qaStore = useFoodScholarQaStore()

const qaHeadingIndex = Math.floor(Math.random() * 10)
const qaHeadings = computed(() => {
  const name = householdStore.currentMember?.name?.split(' ')[0] || householdStore.currentMember?.name || ''
  const greeting = name ? `, ${name}` : ''
  return Array.from({ length: 10 }, (_, i) =>
    t(`foodScholarHome.qa.headings.h${i + 1}`, { greeting })
  )
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

/**
 * Guide-routing hints for a guideline urn, from wherever this answer carries
 * them (citation fields first, retrieved-source fields as fallback). These
 * ride the resolver as `guide`/`region`/`pdf_page` so a rule outside the
 * reader's visibility still lands on its guide page instead of a 404.
 */
const getGuidelineHintsForUrn = (urn: string): Record<string, string> => {
  const hints: Record<string, string> = {}
  const citation = [
    ...(primaryAnswer.value?.citations || []),
    ...(secondaryAnswer.value?.citations || [])
  ].find(c => c.article_urn === urn)
  const retrieved = retrievedArticleMap.value[urn]

  const guideUrn = citation?.guide_urn || retrieved?.guide_urn
  const region = citation?.region || retrieved?.venue
  const pageNo = citation?.page_no ?? retrieved?.page_no

  if (guideUrn) hints.guide = String(guideUrn)
  if (region) hints.region = String(region)
  if (typeof pageNo === 'number') hints.pdf_page = String(pageNo)
  return hints
}

const getCitationSourcePath = (citation: QaCitation) => {
  const sourceType = getCitationSourceType(citation)
  if (normalizeQaSourceType(citation.article_urn, sourceType) === 'guideline') {
    return {
      path: getQaSourcePath(citation.article_urn, sourceType),
      query: getGuidelineHintsForUrn(citation.article_urn)
    }
  }
  return getQaSourcePath(citation.article_urn, sourceType)
}

/**
 * The prioritization signals behind a sidebar source, made visible: year,
 * study design, and citation reach for articles; region for guidelines.
 * These are the same fields the ranking multiplies — transparency, not gloss.
 */
const retrievedMetaLine = (article: QaRetrievedArticle | undefined | null): string => {
  if (!article) return ''
  if (normalizeQaSourceType(article.urn, article.source_type) === 'guideline') {
    return [t('foodScholarHome.qa.sourceMeta.guideline'), article.venue]
      .filter(Boolean).join(' · ')
  }
  const parts: string[] = []
  const year = String(article.publication_year || '').slice(0, 4)
  if (year) parts.push(year)
  if (article.study_type) parts.push(article.study_type)
  // Non-human work is named, so a mouse study is not read as a human result.
  if (article.is_human_evidence === false && article.evidence_label) {
    parts.push(article.evidence_label)
  }
  // Readers could not tell which sources they would be able to open until
  // they clicked and hit a paywall.
  if (typeof article.open_access === 'boolean') {
    parts.push(article.open_access
      ? t('foodScholarHome.qa.sourceMeta.openAccess')
      : t('foodScholarHome.qa.sourceMeta.subscription'))
  }
  if (typeof article.citation_count === 'number') {
    parts.push(
      t('foodScholarHome.qa.sourceMeta.citations', { count: article.citation_count })
    )
  }
  return parts.join(' · ')
}

const citationMetaLine = (citation: QaCitation): string => {
  const retrieved = retrievedArticleMap.value[citation.article_urn]
  if (retrieved) {
    const line = retrievedMetaLine(retrieved)
    if (line) return line
  }
  // Fallback to the citation's own fields (cached answers may lack the
  // retrieved-source record).
  if (normalizeQaSourceType(citation.article_urn, citation.source_type) === 'guideline') {
    return [
      t('foodScholarHome.qa.sourceMeta.guideline'),
      citation.region || citation.journal
    ].filter(Boolean).join(' · ')
  }
  return [citation.year, citation.journal].filter(Boolean).join(' · ')
}

const getRetrievedSourcePath = (article: QaRetrievedArticle) => {
  if (normalizeQaSourceType(article.urn, article.source_type) === 'guideline') {
    return {
      path: getQaSourcePath(article.urn, article.source_type),
      query: getGuidelineHintsForUrn(article.urn)
    }
  }
  return getQaSourcePath(article.urn, article.source_type)
}

const getCitationForUrn = (articleUrn: string) => {
  const citations = [
    ...(primaryAnswer.value?.citations || []),
    ...(secondaryAnswer.value?.citations || [])
  ]
  return citations.find(c => c.article_urn === articleUrn && (c.quote || c.section)) || null
}

// Navigate (current tab) or open (new tab) a resolved location, depending on intent.
const goToLocation = (location: { path: string, query?: Record<string, string>, hash?: string }, openInNewTab: boolean) => {
  if (!openInNewTab) {
    router.push(location)
    return
  }
  const resolved = router.resolve(location)
  window.open(resolved.href, '_blank', 'noopener')
}

const navigateToGuideline = async (guidelineId: string, extraQuery: Record<string, string> = {}, openInNewTab = false) => {
  // `guide`/`region` are routing hints, not state for the guide page. The
  // resolver at /foodscholar/catalog/guidelines strips them the same way.
  const { guide: hintedGuide, region: hintedRegion, ...restQuery } = extraQuery
  const guidePageQuery = (pdfPage?: string | number | null): Record<string, string> => {
    const query: Record<string, string> = { ...restQuery, guideline: guidelineId }
    if (pdfPage !== null && pdfPage !== undefined && pdfPage !== '') {
      query.pdf_page = String(pdfPage)
    }
    return query
  }
  const fallback = {
    path: `/foodscholar/catalog/guidelines/${encodeURIComponent(guidelineId)}`,
    query: { ...extraQuery, guideline: guidelineId }
  }
  try {
    const guideline = await catalogApi.getGuideline(guidelineId)
    if (!guideline.guide_urn) {
      goToLocation(fallback, openInNewTab)
      return
    }
    goToLocation({
      path: buildGuideDetailPath(guideline.region || hintedRegion, guideline.guide_urn),
      query: guidePageQuery(
        typeof guideline.page_no === 'number' ? guideline.page_no : restQuery.pdf_page
      )
    }, openInNewTab)
  } catch {
    // The rule is not readable (draft, archived, restricted) — but the hints
    // can still land the reader on the guide page directly.
    if (hintedGuide) {
      goToLocation({
        path: buildGuideDetailPath(hintedRegion || null, hintedGuide),
        query: guidePageQuery(restQuery.pdf_page)
      }, openInNewTab)
      return
    }
    goToLocation(fallback, openInNewTab)
  }
}

// ---------------------------------------------------------------------------
// Guideline citation peek
// ---------------------------------------------------------------------------

const guidelinePeekOpen = ref(false)
const guidelinePeekLoading = ref(false)
const guidelinePeekError = ref(false)
const guidelinePeek = ref<CatalogGuideline | null>(null)
const guidelinePeekAnchorRect = ref<{ top: number, left: number, bottom: number, width: number } | null>(null)
const guidelinePeekId = ref<string | null>(null)
const guidelinePeekQuery = ref<Record<string, string>>({})

const closeGuidelinePeek = () => {
  guidelinePeekOpen.value = false
  guidelinePeek.value = null
  guidelinePeekError.value = false
  guidelinePeekId.value = null
}

const openGuidelinePeek = async (
  guidelineId: string,
  anchor: HTMLElement,
  query: Record<string, string> = {}
) => {
  const rect = anchor.getBoundingClientRect()
  guidelinePeekAnchorRect.value = {
    top: rect.top,
    left: rect.left,
    bottom: rect.bottom,
    width: rect.width
  }
  guidelinePeekId.value = guidelineId
  guidelinePeekQuery.value = query
  guidelinePeekOpen.value = true
  guidelinePeekError.value = false
  guidelinePeek.value = null
  guidelinePeekLoading.value = true

  try {
    const guideline = await catalogApi.getGuideline(guidelineId)
    // A slower fetch must not overwrite a peek the reader has since replaced.
    if (guidelinePeekId.value !== guidelineId) return
    guidelinePeek.value = guideline
  } catch {
    if (guidelinePeekId.value !== guidelineId) return
    guidelinePeekError.value = true
  } finally {
    if (guidelinePeekId.value === guidelineId) {
      guidelinePeekLoading.value = false
    }
  }
}

const openGuidelineFromPeek = () => {
  const guidelineId = guidelinePeekId.value
  if (!guidelineId) return
  const query = guidelinePeekQuery.value
  closeGuidelinePeek()
  void navigateToGuideline(guidelineId, query, true)
}

const resolveQaSourceHref = (href: string): { url: URL, urn: string, sourceType: QaEvidenceSourceType, path: string } | null => {
  const url = new URL(href, window.location.origin)

  // Strip the deployment base path (e.g. "/app" in production) so segment
  // matching below is independent of the context path. Without this, the
  // baseURL prefix shifts pathSegments[0] and article/guide links stop
  // resolving in prod (guideline links happen to survive — see renderMarkdown).
  const base = useRuntimeConfig().app.baseURL?.replace(/\/$/, '') || ''
  let pathname = url.pathname
  if (base && pathname.startsWith(base + '/')) {
    pathname = pathname.slice(base.length)
  } else if (base && pathname === base) {
    pathname = '/'
  }

  const pathSegments = pathname
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

/**
 * A cited source the reader actually followed.
 *
 * `placement` keeps the two routes in apart: the marker inside the prose and
 * the card in the sidebar answer different questions — whether inline markers
 * are noticed at all, versus whether the sidebar is read as a bibliography —
 * and a single combined count answers neither.
 */
const recordCitationOpened = (
  urn: string,
  sourceType: QaCitation['source_type'],
  placement: 'inline' | 'sidebar'
) => {
  if (!urn) return
  track('qa.citation_opened', {
    urn,
    source_type: normalizeQaSourceType(urn, sourceType),
    placement
  }, 'foodscholar')
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

  recordCitationOpened(targetUrn, sourceType, 'inline')

  event.preventDefault()
  event.stopPropagation()

  const query = Object.fromEntries(url.searchParams.entries()) as Record<string, string>

  if (sourceType === 'guideline') {
    // Carry the answer's guide-routing hints so navigation still lands on
    // the guide page (rule highlighted, PDF page open) when the rule itself
    // is not publicly readable.
    const hintedQuery = { ...getGuidelineHintsForUrn(targetUrn), ...query }
    // A plain click previews the rule in place; a modifier click keeps the
    // familiar "open in a new tab" behaviour for people who want the guide.
    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      void navigateToGuideline(targetUrn, hintedQuery, true)
    } else {
      void openGuidelinePeek(targetUrn, anchor, hintedQuery)
    }
  } else {
    // A finger cannot hover, so on touch a plain tap previews the passage in
    // place — as the guideline peek already does — and the article stays one
    // deliberate tap away, inside the peek.
    if (!hasHover.value && citation?.quote && !(event.metaKey || event.ctrlKey || event.shiftKey)) {
      openArticlePeekNow(anchor, citation)
      return
    }
    if (!('section' in query) && citation?.section) query.section = String(citation.section)
    if (!('hl' in query) && citation?.quote) query.hl = String(citation.quote)
    goToLocation({
      path: targetPath,
      query,
      hash: url.hash
    }, true)
  }
}

const selectedPopularTopic = ref(CATEGORY_ALL)
const articlesLoading = ref(false)
const articlesError = ref<string | null>(null)
const allArticles = ref<HomeArticle[]>([])
const allArticlesTotal = ref(0)
const facets = ref<Record<string, Array<{ value: string, count: number }>>>({})

const chatQuery = ref('')
const composerFocused = ref(false)
const figLoaded = ref(false)
const figImgRef = ref<HTMLImageElement | null>(null)
let figLastReplayAt = 0
const onFigLoad = () => { figLoaded.value = true }
const replayFigTilt = () => {
  const el = figImgRef.value
  if (!el) return
  const now = Date.now()
  if (now - figLastReplayAt < 3000) return
  figLastReplayAt = now
  el.classList.remove('fig-mark--animate', 'fig-mark--replay')
  void el.offsetWidth
  el.classList.add('fig-mark--replay')
}
const asking = ref(false)
const qaError = ref<string | null>(null)
const qaResult = ref<QaAskResult | null>(null)

// ── Conversation thread: earlier turns read top to bottom in the page ──
const MAX_VISIBLE_TURNS = 8
const threadTurns = ref<QaThreadTurn[]>([])
const latestExchangeRef = ref<HTMLElement | null>(null)
const memoryPanelOpen = ref(false)

/**
 * A new follow-up rises to the top of the screen, and its answer grows below
 * it, as in a chat. The page does not chase the streaming text: someone
 * reading the start of an answer is not pulled away from it. The exchange
 * keeps a screen's height (qa-exchange-fill) so there is room to rise into.
 */
// The conversation's own scroll pane, and its height for qa-exchange-fill.
const threadScrollRef = ref<HTMLElement | null>(null)
const threadPaneHeight = ref(0)
let threadPaneObserver: ResizeObserver | null = null

watch(threadScrollRef, (el) => {
  threadPaneObserver?.disconnect()
  threadPaneObserver = null
  if (!el || typeof ResizeObserver === 'undefined') return
  threadPaneHeight.value = el.clientHeight
  threadPaneObserver = new ResizeObserver(() => {
    threadPaneHeight.value = el.clientHeight
  })
  threadPaneObserver.observe(el)
})

const scrollToCurrentExchange = () => {
  void nextTick(() => {
    const pane = threadScrollRef.value
    const el = document.querySelector<HTMLElement>('[data-qa-exchange="live"]')
    if (!pane || !el) return
    // Measured where the block will rest, not where its slide-in animation
    // (translateY 24px) has it now; scrollIntoView would land it short.
    const style = getComputedStyle(el)
    const shift = style.transform && style.transform !== 'none' ? new DOMMatrixReadOnly(style.transform).m42 : 0
    const margin = parseFloat(style.scrollMarginTop) || 0
    const top = el.getBoundingClientRect().top - pane.getBoundingClientRect().top - shift + pane.scrollTop - margin
    pane.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  })
}

// "Jump to latest": shown while the end of the conversation is below the
// docked question box.
const threadEndRef = ref<HTMLElement | null>(null)
const showJumpToLatest = ref(false)
let threadEndObserver: IntersectionObserver | null = null

watch(threadEndRef, (el) => {
  threadEndObserver?.disconnect()
  threadEndObserver = null
  showJumpToLatest.value = false
  if (!el || typeof IntersectionObserver === 'undefined') return
  threadEndObserver = new IntersectionObserver(([entry]) => {
    if (!entry) return
    const below = entry.boundingClientRect.top > (entry.rootBounds?.bottom ?? window.innerHeight)
    showJumpToLatest.value = !entry.isIntersecting && below
  }, { root: threadScrollRef.value, rootMargin: '0px 0px -24px 0px' })
  threadEndObserver.observe(el)
})

onUnmounted(() => {
  threadEndObserver?.disconnect()
  threadPaneObserver?.disconnect()
})

const jumpToLatest = () => {
  threadEndRef.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
}

const carriedContext = computed(() => qaResult.value?.conversation_context ?? null)
const hasCarriedContext = computed(() => Boolean(
  carriedContext.value
  && (carriedContext.value.summary || carriedContext.value.notes?.length)
))

// ── Streaming pipeline (SSE): live reasoning steps + token-streamed answer ──
const {
  streamingAnswer: liveAnswer,
  steps: liveSteps,
  ask: askStreamed,
  reset: resetStream
} = useFoodScholarQaStream()

// A claim's answer opens with its verdict line: shown as the verdict row
// under the question, never as text.
const liveSplit = computed(() => (pendingClaim.value ? splitVerdict(liveAnswer.value) : { verdict: null, body: liveAnswer.value }))
const liveAnswerShown = computed(() => liveSplit.value.body)
const liveVerdict = computed(() => liveSplit.value.verdict)
// The settled answer replaces a streamed one that the reader has already
// watched being written: it takes its place without the entrance animations
// (slide-in, left-to-right reveal), which would draw the same text twice.
// Those stay for an answer that arrives whole (no stream, or restored).
const settledAfterStream = computed(() => Boolean(liveAnswer.value))

// Steps shown with a settled answer: prefer the response's own record (it
// survives the 30-min qaStore restore), fall back to what just streamed.
const answerReasoningSteps = computed(() =>
  qaResult.value?.reasoning_steps?.length
    ? qaResult.value.reasoning_steps
    : liveSteps.value
)

// ── Memory nudges (consent-first; mirrors FoodChat's chips) ──
const memoryChipState = reactive<Record<string, 'pending' | 'accepted' | 'declined'>>({})

/**
 * Every nudge of this conversation, newest answer first, so one left
 * unanswered under an earlier answer is still there after a follow-up.
 */
const threadMemorySuggestions = computed<QaMemorySuggestion[]>(() => {
  const results = [qaResult.value, ...[...threadTurns.value].reverse().map(turn => turn.result)]
  const seen = new Set<string>()
  const out: QaMemorySuggestion[] = []
  for (const result of results) {
    for (const sug of result?.memory_suggestions ?? []) {
      if (seen.has(sug.id) || memoryChipState[sug.id] === 'declined') continue
      seen.add(sug.id)
      out.push(sug)
    }
  }
  return out
})
/** The ones still waiting for an answer (the count on the narrow-screen button). */
const pendingMemorySuggestions = computed(() =>
  threadMemorySuggestions.value.filter(s => !s.already_known && memoryChipState[s.id] !== 'accepted')
)
const memoryNudgesOpen = ref(false)

const handleMemoryDecision = async (suggestion: QaMemorySuggestion, decision: 'accept' | 'decline') => {
  const memberId = householdStore.currentMember?.id
  if (!memberId || suggestion.already_known || memoryChipState[suggestion.id]) return
  memoryChipState[suggestion.id] = 'pending'
  try {
    await foodscholarApi.submitMemoryDecision(memberId, suggestion, decision)
    // Accept → subtle confirmation; decline → dismiss silently
    memoryChipState[suggestion.id] = decision === 'accept' ? 'accepted' : 'declined'
  } catch {
    delete memoryChipState[suggestion.id]
  }
}

// clarification state
const pendingClarification = ref<QaClarification | null>(null)
const qaThreadId = ref<string | null>(null)
const pendingQuestion = ref<string>('')
/** The exchange in flight is a claim check: shown as "You checked", with a verdict row. */
const pendingClaim = ref(false)
const pendingPayload = ref<QaAskRequest | null>(null)
const clarificationSelectedValues = ref<string[]>([])
// number when the clarification input is type="number" (v-model coerces)
const clarificationFreeText = ref<string | number>('')
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
const expertiseLevel = ref('beginner')
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
  const map: Record<string, QaRetrievedArticle> = {}
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

// ── Article passage peek: hover shows the quote the answer used ──
const articlePeekOpen = ref(false)
const articlePeekCitation = ref<QaCitation | null>(null)
const articlePeekAnchorRect = ref<{ top: number, left: number, bottom: number, width: number } | null>(null)
let articlePeekOpenTimer: ReturnType<typeof setTimeout> | null = null
let articlePeekCloseTimer: ReturnType<typeof setTimeout> | null = null

const cancelArticlePeekClose = () => {
  if (articlePeekCloseTimer) {
    clearTimeout(articlePeekCloseTimer)
    articlePeekCloseTimer = null
  }
}

const scheduleArticlePeekClose = () => {
  cancelArticlePeekClose()
  articlePeekCloseTimer = setTimeout(() => {
    articlePeekOpen.value = false
  }, 200)
}

const scheduleArticlePeekOpen = (anchor: HTMLElement, urn: string) => {
  // Only when we actually have the passage — a peek with nothing to show is
  // noise. (During streaming citations are not settled yet, so no peek.)
  const citation = getCitationForUrn(urn)
  if (!citation?.quote) return
  cancelArticlePeekClose()
  if (articlePeekOpenTimer) clearTimeout(articlePeekOpenTimer)
  articlePeekOpenTimer = setTimeout(() => {
    const rect = anchor.getBoundingClientRect()
    articlePeekAnchorRect.value = {
      top: rect.top, left: rect.left, bottom: rect.bottom, width: rect.width
    }
    articlePeekCitation.value = citation
    articlePeekOpen.value = true
  }, 250)
}

/** The peek at once, for a tap: no hover intent to wait out. */
const openArticlePeekNow = (anchor: HTMLElement, citation: QaCitation) => {
  cancelArticlePeekClose()
  if (articlePeekOpenTimer) {
    clearTimeout(articlePeekOpenTimer)
    articlePeekOpenTimer = null
  }
  const rect = anchor.getBoundingClientRect()
  articlePeekAnchorRect.value = {
    top: rect.top, left: rect.left, bottom: rect.bottom, width: rect.width
  }
  articlePeekCitation.value = citation
  articlePeekOpen.value = true
}

const openArticleFromPeek = () => {
  const citation = articlePeekCitation.value
  if (!citation) return
  articlePeekOpen.value = false
  const query: Record<string, string> = {}
  if (citation.section) query.section = String(citation.section)
  if (citation.quote) query.hl = String(citation.quote)
  goToLocation(
    { path: getQaSourcePath(citation.article_urn, 'article'), query },
    true
  )
}

function handleAnswerMouseOver(e: MouseEvent) {
  const a = (e.target as HTMLElement).closest<HTMLElement>('a[href]')
  if (!a) return
  const urn = getAnchorCitationUrn(a)
  if (!urn) return
  drawCitationLine(a, urn)
  if (a.getAttribute('data-citation-type') !== 'guideline') {
    scheduleArticlePeekOpen(a, urn)
  }
}

function handleAnswerMouseOut(e: MouseEvent) {
  const a = (e.target as HTMLElement).closest<HTMLElement>('a[href]')
  if (!a) return
  if (getAnchorCitationUrn(a)) {
    clearCitationLine()
    if (articlePeekOpenTimer) {
      clearTimeout(articlePeekOpenTimer)
      articlePeekOpenTimer = null
    }
    if (articlePeekOpen.value) scheduleArticlePeekClose()
  }
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

/**
 * Ask and Library switch in place. Leaving Library drops `tab` from the
 * address, so a reload stays on Ask instead of reopening Library.
 */
const selectSection = (id: 'qa' | 'resources') => {
  pageTab.value = id
  if (id === 'qa' && route.query.tab) {
    const query = { ...route.query }
    delete query.tab
    router.replace({ query })
  }
}

/** The "Advanced settings" button opens and closes the panel in one click. */
const toggleAdvancedMode = () => {
  qaMode.value = isAdvancedMode.value ? 'simple' : 'advanced'
}

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
      fields: ['category', 'ai_category', 'tags', 'ai_tags', 'topics', 'venue'],
      facet_limit: 200
    })

    const results = response.result.results || []

    allArticles.value = results.map(mapArticleToHome)
    allArticlesTotal.value = response.result.total || 0
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
    const result = await foodscholarApi.listQuestions(locale.value || 'en')
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
    // Pass the app locale so answers, follow-ups, clarifications, and starter
    // questions come back in the user's language. Backend accepts ISO 639-1
    // (supported app locales en|hu|sl are already valid codes).
    language: locale.value || 'en'
  }

  if (ragEnabled.value) {
    payload.retriever = selectedRetriever.value
  }

  // Always honour the chosen expertise level — including in simple mode, whose
  // default is 'beginner'. (Previously simple mode overrode it to 'intermediate',
  // making the beginner/expert choice unreachable for non-advanced users.)
  payload.expertise_level = expertiseLevel.value || 'beginner'

  if (isAdvancedMode.value) {
    if (ragEnabled.value) {
      payload.top_k = selectedTopKOption.value.value
    }
  } else {
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

  // Continue an existing conversation thread when one is active, so free-form
  // follow-ups carry the running summary. Cleared on a deliberate new question.
  if (qaThreadId.value) {
    payload.qa_thread_id = qaThreadId.value
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

/**
 * A checked claim keeps the reader's words as its question and its verdict
 * on the result (so earlier turns keep theirs); the verdict line is taken out
 * of the answer text. A verdict from the backend, once it sends one, wins.
 */
const settleClaim = (result: QaAskResult): QaAskResult => {
  if (!pendingClaim.value) return result
  const fromBackend = verdictFromResult(result)
  const strip = (answer: QaAskResult['primary_answer'] | null | undefined) => {
    if (!answer?.answer) return { answer, verdict: null }
    const { verdict, body } = splitVerdict(answer.answer)
    return { answer: { ...answer, answer: body }, verdict }
  }
  const primary = strip(result.primary_answer)
  const secondary = strip(result.secondary_answer)
  return {
    ...result,
    question: pendingQuestion.value || result.question,
    primary_answer: primary.answer ?? result.primary_answer,
    secondary_answer: result.secondary_answer ? (secondary.answer ?? result.secondary_answer) : result.secondary_answer,
    ui_claim: { verdict: fromBackend ?? primary.verdict }
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
    // Visible history is managed in askScholarQA (the previous exchange slides
    // up there before the new answer streams); here we only settle the result.
    // Keep the thread id returned with every answer so the next question in this
    // session continues the conversation (free-form follow-ups + thread summary).
    // A deliberate new question resets it in askScholarQA().
    qaThreadId.value = result.qa_thread_id ?? qaThreadId.value ?? null
    pendingPayload.value = null
    // The question bubble keeps the reader's own words: after a clarification
    // the backend echoes the question with the clarification appended.
    qaResult.value = settleClaim({
      ...normalizeQaResult(result),
      ...(pendingQuestion.value ? { question: pendingQuestion.value } : {})
    })
    pendingClaim.value = false
    qaStore.save({
      question: pendingQuestion.value,
      result: qaResult.value,
      expertiseLevel: expertiseLevel.value,
      qaThreadId: qaThreadId.value,
      turns: threadTurns.value
    })
    // No scroll here: the settled answer takes the streaming one's place,
    // so whatever the reader was looking at stays where it was.
  }
}

/** Start a fresh conversation: new thread id, empty visible history. */
const startNewThread = () => {
  qaThreadId.value = null
  threadTurns.value = []
  qaResult.value = null
  qaError.value = null
  pendingClarification.value = null
  pendingQuestion.value = ''
  chatQuery.value = ''
  memoryPanelOpen.value = false
  memoryNudgesOpen.value = false
  resetStream()
  qaStore.clear()
}

// continueThread: keep the active qa_thread_id so the backend treats this as a
// free-form follow-up (carrying the running conversation summary). Defaults to
// auto: a submit from within an active session (the in-session composer or a
// follow-up suggestion) continues the thread; the idle composer and starter
// questions (which pass forceNew) start a fresh conversation. This keeps the
// existing layout — no new controls — while enabling threaded follow-ups.
const askScholarQA = async (
  questionOverride?: string,
  options?: { continueThread?: boolean, forceNew?: boolean, claim?: boolean }
) => {
  const question = (questionOverride ?? chatQuery.value).trim()
  if (!question || asking.value) return
  pendingClaim.value = Boolean(options?.claim)

  const autoContinue = hasActiveSession.value && !!qaThreadId.value
  const continueThread = options?.forceNew === true
    ? false
    : (options?.continueThread ?? autoContinue)

  if (questionOverride) {
    chatQuery.value = question
  }

  asking.value = true
  // A follow-up on a live thread keeps the previous exchange visible in the
  // sliding history while the new answer streams in.
  if (continueThread && qaResult.value) {
    threadTurns.value = [
      ...threadTurns.value,
      { question: qaResult.value.question, result: qaResult.value }
    ].slice(-MAX_VISIBLE_TURNS)
  }
  qaResult.value = null
  qaError.value = null
  pendingClarification.value = null
  // Preserve the thread id for a follow-up; drop it to start a new conversation.
  if (!continueThread) {
    qaThreadId.value = null
    threadTurns.value = []
    qaStore.clear()
  }
  pendingPayload.value = null
  selectedPreferredAnswer.value = null
  singleAnswerFeedbackSubmitted.value = false
  showNegativeFeedbackReasons.value = false
  selectedNegativeReason.value = null
  negativeFeedbackComment.value = ''

  resetStream()
  if (threadTurns.value.length) scrollToCurrentExchange()

  try {
    // A claim goes to FoodScholar as itself, marked as a claim to check; the
    // verdict comes back as claim_verdict on the result.
    const payload = buildBasePayload(question)
    if (pendingClaim.value) payload.intent = 'claim_check'
    pendingQuestion.value = question
    const result = await askStreamed(payload)
    handleQaResponse(result, payload)
  } catch (err: unknown) {
    qaError.value = getErrorMessage(err, t('foodScholarHome.errors.failedToGetQaResponse'))
  } finally {
    asking.value = false
    chatQuery.value = ''
  }
}

// The in-session composer submits a free-form follow-up on the current thread.
const askScholarFollowUp = (questionOverride?: string) => {
  askScholarQA(questionOverride, { continueThread: true })
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
      free_text: String(clarificationFreeText.value ?? '').trim() || null
    }

    const payload: QaAskRequest = {
      ...pendingPayload.value,
      qa_thread_id: qaThreadId.value ?? undefined,
      clarification_response: clarificationResponse
    }

    resetStream()
    const result = await askStreamed(payload)
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
  // Starter questions always begin a fresh conversation.
  askScholarQA(question, { forceNew: true })
}

// ── Tools in the question box ──
// "Check a claim" and "Everyday questions" open a short list under the box;
// picking an item puts it in the box, and nothing is sent until the reader
// sends it. A claim is then asked in the same conversation, and its verdict
// is shown under the question (see askScholarQA / handleQaResponse).
const composerIntent = ref<'claim' | null>(null)
const activeTool = ref<ComposerTool | null>(null)
const idleComposerRef = ref<{ focus: () => void } | null>(null)

/** Focus the box on a desktop; on a phone that would throw up the keyboard. */
const focusIdleComposer = () => {
  if (typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches) {
    idleComposerRef.value?.focus()
  }
}

/**
 * One tool at a time. Claim mode counts as the claim tool being selected even
 * after its list has closed, so opening another tool leaves claim mode, and
 * choosing the selected tool again turns it off.
 */
const selectedTool = computed<ComposerTool | null>(() => (composerIntent.value === 'claim' ? 'claim' : activeTool.value))

const openTool = (tool: ComposerTool) => {
  if (selectedTool.value === tool) {
    activeTool.value = null
    composerIntent.value = null
    return
  }
  activeTool.value = tool
  composerIntent.value = tool === 'claim' ? 'claim' : null
}

const closeTool = () => {
  // Closing the claim list without picking one leaves claim mode too, unless
  // a claim is already in the box.
  if (activeTool.value === 'claim' && !chatQuery.value.trim()) composerIntent.value = null
  activeTool.value = null
}

const clearClaimIntent = () => {
  composerIntent.value = null
  if (activeTool.value === 'claim') activeTool.value = null
}

const useSuggestion = (text: string, mode: 'claim' | 'question') => {
  chatQuery.value = text
  composerIntent.value = mode === 'claim' ? 'claim' : null
  activeTool.value = null
  focusIdleComposer()
}

/** The explanation level, chosen from the question box itself. */
const explanationLevelItems = computed<DropdownMenuItem[]>(() => expertiseOptions.value.map(option => ({
  label: option.label,
  description: option.description,
  icon: option.icon,
  type: 'checkbox' as const,
  checked: expertiseLevel.value === option.value,
  onUpdateChecked: () => {
    expertiseLevel.value = option.value
  }
})))

/** "See what FoodScholar can do": each card opens its short list. */
const tryCards = computed(() => [
  {
    id: 'claim',
    icon: 'i-lucide-search-check',
    accent: 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300',
    title: t('foodScholarLearn.composer.cards.claim.title'),
    body: t('foodScholarLearn.composer.cards.claim.body'),
    run: () => openTool('claim')
  },
  {
    id: 'plain',
    icon: 'i-lucide-message-circle-question',
    accent: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300',
    title: t('foodScholarLearn.composer.cards.plain.title'),
    body: t('foodScholarLearn.composer.cards.plain.body'),
    run: () => {
      expertiseLevel.value = 'beginner'
      openTool('everyday')
    }
  }
])

/** The box sends a claim to be checked, or an ordinary question. */
const submitComposer = (value: string | undefined, continueThread?: boolean) => {
  const text = String(value ?? chatQuery.value).trim()
  if (!text) return
  if (composerIntent.value === 'claim') {
    composerIntent.value = null
    activeTool.value = null
    void askScholarQA(text, { claim: true, ...(continueThread === false ? { forceNew: true } : {}) })
    return
  }
  activeTool.value = null
  void askScholarQA(text)
}

const submitIdleComposer = (value?: string) => submitComposer(value, false)
const submitDockedComposer = (value?: string) => submitComposer(value)

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

/**
 * Repair model formatting quirks before markdown parsing. Some model families
 * wrap citations in fullwidth CJK brackets (【label](url)】), which markdown
 * cannot parse — the citation renders as raw text and loses its click/hover
 * affordances. Em/en-dashes are banned by product style. The backend applies
 * the same repair to settled answers; doing it here too covers the live token
 * stream (re-rendered on every delta) and answers cached before the fix.
 */
/** "diet-food-and-nutritional-exposures-and-281008798" → "Diet food and nutritional exposures and…" */
const prettyUrnLabel = (urn: string): string => {
  const slug = urn.replace(/^urn:article:/, '').replace(/-\d{6,}$/, '')
  const words = slug.split('-').filter(Boolean)
  const label = words.join(' ')
  const trimmed = label.length > 48 ? `${label.slice(0, 48).trim()}…` : label
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

const normalizeAnswerProse = (text: string): string =>
  text
    // A leaked citation trailer (malformed sentinel) must never render: cut
    // from the sentinel — or the bare JSON object — to the end. Covers the
    // live stream mid-flight and answers cached before the backend fix.
    .replace(/<{2,}\s*END_ANSWER\s*>{2,}[\s\S]*$/, '')
    .replace(/\{\s*"cited_sources"[\s\S]*$/, '')
    // "[G679]([G679](/guidelines/x))": a citation wrapped in a second copy of
    // itself (the model's own link, linked again by a repair pass). Markdown
    // cannot nest a link inside a link's URL, so it rendered as "[G679[G680"
    // with nothing to click. Keep the inner, real link.
    .replace(/\[([^[\]]+)\]\(\s*\[\1\]\(([^()\s]+)\)\s*\)/g, '[$1]($2)')
    // 【label】, gpt-oss's citation brackets: square brackets, closed. Before a
    // URL that is the link's label; on its own it stays readable, and
    // "[general knowledge]" still becomes its badge. Dropping only 】 left
    // "[Johnson et al. (2024)." open, with nothing to click.
    .replace(/【\s*([^【】\n]{1,120}?)\s*】/g, '[$1]')
    .replace(/【/g, '[')
    .replace(/】/g, '')
    // A bare bracketed URN citation (a model quirk the backend now repairs
    // with real author labels) still lands here from answers cached before
    // that fix: give it a readable label and a working link. A URN inside a
    // proper link URL is preceded by "/", not "[", so it never matches.
    .replace(
      /\[\s*(urn:article:[a-z0-9][a-z0-9-]*)\s*\]?(?!\()/g,
      (_match, urn: string) => `[${prettyUrnLabel(urn)}](/articles/${urn})`
    )
    // "[Zhao et al. (2025)(/articles/urn)" → restore the missing "](" so the
    // citation forms a real link (well-formed links cannot match: the label
    // class excludes "]").
    .replace(/\[([^\[\]]+?)\((\/(?:articles|guidelines)\/[^)\s]+)\)/g, '[$1]($2)')
    .replace(/[ \t]*[—–][ \t]+/g, ', ')
    .replace(/[—–]/g, '-')

const renderMarkdown = (text: string): string => {
  if (!text) return ''

  const base = useRuntimeConfig().app.baseURL?.replace(/\/$/, '') || ''
  const normalizedText = normalizeAnswerProse(text)
    .replace(/\]\(\/articles\/(urn:article:[^)]+)\)/g, `](${base}/foodscholar/$1)`)
    .replace(/\]\(\/foodscholar\/(urn:article:[^)]+)\)/g, `](${base}/foodscholar/$1)`)
    // Guideline citations must be ROUTABLE, not just interceptable: a plain
    // click opens the peek, but a middle-click / open-in-new-tab bypasses the
    // handler and needs a real destination — the catalog resolver, which
    // redirects to the guide page with the rule highlighted.
    .replace(/\]\(\/guidelines\/([^)\s]+)\)/g, `](${base}/foodscholar/catalog/guidelines/$1)`)

  const rawHtml = marked(normalizedText, {
    breaks: true,
    gfm: true
  }) as string

  const sanitized = DOMPurify.sanitize(rawHtml)
  return markGeneralKnowledge(annotateCitationAnchors(sanitized))
}

// FoodScholar ends a sentence it could not source with the tag
// "[general knowledge]" (always in English). Shown as a small badge, so the
// reader sees which statements are not from the sources, instead of a stray
// bracket that looks like a broken citation. Inserted after sanitizing, from
// our own escaped strings.
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string))
const markGeneralKnowledge = (html: string): string => {
  if (!/\[general knowledge\]/i.test(html)) return html
  const badge = `<span class="qa-gk-badge" title="${escapeHtml(t('foodScholarHome.qa.generalKnowledgeTitle'))}">${escapeHtml(t('foodScholarHome.qa.generalKnowledge'))}</span>`
  return html.replace(/\s?\[general knowledge\]/gi, ` ${badge}`)
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

watch(libraryActivePills, (pills) => {
  if (pills.length > 0 && !pills.some(p => p.value === librarySelectedTopic.value)) {
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
    syncLibraryQuery()
  }
})

onMounted(async () => {
  hydrateLibraryFromQuery()

  // FoodChat bridge: /foodscholar?q=... prefills the composer and auto-asks
  // once. The query param is consumed (removed from the URL) before asking so
  // a hot reload or back-navigation doesn't re-trigger the question.
  const incomingQuestion = route.query.q
  if (typeof incomingQuestion === 'string' && incomingQuestion.trim() && !asking.value) {
    pageTab.value = 'qa'
    chatQuery.value = incomingQuestion.trim()
    const query = { ...route.query }
    delete query.q
    router.replace({ query })
    askScholarQA()
  }

  // Links into the question box: ?claim= checks a claim straight away;
  // ?draft= puts a question in the box, unsent (with ?tool=claim, as a claim);
  // ?tool= opens a list under the box. All consumed from the address.
  const take = (key: string) => {
    const raw = route.query[key]
    return typeof raw === 'string' ? raw.trim() : ''
  }
  const incomingClaim = take('claim')
  const draft = take('draft')
  const tool = take('tool')
  if (incomingClaim || draft || tool) {
    pageTab.value = 'qa'
    const query = { ...route.query }
    delete query.claim
    delete query.draft
    delete query.tool
    router.replace({ query })
    if (incomingClaim && !asking.value) {
      void askScholarQA(incomingClaim, { claim: true, forceNew: true })
    } else if (draft) {
      chatQuery.value = draft
      composerIntent.value = tool === 'claim' ? 'claim' : null
    } else if (tool === 'claim' || tool === 'everyday') {
      openTool(tool)
    }
  }

  // Restore a recent QA thread (within the store's TTL) so navigating away and
  // back to /foodscholar doesn't lose the question, answer, and citations.
  if (!qaResult.value && !asking.value) {
    const saved = qaStore.restore()
    if (saved) {
      qaResult.value = saved.result
      pendingQuestion.value = saved.question
      expertiseLevel.value = saved.expertiseLevel
      // Rehydrate the thread so a follow-up after navigation stays in-context.
      qaThreadId.value = saved.qaThreadId ?? null
      threadTurns.value = saved.turns ?? []
    }
  }

  await Promise.all([
    loadPopularArticles(),
    loadQaModels(),
    loadQaQuestions()
  ])

  if (pageTab.value === 'resources' && librarySelectedTopic.value !== CATEGORY_ALL) {
    selectLibraryFacet(librarySelectedTopic.value)
  }

  if (pageTab.value === 'resources') {
    loadLibraryMap()
    loadLibraryTextbooks()
    loadLibraryTopicFacets()
  }

  setupObserver()
  document.addEventListener('mousedown', handleLibraryClickOutside)

  if (figImgRef.value?.complete && figImgRef.value.naturalWidth > 0) {
    figLoaded.value = true
  }
})

onUnmounted(() => {
  observer?.disconnect()
  document.removeEventListener('mousedown', handleLibraryClickOutside)
  if (libraryAutocompleteTimer) clearTimeout(libraryAutocompleteTimer)
})
</script>

<style scoped>
/* Earlier exchanges of the thread: present but receded — dimmed until the
   reader deliberately engages with them. The sticky gradient above the list
   adds the top fade while scrolling through history. */

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

/* ── Question box: options tray, example cards, bottom dock ── */
.qa-composer-tray {
  /* One row: swiped sideways on a phone, wrapping from sm up. */
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  align-items: center;
  gap: 0.125rem;
  margin: -1.5rem 0.75rem 0;
  padding: 1.875rem 0.5rem 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-top: 0;
  border-radius: 0 0 1.25rem 1.25rem;
  background: rgba(244, 244, 245, 0.85);
}

@media (min-width: 640px) {
  .qa-composer-tray {
    flex-wrap: wrap;
    overflow-x: visible;
  }
}

.dark .qa-composer-tray {
  border-color: rgba(255, 255, 255, 0.06);
  background: rgba(39, 39, 42, 0.65);
}

.qa-composer-tray::-webkit-scrollbar {
  display: none;
}

.qa-tray-item {
  display: inline-flex;
  flex-shrink: 0;
  white-space: nowrap;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.5rem;
  padding: 0 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: rgb(75 85 99);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.qa-tray-item:hover {
  background: rgba(255, 255, 255, 0.9);
  color: rgb(17 24 39);
}

.dark .qa-tray-item {
  color: rgb(212 212 216);
}

.dark .qa-tray-item:hover {
  background: rgba(255, 255, 255, 0.07);
  color: white;
}

.qa-tray-item.is-active {
  background: rgb(from var(--color-brand-500) r g b / 0.1);
  color: var(--color-brand-600);
}

.dark .qa-tray-item.is-active {
  color: rgb(251 113 133);
}

/* Claim mode inside the box: a pill that says so and takes it off. */
.qa-claim-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 2.25rem;
  padding: 0 0.5rem 0 0.75rem;
  border-radius: 9999px;
  background: rgb(from var(--color-brand-500) r g b / 0.1);
  color: var(--color-brand-600);
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  transition: background-color 0.15s ease;
}

.qa-claim-pill:hover {
  background: rgb(from var(--color-brand-500) r g b / 0.16);
}

.dark .qa-claim-pill {
  background: rgb(from var(--color-brand-500) r g b / 0.22);
  color: rgb(253 164 175);
}

/* The same switch, off, in the docked box: an icon like its neighbours. */
.qa-claim-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  color: rgb(75 85 99);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.qa-claim-toggle:hover {
  background: rgba(0, 0, 0, 0.05);
  color: rgb(17 24 39);
}

.dark .qa-claim-toggle {
  color: rgb(212 212 216);
}

.dark .qa-claim-toggle:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

/* Keyboard focus in the brand colour, never the browser's blue on a click. */
.qa-tray-item:focus,
.qa-claim-pill:focus,
.qa-claim-toggle:focus {
  outline: none;
}

.qa-tray-item:focus-visible,
.qa-claim-pill:focus-visible,
.qa-claim-toggle:focus-visible {
  outline: 2px solid rgb(from var(--color-brand-500) r g b / 0.55);
  outline-offset: 2px;
}

.qa-tray-item.is-active {
  font-weight: 600;
  box-shadow: inset 0 0 0 1px rgb(from var(--color-brand-500) r g b / 0.25);
}

.qa-try-card {
  display: flex;
  flex-direction: column;
  text-align: left;
  padding: 1rem;
  border-radius: 1.25rem;
  border: 1px solid rgba(0, 0, 0, 0.07);
  background: rgba(255, 255, 255, 0.75);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.qa-try-card:hover {
  border-color: rgb(from var(--color-brand-500) r g b / 0.35);
  box-shadow: 0 10px 28px -16px rgba(0, 0, 0, 0.25);
  transform: translateY(-1px);
}

.dark .qa-try-card {
  border-color: rgba(255, 255, 255, 0.07);
  background: rgba(39, 39, 42, 0.55);
}

.qa-try-pill {
  flex-shrink: 0;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 0.75rem;
  font-weight: 500;
  color: rgb(55 65 81);
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.qa-try-card:hover .qa-try-pill {
  background: var(--color-brand-500);
  border-color: var(--color-brand-500);
  color: white;
}

.dark .qa-try-pill {
  border-color: rgba(255, 255, 255, 0.14);
  color: rgb(228 228 231);
}

/* In a conversation the box sits under the conversation pane; the fade
   above it lets the thread scroll away beneath its top edge. */
.qa-dock {
  position: relative;
  z-index: 30;
  flex-shrink: 0;
  /* Top and bottom only: the sides come from px-4 on the element. */
  padding-top: 0.25rem;
  padding-bottom: calc(0.75rem + var(--wf-safe-bottom, 0px));
}

/* Settling a streamed answer: no second entrance (see settledAfterStream). */
.qa-exchange.qa-settled-quiet,
.qa-settled-quiet .answer-reveal-ltr {
  animation: none;
  opacity: 1;
  transform: none;
  clip-path: none;
}

.qa-thread-bar {
  position: relative;
  z-index: 25;
  flex-shrink: 0;
}

/* The conversation fades out under the pinned bar, as it does above the box. */
.qa-thread-bar::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 1rem;
  pointer-events: none;
  background: linear-gradient(to bottom, rgb(255 255 255 / 0.9), rgb(255 255 255 / 0));
}

.dark .qa-thread-bar::after {
  background: linear-gradient(to bottom, rgb(16 16 18 / 0.9), rgb(16 16 18 / 0));
}

.qa-dock::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 100%;
  height: 1.5rem;
  pointer-events: none;
  background: linear-gradient(to top, rgb(255 255 255 / 0.9), rgb(255 255 255 / 0));
}

.dark .qa-dock::before {
  background: linear-gradient(to top, rgb(16 16 18 / 0.9), rgb(16 16 18 / 0));
}

.qa-jump-latest {
  position: absolute;
  top: -0.75rem;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: white;
  color: rgb(55 65 81);
  box-shadow: 0 6px 18px -8px rgba(0, 0, 0, 0.3);
}

.dark .qa-jump-latest {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgb(39 39 42);
  color: rgb(228 228 231);
}

.qa-jump-enter-active,
.qa-jump-leave-active {
  transition: opacity 0.15s ease;
}

.qa-jump-enter-from,
.qa-jump-leave-to {
  opacity: 0;
}

/* A follow-up's question scrolls to the top of the screen: it lands a little
   below the edge, and its exchange keeps a screen's height to rise into. */
.qa-exchange {
  scroll-margin-top: 1rem;
}

/* The pane's height, less a little air: room for the question to rise. */
.qa-exchange-fill {
  min-height: calc(var(--qa-thread-h, 70vh) - 2.5rem);
}

.qa-thread-end {
  height: 1px;
  scroll-margin-bottom: 1rem;
}

.qa-session-layout {
  min-height: 100%;
  /* The answer column's width (max-w-2xl, lg:max-w-3xl); the source rail
     takes what is left on the right. */
  --qa-center-width: 42rem;
}

@media (min-width: 1024px) {
  .qa-session-layout {
    --qa-center-width: 48rem;
  }
}

/* Answers read a touch larger than the 14px prose-sm default. */
.qa-answer-markdown {
  font-size: 0.9375rem;
  line-height: 1.7;
}

.qa-source-sidebar {
  position: absolute;
  right: 0;
  top: 0.25rem;
  bottom: 0.25rem;
  width: clamp(12rem, calc((100% - var(--qa-center-width)) / 2 - 1.5rem), 18rem);
  max-width: 18rem;
  /* Bound the rail to its container's height and scroll internally so a long
     source list never overruns the page footer. The sticky inner wrapper
     (.qa-source-sidebar-inner) keeps the visible sources pinned in the
     viewport as the answer scrolls. */
  overflow: visible;
}

/* The left rail mirrors the source rail on the right. */
.qa-memory-rail {
  position: absolute;
  left: 0;
  top: 0.25rem;
  bottom: 0.25rem;
  width: clamp(12rem, calc((100% - var(--qa-center-width)) / 2 - 1.5rem), 18rem);
  max-width: 18rem;
}

.qa-memory-rail-inner {
  position: sticky;
  top: 1.5rem;
  display: flex;
  flex-direction: column;
  max-height: min(32rem, calc(100vh - 3rem));
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.qa-source-sidebar-inner {
  position: sticky;
  top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  /* Fixed, compact cap; never taller than the viewport. Scrolls internally
     with a minimal, mostly-transparent scrollbar. */
  max-height: min(32rem, calc(100vh - 3rem));
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 2px;
  /* Scrollbar stays hidden until the pointer enters the column. */
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color 0.2s ease;
}

.qa-source-sidebar-inner:hover {
  scrollbar-color: rgba(120, 113, 108, 0.35) transparent;
}

.dark .qa-source-sidebar-inner:hover {
  scrollbar-color: rgba(161, 161, 170, 0.35) transparent;
}

.qa-source-sidebar-inner::-webkit-scrollbar {
  width: 3px;
}

.qa-source-sidebar-inner::-webkit-scrollbar-track {
  background: transparent;
}

.qa-source-sidebar-inner::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 9999px;
  transition: background-color 0.2s ease;
}

.qa-source-sidebar-inner:hover::-webkit-scrollbar-thumb {
  background-color: rgba(120, 113, 108, 0.4);
}

.dark .qa-source-sidebar-inner:hover::-webkit-scrollbar-thumb {
  background-color: rgba(161, 161, 170, 0.38);
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

/* Guideline mentions (Gn) — emphasized in the brand colour. Keyed on
   data-citation-type so it is independent of the deployment base path. */
:deep(.qa-answer-markdown a[data-citation-type="guideline"]) {
  color: var(--color-brand-600, #aa2944);
  text-decoration: none;
  font-weight: 600;
}

:deep(.qa-answer-markdown a[data-citation-type="guideline"]:hover) {
  color: var(--color-brand-700, #801f33);
  text-decoration: underline;
}

:deep(.dark .qa-answer-markdown a[data-citation-type="guideline"]) {
  color: var(--color-brand-400, #dd5c77);
}

:deep(.dark .qa-answer-markdown a[data-citation-type="guideline"]:hover) {
  color: var(--color-brand-300, #e6839a);
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

/* Subtle wavy grainient behind the Library intro heading.
   Animated CSS mesh of brand + earth-tone blobs, softly masked at the edges,
   with a film-grain overlay. Adapted from the grainient vocabulary to the
   app's light-first rose/earth palette. */
.grainient-intro {
  position: absolute;
  /* A medium organic glow sitting behind the copy, kept clear of the
     container edges on every side. */
  /* Extra bleed room on every side so the blobs have space to fade out fully
     inside the element, never reaching its edges. */
  inset: -7rem -7rem -7rem -7rem;
  z-index: 0;
  overflow: visible;
  pointer-events: none;
  /* Blobs are clustered toward the centre with fades that complete well inside
     the element bounds (transparent reached by ~58-62% radius), so nothing is
     clipped at the edges. */
  -webkit-mask-image:
    radial-gradient(38% 44% at 36% 42%, #000 0%, transparent 60%),
    radial-gradient(34% 40% at 60% 36%, #000 0%, transparent 62%),
    radial-gradient(42% 48% at 48% 62%, #000 0%, transparent 60%);
  mask-image:
    radial-gradient(38% 44% at 36% 42%, #000 0%, transparent 60%),
    radial-gradient(34% 40% at 60% 36%, #000 0%, transparent 62%),
    radial-gradient(42% 48% at 48% 62%, #000 0%, transparent 60%);
  -webkit-mask-composite: source-over;
  mask-composite: add;
  opacity: 0.5;
}

.grainient-intro__mesh {
  position: absolute;
  inset: -8%;
  background:
    radial-gradient(42% 48% at 36% 42%, var(--color-brand-300, #e68599) 0%, transparent 64%),
    radial-gradient(38% 44% at 60% 36%, var(--earth-2, #cad5b2) 0%, transparent 66%),
    radial-gradient(46% 52% at 48% 62%, var(--color-brand-200, #eeadbb) 0%, transparent 64%);
  filter: blur(40px) saturate(108%);
  will-change: transform;
  animation: grainient-wave 26s ease-in-out infinite alternate;
}

/* Dark mode: deeper brand tones, lower lift, so it stays subtle on dark. */
:global(.dark .grainient-intro) {
  opacity: 0.4;
}

:global(.dark .grainient-intro__mesh) {
  background:
    radial-gradient(42% 48% at 36% 42%, var(--color-brand-600, #aa2944) 0%, transparent 64%),
    radial-gradient(38% 44% at 60% 36%, var(--color-brandg-700, #646d1a) 0%, transparent 66%),
    radial-gradient(46% 52% at 48% 62%, var(--color-brand-700, #801f33) 0%, transparent 64%);
  filter: blur(44px) saturate(115%);
}

.grainient-intro__grain {
  position: absolute;
  inset: 0;
  /* Tiled SVG fractal noise — the "grain" of grainient. Higher frequency =
     finer, denser grain; raised opacity makes the texture clearly visible. */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 130px 130px;
  opacity: 0.34;
  mix-blend-mode: overlay;
}

:global(.dark .grainient-intro__grain) {
  opacity: 0.26;
}

@keyframes grainient-wave {
  0% {
    transform: translate3d(-1.5%, -1%, 0) rotate(0deg) scale(1.02);
  }
  50% {
    transform: translate3d(1.5%, 1%, 0) rotate(3deg) scale(1.06);
  }
  100% {
    transform: translate3d(1%, -0.5%, 0) rotate(-2deg) scale(1.03);
  }
}

@media (prefers-reduced-motion: reduce) {
  .grainient-intro__mesh {
    animation: none;
    transform: translate3d(0, 0, 0) scale(1.02);
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

.fig-mark {
  transform-origin: 50% 90%;
  will-change: transform;
}

.fig-mark--animate {
  animation: fig-tilt 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) 120ms 1 both;
}

.fig-mark.fig-mark--replay {
  animation: fig-tilt 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) 0s 1 both;
}

@keyframes fig-tilt {
  0%   { transform: rotate(0deg) scale(0.96); }
  25%  { transform: rotate(-9deg) scale(1.02); }
  55%  { transform: rotate(7deg) scale(1.01); }
  80%  { transform: rotate(-3deg) scale(1); }
  100% { transform: rotate(0deg) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .fig-mark--animate,
  .fig-mark--replay { animation: none; }
}
</style>
