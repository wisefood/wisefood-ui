<template>
  <!-- Things FoodScholar noticed in the questions that could go on the
       profile. Consent-first: nothing is written until "Remember". -->
  <div
    class="flex flex-col gap-1.5"
    data-flows="foodscholar-qa-memory-nudges"
  >
    <div
      v-for="sug in suggestions"
      :key="sug.id"
      class="flex flex-col gap-1.5 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-200"
      :class="sug.kind === 'allergy_hint' ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-white/80 dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800'"
    >
      <template v-if="sug.already_known">
        <!-- Already on the profile: recognised, nothing to answer. -->
        <span class="flex items-start gap-2 text-xs font-light leading-snug">
          <UIcon
            name="i-lucide-check"
            class="w-3.5 h-3.5 shrink-0 mt-px text-green-500"
          />
          {{ sug.statement }}
        </span>
        <span class="self-start px-2.5 py-0.5 text-[0.6875rem] font-medium rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">{{ t('foodChatHome.chat.memory.alreadySaved') }}</span>
      </template>
      <template v-else-if="state[sug.id] !== 'accepted'">
        <span class="flex items-start gap-2 text-xs font-light leading-snug">
          <UIcon
            name="i-lucide-brain"
            class="w-3.5 h-3.5 shrink-0 mt-px"
            :class="sug.kind === 'allergy_hint' ? 'text-amber-500 dark:text-amber-400' : 'text-brand-500 dark:text-brand-300'"
          />
          {{ sug.statement }}
        </span>
        <!-- It changes what the profile says: show what is there now. -->
        <span
          v-if="sug.contradicts?.length"
          class="flex items-start gap-1.5 pl-5.5 text-[0.6875rem] leading-snug text-amber-700 dark:text-amber-300"
          data-flows="foodscholar-qa-memory-contradicts"
        >
          <UIcon
            name="i-lucide-triangle-alert"
            class="w-3 h-3 shrink-0 mt-px"
          />
          {{ t('foodScholarHome.qa.memory.contradicts', { values: profileValues(sug.contradicts) }) }}
        </span>
        <span class="flex items-center gap-1.5 pl-5.5">
          <button
            type="button"
            class="inline-flex items-center min-h-7 px-2.5 py-1 text-[0.6875rem] font-medium rounded-full bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
            :disabled="state[sug.id] === 'pending'"
            @click="emit('decide', sug, 'accept')"
          >
            <UIcon
              v-if="state[sug.id] === 'pending'"
              name="i-lucide-loader-2"
              class="w-3 h-3 animate-spin"
            />
            <template v-else>{{ t('foodChatHome.chat.memory.remember') }}</template>
          </button>
          <button
            type="button"
            class="inline-flex items-center min-h-7 px-2.5 py-1 text-[0.6875rem] rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            :disabled="state[sug.id] === 'pending'"
            @click="emit('decide', sug, 'decline')"
          >{{ t('foodChatHome.chat.memory.noThanks') }}</button>
        </span>
      </template>
      <span
        v-else
        class="flex items-start gap-2 text-xs font-light leading-snug"
      >
        <UIcon
          name="i-lucide-check"
          class="w-3.5 h-3.5 shrink-0 mt-px text-green-500"
        />
        {{ t('foodChatHome.chat.memory.saved') }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { QaMemorySuggestion } from '~/services/foodscholarApi'

defineProps<{
  suggestions: QaMemorySuggestion[]
  state: Record<string, 'pending' | 'accepted' | 'declined'>
}>()

const emit = defineEmits<{
  decide: [suggestion: QaMemorySuggestion, decision: 'accept' | 'decline']
}>()

const { t } = useI18n()

/** "lacto_ovo_vegetarian" as a reader writes it. */
const profileValues = (values: string[]): string =>
  values.map(v => v.replace(/_/g, ' ')).join(', ')
</script>
