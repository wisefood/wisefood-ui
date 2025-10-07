<template></template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useGlobalRouter } from "@/composables/useGlobalRouter";
const { navigateTo } = useGlobalRouter();
import KeycloakService from "@/services/keycloak";

const router = useRouter();

definePage({
  name: "logout",
  meta: {
    layout: 'auth',
  }
});

onMounted(() => {
  KeycloakService.CallLogout();
});
</script>
