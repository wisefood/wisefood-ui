<template>
  <span class="inline-flex items-center gap-2">
    <span
      class="inline-flex items-center gap-1"
      :title="`${os.label}${osVersion ? ' ' + osVersion : ''}`"
    >
      <UIcon
        :name="os.icon"
        class="shrink-0"
        :class="[os.tone, sizeClass]"
        :aria-label="os.label"
      />
      <span
        v-if="labels"
        class="text-sm text-gray-700 dark:text-gray-200"
      >{{ os.label }}<span
        v-if="osVersion"
        class="text-gray-400 dark:text-gray-500"
      > {{ osVersion }}</span></span>
    </span>

    <span
      class="inline-flex items-center gap-1"
      :title="`${browser.label}${browserVersion ? ' ' + browserVersion : ''}`"
    >
      <UIcon
        :name="browser.icon"
        class="shrink-0"
        :class="[browser.tone, sizeClass]"
        :aria-label="browser.label"
      />
      <span
        v-if="labels"
        class="text-sm text-gray-700 dark:text-gray-200"
      >{{ browser.label }}<span
        v-if="browserVersion"
        class="text-gray-400 dark:text-gray-500"
      > {{ browserVersion }}</span></span>
    </span>

    <span
      class="inline-flex items-center gap-1"
      :title="device.label"
    >
      <UIcon
        :name="device.icon"
        class="shrink-0"
        :class="[device.tone, sizeClass]"
        :aria-label="device.label"
      />
      <span
        v-if="labels"
        class="text-sm text-gray-700 dark:text-gray-200"
      >{{ device.label }}</span>
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { browserGlyph, deviceGlyph, osGlyph } from '~/utils/deviceIcons'

/**
 * One machine, as three icons.
 *
 * The board is read by scanning rather than reading, so the same cluster has
 * to be legible at row size and at header size — hence one component with a
 * size and a labels switch, rather than two that would drift apart the first
 * time an icon mapping changed.
 *
 * A stripped user agent resolves to the neutral "unknown" glyph rather than to
 * nothing: an empty cell reads as a bug, and "we could not tell" is a real and
 * frequent answer.
 */
const props = withDefaults(defineProps<{
  os?: string | null
  osVersion?: string | null
  browser?: string | null
  browserVersion?: string | null
  deviceType?: string | null
  /** Spell each glyph out in words. Off on the board, on in a page header. */
  labels?: boolean
  size?: 'sm' | 'md' | 'lg'
}>(), {
  os: null,
  osVersion: null,
  browser: null,
  browserVersion: null,
  deviceType: null,
  labels: false,
  size: 'sm'
})

const os = computed(() => osGlyph(props.os))
const browser = computed(() => browserGlyph(props.browser))
const device = computed(() => deviceGlyph(props.deviceType))

const sizeClass = computed(() => ({
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6'
}[props.size]))
</script>
