<template>
  <div class="min-h-full flex flex-col relative bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <!-- Header -->
    <AppPageHeader
      back-to="/dashboard"
      :back-label="t('foodChatHome.backToDashboard')"
      brand-title="FoodChat"
      brand-class="text-brandp-500 dark:text-brandp-400"
      :subtitle="t('foodChatHome.subtitle')"
    />

    <AppFeatureGate feature="foodchat">

    <!-- ===== IDLE STATE ===== -->
    <Transition name="layout-fade">
      <div
        v-if="!hasSentFirstMessage"
        key="idle"
        class="flex-1 flex flex-col items-center justify-center px-4 pt-36 pb-4"
      >
        <div class="w-full max-w-2xl">
          <!-- Welcome heading -->
          <div class="text-center mb-8">
            <h2 class="text-2xl sm:text-3xl font-light text-gray-900 dark:text-white mb-3">
              {{ t('foodChatHome.welcomeTitle.prefix') }}
              <span class="font-serif italic text-brandp-500 text-3xl sm:text-4xl">{{ t('foodChatHome.welcomeTitle.accent') }}</span>
              {{ t('foodChatHome.welcomeTitle.suffix') }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 font-light">
              {{ t('foodChatHome.welcomeSubtitle') }}
            </p>
          </div>

          <!-- Central chat input -->
          <div class="relative mb-3">
            <div class="chat-composer" :class="{ 'is-focused': inputFocused }">
              <div class="flex items-end gap-2 p-2">
                <textarea
                  ref="idleInputRef"
                  v-model="inputText"
                  rows="1"
                  :disabled="sending"
                  :placeholder="t('foodChatHome.input.placeholderInitial')"
                  class="flex-1 resize-none overflow-hidden bg-transparent px-3 py-2.5 text-[15px] text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 focus:outline-none max-h-32 font-light transition-colors leading-relaxed"
                  @input="autoResize($event, idleInputRef)"
                  @keydown="handleKeydown"
                  @focus="inputFocused = true"
                  @blur="inputFocused = false"
                />
                <button
                  :disabled="!canSend"
                  class="chat-send-button h-10 w-10 flex items-center justify-center rounded-xl bg-brandp-500 text-white disabled:opacity-40 shadow-md shadow-brandp-700/20 shrink-0 mb-0.5"
                  :class="{ 'chat-send-idle': canSend && !sending }"
                  @click="handleSend"
                >
                  <UIcon v-if="sending" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
                  <UIcon v-else name="i-lucide-arrow-up" class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Below chatbar row: hint right, sessions left -->
            <div class="mt-2 px-1 flex items-center justify-between gap-3">
              <Transition name="chips-fade">
                <div v-if="sessions.length > 0" class="flex items-center gap-1.5 min-w-0">
                  <UIcon name="i-lucide-history" class="w-3 h-3 text-gray-400 dark:text-zinc-500 shrink-0" />
                  <USelectMenu
                    :model-value="null"
                    :items="sessionItems"
                    value-key="value"
                    label-key="label"
                    :search-input="false"
                    size="xs"
                    :placeholder="t('foodChatHome.chat.previousSessions')"
                    :content="{ align: 'start', side: 'bottom', sideOffset: 4 }"
                    :ui="{ base: 'fc-session-select text-xs text-gray-500 dark:text-zinc-400 cursor-pointer' }"
                    class="w-44"
                    @update:model-value="handleSessionSwitch"
                  />
                </div>
                <div v-else />
              </Transition>
              <p class="text-[11px] text-gray-400 dark:text-zinc-500 shrink-0">
                {{ t('foodChatHome.input.enterHint') }}
              </p>
            </div>
          </div>

          <!-- Suggested questions -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <button
              v-for="(q, idx) in suggestedQuestions"
              :key="q.text"
              class="group p-4 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/30 text-left hover:border-brandp-200 dark:hover:border-brandp-800 hover:bg-brandp-50/50 dark:hover:bg-brandp-900/10 hover:-translate-y-0.5 hover:shadow-md hover:shadow-brandp-500/5 transition-all duration-200 suggestion-card"
              :style="{ animationDelay: `${idx * 0.08}s` }"
              @click="handleQuickAsk(q.text)"
            >
              <UIcon :name="q.icon" class="w-4 h-4 mb-2.5 text-brandp-500" />
              <p class="text-xs text-gray-600 dark:text-gray-400 font-light leading-relaxed group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">{{ q.text }}</p>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ===== SPLIT LAYOUT: chat + canvas ===== -->
    <Transition name="layout-fade">
      <div
        v-if="hasSentFirstMessage"
        key="split"
        class="flex-1 flex justify-center px-4 sm:px-6 py-6 pt-12 min-h-0"
      >
        <div class="fc-split-wrap flex w-full max-w-7xl min-h-0">

        <!-- ── LEFT: Chat column (FoodScholar-style floating) ── -->
        <div class="fc-chat-col flex flex-col min-w-0 relative">

          <!-- Session bar -->
          <div class="fc-session-bar flex items-center gap-2 px-3 py-2 shrink-0">
            <UIcon name="i-lucide-messages-square" class="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 shrink-0" />
            <USelectMenu
              :model-value="activeSession?.session_id ?? null"
              :items="sessionItems"
              value-key="value"
              label-key="label"
              :search-input="false"
              size="xs"
              :ui="{ base: 'fc-session-select flex-1 min-w-0 truncate text-xs text-gray-600 dark:text-zinc-400 cursor-pointer', trailingIcon: 'w-3 h-3' }"
              :content="{ align: 'start', side: 'bottom', sideOffset: 4 }"
              class="flex-1 min-w-0 fc-session-select"
              @update:model-value="handleSessionSwitch"
            />
            <button
              class="shrink-0 h-6 w-6 flex items-center justify-center rounded-md text-gray-400 dark:text-zinc-500 hover:text-brandp-500 dark:hover:text-brandp-400 hover:bg-brandp-50 dark:hover:bg-brandp-950/30 transition-colors"
              :title="t('foodChatHome.chat.startFresh')"
              @click="handleStartOver"
            >
              <UIcon name="i-lucide-plus" class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Top fade — sits above the scroll area, not inside it -->
          <div class="fc-messages-top-fade pointer-events-none" />

          <!-- Message area — scrollable -->
          <div
            ref="messagesScrollRef"
            class="fc-messages-area flex-1 overflow-y-auto px-4 pt-16 pb-2"
            @scroll="handleMessagesScroll"
          >

            <!-- Load more -->
            <Transition name="section-fade">
              <div v-if="hasMoreMessages" class="flex justify-center mb-4 pt-2">
                <button
                  :disabled="loadingMoreMessages"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors disabled:opacity-50"
                  @click="handleLoadMore"
                >
                  <UIcon v-if="loadingMoreMessages" name="i-lucide-loader-2" class="w-3.5 h-3.5 animate-spin" />
                  <UIcon v-else name="i-lucide-chevron-up" class="w-3.5 h-3.5" />
                  {{ t('foodChatHome.chat.loadEarlier') }}
                </button>
              </div>
            </Transition>

            <!-- Messages -->
            <div class="space-y-3 pb-2">
              <TransitionGroup name="msg">
                <div
                  v-for="msg in messages"
                  :key="msg.id ?? msg.timestamp"
                  class="flex"
                  :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
                >
                  <!-- User bubble -->
                  <div
                    v-if="msg.role === 'user'"
                    class="fc-bubble fc-bubble-user"
                  >
                    <p class="text-sm leading-relaxed">{{ msg.content }}</p>
                  </div>

                  <!-- Assistant bubble -->
                  <div v-else class="fc-bubble fc-bubble-assistant group/msg">
                    <div class="fc-md text-gray-800 dark:text-gray-200" v-html="renderMarkdown(msg.content)" />

                    <!-- Feedback row -->
                    <div v-if="msg.id" class="mt-2 flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                      <button
                        :class="['fc-feedback-btn', messageFeedback[msg.id] === 'up' ? 'fc-feedback-active-up' : '']"
                        @click="handleMessageFeedback(msg.id, 'up')"
                      >
                        <UIcon name="i-lucide-thumbs-up" class="w-3 h-3" />
                      </button>
                      <button
                        :class="['fc-feedback-btn', messageFeedback[msg.id] === 'down' ? 'fc-feedback-active-down' : '']"
                        @click="handleMessageFeedback(msg.id, 'down')"
                      >
                        <UIcon name="i-lucide-thumbs-down" class="w-3 h-3" />
                      </button>

                      <!-- Negative reason chips (appear after thumbs down) -->
                      <Transition name="chips-fade">
                        <div v-if="messageFeedback[msg.id] === 'down' && !feedbackSubmitted[msg.id]" class="flex flex-wrap gap-1 ml-1">
                          <button
                            v-for="reason in negativeFeedbackReasons"
                            :key="reason"
                            :class="['px-2 py-0.5 text-[10px] rounded-full border transition-colors',
                              selectedFeedbackReason[msg.id] === reason
                                ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300'
                                : 'border-gray-300 dark:border-zinc-600 text-gray-500 dark:text-gray-400 hover:border-red-300']"
                            @click="handleFeedbackReason(msg.id, reason)"
                          >
                            {{ reason }}
                          </button>
                        </div>
                      </Transition>

                      <Transition name="chips-fade">
                        <span v-if="feedbackSubmitted[msg.id]" class="text-[10px] text-emerald-600 dark:text-emerald-400 ml-1 flex items-center gap-1">
                          <UIcon name="i-lucide-check" class="w-3 h-3" />
                          {{ t('foodChatHome.chat.feedbackSaved') }}
                        </span>
                      </Transition>
                    </div>
                  </div>
                </div>
              </TransitionGroup>

              <!-- Sending skeleton -->
              <Transition name="msg">
                <div v-if="sending" class="flex justify-start">
                  <div class="fc-bubble fc-bubble-assistant fc-bubble-loading">
                    <div class="flex items-center gap-1.5">
                      <span class="fc-dot" style="animation-delay: 0ms" />
                      <span class="fc-dot" style="animation-delay: 160ms" />
                      <span class="fc-dot" style="animation-delay: 320ms" />
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          <!-- ── Chat input (pinned to bottom) ── -->
          <div class="fc-composer-wrap px-4 pb-4 pt-2">
            <div class="relative">
              <div class="chat-composer" :class="{ 'is-focused': sessionInputFocused }">
                <div class="chat-composer-accent chat-composer-accent-left" />
                <div class="chat-composer-accent chat-composer-accent-right" />
                <div class="flex items-end gap-2 p-2">
                  <textarea
                    ref="sessionInputRef"
                    v-model="inputText"
                    rows="1"
                    :disabled="sending"
                    :placeholder="t('foodChatHome.input.placeholderChat')"
                    class="flex-1 resize-none overflow-hidden bg-transparent px-2 py-2 text-[14px] text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-400 focus:outline-none max-h-28 font-light leading-relaxed"
                    @input="autoResize($event, sessionInputRef)"
                    @keydown="handleKeydown"
                    @focus="sessionInputFocused = true"
                    @blur="sessionInputFocused = false"
                  />
                  <div class="flex items-center gap-1 shrink-0 mb-0.5">
                    <button
                      :disabled="!canSend"
                      class="chat-send-button h-9 w-9 flex items-center justify-center rounded-xl bg-brandp-500 text-white disabled:opacity-40 shadow-md shadow-brandp-700/20"
                      :class="{ 'chat-send-idle': canSend && !sending }"
                      @click="handleSend"
                    >
                      <UIcon v-if="sending" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
                      <UIcon v-else name="i-lucide-arrow-up" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── RIGHT: Canvas column ── -->
        <div class="fc-canvas-col flex flex-col overflow-y-auto">
          <div class="flex-1 p-4 sm:p-6 flex flex-col justify-center">

            <!-- Generating animation -->
            <Transition name="plan-reveal">
              <div v-if="sending" class="flex flex-col items-center justify-center h-full min-h-80">
                <FoodchatCookingAnimation />
              </div>
            </Transition>

            <!-- Placeholder when no plan yet and not generating -->
            <Transition name="plan-reveal">
              <div v-if="!sending && !hasAnyPlan" class="flex flex-col items-center justify-center h-full min-h-80 text-center px-8">
                <div class="w-16 h-16 rounded-2xl bg-brandp-50 dark:bg-brandp-950/30 flex items-center justify-center mb-4">
                  <UIcon name="i-lucide-calendar-days" class="w-8 h-8 text-brandp-300 dark:text-brandp-700" />
                </div>
                <p class="text-base font-light text-gray-400 dark:text-zinc-500 mb-1">{{ t('foodChatHome.canvas.placeholderTitle') }}</p>
                <p class="text-xs text-gray-300 dark:text-zinc-600">{{ t('foodChatHome.canvas.placeholderSubtitle') }}</p>
              </div>
            </Transition>

            <!-- Plan canvas -->
            <Transition name="plan-reveal">
              <div v-if="hasAnyPlan && !sending" class="plan-card">

                <!-- ── Canvas toolbar ── -->
                <div class="flex items-center justify-between mb-4 gap-2 flex-wrap">
                  <!-- Type toggle (only if both types exist) -->
                  <div v-if="hasMealPlans && hasWeeklyMealPlans" class="flex rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden text-xs">
                    <button
                      :class="['px-3 py-1.5 transition-colors', canvasMode === 'daily' ? 'bg-brandp-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800']"
                      @click="canvasMode = 'daily'"
                    >{{ t('foodChatHome.planHeader.dailyPlan') }}</button>
                    <button
                      :class="['px-3 py-1.5 transition-colors', canvasMode === 'weekly' ? 'bg-brandp-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800']"
                      @click="canvasMode = 'weekly'"
                    >{{ t('foodChatHome.planHeader.weeklyPlan') }}</button>
                  </div>
                  <!-- Title when only one type -->
                  <div v-else class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-brandp-100 dark:bg-brandp-950/50 flex items-center justify-center">
                      <UIcon :name="canvasMode === 'weekly' ? 'i-lucide-calendar-range' : 'i-lucide-calendar-days'" class="w-4 h-4 text-brandp-500" />
                    </div>
                    <span class="text-sm font-medium text-gray-900 dark:text-white">{{ canvasMode === 'weekly' ? t('foodChatHome.planHeader.weeklyPlan') : t('foodChatHome.planHeader.dailyPlan') }}</span>
                  </div>

                  <!-- Plan history dropdown -->
                  <USelect
                    v-if="canvasMode === 'daily' && mealPlans.length > 1"
                    :model-value="selectedDailyPlanIdx"
                    :items="mealPlans.map((p, i) => ({ label: formatPlanDate(p.created_at) + (p.version ? ' · v' + p.version : ''), value: i }))"
                    size="xs"
                    color="neutral"
                    variant="outline"
                    class="w-44"
                    @update:model-value="selectedDailyPlanIdx = $event"
                  />
                  <USelect
                    v-else-if="canvasMode === 'weekly' && weeklyMealPlans.length > 1"
                    :model-value="selectedWeeklyPlanIdx"
                    :items="weeklyMealPlans.map((p, i) => ({ label: formatPlanDate(p.created_at) + (p.version ? ' · v' + p.version : ''), value: i }))"
                    size="xs"
                    color="neutral"
                    variant="outline"
                    class="w-44"
                    @update:model-value="selectedWeeklyPlanIdx = $event"
                  />
                  <span v-else class="text-xs text-gray-400 font-light">
                    {{ canvasMode === 'daily' && displayedMealPlan ? formatPlanDate(displayedMealPlan.created_at) : '' }}
                    {{ canvasMode === 'weekly' && displayedWeeklyPlan ? formatPlanDate(displayedWeeklyPlan.created_at) : '' }}
                  </span>
                </div>

                <!-- ── Daily plan content ── -->
                <template v-if="canvasMode === 'daily' && displayedMealPlan">
                  <div
                    class="rounded-2xl overflow-hidden mb-4"
                    :class="mealGridCols(displayedMealPlan)"
                  >
                    <FoodchatMealScheduleCard
                      v-if="displayedMealPlan.breakfast"
                      :type="t('foodChatHome.meals.breakfast')"
                      time="08:00"
                      icon="i-lucide-coffee"
                      :recipe="displayedMealPlan.breakfast"
                    />
                    <FoodchatMealScheduleCard
                      v-if="displayedMealPlan.lunch"
                      :type="t('foodChatHome.meals.lunch')"
                      time="13:00"
                      icon="i-lucide-utensils"
                      :recipe="displayedMealPlan.lunch"
                    />
                    <FoodchatMealScheduleCard
                      v-if="displayedMealPlan.dinner"
                      :type="t('foodChatHome.meals.dinner')"
                      time="19:30"
                      icon="i-lucide-moon"
                      :recipe="displayedMealPlan.dinner"
                    />
                  </div>

                  <div v-if="displayedMealPlan.reasoning" class="flex items-start gap-2 mb-4 px-1">
                    <UIcon name="i-lucide-lightbulb" class="w-3.5 h-3.5 text-brandp-400 mt-0.5 shrink-0" />
                    <p class="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed">{{ displayedMealPlan.reasoning }}</p>
                  </div>

                  <!-- Plan vote -->
                  <div class="mb-5 px-1">
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-gray-400">{{ t('foodChatHome.canvas.rateThisPlan') }}</span>
                      <UTooltip :text="t('foodChatHome.tooltips.planWorksWell')">
                        <button
                          :class="['fc-feedback-btn', planVotes[displayedMealPlan.id] === 'up' ? 'fc-feedback-active-up' : '']"
                          @click="votePlan(displayedMealPlan.id, 'up', getMessageIdForPlanIdx(selectedDailyPlanIdx))"
                        >
                          <UIcon name="i-lucide-thumbs-up" class="w-3.5 h-3.5" />
                        </button>
                      </UTooltip>
                      <UTooltip :text="t('foodChatHome.tooltips.needsImprovement')">
                        <button
                          :class="['fc-feedback-btn', planVotes[displayedMealPlan.id] === 'down' ? 'fc-feedback-active-down' : '']"
                          @click="votePlan(displayedMealPlan.id, 'down', getMessageIdForPlanIdx(selectedDailyPlanIdx))"
                        >
                          <UIcon name="i-lucide-thumbs-down" class="w-3.5 h-3.5" />
                        </button>
                      </UTooltip>
                      <Transition name="chips-fade">
                        <span v-if="planFeedbackSubmitted[displayedMealPlan.id]" class="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <UIcon name="i-lucide-check" class="w-3 h-3" />
                          {{ t('foodChatHome.chat.feedbackSaved') }}
                        </span>
                      </Transition>
                    </div>
                    <Transition name="chips-fade">
                      <div v-if="planVotes[displayedMealPlan.id] === 'down' && !planFeedbackSubmitted[displayedMealPlan.id]" class="mt-2 flex items-center gap-2">
                        <input
                          v-model="planFeedbackComments[displayedMealPlan.id]"
                          type="text"
                          :placeholder="t('foodChatHome.canvas.feedbackCommentPlaceholder')"
                          class="flex-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:border-brandp-400"
                          @keydown.enter="submitPlanComment(displayedMealPlan.id, getMessageIdForPlanIdx(selectedDailyPlanIdx))"
                        />
                        <button
                          class="text-xs px-3 py-1.5 rounded-lg bg-brandp-500 text-white hover:bg-brandp-600 transition-colors"
                          @click="submitPlanComment(displayedMealPlan.id, getMessageIdForPlanIdx(selectedDailyPlanIdx))"
                        >
                          {{ t('foodChatHome.canvas.feedbackCommentSend') }}
                        </button>
                      </div>
                    </Transition>
                  </div>
                </template>

                <!-- ── Weekly plan content ── -->
                <template v-else-if="canvasMode === 'weekly' && displayedWeeklyPlan">
                  <div class="overflow-x-auto">
                    <div class="grid grid-cols-7 gap-1 min-w-[560px]">
                      <!-- Day headers -->
                      <div
                        v-for="day in weeklyDays"
                        :key="day.dayIndex"
                        class="text-center text-[10px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide pb-1"
                      >
                        {{ day.label }}
                      </div>
                      <!-- Meal cells: breakfast, lunch, dinner rows -->
                      <template v-for="mealType in ['breakfast', 'lunch', 'dinner']" :key="mealType">
                        <div
                          v-for="day in weeklyDays"
                          :key="`${day.dayIndex}-${mealType}`"
                          class="relative rounded-lg border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 p-1.5 min-h-[130px] flex flex-col gap-1"
                        >
                          <div class="flex items-center gap-1">
                            <UIcon :name="mealTypeIcon(mealType)" class="w-2.5 h-2.5 text-brandp-400 shrink-0" />
                            <span class="text-[9px] text-gray-400 dark:text-zinc-500 capitalize">{{ mealType }}</span>
                          </div>
                          <!-- Circular image bubble -->
                          <NuxtLink
                            :to="getWeeklyRecipeId(day.entries.find(e => e.meal_type === mealType)) ? `/recipe-wrangler/${getWeeklyRecipeId(day.entries.find(e => e.meal_type === mealType))}` : ''"
                            :target="getWeeklyRecipeId(day.entries.find(e => e.meal_type === mealType)) ? '_blank' : undefined"
                            class="w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-700 shrink-0 transition-transform duration-200 hover:scale-150 cursor-pointer block"
                          >
                            <img
                              v-if="getRecipeImage(getWeeklyRecipeId(day.entries.find(e => e.meal_type === mealType)))"
                              :src="getRecipeImage(getWeeklyRecipeId(day.entries.find(e => e.meal_type === mealType)))"
                              class="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div
                              v-else-if="isRecipeImagePending(getWeeklyRecipeId(day.entries.find(e => e.meal_type === mealType)))"
                              class="w-full h-full animate-pulse"
                            />
                            <div v-else class="w-full h-full flex items-center justify-center">
                              <UIcon name="i-lucide-utensils" class="w-3 h-3 text-gray-300 dark:text-zinc-600" />
                            </div>
                          </NuxtLink>
                          <NuxtLink
                            v-if="getWeeklyRecipeId(day.entries.find(e => e.meal_type === mealType))"
                            :to="`/recipe-wrangler/${getWeeklyRecipeId(day.entries.find(e => e.meal_type === mealType))}`"
                            target="_blank"
                            class="text-[11px] font-medium text-brandp-600 dark:text-brandp-400 leading-tight line-clamp-2 hover:underline pr-7"
                          >
                            {{ getWeeklyRecipeTitle(day.entries.find(e => e.meal_type === mealType)) }}
                          </NuxtLink>
                          <p v-else class="text-[11px] font-medium text-gray-800 dark:text-gray-200 leading-tight line-clamp-2 pr-7">
                            {{ getWeeklyRecipeTitle(day.entries.find(e => e.meal_type === mealType)) }}
                          </p>
                          <!-- Nutrient donut — bottom right -->
                          <div
                            v-if="getWeeklyRecipeId(day.entries.find(e => e.meal_type === mealType)) && getWeeklySegments(getWeeklyRecipeId(day.entries.find(e => e.meal_type === mealType))).length"
                            class="absolute bottom-1 right-1 cursor-help"
                            @mouseleave="weeklyHovered[`${day.dayIndex}-${mealType}`] = null"
                          >
                            <svg width="28" height="28" viewBox="0 0 28 28" style="transform:rotate(-90deg)">
                              <circle cx="14" cy="14" r="11" stroke="#e5e7eb" stroke-width="3.5" fill="none" />
                              <circle
                                v-for="seg in getWeeklySegments(getWeeklyRecipeId(day.entries.find(e => e.meal_type === mealType)))"
                                :key="seg.key"
                                cx="14" cy="14" r="11"
                                :stroke="seg.color"
                                stroke-width="3.5"
                                fill="none"
                                :stroke-dasharray="`${seg.dash} ${weeklyCircumference}`"
                                :stroke-dashoffset="-seg.offset"
                                stroke-linecap="butt"
                                :style="{ opacity: weeklyHovered[`${day.dayIndex}-${mealType}`] && weeklyHovered[`${day.dayIndex}-${mealType}`] !== seg.key ? 0.25 : 1, transition: 'opacity 0.15s' }"
                                @mouseenter="weeklyHovered[`${day.dayIndex}-${mealType}`] = seg.key"
                              />
                            </svg>
                            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span class="text-[7px] font-bold text-gray-700 dark:text-gray-200 leading-none">{{ getWeeklyCenterValue(getWeeklyRecipeId(day.entries.find(e => e.meal_type === mealType)), `${day.dayIndex}-${mealType}`) }}</span>
                            </div>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </template>

              </div>
            </Transition>

          </div>
        </div>

        </div><!-- end fc-split-wrap -->
      </div>
    </Transition>

    <!-- Disclaimer -->
    <div class="pb-4 text-center">
      <p class="text-[10px] text-gray-400 dark:text-gray-500 font-light">{{ t('foodChatHome.disclaimer') }}</p>
    </div>

    <!-- Error toast -->
    <Transition name="toast-slide">
      <div
        v-if="error"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-md w-full px-4 z-50"
      >
        <div class="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200/80 dark:border-red-800/50 text-sm text-red-700 dark:text-red-300 shadow-lg shadow-red-500/5">
          <UIcon name="i-lucide-alert-circle" class="w-4 h-4 shrink-0" />
          <span class="flex-1 font-light">{{ error }}</span>
          <button class="shrink-0 text-red-400 hover:text-red-600 transition-colors" @click="clearError">
            <UIcon name="i-lucide-x" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Transition>
    </AppFeatureGate>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useFoodChat } from '~/composables/useFoodChat'
