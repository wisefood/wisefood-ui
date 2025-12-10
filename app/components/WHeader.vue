<template>
  <UHeader>
    <template #left>
      <AppLogo class="w-auto h-10 shrink-0" height="10" />
      <TemplateMenu />
    </template>
    <template #right>
      <UColorModeButton />

      <LocaleSelector />

      <!-- User Avatar Dropdown when logged in -->
      <UDropdownMenu
        v-if="authStore.isLoggedIn"
        :items="userMenuItems"
        :content="{
          align: 'end',
          side: 'bottom',
          sideOffset: 8
        }"
        :ui="{
          content: 'w-56'
        }"
      >
        <button
          class="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white font-semibold text-sm hover:shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          {{ userInitials }}
        </button>
        <template #header>
          <div class="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ userDisplayName }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ authStore.currentUser?.email }}</p>
          </div>
        </template>
      </UDropdownMenu>

      <!-- Sign In Button when not logged in -->
      <UButton
        v-else
        to="/login"
        color="primary"
        variant="solid"
        trailing-icon="i-lucide-lock"
        class="shadow-xl shadow-brand-500/20 hover:shadow-2xl text-white hover:shadow-brand-500/30 transition-shadow cursor-pointer"
      >
        {{ $t('nav.signIn') }}
      </UButton>
    </template>
  </UHeader>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { DropdownMenuItem } from '@nuxt/ui'

const authStore = useAuthStore()

// Compute user initials from name
const userInitials = computed(() => {
  const user = authStore.currentUser
  if (!user) return 'U'

  if (user.given_name && user.family_name) {
    return `${user.given_name[0]}${user.family_name[0]}`.toUpperCase()
  }

  if (user.name) {
    const names = user.name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return user.name[0].toUpperCase()
  }

  if (user.username) {
    return user.username.substring(0, 2).toUpperCase()
  }

  if (user.email) {
    return user.email[0].toUpperCase()
  }

  return 'U'
})

// User info display
const userDisplayName = computed(() => {
  const user = authStore.currentUser
  return user?.name || user?.email || 'User'
})

// User dropdown menu items
const userMenuItems = computed<DropdownMenuItem[]>(() => [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    onSelect: () => navigateTo('/dashboard')
  },
  {
    label: 'Profile',
    icon: 'i-lucide-user',
    onSelect: () => navigateTo('/profile')
  },
  {
    label: 'Settings',
    icon: 'i-lucide-settings',
    onSelect: () => navigateTo('/settings')
  },
  {
    type: 'separator'
  },
  {
    label: 'Sign out',
    icon: 'i-lucide-log-out',
    onSelect: () => authStore.logout('/')
  }
])
</script>