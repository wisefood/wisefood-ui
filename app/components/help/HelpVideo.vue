<script setup lang="ts">
import { computed, ref } from 'vue'
import type { HelpClip } from '~/composables/useHelp'
import type { HelpUiText } from '~/help/types'

/**
 * A short clip in the help panel: a poster that loads nothing else until
 * pressed, then the clip full screen in `HelpVideoPlayer`.
 *
 * The poster keeps the clip's own shape, so a 16:9 desktop recording fills
 * the panel's width and a portrait phone recording stands upright in the
 * sheet, neither of them cropped. Played in place, a 1080p recording of a
 * whole page is too small to read in a 26rem panel; full screen it is not.
 */
const props = defineProps<{
  clip: HelpClip
  label: string
  ui: HelpUiText
}>()

const emit = defineEmits<{
  play: []
  failed: []
}>()

const open = ref(false)

const ratio = computed(() => {
  const { width, height } = props.clip
  return width && height ? width / height : 16 / 9
})
const portrait = computed(() => ratio.value < 1)

const durationLabel = computed(() => {
  const total = props.clip.duration
  if (!total || total <= 0) return ''
  const minutes = Math.floor(total / 60)
  const seconds = Math.round(total % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
})

function play() {
  open.value = true
  emit('play')
}

function failed() {
  open.value = false
  emit('failed')
}
</script>

<template>
  <div>
    <button
      type="button"
      class="group relative block overflow-hidden rounded-lg bg-gray-900 ring-1 ring-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:ring-white/10"
      :class="portrait ? 'mx-auto h-[min(22rem,50dvh)]' : 'w-full'"
      :style="{ aspectRatio: String(ratio) }"
      :aria-label="label"
      aria-haspopup="dialog"
      @click="play"
    >
      <img
        v-if="clip.poster"
        :src="clip.poster"
        alt=""
        loading="lazy"
        class="absolute inset-0 h-full w-full object-contain"
        @error="emit('failed')"
      >
      <span class="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      <span class="absolute inset-0 flex items-center justify-center">
        <span class="flex size-14 items-center justify-center rounded-full bg-white/95 text-brand-600 shadow-lg transition-transform group-hover:scale-105 group-active:scale-95">
          <UIcon
            name="i-lucide-play"
            class="size-6 translate-x-px"
          />
        </span>
      </span>
      <span class="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 text-xs font-medium text-white">
        <span class="flex items-center gap-1.5 rounded bg-black/60 px-1.5 py-0.5">
          <UIcon
            name="i-lucide-maximize-2"
            class="size-3"
          />
          {{ ui.watch }}
        </span>
        <span
          v-if="durationLabel"
          class="rounded bg-black/60 px-1.5 py-0.5 tabular-nums"
        >{{ durationLabel }}</span>
      </span>
    </button>

    <HelpVideoPlayer
      v-model:open="open"
      :clip="clip"
      :label="label"
      :ui="ui.player"
      @failed="failed"
    />
  </div>
</template>