import { useHouseholdStore } from '~/stores/household'
import type { MealPlan, MealRecipe, WeeklyMealEntry } from '~/services/foodchatApi'
import recipeApi from '~/services/recipeApi'
import { today, getLocalTimeZone, type DateValue } from '@internationalized/date'
import memberMealPlansApi, {
  extractSourceMealPlanIdFromMemberMealPlanResponse,
  extractStoredMealPlanIdFromMemberMealPlanResponse
} from '~/services/memberMealPlansApi'
import type { HouseholdMember } from '~/services/householdsApi'
import { stringToAvatarConfig, type AvatarConfig } from '~/utils/avatarPresets'

definePageMeta({ layout: 'default', middleware: ['auth'] })

const { t, locale } = useI18n()
useHead({ title: computed(() => t('foodChatHome.pageTitle')) })

const {
  sessions,
  activeSession,
  messages,
  mealPlans,
  weeklyMealPlans,
  hasMealPlans,
  hasWeeklyMealPlans,
  hasAnyPlan,
  currentPlanType,
  hasMoreMessages,
  loadingMoreMessages,
  sending,
  error,
  loadSessions,
  newSession,
  selectSession,
  sendMessage,
  loadMoreMessages,
  submitMessageFeedback,
  clearError
} = useFoodChat()

