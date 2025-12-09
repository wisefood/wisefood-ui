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
          to="/login"
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
      <slot />
    </UMain>

    <USeparator />

    <WFooter />
  </UApp>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const locales = [
  { code: 'en', name: 'English' },
  { code: 'el', name: 'Ελληνικά' }
]

const currentLocale = computed({
  get: () => locale.value,
  set: (code: string) => { locale.value = code as 'en' | 'el' }
})
</script>