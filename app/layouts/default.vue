<template>
  <UApp>
    <UHeader>
      <template #left>
        <AppLogo class="w-auto h-10 shrink-0" height="12" />
        <TemplateMenu />
      </template>
      <template #right>
        <UColorModeButton />

        <LocaleSelector />
       
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

    <WFooter/>
  </UApp>
</template>