<!--
  Share a meal plan: make a link, copy it, or send it by email.

  The link is made on first use rather than up front, because making one
  publishes something and nobody should publish by opening a menu. Once made
  it is reused for the life of this component, so pressing "copy" twice does
  not litter the owner's list with duplicate links to the same plan.
-->
<template>
  <div>
    <UButton
      :size="size"
      :variant="variant"
      color="neutral"
      icon="i-lucide-share-2"
      class="cursor-pointer"
      :loading="creating"
      @click="open"
    >
      <slot>{{ t('share.button') }}</slot>
    </UButton>

    <UModal
      v-model:open="isOpen"
      :title="t('share.title')"
      :description="t('share.subtitle')"
    >
      <template #body>
        <div
          v-if="creating"
          class="flex items-center gap-2 py-6 text-sm text-gray-500 dark:text-gray-400"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="h-4 w-4 animate-spin"
          />
          {{ t('share.creating') }}
        </div>

        <div
          v-else-if="error"
          class="py-2"
        >
          <UAlert
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :description="error"
          />
        </div>

        <div
          v-else-if="token"
          class="space-y-4"
        >
          <UFormField :label="t('share.linkLabel')">
            <div class="flex gap-2">
              <UInput
                :model-value="url"
                readonly
                class="w-full font-mono text-xs"
                :aria-label="t('share.linkLabel')"
                @focus="(e: FocusEvent) => (e.target as HTMLInputElement).select()"
              />
              <UButton
                color="primary"
                :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
                class="shrink-0 cursor-pointer"
                @click="copy"
              >
                {{ copied ? t('share.copied') : t('share.copy') }}
              </UButton>
            </div>
          </UFormField>

          <!-- Said plainly, because it is the part people get wrong about
               links like this: not secret, but not searchable either. -->
          <p class="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            {{ t('share.privacyNote') }}
          </p>

          <div class="border-t border-gray-100 pt-4 dark:border-zinc-800">
            <UFormField
              :label="t('share.emailLabel')"
              :hint="t('share.emailHint')"
            >
              <div class="flex gap-2">
                <UInput
                  v-model="recipient"
                  type="email"
                  class="w-full"
                  placeholder="you@example.com"
                  :disabled="sending"
                />
                <UButton
                  color="neutral"
                  variant="soft"
                  icon="i-lucide-mail"
                  class="shrink-0 cursor-pointer"
                  :loading="sending"
                  @click="send"
                >
                  {{ t('share.send') }}
                </UButton>
              </div>
            </UFormField>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex w-full items-center justify-between gap-2">
          <UButton
            v-if="token"
            color="error"
            variant="ghost"
            size="sm"
            icon="i-lucide-link-2-off"
            class="cursor-pointer"
            :loading="revoking"
            @click="revoke"
          >
            {{ t('share.revoke') }}
          </UButton>
          <span v-else />
          <UButton
            color="neutral"
            variant="ghost"
            @click="isOpen = false"
          >
            {{ t('share.done') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import sharingApi, { failureText } from '~/services/sharingApi'

const props = withDefaults(defineProps<{
  /** Which plan, and which table it lives in. */
  planId: string
  kind?: 'meal_plan' | 'saved_meal_plan'
  title?: string
  size?: 'xs' | 'sm' | 'md'
  variant?: 'solid' | 'soft' | 'ghost' | 'outline' | 'subtle'
}>(), {
  kind: 'meal_plan',
  title: '',
  size: 'sm',
  variant: 'ghost'
})

const { t } = useI18n()
const toast = useToast()

const isOpen = ref(false)
const creating = ref(false)
const sending = ref(false)
const revoking = ref(false)
const copied = ref(false)
const error = ref('')
const token = ref('')
const recipient = ref('')

const url = computed(() => (token.value ? sharingApi.shareUrl(token.value) : ''))

async function open() {
  isOpen.value = true
  if (token.value || creating.value) return

  creating.value = true
  error.value = ''
  try {
    const made = await sharingApi.createShare({
      kind: props.kind,
      id: props.planId,
      title: props.title
    })
    token.value = made.token
  } catch (caught) {
    error.value = failureText(caught, t('share.failed'))
  } finally {
    creating.value = false
  }
}

async function copy() {
  try {
    await navigator.clipboard.writeText(url.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // Clipboard access is refused in some browsers and every insecure
    // context. The field is readonly and selects on focus, so the link is
    // still copyable by hand — say nothing rather than raise an alarm.
  }
}

async function send() {
  sending.value = true
  try {
    const result = await sharingApi.emailShare(token.value, recipient.value.trim() || undefined)
    toast.add({
      title: result.sent ? t('share.sentTitle') : t('share.sendFailed'),
      description: result.sent ? t('share.sentBody', { email: result.to }) : undefined,
      color: result.sent ? 'success' : 'warning',
      icon: result.sent ? 'i-lucide-mail-check' : 'i-lucide-alert-circle'
    })
    if (result.sent) recipient.value = ''
  } catch (caught) {
    toast.add({
      title: failureText(caught, t('share.sendFailed')),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    sending.value = false
  }
}

async function revoke() {
  revoking.value = true
  const ok = await sharingApi.revokeShare(token.value)
  revoking.value = false
  if (!ok) {
    toast.add({ title: t('share.revokeFailed'), color: 'error', icon: 'i-lucide-alert-circle' })
    return
  }
  token.value = ''
  isOpen.value = false
  toast.add({ title: t('share.revoked'), color: 'success', icon: 'i-lucide-check' })
}
</script>
