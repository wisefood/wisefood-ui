<template>
  <UCard
    :ui="{ body: 'p-0' }"
    class="flex flex-col overflow-hidden border border-gray-200/70 dark:border-white/10"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
      <div class="min-w-0">
        <h3 class="truncate text-base font-semibold text-gray-900 dark:text-white">
          {{ title }}
        </h3>
        <p
          v-if="subtitle"
          class="truncate text-xs text-gray-500 dark:text-gray-400"
        >
          {{ subtitle }}
        </p>
      </div>
      <slot name="actions" />
    </div>

    <ConsoleInsightsEmptyState
      v-if="!rows.length"
      :title="empty"
      :hint="emptyHint"
      icon="i-lucide-monitor-smartphone"
    />

    <!-- A row per visit that reads as a sentence: when, who, what it came to,
         and whether it went well. The table this replaced had ten columns and
         scrolled sideways, and the one that mattered — what the visit was for
         — was a row of icons with numbers. -->
    <ul
      v-else
      class="divide-y divide-gray-100 dark:divide-zinc-800"
    >
      <li
        v-for="row in rows"
        :key="row.session_id"
      >
        <NuxtLink
          :to="`/console/insights/sessions/${encodeURIComponent(row.session_id)}`"
          class="grid gap-x-4 gap-y-1.5 px-5 py-3 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none sm:grid-cols-[7rem_minmax(0,1fr)_auto] dark:hover:bg-white/5 dark:focus-visible:bg-white/5"
          @click="rememberTrail"
        >
          <div class="flex gap-2 text-sm sm:block">
            <p class="text-gray-900 dark:text-white">
              {{ formatWhen(row.started_at) }}
            </p>
            <p class="text-gray-500 sm:text-xs dark:text-gray-400">
              {{ formatDuration(lasted(row)) }}
            </p>
          </div>

          <div class="min-w-0 space-y-0.5">
            <p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span
                v-if="showPerson"
                class="font-medium text-gray-900 dark:text-white"
              >{{ row.user_id ? 'Signed in' : 'Anonymous' }}</span>
              <span
                v-if="showPerson && row.user_id"
                class="font-mono text-xs text-gray-400 dark:text-gray-500"
              >{{ personLabel(row.user_id) }}</span>
              <span
                v-for="product in productsOf(row)"
                :key="product.name"
                class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
              >
                <UIcon
                  :name="product.icon"
                  class="h-3.5 w-3.5"
                />{{ product.name }}
              </span>
              <UBadge
                v-if="row.is_bot"
                color="neutral"
                variant="subtle"
                size="sm"
              >
                crawler
              </UBadge>
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-300">
              {{ visitSentence(row.did) || 'Looked around' }}
            </p>
            <!-- What somebody said when they were unhappy is the reason to
                 open the session, so it is on the row. -->
            <p
              v-for="(reason, index) in row.did?.down_reasons ?? []"
              :key="index"
              class="truncate text-sm italic text-red-700 dark:text-red-400"
            >
              “{{ reason }}”
            </p>
          </div>

          <div class="flex flex-wrap items-start gap-1.5 sm:max-w-[16rem] sm:justify-end">
            <UBadge
              v-for="flag in flagsOf(row)"
              :key="flag.key"
              :color="flag.tone === 'bad' ? 'error' : flag.tone === 'warn' ? 'warning' : 'success'"
              variant="subtle"
              size="sm"
              :icon="flag.icon"
            >
              {{ flag.label }}
            </UBadge>
            <span class="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <ConsoleInsightsDeviceGlyphs
                :os="row.os"
                :os-version="row.os_version"
                :browser="row.browser"
                :browser-version="row.browser_version"
                :device-type="row.device_type"
              />
              <span
                v-if="row.country"
                :title="row.country"
              >{{ countryFlag(row.country) }}</span>
            </span>
          </div>
        </NuxtLink>
      </li>
    </ul>

    <slot name="footer" />
  </UCard>
</template>

<script setup lang="ts">
import { useSessionTrail } from '~/composables/useSessionTrail'
import type { ClientSessionRow } from '~/services/insightsApi'
import { countryFlag, formatDuration } from '~/utils/deviceIcons'
import { personLabel } from '~/utils/labels'
import { PRODUCTS, troubleFlags, visitSentence, type Flag } from '~/utils/sessionStory'

const props = withDefaults(defineProps<{
  rows: ClientSessionRow[]
  title: string
  subtitle?: string
  empty?: string
  emptyHint?: string
  showPerson?: boolean
  /** The list's own filters, so the session page can lead back to them. */
  trailQuery?: Record<string, string>
}>(), {
  subtitle: '',
  empty: 'No sessions in this period.',
  emptyHint: '',
  showPerson: true,
  trailQuery: () => ({})
})

const { remember } = useSessionTrail()

// Remembered on the way in, so the session page can step through this list.
function rememberTrail() {
  remember(props.rows.map(row => row.session_id), props.trailQuery)
}

const APP_PRODUCT: Record<string, string> = {
  foodchat: 'foodchat',
  foodscholar: 'foodscholar',
  catalog: 'foodscholar',
  recipewrangler: 'recipes'
}

function productsOf(row: ClientSessionRow) {
  const keys = new Set((row.did?.apps ?? []).map(app => APP_PRODUCT[app]).filter((p): p is string => Boolean(p)))
  return [...keys].map(key => PRODUCTS[key]).filter((p): p is { name: string, icon: string } => Boolean(p))
}

function flagsOf(row: ClientSessionRow): Flag[] {
  const d = row.did
  const flags = troubleFlags({
    rated_down: d?.rated_down ?? 0,
    failed_turns: d?.failed_turns ?? 0,
    frustration: d?.frustrated_clicks ?? 0
  })
  // Errors are the browser's and the gateway's together, as the board counts them.
  const errors = row.errors || row.failed_requests || 0
  if (errors) {
    flags.splice(d?.rated_down ? 1 : 0, 0, {
      key: 'errors', label: `${errors} error${errors === 1 ? '' : 's'}`, icon: 'i-lucide-circle-alert', tone: 'bad'
    })
  }
  if (d?.meal_plans_saved) flags.push({ key: 'saved', label: 'plan saved', icon: 'i-lucide-bookmark-check', tone: 'good' })
  return flags
}

/** "Today 10:02", "Mon 13 Nov 18:40": how a list of visits is scanned. */
function formatWhen(value: string | null) {
  if (!value) return '—'
  const when = new Date(value)
  if (Number.isNaN(when.getTime())) return '—'
  const time = when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (when.toDateString() === today.toDateString()) return `Today ${time}`
  if (when.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`
  return `${when.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} ${time}`
}

const lasted = (row: ClientSessionRow): number | null => {
  if (row.duration_seconds !== null && row.duration_seconds !== undefined) return row.duration_seconds
  if (!row.started_at || !row.last_seen_at) return null
  const ms = new Date(row.last_seen_at).getTime() - new Date(row.started_at).getTime()
  return Number.isFinite(ms) && ms >= 0 ? Math.round(ms / 1000) : null
}
</script>
