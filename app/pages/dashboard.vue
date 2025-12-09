<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold">
                Dashboard
              </h1>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Welcome to your WiseFood dashboard
              </p>
            </div>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-lucide-log-out"
              @click="handleSignOut"
            >
              Sign Out
            </UButton>
          </div>
        </template>

        <div v-if="authStore.isAuthenticated && authStore.user" class="space-y-6">
          <div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-green-600 dark:text-green-400" />
              <p class="font-medium text-green-900 dark:text-green-100">
                Authentication successful!
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <h2 class="text-lg font-semibold">
              User Information
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Name
                </p>
                <p class="font-medium">
                  {{ authStore.user?.name || 'N/A' }}
                </p>
              </div>

              <div class="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Email
                </p>
                <p class="font-medium">
                  {{ authStore.user?.email || 'N/A' }}
                </p>
              </div>

              <div class="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Username
                </p>
                <p class="font-medium">
                  {{ authStore.user?.username || 'N/A' }}
                </p>
              </div>

              <div class="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  User ID
                </p>
                <p class="font-medium font-mono text-sm">
                  {{ authStore.user?.id || 'N/A' }}
                </p>
              </div>

              <div class="p-4 border border-gray-200 dark:border-gray-800 rounded-lg col-span-2">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Roles
                </p>
                <div class="flex flex-wrap gap-2 mt-2">
                  <UBadge
                    v-for="role in authStore.user?.roles"
                    :key="role"
                    color="primary"
                    variant="subtle"
                  >
                    {{ role }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 class="font-medium text-blue-900 dark:text-blue-100 mb-2">
              User Data
            </h3>
            <pre class="text-xs overflow-auto p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700">{{ JSON.stringify(authStore.user, null, 2) }}</pre>
          </div>
        </div>

        <div v-else-if="!authStore.initialized" class="text-center py-8">
          <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin mx-auto mb-4" />
          <p class="text-gray-600 dark:text-gray-400">
            Loading session...
          </p>
        </div>

        <div v-else class="text-center py-8">
          <UIcon name="i-lucide-alert-circle" class="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Not authenticated
          </p>
          <UButton @click="navigateTo('/login')">
            Go to Login
          </UButton>
        </div>

        <template #footer>
          <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <p>Protected by Keycloak SSO</p>
            <UButton
              to="/"
              variant="link"
              trailing-icon="i-lucide-arrow-right"
            >
              Back to Home
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

definePageMeta({
  middleware: 'auth'
})

useSeoMeta({
  title: 'Dashboard',
  description: 'Your WiseFood dashboard'
})

const authStore = useAuthStore()

const handleSignOut = async () => {
  await authStore.logout('/')
}
</script>