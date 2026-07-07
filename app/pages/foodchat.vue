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

            <!-- Diner picker (multi-member households only) -->
            <div v-if="showDinerPicker" class="mt-3 px-1 flex items-center gap-2 flex-wrap">
              <span class="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-zinc-500 shrink-0">
                <UIcon name="i-lucide-users" class="w-3 h-3" />
                {{ t('foodChatHome.diners.label') }}
              </span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <UTooltip v-for="member in householdMembers" :key="member.id" :text="dinerTooltip(member)">
                  <button
                    type="button"
                    class="fc-diner-chip"
                    :class="{ 'fc-diner-chip-active': isDinerSelected(member.id), 'fc-diner-chip-locked': member.id === currentMemberId }"
                    :disabled="dinersUpdating && member.id !== currentMemberId"
                    :aria-pressed="isDinerSelected(member.id)"
                    @click="toggleDiner(member)"
                  >
                    <ProfileAvatar :avatar="getMemberAvatarForDisplay(member)" size="xs" />
                    <span class="text-[10px] max-w-16 truncate">{{ member.name }}</span>
                    <UIcon v-if="member.id === currentMemberId" name="i-lucide-lock" class="w-2.5 h-2.5 opacity-50" />
                  </button>
                </UTooltip>
              </div>
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

                    <!-- FoodScholar attribution (only on live responses; not persisted) -->
                    <div v-if="msg.attribution?.source === 'foodscholar'" class="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-700/50">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span
                          class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border border-brandp-100 dark:border-brandp-900/60 bg-brandp-50 dark:bg-brandp-950/40 text-brandp-600 dark:text-brandp-300"
                          :title="msg.attribution.confidence ? `${t('foodChatHome.chat.attribution.confidence')}: ${msg.attribution.confidence}` : undefined"
                        >
                          <UIcon name="i-lucide-graduation-cap" class="w-3 h-3" />
                          {{ t('foodChatHome.chat.attribution.answeredWith') }}
                        </span>
                        <span v-if="msg.attribution.confidence" class="text-[10px] text-gray-400 dark:text-zinc-500">
                          {{ t('foodChatHome.chat.attribution.confidence') }}: {{ msg.attribution.confidence }}
                        </span>
                      </div>

                      <!-- Citation chips -->
                      <div v-if="msg.attribution.citations?.length" class="mt-1.5 flex flex-wrap gap-1">
                        <template v-for="(citation, cIdx) in msg.attribution.citations" :key="cIdx">
                          <NuxtLink
                            v-if="citation.url"
                            :to="citation.url"
                            :class="['px-2 py-0.5 text-[10px] rounded-full border transition-colors hover:underline', citationChipClass(citation)]"
                            :title="citation.title"
                          >
                            {{ citationLabel(citation) }}
                          </NuxtLink>
                          <span
                            v-else
                            :class="['px-2 py-0.5 text-[10px] rounded-full border', citationChipClass(citation)]"
                            :title="citation.title"
                          >
                            {{ citationLabel(citation) }}
                          </span>
                        </template>
                      </div>

                      <!-- Learn more link -->
                      <NuxtLink
                        v-if="msg.attribution.learn_more_url"
                        :to="msg.attribution.learn_more_url"
                        class="mt-1.5 inline-flex items-center gap-1 text-[11px] text-brandp-500 dark:text-brandp-400 hover:text-brandp-600 dark:hover:text-brandp-300 hover:underline transition-colors"
                      >
                        {{ t('foodChatHome.chat.attribution.learnMore') }}
                        <UIcon name="i-lucide-arrow-right" class="w-3 h-3" />
                      </NuxtLink>
                    </div>

                    <!-- Changed-slot proof (only on live responses; not persisted) -->
                    <div v-if="msg.changed_slots?.length" class="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-700/50 space-y-1">
                      <div
                        v-for="(changedSlot, sIdx) in msg.changed_slots"
                        :key="sIdx"
                        class="flex items-start gap-1.5 px-2 py-1 rounded-lg border border-gray-100 dark:border-zinc-700/60 bg-gray-50/80 dark:bg-zinc-800/40"
                      >
                        <UIcon name="i-lucide-replace" class="w-3 h-3 mt-0.5 text-brandp-400 dark:text-brandp-300 shrink-0" />
                        <span class="flex-1 min-w-0 text-[11px] font-light leading-snug text-gray-600 dark:text-zinc-300">
                          <span class="font-medium">{{ changedSlotLabel(changedSlot) }}:</span>
                          <span class="line-through opacity-60"> {{ changedSlot.old.title }}</span>
                          <span> → </span>
                          <span class="font-medium">{{ changedSlot.new.title }}</span>
                          <span v-if="changedSlot.old.kcal != null && changedSlot.new.kcal != null" class="text-gray-400 dark:text-zinc-500">
                            · {{ Math.round(changedSlot.old.kcal) }} → {{ Math.round(changedSlot.new.kcal) }} kcal
                          </span>
                        </span>
                        <span
                          v-if="changedSlot.verified"
                          class="inline-flex items-center gap-0.5 mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0"
                          :title="changedSlot.directive"
                        >
                          <UIcon name="i-lucide-check" class="w-3 h-3" />
                          {{ t('foodChatHome.chat.changedSlots.verified') }}
                        </span>
                      </div>
                    </div>

                    <!-- Memory nudges (only on live responses; not persisted) -->
                    <div
                      v-if="visibleMemorySuggestions(msg).length"
                      class="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-700/50 space-y-1.5"
                    >
                      <div
                        v-for="sug in visibleMemorySuggestions(msg)"
                        :key="sug.id"
                        class="fc-memory-chip"
                        :class="{ 'fc-memory-chip-warning': sug.kind === 'allergy_hint' }"
                      >
                        <template v-if="memoryChipState[sug.id] !== 'accepted'">
                          <UIcon
                            name="i-lucide-brain"
                            class="w-3 h-3 shrink-0"
                            :class="sug.kind === 'allergy_hint' ? 'text-amber-500 dark:text-amber-400' : 'text-brandp-400 dark:text-brandp-300'"
                          />
                          <span class="flex-1 min-w-0 text-[11px] font-light leading-snug">{{ sug.statement }}</span>
                          <button
                            class="fc-memory-btn fc-memory-btn-accept"
                            :disabled="memoryChipState[sug.id] === 'pending'"
                            @click="handleMemoryDecision(sug, 'accept')"
                          >
                            <UIcon v-if="memoryChipState[sug.id] === 'pending'" name="i-lucide-loader-2" class="w-3 h-3 animate-spin" />
                            <template v-else>{{ t('foodChatHome.chat.memory.remember') }}</template>
                          </button>
                          <button
                            class="fc-memory-btn"
                            :disabled="memoryChipState[sug.id] === 'pending'"
                            @click="handleMemoryDecision(sug, 'decline')"
                          >
                            {{ t('foodChatHome.chat.memory.noThanks') }}
                          </button>
                        </template>
                        <template v-else>
                          <UIcon name="i-lucide-check" class="w-3 h-3 text-emerald-500 shrink-0" />
                          <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-light">
                            {{ t('foodChatHome.chat.memory.saved') }}
                          </span>
                        </template>
                      </div>
                    </div>

                    <!-- Feedback row -->
                    <div v-if="msg.id" class="mt-2 flex items-center gap-1 transition-opacity" :class="feedbackSubmitted[msg.id] ? 'opacity-100' : 'opacity-0 group-hover/msg:opacity-100'">
                      <template v-if="!feedbackSubmitted[msg.id]">
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
                          <div v-if="messageFeedback[msg.id] === 'down'" class="flex flex-wrap gap-1 ml-1">
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
                      </template>

                      <span v-else class="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <UIcon name="i-lucide-check" class="w-3 h-3" />
                        {{ t('foodChatHome.chat.feedbackSaved') }}
                      </span>
                    </div>
                  </div>
                </div>
              </TransitionGroup>

              <!-- Ephemeral "Working on it…" bubble — shown only when a new
                   generation was kicked off (not when answering a clarification). -->
              <Transition name="msg">
                <div v-if="showEphemeralGenerating" class="flex justify-start">
                  <div class="fc-bubble fc-bubble-generating">
                    <UIcon name="i-lucide-loader-2" class="w-3.5 h-3.5 animate-spin text-brandp-500 shrink-0" />
                    <span class="text-sm font-light text-gray-600 dark:text-zinc-300">Working on it…</span>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          <!-- ── Chat input (pinned to bottom) ── -->
          <div class="fc-composer-wrap px-4 pb-4 pt-2">
            <!-- Diner picker (multi-member households only) -->
            <div v-if="showDinerPicker" class="mb-2 px-1 flex items-center gap-1.5 flex-wrap">
              <UIcon name="i-lucide-users" class="w-3 h-3 text-gray-400 dark:text-zinc-500 shrink-0" />
              <UTooltip v-for="member in householdMembers" :key="member.id" :text="dinerTooltip(member)">
                <button
                  type="button"
                  class="fc-diner-chip fc-diner-chip-sm"
                  :class="{ 'fc-diner-chip-active': isDinerSelected(member.id), 'fc-diner-chip-locked': member.id === currentMemberId }"
                  :disabled="dinersUpdating && member.id !== currentMemberId"
                  :aria-pressed="isDinerSelected(member.id)"
                  @click="toggleDiner(member)"
                >
                  <ProfileAvatar :avatar="getMemberAvatarForDisplay(member)" size="xs" />
                  <span class="text-[10px] max-w-14 truncate">{{ member.name }}</span>
                  <UIcon v-if="member.id === currentMemberId" name="i-lucide-lock" class="w-2.5 h-2.5 opacity-50" />
                </button>
              </UTooltip>
            </div>
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
          <!-- "Cooking for" banner (when more than one diner) -->
          <Transition name="chips-fade">
            <div v-if="showCookingForBanner" class="px-4 sm:px-6 pt-3 shrink-0">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-full border border-brandp-100 dark:border-brandp-900/60 bg-brandp-50 dark:bg-brandp-950/40 text-brandp-600 dark:text-brandp-300">
                <UIcon name="i-lucide-users" class="w-3 h-3" />
                {{ t('foodChatHome.diners.cookingFor', { names: cookingForNames.join(', ') }) }}
              </span>
            </div>
          </Transition>
          <div class="flex-1 p-4 sm:p-6 flex flex-col justify-center">

            <!-- Generating (fresh plan, nothing to show yet) -->
            <Transition name="plan-reveal">
              <div v-if="showCookingAnimation" class="flex flex-col items-center justify-center h-full min-h-80">
                <FoodchatCookingAnimation />
                <p class="mt-4 text-sm font-light text-stone-500 dark:text-stone-400">Cooking up your plan…</p>
              </div>
            </Transition>

            <!-- Paused — awaiting clarification, no plan yet -->
            <Transition name="plan-reveal">
              <div v-if="showPausedPanel" class="flex flex-col items-center justify-center h-full min-h-80 text-center px-8">
                <div class="fc-paused-pot relative mb-6">
                  <svg width="120" height="96" viewBox="0 0 140 110" fill="none" class="opacity-60 grayscale drop-shadow-sm">
                    <ellipse cx="70" cy="85" rx="45" ry="10" class="fill-stone-200/50 dark:fill-stone-700/30" />
                    <ellipse cx="70" cy="75" rx="48" ry="14" class="fill-stone-400 dark:fill-stone-500" />
                    <path d="M22 50C22 50 22 75 70 75C118 75 118 50 118 50" stroke="currentColor" stroke-width="6" stroke-linecap="round" class="text-stone-300 dark:text-stone-400" fill="none" />
                    <ellipse cx="70" cy="50" rx="48" ry="14" class="fill-stone-300 dark:fill-stone-400" />
                    <ellipse cx="70" cy="50" rx="40" ry="10" class="fill-amber-50 dark:fill-stone-600" />
                    <rect x="115" y="47" width="30" height="6" rx="3" class="fill-stone-300 dark:fill-stone-500" />
                  </svg>
                  <div class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-brandp-100 dark:bg-brandp-950/60 flex items-center justify-center shadow-sm">
                    <UIcon name="i-lucide-pause" class="w-3.5 h-3.5 text-brandp-500 dark:text-brandp-400" />
                  </div>
                </div>
                <p class="text-base font-light text-gray-500 dark:text-zinc-400 mb-2">Paused — answer the question to continue</p>
                <div class="flex items-center gap-1.5 text-xs text-brandp-500 dark:text-brandp-400">
                  <UIcon name="i-lucide-arrow-left" class="w-3.5 h-3.5" />
                  <span class="font-light">Reply in the chat</span>
                </div>
              </div>
            </Transition>

            <!-- Idle / fallback placeholder -->
            <Transition name="plan-reveal">
              <div v-if="showIdlePlaceholder" class="flex flex-col items-center justify-center h-full min-h-80 text-center px-8">
                <div class="w-16 h-16 rounded-2xl bg-brandp-50 dark:bg-brandp-950/30 flex items-center justify-center mb-4">
                  <UIcon name="i-lucide-calendar-days" class="w-8 h-8 text-brandp-300 dark:text-brandp-700" />
                </div>
                <p class="text-base font-light text-gray-400 dark:text-zinc-500 mb-1">{{ t('foodChatHome.canvas.placeholderTitle') }}</p>
                <p class="text-xs text-gray-300 dark:text-zinc-600">{{ t('foodChatHome.canvas.placeholderSubtitle') }}</p>
              </div>
            </Transition>

            <!-- Plan canvas — visible whenever a plan exists (idle, refining,
                 or awaiting clarification after a prior plan). -->
            <Transition name="plan-reveal">
              <div v-if="hasAnyPlan" class="plan-card relative">
                <div v-if="sending" class="fc-refining-overlay">
                  <div class="fc-refining-pill">
                    <UIcon name="i-lucide-loader-2" class="w-3.5 h-3.5 animate-spin" />
                    <span>Updating…</span>
                  </div>
                </div>

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
                  <!-- Constraint ledger -->
                  <div v-if="displayedMealPlan.constraints_applied?.length" class="mb-3 px-1 flex items-center gap-1.5 flex-wrap">
                    <span class="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-gray-400 dark:text-zinc-500 shrink-0">
                      <UIcon name="i-lucide-sliders-horizontal" class="w-3 h-3" />
                      {{ t('foodChatHome.constraints.label') }}
                    </span>
                    <UTooltip
                      v-for="(constraint, cIdx) in displayedMealPlan.constraints_applied"
                      :key="cIdx"
                      :text="constraintTooltip(constraint)"
                    >
                      <span
                        class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border cursor-help"
                        :class="constraint.type === 'hard'
                          ? 'border-brandp-200 dark:border-brandp-800/70 bg-brandp-50 dark:bg-brandp-950/40 text-brandp-600 dark:text-brandp-300 ring-1 ring-brandp-200/60 dark:ring-brandp-800/40'
                          : 'border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400'"
                      >
                        <UIcon v-if="constraint.type === 'hard'" name="i-lucide-shield-check" class="w-3 h-3 shrink-0" />
                        {{ constraint.constraint }}
                      </span>
                    </UTooltip>
                  </div>

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
                      :class="{ 'fc-slot-flash': highlightedSlots.has('breakfast') }"
                    />
                    <FoodchatMealScheduleCard
                      v-if="displayedMealPlan.lunch"
                      :type="t('foodChatHome.meals.lunch')"
                      time="13:00"
                      icon="i-lucide-utensils"
                      :recipe="displayedMealPlan.lunch"
                      :class="{ 'fc-slot-flash': highlightedSlots.has('lunch') }"
                    />
                    <FoodchatMealScheduleCard
                      v-if="displayedMealPlan.dinner"
                      :type="t('foodChatHome.meals.dinner')"
                      time="19:30"
                      icon="i-lucide-moon"
                      :recipe="displayedMealPlan.dinner"
                      :class="{ 'fc-slot-flash': highlightedSlots.has('dinner') }"
                    />
                  </div>

                  <div v-if="displayedMealPlan.reasoning" class="flex items-start gap-2 mb-4 px-1">
                    <UIcon name="i-lucide-lightbulb" class="w-3.5 h-3.5 text-brandp-400 mt-0.5 shrink-0" />
                    <p class="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed">{{ displayedMealPlan.reasoning }}</p>
                  </div>

                  <!-- Personalization line -->
                  <div v-if="personalizationParts.length" class="mb-4 px-1">
                    <NuxtLink
                      to="/my-profile"
                      class="inline-flex items-center gap-1.5 text-[11px] font-light text-gray-400 dark:text-zinc-500 hover:text-brandp-500 dark:hover:text-brandp-400 hover:underline transition-colors"
                    >
                      <UIcon name="i-lucide-sparkles" class="w-3 h-3 shrink-0" />
                      {{ t('foodChatHome.personalization.prefix') }} {{ personalizationParts.join(' · ') }}
                    </NuxtLink>
                  </div>

                  <!-- Plan quality panel -->
                  <div v-if="qualityMetrics.length" class="mb-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 overflow-hidden">
                    <button
                      class="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors"
                      @click="qualityOpen = !qualityOpen"
                    >
                      <span class="inline-flex items-center gap-1.5">
                        <UIcon name="i-lucide-gauge" class="w-3.5 h-3.5 text-brandp-400" />
                        {{ t('foodChatHome.quality.title') }}
                      </span>
                      <UIcon :name="qualityOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-3.5 h-3.5" />
                    </button>
                    <div v-show="qualityOpen" class="px-3 pb-3 pt-1 space-y-2">
                      <div v-for="metric in qualityMetrics" :key="metric.key" class="flex items-center gap-2">
                        <span class="w-24 shrink-0 text-[11px] font-light text-gray-500 dark:text-zinc-400">{{ metric.label }}</span>
                        <template v-if="metric.max != null">
                          <div class="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700 overflow-hidden">
                            <div
                              class="h-full rounded-full bg-brandp-400 dark:bg-brandp-500 transition-all"
                              :style="{ width: `${Math.min(Math.max(metric.value / metric.max, 0), 1) * 100}%` }"
                            />
                          </div>
                          <span class="w-9 shrink-0 text-right text-[11px] font-medium text-gray-700 dark:text-zinc-200">{{ metric.value }}/{{ metric.max }}</span>
                        </template>
                        <span v-else class="flex-1 text-right text-[11px] font-medium text-gray-700 dark:text-zinc-200">
                          {{ t('foodChatHome.quality.varietyValue', { count: metric.value }) }}
                        </span>
                        <UTooltip v-if="metric.reasoning" :text="metric.reasoning">
                          <UIcon name="i-lucide-info" class="w-3 h-3 text-gray-300 dark:text-zinc-600 cursor-help shrink-0" />
                        </UTooltip>
                        <span v-else class="w-3 shrink-0" />
                      </div>
                    </div>
                  </div>

                  <!-- Plan vote -->
                  <div class="mb-5 px-1">
                    <div class="flex items-center gap-2">
                      <template v-if="!planFeedbackSubmitted[displayedMealPlan.id]">
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
                      </template>
                      <span v-else class="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <UIcon name="i-lucide-check" class="w-3 h-3" />
                        {{ t('foodChatHome.chat.feedbackSaved') }}
                      </span>
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
                            <button
                              v-if="getWeeklyRecipeId(day.entries.find(e => e.meal_type === mealType))"
                              type="button"
                              class="ml-auto flex items-center justify-center w-5 h-5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 hover:scale-110 transition-all duration-200 shrink-0"
                              :aria-label="isRecipeFavorite(getWeeklyRecipeId(day.entries.find(e => e.meal_type === mealType))) ? t('recipeWrangler.recipe.removeFromFavorites') : t('recipeWrangler.recipe.addToFavorites')"
                              @click.prevent.stop="toggleRecipeFavorite(getWeeklyRecipeId(day.entries.find(e => e.meal_type === mealType)))"
                            >
                              <UIcon
                                name="i-lucide-heart"
                                :class="[
                                  'w-3 h-3 transition-colors duration-200',
                                  isRecipeFavorite(getWeeklyRecipeId(day.entries.find(e => e.meal_type === mealType)))
                                    ? 'text-red-500 fill-red-500'
                                    : 'text-gray-300 dark:text-zinc-600'
                                ]"
                              />
                            </button>
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
                          <span
                            v-if="getWeeklyEntryKcal(day.entries.find(e => e.meal_type === mealType)) != null"
                            class="mt-auto pr-8 text-[8px] text-gray-400 dark:text-zinc-500 leading-none"
                          >
                            {{ t('foodChatHome.mealCard.kcal', { kcal: getWeeklyEntryKcal(day.entries.find(e => e.meal_type === mealType)) }) }}
                          </span>
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
import { useRecipeStore } from '~/stores/recipe'
import type { AttributionCitation, ChangedSlot, ChatMessage, ConstraintApplied, MealPlan, MealRecipe, MemorySuggestion, WeeklyMealEntry } from '~/services/foodchatApi'
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
  clarificationPending,
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
  submitMemoryDecision,
  activeDiners,
  updateDiners,
  clearError
} = useFoodChat()

