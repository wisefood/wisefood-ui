<template>
  <NuxtLink :to="logoDestination" class="inline-block">
    <img
      src="/logo.png"
      alt="WISEFOOD"
      :class="`h-${height} w-auto mx-auto transition-transform hover:scale-105`"
    />
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useHouseholdStore } from '~/stores/household'

defineProps({
  height: {
    type: String,
    default: '16'
  }
})

const authStore = useAuthStore()
const householdStore = useHouseholdStore()
const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})

// Smart routing: go to dashboard if authenticated with profile, otherwise home
const logoDestination = computed(() => {
  // Keep SSR and client-hydration output stable.
  if (!isMounted.value) {
    return '/'
  }

  if (authStore.isAuthenticated && householdStore.currentMember) {
    return '/dashboard'
  }
  if (authStore.isAuthenticated) {
    return '/profiles'
  }
  return '/'
})
</script>
