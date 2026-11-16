<template>
  <nav aria-label="Parts of this visit">
    <p class="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
      In this visit
    </p>
    <ol class="space-y-0.5">
      <li
        v-for="chapter in chapters"
        :key="chapter.id"
      >
        <button
          type="button"
          class="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          :class="active === chapter.id
            ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'"
          :aria-current="active === chapter.id ? 'step' : undefined"
          @click="emit('select', chapter.id)"
        >
          <UIcon
            :name="productOf(chapter.product).icon"
            class="mt-0.5 h-4 w-4 shrink-0 opacity-70"
          />
          <span class="min-w-0 flex-1">
            <span class="block truncate">{{ titles[chapter.id] }}</span>
            <span class="block text-xs text-gray-400 dark:text-gray-500">
              {{ formatOffset(chapter.offset_seconds) }}<template v-if="chapterFacts(chapter).length">
                · {{ chapterFacts(chapter)[0] }}
              </template>
            </span>
          </span>
          <!-- Red for something said or broken, amber for friction: the same
               marks the chapter carries, so the outline is where to look first. -->
          <span class="mt-1 flex shrink-0 gap-1">
            <span
              v-for="flag in troubleFlags(chapter.counts).filter(f => f.tone !== 'good').slice(0, 3)"
              :key="flag.key"
              class="h-2 w-2 rounded-full"
              :class="flag.tone === 'bad' ? 'bg-red-500' : 'bg-amber-400'"
              :title="flag.label"
            />
          </span>
        </button>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import type { StoryChapter } from '~/services/insightsApi'
import { chapterFacts, formatOffset, productOf, troubleFlags } from '~/utils/sessionStory'

/** The chapters of a visit, to jump between — the story's table of contents. */

defineProps<{
  chapters: StoryChapter[]
  titles: Record<number, string>
  active: number | null
}>()

const emit = defineEmits<{ select: [id: number] }>()
</script>