const householdStore = useHouseholdStore()
const recipeStore = useRecipeStore()

// ── Recipe favorites (weekly plan cells) ──
function isRecipeFavorite(recipeId: string | null): boolean {
  return recipeId ? recipeStore.isFavorite(recipeId) : false
}

function toggleRecipeFavorite(recipeId: string | null) {
  if (!recipeId) return
  recipeStore.toggleFavorite(recipeId)
}

// ── Input state ──
const inputText = ref('')
const idleInputRef = ref<HTMLTextAreaElement | null>(null)
const sessionInputRef = ref<HTMLTextAreaElement | null>(null)
const messagesScrollRef = ref<HTMLElement | null>(null)
const inputFocused = ref(false)
const sessionInputFocused = ref(false)
const hasSentFirstMessage = ref(false)
const showEphemeralGenerating = ref(false)

watch(sending, (now, prev) => {
  if (prev && !now) showEphemeralGenerating.value = false
})

const showCookingAnimation = computed(() =>
  sending.value && !hasAnyPlan.value
)
const showPausedPanel = computed(() =>
  !sending.value && clarificationPending.value && !hasAnyPlan.value
)
const showIdlePlaceholder = computed(() =>
  !hasAnyPlan.value && !showCookingAnimation.value && !showPausedPanel.value
)

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