const householdStore = useHouseholdStore()

// ── Input state ──
const inputText = ref('')
const idleInputRef = ref<HTMLTextAreaElement | null>(null)
const sessionInputRef = ref<HTMLTextAreaElement | null>(null)
const messagesScrollRef = ref<HTMLElement | null>(null)
const inputFocused = ref(false)
const sessionInputFocused = ref(false)
const hasSentFirstMessage = ref(false)

// ── Plan votes ──
const planVotes = reactive<Record<string, 'up' | 'down' | null>>({})
const planFeedbackComments = reactive<Record<string, string>>({})
const planFeedbackSubmitted = reactive<Record<string, boolean>>({})

// Assistant messages newest-first (for plan→message mapping)
const assistantMessagesDesc = computed(() =>
  [...messages.value].filter(m => m.role === 'assistant' && m.id != null).reverse()
)

function getMessageIdForPlanIdx(idx: number): number | null {
  return assistantMessagesDesc.value[idx]?.id ?? null
}

// ── Message feedback ──
const messageFeedback = reactive<Record<number, 'up' | 'down'>>({})
const feedbackSubmitted = reactive<Record<number, boolean>>({})
const selectedFeedbackReason = reactive<Record<number, string>>({})

// ── Apply state ──
const selectedApplyMemberIds = ref<string[]>([])
const applyingMealPlan = ref(false)
const revokingMealPlan = ref(false)
const applyError = ref<string | null>(null)
const applySuccess = ref<string | null>(null)
const selectedApplyDateValue = ref<DateValue>(today(getLocalTimeZone()))
const storedMealPlanIdsBySourceId = ref<Record<string, string>>({})
const revocablePlanIdByMemberId = ref<Record<string, string>>({})
const checkingRevokeEligibility = ref(false)
let revokeEligibilityRequestId = 0

