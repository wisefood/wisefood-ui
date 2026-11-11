<template>
  <div
    class="qa-tool-panel"
    :data-flows="`foodscholar-qa-tool-${tool}`"
  >
    <div class="flex items-center justify-between gap-2 px-1">
      <p class="text-sm font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2 min-w-0">
        <UIcon
          :name="meta.icon"
          class="w-4 h-4 shrink-0 text-brand-600 dark:text-brand-400"
        />
        <span class="truncate">{{ meta.title }}</span>
      </p>
      <button
        type="button"
        class="shrink-0 inline-flex items-center justify-center w-9 h-9 -mr-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
        :aria-label="t('foodScholarLearn.tools.close')"
        @click="emit('close')"
      >
        <UIcon
          name="i-lucide-x"
          class="w-4 h-4"
        />
      </button>
    </div>

    <!-- Claims to check -->
    <template v-if="tool === 'claim'">
      <ul class="mt-2">
        <li
          v-for="claim in claims"
          :key="claim"
        >
          <button
            type="button"
            class="qa-tool-row"
            @click="emit('use', claim, 'claim')"
          >
            <UIcon
              name="i-lucide-search-check"
              class="w-4 h-4 shrink-0 text-gray-400"
            />
            <span class="flex-1 min-w-0">{{ claim }}</span>
            <UIcon
              name="i-lucide-arrow-up-left"
              class="w-4 h-4 shrink-0 text-gray-400 qa-tool-row-use"
            />
          </button>
        </li>
      </ul>
      <button
        type="button"
        class="mt-1 ml-1 min-h-10 px-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
        @click="shuffleClaims"
      >
        <UIcon
          name="i-lucide-shuffle"
          class="w-4 h-4"
        />
        {{ t('foodScholarLearn.tools.shuffle') }}
      </button>
    </template>

    <!-- Everyday questions: FoodScholar's own suggestions, then by topic -->
    <template v-else-if="tool === 'everyday'">
      <div
        v-if="suggested.length"
        class="mt-2"
      >
        <p class="px-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {{ t('foodScholarLearn.tools.suggestedTitle') }}
        </p>
        <ul class="mt-1">
          <li
            v-for="question in suggested.slice(0, 4)"
            :key="question"
          >
            <button
              type="button"
              class="qa-tool-row"
              @click="emit('use', question, 'question')"
            >
              <UIcon
                name="i-lucide-sparkles"
                class="w-4 h-4 shrink-0 text-gray-400"
              />
              <span class="flex-1 min-w-0">{{ question }}</span>
              <UIcon
                name="i-lucide-arrow-up-left"
                class="w-4 h-4 shrink-0 text-gray-400 qa-tool-row-use"
              />
            </button>
          </li>
        </ul>
      </div>
      <!-- Topics: one at a time on a phone (chips), all at once wider. -->
      <div class="mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1 qa-tool-chips">
        <button
          v-for="topic in EVERYDAY_TOPICS"
          :key="topic.id"
          type="button"
          :class="['shrink-0 inline-flex items-center gap-1.5 min-h-9 px-3 rounded-full border text-sm transition-colors', topicId === topic.id ? 'border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-900/30 dark:text-brand-300' : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-zinc-700 dark:text-zinc-300']"
          @click="topicId = topic.id"
        >
          <UIcon
            :name="topic.icon"
            class="w-4 h-4"
          />
          {{ topic.title }}
        </button>
      </div>
      <ul class="mt-1">
        <li
          v-for="question in currentTopic.questions"
          :key="question"
        >
          <button
            type="button"
            class="qa-tool-row"
            @click="emit('use', question, 'question')"
          >
            <UIcon
              name="i-lucide-message-circle-question"
              class="w-4 h-4 shrink-0 text-gray-400"
            />
            <span class="flex-1 min-w-0">{{ question }}</span>
            <UIcon
              name="i-lucide-arrow-up-left"
              class="w-4 h-4 shrink-0 text-gray-400 qa-tool-row-use"
            />
          </button>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { COMMON_MYTHS, EVERYDAY_TOPICS } from '~/data/qaSuggestions'
import type { ComposerTool } from '~/utils/claimCheck'

/**
 * The panel under FoodScholar's question box: a short list of things to try.
 * Picking one puts it in the box (`use`); nothing is sent until the reader
 * sends it. Rows are full width and finger-sized for phones.
 */
const props = withDefaults(defineProps<{
  tool: ComposerTool
  /** FoodScholar's generated starter questions, in the reader's language. */
  suggested?: string[]
}>(), { suggested: () => [] })

const emit = defineEmits<{
  use: [text: string, mode: 'claim' | 'question']
  close: []
}>()

const { t } = useI18n()

const meta = computed(() => ({
  claim: { icon: 'i-lucide-search-check', title: t('foodScholarLearn.tools.claimTitle') },
  everyday: { icon: 'i-lucide-utensils', title: t('foodScholarLearn.tools.everydayTitle') }
}[props.tool]))

function pick<T>(list: T[], n: number): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = copy[i] as T
    copy[i] = copy[j] as T
    copy[j] = tmp
  }
  return copy.slice(0, n)
}

const claims = ref<string[]>(pick(COMMON_MYTHS, 4))
function shuffleClaims() {
  const current = new Set(claims.value)
  const rest = COMMON_MYTHS.filter(c => !current.has(c))
  claims.value = pick(rest.length >= 4 ? rest : COMMON_MYTHS, 4)
}

const topicId = ref(EVERYDAY_TOPICS[0]?.id ?? '')
const currentTopic = computed(() => EVERYDAY_TOPICS.find(x => x.id === topicId.value) ?? EVERYDAY_TOPICS[0]!)
</script>

<style scoped>
.qa-tool-panel {
  margin-top: 0.75rem;
  padding: 0.75rem;
  border-radius: 1.25rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
}

.dark .qa-tool-panel {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(30, 30, 33, 0.85);
}

.qa-tool-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 2.75rem;
  padding: 0.5rem 0.625rem;
  border-radius: 0.75rem;
  text-align: left;
  font-size: 0.9375rem;
  line-height: 1.35;
  color: rgb(55 65 81);
  transition: background-color 0.15s ease;
}

.qa-tool-row:hover,
.qa-tool-row:focus-visible {
  background: rgba(0, 0, 0, 0.04);
}

.dark .qa-tool-row {
  color: rgb(228 228 231);
}

.dark .qa-tool-row:hover,
.dark .qa-tool-row:focus-visible {
  background: rgba(255, 255, 255, 0.06);
}

.qa-tool-row-use {
  opacity: 0.6;
}

.qa-tool-chips {
  scrollbar-width: none;
}

.qa-tool-chips::-webkit-scrollbar {
  display: none;
}
</style>
