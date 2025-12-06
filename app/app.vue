<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'WiseFood'
const description = 'WiseFood - Your Ultimate Foodie Companion: Discover, Share, and Savor Culinary Delights!'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterCard: 'summary_large_image'
})
</script>

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
        <UButton
            color="primary"
            variant="solid"
            trailing-icon="i-lucide-lock"
            class="shadow-xl shadow-brand-500/20 hover:shadow-2xl text-white hover:shadow-brand-500/30 transition-shadow cursor-pointer"
          >
          Sign In 
        </UButton>
        </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator/>

    <UFooter class="bg-neutral-300 dark:bg-zinc-800">
      <template #left>
        <p class="text-sm text-muted">
          © {{ new Date().getFullYear() }} The WiseFood Consortium, All rights reserved.
        </p>
        <span class="mx-2 text-sm text-muted">
          <NuxtLink to="https://cordis.europa.eu/project/id/101181895" target="_blank" rel="noopener noreferrer">
            <img src="/eu.png" alt="WiseFood Logo" class="inline h-10 mr-1" />
          </NuxtLink>
        </span>
      </template>

      <template #right>
         <p class="text-sm text-muted">
          Terms & Conditions | GDPR 
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
