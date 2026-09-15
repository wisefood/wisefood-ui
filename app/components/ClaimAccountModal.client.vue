<!--
  Keep the guest account you are already using.

  The point of this dialog is what it does *not* do. It does not sign you out,
  send you to a registration page, or copy anything anywhere: the guest is
  already a real account, so adding an email and a password to it keeps every
  meal plan, chat and setting exactly where it is. Saying so plainly is most of
  the work — a visitor who thinks "create account" means "start again" will not
  press it.
-->
<template>
  <UModal
    v-model:open="isOpen"
    :title="t('claim.title')"
    :description="t('claim.subtitle')"
  >
    <template #body>
      <form
        class="space-y-4"
        @submit.prevent="submit"
      >
        <UAlert
          color="success"
          variant="soft"
          icon="i-lucide-check-circle-2"
          :title="t('claim.keepsTitle')"
          :description="t('claim.keepsBody')"
        />

        <UFormField
          :label="t('claim.email')"
          required
        >
          <UInput
            v-model="email"
            type="email"
            autocomplete="email"
            class="w-full"
            :disabled="saving"
            placeholder="you@example.com"
          />
        </UFormField>

        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField :label="t('claim.firstName')">
            <UInput
              v-model="firstName"
              autocomplete="given-name"
              class="w-full"
              :disabled="saving"
            />
          </UFormField>
          <UFormField :label="t('claim.lastName')">
            <UInput
              v-model="lastName"
              autocomplete="family-name"
              class="w-full"
              :disabled="saving"
            />
          </UFormField>
        </div>

        <UFormField
          :label="t('claim.password')"
          :hint="t('claim.passwordHint')"
          required
        >
          <UInput
            v-model="password"
            type="password"
            autocomplete="new-password"
            class="w-full"
            :disabled="saving"
          />
        </UFormField>

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :description="error"
        />
      </form>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="saving"
          @click="isOpen = false"
        >
          {{ t('claim.notNow') }}
        </UButton>
        <UButton
          color="primary"
          icon="i-lucide-user-check"
          :loading="saving"
          :disabled="!canSubmit"
          @click="submit"
        >
          {{ t('claim.submit') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import sharingApi, { failureText } from '~/services/sharingApi'
import { useAuthStore } from '~/stores/auth'

const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()

const isOpen = defineModel<boolean>('open', { default: false })

const email = ref('')
const password = ref('')
const firstName = ref('')
const lastName = ref('')
const saving = ref(false)
const error = ref('')

/** Mirrors the server's rule, so the obvious mistakes never cost a round trip. */
const MIN_PASSWORD = 10
const canSubmit = computed(() =>
  !saving.value
  && /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email.value.trim())
  && password.value.length >= MIN_PASSWORD
)

async function submit() {
  if (!canSubmit.value) return
  saving.value = true
  error.value = ''
  try {
    const result = await sharingApi.claimAccount({
      email: email.value.trim(),
      password: password.value,
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim()
    })

    /*
     * The account is permanent from the server's point of view, but this tab
     * still holds a token minted for a guest — it carries the `guest` role and
     * the stored guest session drives the banner and the expiry countdown.
     * Dropping that state is what makes the change visible here; the data it
     * used to point at is untouched and still ours.
     */
    authStore.clearGuestSession()
    await authStore.initialize(true)

    isOpen.value = false
    toast.add({
      title: t('claim.doneTitle'),
      description: result.verification_sent
        ? t('claim.doneVerify', { email: result.email })
        : t('claim.doneBody'),
      color: 'success',
      icon: 'i-lucide-check',
      duration: 8000
    })
  } catch (caught) {
    error.value = failureText(caught, t('claim.failed'))
  } finally {
    saving.value = false
  }
}
</script>
