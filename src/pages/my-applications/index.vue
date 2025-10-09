<template>
  <v-container max-width="1200" class="pa-4">
    <ApplicationsWrapper />
  </v-container>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import { useRoute } from "vue-router";
import { onMounted, computed } from "vue";
import { useGlobalRouter } from "@/composables/useGlobalRouter";
import { useNotifications } from "@/composables/useNotifications";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";

const { t } = useI18nWithStorage();
const { error } = useNotifications();
const { navigateTo } = useGlobalRouter();
const authStore = useAuthStore();
const route = useRoute();

const errorMessageTitle = computed(() => {
  return t("auth.authenticationError");
});

const errorMessageText = computed(() => {
  return t("auth.authenticationErrorMessage");
});

onMounted(() => {
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    error(errorMessageTitle.value, {
      text: errorMessageText.value,
    });
    navigateTo("/");
  }
});

const userId = (route.params as { userId?: string })?.userId ?? null;
</script>

<script lang="ts">
export default {
  data() {
    return {
      tab: null,
    };
  },
};
</script>
