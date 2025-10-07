<template></template>

<script setup lang="ts">
import { onMounted } from "vue";

onMounted(() => {
  window.location.href = `${import.meta.env.VITE_RECIPE_WRANGLER_URL}`;
});
</script>
