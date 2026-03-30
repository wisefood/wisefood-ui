<template>
  <div>
    <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <UBreadcrumb
        :items="breadcrumbItems"
        class="mb-4"
      />

      <UPageHeader
        title="Asset Manager"
        description="Choose the content domain you want to manage in the Wisefood control panel."
        :ui="{ root: 'relative py-8 border-b-0' }"
      />

      <UPageBody>
        <div class="grid gap-4 lg:grid-cols-3">
          <UCard
            v-for="asset in assetSections"
            :key="asset.title"
            :ui="{ body: 'p-5' }"
            class="group border border-gray-200/70 shadow-sm transition-all duration-200 dark:border-white/10"
            :class="asset.available
              ? 'bg-white/95 ring-1 ring-brand-200/70 hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-900/80 dark:ring-brand-500/20'
              : 'bg-gray-100/90 opacity-70 dark:bg-zinc-900/50'"
          >
            <div class="flex items-start justify-between gap-4">
              <div
                class="rounded-xl p-3"
                :class="asset.available ? asset.iconWrapperClass : 'bg-gray-200/80 dark:bg-white/10'"
              >
                <UIcon
                  :name="asset.icon"
                  class="w-5"
                  :class="asset.available ? asset.iconClass : 'text-gray-500 dark:text-gray-400'"
                />
              </div>

              <UBadge
                :color="asset.available ? 'primary' : 'neutral'"
                :variant="asset.available ? 'soft' : 'outline'"
              >
                {{ asset.available ? 'LIVE' : 'INOP' }}
              </UBadge>
            </div>

            <div class="mt-4">
              <h2
                class="text-lg font-semibold"
                :class="asset.available ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'"
              >
                {{ asset.title }}
              </h2>
              <p class="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                {{ asset.description }}
              </p>
            </div>

            <div class="mt-5 flex items-center justify-between gap-4">
              <p
                v-if="asset.summary"
                class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                {{ asset.summary }}
              </p>
              <span v-else />

              <UButton
                :to="asset.available ? asset.to : undefined"
                :disabled="!asset.available"
                color="neutral"
                variant="ghost"
                size="sm"
                trailing-icon="i-lucide-arrow-right"
              >
                {{ asset.available ? 'Open' : 'Unavailable' }}
              </UButton>
            </div>
          </UCard>
        </div>
      </UPageBody>
    </UPage>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Asset Manager'
})

useSeoMeta({
  description: 'Wisefood asset manager switchboard for internal content operations'
})

const breadcrumbItems = [
  {
    label: 'Console',
    icon: 'i-lucide-panel-top',
    to: '/console'
  },
  {
    label: 'Asset Manager',
    icon: 'i-lucide-folder-open'
  }
]

const assetSections = [
  {
    title: 'Dietary Guides',
    description: 'Manage guide records and work with each guide’s extracted guidelines and artifacts.',
    summary: '',
    to: '/console/assets/guides',
    icon: 'i-lucide-book-open-check',
    available: true,
    iconWrapperClass: 'bg-brand-50 dark:bg-brand-500/10',
    iconClass: 'text-brand-600 dark:text-brand-300'
  },
  {
    title: 'Scientific Articles',
    description: 'Search, curate, and edit scientific article records present in the literature base.',
    summary: '',
    to: '/console/assets/articles',
    icon: 'i-lucide-flask-conical',
    available: true,
    iconWrapperClass: 'bg-brandg-50 dark:bg-brandg-500/10',
    iconClass: 'text-brandg-600 dark:text-brandg-300'
  },
  {
    title: 'Recipes',
    description: 'Recipe asset operations will be added here in a future iteration.',
    summary: 'Planned feature',
    to: '',
    icon: 'i-lucide-utensils-crossed',
    available: false,
    iconWrapperClass: 'bg-brandp-50 dark:bg-brandp-500/10',
    iconClass: 'text-brandp-500 dark:text-brandp-300'
  }
]
</script>
