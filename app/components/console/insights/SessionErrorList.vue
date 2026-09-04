<template>
  <UCard
    :ui="{ body: 'p-0' }"
    class="overflow-hidden border border-gray-200/70 dark:border-white/10"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
      <div class="min-w-0">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          What broke in their browser
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Newest first. Open the group to see whether this is happening to everybody.
        </p>
      </div>
      <span
        v-if="errors.length"
        class="shrink-0 text-xs text-gray-400 dark:text-gray-500"
      >
        {{ errors.length }} recorded
      </span>
    </div>

    <ConsoleInsightsEmptyState
      v-if="!errors.length"
      title="Nothing failed in their browser."
      hint="Client errors are reported by the page itself. None here means none were raised — a server error would show in the timeline above instead."
      icon="i-lucide-shield-check"
    />

    <ul
      v-else
      class="divide-y divide-gray-100 dark:divide-zinc-800"
    >
      <li
        v-for="row in errors"
        :key="row.id"
        class="px-5 py-3"
      >
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
          <button
            class="inline-flex items-center gap-1.5 text-left text-xs font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            :aria-expanded="isOpen(row.id)"
            @click="toggle(row.id)"
          >
            <UIcon
              :name="isOpen(row.id) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
              class="h-3.5 w-3.5"
            />
            <span class="font-mono tabular-nums">{{ formatTime(row.occurred_at) }}</span>
          </button>
          <UBadge
            v-if="!row.handled"
            color="error"
            variant="subtle"
            size="sm"
          >
            unhandled
          </UBadge>
          <span class="min-w-0 flex-1 break-words text-sm text-gray-900 dark:text-white">
            <span class="font-medium">{{ row.name || row.kind }}</span>
            <span
              v-if="row.message"
              class="text-gray-500 dark:text-gray-400"
            > {{ row.message }}</span>
          </span>
          <UButton
            :to="`/console/insights/errors/${encodeURIComponent(row.fingerprint)}`"
            color="neutral"
            variant="outline"
            size="xs"
            icon="i-lucide-bug"
            class="shrink-0"
          >
            Group
          </UButton>
        </div>

        <p
          v-if="row.url_path"
          class="mt-1 break-all font-mono text-xs text-gray-400 dark:text-gray-500"
        >
          {{ where(row) }}
        </p>

        <div
          v-if="isOpen(row.id)"
          class="mt-3"
        >
          <ConsoleInsightsErrorStackTrace :stack="row.stack" />
        </div>
      </li>
    </ul>
  </UCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ClientErrorRow } from '~/services/insightsApi'

/**
 * The client-side failures recorded during one session.
 *
 * Each links on to its group, because the first question after "it broke for
 * this person" is always "does it break for everyone" — and that is the
 * difference between one support reply and a fix. The stack is collapsed: it
 * is the long part, and only one of these usually needs reading.
 */
defineProps<{ errors: ClientErrorRow[] }>()

const open = ref<Set<number>>(new Set())

const isOpen = (id: number) => open.value.has(id)

function toggle(id: number) {
  if (open.value.has(id)) open.value.delete(id)
  else open.value.add(id)
}

// Path, line and column read as one location, so they are assembled as one
// string rather than as three conditional fragments in the markup.
const where = (row: ClientErrorRow) => {
  const parts = [row.url_path ?? '']
  if (row.line_no) parts.push(String(row.line_no))
  if (row.line_no && row.col_no) parts.push(String(row.col_no))
  return parts.join(':')
}

const formatTime = (value: string | null) => {
  if (!value) return '—'
  const when = new Date(value)
  return Number.isNaN(when.getTime()) ? '—' : when.toLocaleTimeString()
}
</script>