const minApplyDateValue = computed(() => today(getLocalTimeZone()))
const selectedApplyDate = computed(() => selectedApplyDateValue.value.toString())

// ── Computed ──
const canSend = computed(() => inputText.value.trim().length > 0 && !sending.value)
const latestMealPlan = computed(() => mealPlans.value?.[0] ?? null)
const latestWeeklyPlan = computed(() => weeklyMealPlans.value?.[0] ?? null)

// ── Canvas mode & plan selection ──
const canvasMode = ref<'daily' | 'weekly'>('daily')
const selectedDailyPlanIdx = ref(0)
const selectedWeeklyPlanIdx = ref(0)

const displayedMealPlan = computed(() => mealPlans.value?.[selectedDailyPlanIdx.value] ?? null)
const displayedWeeklyPlan = computed(() => weeklyMealPlans.value?.[selectedWeeklyPlanIdx.value] ?? null)

// Switch canvas tab to match the plan type returned by the latest response (or session load)
watch(currentPlanType, (type) => {
  if (type === 'weekly') { selectedWeeklyPlanIdx.value = 0; canvasMode.value = 'weekly' }
  else if (type === 'daily') { selectedDailyPlanIdx.value = 0; canvasMode.value = 'daily' }
}, { immediate: true })

const sessionItems = computed(() =>
  sessions.value.map(s => ({
    value: s.session_id,
    label: formatSessionLabel(s)
  }))
)

