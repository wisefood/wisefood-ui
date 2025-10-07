<template>
  <div class="redirect-container">
    <div class="text-center">
      <v-progress-circular
        color="primary"
        size="64"
        indeterminate
        class="mb-4"
      ></v-progress-circular>
      <p class="text-h6">{{ t("common.redirecting") }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import { useGlobalRouter } from "@/composables/useGlobalRouter";
import { useUserManagementService } from "@/services/user-managment.service";

const { t } = useI18nWithStorage();
const { navigateTo } = useGlobalRouter();
const { createUserProfile } = useUserManagementService();
onMounted(async () => {
  await createUserProfile();
  navigateTo("/login");
});

</script>

<style scoped lang="scss">
.redirect-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2rem;
  color: #666;
}
</style>
