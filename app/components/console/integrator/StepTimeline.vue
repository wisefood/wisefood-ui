<!--
  What the assistant did, in order.

  Collapsed to a one-line summary by default and opened on demand, because
  most turns are read for their answer and only some are read for their
  method. Each step shows what was attempted and what came of it — a curator
  who can see the query can notice it searched for the wrong thing, which is
  the difference between an assistant they can check and one they must trust.
-->
<template>
  <UCollapsible
    v-if="steps.length"
    v-model:open="open"
    class="rounded-xl border border-gray-200/70 bg-white dark:border-white/10 dark:bg-zinc-900/40"
  >
    <button
      type="button"
      class="flex w-full items-center gap-2 px-3 py-2 text-left"
    >
      <UIcon
        :name="running ? 'i-lucide-loader-2' : 'i-lucide-list-checks'"
        class="h-4 w-4 shrink-0 text-gray-400"
        :class="running ? 'animate-spin' : ''"
      />
      <span class="min-w-0 flex-1 truncate text-xs text-gray-600 dark:text-gray-300">
        {{ summary }}
      </span>
      <UIcon
        :name="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        class="h-4 w-4 shrink-0 text-gray-400"
      />
    </button>

    <template #content>
      <ol class="space-y-0 px-3 pb-3">
        <li
          v-for="step in steps"
          :key="step.id"
          class="flex gap-3 py-2"
        >
          <!-- A rail, so the timeline reads as a sequence rather than a list. -->
          <div class="flex flex-col items-center">
            <span
              class="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              :class="tone(step)"
            >
              <UIcon
                :name="icon(step)"
                class="h-3 w-3"
                :class="step.status === 'running' ? 'animate-spin' : ''"
              />
            </span>
            <span class="mt-1 w-px flex-1 bg-gray-150 dark:bg-white/10" />
          </div>

          <div class="min-w-0 flex-1 pb-1">
            <div class="flex flex-wrap items-baseline gap-x-2">
              <span class="text-xs font-medium text-gray-900 dark:text-white">
                {{ step.title }}
              </span>
              <span
                v-if="step.elapsed_ms != null && step.elapsed_ms > 0"
                class="text-[10px] tabular-nums text-gray-400"
              >{{ elapsed(step.elapsed_ms) }}</span>
            </div>
            <!-- What was attempted. Kept even when the step failed: the query
                 is the part that makes a failure checkable. -->
            <p
              v-if="step.detail"
              class="truncate font-mono text-[11px] text-gray-500 dark:text-gray-400"
              :title="step.detail"
            >
              {{ step.detail }}
            </p>
            <p
              v-if="step.outcome"
              class="text-[11px] leading-relaxed"
              :class="step.ok === false
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-300'"
            >
              {{ step.outcome }}
            </p>
          </div>
        </li>
      </ol>
    </template>
  </UCollapsible>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IntegratorStep } from '~/services/integratorApi'

const props = withDefaults(defineProps<{
  steps: IntegratorStep[]
  /** Open while the turn is still running, so progress is visible live. */
  running?: boolean
}>(), { running: false })

const open = ref(props.running)

const KIND_ICONS: Record<string, string> = {
  plan: 'i-lucide-brain',
  search: 'i-lucide-globe',
  read: 'i-lucide-file-text',
  licence: 'i-lucide-scale',
  catalog: 'i-lucide-library',
  write: 'i-lucide-pen-line',
  stop: 'i-lucide-hand',
  tool: 'i-lucide-wrench'
}

function icon(step: IntegratorStep): string {
  if (step.status === 'running') return 'i-lucide-loader-2'
  if (step.ok === false) return 'i-lucide-alert-circle'
  return KIND_ICONS[step.kind] || KIND_ICONS.tool!
}

function tone(step: IntegratorStep): string {
  if (step.ok === false) return 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300'
  if (step.status === 'running') return 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300'
  return 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'
}

const elapsed = (ms: number) => (ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`)

/** "Searched the web, read 2 pages and checked a licence" — the turn in a line. */
const summary = computed(() => {
  if (props.running) return 'Working…'
  const counts = new Map<string, number>()
  for (const step of props.steps) {
    if (step.kind === 'plan') continue
    counts.set(step.kind, (counts.get(step.kind) ?? 0) + 1)
  }
  const PHRASES: Record<string, [string, string]> = {
    search: ['searched the web', 'web searches'],
    read: ['read a page', 'pages read'],
    licence: ['checked a licence', 'licences checked'],
    catalog: ['checked the catalog', 'catalog checks'],
    write: ['wrote to the catalog', 'catalog writes'],
    stop: ['stopped early', 'stopped early']
  }
  const parts: string[] = []
  for (const [kind, n] of counts) {
    const phrase = PHRASES[kind]
    if (!phrase) continue
    parts.push(n === 1 ? phrase[0] : `${n} ${phrase[1]}`)
  }
  if (!parts.length) return 'Answered directly'
  const joined = parts.length === 1
    ? parts[0]!
    : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
  return joined.charAt(0).toUpperCase() + joined.slice(1)
})
</script>
