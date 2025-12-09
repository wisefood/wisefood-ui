<template>
  <UApp>
    <UMain class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div class="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <slot />
      </div>      
     <WFooter />
    </UMain>
  </UApp>
</template>