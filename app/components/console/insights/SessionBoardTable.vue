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

    <div
      v-else
      class="overflow-x-auto"
    >
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-zinc-900/50 dark:text-gray-400">
          <tr>
            <th class="px-5 py-2">
              Session
            </th>
            <th
              v-if="showPerson"
              class="px-5 py-2"
            >
              Person
            </th>
            <th class="whitespace-nowrap px-5 py-2">
              Did
            </th>
            <th class="px-5 py-2">
              Ran on
            </th>
            <th class="px-5 py-2">
              Screen
            </th>
            <th class="px-5 py-2">
              Where
            </th>
            <th class="px-5 py-2">
              Started
            </th>
            <th class="px-5 py-2 text-right">
              Lasted
            </th>
            <th class="px-5 py-2 text-right">
              Actions
            </th>
            <th class="px-5 py-2 text-right">
              Trouble
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.session_id"
            class="cursor-pointer border-t border-gray-100 hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-white/5"
            @click="open(row.session_id)"
          >
            <td class="px-5 py-2">
              <NuxtLink
                :to="`/console/insights/sessions/${encodeURIComponent(row.session_id)}`"
                class="font-mono text-xs break-all text-brand-600 hover:underline dark:text-brand-300"
                @click.stop
              >
                {{ row.session_id }}
              </NuxtLink>
              <UBadge
                v-if="row.is_bot"
                color="neutral"
                variant="subtle"
                size="sm"
                class="ml-2 align-middle"
              >
                crawler
              </UBadge>
            </td>
            <td
              v-if="showPerson"
              class="max-w-[12rem] truncate px-5 py-2"
            >
              <NuxtLink
                v-if="row.user_id"
                :to="`/console/insights/users/${encodeURIComponent(row.user_id)}`"
                class="text-brand-600 hover:underline dark:text-brand-300"
                @click.stop
              >
                {{ row.user_id }}
              </NuxtLink>
              <!-- Most sessions have no user because consent is opt-in. That is
                   the expected state, so it is worded as a fact, not a gap. -->
              <span
                v-else
                class="text-gray-400 dark:text-gray-500"
              >not attributed</span>
            </td>
            <!-- What the visit was for, before anybody opens it. Only what
                 happened is shown; a row of zeros reads as a row of facts.
                 Early in the row, because the table scrolls sideways on a
                 laptop and this is the column the board is opened for. -->
            <td class="px-5 py-2">
              <div
                v-if="did(row).length"
                class="flex gap-x-2.5 whitespace-nowrap text-xs tabular-nums text-gray-600 dark:text-gray-300"
              >
                <span
                  v-for="item in did(row)"
                  :key="item.icon"
                  class="inline-flex items-center gap-1 whitespace-nowrap"
                  :title="item.title"
                >
                  <UIcon
                    :name="item.icon"
                    class="h-3.5 w-3.5 shrink-0"
                    :class="item.tone"
                  />
                  {{ item.text }}
                </span>
              </div>
              <span
                v-else
                class="text-gray-300 dark:text-zinc-600"
              >—</span>
            </td>
            <td class="px-5 py-2">
              <ConsoleInsightsDeviceGlyphs
                :os="row.os"
                :os-version="row.os_version"
                :browser="row.browser"
                :browser-version="row.browser_version"
                :device-type="row.device_type"
              />
            </td>
            <td class="whitespace-nowrap px-5 py-2 font-mono text-xs text-gray-500 dark:text-gray-400">
              <span :title="row.screen ? `screen ${row.screen}` : 'screen size not reported'">
                {{ row.viewport || row.screen || '—' }}
              </span>
              <span class="ml-1 text-gray-400 dark:text-gray-500">{{ viewportClass(row.viewport_w) }}</span>
            </td>
            <td class="whitespace-nowrap px-5 py-2">
              <span
                v-if="row.country"
                :title="row.timezone || ''"
              >
                <span aria-hidden="true">{{ countryFlag(row.country) }}</span>
                <span class="ml-1 text-gray-600 dark:text-gray-300">{{ row.country }}</span>
              </span>
              <span
                v-else
                class="text-gray-400 dark:text-gray-500"
              >—</span>
            </td>
            <td class="whitespace-nowrap px-5 py-2 text-gray-500 dark:text-gray-400">
              {{ formatWhen(row.started_at) }}
            </td>
            <td class="whitespace-nowrap px-5 py-2 text-right tabular-nums text-gray-500 dark:text-gray-400">
              {{ formatDuration(lasted(row)) }}
            </td>
            <td class="px-5 py-2 text-right tabular-nums">
              {{ row.events.toLocaleString() }}
            </td>
            <td class="whitespace-nowrap px-5 py-2 text-right">
              <UBadge
                v-if="row.errors"
                color="error"
                variant="subtle"
                size="sm"
              >
                {{ row.errors }} error{{ row.errors === 1 ? '' : 's' }}
              </UBadge>
              <UBadge
                v-else-if="row.failed_requests"
                color="warning"
                variant="subtle"
                size="sm"
              >
                {{ row.failed_requests }} failed
              </UBadge>
              <span
                v-else
                class="text-gray-300 dark:text-zinc-600"
              >—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <slot name="footer" />
  </UCard>