// ── Memory nudges ──
const memoryChipState = reactive<Record<string, 'pending' | 'accepted' | 'declined'>>({})

function visibleMemorySuggestions(msg: ChatMessage): MemorySuggestion[] {
  return (msg.memory_suggestions ?? []).filter(s => memoryChipState[s.id] !== 'declined')
}

async function handleMemoryDecision(suggestion: MemorySuggestion, decision: 'accept' | 'decline') {
  if (memoryChipState[suggestion.id]) return
  memoryChipState[suggestion.id] = 'pending'
  try {
    await submitMemoryDecision(decision, suggestion)
    // Accept → subtle confirmation; decline → dismiss silently
    memoryChipState[suggestion.id] = decision === 'accept' ? 'accepted' : 'declined'
  } catch {
    delete memoryChipState[suggestion.id]
  }
}

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

// ── Diner picker ("cooking for") ──
const selectedDinerIds = ref<string[]>([])
const dinersUpdating = ref(false)

// Hidden entirely for single-member households (guests)
const showDinerPicker = computed(() => householdMembers.value.length > 1)

function isDinerSelected(memberId: string): boolean {
  return selectedDinerIds.value.includes(memberId)
}

function dinerTooltip(member: HouseholdMember): string {
  return member.id === currentMemberId.value
    ? t('foodChatHome.diners.you', { name: member.name })
    : member.name
}

