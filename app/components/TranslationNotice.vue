<template>
  <div>
    <!-- The notice implements both halves of WF-11's acceptance criteria at
         once: it is the explicit "available in English only" marker, and it is
         where the reader asks for the translation. Shown only when the app is
         in a language this content is not written in, so an English reader
         never sees it. -->
    <div
      v-if="showNotice"
      class="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs dark:border-amber-900/40 dark:bg-amber-900/15"
    >
      <UIcon
        name="i-lucide-languages"
        class="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
      />
      <span class="text-amber-900 dark:text-amber-200">
        {{ isActive ? t('common.translation.machineTranslated') : t('common.translation.englishOnly') }}
      </span>

      <template v-if="!isActive && !confirming">
        <button
          :disabled="isLoading"
          class="ml-auto rounded-md border border-amber-300 px-2 py-1 font-medium text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-50 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-900/30"
          @click="onTranslate"
        >
          {{ isLoading ? t('common.translation.translating') : t('common.translation.translate') }}
        </button>
      </template>

      <!-- First use only: the reader confirms once, having been told where the
           text goes, and the answer is remembered. Afterwards Translate acts
           immediately. -->
      <template v-else-if="confirming">
        <button
          class="ml-auto rounded-md bg-amber-600 px-2 py-1 font-medium text-white transition-colors hover:bg-amber-700"
          @click="onConfirm"
        >
          {{ t('common.translation.confirm') }}
        </button>
        <button
          class="rounded-md border border-amber-300 px-2 py-1 font-medium text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-900/30"
          @click="confirming = false"
        >
          {{ t('common.translation.cancel') }}
        </button>
      </template>
      <button
        v-else
        class="ml-auto rounded-md border border-amber-300 px-2 py-1 font-medium text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-900/30"
        @click="showOriginal"
      >
        {{ t('common.translation.showOriginal') }}
      </button>

      <p class="w-full text-[0.6875rem] text-amber-700/80 dark:text-amber-300/70">
        {{ t('common.translation.provider') }}
      </p>
    </div>

    <p
      v-if="hasFailed"
      class="mb-4 text-xs text-zinc-500 dark:text-zinc-400"
    >
      {{ t('common.translation.unavailable') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGoogleTranslate, TRANSLATABLE_LOCALES } from '~/composables/useGoogleTranslate'

const { t, locale } = useI18n()
const { isActive, isLoading, hasFailed, hasAcknowledged, refreshAck, acknowledge, translateTo, showOriginal } = useGoogleTranslate()

// Only offered for locales we actually ship an interface in — otherwise the
// notice would appear for a reader whose interface is already English.
const showNotice = computed(() =>
  (TRANSLATABLE_LOCALES as readonly string[]).includes(locale.value)
)

const confirming = ref(false)

onMounted(refreshAck)

const onTranslate = () => {
  // Asked once, then remembered. A reader who has already been told where the
  // text goes should not be re-prompted on every recipe.
  if (!hasAcknowledged.value) {
    confirming.value = true
    return
  }
  void translateTo(locale.value)
}

const onConfirm = () => {
  acknowledge()
  confirming.value = false
  void translateTo(locale.value)
}
</script>
