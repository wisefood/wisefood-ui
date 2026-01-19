<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const { t, locale } = useI18n()
const authStore = useAuthStore()

// Ensure auth is initialized on every page load
// This is critical for SSO to work across tabs/windows
onMounted(async () => {
  if (!authStore.initialized) {
    console.log('[App] Auth not initialized, initializing now...')
    await authStore.initialize()
  }
})

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
    { rel: 'apple-touch-icon', sizes: '96x96', href: '/favicon-96x96.png' },
    { rel: 'manifest', href: '/site.webmanifest' }
  ],
  htmlAttrs: {
    lang: computed(() => locale.value)
  }
})

useSeoMeta({
  title: t('meta.title'),
  description: t('meta.description'),
  ogTitle: t('meta.title'),
  ogDescription: t('meta.description'),
  ogType: 'website',
  ogImage: '/hero.png',
  ogImageWidth: '1536',
  ogImageHeight: '1024',
  ogImageAlt: 'WiseFood - AI-powered food and nutrition insights',
  ogSiteName: 'WiseFood',
  twitterCard: 'summary_large_image',
  twitterTitle: t('meta.title'),
  twitterDescription: t('meta.description'),
  twitterImage: '/hero.png',
  twitterImageAlt: 'WiseFood - AI-powered food and nutrition insights'
})
</script>