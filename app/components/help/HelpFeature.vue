<script setup lang="ts">
import { computed, ref } from 'vue'
import type { HelpFeatureDef, HelpFeatureText, HelpUiText } from '~/help/types'
import { useHelpClip } from '~/composables/useHelp'

/**
 * One thing a person can do on the page: a title they can scan, and behind
 * it a sentence, an optional clip, numbered steps and a "Show me" that runs
 * the guided tour on the page itself.
 */
const props = defineProps<{
  def: HelpFeatureDef
  text: HelpFeatureText
  ui: HelpUiText
  expanded: boolean
  /** The tour can run: Flows is up and the feature's page is reachable. */
  canTour: boolean
  starting: boolean
}>()

const emit = defineEmits<{
  'toggle': []
  'show-me': []
  'video-play': []
}>()

const clipFor = useHelpClip()
const videoFailed = ref(false)
const clip = computed(() => (videoFailed.value ? null : clipFor(props.def.video)))
const panelId = computed(() => `help-feature-${props.def.id}`)
</script>

<template>
  <section
    :id="`${panelId}-root`"
    class="rounded-xl ring-1 transition-colors"
    :class="expanded ? 'bg-white ring-gray-200 dark:bg-white/5 dark:ring-white/10' : 'ring-transparent hover:bg-gray-50 dark:hover:bg-white/5'"
  >
    <h3>
      <button
        type="button"
        class="flex w-full min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        :aria-expanded="expanded"
        :aria-controls="panelId"
        @click="emit('toggle')"
      >
        <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
          <UIcon
            :name="def.icon"
            class="size-4"
          />
        </span>
        <span class="min-w-0 flex-1 text-sm font-semibold text-gray-900 dark:text-white">
          <HelpText :text="text.title" />
        </span>
        <UIcon
          v-if="clip"
          name="i-lucide-circle-play"
          class="size-4 shrink-0 text-brand-500"
          :aria-label="ui.watch"
        />
        <UIcon
          name="i-lucide-chevron-down"
          class="size-4 shrink-0 text-gray-400 transition-transform"
          :class="expanded ? 'rotate-180' : ''"
        />
      </button>
    </h3>

    <div
      v-show="expanded"
      :id="panelId"
      class="space-y-3 px-3 pb-3"
    >
      <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        <HelpText :text="text.body" />
      </p>

      <HelpVideo
        v-if="clip && expanded"
        :clip="clip"
        :label="ui.videoLabel.replace('{title}', text.title.replace(/\[\[=?|\]\]/g, ''))"
        @play="emit('video-play')"
        @failed="videoFailed = true"
      />

      <ol class="space-y-2">
        <li
          v-for="(step, index) in text.steps"
          :key="index"
          class="flex gap-2.5 text-sm leading-relaxed text-gray-700 dark:text-gray-200"
        >
          <span
            class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[0.7rem] font-semibold text-white dark:bg-white dark:text-gray-900"
            aria-hidden="true"
          >{{ index + 1 }}</span>
          <span class="min-w-0"><HelpText :text="step" /></span>
        </li>
      </ol>

      <p
        v-if="text.note"
        class="flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"
      >
        <UIcon
          name="i-lucide-info"
          class="mt-0.5 size-3.5 shrink-0"
        />
        <span><HelpText :text="text.note" /></span>
      </p>

      <UButton
        v-if="def.tour && canTour"
        size="sm"
        color="primary"
        variant="soft"
        icon="i-lucide-mouse-pointer-click"
        :loading="starting"
        @click="emit('show-me')"
      >
        {{ ui.showMe }}
      </UButton>
    </div>
  </section>
</template>
