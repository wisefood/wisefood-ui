<template>
  <!--
    A short explanation hung off a chip or an icon.

    These were tooltips, and a Reka tooltip never opens on a tap, so on a
    phone the text they carried did not exist: what a constraint meant, why a
    dish was picked, which family a taste belongs to. On a device that can
    hover this still opens on hover, as the tooltip did; on a finger it opens
    on a tap and closes on the next one.

    Keyed on the mode because the popover decides which Reka primitive it
    forwards its props to once, at setup, and the hover query can resolve a
    tick after the first paint.
  -->
  <UPopover
    :key="mode"
    :mode="mode"
    :open-delay="120"
    :close-delay="80"
    :content="{ side: 'top', sideOffset: 6, collisionPadding: 12 }"
    :ui="{ content: 'max-w-64 px-3 py-2 text-xs leading-snug text-gray-700 dark:text-zinc-200' }"
  >
    <slot />
    <template #content>
      <slot name="text">{{ text }}</slot>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineProps<{ text?: string }>()

const { hasHover } = useViewport()
const mode = computed<'hover' | 'click'>(() => hasHover.value ? 'hover' : 'click')
</script>
