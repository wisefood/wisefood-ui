<template>
  <div
    v-if="authStore.isGuest"
    class="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 px-4 py-2"
  >
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-amber-900 dark:text-amber-200">
      <UIcon name="i-lucide-flask-conical" class="h-4 w-4 shrink-0" />
      <span>
        {{ t('auth.guestBanner') || "You're exploring as a guest — your data is temporary" }}
        <template v-if="remainingLabel">
          ({{ t('auth.guestExpires') || 'expires in' }} {{ remainingLabel }})
        </template>
      </span>
      <UButton
        color="warning"
        variant="soft"
        size="xs"
        icon="i-lucide-user-plus"
        class="cursor-pointer font-semibold"
        @click="handleCreateAccount"
      >
        {{ t('auth.createAccount') || 'Create free account' }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import KeycloakAuthService from '@/services/keycloak'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const authStore = useAuthStore()

const now = ref(Math.floor(Date.now() / 1000))
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timer = setInterval(() => {
    now.value = Math.floor(Date.now() / 1000)
  }, 30_000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const remainingLabel = computed(() => {
  const expiresAt = authStore.guestExpiresAt
  if (!expiresAt) return null
  const seconds = expiresAt - now.value
  if (seconds <= 0) return null
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
})

const handleCreateAccount = () => {
  // Leaving guest mode: drop the ephemeral session, then send the visitor
  // to the real registration flow.
  authStore.clearGuestSession()
  KeycloakAuthService.register('/profiles')
}
</script>
