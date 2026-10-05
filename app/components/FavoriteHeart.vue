<!--
  The heart on every favourite toggle. Drawn inline rather than through UIcon
  because icons render as CSS masks here, and a mask cannot be filled: the old
  `fill-red-500` class did nothing, so a liked recipe only showed a red
  outline. Active fills the glyph with the current colour, and the first
  activation after a click pops with a small ring (see `.like-burst`).

  Size and colour go on the wrapper: `class="w-5 h-5 text-red-500"`.
-->
<template>
  <span
    ref="host"
    class="like-burst"
    :class="{ 'is-bursting': bursting }"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      class="h-full w-full"
      :fill="active ? 'currentColor' : 'none'"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  </span>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBurstOnActivate } from '~/composables/useBurstOnActivate'

const props = defineProps<{
  /** Whether the item is currently a favourite. */
  active: boolean
}>()

const host = ref<HTMLElement | null>(null)
const { bursting } = useBurstOnActivate(host, () => props.active)
</script>
