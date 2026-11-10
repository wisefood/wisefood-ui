<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { HelpClip } from '~/composables/useHelp'
import type { HelpUiText } from '~/help/types'

/**
 * A help clip, full screen, with our own controls.
 *
 * - **It fits.** The frame takes the clip's shape and is as large as the
 *   screen allows: a desktop recording fills a laptop or a phone on its side,
 *   a portrait phone recording fills a phone held upright. Nothing is cropped
 *   and nothing letterboxes inside the frame.
 * - **Thumb-sized.** Every control is 44px; the scrubber is a 44px strip you
 *   can drag. Tapping the picture pauses and plays.
 * - **Short screens.** On a phone on its side the title row folds away and
 *   closing moves to a corner, so the clip keeps the height.
 * - **Above everything.** It is a Nuxt UI modal, so it stacks above the help
 *   sheet on phones (also a dialog) instead of fighting its focus trap; Escape
 *   closes the clip and leaves the sheet open. `z-[60]` puts it above the
 *   docked desktop panel (`z-40`) and the citation peeks (`z-50`).
 *
 * Clips are silent, so they start muted: that is what lets them start by
 * themselves on iOS. Space or K plays and pauses, the arrows skip 5 seconds.
 */
const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  clip: HelpClip
  label: string
  ui: HelpUiText['player']
}>()

const emit = defineEmits<{
  failed: []
}>()

const { locale } = useI18n()

const video = ref<HTMLVideoElement | null>(null)
const track = ref<HTMLElement | null>(null)
const playing = ref(false)
const ended = ref(false)
const waiting = ref(true)
const current = ref(0)
const total = ref(props.clip.duration ?? 0)
const scrubbing = ref(false)
let resumeAfterScrub = false

watch(open, (isOpen) => {
  if (!isOpen) return
  playing.value = false
  ended.value = false
  waiting.value = true
  current.value = 0
  total.value = props.clip.duration ?? 0
})

const ratio = computed(() => {
  const { width, height } = props.clip
  return width && height ? width / height : 16 / 9
})

/** As wide as the stage, unless the screen's height runs out first. */
const frameStyle = computed(() => ({
  aspectRatio: String(ratio.value),
  width: `min(100%, calc((100dvh - var(--wf-player-chrome)) * ${ratio.value.toFixed(4)}))`
}))

const progress = computed(() => (total.value > 0 ? Math.min(100, (current.value / total.value) * 100) : 0))

