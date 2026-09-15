<template>
  <div
    v-if="authStore.isGuest"
    class="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 px-4 py-2"
  >
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-amber-900 dark:text-amber-200">
      <UIcon
        name="i-lucide-flask-conical"
        class="h-4 w-4 shrink-0"
      />
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
        icon="i-lucide-user-check"
        class="cursor-pointer font-semibold"
        @click="claiming = true"
      >
        {{ t('claim.cta') }}
      </UButton>

      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-lucide-eraser"
        class="cursor-pointer"
        :loading="purging"
        data-flows="guest-erase"
        @click="handleEraseNow"
      >
        {{ t('auth.guestErase') || 'Erase my data now' }}
      </UButton>
    </div>
  </div>

  <!-- Rendered beside the banner rather than inside the `v-if`, so closing it
       does not depend on still being a guest — the whole point is that by then
       you are not one. -->
  <ClaimAccountModal v-model:open="claiming" />
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
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

/*
 * Keeping the account, rather than starting a new one.
 *
 * This used to clear the guest session and hand the visitor to Keycloak's
 * registration page, which threw away everything they had just made — the
 * plans, the chat, the household they had spent ten minutes setting up. A
 * guest is already a real account, so it is upgraded in place instead and
 * none of that moves.
 */
const claiming = ref(false)

const purging = ref(false)
const toast = useToast()

/**
 * Erase now, rather than at expiry. This is the affordance a visitor at a booth
 * needs: they typed real preferences into a shared laptop and want them gone
 * before the next person sits down.
 */
const handleEraseNow = async () => {
  if (purging.value) return
  purging.value = true

  const erased = await authStore.purgeGuestSession()
  toast.add({
    title: erased
      ? (t('auth.guestErased') || 'Your guest data has been erased')
      : (t('auth.guestEraseFailed') || 'We could not confirm the erase — it will still expire automatically'),
    color: erased ? 'success' : 'warning',
    icon: erased ? 'i-lucide-check' : 'i-lucide-alert-circle'
  })

  purging.value = false
  await navigateTo('/login')
}
</script>