</template>

<script setup lang="ts">
import type { ClientSessionRow } from '~/services/insightsApi'
import { countryFlag, formatDuration, viewportClass } from '~/utils/deviceIcons'

/**
 * The session board's table, shared by the board and by one person's page.
 *
 * Both views ask the same question of the same rows — "which of these is worth
 * opening" — and the answer is read from the icons, not the text. Keeping one
 * table means a column added for the board cannot go missing on the person
 * page, which is exactly how the two would have drifted.
 *
 * The whole row is the target because that is what people click at; the
 * session id stays a real link inside it so the keyboard and the middle mouse
 * button still work.
 */
/**
 * The handful of things a visit did, as icon-and-count pairs. Plans read as
 * "made/saved" because that pair is the one that says whether planning
 * worked; the rest are single counts.
 */
function did(row: ClientSessionRow) {
  const d = row.did
  if (!d) return []
  const out: Array<{ icon: string, text: string, title: string, tone: string }> = []
  if (d.chat_turns) {
    out.push({
      icon: 'i-lucide-messages-square',
      text: String(d.chat_turns),
      title: `${d.chat_turns} FoodChat turn${d.chat_turns === 1 ? '' : 's'}`,
      tone: 'text-gray-400 dark:text-gray-500'
    })
  }
  if (d.meal_plans_generated || d.meal_plans_saved) {
    out.push({
      icon: 'i-lucide-utensils',
      text: `${d.meal_plans_generated}/${d.meal_plans_saved}`,
      title: `${d.meal_plans_generated} meal plan${d.meal_plans_generated === 1 ? '' : 's'} made, ${d.meal_plans_saved} saved`,
      tone: d.meal_plans_saved ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'
    })
  }
  if (d.questions_asked) {
    out.push({
      icon: 'i-lucide-message-circle-question',
      text: String(d.questions_asked),
      title: `${d.questions_asked} FoodScholar question${d.questions_asked === 1 ? '' : 's'}`,
      tone: 'text-gray-400 dark:text-gray-500'
    })
  }
  if (d.searches) {
    out.push({
      icon: 'i-lucide-search',
      text: String(d.searches),
      title: `${d.searches} search${d.searches === 1 ? '' : 'es'}`,
      tone: 'text-gray-400 dark:text-gray-500'
    })
  }
  if (d.recipes_viewed) {
    out.push({
      icon: 'i-lucide-chef-hat',
      text: String(d.recipes_viewed),
      title: `${d.recipes_viewed} recipe${d.recipes_viewed === 1 ? '' : 's'} viewed`,
      tone: 'text-gray-400 dark:text-gray-500'
    })
  }
  return out
}

withDefaults(defineProps<{
  rows: ClientSessionRow[]
  title: string
  subtitle?: string
  empty?: string
  emptyHint?: string
  /** Off on a person's own page, where every row is the same person. */
  showPerson?: boolean
}>(), {
  subtitle: '',
  empty: 'No sessions in this period.',
  emptyHint: '',
  showPerson: true
})

const open = (sessionId: string) => navigateTo(`/console/insights/sessions/${encodeURIComponent(sessionId)}`)

const formatWhen = (value: string | null) => {
  if (!value) return '—'
  const when = new Date(value)
  return Number.isNaN(when.getTime()) ? '—' : when.toLocaleString()
}

/*
 * The API measures a session from its first to its last recorded action, which
 * is the honest span. Fall back to the session row's own timestamps when it
 * did not send one, rather than showing a dash for a session that plainly
 * lasted a while.
 */
const lasted = (row: ClientSessionRow): number | null => {
  if (row.duration_seconds !== null && row.duration_seconds !== undefined) return row.duration_seconds
  if (!row.started_at || !row.last_seen_at) return null
  const ms = new Date(row.last_seen_at).getTime() - new Date(row.started_at).getTime()
  return Number.isFinite(ms) && ms >= 0 ? Math.round(ms / 1000) : null
}
</script>
