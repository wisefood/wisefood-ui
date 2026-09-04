<script setup lang="ts">
import { ref } from 'vue'
import { useAnalyticsSession } from '~/composables/useAnalyticsSession'

// The session id is shown so a person can quote it when something goes wrong:
// "my session was k3f9-2xa7-lm4q" is enough for an expert to find every search,
// question and meal plan from that sitting. They can see the id; only admins
// and experts can read the activity behind it.
//
// It is not an account identifier. It lives in sessionStorage, dies with the
// tab, resets after 30 minutes idle and resets when the signed-in user changes.
const { sessionId } = useAnalyticsSession()

const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

async function copySessionId() {
  if (!sessionId.value) return
  try {
    await navigator.clipboard.writeText(sessionId.value)
    copied.value = true
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Clipboard blocked (insecure context, or the user denied it). The id is
    // on screen and selectable, so there is nothing to recover from.
  }
}
</script>

<template>
<UFooter class="bg-neutral-300 dark:bg-zinc-800">
    <template #left>
    <p class="text-sm text-muted">
        © {{ new Date().getFullYear() }} The WiseFood Consortium, All rights reserved.
    </p>
    <span class="mx-2 text-sm text-muted">
        <NuxtLink to="https://cordis.europa.eu/project/id/101181895" target="_blank" rel="noopener noreferrer">
        <img src="/eu.png" alt="EU Logo" class="inline h-10 mr-1" />
        </NuxtLink>
    </span>
    </template>

    <template #right>
    <ClientOnly>
        <button
        v-if="sessionId"
        type="button"
        class="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted font-mono hover:bg-neutral-400/30 dark:hover:bg-zinc-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
        :title="$t('footer.sessionHint')"
        :aria-label="`${$t('footer.session')} ${sessionId}. ${$t('footer.copy')}`"
        @click="copySessionId"
        >
        <UIcon
            :name="copied ? 'i-lucide-check' : 'i-lucide-hash'"
            class="h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
        />
        <span class="sr-only">{{ $t('footer.session') }}</span>
        <span>{{ sessionId }}</span>
        <span v-if="copied" class="not-sr-only text-primary">{{ $t('footer.copied') }}</span>
        </button>
    </ClientOnly>
    <p class="text-sm text-muted">
        {{ $t('nav.legal') }} 
    </p>
    <UButton
        to="https://github.com/wisefood"
        target="_blank"
        icon="i-simple-icons-github"
        aria-label="GitHub"
        color="neutral"
        variant="ghost"
    />
    <UButton
        to="https://www.linkedin.com/company/wisefood-project"
        target="_blank"
        icon="i-simple-icons-linkedin"
        aria-label="LinkedIn"
        color="neutral"
        variant="ghost"
    />
    <UButton
        to="https://www.instagram.com/wisefood_project/"
        target="_blank"
        icon="i-simple-icons-instagram"
        aria-label="WiseFood Instagram"
        color="neutral"
        variant="ghost"
    />
    </template>
</UFooter>
</template>
