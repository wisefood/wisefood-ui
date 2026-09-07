<template>
  <div class="w-full max-w-lg text-center">
    <img
      src="/app/logo.png"
      alt="WiseFood"
      class="mx-auto h-20 w-auto"
      width="160"
      height="80"
    >

    <div class="mt-8 flex justify-center">
      <span
        class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300"
        aria-hidden="true"
      >
        <UIcon
          name="i-lucide-wrench"
          class="h-8 w-8"
        />
      </span>
    </div>

    <h1 class="mt-6 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
      {{ t('maintenance.title') }}
    </h1>
    <p class="mt-3 text-base leading-relaxed text-gray-600 dark:text-gray-300">
      {{ t('maintenance.body') }}
    </p>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {{ t('maintenance.reassurance') }}
    </p>

    <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <UButton
        color="primary"
        variant="solid"
        icon="i-lucide-refresh-cw"
        :loading="checking"
        @click="retry"
      >
        {{ t('maintenance.retry') }}
      </UButton>
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-log-in"
        to="/login"
      >
        {{ t('maintenance.adminSignIn') }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import systemApi from '~/services/systemApi'

/*
 * The closed sign.
 *
 * Deliberately free of the app shell: no header, no navigation, no feedback
 * widgets — every one of those would either 503 or invite a click that goes
 * nowhere. The retry button asks the API directly rather than reloading, so a
 * person who leaves this tab open finds their way back in the moment the
 * platform reopens, without a full page load that would flash the closed sign
 * again first.
 */
definePageMeta({
  layout: 'auth'
})

const { t } = useI18n()

useSeoMeta({
  title: () => t('maintenance.title'),
  robots: 'noindex'
})

const checking = ref(false)
const closed = useState<boolean | null>('platform-maintenance', () => null)

async function retry() {
  checking.value = true
  try {
    const info = await systemApi.getInfo()
    closed.value = Boolean(info?.maintenance)
    if (!closed.value) {
      await navigateTo('/')
    }
  } catch {
    // Still closed, or unreachable; either way the sign stays up.
  } finally {
    checking.value = false
  }
}
</script>