function formatSessionLabel(s: typeof sessions.value[0]): string {
  const date = new Date(s.created_at)
  const dateStr = date.toLocaleDateString(activeDateLocale.value, { month: 'short', day: 'numeric' })
  const timeStr = date.toLocaleTimeString(activeDateLocale.value, { hour: '2-digit', minute: '2-digit' })
  return `${dateStr} · ${timeStr}`
}

async function handleSessionSwitch(sessionId: string | null) {
  if (!sessionId || sessionId === activeSession.value?.session_id) return
  await selectSession(sessionId)
  hasSentFirstMessage.value = true
  nextTick(() => scrollToBottom(false))
}
const householdMembers = computed(() => householdStore.householdMembers)
const currentMemberId = computed(() => householdStore.currentMember?.id ?? null)

const activeDateLocale = computed(() => {
  if (locale.value === 'hu') return 'hu-HU'
  if (locale.value === 'sl') return 'sl-SI'
  return 'en-US'
})

const selectedMembersLabel = computed(() => {
  const count = selectedApplyMemberIds.value.length
  if (count === 0) return t('foodChatHome.apply.membersLabel.selectMembers')
  if (count === 1) return t('foodChatHome.apply.membersLabel.singleSelected')
  return t('foodChatHome.apply.membersLabel.multipleSelected', { count })
})

const canApplyMealPlan = computed(() =>
  !!latestMealPlan.value && !!currentMemberId.value && !!selectedApplyDateValue.value
  && selectedApplyMemberIds.value.length > 0 && !applyingMealPlan.value && !revokingMealPlan.value
)

const canRevokeMealPlan = computed(() => {
  if (!latestMealPlan.value || !currentMemberId.value || revokingMealPlan.value || applyingMealPlan.value || checkingRevokeEligibility.value) return false
  const selectedIds = selectedApplyMemberIds.value
  if (!selectedIds.length) return false
  return selectedIds.every(memberId => !!revocablePlanIdByMemberId.value[memberId])
})

const suggestedQuestions = computed(() => [
  { text: t('foodChatHome.suggestedQuestions.dailyPlan'), icon: 'i-lucide-calendar-days' },
  { text: t('foodChatHome.suggestedQuestions.weeklyPlan'), icon: 'i-lucide-calendar-range' },
  { text: t('foodChatHome.suggestedQuestions.highProtein'), icon: 'i-lucide-leaf' },
  { text: t('foodChatHome.suggestedQuestions.mediterranean'), icon: 'i-lucide-heart-pulse' }
])

const modifyChips = computed(() => [
  { text: t('foodChatHome.modifyChips.lowerCalorie') },
  { text: t('foodChatHome.modifyChips.moreProtein') },
  { text: t('foodChatHome.modifyChips.lighterLunch') },
  { text: t('foodChatHome.modifyChips.vegetarian') },
  { text: t('foodChatHome.modifyChips.differentDinner') }
])

const negativeFeedbackReasons = [
  t('foodChatHome.feedback.tooGeneric'),
  t('foodChatHome.feedback.notAccurate'),
  t('foodChatHome.feedback.missingInfo'),
  t('foodChatHome.feedback.irrelevant')
]

// ── Weekly plan helpers ──
const DAY_NAMES = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7']

const weeklyDays = computed(() => {
  if (!displayedWeeklyPlan.value) return []
  const grouped: Record<number, WeeklyMealEntry[]> = {}
  for (const entry of displayedWeeklyPlan.value.entries) {
    if (!grouped[entry.day]) grouped[entry.day] = []
    grouped[entry.day].push(entry)
  }
  return Object.entries(grouped)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([day, entries]) => ({
      dayIndex: Number(day),
      label: DAY_NAMES[Number(day)] ?? `Day ${day}`,
      entries: entries.sort((a, b) => a.meal_idx - b.meal_idx)
    }))
})

function getWeeklyRecipeTitle(entry: WeeklyMealEntry | undefined): string {
  if (!entry) return '—'
  const r = entry.recipe as Record<string, unknown>
  return (r?.recipe_title as string) || (r?.title as string) || (r?.name as string) || '—'
}

function getWeeklyRecipeId(entry: WeeklyMealEntry | undefined): string | null {
  if (!entry) return null
  const r = entry.recipe as Record<string, unknown>
  return (r?.recipe_id as string) || null
}

// ── Recipe cache (recipe_id → Recipe | null, absent = pending) ──
import type { Recipe as RecipeData } from '~/services/recipeApi'
const recipeCache = reactive<Record<string, RecipeData | null>>({})

function getRecipeImage(id: string | null): string | null {
  if (!id) return null
  return recipeCache[id]?.image_url ?? null
}

function isRecipeImagePending(id: string | null): boolean {
  return !!id && !(id in recipeCache)
}

// Nutrition helpers for weekly cells
const WEEKLY_SEGMENT_DEFS = [
  { key: 'protein', label: 'prot',  color: '#a25ece' },
  { key: 'carbs',   label: 'carbs', color: '#CAD5B2' },
  { key: 'fat',     label: 'fat',   color: '#D98A6B' },
  { key: 'fiber',   label: 'fiber', color: '#b8c455' },
]
const weeklyCircumference = 2 * Math.PI * 11
const weeklyHovered = reactive<Record<string, string | null>>({})

function getWeeklySegments(id: string | null) {
  if (!id) return []
  const d = recipeCache[id]
  if (!d) return []
  const values: Record<string, number> = {
    protein: Math.max(d.total_protein_g_per_serving ?? 0, 0),
    carbs:   Math.max(d.total_carbs_g_per_serving   ?? 0, 0),
    fat:     Math.max(d.total_fat_g_per_serving     ?? 0, 0),
    fiber:   Math.max(d.total_fiber_g_per_serving   ?? 0, 0),
  }
  const total = Object.values(values).reduce((s, v) => s + v, 0) || 1
  let offset = 0
  return WEEKLY_SEGMENT_DEFS.map(def => {
    const dash = (values[def.key] / total) * weeklyCircumference
    const seg = { ...def, dash, offset }
    offset += dash
    return seg
  })
}

function getWeeklyCenterValue(id: string, cellKey: string): string {
  const d = recipeCache[id]
  if (!d) return '—'
  const hovered = weeklyHovered[cellKey] ?? 'protein'
  const map: Record<string, number> = {
    protein: d.total_protein_g_per_serving ?? 0,
    carbs:   d.total_carbs_g_per_serving   ?? 0,
    fat:     d.total_fat_g_per_serving     ?? 0,
    fiber:   d.total_fiber_g_per_serving   ?? 0,
  }
  return `${Math.round(map[hovered] ?? 0)}g`
}

function getWeeklyCenterLabel(cellKey: string): string {
  const key = weeklyHovered[cellKey] ?? 'protein'
  return WEEKLY_SEGMENT_DEFS.find(d => d.key === key)?.label ?? 'prot'
}

async function prefetchWeeklyRecipes(plan: typeof displayedWeeklyPlan.value) {
  if (!plan) return
  const ids = [...new Set(plan.entries.map(e => getWeeklyRecipeId(e)).filter(Boolean) as string[])]
  await Promise.allSettled(
    ids.filter(id => !(id in recipeCache)).map(async id => {
      try {
        recipeCache[id] = await recipeApi.getRecipe(id)
      } catch {
        recipeCache[id] = null
      }
    })
  )
}