const cookingForNames = computed(() => {
  const names = activeDiners.value?.cooking_for_names
  if (names?.length) return names
  return selectedDinerIds.value
    .map(id => householdMembers.value.find(m => m.id === id)?.name)
    .filter((n): n is string => !!n)
})

const showCookingForBanner = computed(() =>
  showDinerPicker.value && selectedDinerIds.value.length > 1
)

// Keep the selection in sync with the active session (persisted per session
// in the foodchat store) and the household roster; current member is always in.
let lastDinerSessionId: string | null | undefined
watch(
  [() => activeSession.value?.session_id, currentMemberId, householdMembers, activeDiners],
  () => {
    const sessionId = activeSession.value?.session_id ?? null
    const sessionChanged = sessionId !== lastDinerSessionId
    lastDinerSessionId = sessionId
    const validIds = new Set(householdMembers.value.map(m => m.id))
    // Restore the per-session selection; on switching to a session without a
    // stored selection, fall back to just the current member.
    const base = activeDiners.value?.cooking_for ?? (sessionChanged ? [] : selectedDinerIds.value)
    const next = base.filter(id => validIds.size === 0 || validIds.has(id))
    if (currentMemberId.value && !next.includes(currentMemberId.value)) next.unshift(currentMemberId.value)
    selectedDinerIds.value = next
  },
  { immediate: true }
)

