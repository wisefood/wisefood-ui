<template>
  <UHeader
    class="z-[120]"
    :class="isLanding ? 'landing-header' : ''"
    :ui="isLanding ? { root: 'bg-white/15 !border-b-0 backdrop-blur-xl backdrop-saturate-150 shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_8px_32px_-8px_rgba(0,0,0,0.35)]' } : undefined"
  >
    <template #left>
      <AppLogo
        class="w-auto h-10 shrink-0"
        height="10"
      />
    </template>
    <template #right>
      <UColorModeButton />

      <LocaleSelector />

      <UButton
        v-if="authStore.initialized && authStore.isLoggedIn && authStore.canAccessConsole"
        :to="isConsoleRoute ? '/dashboard' : '/console'"
        color="primary"
        variant="outline"
        size="sm"
        :icon="isConsoleRoute ? 'i-lucide-layout-dashboard' : 'i-lucide-panel-top'"
        class="shrink-0"
        :class="isConsoleRoute ? 'ring-1 ring-brand-500/30 bg-brand-50/80 dark:bg-brand-900/20' : ''"
      >
        {{ isConsoleRoute ? t('dashboard.title') : t('header.console') }}
      </UButton>

      <!-- User Avatar Dropdown when logged in -->
      <UDropdownMenu
        v-if="authStore.initialized && authStore.isLoggedIn"
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
          class="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          <!-- Profile Avatar -->
          <div class="relative">
            <ProfileAvatar
              v-if="currentMemberAvatar"
              :avatar="currentMemberAvatar"
              size="sm"
              class="w-9 h-9"
            />
            <div
              v-else
              class="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white font-semibold text-sm"
            >
              {{ memberInitials }}
            </div>
          </div>
          <!-- Member name (hidden on mobile) -->
          <span class="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-24 truncate">
            {{ currentMemberName }}
          </span>
          <UIcon
            name="i-lucide-chevron-down"
            class="w-4 h-4 text-gray-400"
          />
        </button>
        <template #header>
          <div class="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ userDisplayName }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ authStore.currentUser?.email }}
            </p>
            <p
              v-if="householdStore.currentMember"
              class="text-xs text-brand-500 mt-1"
            >
              {{ t('header.using') }}: {{ householdStore.currentMember.name }}
            </p>
          </div>
        </template>
      </UDropdownMenu>

      <!-- Sign In Button when not logged in (only show after auth is initialized) -->
      <UButton
        v-else-if="authStore.initialized && !authStore.isLoggedIn"
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
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useHouseholdStore } from '@/stores/household'
import { stringToAvatarConfig } from '~/utils/avatarPresets'
import type { DropdownMenuItem } from '@nuxt/ui'

type RuntimeConfigWindow = Window & {
  __RUNTIME_CONFIG__?: {
    keycloakUrl?: string
    keycloakRealm?: string
  }
}

const { t } = useI18n()
const authStore = useAuthStore()
const householdStore = useHouseholdStore()
const route = useRoute()

// Initialize household store when auth is ready
onMounted(async () => {
  if (authStore.isLoggedIn && !householdStore.initialized) {
    await householdStore.initialize()
  }
})

// Get current member avatar config
const currentMemberAvatar = computed(() => {
  const member = householdStore.currentMember
  if (!member?.image_url) return null
  return stringToAvatarConfig(member.image_url)
})

// Current member name or fallback to user
const currentMemberName = computed(() => {
  const member = householdStore.currentMember
  if (member) return member.name
  const user = authStore.currentUser
  return user?.given_name || user?.name || t('header.userFallback')
})

// Member initials for fallback avatar
const memberInitials = computed(() => {
  const member = householdStore.currentMember
  if (member) {
    return member.name.charAt(0).toUpperCase()
  }

  const user = authStore.currentUser
  if (!user) return 'U'

  if (user.given_name && user.family_name) {
    return `${user.given_name[0]}${user.family_name[0]}`.toUpperCase()
  }

  if (user.name) {
    const names = user.name.split(' ').filter(Boolean)
    const firstInitial = names[0]?.[0]
    const lastInitial = names[names.length - 1]?.[0]

    if (firstInitial && lastInitial && names.length >= 2) {
      return `${firstInitial}${lastInitial}`.toUpperCase()
    }

    if (firstInitial) {
      return firstInitial.toUpperCase()
    }
  }

  if (user.username) {
    return user.username.substring(0, 2).toUpperCase()
  }

  if (user.email) {
    const emailInitial = user.email[0]
    if (emailInitial) {
      return emailInitial.toUpperCase()
    }
  }

  return 'U'
})

// User info display
const userDisplayName = computed(() => {
  const user = authStore.currentUser
  return user?.name || user?.email || t('header.userFallback')
})

const isConsoleRoute = computed(() => route.path.startsWith('/console'))
const isLanding = computed(() => route.path === '/')

// User dropdown menu items
const userMenuItems = computed<DropdownMenuItem[]>(() => [
  {
    label: t('header.menu.myProfile'),
    icon: 'i-lucide-user',
    disabled: !householdStore.currentMember,
    onSelect: () => navigateTo('/my-profile')
  },
  {
    label: t('header.menu.switchProfile'),
    icon: 'i-lucide-users',
    onSelect: () => {
      householdStore.clearSelectedMember()
      navigateTo('/profiles')
    }
  },
  {
    type: 'separator'
  },
  {
    label: t('header.menu.accountSettings'),
    icon: 'i-lucide-settings',
    onSelect: () => {
      // Check runtime config injected at container startup first, then fall back to Nuxt config
      const runtimeConfig = (window as RuntimeConfigWindow).__RUNTIME_CONFIG__
      const nuxtConfig = useRuntimeConfig()
      const keycloakUrl = runtimeConfig?.keycloakUrl || nuxtConfig.public.keycloakUrl
      const keycloakRealm = runtimeConfig?.keycloakRealm || nuxtConfig.public.keycloakRealm
      if (keycloakUrl && keycloakRealm) {
        window.open(`${keycloakUrl}/realms/${keycloakRealm}/account`, '_blank')
      } else {
        console.error('Keycloak configuration is not defined in runtime config')
      }
    }
  },
  {
    type: 'separator'
  },
  {
    label: t('header.menu.signOut'),
    icon: 'i-lucide-log-out',
    onSelect: () => {
      householdStore.reset()
      authStore.logout('/')
    }
  }
])
</script>

<style>
/* Landing-only header overrides — unscoped so they beat Nuxt UI's
   higher-specificity color tokens on UButton / UColorModeButton.
   Forces every control to white in both light and dark mode. */
.landing-header,
.landing-header * {
  color: rgba(255, 255, 255, 0.9) !important;
  border-color: rgba(255, 255, 255, 0.25) !important;
}
.landing-header button:hover,
.landing-header a:hover,
.landing-header button:hover *,
.landing-header a:hover * {
  color: rgba(255, 255, 255, 1) !important;
}
/* Preserve the primary Sign In / Console button's solid brand look */
.landing-header [class*="bg-brand-"],
.landing-header [class*="bg-primary-"] {
  color: #fff !important;
}
/* Keep the profile avatar gradient readable */
.landing-header .bg-gradient-to-br {
  color: #fff !important;
}
/* Dropdown menus (locale list, user menu) should stay normal-styled when open */
.landing-header [role="menu"],
.landing-header [role="menu"] *,
[data-ui-popper] [role="menu"],
[data-ui-popper] [role="menu"] * {
  color: initial !important;
  border-color: initial !important;
}
</style>
