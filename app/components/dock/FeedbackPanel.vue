<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import platformFeedbackApi from '~/services/platformFeedbackApi'

/**
 * The five-face rating form, without a container. The floating dock puts it
 * in a card on a desktop and in a bottom sheet on a phone. It asks to be
 * closed a couple of seconds after a rating goes in, and is unmounted when
 * the container closes, so the form is fresh every time it opens.
 */
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

const selected = ref<string | null>(null)
const comment = ref('')
const submitted = ref(false)

let closeTimer: ReturnType<typeof setTimeout> | null = null

// Five-point Likert scale, left → right, green → red.
// Class strings are written out in full so Tailwind keeps them in the build.
const faces = [
  {
    id: 'great',
    icon: 'i-lucide-laugh',
    labelKey: 'feedback.ratings.great',
    idle: 'text-green-500/60 hover:text-green-500 hover:bg-green-500/10',
    active: 'text-green-600 bg-green-500/15 ring-2 ring-green-500'
  },
  {
    id: 'good',
    icon: 'i-lucide-smile',
    labelKey: 'feedback.ratings.good',
    idle: 'text-lime-500/60 hover:text-lime-500 hover:bg-lime-500/10',
    active: 'text-lime-600 bg-lime-500/15 ring-2 ring-lime-500'
  },
  {
    id: 'ok',
    icon: 'i-lucide-meh',
    labelKey: 'feedback.ratings.ok',
    idle: 'text-amber-500/60 hover:text-amber-500 hover:bg-amber-500/10',
    active: 'text-amber-600 bg-amber-500/15 ring-2 ring-amber-500'
  },
  {
    id: 'bad',
    icon: 'i-lucide-frown',
    labelKey: 'feedback.ratings.bad',
    idle: 'text-orange-500/60 hover:text-orange-500 hover:bg-orange-500/10',
    active: 'text-orange-600 bg-orange-500/15 ring-2 ring-orange-500'
  },
  {
    id: 'awful',
    icon: 'i-lucide-angry',
    labelKey: 'feedback.ratings.awful',
    idle: 'text-red-500/60 hover:text-red-500 hover:bg-red-500/10',
    active: 'text-red-600 bg-red-500/15 ring-2 ring-red-500'
  }
]

// The five faces, worst to best, as a number the reports can average. Stored
// alongside the label so a rename of the face never silently shifts the scale.
const RATING_SCORES: Record<string, number> = {
  awful: 1,
  bad: 2,
  ok: 3,
  good: 4,
  great: 5
}

async function submit() {
  if (!selected.value) {
    return
  }

  // Optimistic: the widget thanks them and closes either way. Someone who took
  // the trouble to rate the product should not be shown a network error for
  // their trouble — and the rating is not worth a retry loop.
  const rating = selected.value
  const text = comment.value.trim()
  submitted.value = true
  closeTimer = setTimeout(() => emit('close'), 2200)

  try {
    await platformFeedbackApi.submit({
      rating_kind: 'likert5',
      rating_value: rating,
      rating_value_num: RATING_SCORES[rating],
      comment: text || undefined,
      target_type: 'platform',
      target_id: typeof window !== 'undefined' ? window.location.pathname : undefined
    })
  } catch {
    // Until this shipped, every rating collected here went to the browser
    // console and nowhere else. A dropped one is no worse than that was.
  }
}

onBeforeUnmount(() => {
  if (closeTimer) clearTimeout(closeTimer)
})
</script>

<template>
  <div data-wf-dock>
    <!-- Form -->
    <template v-if="!submitted">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <UIcon
            name="i-lucide-smile"
            class="w-4 h-4 text-brand-500"
          />
          {{ t('feedback.title') }}
        </h2>
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          icon="i-lucide-x"
          class="pointer-coarse:min-h-11 pointer-coarse:min-w-11 justify-center"
          :aria-label="t('feedback.close')"
          @click="$emit('close')"
        />
      </div>

      <!-- Likert faces -->
      <div class="flex items-center justify-between gap-1 mb-4">
        <button
          v-for="face in faces"
          :key="face.id"
          type="button"
          class="flex-1 aspect-square min-h-11 rounded-lg flex items-center justify-center transition-colors"
          :class="selected === face.id ? face.active : face.idle"
          :aria-label="t(face.labelKey)"
          :title="t(face.labelKey)"
          :aria-pressed="selected === face.id"
          @click="selected = face.id"
        >
          <UIcon
            :name="face.icon"
            class="w-7 h-7"
          />
        </button>
      </div>

      <!-- Optional comment -->
      <UTextarea
        v-model="comment"
        :rows="3"
        :placeholder="t('feedback.commentPlaceholder')"
        class="w-full mb-4"
        :ui="{ base: 'resize-none' }"
      />

      <UButton
        block
        color="primary"
        size="sm"
        icon="i-lucide-send"
        class="min-h-11"
        :disabled="!selected"
        @click="submit"
      >
        {{ t('feedback.submit') }}
      </UButton>
    </template>

    <!-- Inline thank-you -->
    <div
      v-else
      class="flex flex-col items-center text-center py-6 px-2"
    >
      <div class="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center mb-3">
        <UIcon
          name="i-lucide-check"
          class="w-6 h-6 text-green-600"
        />
      </div>
      <p class="text-sm font-semibold text-gray-900 dark:text-white">
        {{ t('feedback.thanks') }}
      </p>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {{ t('feedback.thanksSub') }}
      </p>
    </div>
  </div>
</template>