async function toggleDiner(member: HouseholdMember) {
  // Current member is always selected and locked
  if (member.id === currentMemberId.value || dinersUpdating.value) return
  const prev = [...selectedDinerIds.value]
  const next = prev.includes(member.id)
    ? prev.filter(id => id !== member.id)
    : [...prev, member.id]
  selectedDinerIds.value = next
  // No session yet — the selection is sent as cooking_for on session creation
  if (!activeSession.value) return
  dinersUpdating.value = true
  try {
    await updateDiners(next)
  } catch {
    selectedDinerIds.value = prev
  } finally {
    dinersUpdating.value = false
  }
}

function cookingForForNewSession(): string[] | undefined {
  return showDinerPicker.value && selectedDinerIds.value.length > 1
    ? [...selectedDinerIds.value]
    : undefined
}

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

// ── M4 transparency: changed slots, constraints, personalization, quality ──
const KNOWN_MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const

function changedSlotLabel(slot: ChangedSlot): string {
  const mealKey = slot.meal_type?.toLowerCase()
  const mealName = (KNOWN_MEAL_TYPES as readonly string[]).includes(mealKey)
    ? t(`foodChatHome.meals.${mealKey}`)
    : slot.meal_type
  return slot.day != null
    ? `${t('foodChatHome.chat.changedSlots.day', { day: slot.day + 1 })} · ${mealName}`
    : mealName
}

