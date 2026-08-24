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
        class="flex-1 flex flex-col items-center justify-center px-4 pt-8 pb-4"
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
            <button
              class="mt-3 inline-flex items-center gap-1.5 text-xs text-brandp-500 dark:text-brandp-400 hover:underline transition-colors"
              @click="enterDraftMode"
            >
              <UIcon name="i-lucide-list-plus" class="w-3.5 h-3.5" />
              {{ t('foodChatHome.manual.entry') }}
            </button>
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
                    :model-value="undefined"
                    :items="sessionItems"
                    value-key="value"
                    label-key="label"
                    size="sm"
                    :placeholder="t('foodChatHome.chat.previousSessions')"
                    :content="{ align: 'start', side: 'bottom', sideOffset: 4 }"
                    :ui="sessionPickerUi"
                    class="w-52"
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
        <div
          ref="splitWrap"
          class="fc-split-wrap flex w-full max-w-7xl 2xl:max-w-[100rem] min-h-0"
        >

        <!-- ── LEFT: Chat column (FoodScholar-style floating) ── -->
        <div
          class="fc-chat-col flex flex-col min-w-0 relative"
          :style="{ width: `${chatWidth}px` }"
        >

          <!-- Session bar -->
          <div class="fc-session-bar flex items-center gap-2 px-3 py-2 shrink-0">
            <UIcon name="i-lucide-messages-square" class="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 shrink-0" />
            <USelectMenu
              :model-value="activeSession?.session_id"
              :items="sessionItems"
              value-key="value"
              label-key="label"
              size="sm"
              :ui="sessionBarUi"
              :content="{ align: 'start', side: 'bottom', sideOffset: 4 }"
              class="flex-1 min-w-0"
              @update:model-value="handleSessionSwitch"
            />
            <button
              v-if="activeSession"
              class="shrink-0 h-6 w-6 flex items-center justify-center rounded-md text-gray-400 dark:text-zinc-500 hover:text-brandp-500 dark:hover:text-brandp-400 hover:bg-brandp-50 dark:hover:bg-brandp-950/30 transition-colors"
              :title="t('foodChatHome.chat.renameSession')"
              @click="handleRenameSession"
            >
              <UIcon name="i-lucide-pencil" class="w-3 h-3" />
            </button>
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

                    <!-- FoodScholar attribution (persisted with the message; survives reloads) -->
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

                    <!-- Plan settings live in ONE place: the ribbon on the
                         canvas. The card used to render here too, so every
                         fresh plan showed the same sliders twice — "too many
                         places to input adjustments" is how that reads. -->


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
            <!-- ── What's in the kitchen, settled here ──
                 Saying "I've got spinach and half a jar of olives" already
                 reaches the plan — the extractor hears it and the planner uses
                 it. What was missing was any way to SEE it or correct it
                 without opening a panel, right where the member said it.

                 So it sits above the box they typed into: what was heard, one
                 tap to drop a wrong item, one field to add a missed one. It
                 writes immediately and does NOT re-plan — the next plan uses
                 it, and re-planning on every tick would spend a turn per
                 vegetable. -->
            <div v-if="pantryStripOpen || pantryItems.length" class="mb-2 px-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                <UIcon name="i-lucide-refrigerator" class="w-3 h-3 text-emerald-500 shrink-0" />
                <span
                  v-for="item in pantryItems"
                  :key="`strip-${item}`"
                  class="group inline-flex items-center gap-1 pl-2 pr-1 py-0.5 text-[11px] rounded-full border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                >
                  {{ item }}
                  <button
                    class="w-3.5 h-3.5 flex items-center justify-center rounded-full text-emerald-500/70 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-800/40 disabled:opacity-40"
                    :aria-label="t('foodChatHome.planningState.removeItem', { value: item })"
                    :disabled="sending"
                    @click="handleRemovePantry(item)"
                  >
                    <UIcon name="i-lucide-x" class="w-2.5 h-2.5" />
                  </button>
                </span>
                <form
                  v-if="pantryStripOpen"
                  class="inline-flex items-center gap-1"
                  @submit.prevent="submitPantryStrip"
                >
                  <input
                    v-model="pantryDraft"
                    class="fc-pantry-input"
                    :placeholder="t('foodChatHome.planningState.pantryAddPlaceholder')"
                    :aria-label="t('foodChatHome.planningState.pantryAdd')"
                    :disabled="sending"
                  >
                  <button
                    type="submit"
                    class="w-4 h-4 flex items-center justify-center rounded text-gray-400 hover:text-emerald-600 disabled:opacity-40"
                    :disabled="sending || !pantryDraft.trim()"
                    :aria-label="t('foodChatHome.planningState.pantryAdd')"
                  >
                    <UIcon name="i-lucide-check" class="w-3 h-3" />
                  </button>
                </form>
                <button
                  v-else
                  class="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] rounded-full border border-dashed border-gray-300 dark:border-zinc-600 text-gray-400 dark:text-zinc-500 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
                  @click="pantryStripOpen = true"
                >
                  <UIcon name="i-lucide-plus" class="w-2.5 h-2.5" />
                  {{ t('foodChatHome.planningState.pantryAdd') }}
                </button>
              </div>
            </div>

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

        <!-- ── The drag handle between the two ──
             The chat and the canvas want different amounts of room depending
             on what the member is doing — reading a week, or arguing about a
             dinner — and the split was a fixed 34%. Dragging is remembered, so
             a member who widened the canvas once does not widen it every
             session. Double-click restores the default. -->
        <div
          class="fc-splitter shrink-0 group"
          role="separator"
          aria-orientation="vertical"
          :aria-valuenow="Math.round(chatWidth)"
          tabindex="0"
          :title="t('foodChatHome.splitter.hint')"
          @pointerdown="beginDrag"
          @dblclick="resetSplit"
          @keydown.left.prevent="nudgeSplit(-24)"
          @keydown.right.prevent="nudgeSplit(24)"
        >
          <span class="fc-splitter-grip" />
        </div>

        <!-- ── RIGHT: Canvas column ── -->
        <div class="fc-canvas-col flex flex-col overflow-y-auto">
          <!-- Plan settings, behind a disclosure and closed by default.
               Four groups of pills across the top of the canvas is the first
               thing a member sees and the last thing they came for: it reads
               as a control panel bolted above their dinner. Every control
               still commits on interaction — this only decides whether they
               are on screen when nobody asked. -->
          <div
            v-if="latestParamCard && hasAnyPlan"
            class="fc-settings-shell shrink-0"
          >
            <button
              class="w-full flex items-center gap-2 px-4 sm:px-6 py-2 text-xs text-gray-500 dark:text-zinc-400 hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 transition-colors"
              :aria-expanded="settingsOpen"
              @click="settingsOpen = !settingsOpen"
            >
              <UIcon name="i-lucide-settings-2" class="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 shrink-0" />
              <span>{{ t('foodChatHome.planSettings.title') }}</span>
              <span
                v-if="!settingsOpen && appliedSettingsSummary"
                class="text-[11px] text-gray-400 dark:text-zinc-500 font-light truncate"
              >· {{ appliedSettingsSummary }}</span>
              <UIcon
                :name="settingsOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="w-3.5 h-3.5 ml-auto shrink-0"
              />
            </button>
            <FoodchatPlanSettingsRibbon
              v-show="settingsOpen"
              :card="latestParamCard"
              :busy="sending || showEphemeralGenerating"
              @apply="handleApplyPlanParameters"
            />
          </div>
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
                <button
                  class="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-brandp-200 dark:border-brandp-800/60 text-brandp-500 dark:text-brandp-400 hover:bg-brandp-50 dark:hover:bg-brandp-950/40 transition-colors"
                  @click="enterDraftMode"
                >
                  <UIcon name="i-lucide-list-plus" class="w-3.5 h-3.5" />
                  {{ t('foodChatHome.manual.entry') }}
                </button>
              </div>
            </Transition>

            <!-- Manual mode: blank plan, hand-picked slots -->
            <Transition name="plan-reveal">
              <div v-if="draftMode && !sending" class="plan-card relative">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-brandp-50 dark:bg-brandp-950/40 flex items-center justify-center">
                      <UIcon name="i-lucide-list-plus" class="w-4 h-4 text-brandp-500" />
                    </div>
                    <span class="text-sm font-medium text-gray-900 dark:text-white">{{ t('foodChatHome.manual.title') }}</span>
                  </div>
                  <button
                    class="flex items-center justify-center w-6 h-6 rounded-full text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    :aria-label="t('foodChatHome.manual.discard')"
                    @click="exitDraftMode"
                  >
                    <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
                  </button>
                </div>

                <!-- Day / Week toggle -->
                <div class="flex rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden text-xs w-fit mb-3">
                  <button
                    :class="['px-3 py-1.5 transition-colors', draftPlanType === 'daily' ? 'bg-brandp-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800']"
                    @click="draftPlanType = 'daily'"
                  >{{ t('foodChatHome.planHeader.dailyPlan') }}</button>
                  <button
                    :class="['px-3 py-1.5 transition-colors', draftPlanType === 'weekly' ? 'bg-brandp-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800']"
                    @click="draftPlanType = 'weekly'"
                  >{{ t('foodChatHome.planHeader.weeklyPlan') }}</button>
                </div>

                <div class="space-y-2 mb-4 max-h-[46vh] overflow-y-auto pr-1">
                  <div
                    v-for="group in draftGroups"
                    :key="group.day ?? 'daily'"
                    class="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 p-3"
                  >
                    <p v-if="group.day" class="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500 mb-2">
                      {{ weekdayName(group.day) }}
                    </p>
                    <div class="space-y-2">
                      <div v-for="mealType in DRAFT_MEAL_TYPES" :key="draftSlotKey(group.day, mealType)">
                        <div class="flex items-center gap-2.5">
                          <UIcon :name="mealTypeIcon(mealType)" class="w-4 h-4 text-brandp-400 shrink-0" />
                          <span class="w-20 shrink-0 text-xs text-gray-500 dark:text-zinc-400 capitalize">{{ t(`foodChatHome.meals.${mealType}`) }}</span>
                          <template v-if="draftPicks[draftSlotKey(group.day, mealType)]">
                            <span class="flex-1 min-w-0 truncate text-sm font-medium text-gray-800 dark:text-gray-200">{{ draftPicks[draftSlotKey(group.day, mealType)]!.title }}</span>
                            <span class="shrink-0 px-1.5 py-0.5 text-[9px] rounded-full bg-brandp-50 dark:bg-brandp-950/40 text-brandp-500 dark:text-brandp-300">{{ t('foodChatHome.manual.yourPick') }}</span>
                            <button
                              class="shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                              @click="draftPicks[draftSlotKey(group.day, mealType)] = null"
                            >
                              <UIcon name="i-lucide-x" class="w-3 h-3" />
                            </button>
                          </template>
                          <button
                            v-else-if="draftPickerOpen !== draftSlotKey(group.day, mealType)"
                            class="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-full border border-dashed border-gray-300 dark:border-zinc-600 text-gray-400 dark:text-zinc-500 hover:border-brandp-300 hover:text-brandp-500 transition-colors"
                            @click="openDraftPicker(draftSlotKey(group.day, mealType))"
                          >
                            <UIcon name="i-lucide-plus" class="w-3 h-3" />
                            {{ t('foodChatHome.manual.addRecipe') }}
                          </button>
                        </div>
                        <div v-if="draftPickerOpen === draftSlotKey(group.day, mealType)" class="mt-2">
                          <!-- Favorites first — one tap, no typing -->
                          <div v-if="draftFavorites.length" class="mb-1.5 flex flex-wrap gap-1">
                            <button
                              v-for="fav in draftFavorites"
                              :key="fav.recipe_id"
                              class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border border-brandp-100 dark:border-brandp-900/50 bg-brandp-50/60 dark:bg-brandp-950/30 text-brandp-600 dark:text-brandp-300 hover:bg-brandp-100 dark:hover:bg-brandp-900/40 transition-colors"
                              @click="pickDraftRecipe(draftSlotKey(group.day, mealType), fav)"
                            >
                              <UIcon name="i-lucide-heart" class="w-2.5 h-2.5" />
                              {{ fav.title }}
                            </button>
                          </div>
                          <input
                            v-model="draftQuery"
                            type="text"
                            :placeholder="t('foodChatHome.manual.searchPlaceholder')"
                            class="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:border-brandp-400"
                            @input="onDraftQuery"
                            @keydown.escape="draftPickerOpen = null"
                          >
                          <div
                            v-if="draftSuggestions.length"
                            class="mt-1 rounded-lg border border-gray-100 dark:border-zinc-800 divide-y divide-gray-50 dark:divide-zinc-800 max-h-44 overflow-y-auto bg-white dark:bg-zinc-900"
                          >
                            <button
                              v-for="suggestion in draftSuggestions"
                              :key="suggestion.recipe_id ?? suggestion.title"
                              class="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-brandp-50 dark:hover:bg-brandp-950/30 transition-colors"
                              @click="pickDraftRecipe(draftSlotKey(group.day, mealType), suggestion)"
                            >
                              {{ suggestion.title }}
                            </button>
                          </div>
                          <p
                            v-else-if="draftQuery.trim().length >= 3 && !draftSearching"
                            class="mt-1 text-[11px] text-gray-400 dark:text-zinc-500"
                          >
                            {{ t('foodChatHome.manual.noMatches') }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between gap-3">
                  <p class="flex-1 text-[11px] font-light text-gray-400 dark:text-zinc-500 leading-snug">{{ t('foodChatHome.manual.hint') }}</p>
                  <button
                    class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full font-medium transition-colors
                           bg-brandp-500 text-white hover:bg-brandp-600
                           disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
                    :disabled="!draftPickCount || sending"
                    @click="submitDraft()"
                  >
                    <UIcon name="i-lucide-wand-sparkles" class="w-3.5 h-3.5" />
                    {{ t('foodChatHome.manual.fillRest') }}
                  </button>
                </div>
              </div>
            </Transition>

            <!-- Plan canvas — visible whenever a plan exists (idle, refining,
                 or awaiting clarification after a prior plan). -->
            <Transition name="plan-reveal">
              <div v-if="hasAnyPlan && !draftMode" class="plan-card relative">
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

                  <!-- What you can DO with this plan, at the end of its own
                       heading and said in words.
                       A bookmark glyph and a wand glyph wedged between the
                       title and the version picker read as decoration; nothing
                       about them says "keep this" or "there are seven things
                       here". Grouped, labelled, and pushed right so the row
                       reads: what this is · when it was made · what you can do
                       with it. -->
                  <div class="ml-auto flex items-center gap-2 shrink-0">
                    <UButton
                      v-if="displayedPlanId"
                      size="xs"
                      :color="displayedPlanSaved ? 'primary' : 'neutral'"
                      :variant="displayedPlanSaved ? 'soft' : 'subtle'"
                      :icon="displayedPlanSaved ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'"
                      :disabled="sending"
                      @click="handleTogglePlanSaved"
                    >
                      {{ displayedPlanSaved
                        ? t('foodChatHome.planHeader.savedPlan')
                        : t('foodChatHome.planHeader.savePlan') }}
                    </UButton>
                    <FoodchatPlanToolsMenu
                      v-if="tools.length"
                      :tools="tools"
                      :plan-type="canvasMode"
                      :day="toolsMenuDay"
                      :running="runningTool"
                      :busy="sending"
                      show-label
                      @invoke="handleToolInvoke"
                    />
                  </div>
                </div>

                <!-- "What FoodChat is planning around" used to sit here, above
                     the meals. It describes the NEXT plan, not this one, so it
                     pushed the plan the member asked for down the page to make
                     room for a panel about the one they had not asked for yet.
                     It lives in the right rail now. -->

                <!-- The last tool result. Dismissible, and never mistaken for
                     the plan itself: a summary is an answer, not a change. -->
                <div
                  v-if="toolResult"
                  class="mb-4 rounded-2xl border border-gray-200 dark:border-zinc-700/70 bg-white/70 dark:bg-zinc-900/40 overflow-hidden"
                >
                  <div class="flex items-center gap-2 px-4 py-2 border-b border-gray-100 dark:border-zinc-800">
                    <UIcon
                      :name="toolResult.error ? 'i-lucide-alert-triangle' : 'i-lucide-wand-sparkles'"
                      class="w-3.5 h-3.5 shrink-0"
                      :class="toolResult.error ? 'text-amber-500' : 'text-brandp-500'"
                    />
                    <span class="text-xs font-medium text-gray-700 dark:text-zinc-200">{{ toolResult.title }}</span>
                    <button
                      class="ml-auto w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
                      :aria-label="t('a11y.close')"
                      @click="toolResult = null"
                    >
                      <UIcon name="i-lucide-x" class="w-3 h-3" />
                    </button>
                  </div>
                  <div class="px-4 py-3 space-y-2">
                    <p v-if="toolResult.error" class="text-xs text-amber-700 dark:text-amber-300 font-light">
                      {{ toolResult.error }}
                    </p>
                    <template v-else>
                      <p v-if="toolResult.headline" class="text-xs text-gray-600 dark:text-zinc-300">
                        {{ toolResult.headline }}
                      </p>
                      <ul v-if="toolResult.lines.length" class="space-y-1">
                        <li
                          v-for="(line, lIdx) in toolResult.lines"
                          :key="lIdx"
                          class="text-xs text-gray-500 dark:text-zinc-400 font-light flex items-baseline gap-2"
                        >
                          <span class="text-gray-400 dark:text-zinc-500 shrink-0 min-w-20">{{ line.label }}</span>
                          <span class="tabular-nums">{{ line.value }}</span>
                        </li>
                      </ul>
                      <p v-if="toolResult.caveat" class="text-[10px] text-gray-400 dark:text-zinc-500 font-light">
                        {{ toolResult.caveat }}
                      </p>
                    </template>
                  </div>
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
                      :text="constraint.detail || constraintTooltip(constraint)"
                    >
                      <span
                        class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border cursor-help"
                        :class="ledgerRowClass(constraint)"
                      >
                        <UIcon v-if="ledgerRowIcon(constraint)" :name="ledgerRowIcon(constraint) || ''" class="w-3 h-3 shrink-0" />
                        {{ constraint.constraint }}
                        <span
                          v-if="constraintMembers(constraint)"
                          class="opacity-70"
                        >— {{ constraintMembers(constraint) }}</span>
                      </span>
                    </UTooltip>
                  </div>

                  <!-- One card per meal, from `planMeals`, which reads both the
                       legacy breakfast/lunch/dinner shape and the flexible
                       `meals` array. Three hardcoded blocks lived here, so a
                       plan with a snack or a two-course dinner lost the extra
                       plates silently at the template. -->
                  <div
                    v-if="displayedPlanDayGroups.length <= 1"
                    class="rounded-2xl overflow-hidden mb-4"
                    :class="mealGridCols(displayedMealPlan)"
                  >
                    <FoodchatMealScheduleCard
                      v-for="meal in displayedPlanBySlot"
                      :key="meal.slot"
                      :type="slotLabel(meal.slot)"
                      :time="meal.time || ''"
                      :icon="meal.icon"
                      :recipe="meal.plates[0]!.recipe"
                      :extra-plates="meal.plates.slice(1).map(p => p.recipe)"
                      :class="{ 'fc-slot-flash': highlightedSlots.has(meal.slot) }"
                      @replace="prefillSlotReplace(meal.slot)"
                      @adapt="openAdaptRecipe(meal.plates[0]!.recipe.recipe_id)"
                    />
                  </div>

                  <!-- A plan that spans days renders every day. The backend,
                       serializer and store all carried days 2..N faithfully;
                       this template was the only place that dropped them. -->
                  <div v-else class="space-y-5 mb-4">
                    <section v-for="group in displayedPlanDayGroups" :key="group.day">
                      <div class="flex items-center gap-2 mb-2 px-1">
                        <span class="text-xs font-medium text-gray-700 dark:text-zinc-200">
                          {{ t('foodChatHome.planHeader.dayN', { n: group.day }) }}
                        </span>
                        <span
                          v-if="mealsNutritionTotal(group.meals)"
                          class="text-[10px] text-gray-400 dark:text-zinc-500 tabular-nums"
                        >
                          {{ Math.round(mealsNutritionTotal(group.meals)!.calories) }} kcal
                        </span>
                      </div>
                      <div
                        class="rounded-2xl overflow-hidden"
                        :class="mealGridColumns(groupBySlot(group.meals).length)"
                      >
                        <FoodchatMealScheduleCard
                          v-for="meal in groupBySlot(group.meals)"
                          :key="`d${group.day}-${meal.slot}`"
                          :type="slotLabel(meal.slot)"
                          :time="meal.time || ''"
                          :icon="meal.icon"
                          :recipe="meal.plates[0]!.recipe"
                          :extra-plates="meal.plates.slice(1).map(p => p.recipe)"
                          @replace="prefillSlotReplace(meal.slot)"
                          @adapt="openAdaptRecipe(meal.plates[0]!.recipe.recipe_id)"
                        />
                      </div>
                    </section>
                  </div>

                  <!-- Day totals. The planner sums every plate server-side, so
                       this is the whole day rather than the meals that happen to
                       fit on screen. `complete: false` means a plate contributed
                       nothing, which is worth saying rather than hiding. -->
                  <div
                    v-if="displayedPlanTotals && displayedPlanDayGroups.length <= 1"
                    class="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-gray-50 dark:bg-zinc-800/50 px-3 py-2"
                  >
                    <UIcon
                      name="i-lucide-flame"
                      class="w-3.5 h-3.5 text-brandp-400 shrink-0"
                    />
                    <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {{ t('foodChatHome.dayTotal.label') }}
                    </span>
                    <span class="text-xs text-gray-600 dark:text-gray-400 tabular-nums">
                      {{ t('foodChatHome.dayTotal.macros', {
                        kcal: Math.round(displayedPlanTotals.calories),
                        protein: Math.round(displayedPlanTotals.protein_g),
                        carbs: Math.round(displayedPlanTotals.carbs_g),
                        fat: Math.round(displayedPlanTotals.fat_g)
                      }) }}
                    </span>
                    <span
                      v-if="!displayedPlanTotals.complete"
                      class="text-[10px] text-amber-600 dark:text-amber-400"
                    >{{ t('foodChatHome.dayTotal.partial') }}</span>
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
                  <FoodchatPlanQualityPanel :metrics="qualityMetrics" />

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
                  <!-- The same quality panel the daily canvas has. Weekly is the
                       deepest plan the product makes and said the least about
                       it: the graders were instance attributes on the daily
                       service, so no variety, diversity or adherence score ever
                       reached a week. -->
                  <FoodchatPlanQualityPanel :metrics="weeklyQualityMetrics" />

                  <!-- Measured constraint ledger (weekly rows can be relaxed/violated) -->
                  <div v-if="weeklyLedger.length" class="mb-3 px-1 flex items-center gap-1.5 flex-wrap">
                    <span class="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-gray-400 dark:text-zinc-500 shrink-0">
                      <UIcon name="i-lucide-sliders-horizontal" class="w-3 h-3" />
                      {{ t('foodChatHome.constraints.label') }}
                    </span>
                    <UTooltip
                      v-for="(constraint, cIdx) in weeklyLedger"
                      :key="cIdx"
                      :text="constraint.detail || constraintTooltip(constraint)"
                    >
                      <span
                        class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border cursor-help"
                        :class="ledgerRowClass(constraint)"
                      >
                        <UIcon v-if="ledgerRowIcon(constraint)" :name="ledgerRowIcon(constraint) || ''" class="w-3 h-3 shrink-0" />
                        {{ constraint.constraint }}
                        <span
                          v-if="constraintMembers(constraint)"
                          class="opacity-70"
                        >— {{ constraintMembers(constraint) }}</span>
                      </span>
                    </UTooltip>
                  </div>

                  <!-- Collapsible days — one row per day, meals reviewable inline -->
                  <div class="flex justify-end mb-1.5 px-1">
                    <button
                      class="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-zinc-500 hover:text-brandp-500 dark:hover:text-brandp-400 transition-colors"
                      @click="toggleAllWeeklyDays"
                    >
                      <UIcon :name="allWeeklyDaysExpanded ? 'i-lucide-chevrons-down-up' : 'i-lucide-chevrons-up-down'" class="w-3 h-3" />
                      {{ allWeeklyDaysExpanded ? t('foodChatHome.weekly.collapseAll') : t('foodChatHome.weekly.expandAll') }}
                    </button>
                  </div>
                  <div class="space-y-1.5 mb-4">
                    <div
                      v-for="day in weeklyDays"
                      :key="day.dayIndex"
                      class="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 overflow-hidden"
                    >
                      <button
                        class="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors"
                        :aria-expanded="expandedWeeklyDays.has(day.dayIndex)"
                        @click="toggleWeeklyDay(day.dayIndex)"
                      >
                        <span class="w-20 shrink-0 text-xs font-semibold text-gray-700 dark:text-zinc-200">{{ weeklyDayLabel(day) }}</span>
                        <span class="flex-1 min-w-0 truncate text-[11px] font-light text-gray-500 dark:text-zinc-400">{{ weeklyDaySummary(day.dayIndex) }}</span>
                        <span v-if="weeklyDayKcal(day.dayIndex) != null" class="shrink-0 text-[10px] text-gray-400 dark:text-zinc-500 tabular-nums">
                          {{ t('foodChatHome.mealCard.kcal', { kcal: Math.round(weeklyDayKcal(day.dayIndex)!) }) }}
                        </span>
                        <span class="flex -space-x-1.5 shrink-0">
                          <span
                            v-for="entry in day.entries"
                            :key="entry.meal_idx"
                            class="w-5 h-5 rounded-full ring-1 ring-white dark:ring-zinc-900 overflow-hidden bg-gray-100 dark:bg-zinc-700"
                          >
                            <img
                              v-if="getRecipeImage(getWeeklyRecipeId(entry))"
                              :src="getRecipeImage(getWeeklyRecipeId(entry)) || ''"
                              class="w-full h-full object-cover"
                              loading="lazy"
                            >
                          </span>
                        </span>
                        <UIcon
                          :name="expandedWeeklyDays.has(day.dayIndex) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                          class="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 shrink-0"
                        />
                      </button>

                      <!-- Day-scoped tools. Here rather than only on the toolbar
                           because THIS is where "this day" is unambiguous —
                           "replace Thursday" needs no guess about which day the
                           member meant. -->
                      <div
                        v-if="tools.length"
                        v-show="expandedWeeklyDays.has(day.dayIndex)"
                        class="flex items-center justify-end px-3 pb-1 -mt-1"
                      >
                        <FoodchatPlanToolsMenu
                          :tools="tools"
                          plan-type="weekly"
                          scope="day"
                          :day="day.dayIndex"
                          :running="runningTool"
                          :busy="sending"
                          @invoke="handleToolInvoke"
                        />
                      </div>

                      <div v-show="expandedWeeklyDays.has(day.dayIndex)" class="px-2 pb-2">
                        <!-- One cell per PLATE, not per slot name. The cell used
                             to look its entry up with `entries.find(meal_type)`,
                             which returns the first match — so a dinner with a
                             side rendered the main and silently dropped the
                             rest. `day.cells` carries every entry. -->
                        <div
                          class="gap-1.5"
                          :class="mealGridColumns(day.cells.length)"
                        >
                          <div
                            v-for="cell in day.cells"
                            :key="cell.key"
                            class="relative rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 p-2 flex flex-col gap-1.5"
                            :class="{ 'fc-slot-flash': highlightedSlots.has(cell.slotKey) }"
                          >
                            <div class="flex items-center gap-1">
                              <UIcon :name="mealTypeIcon(cell.mealType)" class="w-3 h-3 text-brandp-400 shrink-0" />
                              <span class="text-[10px] text-gray-400 dark:text-zinc-500">{{ cell.label }}</span>
                              <button
                                v-if="getWeeklyRecipeId(cellMain(cell))"
                                type="button"
                                class="ml-auto flex items-center justify-center w-5 h-5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 hover:scale-110 transition-all duration-200 shrink-0"
                                :aria-label="isRecipeFavorite(getWeeklyRecipeId(cellMain(cell))) ? t('recipeWrangler.recipe.removeFromFavorites') : t('recipeWrangler.recipe.addToFavorites')"
                                @click.prevent.stop="toggleRecipeFavorite(getWeeklyRecipeId(cellMain(cell)))"
                              >
                                <UIcon
                                  name="i-lucide-heart"
                                  :class="[
                                    'w-3 h-3 transition-colors duration-200',
                                    isRecipeFavorite(getWeeklyRecipeId(cellMain(cell)))
                                      ? 'text-red-500 fill-red-500'
                                      : 'text-gray-300 dark:text-zinc-600'
                                  ]"
                                />
                              </button>
                              <!-- Slot menu: replace via chat, adapt in the popup -->
                              <div class="relative shrink-0" :class="{ 'ml-auto': !getWeeklyRecipeId(cellMain(cell)) }" @mouseleave="weeklySlotMenu = null">
                                <button
                                  type="button"
                                  class="flex items-center justify-center w-5 h-5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                                  :aria-label="t('foodChatHome.mealCard.menu')"
                                  :aria-expanded="weeklySlotMenu === cell.key"
                                  @click.prevent.stop="weeklySlotMenu = weeklySlotMenu === cell.key ? null : cell.key"
                                >
                                  <UIcon name="i-lucide-more-vertical" class="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                                </button>
                                <Transition name="chips-fade">
                                  <div
                                    v-if="weeklySlotMenu === cell.key"
                                    class="absolute right-0 top-6 z-20 w-40 rounded-xl border border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg overflow-hidden"
                                  >
                                    <button
                                      type="button"
                                      class="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-brandp-50 dark:hover:bg-brandp-950/30 transition-colors"
                                      @click.prevent.stop="prefillWeeklySlotReplace(day.dayIndex, cell.mealType)"
                                    >
                                      <UIcon name="i-lucide-replace" class="w-3.5 h-3.5 text-brandp-400" />
                                      {{ t('foodChatHome.mealCard.replace') }}
                                    </button>
                                    <button
                                      v-if="getWeeklyRecipeId(cellMain(cell))"
                                      type="button"
                                      class="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-brandp-50 dark:hover:bg-brandp-950/30 transition-colors"
                                      @click.prevent.stop="openAdaptRecipe(getWeeklyRecipeId(cellMain(cell)))"
                                    >
                                      <UIcon name="i-lucide-wand-sparkles" class="w-3.5 h-3.5 text-brandp-400" />
                                      {{ t('foodChatHome.mealCard.adapt') }}
                                    </button>
                                  </div>
                                </Transition>
                              </div>
                            </div>
                            <div class="flex items-center gap-2">
                              <NuxtLink
                                :to="getWeeklyRecipeId(cellMain(cell)) ? `/recipe-wrangler/${getWeeklyRecipeId(cellMain(cell))}` : ''"
                                :target="getWeeklyRecipeId(cellMain(cell)) ? '_blank' : undefined"
                                class="w-9 h-9 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-700 shrink-0 transition-transform duration-200 hover:scale-150 cursor-pointer block"
                              >
                                <img
                                  v-if="getRecipeImage(getWeeklyRecipeId(cellMain(cell)))"
                                  :src="getRecipeImage(getWeeklyRecipeId(cellMain(cell))) || ''"
                                  class="w-full h-full object-cover"
                                  loading="lazy"
                                >
                                <div
                                  v-else-if="isRecipeImagePending(getWeeklyRecipeId(cellMain(cell)))"
                                  class="w-full h-full animate-pulse"
                                />
                                <div v-else class="w-full h-full flex items-center justify-center">
                                  <UIcon name="i-lucide-utensils" class="w-3.5 h-3.5 text-gray-300 dark:text-zinc-600" />
                                </div>
                              </NuxtLink>
                              <div class="flex-1 min-w-0">
                                <NuxtLink
                                  v-if="getWeeklyRecipeId(cellMain(cell))"
                                  :to="`/recipe-wrangler/${getWeeklyRecipeId(cellMain(cell))}`"
                                  target="_blank"
                                  class="text-[11px] font-medium text-brandp-600 dark:text-brandp-400 leading-tight line-clamp-2 hover:underline"
                                >
                                  {{ getWeeklyRecipeTitle(cellMain(cell)) }}
                                </NuxtLink>
                                <p v-else class="text-[11px] font-medium text-gray-800 dark:text-gray-200 leading-tight line-clamp-2">
                                  {{ getWeeklyRecipeTitle(cellMain(cell)) }}
                                </p>
                                <!-- The MEAL's calories, not the main's: a
                                     main plus a salad is one meal, and the
                                     main alone understates what gets eaten. -->
                                <span
                                  v-if="weeklyMealKcal(cell.plates) != null"
                                  class="text-[9px] text-gray-400 dark:text-zinc-500 leading-none"
                                >
                                  {{ t('foodChatHome.mealCard.kcal', { kcal: weeklyMealKcal(cell.plates) }) }}
                                </span>
                              </div>
                              <!-- Nutrient donut -->
                              <div
                                v-if="getWeeklyRecipeId(cellMain(cell)) && getWeeklySegments(getWeeklyRecipeId(cellMain(cell))).length"
                                class="shrink-0 relative cursor-help"
                                @mouseleave="weeklyHovered[cell.key] = null"
                              >
                                <svg width="28" height="28" viewBox="0 0 28 28" style="transform:rotate(-90deg)">
                                  <circle cx="14" cy="14" r="11" stroke="#e5e7eb" stroke-width="3.5" fill="none" />
                                  <circle
                                    v-for="seg in getWeeklySegments(getWeeklyRecipeId(cellMain(cell)))"
                                    :key="seg.key"
                                    cx="14" cy="14" r="11"
                                    :stroke="seg.color"
                                    stroke-width="3.5"
                                    fill="none"
                                    :stroke-dasharray="`${seg.dash} ${weeklyCircumference}`"
                                    :stroke-dashoffset="-seg.offset"
                                    stroke-linecap="butt"
                                    :style="{ opacity: weeklyHovered[cell.key] && weeklyHovered[cell.key] !== seg.key ? 0.25 : 1, transition: 'opacity 0.15s' }"
                                    @mouseenter="weeklyHovered[cell.key] = seg.key"
                                  />
                                </svg>
                                <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                  <span class="text-[7px] font-bold text-gray-700 dark:text-gray-200 leading-none">{{ getWeeklyCenterValue(getWeeklyRecipeId(cellMain(cell))!, cell.key) }}</span>
                                </div>
                              </div>
                            </div>
                            <!-- Why this meal — transparency chips -->
                            <!-- The rest of the meal: the salad beside the
                                 main, badged by what it is. Compact rows under
                                 the main rather than tiles beside it, which is
                                 how the daily canvas reads a composed meal. -->
                            <div
                              v-if="cell.plates.length > 1"
                              class="border-t border-gray-100 dark:border-zinc-800 pt-1.5 space-y-1.5"
                            >
                              <div
                                v-for="plate in cell.plates.slice(1)"
                                :key="`${cell.key}-${plate.meal_idx}-${getWeeklyRecipeId(plate)}`"
                                class="flex items-center gap-1.5"
                              >
                                <NuxtLink
                                  :to="getWeeklyRecipeId(plate) ? `/recipe-wrangler/${getWeeklyRecipeId(plate)}` : ''"
                                  :target="getWeeklyRecipeId(plate) ? '_blank' : undefined"
                                  class="w-6 h-6 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-700 shrink-0 transition-transform duration-200 hover:scale-150 block"
                                >
                                  <img
                                    v-if="getRecipeImage(getWeeklyRecipeId(plate))"
                                    :src="getRecipeImage(getWeeklyRecipeId(plate)) || ''"
                                    class="w-full h-full object-cover"
                                    loading="lazy"
                                  >
                                  <div v-else class="w-full h-full flex items-center justify-center">
                                    <UIcon name="i-lucide-salad" class="w-2.5 h-2.5 text-gray-300 dark:text-zinc-600" />
                                  </div>
                                </NuxtLink>
                                <span
                                  class="shrink-0 inline-flex items-center px-1 py-px text-[8px] font-semibold uppercase tracking-wide rounded"
                                  :class="plateBadgeClass(plate)"
                                >{{ plateRoleLabel(plate) }}</span>
                                <NuxtLink
                                  v-if="getWeeklyRecipeId(plate)"
                                  :to="`/recipe-wrangler/${getWeeklyRecipeId(plate)}`"
                                  target="_blank"
                                  class="min-w-0 text-[10px] font-medium text-gray-700 dark:text-zinc-200 leading-tight line-clamp-1 hover:underline"
                                >{{ getWeeklyRecipeTitle(plate) }}</NuxtLink>
                                <span
                                  v-else
                                  class="min-w-0 text-[10px] font-medium text-gray-700 dark:text-zinc-200 leading-tight line-clamp-1"
                                >{{ getWeeklyRecipeTitle(plate) }}</span>
                              </div>
                            </div>

                            <!-- Same chips as the daily cards, with the same
                                 icons. Weekly rendered the label alone, so a
                                 `guideline` chip — a rule from the member's own
                                 national guidance — was indistinguishable from
                                 a favourite or a memory. -->
                            <div v-if="weeklyEntryReasons(cellMain(cell)).length" class="flex flex-wrap gap-1">
                              <span
                                v-for="(reason, rIdx) in weeklyEntryReasons(cellMain(cell))"
                                :key="rIdx"
                                class="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] rounded-full border border-brandp-100 dark:border-brandp-900/50 bg-brandp-50/60 dark:bg-brandp-950/30 text-brandp-600 dark:text-brandp-300"
                              >
                                <UIcon :name="reasonIcon(reason.kind)" class="w-2.5 h-2.5 shrink-0" />
                                {{ reason.label }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Whole-week justification -->
                  <div v-if="displayedWeeklyPlan.reasoning" class="flex items-start gap-2 mb-4 px-1">
                    <UIcon name="i-lucide-lightbulb" class="w-3.5 h-3.5 text-brandp-400 mt-0.5 shrink-0" />
                    <p class="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed">{{ displayedWeeklyPlan.reasoning }}</p>
                  </div>

                  <!-- Week at a glance: guideline checklist, variety, nutrition -->
                  <div
                    v-if="weeklyChecklist.length || weeklyVariety || weeklyNutrition"
                    class="mb-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 overflow-hidden"
                  >
                    <button
                      class="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors"
                      @click="weekGlanceOpen = !weekGlanceOpen"
                    >
                      <span class="inline-flex items-center gap-1.5">
                        <UIcon name="i-lucide-gauge" class="w-3.5 h-3.5 text-brandp-400" />
                        {{ t('foodChatHome.weekly.glanceTitle') }}
                        <span
                          v-if="weeklyChecklist.length"
                          class="px-1.5 py-0.5 text-[9px] rounded-full font-medium tabular-nums"
                          :class="weeklyChecklistMet === weeklyChecklist.length
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'"
                        >{{ weeklyChecklistMet }}/{{ weeklyChecklist.length }}</span>
                      </span>
                      <UIcon :name="weekGlanceOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-3.5 h-3.5" />
                    </button>
                    <div v-show="weekGlanceOpen" class="px-3 pb-3 pt-1 space-y-2">
                      <div v-for="check in weeklyChecklist" :key="check.rule" class="flex items-center gap-2">
                        <UIcon
                          :name="check.met ? 'i-lucide-check-circle-2' : 'i-lucide-alert-circle'"
                          :class="check.met ? 'text-emerald-500' : 'text-amber-500'"
                          class="w-3.5 h-3.5 shrink-0"
                        />
                        <span class="flex-1 text-[11px] font-light text-gray-500 dark:text-zinc-400">
                          {{ check.rule }}
                          <!-- Whose rule this is. Absent on the built-in
                               fallbacks, which are not anyone's national
                               guidance and need no byline. -->
                          <span
                            v-if="check.source"
                            class="text-gray-400 dark:text-zinc-500"
                          >· {{ check.source }}</span>
                        </span>
                        <span class="shrink-0 text-[11px] font-medium text-gray-700 dark:text-zinc-200 tabular-nums">{{ check.actual }} · {{ check.target }}</span>
                      </div>
                      <div v-if="weeklyVariety?.reasoning" class="flex items-start gap-2 pt-1.5 border-t border-gray-100 dark:border-zinc-800">
                        <UIcon name="i-lucide-shuffle" class="w-3.5 h-3.5 text-brandp-400 mt-0.5 shrink-0" />
                        <span class="text-[11px] font-light text-gray-500 dark:text-zinc-400 leading-relaxed">{{ weeklyVariety.reasoning }}</span>
                      </div>
                      <div v-if="weeklyNutrition?.daily_average_kcal != null" class="flex items-start gap-2">
                        <UIcon name="i-lucide-flame" class="w-3.5 h-3.5 text-brandp-400 mt-0.5 shrink-0" />
                        <span class="text-[11px] font-light text-gray-500 dark:text-zinc-400 leading-relaxed">
                          {{ t('foodChatHome.weekly.dailyAverage', { kcal: Math.round(weeklyNutrition.daily_average_kcal) }) }}
                          <template v-if="weeklyNutrition.budget_used_pct != null">
                            · {{ t('foodChatHome.weekly.budgetUsed', { pct: weeklyNutrition.budget_used_pct }) }}
                          </template>
                          <span v-if="weeklyNutrition.note" class="text-gray-400 dark:text-zinc-500"> ({{ weeklyNutrition.note }})</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Personalization line -->
                  <div v-if="weeklyPersonalizationParts.length" class="mb-4 px-1">
                    <NuxtLink
                      to="/my-profile"
                      class="inline-flex items-center gap-1.5 text-[11px] font-light text-gray-400 dark:text-zinc-500 hover:text-brandp-500 dark:hover:text-brandp-400 hover:underline transition-colors"
                    >
                      <UIcon name="i-lucide-sparkles" class="w-3 h-3 shrink-0" />
                      {{ t('foodChatHome.personalization.prefix') }} {{ weeklyPersonalizationParts.join(' · ') }}
                    </NuxtLink>
                  </div>

                  <!-- Plan vote -->
                  <div class="mb-5 px-1">
                    <div class="flex items-center gap-2">
                      <template v-if="!planFeedbackSubmitted[displayedWeeklyPlan.id]">
                        <span class="text-xs text-gray-400">{{ t('foodChatHome.canvas.rateThisPlan') }}</span>
                        <UTooltip :text="t('foodChatHome.tooltips.planWorksWell')">
                          <button
                            :class="['fc-feedback-btn', planVotes[displayedWeeklyPlan.id] === 'up' ? 'fc-feedback-active-up' : '']"
                            @click="votePlan(displayedWeeklyPlan.id, 'up', getMessageIdForPlanIdx(selectedWeeklyPlanIdx))"
                          >
                            <UIcon name="i-lucide-thumbs-up" class="w-3.5 h-3.5" />
                          </button>
                        </UTooltip>
                        <UTooltip :text="t('foodChatHome.tooltips.needsImprovement')">
                          <button
                            :class="['fc-feedback-btn', planVotes[displayedWeeklyPlan.id] === 'down' ? 'fc-feedback-active-down' : '']"
                            @click="votePlan(displayedWeeklyPlan.id, 'down', getMessageIdForPlanIdx(selectedWeeklyPlanIdx))"
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
                      <div v-if="planVotes[displayedWeeklyPlan.id] === 'down' && !planFeedbackSubmitted[displayedWeeklyPlan.id]" class="mt-2 flex items-center gap-2">
                        <input
                          v-model="planFeedbackComments[displayedWeeklyPlan.id]"
                          type="text"
                          :placeholder="t('foodChatHome.canvas.feedbackCommentPlaceholder')"
                          class="flex-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:border-brandp-400"
                          @keydown.enter="submitPlanComment(displayedWeeklyPlan.id, getMessageIdForPlanIdx(selectedWeeklyPlanIdx))"
                        />
                        <button
                          class="text-xs px-3 py-1.5 rounded-lg bg-brandp-500 text-white hover:bg-brandp-600 transition-colors"
                          @click="submitPlanComment(displayedWeeklyPlan.id, getMessageIdForPlanIdx(selectedWeeklyPlanIdx))"
                        >
                          {{ t('foodChatHome.canvas.feedbackCommentSend') }}
                        </button>
                      </div>
                    </Transition>
                  </div>
                </template>

              </div>
            </Transition>

          </div>
        </div>

        <!-- ── RIGHT RAIL: what the NEXT plan is being built around ──
             A rail rather than a block above the meals, and collapsed by
             default. It describes the next plan, not the one on screen, so
             above the meals it pushed what the member asked for down the page
             to make room for what they had not asked for yet.

             Collapsed it is a spine of icons with a count, so a member can see
             at a glance that three things are standing without opening
             anything. -->
        <div
          v-if="planningState"
          class="fc-rail shrink-0 flex flex-col"
          :class="railOpen ? 'fc-rail-open' : 'fc-rail-shut'"
        >
          <button
            class="flex items-center gap-2 px-2 py-2.5 text-gray-500 dark:text-zinc-400 hover:bg-gray-100/70 dark:hover:bg-zinc-800/50 transition-colors shrink-0"
            :class="railOpen ? 'justify-between' : 'flex-col gap-1.5'"
            :aria-expanded="railOpen"
            :title="t('foodChatHome.planningState.title')"
            @click="railOpen = !railOpen"
          >
            <span class="inline-flex items-center gap-2">
              <UIcon name="i-lucide-clipboard-list" class="w-4 h-4 text-brandp-500 shrink-0" />
              <span v-if="railOpen" class="text-xs font-medium whitespace-nowrap">
                {{ t('foodChatHome.planningState.title') }}
              </span>
            </span>
            <span
              v-if="standingCount"
              class="text-[10px] px-1.5 py-0.5 rounded-full bg-brandp-50 dark:bg-brandp-900/30 text-brandp-600 dark:text-brandp-300 tabular-nums shrink-0"
            >{{ standingCount }}</span>
            <UIcon
              v-if="railOpen"
              name="i-lucide-chevrons-right"
              class="w-3.5 h-3.5 shrink-0"
            />
          </button>
          <div v-if="railOpen" class="flex-1 overflow-y-auto px-2 pb-3">
    <FoodchatPlanningStatePanel
    :state="planningState"
    :facets="facetChips"
    :pending-changes="pendingStateChanges"
    :busy="sending"
    :vocabularies="vocabularies"
    @add-facet="handleAddFacet"
    @add-pantry="handleAddPantry"
    @remove-pantry="handleRemovePantry"
    @remove-facet="handleRemoveFacet"
    @replan="handleReplan"
    />
          </div>
        </div>

        </div><!-- end fc-split-wrap -->
      </div>
    </Transition>

    <!-- Adapt popup -->
    <FoodchatAdaptRecipeModal
      v-if="adaptRecipeId"
      :recipe-id="adaptRecipeId"
      @close="adaptRecipeId = null"
    />

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
          <button
            v-if="lastFailedMessage && !sending"
            class="shrink-0 px-2 py-1 rounded-lg text-xs font-medium text-red-700 dark:text-red-200 bg-red-100/70 dark:bg-red-900/40 hover:bg-red-200/70 dark:hover:bg-red-900/60 transition-colors"
            @click="retryLastMessage"
          >
            {{ t('foodChatHome.errors.retry') }}
          </button>
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
import type { AttributionCitation, ChangedSlot, ChatMessage, ConstraintApplied, FoodChatTool, MealPlan, MealRecipe, MemorySuggestion, PlanParameterValues, WeeklyDayBreakdown, WeeklyMealEntry } from '~/services/foodchatApi'
import recipeApi from '~/services/recipeApi'
import {
  humaniseSlot,
  mealGridColumns,
  mealsNutritionTotal,
  planDayGroups,
  planMeals,
  planMealsBySlot,
  planNutritionTotal,
  slotIcon,
  type NormalisedMeal
} from '~/utils/planMeals'
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
  applyPlanParameters,
  renameSession,
  savePlan,
  loadSavedPlans,
  savedPlanIds,
  composePlan,
  activeDiners,
  updateDiners,
  clearError,
  planningState,
  facetChips,
  pendingStateChanges,
  loadPlanningState,
  addPantryItems,
  removePantryItem,
  addFacets,
  removeFacet,
  replan,
  vocabularies,
  loadVocabularies,
  tools,
  runningTool,
  loadTools,
  invokeTool
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
  !hasAnyPlan.value && !showCookingAnimation.value && !showPausedPanel.value && !draftMode.value
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

// ── Plan-parameter card ──
// Only the newest card stays interactive (a fresh plan or an apply response
// re-attaches a card with updated values, superseding older ones)
const dismissedParamCards = ref(new Set<string>())

function messageKey(msg: ChatMessage): string {
  return String(msg.id ?? msg.timestamp)
}

const latestParamCardKey = computed(() => {
  const withCard = [...messages.value].reverse()
    .find(m => m.role === 'assistant' && m.plan_parameters)
  return withCard ? messageKey(withCard) : null
})

// The newest card object itself — the ribbon renders it on the canvas.
// Deliberately ignores dismissal: dismissing the in-chat card says "stop
// interrupting the conversation", not "remove my settings"; the ribbon is
// where those settings permanently live.
const latestParamCard = computed(() => {
  const withCard = [...messages.value].reverse()
    .find(m => m.role === 'assistant' && m.plan_parameters)
  return withCard?.plan_parameters ?? null
})

function isActiveParamCard(msg: ChatMessage): boolean {
  const key = messageKey(msg)
  return key === latestParamCardKey.value && !dismissedParamCards.value.has(key)
}

function dismissParamCard(msg: ChatMessage) {
  dismissedParamCards.value = new Set([...dismissedParamCards.value, messageKey(msg)])
}

async function handleApplyPlanParameters(
  values: PlanParameterValues,
  planType?: 'daily' | 'weekly'
) {
  showEphemeralGenerating.value = true
  try {
    // planType is the card's own address — without it the backend would
    // refine whichever canvas is newest, which may not be this card's plan
    await applyPlanParameters(values, planType)
    scrollToBottom()
  } catch {
    showEphemeralGenerating.value = false
  }
}

// ── Manual mode: blank canvas, hand-picked slots, FoodChat fills the rest ──
const DRAFT_MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const
const draftMode = ref(false)
const draftPlanType = ref<'daily' | 'weekly'>('daily')
// Picks keyed by slot: daily → "0-breakfast", weekly → "3-dinner" (day 1-7).
// The two keyspaces don't collide, so toggling plan type loses nothing.
const draftPicks = reactive<Record<string, { recipe_id: string, title: string } | null>>({})
const draftPickerOpen = ref<string | null>(null)
const draftQuery = ref('')
const draftSuggestions = ref<RecipeAutocompleteSuggestion[]>([])
const draftSearching = ref(false)
let draftSearchTimer: ReturnType<typeof setTimeout> | null = null

function draftSlotKey(day: number | null, mealType: string): string {
  return `${day ?? 0}-${mealType}`
}

// Day groups the draft card renders: one anonymous group for daily,
// seven labeled days for weekly
const draftGroups = computed(() =>
  draftPlanType.value === 'daily'
    ? [{ day: null as number | null }]
    : Array.from({ length: 7 }, (_, i) => ({ day: (i + 1) as number | null }))
)

function isDraftKeyForCurrentType(key: string): boolean {
  return draftPlanType.value === 'daily' ? key.startsWith('0-') : !key.startsWith('0-')
}

const draftPickCount = computed(() =>
  Object.entries(draftPicks)
    .filter(([key, pick]) => pick && isDraftKeyForCurrentType(key))
    .length
)

// Favorites shortlist for the pickers — loaded once per draft session
const draftFavorites = ref<Array<{ recipe_id: string, title: string }>>([])
const draftFavoritesLoaded = ref(false)

async function loadDraftFavorites() {
  if (draftFavoritesLoaded.value) return
  draftFavoritesLoaded.value = true
  const ids = recipeStore.favorites.slice(0, 6)
  if (!ids.length) return
  try {
    const details = await recipeApi.getRecipeDetailsBatch(ids)
    draftFavorites.value = ids
      .map(id => ({ recipe_id: id, title: details[id]?.title || '' }))
      .filter(f => f.title)
  } catch { /* shortlist is optional — search still works */ }
}

function enterDraftMode() {
  draftMode.value = true
  if (!hasSentFirstMessage.value) hasSentFirstMessage.value = true
  loadDraftFavorites()
}

function exitDraftMode() {
  draftMode.value = false
  draftPickerOpen.value = null
  draftQuery.value = ''
  draftSuggestions.value = []
  for (const key of Object.keys(draftPicks)) draftPicks[key] = null
}

function openDraftPicker(slotKey: string) {
  draftPickerOpen.value = slotKey
  draftQuery.value = ''
  draftSuggestions.value = []
}

function onDraftQuery() {
  if (draftSearchTimer) clearTimeout(draftSearchTimer)
  const query = draftQuery.value.trim()
  if (query.length < 3) { draftSuggestions.value = []; return }
  draftSearchTimer = setTimeout(async () => {
    draftSearching.value = true
    try {
      const results = await recipeApi.autocompleteRecipes(query, 8)
      // Stale-response guard: only apply if the query hasn't moved on
      if (draftQuery.value.trim() === query) {
        draftSuggestions.value = results.filter(s => s.recipe_id)
      }
    } catch {
      draftSuggestions.value = []
    } finally {
      draftSearching.value = false
    }
  }, 250)
}

function pickDraftRecipe(slotKey: string, suggestion: RecipeAutocompleteSuggestion) {
  if (!suggestion.recipe_id) return
  draftPicks[slotKey] = { recipe_id: suggestion.recipe_id, title: suggestion.title }
  draftPickerOpen.value = null
  draftQuery.value = ''
  draftSuggestions.value = []
}

async function submitDraft(message?: string) {
  if (!draftPickCount.value || sending.value) return
  if (!activeSession.value) await newSession(cookingForForNewSession())
  const picks = Object.entries(draftPicks)
    .filter((e): e is [string, { recipe_id: string, title: string }] =>
      !!e[1] && isDraftKeyForCurrentType(e[0]))
    .map(([key, pick]) => {
      const [day, meal_type] = [Number(key.split('-')[0]), key.split('-')[1]]
      return {
        meal_type: meal_type as 'breakfast' | 'lunch' | 'dinner',
        recipe_id: pick.recipe_id,
        title: pick.title,
        day: day > 0 ? day : null
      }
    })
  showEphemeralGenerating.value = true
  try {
    await composePlan(picks, draftPlanType.value, message)
    exitDraftMode()
    scrollToBottom()
  } catch {
    showEphemeralGenerating.value = false
  }
}

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

// A new plan arriving dismisses the compose panel. Draft mode hid the plan
// card outright (`hasAnyPlan && !draftMode`), so a member who opened compose
// and then asked the chat for a plan got the plan generated, announced in the
// conversation — and invisible, with the canvas still showing three empty
// "Add a recipe" slots. Watching the plan count catches every arrival path:
// chat, compose, parameter apply, session reload.
watch(
  () => mealPlans.value.length + weeklyMealPlans.value.length,
  (count, previous) => {
    if (count > (previous ?? 0) && draftMode.value) exitDraftMode()
  }
)

const sessionItems = computed(() =>
  sessions.value.map(s => ({
    value: s.session_id,
    label: formatSessionLabel(s)
  }))
)

// Session-picker trigger styling.
//
// These MUST ride on `:ui.base`, which Nuxt UI applies to the trigger element
// itself. The previous attempt put them in a `.fc-session-select button` CSS
// rule — a DESCENDANT selector — while the class was on the trigger, so the
// whole hit area (min-height, padding, border) matched nothing and silently
// never applied. Only the `cursor: pointer` on the element itself landed,
// which is exactly what "looks like text, not a control" means.
const SESSION_TRIGGER = [
  'cursor-pointer min-h-8 px-2.5 rounded-lg border transition-colors',
  'border-gray-200/90 bg-gray-50 hover:bg-white hover:border-brandp-300',
  'dark:border-zinc-700/90 dark:bg-zinc-800/60 dark:hover:bg-zinc-800',
  'dark:hover:border-brandp-700',
].join(' ')

const sessionPickerUi = {
  base: `${SESSION_TRIGGER} text-xs text-gray-500 dark:text-zinc-400`,
}
const sessionBarUi = {
  base: `${SESSION_TRIGGER} flex-1 min-w-0 truncate text-xs text-gray-600 dark:text-zinc-400`,
  trailingIcon: 'w-3.5 h-3.5',
}

function formatSessionLabel(s: typeof sessions.value[0]): string {
  // A member-given name beats a timestamp; the timestamp is the fallback
  // identity for sessions nobody bothered to name.
  if (s.title) return s.title
  const date = new Date(s.created_at)
  const dateStr = date.toLocaleDateString(activeDateLocale.value, { month: 'short', day: 'numeric' })
  const timeStr = date.toLocaleTimeString(activeDateLocale.value, { hour: '2-digit', minute: '2-digit' })
  return `${dateStr} · ${timeStr}`
}

async function handleRenameSession() {
  if (!activeSession.value) return
  const current = activeSession.value.title
    ?? formatSessionLabel(activeSession.value)
  // window.prompt over a modal on purpose: renaming is a two-second act and
  // the session bar has no room for an inline editor at this density.
  const title = window.prompt(t('foodChatHome.chat.renameSessionPrompt'), current)
  if (title === null) return
  const trimmed = title.trim()
  if (!trimmed || trimmed === current) return
  await renameSession(activeSession.value.session_id, trimmed)
}

// ── Saved plans ──
const displayedPlanId = computed(() =>
  canvasMode.value === 'weekly'
    ? displayedWeeklyPlan.value?.id ?? null
    : displayedMealPlan.value?.id ?? null
)

const displayedPlanSaved = computed(() =>
  displayedPlanId.value ? savedPlanIds.value.includes(displayedPlanId.value) : false
)

async function handleTogglePlanSaved() {
  if (!displayedPlanId.value) return
  const saving = !displayedPlanSaved.value
  // The session title doubles as the plan name — the member has already
  // named this planning conversation, and re-asking is friction.
  const title = saving ? (activeSession.value?.title ?? undefined) : undefined
  await savePlan(displayedPlanId.value, saving, title)
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

const suggestedQuestions = computed(() => [
  { text: t('foodChatHome.suggestedQuestions.dailyPlan'), icon: 'i-lucide-calendar-days' },
  { text: t('foodChatHome.suggestedQuestions.weeklyPlan'), icon: 'i-lucide-calendar-range' },
  { text: t('foodChatHome.suggestedQuestions.highProtein'), icon: 'i-lucide-leaf' },
  { text: t('foodChatHome.suggestedQuestions.mediterranean'), icon: 'i-lucide-heart-pulse' }
])

const negativeFeedbackReasons = [
  t('foodChatHome.feedback.tooGeneric'),
  t('foodChatHome.feedback.notAccurate'),
  t('foodChatHome.feedback.missingInfo'),
  t('foodChatHome.feedback.irrelevant')
]

// ── Weekly plan helpers ──
const weeklyDays = computed(() => {
  if (!displayedWeeklyPlan.value) return []
  const grouped: Record<number, WeeklyMealEntry[]> = {}
  for (const entry of displayedWeeklyPlan.value.entries) {
    const day = (grouped[entry.day] ??= [])
    day.push(entry)
  }
  return Object.entries(grouped)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([day, entries]) => {
      const sorted = entries.sort((a, b) => a.meal_idx - b.meal_idx)

      // One cell per MEAL, with its plates inside.
      //
      // The grid used to loop slot NAMES and look each one up with
      // `entries.find(e => e.meal_type === mealType)` — which returns the first
      // match, so a weekly dinner with a side rendered the main and silently
      // discarded the rest. That became one cell per PLATE, which fixed the
      // dropping and introduced a different lie: a two-plate dinner drawn as
      // two independent tiles beside breakfast and lunch, so the day looked
      // like four meals and the grid gave it four columns.
      //
      // A plate is part of a meal, and the daily canvas already renders it
      // that way.
      const cells: Array<{
        key: string
        slotKey: string
        mealType: string
        label: string
        plates: WeeklyMealEntry[]
      }> = []
      for (const entry of sorted) {
        const mealType = String(entry.meal_type || '').trim() || 'meal'
        const existing = cells.find(cell => cell.mealType === mealType)
        if (existing) {
          existing.plates.push(entry)
          continue
        }
        cells.push({
          // Unique per meal: menus and donut hover states are addressed by
          // this.
          key: `${day}-${mealType}`,
          // Shared by every plate of a slot: the flash after an edit is about
          // the slot, and highlighting one plate of a meal would be a lie
          // about which one changed.
          slotKey: `${day}-${mealType}`,
          mealType,
          label: slotLabel(mealType),
          plates: [entry]
        })
      }

      return { dayIndex: Number(day), entries: sorted, cells }
    })
})

// ── Weekly explainability (M7 — collapsible days, measured ledger, metrics) ──
const expandedWeeklyDays = ref<Set<number>>(new Set())
const weekGlanceOpen = ref(false)

function toggleWeeklyDay(dayIndex: number) {
  const next = new Set(expandedWeeklyDays.value)
  if (next.has(dayIndex)) next.delete(dayIndex)
  else next.add(dayIndex)
  expandedWeeklyDays.value = next
}

const allWeeklyDaysExpanded = computed(() =>
  weeklyDays.value.length > 0
  && weeklyDays.value.every(d => expandedWeeklyDays.value.has(d.dayIndex))
)

function toggleAllWeeklyDays() {
  expandedWeeklyDays.value = allWeeklyDaysExpanded.value
    ? new Set()
    : new Set(weeklyDays.value.map(d => d.dayIndex))
}

// A new plan (or plan switch) starts fully expanded — meals are there to
// review; collapsing to the headline row is the reader's choice
watch(displayedWeeklyPlan, (now, prev) => {
  if (now?.id !== prev?.id) {
    expandedWeeklyDays.value = new Set(weeklyDays.value.map(d => d.dayIndex))
  }
}, { immediate: true })

const weeklyLedger = computed(() => displayedWeeklyPlan.value?.constraints_applied ?? [])

// Both ledgers share these: the daily plan now carries the same relaxed /
// violated states the weekly one does, since a goal demoted to a soft signal
// during household reconciliation is exactly a relaxed row.
/**
 * Four states, and `unsupported` is the one that matters most.
 *
 * It means FoodChat could NOT enforce this constraint and is saying so —
 * a dietary group with no filter behind it, or a facet the recipe details
 * carry no annotation to check. It used to fall through to the branch below
 * and render as a hard constraint WITH a shield-check, which is precisely the
 * guarantee it exists to withhold. A member selecting `peanut_free` saw a
 * green shield over an unenforced rule.
 *
 * Grey and informational: not an alarm (nothing was violated), not a promise.
 */
function ledgerRowClass(row: ConstraintApplied): string {
  if (row.status === 'violated') {
    return 'border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-300'
  }
  if (row.status === 'relaxed') {
    return 'border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-300'
  }
  if (row.status === 'unsupported') {
    return 'border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-800/60 text-gray-500 dark:text-zinc-400 border-dashed'
  }
  return row.type === 'hard'
    ? 'border-brandp-200 dark:border-brandp-800/70 bg-brandp-50 dark:bg-brandp-950/40 text-brandp-600 dark:text-brandp-300 ring-1 ring-brandp-200/60 dark:ring-brandp-800/40'
    : 'border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400'
}

function ledgerRowIcon(row: ConstraintApplied): string | null {
  if (row.status === 'violated') return 'i-lucide-alert-triangle'
  if (row.status === 'relaxed') return 'i-lucide-alert-circle'
  // Never the shield here — the shield is the claim that a hard constraint was
  // enforced, and `unsupported` is the admission that it was not.
  if (row.status === 'unsupported') return 'i-lucide-info'
  return row.type === 'hard' ? 'i-lucide-shield-check' : null
}

const weeklyMetrics = computed(() => displayedWeeklyPlan.value?.metrics ?? {})
const weeklyChecklist = computed(() => weeklyMetrics.value.guideline_checklist ?? [])
const weeklyChecklistMet = computed(() => weeklyChecklist.value.filter(c => c.met).length)
const weeklyVariety = computed(() => weeklyMetrics.value.variety)
const weeklyNutrition = computed(() => weeklyMetrics.value.nutrition)

function weeklyDayInfo(dayIndex: number): WeeklyDayBreakdown | undefined {
  return (weeklyMetrics.value.days ?? []).find(d => d.day === dayIndex)
}

function weeklyDayLabel(day: { dayIndex: number }): string {
  // Localized weekday from the 1-based day index — never the backend's
  // English name, and never the old off-by-one "Day N" array
  return weekdayName(day.dayIndex)
}

function weeklyDaySummary(dayIndex: number): string {
  // day_summaries keys arrive as strings after the JSON round-trip
  const summaries = displayedWeeklyPlan.value?.day_summaries
  return weeklyDayInfo(dayIndex)?.summary
    || summaries?.[dayIndex] || summaries?.[String(dayIndex)] || ''
}

function weeklyDayKcal(dayIndex: number): number | null {
  return weeklyDayInfo(dayIndex)?.kcal ?? null
}

// The seven declared reason kinds, matching MealScheduleCard's map so a chip
// means the same thing on both canvases. `guideline` is the newest: it had an
// icon and a renderer here long before anything emitted one.
const WEEKLY_REASON_ICONS: Record<string, string> = {
  pinned: 'i-lucide-pin',
  favorite: 'i-lucide-heart',
  memory: 'i-lucide-brain',
  profile: 'i-lucide-user',
  feedback: 'i-lucide-thumbs-up',
  diner: 'i-lucide-users',
  guideline: 'i-lucide-book-open'
}

function reasonIcon(kind: string): string {
  return WEEKLY_REASON_ICONS[kind] ?? 'i-lucide-sparkles'
}

function weeklyEntryReasons(entry: WeeklyMealEntry | undefined): Array<{ kind: string, label: string }> {
  const r = entry?.recipe as Record<string, unknown> | undefined
  return (r?.match_reasons as Array<{ kind: string, label: string }> | undefined) ?? []
}

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
import type { Recipe as RecipeData, RecipeAutocompleteSuggestion } from '~/services/recipeApi'
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
    const dash = ((values[def.key] ?? 0) / total) * weeklyCircumference
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

// Shared with the daily canvas so both surfaces agree on a slot's icon, and
// so a slot added backend-side gets one without touching this file.
const mealTypeIcon = slotIcon

// ── M4 transparency: changed slots, constraints, personalization, quality ──

function changedSlotLabel(slot: ChangedSlot): string {
  // `slotLabel` translates where a key exists and humanises where it does not,
  // so this no longer needs a whitelist of the three slots that happen to have
  // translations — an unlisted slot showed its raw backend string before.
  const mealName = slot.meal_type ? slotLabel(slot.meal_type.toLowerCase()) : ''
  return slot.day != null
    ? `${t('foodChatHome.chat.changedSlots.day', { day: slot.day + 1 })} · ${mealName}`
    : mealName
}

// Briefly highlight swapped daily cards in the canvas
const highlightedSlots = ref<Set<string>>(new Set())
let slotFlashTimer: ReturnType<typeof setTimeout> | null = null

function flashChangedSlots(slots?: ChangedSlot[]) {
  // Daily slots key by meal_type; weekly slots by "day-meal_type" (and the
  // affected day is forced open so the proof is never hidden by a collapse)
  const keys: string[] = []
  const weeklyDaysToOpen: number[] = []
  for (const s of slots ?? []) {
    const meal = s.meal_type?.toLowerCase()
    if (!meal) continue
    if (s.day == null) {
      keys.push(meal)
    } else {
      keys.push(`${s.day}-${meal}`)
      weeklyDaysToOpen.push(s.day)
    }
  }
  if (!keys.length) return
  if (weeklyDaysToOpen.length) {
    expandedWeeklyDays.value = new Set([...expandedWeeklyDays.value, ...weeklyDaysToOpen])
  }
  highlightedSlots.value = new Set(keys)
  if (slotFlashTimer) clearTimeout(slotFlashTimer)
  slotFlashTimer = setTimeout(() => { highlightedSlots.value = new Set() }, 2600)
}

/**
 * The diners a ledger row is there for. Empty on a solo plan — naming yourself
 * on your own constraints is noise — and empty on rows that belong to the plan
 * rather than a person (feedback exclusions, the weekly meat limit).
 */
function constraintMembers(constraint: ConstraintApplied): string {
  return (constraint.members || []).join(', ')
}

function constraintTooltip(constraint: ConstraintApplied): string {
  // An unsupported row's own `detail` names what could not be enforced and
  // why; the generic hard/soft wording would overwrite that with a claim.
  if (constraint.status === 'unsupported') {
    return t('foodChatHome.constraints.unsupportedTooltip')
  }
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

const weeklyPersonalizationParts = computed(() => {
  const summary = displayedWeeklyPlan.value?.personalization_summary
  if (!summary) return []
  const parts: string[] = []
  if (summary.memories_used > 0) parts.push(t('foodChatHome.personalization.memories', { count: summary.memories_used }))
  if (summary.favorites_used > 0) parts.push(t('foodChatHome.personalization.favorites', { count: summary.favorites_used }))
  if (summary.feedback_signals > 0) parts.push(t('foodChatHome.personalization.feedback', { count: summary.feedback_signals }))
  return parts
})

// The panel owns its own open/closed state now that it is a component.
interface QualityMetric {
  key: string
  label: string
  value: number
  max?: number
  reasoning?: string
}

/**
 * The three member-meaningful quality scores, from a plan of either shape.
 *
 * `llm_score` is deliberately absent: it is the grader's internal ranking of
 * one candidate day against nine others, which means nothing to the person
 * eating it. A score of 0 is also skipped — on the weekly and structured paths
 * nothing ranked anything, and rendering a zero bar reads as "judged, badly"
 * rather than "not judged".
 */
function buildQualityMetrics(source: {
  fvs_count?: number
  fvs_reasoning?: string
  diversity_llm_score?: number
  diversity_llm_reasoning?: string
  guideline_adherence_score?: number
  guideline_adherence_reasoning?: string
} | null | undefined): QualityMetric[] {
  if (!source) return []
  const metrics: QualityMetric[] = []
  if (source.fvs_count != null && source.fvs_count > 0) {
    metrics.push({
      key: 'variety', label: t('foodChatHome.quality.variety'),
      value: source.fvs_count, reasoning: source.fvs_reasoning
    })
  }
  if (source.diversity_llm_score != null && source.diversity_llm_score > 0) {
    metrics.push({
      key: 'diversity', label: t('foodChatHome.quality.diversity'),
      value: source.diversity_llm_score, max: 5,
      reasoning: source.diversity_llm_reasoning
    })
  }
  if (source.guideline_adherence_score != null && source.guideline_adherence_score > 0) {
    metrics.push({
      key: 'guidelines', label: t('foodChatHome.quality.guidelines'),
      value: source.guideline_adherence_score, max: 5,
      reasoning: source.guideline_adherence_reasoning
    })
  }
  return metrics
}

const qualityMetrics = computed<QualityMetric[]>(
  () => buildQualityMetrics(displayedMealPlan.value)
)

/**
 * The week's scores, which live under `metrics.quality` rather than on the
 * plan object — a weekly plan carries its metrics in one dict, and the daily
 * one carries them as fields.
 */
const weeklyQualityMetrics = computed<QualityMetric[]>(
  () => buildQualityMetrics(weeklyMetrics.value.quality)
)

/** A meal cell's main plate — the one its heading, heart and menu act on. */
function cellMain(cell: { plates: WeeklyMealEntry[] }): WeeklyMealEntry | undefined {
  return cell.plates.find(plate => String(plate.role || 'main') === 'main')
    ?? cell.plates[0]
}

/**
 * The MEAL's calories — every plate added up.
 *
 * Null when no plate carries a figure, which is the honest state; a partial sum
 * is still shown, because the alternative is showing nothing for a meal whose
 * main is profiled and whose side is not.
 */
function weeklyMealKcal(plates: WeeklyMealEntry[]): number | null {
  let total = 0
  let counted = 0
  for (const plate of plates) {
    const kcal = getWeeklyEntryKcal(plate)
    if (kcal == null) continue
    total += kcal
    counted += 1
  }
  return counted ? Math.round(total) : null
}

const PLATE_BADGE: Record<string, string> = {
  main: 'bg-brandp-500 text-white',
  side: 'bg-emerald-500 text-white',
  salad: 'bg-emerald-500 text-white',
  soup: 'bg-amber-500 text-white',
  dessert: 'bg-pink-500 text-white',
  drink: 'bg-sky-500 text-white'
}

function plateBadgeClass(plate: WeeklyMealEntry): string {
  return PLATE_BADGE[String(plate.role || 'main').toLowerCase()] ?? 'bg-gray-400 text-white'
}

function plateRoleLabel(plate: WeeklyMealEntry): string {
  const role = String(plate.role || 'main').toLowerCase()
  const key = `foodChatHome.mealCard.roles.${role}`
  const translated = t(key)
  return translated === key ? humaniseSlot(role) : translated
}

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

// ── Localized weekday names (entries are 1-based: 1=Monday … 7=Sunday) ──
const WEEKDAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

function weekdayName(dayIndex: number): string {
  const key = WEEKDAY_KEYS[dayIndex - 1]
  return key ? t(`dashboard.schedule.days.${key}`) : `Day ${dayIndex}`
}

// ── Slot menu actions (meal-card ⋮ menu) ──
function focusChatInputWith(text: string) {
  inputText.value = text
  nextTick(() => {
    const el = sessionInputRef.value ?? idleInputRef.value
    el?.focus()
    el?.setSelectionRange(el.value.length, el.value.length)
  })
}

function prefillSlotReplace(slot: string) {
  // Prefill the verified-edit phrasing; the user tweaks the directive and
  // sends — the edit flow swaps exactly this slot with before/after proof
  focusChatInputWith(t('foodChatHome.mealCard.replacePrefill', {
    meal: t(`foodChatHome.meals.${slot}`).toLowerCase()
  }))
}

function prefillWeeklySlotReplace(dayIndex: number, slot: string) {
  weeklySlotMenu.value = null
  focusChatInputWith(t('foodChatHome.mealCard.replacePrefillWeekly', {
    meal: t(`foodChatHome.meals.${slot}`).toLowerCase(),
    day: weekdayName(dayIndex)
  }))
}

// ── Adapt popup (RecipeWrangler's assistant, without leaving FoodChat) ──
const adaptRecipeId = ref<string | null>(null)
const weeklySlotMenu = ref<string | null>(null)

function openAdaptRecipe(recipeId?: string | null) {
  weeklySlotMenu.value = null
  if (!recipeId) return
  adaptRecipeId.value = recipeId
}

// ── Sending ──
async function ensureSessionAndSend(content: string) {
  // Manual mode: staged picks ride with the message ("fill out the rest")
  // through the compose endpoint instead of the classifier
  if (draftMode.value && draftPickCount.value > 0) {
    await submitDraft(content)
    return
  }
  if (!hasSentFirstMessage.value) {
    hasSentFirstMessage.value = true
    await nextTick()
  }
  if (!activeSession.value) await newSession(cookingForForNewSession())
  showEphemeralGenerating.value = true
  try {
    const response = await sendMessage(content)
    lastFailedMessage.value = null
    flashChangedSlots(response?.changed_slots)
    scrollToBottom()
  } catch {
    // The store rolls the optimistic message back and surfaces the error, but
    // the member's words were gone: the input was cleared on send, so a failed
    // turn cost them their sentence and they had to retype it to try again.
    // Hold it so one click resends.
    lastFailedMessage.value = content
  }
}

/** The message a failed turn ate, kept so the banner can offer it back. */
const lastFailedMessage = ref<string | null>(null)

async function retryLastMessage() {
  const content = lastFailedMessage.value
  if (!content || sending.value) return
  clearError()
  await ensureSessionAndSend(content)
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

// ── Member helpers ──
function getMemberAvatar(member: HouseholdMember): AvatarConfig | null {
  if (!member.image_url) return null
  return stringToAvatarConfig(member.image_url)
}

function getMemberAvatarForDisplay(member: HouseholdMember): AvatarConfig {
  // `stringToAvatarConfig` is declared as possibly-undefined but is total over
  // a non-empty string — it hashes into a fixed preset table. The member id is
  // never empty, so this branch always yields a config.
  return getMemberAvatar(member) ?? (stringToAvatarConfig(member.id) as AvatarConfig)
}

/** Grid width for however many meals the plan turned out to have.
 *  Previously derived from a literal `[breakfast, lunch, dinner]` triple, so a
 *  four-meal day was laid out as if it had three. */
function mealGridCols(plan: MealPlan): string {
  // Columns per MEAL, not per plate: a two-plate lunch is one card now, and
  // counting plates gave a four-column grid for a three-meal day.
  return mealGridColumns(planMealsBySlot(plan).length)
}

/**
 * Plates of the same slot, gathered into one meal, order preserved.
 *
 * `planMealsBySlot` does this for a whole plan; the multi-day sections already
 * have their day's plates in hand, so this groups those without re-reading the
 * plan.
 */
function groupBySlot(meals: NormalisedMeal[]) {
  const out: Array<{ slot: string, icon: string, time: string | null, plates: NormalisedMeal[] }> = []
  for (const meal of meals) {
    const existing = out.find(entry => entry.slot === meal.slot)
    if (existing) existing.plates.push(meal)
    else out.push({ slot: meal.slot, icon: meal.icon, time: meal.time, plates: [meal] })
  }
  return out
}

// ── The chat/canvas split ────────────────────────────────────────────────
//
// It was `width: clamp(300px, 34%, 460px)` — one ratio for reading a week and
// for arguing about one dinner. The handle between the columns sets it, the
// choice is remembered, and double-click restores the default.

const SPLIT_KEY = 'foodchat:chat-width'
const SPLIT_MIN = 300
const SPLIT_MAX = 720
const SPLIT_DEFAULT = 420

const splitWrap = ref<HTMLElement | null>(null)
const chatWidth = ref(SPLIT_DEFAULT)

function clampSplit(px: number): number {
  // Never wider than half: past that the "chat column" is the page and the
  // canvas is the sidebar, which is not what either of them is.
  const half = (splitWrap.value?.clientWidth ?? 1200) / 2
  return Math.max(SPLIT_MIN, Math.min(Math.min(SPLIT_MAX, half), px))
}

function persistSplit() {
  try {
    localStorage.setItem(SPLIT_KEY, String(Math.round(chatWidth.value)))
  } catch { /* private mode, quota — a forgotten width is not a failure */ }
}

function beginDrag(event: PointerEvent) {
  const startX = event.clientX
  const startWidth = chatWidth.value
  const target = event.currentTarget as HTMLElement
  target.setPointerCapture?.(event.pointerId)
  document.body.style.cursor = 'col-resize'
  // Dragging over the canvas selects its text otherwise, which looks broken.
  document.body.style.userSelect = 'none'

  const move = (e: PointerEvent) => {
    chatWidth.value = clampSplit(startWidth + (e.clientX - startX))
  }
  const up = () => {
    target.removeEventListener('pointermove', move)
    target.removeEventListener('pointerup', up)
    target.removeEventListener('pointercancel', up)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    persistSplit()
  }
  target.addEventListener('pointermove', move)
  target.addEventListener('pointerup', up)
  target.addEventListener('pointercancel', up)
}

function nudgeSplit(by: number) {
  chatWidth.value = clampSplit(chatWidth.value + by)
  persistSplit()
}

function resetSplit() {
  chatWidth.value = SPLIT_DEFAULT
  persistSplit()
}

// ── The pantry strip above the composer ──────────────────────────────────
const pantryStripOpen = ref(false)
const pantryDraft = ref('')

const pantryItems = computed(() => planningState.value?.pantry ?? [])

/**
 * "ground beef, feta" and "ground beef" both work.
 *
 * A comma is how people list things, and splitting here means one round trip
 * instead of three — the endpoint takes a list precisely so it can.
 */
function submitPantryStrip() {
  const items = pantryDraft.value
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
  if (!items.length) return
  pantryDraft.value = ''
  handleAddPantry(items)
}

// ── The right rail ───────────────────────────────────────────────────────
const railOpen = ref(false)

/** How many things are standing, for the collapsed rail's badge. */
const standingCount = computed(() => {
  const state = planningState.value
  if (!state) return 0
  return (state.pantry?.length ?? 0)
    + facetChips.value.length
    + (state.diet_tags?.length ?? 0)
    + (state.claim_tags?.length ?? 0)
    + (state.max_minutes ? 1 : 0)
})

// The settings disclosure. Closed by default: four groups of pills across the
// top of the canvas is the first thing a member sees and the last thing they
// came for.
const settingsOpen = ref(false)

/**
 * What is currently set, in one line, for the collapsed header.
 *
 * So closing the panel does not hide the fact that a 20-minute ceiling or a
 * high-protein goal is in force. A disclosure that hides state is worse than a
 * ribbon that shows it.
 */
const appliedSettingsSummary = computed(() => {
  const card = latestParamCard.value
  if (!card) return ''
  const parts: string[] = []
  for (const param of card.parameters) {
    const value = param.value
    if (value == null || value === '') continue
    if (param.kind === 'scale') {
      parts.push(`${value}${param.unit ? ` ${param.unit}` : ''}`)
      continue
    }
    const option = param.options?.find(o => o.value === value)
    const key = `foodChatHome.chat.planParams.options.${value}`
    const translated = t(key)
    parts.push(translated === key ? (option?.label ?? String(value)) : translated)
  }
  return parts.join(' · ')
})

/** The plan's meals, whichever shape the backend sent. */
const displayedPlanMeals = computed(() => planMeals(displayedMealPlan.value))
/** The same plates, gathered one card per MEAL — a main and its salad together. */
const displayedPlanBySlot = computed(() => planMealsBySlot(displayedMealPlan.value))
// Every day of the displayed plan; length > 1 switches the canvas to day
// sections. The single-day path keeps its exact existing markup.
const displayedPlanDayGroups = computed(() => planDayGroups(displayedMealPlan.value))

/** Day macro totals — server-computed when present, summed locally otherwise. */
const displayedPlanTotals = computed(() => planNutritionTotal(displayedMealPlan.value))

/**
 * A slot's display name.
 *
 * Translated where a translation exists, humanised from the slot name where it
 * does not. The slot vocabulary is backend-owned and grows without a frontend
 * release, so a missing key must degrade to "Second Breakfast" rather than to a
 * blank heading or a raw `foodChatHome.meals.brunch` key.
 */
function slotLabel(slot: string): string {
  const key = `foodChatHome.meals.${slot}`
  const translated = t(key)
  return translated === key ? humaniseSlot(slot) : translated
}

// The plate's role — "Main", "Side", "Dessert" — is what distinguishes two
// cards that share a meal heading. Rendered from the role rather than the
// course type because the role is what FoodChat persists and what the
// nutrition weighting is keyed by; the course type is RecipeWrangler's
// vocabulary and stops at the client boundary.

function formatPlanDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(activeDateLocale.value, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

// ── Standing planning state: pantry, inferred facets ──────────────────────
// The panel writes immediately (so a tick-off is not lost to a reload) but does
// not re-plan — `pendingStateChanges` is what the member commits.

async function handleAddPantry(items: string[]) {
  try {
    await addPantryItems(items)
  } catch { /* the store surfaces the error */ }
}

async function handleRemovePantry(item: string) {
  try {
    await removePantryItem(item)
  } catch { /* the store surfaces the error */ }
}

async function handleAddFacet(value: string) {
  try {
    await addFacets([value])
  } catch { /* the store surfaces the error */ }
}

async function handleRemoveFacet(value: string) {
  try {
    await removeFacet(value)
  } catch { /* the store surfaces the error */ }
}

async function handleReplan() {
  try {
    await replan(canvasMode.value)
  } catch { /* the store surfaces the error */ }
}

// ── Tools ─────────────────────────────────────────────────────────────────

/** Rendered result of the last tool run — an answer, not a plan change. */
interface ToolResultView {
  title: string
  headline?: string
  lines: Array<{ label: string, value: string }>
  caveat?: string
  error?: string
}

const toolResult = ref<ToolResultView | null>(null)

/**
 * The day a day-scoped tool would act on.
 *
 * The toolbar menu sits above the whole canvas, so on a weekly plan it can only
 * honestly name a day when exactly one is expanded. Null keeps "replace this
 * day" out of the menu rather than having it pick one — the per-day menus on the
 * weekly grid are where a specific day is unambiguous.
 */
const toolsMenuDay = computed<number | null>(() => {
  if (canvasMode.value === 'weekly') {
    const expanded = [...expandedWeeklyDays.value]
    return expanded.length === 1 ? expanded[0]! : null
  }
  // A single-day daily plan has exactly one day to act on.
  return displayedPlanDayGroups.value.length === 1
    ? displayedPlanDayGroups.value[0]!.day
    : null
})

async function handleToolInvoke(tool: FoodChatTool, args: Record<string, unknown>) {
  toolResult.value = null
  try {
    const result = await invokeTool<Record<string, any>>(tool, args)
    toolResult.value = renderToolResult(tool, result)
  } catch (err: any) {
    // A ToolError is a 400 carrying member-facing prose — "this plan covers
    // Monday to Wednesday" — so show it rather than a generic failure.
    toolResult.value = {
      title: t('foodChatHome.tools.failed'),
      lines: [],
      error: err?.data?.detail || err?.message || t('foodChatHome.tools.failed')
    }
  }
}

/**
 * One tool result, as rows.
 *
 * Deliberately shallow: it reads the documented keys and shows nothing for the
 * ones a given tool does not return, rather than guessing at a shape. A tool
 * whose result it does not recognise still gets its title and its own caveat,
 * which beats rendering `[object Object]`.
 */
function renderToolResult(tool: FoodChatTool, result?: Record<string, any>): ToolResultView {
  const view: ToolResultView = { title: tool.summary, lines: [] }
  if (!result) return view

  const totals = result.week_totals ?? result.total ?? result.totals
  if (totals && typeof totals === 'object') {
    if (typeof totals.calories === 'number') {
      view.lines.push({ label: 'kcal', value: Math.round(totals.calories).toLocaleString() })
    }
    for (const [key, label] of [['protein_g', 'protein'], ['carbs_g', 'carbs'], ['fat_g', 'fat']] as const) {
      if (typeof totals[key] === 'number') {
        view.lines.push({ label, value: `${Math.round(totals[key])} g` })
      }
    }
    // The tool says how many meals it could actually see; a bare total would
    // understate the plan and imply completeness.
    if (totals.complete === false && typeof totals.meals_counted === 'number') {
      view.caveat = t('foodChatHome.tools.totalsPartial', {
        counted: totals.meals_counted,
        total: totals.meals_total ?? totals.meals_counted
      })
    }
  }

  if (typeof result.daily_average_kcal === 'number') {
    view.headline = t('foodChatHome.tools.dailyAverage', {
      kcal: Math.round(result.daily_average_kcal)
    })
  }

  if (Array.isArray(result.days)) {
    for (const day of result.days) {
      const meals = Array.isArray(day?.meals)
        ? day.meals.map((m: any) => m?.title).filter(Boolean).join(' · ')
        : ''
      if (meals) view.lines.push({ label: String(day?.name ?? day?.day ?? ''), value: meals })
    }
  } else if (Array.isArray(result.meals)) {
    for (const meal of result.meals) {
      if (meal?.title) {
        view.lines.push({ label: String(meal.meal_type ?? ''), value: String(meal.title) })
      }
    }
  }

  if (Array.isArray(result.per_day)) {
    for (const day of result.per_day) {
      if (typeof day?.calories === 'number') {
        view.lines.push({
          label: String(day.name ?? `day ${day.day ?? ''}`),
          value: `${Math.round(day.calories)} kcal`
        })
      }
    }
  }

  // A shopping list. One row per item, saying which meals need it — never a
  // quantity: the recipes store ingredients as free text, so the tool reports
  // the absence explicitly and this must not paper over it.
  if (Array.isArray(result.items) && typeof result.item_count === 'number') {
    view.headline = t('foodChatHome.tools.shoppingHeadline', {
      items: result.item_count,
      dishes: result.dishes ?? 0
    })
    for (const row of result.items.slice(0, SHOPPING_ROWS)) {
      if (!row?.item) continue
      const uses = Array.isArray(row.for) ? row.for.length : 0
      view.lines.push({
        label: String(row.item),
        value: uses > 1
          ? t('foodChatHome.tools.shoppingForMany', { count: uses })
          : String((row.for ?? [])[0] ?? '')
      })
    }
    // Said rather than silently truncated: a list that stops at 25 and looks
    // finished is a shopping trip that comes home short.
    if (result.item_count > SHOPPING_ROWS) {
      view.caveat = t('foodChatHome.tools.shoppingMore', {
        count: result.item_count - SHOPPING_ROWS
      })
    }
  }

  // Saved, or taken back off the list.
  if (typeof result.saved === 'boolean') {
    view.headline = result.saved
      ? (result.title
          ? t('foodChatHome.tools.savedAs', { title: result.title })
          : t('foodChatHome.tools.saved'))
      : t('foodChatHome.tools.unsaved')
  }

  if (tool.mutates && !view.lines.length) {
    view.headline = t('foodChatHome.tools.dayReplaced', { day: result.day ?? '' })
  }
  return view
}

/** How many shopping rows the panel shows before it says how many it did not. */
const SHOPPING_ROWS = 25

/**
 * Open a specific session and plan when the URL names them.
 *
 * The library's saved-plan cards link here, and a link that lands on whatever
 * session happens to be newest is a link that does not work. Applied after the
 * sessions and their plans are loaded, because until then there is nothing to
 * select. A stale id (a deleted session, a plan from another member) is ignored
 * rather than reported: the page still shows a working conversation, and an
 * error banner about a bookmark from three weeks ago helps nobody.
 */
async function openFromQuery() {
  const route = useRoute()
  const wantedSession = typeof route.query.session === 'string' ? route.query.session : null
  const wantedPlan = typeof route.query.plan === 'string' ? route.query.plan : null
  if (!wantedSession) return

  if (sessions.value.some(session => session.session_id === wantedSession)) {
    await selectSession(wantedSession)
  }
  if (!wantedPlan) return

  await nextTick()
  const dailyIdx = mealPlans.value.findIndex(plan => plan.id === wantedPlan)
  if (dailyIdx !== -1) {
    canvasMode.value = 'daily'
    selectedDailyPlanIdx.value = dailyIdx
    return
  }
  const weeklyIdx = weeklyMealPlans.value.findIndex(plan => plan.id === wantedPlan)
  if (weeklyIdx !== -1) {
    canvasMode.value = 'weekly'
    selectedWeeklyPlanIdx.value = weeklyIdx
  }
}

// ── Watch messages to auto-scroll ──
watch(messages, () => scrollToBottom(), { deep: true, flush: 'post' })
watch(messagesScrollRef, (el) => { if (el) scrollToBottom(false) })

// ── Mount ──
onMounted(async () => {
  // The remembered split, read here rather than in the ref's initialiser: on
  // the server there is no localStorage, and a value read during setup would
  // make the markup Nuxt sends differ from what the client renders.
  try {
    const stored = Number(localStorage.getItem(SPLIT_KEY))
    if (Number.isFinite(stored) && stored > 0) chatWidth.value = clampSplit(stored)
  } catch { /* private mode — the default width is a fine answer */ }

  recipeStore.initialize()
  await loadSessions()
  await openFromQuery()
  // Bookmark states on the canvas need the saved-plan ids; fire-and-forget,
  // the store treats a failed load as "no bookmarks yet".
  loadSavedPlans()
  if (messages.value.length > 0 || hasAnyPlan.value) {
    hasSentFirstMessage.value = true
    nextTick(() => scrollToBottom(false))
  }
  if (!householdMembers.value.length && householdStore.currentHousehold?.id) {
    await householdStore.fetchMembers()
  }
  // Both are fire-and-forget: an unreachable tool surface hides the menu, and
  // an unreadable planning state hides the panel. Neither should hold the page.
  loadTools()
  loadPlanningState()
  // The corpus vocabulary, so the panel can offer tastes that exist. Fetched
  // once and kept — it is the same for every member.
  loadVocabularies()
})

// The standing state belongs to the session, so it is re-read whenever the
// active session changes — including the switch a fresh session performs.
watch(() => activeSession.value?.session_id, (id) => {
  toolResult.value = null
  if (id) loadPlanningState()
})

// A new plan means whatever was pending has been applied. Re-read rather than
// assume: the plan may have come from a chat turn that changed the state too.
watch(() => latestMealPlan.value?.id, (id) => {
  if (id) loadPlanningState()
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}

/* ── Layout ── */
.fc-split-wrap {
  /* Let the workspace use the screen it is on. The old 720px ceiling left a
     third of a 1440p monitor empty while the plan scrolled inside a short
     box; the viewport minus header is the honest bound. */
  height: clamp(480px, 78vh, 1080px);
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
  /* Width comes from the drag handle now (inline style). The clamp stays as
     the pre-hydration and no-JS fallback, so the column is never 0 wide. */
  width: clamp(300px, 34%, 460px);
  flex: 0 0 auto;
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

/* ── The drag handle between chat and canvas ──
   Six pixels of hit area with a two-pixel grip: wide enough to grab without
   aiming, narrow enough not to read as a border. */
.fc-splitter {
  width: 0.5rem;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
}
.fc-splitter-grip {
  width: 2px;
  height: 2.5rem;
  border-radius: 9999px;
  background: rgb(212 212 216);
  transition: background-color 150ms, height 150ms;
}
.fc-splitter:hover .fc-splitter-grip,
.fc-splitter:focus-visible .fc-splitter-grip {
  background: var(--ui-primary, rgb(99 102 241));
  height: 4rem;
}
.fc-splitter:focus-visible { outline: none; }
.dark .fc-splitter-grip { background: rgb(63 63 70); }

/* ── The right rail ──
   A spine when shut, a column when open. Fixed widths rather than a second
   drag handle: two splitters on one screen is a layout the member has to
   maintain. */
.fc-rail {
  border-left: 1px solid rgb(228 228 231 / 0.7);
  background: rgb(255 255 255 / 0.55);
  transition: width 180ms ease;
  min-height: 0;
}
.dark .fc-rail {
  border-left-color: rgb(63 63 70 / 0.5);
  background: rgb(24 24 27 / 0.5);
}
.fc-pantry-input {
  width: 8rem;
  border: 1px dashed rgb(212 212 216);
  border-radius: 9999px;
  padding: 0.0625rem 0.5rem;
  font-size: 11px;
  background: transparent;
  color: inherit;
}
.fc-pantry-input:focus {
  outline: none;
  border-style: solid;
  border-color: rgb(16 185 129);
}
.dark .fc-pantry-input { border-color: rgb(63 63 70); }

.fc-rail-shut { width: 2.75rem; }
.fc-rail-open { width: 19rem; }
@media (max-width: 1024px) {
  /* Not enough room for three columns; the rail stays a spine and opens over
     the canvas rather than squeezing it to nothing. */
  .fc-rail-open { width: 15rem; }
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
.fc-md p { margin: 0 0 0.5em; line-height: 1.65; font-size: 0.9375rem; }
.fc-md p:last-child { margin-bottom: 0; }
.fc-md ul { list-style: disc; padding-left: 1.25rem; margin: 0.4em 0 0.6em; }
.fc-md ol { list-style: decimal; padding-left: 1.25rem; margin: 0.4em 0 0.6em; }
.fc-md li { margin: 0.2em 0; font-size: 0.9375rem; line-height: 1.6; }
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

/* The session-picker trigger is styled via `:ui.base` in the script (see
   SESSION_TRIGGER). It cannot be done here: the class Nuxt UI applies lands on
   the trigger itself, so `.fc-session-select button` selected a descendant
   that does not exist and the hit area never applied. */
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
