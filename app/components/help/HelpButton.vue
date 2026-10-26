<script setup lang="ts">
import { computed } from 'vue'
import { useHelp } from '~/composables/useHelp'

/**
 * The desktop way into the help panel. It only appears on a page with help
 * written for it, and wears a dot until that page's help has been opened
 * once — the cue that there is something here worth a look.
 */
const help = useHelp()
const label = computed(() => help.content.value.ui.button)
</script>

<template>
  <UButton
    v-if="help.pageTopic.value"
    data-flows="help-button"
    color="neutral"
    variant="ghost"
    icon="i-lucide-circle-help"
    class="relative"
    :aria-label="label"
    :aria-expanded="help.open.value"
    aria-controls="wf-help-panel"
    @click="help.toggleHelp('header')"
  >
    <span class="hidden xl:inline">{{ label }}</span>
    <span
      v-if="help.unseen.value && !help.open.value"
      class="pointer-events-none absolute right-1 top-1 size-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-gray-900"
      aria-hidden="true"
    />
  </UButton>
</template>
