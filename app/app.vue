<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
    { rel: 'apple-touch-icon', sizes: '96x96', href: '/favicon-96x96.png' },
    { rel: 'manifest', href: '/manifest.json' }
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