// Briefly highlight swapped daily cards in the canvas
const highlightedSlots = ref<Set<string>>(new Set())
let slotFlashTimer: ReturnType<typeof setTimeout> | null = null

function flashChangedSlots(slots?: ChangedSlot[]) {
  const dailySlots = (slots ?? [])
    .filter(s => s.day == null)
    .map(s => s.meal_type?.toLowerCase())
    .filter((m): m is string => !!m)
  if (!dailySlots.length) return
  highlightedSlots.value = new Set(dailySlots)
  if (slotFlashTimer) clearTimeout(slotFlashTimer)
  slotFlashTimer = setTimeout(() => { highlightedSlots.value = new Set() }, 2600)
}

function constraintTooltip(constraint: ConstraintApplied): string {
  return constraint.type === 'hard'
    ? t('foodChatHome.constraints.hardTooltip', { source: constraint.source })
    : t('foodChatHome.constraints.softTooltip', { source: constraint.source })
}

const personalizationParts = computed(() => {
  const summary = displayedMealPlan.value?.personalization_summary
  if (!summary) return []
  const parts: string[] = []
  if (summary.memories_used > 0) parts.push(t('foodChatHome.personalization.memories', { count: summary.memories_used }))
  if (summary.favorites_used > 0) parts.push(t('foodChatHome.personalization.favorites', { count: summary.favorites_used }))
  if (summary.feedback_signals > 0) parts.push(t('foodChatHome.personalization.feedback', { count: summary.feedback_signals }))
  return parts
})

