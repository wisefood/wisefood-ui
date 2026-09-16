<template>
  <!-- Machine translation is opt-IN per region. The interface has
       hand-written hu/sl/el bundles, and running a translator over them
       yields worse text than what is already there; only
       <TranslatableContent> re-enables it, for stored English content. -->
  <UApp translate="no">
    <WHeader />

    <GuestBanner />

    <UMain>
      <slot />
    </UMain>

    <USeparator />

    <WFooter />

    <AccessibilityToolbar />
  </UApp>
</template>