<template>
  <router-link class="card card-link cursor-pointer" :to="serviceUrl">
    <div
        :style="{ backgroundImage: `url(${icon})` }"
        class="card-img-top img-responsive img-responsive-21x10"
      ></div>
    <div class="card-body">
      <h2 class="text-secondary">{{ title }}</h2>
      <p class="text-gray-600 mb-2">{{ description }}</p>
    </div>
  </router-link>
</template>

<script setup lang="ts">
// Define props with defaults
const props = defineProps({
  title: {
    type: String,
    default: "Card Title",
  },
  subtitle: {
    type: String,
    default: "Card Subtitle",
  },
  icon: {
    type: String,
    default: "mdi-book-open-variant-outline",
  },
  imageHeight: {
    type: String,
    default: "300px",
  },
  serviceUrl: {
    type: String,
    default: "/services/food-chat",
  },
  description: {
    type: String,
    default:
      "Card description text goes here. You can customize this text by passing a description prop.",
  },
  maxWidth: {
    type: [String, Number],
    default: 400,
  },
});
</script>