const qualityOpen = ref(false)

interface QualityMetric {
  key: string
  label: string
  value: number
  max?: number
  reasoning?: string
}

const qualityMetrics = computed<QualityMetric[]>(() => {
  const plan = displayedMealPlan.value
  if (!plan) return []
  const metrics: QualityMetric[] = []
  if (plan.llm_score != null) {
    metrics.push({ key: 'llm', label: t('foodChatHome.quality.llmMatch'), value: plan.llm_score, max: 5, reasoning: plan.llm_reasoning })
  }
  if (plan.fvs_count != null) {
    metrics.push({ key: 'variety', label: t('foodChatHome.quality.variety'), value: plan.fvs_count, reasoning: plan.fvs_reasoning })
  }
  if (plan.diversity_llm_score != null) {
    metrics.push({ key: 'diversity', label: t('foodChatHome.quality.diversity'), value: plan.diversity_llm_score, max: 5, reasoning: plan.diversity_llm_reasoning })
  }
  if (plan.guideline_adherence_score != null) {
    metrics.push({ key: 'guidelines', label: t('foodChatHome.quality.guidelines'), value: plan.guideline_adherence_score, max: 5, reasoning: plan.guideline_adherence_reasoning })
  }
  return metrics
})

function getWeeklyEntryKcal(entry: WeeklyMealEntry | undefined): number | null {
  if (!entry) return null
  const nutrition = (entry.recipe as Record<string, unknown>)?.nutrition as { kcal?: number } | null | undefined
  return typeof nutrition?.kcal === 'number' ? Math.round(nutrition.kcal) : null
}

// ── FoodScholar attribution ──
function citationLabel(citation: AttributionCitation): string {
  const text = citation.label || citation.title
  return text.length > 40 ? `${text.slice(0, 40).trimEnd()}…` : text
}

function citationChipClass(citation: AttributionCitation): string {
  return citation.source_type === 'guideline'
    ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
    : 'border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/60 text-gray-600 dark:text-zinc-300'
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
  if (!activeSession.value) await newSession(cookingForForNewSession())
  showEphemeralGenerating.value = true
  const response = await sendMessage(content)
  flashChangedSlots(response?.changed_slots)
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
  await newSession(cookingForForNewSession())
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
  if (planFeedbackSubmitted[planId]) return
  planVotes[planId] = vote
  if (vote === 'up' && messageId != null) {
    try {
      await submitMessageFeedback(messageId, 'up')
      planFeedbackSubmitted[planId] = true
    } catch { /* best-effort */ }
  }
}

async function submitPlanComment(planId: string, messageId: number | null) {
  if (messageId == null || planFeedbackSubmitted[planId]) return
  const comment = planFeedbackComments[planId]?.trim()
  try {
    await submitMessageFeedback(messageId, 'down', comment || undefined)
    planFeedbackSubmitted[planId] = true
  } catch { /* best-effort */ }
}

