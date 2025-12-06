<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink to="/">
          <AppLogo class="w-auto h-10 shrink-0" />
        </NuxtLink>
        <TemplateMenu />
      </template>
      <template #right>
        <UColorModeButton />
        <!-- Simple locale switcher -->
        <USelect 
          v-model="currentLocale" 
          :items="locales"
          value-key="code"
          label-key="name"
          class="w-48" 
        />
        <UButton
          color="primary"
          variant="solid"
          trailing-icon="i-lucide-lock"
          class="shadow-xl shadow-brand-500/20 hover:shadow-2xl text-white hover:shadow-brand-500/30 transition-shadow cursor-pointer"
        >
          {{ $t('nav.signIn') }} 
        </UButton>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter class="bg-neutral-300 dark:bg-zinc-800">
      <template #left>
        <p class="text-sm text-muted">
          © 2025 The WiseFood Consortium, All rights reserved.
        </p>
        <span class="mx-2 text-sm text-muted">
          <NuxtLink to="https://cordis.europa.eu/project/id/101181895" target="_blank" rel="noopener noreferrer">
            <img src="/eu.png" alt="WiseFood Logo" class="inline h-10 mr-1" />
          </NuxtLink>
        </span>
      </template>

      <template #right>
        <p class="text-sm text-muted">
          {{ $t('nav.legal') }} 
        </p>
        <UButton
          to="https://github.com/nuxt-ui-templates/starter"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
        <UButton
          to="https://www.linkedin.com/company/wisefood-project"
          target="_blank"
          icon="i-simple-icons-linkedin"
          aria-label="LinkedIn"
          color="neutral"
          variant="ghost"
        />
        <UButton
          to="https://www.instagram.com/wisefood_project/"
          target="_blank"
          icon="i-simple-icons-instagram"
          aria-label="WiseFood Instagram"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter>
  </UApp>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const locales = [
  { code: 'en', name: 'English' },
  { code: 'el', name: 'Ελληνικά' }
]

const currentLocale = computed({
  get: () => locale.value,
  set: (code: string) => { locale.value = code as 'en' | 'el' }
})

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: locale.value
  }
})

useSeoMeta({
  title: t('meta.title'),
  description: t('meta.description'),
  ogTitle: t('meta.title'),
  ogDescription: t('meta.description'),
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterCard: 'summary_large_image'
})
</script>