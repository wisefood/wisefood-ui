<template>
  <AuthLoginCard />
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

useHead({
  title: 'Login'
})

useSeoMeta({
  description: 'Sign in to your WiseFood account'
})
</script>