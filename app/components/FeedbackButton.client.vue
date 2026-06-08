<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onClickOutside } from '@vueuse/core'

const { t } = useI18n()

const isOpen = ref(false)
const panel = ref<HTMLElement | null>(null)
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

function resetForm() {
  selected.value = null
  comment.value = ''
  submitted.value = false
}

function close() {
  isOpen.value = false
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  // Reset after the leave transition has played out.
  setTimeout(resetForm, 200)
}

function toggle() {
  if (isOpen.value) {
    close()
  } else {
    isOpen.value = true
  }
}

function submit() {
  if (!selected.value) {
    return
  }

  // Mock submission — no backend yet. Just log what we'd send.
  console.info('[feedback] mock submit', {
    rating: selected.value,
    comment: comment.value.trim()
  })

  submitted.value = true
  closeTimer = setTimeout(close, 2200)
}

onClickOutside(panel, () => {
  if (isOpen.value) {
    close()
  }
})
</script>

<template>
  <div class="feedback-root">
    <UButton
      :aria-label="t('feedback.open')"
      :title="t('feedback.open')"
      color="primary"
      variant="solid"
      icon="i-lucide-smile"
      size="lg"
      class="fixed bottom-24 right-5 z-[140] rounded-full shadow-lg shadow-brand-500/25 hover:shadow-brand-500/35 hover:scale-105 transition-transform"
      @click="toggle"
    />

    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="isOpen"
        ref="panel"
        role="dialog"
        :aria-label="t('feedback.title')"
        class="fixed bottom-40 right-5 z-[140] w-80 max-w-[calc(100vw-3rem)] rounded-xl shadow-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-800 p-5"
      >
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
              color="gray"
              size="xs"
              icon="i-lucide-x"
              :aria-label="t('feedback.close')"
              @click="close"
            />
          </div>

          <!-- Likert faces -->
          <div class="flex items-center justify-between gap-1 mb-4">
            <button
              v-for="face in faces"
              :key="face.id"
              type="button"
              class="flex-1 aspect-square rounded-lg flex items-center justify-center transition-colors"
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
    </Transition>
  </div>
</template>
