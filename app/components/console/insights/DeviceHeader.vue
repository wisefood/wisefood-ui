<template>
  <UCard
    :ui="{ body: 'p-0' }"
    class="overflow-hidden border border-gray-200/70 dark:border-white/10"
  >
    <ConsoleInsightsEmptyState
      v-if="!device"
      title="No device recorded for this session."
      hint="The browser sends its own description on the first page view. A session made up only of server-side activity, or one from before device capture was switched on, has none."
      icon="i-lucide-monitor-off"
    />

    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/70 px-5 py-4 dark:border-white/10">
        <ConsoleInsightsDeviceGlyphs
          :os="device.os"
          :os-version="device.os_version"
          :browser="device.browser"
          :browser-version="device.browser_version"
          :device-type="device.device_type"
          labels
          size="md"
        />
        <div class="flex flex-wrap items-center gap-2">
          <UBadge
            v-if="device.is_bot"
            color="neutral"
            variant="subtle"
          >
            crawler
          </UBadge>
          <UBadge
            v-if="device.app"
            color="neutral"
            variant="subtle"
          >
            {{ device.app }}
          </UBadge>
          <UBadge
            v-if="device.errors"
            color="error"
            variant="subtle"
          >
            {{ device.errors }} client error{{ device.errors === 1 ? '' : 's' }}
          </UBadge>
        </div>
      </div>

      <dl class="grid grid-cols-2 gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-3 lg:grid-cols-4">
        <div
          v-for="fact in facts"
          :key="fact.label"
          class="min-w-0"
        >
          <dt class="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {{ fact.label }}
          </dt>
          <dd
            class="mt-0.5 break-words text-sm"
            :class="fact.value ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'"
          >
            {{ fact.value || 'not reported' }}
          </dd>
          <p
            v-if="fact.hint"
            class="mt-0.5 text-xs text-gray-400 dark:text-gray-500"
          >
            {{ fact.hint }}
          </p>
        </div>
      </dl>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ClientSessionRow } from '~/services/insightsApi'
import { countryFlag, viewportClass } from '~/utils/deviceIcons'

/**
 * The machine a session ran on, spelled out.
 *
 * The board answers "which device" with icons because it is scanned. This is
 * the page somebody reaches after deciding one session matters, so here the
 * same facts are written out in full — a bug report needs the version string,
 * not the Apple logo.
 */
const props = defineProps<{ device: ClientSessionRow | null }>()

const facts = computed(() => {
  const d = props.device
  if (!d) return []
  const ratio = d.device_pixel_ratio ? ` @${d.device_pixel_ratio}×` : ''
  return [
    { label: 'Screen', value: d.screen ? `${d.screen}${ratio}` : '', hint: '' },
    {
      label: 'Window',
      value: d.viewport || '',
      hint: d.viewport_w ? `${viewportClass(d.viewport_w)} width` : ''
    },
    {
      label: 'Colour scheme',
      value: d.color_scheme || '',
      hint: d.reduced_motion ? 'asked for reduced motion' : ''
    },
    { label: 'Time zone', value: d.timezone || '', hint: '' },
    {
      label: 'Country',
      value: d.country ? `${countryFlag(d.country)} ${d.country}` : '',
      hint: ''
    },
    { label: 'Language', value: d.locale || '', hint: '' },
    { label: 'Connection', value: d.connection || '', hint: '' },
    { label: 'Release', value: d.release || '', hint: d.client || '' },
    {
      label: 'Network',
      value: d.ip_prefix || '',
      // Never an address: IPv4 is kept to /24 and IPv6 to /48, so this
      // identifies roughly where a session came from and not who it was.
      hint: 'the network, truncated — not an address'
    }
  ]
})
</script>