async function handleMessageFeedback(messageId: number, rating: 'up' | 'down') {
  if (feedbackSubmitted[messageId]) return
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
  if (feedbackSubmitted[messageId]) return
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
  recipeStore.initialize()
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
.fc-bubble-generating {
  max-width: 85%;
  border-radius: 1.25rem;
  border-bottom-left-radius: 0.375rem;
  padding: 0.55rem 0.875rem;
  background: rgb(244 244 245 / 0.8);
  border: 1px solid rgb(228 228 231 / 0.6);
  color: rgb(82 82 91);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.dark .fc-bubble-generating {
  background: rgb(39 39 42 / 0.5);
  border-color: rgb(63 63 70 / 0.4);
  color: rgb(212 212 216);
}

.fc-refining-overlay {
  position: absolute;
  inset: 0;
  z-index: 4;
  border-radius: inherit;
  background: rgb(255 255 255 / 0.55);
  backdrop-filter: blur(1px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 1rem;
  pointer-events: none;
}
.dark .fc-refining-overlay {
  background: rgb(24 24 27 / 0.55);
}
.fc-refining-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  background: white;
  border: 1px solid rgb(228 228 231 / 0.8);
  color: var(--color-brandp-600, #7c3aed);
  font-size: 0.75rem;
  font-weight: 500;
  box-shadow: 0 2px 6px rgb(0 0 0 / 0.06);
}
.dark .fc-refining-pill {
  background: rgb(39 39 42);
  border-color: rgb(63 63 70 / 0.6);
  color: var(--color-brandp-300);
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

/* ── Memory nudge chips ── */
.fc-memory-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.55rem;
  border-radius: 0.625rem;
  border: 1px solid rgb(228 228 231 / 0.8);
  background: rgb(250 250 250 / 0.8);
  color: rgb(82 82 91);
}
.dark .fc-memory-chip {
  border-color: rgb(63 63 70 / 0.6);
  background: rgb(39 39 42 / 0.5);
  color: rgb(212 212 216);
}
/* Allergy hints touch safety data — slightly more prominent */
.fc-memory-chip-warning {
  border-color: rgb(252 211 77 / 0.8);
  background: rgb(255 251 235 / 0.9);
  color: rgb(146 64 14);
}
.dark .fc-memory-chip-warning {
  border-color: rgb(146 64 14 / 0.6);
  background: rgb(69 39 3 / 0.35);
  color: rgb(252 211 77);
}
.fc-memory-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  border: 1px solid rgb(212 212 216 / 0.8);
  font-size: 10px;
  font-weight: 500;
  color: rgb(113 113 122);
  background: transparent;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}
.fc-memory-btn:hover:not(:disabled) {
  color: rgb(63 63 70);
  background: rgb(244 244 245 / 0.9);
}
.dark .fc-memory-btn {
  border-color: rgb(82 82 91 / 0.7);
  color: rgb(161 161 170);
}
.dark .fc-memory-btn:hover:not(:disabled) {
  color: rgb(228 228 231);
  background: rgb(63 63 70 / 0.5);
}
.fc-memory-btn:disabled {
  opacity: 0.6;
}
.fc-memory-btn-accept {
  border-color: var(--color-brandp-200, #ddd6fe);
  color: var(--color-brandp-600, #7c3aed);
}
.fc-memory-btn-accept:hover:not(:disabled) {
  color: var(--color-brandp-700, #6d28d9);
  background: var(--color-brandp-50, #faf5ff);
  border-color: var(--color-brandp-300, #c4b5fd);
}
.dark .fc-memory-btn-accept {
  border-color: var(--color-brandp-800, #5b21b6);
  color: var(--color-brandp-300, #c4b5fd);
}
.dark .fc-memory-btn-accept:hover:not(:disabled) {
  color: var(--color-brandp-200, #ddd6fe);
  background: var(--color-brandp-950, #2e1065);
}
.fc-memory-chip-warning .fc-memory-btn-accept {
  border-color: rgb(252 211 77);
  color: rgb(146 64 14);
}
.fc-memory-chip-warning .fc-memory-btn-accept:hover:not(:disabled) {
  background: rgb(254 243 199 / 0.8);
}
.dark .fc-memory-chip-warning .fc-memory-btn-accept {
  border-color: rgb(146 64 14);
  color: rgb(252 211 77);
}
.dark .fc-memory-chip-warning .fc-memory-btn-accept:hover:not(:disabled) {
  background: rgb(120 53 15 / 0.4);
}

/* ── Diner picker chips ── */
.fc-diner-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.5rem 0.15rem 0.2rem;
  border-radius: 9999px;
  border: 1px solid rgb(228 228 231 / 0.9);
  background: white;
  color: rgb(113 113 122);
  transition: border-color 0.15s, background 0.15s, color 0.15s, opacity 0.15s;
}
.dark .fc-diner-chip {
  border-color: rgb(63 63 70 / 0.7);
  background: rgb(39 39 42 / 0.6);
  color: rgb(161 161 170);
}
.fc-diner-chip:not(.fc-diner-chip-active) {
  opacity: 0.65;
}
.fc-diner-chip:hover:not(:disabled):not(.fc-diner-chip-locked) {
  opacity: 1;
  border-color: var(--color-brandp-300, #c4b5fd);
}
.fc-diner-chip-active {
  border-color: var(--color-brandp-300, #c4b5fd);
  background: var(--color-brandp-50, #faf5ff);
  color: var(--color-brandp-700, #6d28d9);
}
.dark .fc-diner-chip-active {
  border-color: var(--color-brandp-700, #6d28d9);
  background: var(--color-brandp-950, #2e1065);
  color: var(--color-brandp-200, #ddd6fe);
}
.fc-diner-chip-locked {
  cursor: default;
}
.fc-diner-chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.fc-diner-chip-sm {
  padding: 0.1rem 0.45rem 0.1rem 0.15rem;
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

/* ── Changed-slot flash (brief highlight on swapped meal cards) ── */
.fc-slot-flash {
  animation: fc-slot-flash 2.6s ease-out both;
}
@keyframes fc-slot-flash {
  0%   { box-shadow: inset 0 0 0 2px var(--color-brandp-400, #a78bfa); }
  60%  { box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--color-brandp-400, #a78bfa) 60%, transparent); }
  100% { box-shadow: inset 0 0 0 2px transparent; }
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
