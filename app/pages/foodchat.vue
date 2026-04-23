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
              <div class="chat-composer-accent chat-composer-accent-left" />
              <div class="chat-composer-accent chat-composer-accent-right" />
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
            <!-- Modify chips -->
            <Transition name="chips-fade">
              <div v-if="hasAnyPlan && !sending" class="flex flex-wrap gap-1.5 mb-2">
                <button
                  v-for="chip in modifyChips"
                  :key="chip.text"
                  class="px-3 py-1 rounded-full text-[11px] font-light border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 bg-white/60 dark:bg-zinc-800/40 hover:border-brandp-300 dark:hover:border-brandp-700 hover:text-brandp-600 dark:hover:text-brandp-400 transition-all"
                  @click="handleQuickAsk(chip.text)"
                >
                  {{ chip.text }}
                </button>
              </div>
            </Transition>

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
          <div class="flex-1 p-4 sm:p-6">

            <!-- Generating animation -->
            <Transition name="plan-reveal">
              <div v-if="sending && !hasAnyPlan" class="flex flex-col items-center justify-center h-full min-h-80">
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

            <!-- Daily meal plan canvas -->
            <Transition name="plan-reveal">
              <div v-if="latestMealPlan && !sending" class="plan-card">
                <!-- Canvas header -->
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-brandp-100 dark:bg-brandp-950/50 flex items-center justify-center">
                      <UIcon name="i-lucide-calendar-days" class="w-4 h-4 text-brandp-500" />
                    </div>
                    <div>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">{{ t('foodChatHome.planHeader.dailyPlan') }}</span>
                      <span v-if="latestMealPlan.version" class="ml-2 text-[10px] text-gray-400 bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">v{{ latestMealPlan.version }}</span>
                    </div>
                  </div>
                  <span class="text-xs text-gray-400 font-light">{{ formatPlanDate(latestMealPlan.created_at) }}</span>
                </div>

                <!-- Meal cards -->
                <div
                  class="rounded-2xl overflow-hidden mb-4"
                  :class="mealGridCols(latestMealPlan)"
                >
                  <FoodchatMealScheduleCard
                    v-if="latestMealPlan.breakfast"
                    :type="t('foodChatHome.meals.breakfast')"
                    time="08:00"
                    icon="i-lucide-coffee"
                    :recipe="latestMealPlan.breakfast"
                  />
                  <FoodchatMealScheduleCard
                    v-if="latestMealPlan.lunch"
                    :type="t('foodChatHome.meals.lunch')"
                    time="13:00"
                    icon="i-lucide-utensils"
                    :recipe="latestMealPlan.lunch"
                  />
                  <FoodchatMealScheduleCard
                    v-if="latestMealPlan.dinner"
                    :type="t('foodChatHome.meals.dinner')"
                    time="19:30"
                    icon="i-lucide-moon"
                    :recipe="latestMealPlan.dinner"
                  />
                </div>

                <!-- Reasoning -->
                <div v-if="latestMealPlan.reasoning" class="flex items-start gap-2 mb-4 px-1">
                  <UIcon name="i-lucide-lightbulb" class="w-3.5 h-3.5 text-brandp-400 mt-0.5 shrink-0" />
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed">{{ latestMealPlan.reasoning }}</p>
                </div>

                <!-- Plan vote -->
                <div class="flex items-center gap-2 mb-5 px-1">
                  <span class="text-xs text-gray-400">{{ t('foodChatHome.canvas.rateThisPlan') }}</span>
                  <UTooltip :text="t('foodChatHome.tooltips.planWorksWell')">
                    <button
                      :class="['fc-feedback-btn', planVotes[latestMealPlan.id] === 'up' ? 'fc-feedback-active-up' : '']"
                      @click="votePlan(latestMealPlan.id, 'up')"
                    >
                      <UIcon name="i-lucide-thumbs-up" class="w-3.5 h-3.5" />
                    </button>
                  </UTooltip>
                  <UTooltip :text="t('foodChatHome.tooltips.needsImprovement')">
                    <button
                      :class="['fc-feedback-btn', planVotes[latestMealPlan.id] === 'down' ? 'fc-feedback-active-down' : '']"
                      @click="votePlan(latestMealPlan.id, 'down')"
                    >
                      <UIcon name="i-lucide-thumbs-down" class="w-3.5 h-3.5" />
                    </button>
                  </UTooltip>
                </div>

                <!-- Apply section -->
                <div class="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/30 p-4">
                  <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ t('foodChatHome.apply.title') }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('foodChatHome.apply.subtitle') }}</p>
                    </div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <UPopover :content="{ align: 'end', side: 'top', sideOffset: 8 }">
                        <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-calendar">
                          {{ selectedApplyDate }}
                        </UButton>
                        <template #content>
                          <div class="p-2">
                            <UCalendar v-model="selectedApplyDateValue" :min-value="minApplyDateValue" :year-controls="true" />
                          </div>
                        </template>
                      </UPopover>

                      <UPopover :content="{ align: 'end', side: 'top', sideOffset: 8 }">
                        <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-users" trailing-icon="i-lucide-chevron-down">
                          {{ selectedMembersLabel }}
                        </UButton>
                        <template #content>
                          <div class="w-64 p-3">
                            <div class="flex items-center justify-between mb-2">
                              <p class="text-xs font-medium text-gray-900 dark:text-white">{{ t('foodChatHome.apply.selectMembers') }}</p>
                              <div class="flex items-center gap-1.5">
                                <UButton variant="ghost" size="xs" color="neutral" @click="selectOnlyCurrentMember">{{ t('foodChatHome.apply.onlyMe') }}</UButton>
                                <UButton variant="ghost" size="xs" color="neutral" @click="selectAllMembers">{{ t('foodChatHome.apply.all') }}</UButton>
                              </div>
                            </div>
                            <div v-if="householdMembers.length === 0" class="text-xs text-gray-500 py-2">{{ t('foodChatHome.apply.noHouseholdMembers') }}</div>
                            <div v-else class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              <div
                                v-for="member in householdMembers"
                                :key="member.id"
                                class="flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors"
                                :class="isCurrentMember(member.id) ? 'bg-brandp-50/70 dark:bg-brandp-900/20' : 'hover:bg-gray-50 dark:hover:bg-zinc-700/40 cursor-pointer'"
                                @click="toggleApplyMember(member.id, !isApplyMemberSelected(member.id))"
                              >
                                <UCheckbox :model-value="isApplyMemberSelected(member.id)" :disabled="isCurrentMember(member.id)" @click.stop @update:model-value="(c) => toggleApplyMember(member.id, c)" />
                                <ProfileAvatar v-if="getMemberAvatar(member)" :avatar="getMemberAvatarForDisplay(member)" size="sm" class="w-7 h-7 shrink-0" />
                                <div v-else class="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">{{ memberInitials(member.name) }}</div>
                                <p class="text-xs text-gray-900 dark:text-white truncate flex-1">{{ member.name }}</p>
                                <UBadge v-if="isCurrentMember(member.id)" color="primary" variant="subtle" size="xs">{{ t('foodChatHome.apply.main') }}</UBadge>
                              </div>
                            </div>
                          </div>
                        </template>
                      </UPopover>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 flex-wrap">
                    <UButton color="primary" size="sm" icon="i-lucide-check" :loading="applyingMealPlan" :disabled="!canApplyMealPlan" @click="applyMealPlanToMembers">
                      {{ t('foodChatHome.apply.buttons.apply') }}
                    </UButton>
                    <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-undo-2" :loading="revokingMealPlan" :disabled="!canRevokeMealPlan" @click="revokeMealPlanFromMembers">
                      {{ t('foodChatHome.apply.buttons.revoke') }}
                    </UButton>
                    <div v-if="applySuccess" class="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <UIcon name="i-lucide-check" class="w-3.5 h-3.5" />
                      <span>{{ applySuccess }}</span>
                    </div>
                  </div>

                  <UAlert v-if="applyError" class="mt-3" color="red" variant="soft" icon="i-lucide-alert-circle" :title="applyError" />
                </div>
              </div>
            </Transition>

            <!-- Weekly meal plan canvas -->
            <Transition name="plan-reveal">
              <div v-if="latestWeeklyPlan && !latestMealPlan && !sending" class="plan-card">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-brandp-100 dark:bg-brandp-950/50 flex items-center justify-center">
                      <UIcon name="i-lucide-calendar-range" class="w-4 h-4 text-brandp-500" />
                    </div>
                    <div>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">{{ t('foodChatHome.planHeader.weeklyPlan') }}</span>
                      <span v-if="latestWeeklyPlan.version" class="ml-2 text-[10px] text-gray-400 bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">v{{ latestWeeklyPlan.version }}</span>
                    </div>
                  </div>
                  <span class="text-xs text-gray-400 font-light">{{ formatPlanDate(latestWeeklyPlan.created_at) }}</span>
                </div>

                <!-- Weekly entries grouped by day -->
                <div class="space-y-3">
                  <div
                    v-for="day in weeklyDays"
                    :key="day.dayIndex"
                    class="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-800/30 overflow-hidden"
                  >
                    <div class="flex items-center gap-2 px-4 py-2 border-b border-gray-100 dark:border-zinc-700/50 bg-gray-50/50 dark:bg-zinc-800/50">
                      <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5 text-brandp-400" />
                      <span class="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{{ day.label }}</span>
                    </div>
                    <div class="divide-y divide-gray-100 dark:divide-zinc-700/50">
                      <div v-for="entry in day.entries" :key="`${entry.day}-${entry.meal_idx}`" class="px-4 py-2.5 flex items-center gap-3">
                        <UIcon :name="mealTypeIcon(entry.meal_type)" class="w-4 h-4 text-brandp-400 shrink-0" />
                        <div class="flex-1 min-w-0">
                          <p class="text-xs font-medium text-gray-900 dark:text-white capitalize">{{ entry.meal_type }}</p>
                          <p class="text-[11px] text-gray-500 dark:text-gray-400 truncate">{{ getWeeklyRecipeTitle(entry) }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
import { today, getLocalTimeZone, type DateValue } from '@internationalized/date'
import memberMealPlansApi, {
  extractSourceMealPlanIdFromMemberMealPlanResponse,
  extractStoredMealPlanIdFromMemberMealPlanResponse
} from '~/services/memberMealPlansApi'
import type { HouseholdMember } from '~/services/householdsApi'
import { stringToAvatarConfig, type AvatarConfig } from '~/utils/avatarPresets'

definePageMeta({ layout: 'default', middleware: ['auth', 'profile'] })

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
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const weeklyDays = computed(() => {
  if (!latestWeeklyPlan.value) return []
  const grouped: Record<number, WeeklyMealEntry[]> = {}
  for (const entry of latestWeeklyPlan.value.entries) {
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

function getWeeklyRecipeTitle(entry: WeeklyMealEntry): string {
  const r = entry.recipe as Record<string, unknown>
  return (r?.title as string) || (r?.name as string) || '—'
}

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
  const attempt = (retries = 8) => {
    nextTick(() => {
      const el = messagesScrollRef.value
      if (!el) {
        if (retries > 0) setTimeout(() => attempt(retries - 1), 60)
        return
      }
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' })
    })
  }
  attempt()
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
function votePlan(planId: string, vote: 'up' | 'down') {
  planVotes[planId] = planVotes[planId] === vote ? null : vote
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
watch(messages, () => scrollToBottom(), { flush: 'post' })
watch(sending, (val) => { if (!val) scrollToBottom() }, { flush: 'post' })
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
.chat-composer-accent {
  pointer-events: none;
  position: absolute;
  width: 7rem;
  height: 7rem;
  border-radius: 9999px;
  filter: blur(24px);
  opacity: 0.22;
  transition: opacity 0.2s;
}
.chat-composer.is-focused .chat-composer-accent { opacity: 0.38; }
.chat-composer-accent-left {
  top: -3rem;
  left: -1.5rem;
  background: var(--color-brandp-400);
}
.chat-composer-accent-right {
  bottom: -3.5rem;
  right: -1.8rem;
  background: var(--color-brandp-600);
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
