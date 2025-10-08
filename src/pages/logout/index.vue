<template></template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();

definePage({
  name: "logout",
  meta: {
    layout: 'auth',
  }
});

onMounted(() => {
  authStore.logout();
});
</script>
