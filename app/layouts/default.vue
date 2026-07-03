<template>
  <UApp>
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