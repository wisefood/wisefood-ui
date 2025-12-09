<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Your dashboard content -->
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useSeoMeta({
  title: 'Dashboard',
  description: 'Your WiseFood dashboard'
})

const authStore = useAuthStore()
</script>