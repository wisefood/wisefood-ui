<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { HelpClip } from '~/composables/useHelp'

/**
 * A short clip that loads nothing until asked.
 *
 * The poster is all that is fetched up front, and the video element only
 * exists after a click, so a help panel with six clips costs six small
 * images. The clip plays with controls and captions; it never starts by
 * itself, which also keeps it out of the way of reduced-motion settings.
 */
const props = defineProps<{
  clip: HelpClip
  label: string
}>()

const emit = defineEmits<{
  play: []
  failed: []
}>()

const { locale } = useI18n()
const playing = ref(false)

const durationLabel = computed(() => {
  const total = props.clip.duration
  if (!total || total <= 0) return ''
  const minutes = Math.floor(total / 60)
  const seconds = Math.round(total % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
})

function play() {
  playing.value = true
  emit('play')
}
</script>

<template>
  <div class="relative aspect-video overflow-hidden rounded-lg bg-gray-900 ring-1 ring-gray-200 dark:ring-white/10">
    <video
      v-if="playing"
      :src="clip.src"
      :poster="clip.poster"
      :aria-label="label"
      class="h-full w-full"
      controls
      autoplay
      playsinline
      preload="metadata"
      @error="emit('failed')"
    >
      <track
        v-if="clip.captions"
        kind="captions"
        :src="clip.captions"
        :srclang="locale"
        default
      >
    </video>

    <button
      v-else
      type="button"
      class="group absolute inset-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
      :aria-label="label"
      @click="play"
    >
      <img
        v-if="clip.poster"
        :src="clip.poster"
        alt=""
        loading="lazy"
        class="absolute inset-0 h-full w-full object-cover"
        @error="emit('failed')"
      >
      <span class="relative flex size-12 items-center justify-center rounded-full bg-white/95 text-brand-600 shadow-lg transition-transform group-hover:scale-105">
        <UIcon
          name="i-lucide-play"
          class="size-5 translate-x-px"
        />
      </span>
      <span
        v-if="durationLabel"
        class="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium tabular-nums text-white"
      >{{ durationLabel }}</span>
    </button>
  </div>
</template>
