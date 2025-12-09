<template>
  <div class="w-full max-w-md">
    <!-- Logo -->
    <div class="text-center mb-8">
      <NuxtLink to="/" class="inline-block">
        <img 
          src="/logo.png" 
          alt="WISEFOOD" 
          class="h-16 w-auto mx-auto transition-transform hover:scale-105" 
        />
      </NuxtLink>
    </div>

    <!-- Main Card -->
    <UCard 
      class="shadow-xl"
      :ui="{
        body: { padding: 'sm:p-8 p-6' },
        ring: 'ring-1 ring-gray-200 dark:ring-gray-800',
        rounded: 'rounded-2xl'
      }"
    >
      <!-- Header -->
      <div class="mb-8 mt-6">
        <h1 class="text-5xl font-medium text-brandg-500 font-serif italic text-center mb-2">
            {{ t('auth.welcome') || 'Welcome back' }}
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
          {{ t('auth.loginPrompt') || 'Sign in to your account to continue' }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isChecking" class="py-12">
        <div class="flex flex-col items-center justify-center space-y-4">
          <UIcon 
            name="i-lucide-loader-2" 
            class="h-10 w-10 animate-spin text-primary-500" 
          />
          <p class="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {{ t('auth.checking') || 'Checking authentication...' }}
          </p>
        </div>
      </div>

      <!-- Login Form -->
      <div v-else class="space-y-7 p-8">
        <!-- Login Button -->
        <UButton 
          color="primary" 
          size="xl"
          block
          :loading="isLoggingIn"
          :disabled="isLoggingIn"
          icon="i-lucide-lock"
          trailing-icon="i-lucide-arrow-right"
          class="justify-center cursor-pointer font-semibold shadow-lg hover:shadow-xl transition-all"
          @click="handleLogin"
        >
          <span v-if="isLoggingIn">
            {{ t('auth.redirecting') || 'Redirecting to login...' }}
          </span>
          <span v-else>
            {{ t('auth.signInWithSSO') || 'Sign in with SSO' }}
          </span>
        </UButton>

        <!-- Info Banner -->
        <UAlert
          icon="i-lucide-info"
          color="blue"
          variant="soft"
          :title="t('auth.ssoInfo') || 'Single Sign-On'"
          :description="t('auth.ssoDescription') || 'You will be redirected to our secure authentication portal powered by Keycloak.'"
        />

        <!-- Divider -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300 dark:border-gray-700" />
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white dark:bg-gray-900 text-gray-500">
              {{ t('auth.or') || 'or' }}
            </span>
          </div>
        </div>

        <!-- Register Button -->
        <UButton 
          color="gray"
          variant="outline"
          size="xl"
          block
          :loading="isRegistering"
          :disabled="isRegistering"
          icon="i-lucide-user-plus"
          class="justify-center font-semibold cursor-pointer hover:shadow-sm transition-all"
          @click="handleRegister"
        >
          <span v-if="isRegistering">
            {{ t('auth.redirecting') || 'Redirecting...' }}
          </span>
          <span v-else>
            {{ t('auth.createAccount') || 'Create new account' }}
          </span>
        </UButton>
      </div>
    </UCard>

    <!-- Help Links -->
    <div class="mt-6 text-center space-y-2">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ t('auth.needHelp') || 'Need help?' }}
        <UButton
          variant="link"
          color="primary"
          size="sm"
          class="font-medium cursor-pointer"
          :padded="false"
        >
          {{ t('auth.contactSupport') || 'Contact Support' }}
        </UButton>
      </p>
      <div class="flex items-center justify-center space-x-4 text-sm">
        <NuxtLink 
          to="/privacy" 
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
        >
          {{ t('auth.privacy') || 'Privacy Policy' }}
        </NuxtLink>
        <span class="text-gray-300 dark:text-gray-700">•</span>
        <NuxtLink 
          to="/terms" 
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
        >
          {{ t('auth.terms') || 'Terms of Service' }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import KeycloakAuthService from '@/services/keycloak'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const authStore = useAuthStore()
const router = useRouter()

const isChecking = ref(true)
const isLoggingIn = ref(false)
const isRegistering = ref(false)

// Check authentication status on mount
onMounted(async () => {
  if (!authStore.initialized) {
    await authStore.initialize()
  }
  
  if (authStore.isAuthenticated) {
    console.log('[LoginCard] User already authenticated, redirecting to dashboard')
    await router.push('/dashboard')
    return
  }
  
  isChecking.value = false
})

const handleLogin = () => {
  isLoggingIn.value = true
  authStore.login('/dashboard')
}

const handleRegister = () => {
  isRegistering.value = true
  KeycloakAuthService.register('/dashboard')
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}
</style>