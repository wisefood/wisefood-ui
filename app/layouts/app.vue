<template>
  <!--
    The footer-less shell for pages that own the whole screen: a chat, a
    document beside its rules, a tree beside its details. The shell is exactly
    the viewport tall, so a page laid out as `flex min-h-0 flex-1` gets what is
    left below the header and the guest banner and scrolls inside its own
    panes. No page has to know how tall the banner wrapped to this time.

    Machine translation is opt-in per region, as in the default layout.
  -->
  <UApp translate="no" :locale="uiLocale">
    <div class="wf-app-shell flex flex-col">
      <WHeader />

      <GuestBanner />

      <UMain class="flex min-h-0 flex-1 flex-col">
        <slot />
      </UMain>
    </div>
  </UApp>
</template>

<script setup lang="ts">
const uiLocale = useUiLocale()
</script>