watch(displayedWeeklyPlan, (plan) => { if (plan) prefetchWeeklyRecipes(plan) }, { immediate: true })

function mealTypeIcon(type: string): string {
  const t = type?.toLowerCase() ?? ''
  if (t.includes('breakfast')) return 'i-lucide-coffee'
  if (t.includes('lunch')) return 'i-lucide-utensils'
  if (t.includes('dinner') || t.includes('supper')) return 'i-lucide-moon'
  return 'i-lucide-utensils'
}

// ── Markdown ──
function renderMarkdown(text: string): string {
  if (!text) return ''
  const raw = marked(text, { breaks: true, gfm: true }) as string
  return DOMPurify.sanitize(raw)
}

// ── Scroll to bottom ──
function scrollToBottom(smooth = true) {
  nextTick(() => {
    const el = messagesScrollRef.value
    if (!el) return

    const prevHeight = el.scrollHeight
    const doScroll = () => el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' })

    // If the DOM has already grown (e.g. called after await), scroll immediately.
    // Otherwise observe the container for its next resize (new content rendered).
    if (el.scrollHeight > prevHeight || el.scrollTop + el.clientHeight >= prevHeight - 8) {
      doScroll()
      return
    }

    const ro = new ResizeObserver(() => {
      ro.disconnect()
      doScroll()
    })
    ro.observe(el)
    // Fallback: disconnect and scroll after 500 ms regardless
    setTimeout(() => { ro.disconnect(); doScroll() }, 500)
  })
}

function handleMessagesScroll(e: Event) {
  // We let the load-more button handle pagination; nothing auto here
  void e
}

async function handleLoadMore() {
  const el = messagesScrollRef.value
  const prevScrollHeight = el?.scrollHeight ?? 0
  await loadMoreMessages()
  nextTick(() => {
    if (!el) return
    // Maintain scroll position after prepend
    el.scrollTop = el.scrollHeight - prevScrollHeight
  })
}

// ── Sending ──
async function ensureSessionAndSend(content: string) {
  if (!hasSentFirstMessage.value) {
    hasSentFirstMessage.value = true
    await nextTick()
  }
  if (!activeSession.value) await newSession()
  await sendMessage(content)
  scrollToBottom()
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text) return
  inputText.value = ''
  nextTick(() => {
    if (idleInputRef.value) idleInputRef.value.style.height = 'auto'
    if (sessionInputRef.value) sessionInputRef.value.style.height = 'auto'
  })
  await ensureSessionAndSend(text)
}

async function handleQuickAsk(question: string) {
  await ensureSessionAndSend(question)
}

async function handleStartOver() {
  applyError.value = null
  applySuccess.value = null
  hasSentFirstMessage.value = false
  await newSession()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function autoResize(e: Event, refEl: HTMLTextAreaElement | null) {
  const textarea = (e.target as HTMLTextAreaElement) || refEl
  if (!textarea) return
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 112) + 'px'
}

// ── Feedback ──
async function votePlan(planId: string, vote: 'up' | 'down', messageId: number | null) {
  const next = planVotes[planId] === vote ? null : vote
  planVotes[planId] = next
  if (next === 'up' && messageId != null) {
    try {
      await submitMessageFeedback(messageId, 'up')
      planFeedbackSubmitted[planId] = true
    } catch { /* best-effort */ }
  }
  if (next === null) planFeedbackSubmitted[planId] = false
}

async function submitPlanComment(planId: string, messageId: number | null) {
  if (messageId == null) return
  const comment = planFeedbackComments[planId]?.trim()
  try {
    await submitMessageFeedback(messageId, 'down', comment || undefined)
    planFeedbackSubmitted[planId] = true
  } catch { /* best-effort */ }
}

async function handleMessageFeedback(messageId: number, rating: 'up' | 'down') {
  messageFeedback[messageId] = rating
  if (rating === 'up') {
    try {
      await submitMessageFeedback(messageId, rating)
      feedbackSubmitted[messageId] = true
    } catch { /* best-effort */ }
  }
  // For 'down', wait for reason selection
}

async function handleFeedbackReason(messageId: number, reason: string) {
  selectedFeedbackReason[messageId] = reason
  try {
    await submitMessageFeedback(messageId, 'down', reason)
    feedbackSubmitted[messageId] = true
  } catch { /* best-effort */ }
}

// ── Member / apply helpers ──
watch([currentMemberId, householdMembers], () => {
  const validIds = new Set(householdMembers.value.map(m => m.id))
  const next = selectedApplyMemberIds.value.filter(id => validIds.has(id))
  if (currentMemberId.value && !next.includes(currentMemberId.value)) next.unshift(currentMemberId.value)
  selectedApplyMemberIds.value = next
}, { immediate: true })

watch(() => latestMealPlan.value?.id, () => {
  applyError.value = null
  applySuccess.value = null
})

watch(
  [() => latestMealPlan.value?.id, selectedApplyDate, () => selectedApplyMemberIds.value.slice().join(',')],
  () => void refreshRevokeEligibility(),
  { immediate: true }
)

function isCurrentMember(memberId: string) { return currentMemberId.value === memberId }
function isApplyMemberSelected(memberId: string) { return selectedApplyMemberIds.value.includes(memberId) }

function toggleApplyMember(memberId: string, checked: boolean | 'indeterminate') {
  if (isCurrentMember(memberId) || checked === 'indeterminate') return
  if (checked) {
    if (!selectedApplyMemberIds.value.includes(memberId)) selectedApplyMemberIds.value.push(memberId)
  } else {
    selectedApplyMemberIds.value = selectedApplyMemberIds.value.filter(id => id !== memberId)
  }
}

function selectOnlyCurrentMember() {
  selectedApplyMemberIds.value = currentMemberId.value ? [currentMemberId.value] : []
}

function selectAllMembers() {
  const allIds = householdMembers.value.map(m => m.id)
  if (currentMemberId.value && !allIds.includes(currentMemberId.value)) allIds.unshift(currentMemberId.value)
  selectedApplyMemberIds.value = allIds
}

function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function getMemberAvatar(member: HouseholdMember): AvatarConfig | null {
  if (!member.image_url) return null
  return stringToAvatarConfig(member.image_url)
}

function getMemberAvatarForDisplay(member: HouseholdMember): AvatarConfig {
  return getMemberAvatar(member) || stringToAvatarConfig(member.id)
}

function mealGridCols(plan: MealPlan): string {
  const count = [plan.breakfast, plan.lunch, plan.dinner].filter(Boolean).length
  if (count <= 1) return 'grid grid-cols-1'
  if (count === 2) return 'grid grid-cols-1 sm:grid-cols-2'
  return 'grid grid-cols-1 sm:grid-cols-3'
}

function formatPlanDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(activeDateLocale.value, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function cloneRecipe(recipe?: MealRecipe): MealRecipe | undefined {
  if (!recipe) return undefined
  return { recipe_id: recipe.recipe_id, title: recipe.title, ingredients: recipe.ingredients, directions: recipe.directions }
}

function buildMealPlanPayload(mealPlan: MealPlan): MealPlan {
  return {
    id: mealPlan.id,
    created_at: mealPlan.created_at,
    breakfast: cloneRecipe(mealPlan.breakfast),
    lunch: cloneRecipe(mealPlan.lunch),
    dinner: cloneRecipe(mealPlan.dinner),
    reasoning: mealPlan.reasoning
  }
}

async function refreshRevokeEligibility() {
  const planId = latestMealPlan.value?.id
  const selectedIds = [...selectedApplyMemberIds.value]
  if (!planId || !selectedIds.length) {
    revocablePlanIdByMemberId.value = {}
    checkingRevokeEligibility.value = false
    return
  }
  checkingRevokeEligibility.value = true
  const requestId = ++revokeEligibilityRequestId
  try {
    const cachedStoredPlanId = storedMealPlanIdsBySourceId.value[planId]
    const nextRevocableMap: Record<string, string> = {}
    await Promise.all(selectedIds.map(async (memberId) => {
      try {
        const response = await memberMealPlansApi.getMealPlan(memberId, selectedApplyDate.value)
        const storedPlanId = extractStoredMealPlanIdFromMemberMealPlanResponse(response)
        const sourcePlanId = extractSourceMealPlanIdFromMemberMealPlanResponse(response)
        if (!storedPlanId) return
        if (sourcePlanId === planId || (!!cachedStoredPlanId && storedPlanId === cachedStoredPlanId)) {
          nextRevocableMap[memberId] = storedPlanId
        }
      } catch { /* member has no plan */ }
    }))
    if (requestId !== revokeEligibilityRequestId) return
    const firstStoredId = Object.values(nextRevocableMap)[0]
    if (firstStoredId && !storedMealPlanIdsBySourceId.value[planId]) {
      storedMealPlanIdsBySourceId.value[planId] = firstStoredId
    }
    revocablePlanIdByMemberId.value = nextRevocableMap
  } finally {
    if (requestId === revokeEligibilityRequestId) checkingRevokeEligibility.value = false
  }
}

async function applyMealPlanToMembers() {
  if (!latestMealPlan.value || !currentMemberId.value) return
  applyingMealPlan.value = true
  applyError.value = null
  applySuccess.value = null
  try {
    const mealPlanPayload = buildMealPlanPayload(latestMealPlan.value)
    const selectedMemberIds = new Set(selectedApplyMemberIds.value)
    selectedMemberIds.add(currentMemberId.value)
    const response = await memberMealPlansApi.storeMealPlan(currentMemberId.value, {
      date: selectedApplyDate.value,
      applies_to_member_ids: Array.from(selectedMemberIds),
      meal_plan: mealPlanPayload,
      foodchat_response: { help: 'Meal plan stored from FoodChat UI', success: true, result: [mealPlanPayload] }
    })
    const storedMealPlanId = extractStoredMealPlanIdFromMemberMealPlanResponse(response)
    if (storedMealPlanId) storedMealPlanIdsBySourceId.value[latestMealPlan.value.id] = storedMealPlanId
    applySuccess.value = t('foodChatHome.apply.success.applied', { date: selectedApplyDate.value })
    await refreshRevokeEligibility()
  } catch (err: unknown) {
    applyError.value = (err && typeof err === 'object' && 'message' in err)
      ? String((err as { message: string }).message)
      : t('foodChatHome.errors.failedToApply')
  } finally {
    applyingMealPlan.value = false
  }
}

async function revokeMealPlanFromMembers() {
  if (!latestMealPlan.value || !currentMemberId.value) return
  revokingMealPlan.value = true
  applyError.value = null
  applySuccess.value = null
  try {
    const selectedIds = [...selectedApplyMemberIds.value]
    if (selectedIds.some(id => !revocablePlanIdByMemberId.value[id])) {
      throw new Error(t('foodChatHome.errors.someMembersNoPlan'))
    }
    for (const memberId of selectedIds) {
      await memberMealPlansApi.revokeMealPlan(memberId, revocablePlanIdByMemberId.value[memberId], false)
    }
    await refreshRevokeEligibility()
    applySuccess.value = t('foodChatHome.apply.success.revoked')
  } catch (err: unknown) {
    applyError.value = (err && typeof err === 'object' && 'message' in err)
      ? String((err as { message: string }).message)
      : t('foodChatHome.errors.failedToRevoke')
  } finally {
    revokingMealPlan.value = false
  }
}

// ── Watch messages to auto-scroll ──
watch(messages, () => scrollToBottom(), { deep: true, flush: 'post' })
watch(messagesScrollRef, (el) => { if (el) scrollToBottom(false) })

// ── Mount ──
onMounted(async () => {
  await loadSessions()
  if (messages.value.length > 0 || hasAnyPlan.value) {
    hasSentFirstMessage.value = true
    nextTick(() => scrollToBottom(false))
  }
  if (!householdMembers.value.length && householdStore.currentHousehold?.id) {
    await householdStore.fetchMembers()
  }
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}

/* ── Layout ── */
.fc-split-wrap {
  height: clamp(440px, 68vh, 720px);
  min-height: 0;
  border-radius: 1.25rem;
  overflow: hidden;
  border: 1px solid rgb(228 228 231 / 0.8);
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.06);
}
.dark .fc-split-wrap {
  border-color: rgb(63 63 70 / 0.6);
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.2);
}
.fc-chat-col {
  width: clamp(260px, 34%, 400px);
  background: white;
  display: flex;
  flex-direction: column;
  min-height: 0;
  /* no right border — separation comes from the canvas bg contrast */
}
.dark .fc-chat-col {
  background: rgb(24 24 27);
}
.fc-canvas-col {
  flex: 1;
  min-width: 0;
  background: rgb(249 250 251);
}
.dark .fc-canvas-col {
  background: rgb(18 18 20);
}

/* ── Messages area ── */
.fc-messages-area {
  scroll-behavior: smooth;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: rgb(212 212 216) transparent;
}
.dark .fc-messages-area {
  scrollbar-color: rgb(63 63 70) transparent;
}
.fc-messages-area::-webkit-scrollbar {
  width: 4px;
}
.fc-messages-area::-webkit-scrollbar-track {
  background: transparent;
}
.fc-messages-area::-webkit-scrollbar-thumb {
  background: rgb(212 212 216);
  border-radius: 9999px;
}
.dark .fc-messages-area::-webkit-scrollbar-thumb {
  background: rgb(63 63 70);
}
.fc-messages-area::-webkit-scrollbar-thumb:hover {
  background: rgb(161 161 170);
}
.dark .fc-messages-area::-webkit-scrollbar-thumb:hover {
  background: rgb(82 82 91);
}

/* Canvas column scrollbar */
.fc-canvas-col {
  scrollbar-width: thin;
  scrollbar-color: rgb(212 212 216) transparent;
}
.dark .fc-canvas-col {
  scrollbar-color: rgb(63 63 70) transparent;
}
.fc-canvas-col::-webkit-scrollbar { width: 4px; }
.fc-canvas-col::-webkit-scrollbar-track { background: transparent; }
.fc-canvas-col::-webkit-scrollbar-thumb { background: rgb(212 212 216); border-radius: 9999px; }
.dark .fc-canvas-col::-webkit-scrollbar-thumb { background: rgb(63 63 70); }
.fc-canvas-col::-webkit-scrollbar-thumb:hover { background: rgb(161 161 170); }
.dark .fc-canvas-col::-webkit-scrollbar-thumb:hover { background: rgb(82 82 91); }

/* Fade sits absolutely over the top of the messages, below the session bar */
.fc-messages-top-fade {
  position: absolute;
  top: 37px; /* height of session bar */
  left: 0;
  right: 0;
  height: 3rem;
  background: linear-gradient(to bottom, white 50%, transparent);
  pointer-events: none;
  z-index: 2;
}
.dark .fc-messages-top-fade {
  background: linear-gradient(to bottom, rgb(24 24 27) 50%, transparent);
}

