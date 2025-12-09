<template>
<UFooter class="bg-neutral-300 dark:bg-zinc-800">
    <template #left>
    <p class="text-sm text-muted">
        © 2025 The WiseFood Consortium, All rights reserved.
    </p>
    <span class="mx-2 text-sm text-muted">
        <NuxtLink to="https://cordis.europa.eu/project/id/101181895" target="_blank" rel="noopener noreferrer">
        <img src="/eu.png" alt="EU Logo" class="inline h-10 mr-1" />
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
</template>