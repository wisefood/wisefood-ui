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
          icon="/app/images/foodscholar.png"
        />
      </v-col>
      <v-col cols="12" md="6" lg="4">
        <service-card
          :title="t('services.recipeWrangler.title')"
          :subtitle="t('services.recipeWrangler.subtitle')"
          :description="t('services.recipeWrangler.description')"
          :serviceUrl="'/recipe-wrangler'"
          icon="/app/images/recipewrangler.png"
        />
      </v-col>
      <v-col cols="12" md="6" lg="4">
        <service-card
          :title="t('services.foodChat.title')"
          :subtitle="t('services.foodChat.subtitle')"
          :description="t('services.foodChat.description')"
          :serviceUrl="'/food-chat'"
          icon="/app/images/foodchat.png"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import { useAuthStore } from "@/stores/authStore";
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

function getVocativeName(name: string | undefined) {
  if (!name) return '';
  if (name.endsWith('ος')) return name.slice(0, -2) + 'ο';
  if (name.endsWith('ας')) return name.slice(0, -2) + 'α';
  if (name.endsWith('ης')) return name.slice(0, -2) + 'η';
  return name;
}

onMounted(() => {
  const nameElement = document.getElementById('vocative-name');
  if (nameElement && auth.user) {
    nameElement.textContent = getVocativeName(auth.user.given_name);
  }
});
</script>
