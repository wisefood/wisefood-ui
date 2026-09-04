<template>
  <div>
    <div
      v-if="lines.length"
      class="overflow-x-auto rounded-lg border border-gray-200/70 bg-gray-50 dark:border-white/10 dark:bg-zinc-900/70"
    >
      <pre class="w-max min-w-full px-4 py-3 text-xs leading-relaxed"><code><span
        v-for="(line, index) in lines"
        :key="index"
        class="block whitespace-pre"
        :class="isVendor(line)
          ? 'text-gray-400 dark:text-zinc-500'
          : 'text-gray-800 dark:text-gray-200'"
      >{{ line }}</span></code></pre>
    </div>
    <ConsoleInsightsEmptyState
      v-else
      title="No stack was captured."
      hint="Cross-origin scripts and some browsers report a message without a stack."
      icon="i-lucide-file-question"
    />
    <p
      v-if="lines.length && vendorCount"
      class="mt-2 text-xs text-gray-400 dark:text-gray-500"
    >
      {{ vendorCount }} dependency {{ vendorCount === 1 ? 'frame is' : 'frames are' }} dimmed —
      the fault is almost always in a frame that is not.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * A stack trace as it was recorded.
 *
 * It scrolls sideways rather than wrapping: a wrapped frame reads as two
 * frames, and the line and column at the end of each are what the reader is
 * looking for. Traces reach here already redacted by the capture side, so
 * nothing is hidden again at this end.
 */
const props = defineProps<{ stack: string | null | undefined }>()

const lines = computed(() =>
  (props.stack ?? '').split('\n').map(line => line.trimEnd()).filter(Boolean)
)

// Bundled dependencies and the framework runtime are almost never the fault,
// but dropping them would break the call order, so they are only dimmed.
const isVendor = (line: string) =>
  /node_modules|\/_nuxt\/|chunk-[A-Za-z0-9]{4,}|webpack-internal/.test(line)

const vendorCount = computed(() => lines.value.filter(isVendor).length)
</script>
