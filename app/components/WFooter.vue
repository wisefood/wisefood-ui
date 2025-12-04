<template>
<UFooter>
      <template #left>
        <p class="text-muted text-sm">
          Copyright © {{ new Date().getFullYear() }} WiseFood Consortium. All rights reserved.
        </p>
      </template>
  
           <NuxtImg
          src="/eu.png"
          alt="WiseFood Logo"
          height="30"
          class="mt-2"
        />
      <template #right>
        <UButton
          icon="i-simple-icons-linkedin"
          color="neutral"
          variant="ghost"
          to="https://www.linkedin.com/company/wisefood-project"
          target="_blank"
          aria-label="LinkedIn"
        />
        <UButton
          icon="i-simple-icons-instagram"
          color="neutral"
          variant="ghost"
          to="https://www.instagram.com/wisefood_project/"
          target="_blank"
          aria-label="Instagram"
        />
        <UButton
          icon="i-simple-icons-x"
          color="neutral"
          variant="ghost"
          to="https://x.com/WiseFoodProject"
          target="_blank"
          aria-label="X"
        />
        <UButton
          icon="i-simple-icons-github"
          color="neutral"
          variant="ghost"
          to="https://github.com/wisefood"
          target="_blank"
          aria-label="GitHub"
        />
      </template>
    </UFooter>
</template>
