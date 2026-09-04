<template>
  <UCard
    :ui="{ body: 'p-0' }"
    class="overflow-hidden border border-gray-200/70 dark:border-white/10"
  >
    <div class="flex items-center justify-between gap-3 border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
      <div class="min-w-0">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          Occurrences
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Most recent first. Expand one for the trail of what happened before it.
        </p>
      </div>
      <span class="shrink-0 text-xs text-gray-400 dark:text-gray-500">
        {{ occurrences.length }} shown
      </span>
    </div>

    <ConsoleInsightsEmptyState
      v-if="!occurrences.length"
      title="No individual occurrences left."
      hint="The group's counts survive longer than the rows behind them; these age out first."
      icon="i-lucide-history"
    />

    <ul
      v-else
      class="divide-y divide-gray-100 dark:divide-zinc-800"
    >
      <li
        v-for="row in occurrences"
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
            <span class="font-mono tabular-nums">{{ formatWhen(row.occurred_at) }}</span>
          </button>

          <UBadge
            v-if="!row.handled"
            color="error"
            variant="subtle"
            size="sm"
          >
            unhandled
          </UBadge>

          <span class="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <UIcon
              :name="browserGlyph(row.browser).icon"
              :class="browserGlyph(row.browser).tone"
              class="h-3.5 w-3.5"
            />
            {{ browserGlyph(row.browser).label }}
            <UIcon
              :name="osGlyph(row.os).icon"
              :class="osGlyph(row.os).tone"
              class="ml-1.5 h-3.5 w-3.5"
            />
            {{ osGlyph(row.os).label }}
            <UIcon
              :name="deviceGlyph(row.device_type).icon"
              :class="deviceGlyph(row.device_type).tone"
              class="ml-1.5 h-3.5 w-3.5"
            />
          </span>

          <span class="min-w-0 flex-1 break-all font-mono text-xs text-gray-500 dark:text-gray-400">
            {{ row.url_path || '—' }}<template v-if="row.line_no">:{{ row.line_no }}<template v-if="row.col_no">:{{ row.col_no }}</template></template>
          </span>

          <span
            v-if="row.release"
            class="shrink-0 font-mono text-xs text-gray-400 dark:text-gray-500"
          >{{ row.release }}</span>

          <UButton
            v-if="row.client_session_id"
            :to="`/console/insights/sessions/${row.client_session_id}`"
            color="neutral"
            variant="outline"
            size="xs"
            icon="i-lucide-monitor-smartphone"
            class="shrink-0"
          >
            Session
          </UButton>
        </div>

        <div
          v-if="isOpen(row.id)"
          class="mt-3 space-y-3 rounded-lg bg-gray-50 p-3 dark:bg-zinc-900/60"
        >
          <div>
            <p class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
              Breadcrumbs
            </p>
            <p
              v-if="!row.breadcrumbs?.length"
              class="mt-1 text-xs italic text-gray-400 dark:text-gray-500"
            >
              None recorded before this failure.
            </p>
            <ol
              v-else
              class="mt-1.5 space-y-1"
            >
              <li
                v-for="(crumb, index) in row.breadcrumbs"
                :key="index"
                class="flex items-baseline gap-2 text-xs"
              >
                <span class="w-20 shrink-0 font-mono tabular-nums text-gray-400 dark:text-gray-500">
                  {{ formatTime(crumb.t) }}
                </span>
                <span class="w-28 shrink-0 font-medium text-gray-700 dark:text-gray-200">
                  {{ String(crumb.type ?? 'event') }}
                </span>
                <span class="min-w-0 break-all font-mono text-gray-500 dark:text-gray-400">
                  {{ describe(crumb.data) }}
                </span>
              </li>
            </ol>
          </div>

          <div v-if="contextPairs(row.context).length">
            <p class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
              Context
            </p>
            <dl class="mt-1.5 grid gap-x-4 gap-y-1 sm:grid-cols-2">
              <div
                v-for="pair in contextPairs(row.context)"
                :key="pair.key"
                class="flex min-w-0 items-baseline gap-2 text-xs"
              >
                <dt class="shrink-0 text-gray-400 dark:text-gray-500">
                  {{ pair.key }}
                </dt>
                <dd class="min-w-0 break-all font-mono text-gray-600 dark:text-gray-300">
                  {{ pair.value }}
                </dd>
              </div>
            </dl>
          </div>

          <p
            v-if="row.request_id"
            class="text-xs text-gray-400 dark:text-gray-500"
          >
            Request <span class="font-mono">{{ row.request_id }}</span>
          </p>
        </div>
      </li>
    </ul>
  </UCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ClientErrorRow } from '~/services/insightsApi'
import { browserGlyph, deviceGlyph, osGlyph } from '~/utils/deviceIcons'

/**
 * The individual failures behind one group.
 *
 * Breadcrumbs are collapsed by default because they are the long part and
 * usually only one occurrence needs reading: the question is what the person
 * did in the seconds before it broke, and that is asked of one occurrence at a
 * time, not of twenty-five at once.
 */
defineProps<{ occurrences: ClientErrorRow[] }>()

const open = ref<Set<number>>(new Set())

const isOpen = (id: number) => open.value.has(id)

function toggle(id: number) {
  if (open.value.has(id)) open.value.delete(id)
  else open.value.add(id)
}

const formatWhen = (value: string | null) => {
  if (!value) return '—'
  const when = new Date(value)
  return Number.isNaN(when.getTime()) ? '—' : when.toLocaleString()
}

const formatTime = (value: unknown) => {
  if (!value) return ''
  const when = new Date(String(value))
  return Number.isNaN(when.getTime()) ? '' : when.toLocaleTimeString()
}

/** A breadcrumb's payload as one line, whatever shape it arrived in. */
function describe(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  return Object.entries(data as Record<string, unknown>)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(' · ')
}

function contextPairs(context: Record<string, unknown> | null | undefined) {
  if (!context) return []
  return Object.entries(context)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value)
    }))
}
</script>