/* ── Markdown in assistant bubbles ── */
.fc-md p { margin: 0 0 0.5em; line-height: 1.6; font-size: 0.875rem; }
.fc-md p:last-child { margin-bottom: 0; }
.fc-md ul { list-style: disc; padding-left: 1.25rem; margin: 0.4em 0 0.6em; }
.fc-md ol { list-style: decimal; padding-left: 1.25rem; margin: 0.4em 0 0.6em; }
.fc-md li { margin: 0.2em 0; font-size: 0.875rem; line-height: 1.55; }
.fc-md li > ul, .fc-md li > ol { margin: 0.2em 0; }
.fc-md strong { font-weight: 600; }
.fc-md em { font-style: italic; }
.fc-md code { font-size: 0.8em; background: rgb(0 0 0 / 0.06); border-radius: 0.25rem; padding: 0.1em 0.35em; }
.dark .fc-md code { background: rgb(255 255 255 / 0.08); }
.fc-md h1, .fc-md h2, .fc-md h3 { font-weight: 600; margin: 0.75em 0 0.35em; line-height: 1.3; }
.fc-md h1 { font-size: 1.1rem; }
.fc-md h2 { font-size: 1rem; }
.fc-md h3 { font-size: 0.9rem; }
.fc-md blockquote { border-left: 3px solid rgb(161 161 170 / 0.5); padding-left: 0.75rem; margin: 0.5em 0; color: rgb(113 113 122); }
.dark .fc-md blockquote { color: rgb(161 161 170); }

/* ── Bubbles ── */
.fc-bubble {
  max-width: 85%;
  border-radius: 1.25rem;
  padding: 0.65rem 0.875rem;
}
.fc-bubble-user {
  background: var(--color-brandp-500, #7c3aed);
  color: white;
  border-bottom-right-radius: 0.375rem;
}
.fc-bubble-assistant {
  background: white;
  border: 1px solid rgb(228 228 231 / 0.8);
  color: rgb(24 24 27);
  border-bottom-left-radius: 0.375rem;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.04);
}
.dark .fc-bubble-assistant {
  background: rgb(39 39 42 / 0.8);
  border-color: rgb(63 63 70 / 0.6);
  color: rgb(228 228 231);
}
.fc-bubble-loading {
  padding: 0.75rem 1rem;
}

/* ── Typing dots ── */
.fc-dot {
  display: inline-block;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: var(--color-brandp-400, #a78bfa);
  animation: fc-dot-bounce 1.1s ease-in-out infinite;
}
@keyframes fc-dot-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
  40% { transform: translateY(-6px); opacity: 1; }
}

/* ── Feedback buttons ── */
.fc-feedback-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.5rem;
  color: rgb(161 161 170);
  transition: color 0.15s, background 0.15s;
}
.fc-feedback-btn:hover {
  color: rgb(82 82 91);
  background: rgb(244 244 245 / 0.8);
}
.dark .fc-feedback-btn:hover {
  color: rgb(212 212 216);
  background: rgb(63 63 70 / 0.5);
}
.fc-feedback-active-up {
  color: var(--color-brandp-500);
  background: var(--color-brandp-50, #faf5ff);
}
.fc-feedback-active-down {
  color: rgb(239 68 68);
  background: rgb(254 242 242);
}
.dark .fc-feedback-active-up {
  background: var(--color-brandp-950, #2e1065);
}
.dark .fc-feedback-active-down {
  background: rgb(69 10 10 / 0.5);
}

/* ── Session select cursor ── */
.fc-session-select,
.fc-session-select button {
  cursor: pointer !important;
}
/* Nuxt UI renders the listbox in a portal — target items globally */
[data-slot="content"] [data-slot="item"] {
  cursor: pointer !important;
}

/* ── Session bar ── */
.fc-session-bar {
  border-bottom: 1px solid rgb(228 228 231 / 0.6);
  background: white;
  z-index: 3;
}
.dark .fc-session-bar {
  border-bottom-color: rgb(63 63 70 / 0.5);
  background: rgb(24 24 27);
}

/* ── Composer wrap ── */
.fc-composer-wrap {
  border-top: 1px solid rgb(228 228 231 / 0.7);
  background: white;
}
.dark .fc-composer-wrap {
  border-top-color: rgb(63 63 70 / 0.5);
  background: rgb(24 24 27);
}

/* ── Canvas plan card ── */
.plan-card {
  animation: card-appear 0.6s ease-out both;
}
@keyframes card-appear {
  from { opacity: 0; transform: translateY(24px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Chat composer (borrowed from FoodScholar) ── */
.chat-composer {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  padding: 0.35rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s, background 0.25s;
}
.dark .chat-composer {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(24, 24, 27, 0.65);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.chat-composer.is-focused {
  transform: translateY(-1px);
  border-color: var(--color-brandp-300);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brandp-400) 12%, transparent), 0 8px 24px rgba(0,0,0,0.06);
}
.dark .chat-composer.is-focused {
  border-color: var(--color-brandp-500);
  background: rgba(24, 24, 27, 0.8);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brandp-400) 18%, transparent), 0 8px 24px rgba(0,0,0,0.3);
}

/* ── Send button ── */
.chat-send-button {
  transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
}
.chat-send-button:hover:not(:disabled) {
  transform: translateY(-1px) scale(1.05);
  box-shadow: 0 8px 16px color-mix(in srgb, var(--color-brandp-500) 30%, transparent);
  filter: saturate(1.1);
}
.chat-send-idle {
  animation: send-pulse 1.8s ease-in-out infinite;
}
@keyframes send-pulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-brandp-500) 25%, transparent); }
  50%       { box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-brandp-500) 0%, transparent); }
}

/* ── Suggestion cards ── */
.suggestion-card {
  animation: suggestion-pop 0.5s ease-out both;
}
@keyframes suggestion-pop {
  from { opacity: 0; transform: translateY(14px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Transitions ── */
.layout-fade-enter-active { transition: opacity 0.45s ease-out, transform 0.45s ease-out; }
.layout-fade-leave-active { transition: opacity 0.25s ease-in, transform 0.25s ease-in; position: absolute; width: 100%; }
.layout-fade-enter-from  { opacity: 0; transform: translateY(20px); }
.layout-fade-leave-to    { opacity: 0; transform: translateY(-12px); }

.plan-reveal-enter-active { transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
.plan-reveal-leave-active { transition: opacity 0.25s ease-in; }
.plan-reveal-enter-from  { opacity: 0; transform: translateY(32px); }
.plan-reveal-leave-to    { opacity: 0; }

.section-fade-enter-active { transition: opacity 0.4s ease-out, transform 0.4s ease-out; }
.section-fade-leave-active { transition: opacity 0.2s ease-in; }
.section-fade-enter-from  { opacity: 0; transform: translateY(12px); }
.section-fade-leave-to    { opacity: 0; }

.msg-enter-active { transition: opacity 0.3s ease-out, transform 0.3s ease-out; }
.msg-leave-active { transition: opacity 0.15s ease-in; position: absolute; }
.msg-enter-from  { opacity: 0; transform: translateY(10px); }
.msg-leave-to    { opacity: 0; }

.chips-fade-enter-active { transition: opacity 0.35s ease-out, transform 0.35s ease-out; }
.chips-fade-leave-active { transition: opacity 0.15s ease-in; }
.chips-fade-enter-from  { opacity: 0; transform: translateY(6px); }
.chips-fade-leave-to    { opacity: 0; }

.toast-slide-enter-active { transition: opacity 0.3s ease-out, transform 0.3s ease-out; }
.toast-slide-leave-active { transition: opacity 0.2s ease-in, transform 0.2s ease-in; }
.toast-slide-enter-from  { opacity: 0; transform: translate(-50%, 14px); }
.toast-slide-leave-to    { opacity: 0; transform: translate(-50%, 14px); }
</style>
