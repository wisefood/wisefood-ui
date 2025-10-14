<template>


  <v-container max-width="1500" class="pa-4">
    <h3 class="text-h4 mb-4">
      {{ t('hello') }} <span class="strong" id="vocative-name"></span>
    </h3>


    <v-row justify="center" v-if="auth.isAuthenticated">
      <v-col cols="12" md="6" lg="4">
        <service-card
          :title="t('services.foodScholar.title')"
          :subtitle="t('services.foodScholar.subtitle')"
          :description="t('services.foodScholar.description')"
          :serviceUrl="'/food-scholar'"
          icon="images/foodscholar.png"
        />
      </v-col>
      <v-col cols="12" md="6" lg="4">
        <service-card
          :title="t('services.recipeWrangler.title')"
          :subtitle="t('services.recipeWrangler.subtitle')"
          :description="t('services.recipeWrangler.description')"
          :serviceUrl="'/recipe-wrangler'"
          icon="images/recipewrangler.png"
        />
      </v-col>
      <v-col cols="12" md="6" lg="4">
        <service-card
          :title="t('services.foodChat.title')"
          :subtitle="t('services.foodChat.subtitle')"
          :description="t('services.foodChat.description')"
          :serviceUrl="'/food-chat'"
          icon="images/foodchat.png"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { ApiError } from "@/lib/apiClient";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import { useAuthStore } from "@/stores/authStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useUserHousehold } from "@/composables/useHouseholds";

import ServiceCard from "@/components/ServiceCard.vue";

definePage({
  name: "dashboard",
  meta: {
    layout: "home",
    titleKey: 'pages.dashboard.title',
    descriptionKey: 'pages.dashboard.description'
  }
});

const { t } = useI18nWithStorage();
const auth = useAuthStore();
const router = useRouter();
const session = useSessionStore();

const {
  data: household,
  loading: householdLoading,
  error: householdError,
  refresh: fetchHousehold,
  abort: abortHouseholdRequest,
} = useUserHousehold({ immediate: false });

const isHouseholdMissing = computed(() => {
  if (householdLoading.value) return false;
  if (household.value) return false;

  const err = householdError.value;
  return err instanceof ApiError && err.status === 404;
});

function getVocativeName(name: string | undefined) {
  if (!name) return '';
  if (name.endsWith('ος')) return name.slice(0, -2) + 'ο';
  if (name.endsWith('ας')) return name.slice(0, -2) + 'α';
  if (name.endsWith('ης')) return name.slice(0, -2) + 'η';
  return name;
}

onMounted(() => {
  if (auth.isAuthenticated) {
    fetchHousehold();
  }
  
  const nameElement = document.getElementById('vocative-name');
  if (nameElement) {
    watch(
      () => session.activeMember?.name,
      (name) => {
        nameElement.textContent = getVocativeName(name);
      },
      { immediate: true }
    );
  }
});


watch(
  () => auth.isAuthenticated,
  (loggedIn) => {
    if (loggedIn) {
      fetchHousehold();
    } else {
      abortHouseholdRequest();
      household.value = null;
      householdError.value = null;
    }
  }
);

watch(
  () => isHouseholdMissing.value,
  async (missing) => {
    if (!missing) return;
    if (router.currentRoute.value.path === "/profiles") return;
    await router.replace("/profiles");
  }
);
</script>
