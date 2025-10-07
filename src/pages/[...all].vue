<!-- src/pages/[...all].vue -->
<template>
  <v-container class="d-flex flex-column align-center justify-center">
    <v-icon size="x-large" color="grey" class="mb-4">
      mdi-alert-circle-outline
    </v-icon>
    <h1 class="text-h3 mb-4">404</h1>
    <h2 class="text-h5 mb-6">{{ t("errors.pageNotFound") }}</h2>
    <p class="text-body-1 mb-8 text-center">
      {{ t("errors.pageNotFoundDescription") }}
    </p>
    <v-btn color="primary" @click="navigateTo('/')">
      {{ t("navigation.backToHome") }}
    </v-btn>
  </v-container>
</template>

<script setup lang="ts">
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import { useGlobalRouter } from "@/composables/useGlobalRouter";

const { t } = useI18nWithStorage();
const { navigateTo } = useGlobalRouter();
</script>