function fmt(seconds: number): string {
  const s = Math.max(0, Math.round(seconds || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function toggle() {
  const v = video.value
  if (!v) return
  if (v.paused || v.ended) {
    if (v.ended) v.currentTime = 0
    void v.play().catch(() => {})
  } else {
    v.pause()
  }
}

function seekTo(seconds: number) {
  const v = video.value
  if (!v || !(total.value > 0)) return
  v.currentTime = Math.min(Math.max(seconds, 0), total.value)
  current.value = v.currentTime
  if (seconds < total.value) ended.value = false
}

function onTime() {
  if (!scrubbing.value && video.value) current.value = video.value.currentTime
}

function onMeta() {
  const d = video.value?.duration
  if (d && Number.isFinite(d)) total.value = d
}

function onEnded() {
  playing.value = false
  ended.value = true
}

function timeAt(clientX: number): number {
  const rect = track.value?.getBoundingClientRect()
  if (!rect || rect.width === 0) return current.value
  return ((clientX - rect.left) / rect.width) * total.value
}

function scrubStart(event: PointerEvent) {
  if (!(total.value > 0) || !video.value) return
  scrubbing.value = true
  resumeAfterScrub = !video.value.paused
  video.value.pause()
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  seekTo(timeAt(event.clientX))
}

function scrubMove(event: PointerEvent) {
  if (scrubbing.value) seekTo(timeAt(event.clientX))
}

function scrubEnd() {
  if (!scrubbing.value) return
  scrubbing.value = false
  if (resumeAfterScrub) void video.value?.play().catch(() => {})
}

function onKey(event: KeyboardEvent) {
  const onButton = (event.target as HTMLElement | null)?.closest('button')
  switch (event.key) {
    case ' ':
    case 'k':
    case 'K':
      // A focused button already answers Space with a click.
      if (onButton && event.key === ' ') return
      toggle()
      break
    case 'ArrowLeft':
      seekTo(current.value - 5)
      break
    case 'ArrowRight':
      seekTo(current.value + 5)
      break
    case 'Home':
      seekTo(0)
      break
    case 'End':
      seekTo(total.value)
      break
    default:
      return
  }
  event.preventDefault()
}
</script>

<template>
  <UModal
    v-model:open="open"
    fullscreen
    :title="label"
    :ui="{
      overlay: 'z-[60] bg-neutral-950/90',
      content: 'z-[60] bg-neutral-950 text-white divide-y-0'
    }"
  >
    <template #content>
      <div
        class="wf-player flex h-full w-full flex-col"
        @keydown="onKey"
      >
        <div class="wf-player-top flex items-center gap-2 px-3 pb-1 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-5">
          <p class="min-w-0 flex-1 truncate text-sm font-medium text-white/85">
            {{ label }}
          </p>
          <button
            type="button"
            class="flex size-11 shrink-0 items-center justify-center rounded-full bg-neutral-950/60 text-white/90 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            :aria-label="ui.close"
            @click="open = false"
          >
            <UIcon
              name="i-lucide-x"
              class="size-6"
            />
          </button>
        </div>

        <div class="flex min-h-0 flex-1 items-center justify-center px-2 sm:px-6">
          <div
            class="relative overflow-hidden rounded-lg bg-black shadow-2xl"
            :style="frameStyle"
          >
            <video
              ref="video"
              class="block h-full w-full object-contain"
              :src="clip.src"
              :poster="clip.poster"
              :crossorigin="clip.captions ? 'anonymous' : undefined"
              :aria-label="label"
              playsinline
              muted
              autoplay
              preload="auto"
              disablepictureinpicture
              @click="toggle"
              @play="playing = true; ended = false"
              @pause="playing = false"
              @ended="onEnded"
              @timeupdate="onTime"
              @loadedmetadata="onMeta"
              @waiting="waiting = true"
              @playing="waiting = false"
              @canplay="waiting = false"
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
              v-if="!playing && !waiting"
              type="button"
              class="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-brand-600 shadow-xl transition-transform active:scale-95"
              :aria-label="ended ? ui.replay : ui.play"
              @click="toggle"
            >
              <UIcon
                :name="ended ? 'i-lucide-rotate-ccw' : 'i-lucide-play'"
                class="size-7"
                :class="ended ? '' : 'translate-x-0.5'"
              />
            </button>
            <span
              v-else-if="waiting"
              class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <UIcon
                name="i-lucide-loader-circle"
                class="size-9 animate-spin text-white/80"
              />
            </span>
          </div>
        </div>

        <div class="wf-player-controls flex items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:gap-3 sm:px-5">
          <button
            type="button"
            class="flex size-11 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            :aria-label="playing ? ui.pause : (ended ? ui.replay : ui.play)"
            @click="toggle"
          >
            <UIcon
              :name="playing ? 'i-lucide-pause' : (ended ? 'i-lucide-rotate-ccw' : 'i-lucide-play')"
              class="size-6"
            />
          </button>
          <span class="w-9 shrink-0 text-right text-xs tabular-nums text-white/80">{{ fmt(current) }}</span>
          <div
            ref="track"
            class="group relative h-11 min-w-0 flex-1 cursor-pointer touch-none select-none focus-visible:outline-none"
            role="slider"
            tabindex="0"
            :aria-label="ui.position"
            aria-valuemin="0"
            :aria-valuemax="Math.round(total)"
            :aria-valuenow="Math.round(current)"
            :aria-valuetext="`${fmt(current)} / ${fmt(total)}`"
            @pointerdown="scrubStart"
            @pointermove="scrubMove"
            @pointerup="scrubEnd"
            @pointercancel="scrubEnd"
          >
            <span class="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/25 group-focus-visible:ring-2 group-focus-visible:ring-white">
              <span
                class="block h-full rounded-full bg-brand-500"
                :style="{ width: `${progress}%` }"
              />
            </span>
            <span
              class="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-transform group-active:scale-125"
              :style="{ left: `${progress}%` }"
            />
          </div>
          <span class="w-9 shrink-0 text-xs tabular-nums text-white/60">{{ fmt(total) }}</span>
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
/* The height the title row and the controls take; the frame gets the rest. */
.wf-player {
  --wf-player-chrome: 8.25rem;
}

/* A phone on its side: fold the title row away and put closing in a corner. */
@media (max-height: 520px) {
  .wf-player {
    --wf-player-chrome: 3.75rem;
    position: relative;
  }

  .wf-player-top {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 10;
    padding: max(0.25rem, env(safe-area-inset-top)) max(0.25rem, env(safe-area-inset-right)) 0 0;
  }

  .wf-player-top p {
    display: none;
  }

  .wf-player-controls {
    padding-top: 0.25rem;
  }
}
</style>
