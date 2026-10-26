<!--
  Where a reminder's "Turn off these reminders" link lands.

  No account and no session: the person may be reading the mail on a phone
  that has never signed in, and the random token in the link is the only
  credential the gateway needs. Nothing happens on page load — link scanners
  and mail-client prefetchers open every URL in a message, and must not
  unsubscribe anybody by doing so — so turning reminders off is one button,
  and turning them back on is the same page.

  The page speaks the mail's language (`?lang=` from the link), so a
  Slovenian reminder does not lead to an English page.
-->
<template>
  <div class="mx-auto w-full max-w-lg px-4 py-6 sm:py-14">
    <div class="mb-8 flex items-center justify-between gap-4">
      <img
        src="/logo.png"
        alt="WiseFood"
        class="h-9 w-auto"
        width="72"
        height="36"
      >
    </div>

    <div class="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-white/10 dark:bg-zinc-900 sm:p-10">
      <UIcon
        :name="view.icon"
        class="mx-auto h-9 w-9"
        :class="view.iconClass"
      />
      <h1 class="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
        {{ view.title }}
      </h1>
      <p class="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
        {{ view.body }}
      </p>

      <UAlert
        v-if="failed"
        class="mt-5 text-left"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :description="t('unsubscribe.failed')"
      />

      <div class="mt-7 flex flex-col items-center gap-3">
        <UButton
          v-if="state === 'ask'"
          color="primary"
          size="lg"
          icon="i-lucide-bell-off"
          :loading="working"
          data-testid="unsubscribe-confirm"
          @click="turnOff"
        >
          {{ t('unsubscribe.confirm') }}
        </UButton>
        <UButton
          v-else-if="state === 'off'"
          color="neutral"
          variant="outline"
          icon="i-lucide-bell-ring"
          :loading="working"
          data-testid="unsubscribe-undo"
          @click="turnOn"
        >
          {{ t('unsubscribe.undo') }}
        </UButton>

        <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
          <NuxtLink
            to="/dashboard"
            class="text-primary hover:underline"
          >
            {{ t('unsubscribe.openApp') }}
          </NuxtLink>
          <NuxtLink
            to="/my-profile"
            class="text-gray-500 hover:underline dark:text-gray-400"
          >
            {{ t('unsubscribe.manage') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import notificationsApi from '~/services/notificationsApi'

definePageMeta({
  layout: 'auth'
})

const { t, locale, availableLocales } = useI18n()
const route = useRoute()

const token = String(route.query.token ?? '').trim()
type State = 'ask' | 'off' | 'on' | 'invalid' | 'preview'
const state = ref<State>(!token ? 'invalid' : token === 'preview' ? 'preview' : 'ask')
const working = ref(false)
const failed = ref(false)

useHead({
  title: computed(() => t('unsubscribe.pageTitle')),
  meta: [
    { name: 'robots', content: 'noindex, nofollow, noarchive' },
    { name: 'referrer', content: 'no-referrer' }
  ]
})

onMounted(() => {
  const lang = String(route.query.lang ?? '')
  if (lang && availableLocales.includes(lang)) locale.value = lang
})

const view = computed(() => {
  switch (state.value) {
    case 'off':
      return { icon: 'i-lucide-bell-off', iconClass: 'text-brandg-500', title: t('unsubscribe.doneTitle'), body: t('unsubscribe.doneBody') }
    case 'on':
      return { icon: 'i-lucide-bell-ring', iconClass: 'text-brand-500', title: t('unsubscribe.resubscribedTitle'), body: t('unsubscribe.resubscribedBody') }
    case 'invalid':
      return { icon: 'i-lucide-link-2-off', iconClass: 'text-gray-300 dark:text-gray-600', title: t('unsubscribe.invalidTitle'), body: t('unsubscribe.invalidBody') }
    case 'preview':
      return { icon: 'i-lucide-flask-conical', iconClass: 'text-amber-500', title: t('unsubscribe.previewTitle'), body: t('unsubscribe.previewBody') }
    default:
      return { icon: 'i-lucide-mail', iconClass: 'text-brand-500', title: t('unsubscribe.title'), body: t('unsubscribe.body') }
  }
})

async function turnOff() {
  working.value = true
  failed.value = false
  const result = await notificationsApi.unsubscribe(token)
  working.value = false
  if (!result) {
    failed.value = true
    return
  }
  state.value = result.preview ? 'preview' : result.unsubscribed ? 'off' : 'invalid'
}

async function turnOn() {
  working.value = true
  failed.value = false
  const result = await notificationsApi.resubscribe(token)
  working.value = false
  if (!result) {
    failed.value = true
    return
  }
  state.value = result.subscribed ? 'on' : 'invalid'
}
</script>
