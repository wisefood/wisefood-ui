<template>
  <div class="container container-normal py-6">
    <div class="row align-items-center ">
      <div class="col-lg-12">
        
        <div class="row mb-4">
          <div class="col-auto">
            <h1 class="h2 mb-0">{{ t('pages.profile.title') }}</h1>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
const { t } = useI18nWithStorage();

definePage({
  name: "profile",
  meta: {
      layout: 'intermediate',
    titleKey: 'pages.profile.title',
    descriptionKey: 'pages.profile.description'
  }
});
</script>