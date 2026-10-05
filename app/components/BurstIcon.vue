<!--
  An icon that pops with a small ring the first time `active` turns on after a
  click: the save/bookmark counterpart of FavoriteHeart. `name` is the resting
  icon, `activeName` the one shown while active (for example bookmark and
  bookmark-check). Size and colour go on the wrapper, as with FavoriteHeart.
-->
<template>
  <span
    ref="host"
    class="like-burst"
    :class="{ 'is-bursting': bursting }"
  >
    <UIcon
      :name="active && activeName ? activeName : name"
      class="h-full w-full"
    />
  </span>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBurstOnActivate } from '~/composables/useBurstOnActivate'

const props = defineProps<{
  name: string
  activeName?: string
  active: boolean
}>()

const host = ref<HTMLElement | null>(null)
const { bursting } = useBurstOnActivate(host, () => props.active)
</script>
