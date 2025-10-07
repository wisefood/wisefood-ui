<template>
  <div class="container container-normal py-4">
    <div class="row align-items-center g-4">
      <div class="col-lg">
        <login-card />
      </div>

      <div class="col-lg d-none d-lg-block">
        <v-container
          class="text-center text-blue mt-6"
          style="font-family: 'Playpen Sans', cursive;"
        >
          <link
            href="https://fonts.googleapis.com/css2?family=Nova+Mono&display=swap"
            rel="stylesheet"
          >
          <h1
            class="text-h3 font-weight-bold mb-4"
            style="font-family: 'Nova Mono', cursive;"
          >
            {{ t("home.welcomeToWisefood") }}
            <span class="text-pink">Wise</span>Food
          </h1>
          <p
            class="text-h5 text-medium-emphasis mb-6 typing-effect"
            style="font-family: 'Nova Mono', cursive;"
          >
            {{ t("home.aiPoweredNutritionCompanion") }}
          </p>
        </v-container>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import { useAuthStore } from "@/stores/authStore";
import { useGlobalRouter } from "@/composables/useGlobalRouter";
import KeycloakService from "@/services/keycloak";
const { navigateTo } = useGlobalRouter();

const { t } = useI18nWithStorage();
const route = useRoute()
const auth = useAuthStore();

definePage({
  name: "login",
  meta: {
    layout: 'auth',
    titleKey: 'pages.login.title',
    descriptionKey: 'pages.login.description'
  }
});


onMounted(async () => {
  if (auth.isAuthenticated) {
    try {
      await KeycloakService.CallTokenRefresh();
      navigateTo("/dashboard");
    } catch (err) {
      console.error("Auto token refresh failed on /login, staying here", err);
    }
  }
});

onMounted(() => {
  const elements = document.querySelectorAll(".typing-effect");
  elements.forEach((el) => {
    const text = el.textContent || "";
    el.textContent = "";
    let i = 0;
    const type = () => {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(type, 50);
      }
    };
    type();
  });

  
});

</script>

<style scoped>
.typing-effect {
  overflow: hidden;
  white-space: nowrap;
  animation: blink-caret 0.75s step-end infinite;
}
</style>
